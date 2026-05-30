import { describe, it, expect } from "vitest";
import { schedule } from "@/lib/scheduler";
import type { ActionPlan, Availability, Activity } from "@/lib/scheduler/types";

const baseActivity: Activity = {
  id: "a1",
  type: "fitness",
  name: "Run",
  priority: 1,
  frequency: { times: 3, per: "week" },
  durationMinutes: 30,
  details: "",
  facilitatorId: "trn-1",
  equipmentId: null,
  location: "home",
  remoteEligible: false,
  prepNotes: "",
  backupActivityIds: [],
  adjustmentIfSkipped: "note",
  metrics: [],
};

const plan: ActionPlan = {
  memberId: "m",
  memberName: "M",
  activities: [baseActivity],
};

const avail: Availability = {
  resources: [
    {
      id: "trn-1",
      type: "trainer",
      name: "T",
      windows: [
        { date: "2026-06-01", start: "06:00", end: "11:00" },
        { date: "2026-06-03", start: "06:00", end: "11:00" },
        { date: "2026-06-05", start: "06:00", end: "11:00" },
      ],
    },
  ],
  travel: [],
};

describe("schedule", () => {
  it("produces events with a consistent summary", () => {
    const out = schedule(plan, avail, {
      start: "2026-06-01",
      end: "2026-06-07",
    });
    expect(out.events.length).toBeGreaterThan(0);
    expect(
      out.summary.scheduled + out.summary.skipped + out.summary.substituted
    ).toBe(out.events.length);
  });

  it("skips activities during non-remote travel with adjustment recorded", () => {
    const travelAvail: Availability = {
      ...avail,
      travel: [
        {
          start: "2026-06-01",
          end: "2026-06-10",
          location: "Tokyo",
          remoteOk: false,
        },
      ],
    };
    const out = schedule(plan, travelAvail, {
      start: "2026-06-01",
      end: "2026-06-07",
    });
    expect(out.events.every((e) => e.status === "skipped")).toBe(true);
    expect(out.events[0].adjustmentApplied).toBe("note");
  });

  it("schedules remotely when trip allows remote AND activity is remote-eligible", () => {
    const remoteActivity: Activity = { ...baseActivity, remoteEligible: true };
    const remoteAvail: Availability = {
      ...avail,
      travel: [
        {
          start: "2026-06-01",
          end: "2026-06-10",
          location: "Berlin",
          remoteOk: true,
        },
      ],
    };
    const out = schedule(
      { memberId: "m", memberName: "M", activities: [remoteActivity] },
      remoteAvail,
      { start: "2026-06-01", end: "2026-06-07" }
    );
    expect(out.events.every((e) => e.status === "scheduled")).toBe(true);
    expect(out.events[0].notes).toContain("Berlin");
  });

  it("uses backup activity when primary cannot fit", () => {
    const backup: Activity = {
      ...baseActivity,
      id: "a2",
      name: "Walk",
      facilitatorId: null,
    };
    const planWithBackup: ActionPlan = {
      memberId: "m",
      memberName: "M",
      activities: [{ ...baseActivity, backupActivityIds: ["a2"] }, backup],
    };
    const noTrainer: Availability = { resources: [], travel: [] };
    const out = schedule(planWithBackup, noTrainer, {
      start: "2026-06-01",
      end: "2026-06-07",
    });
    const substituted = out.events.filter(
      (e) => e.status === "backup-substitute"
    );
    expect(substituted.length).toBeGreaterThan(0);
    expect(substituted[0].substituteForActivityId).toBe("a1");
  });

  it("higher priority gets contested slot first", () => {
    const lowPri: Activity = {
      ...baseActivity,
      id: "a2",
      priority: 5,
      frequency: { times: 1, per: "week" },
    };
    const highPri: Activity = {
      ...baseActivity,
      id: "a1",
      priority: 1,
      frequency: { times: 1, per: "week" },
    };
    const oneSlot: Availability = {
      resources: [
        {
          id: "trn-1",
          type: "trainer",
          name: "T",
          windows: [{ date: "2026-06-01", start: "06:00", end: "06:30" }],
        },
      ],
      travel: [],
    };
    const out = schedule(
      { memberId: "m", memberName: "M", activities: [lowPri, highPri] },
      oneSlot,
      { start: "2026-06-01", end: "2026-06-07" }
    );
    const scheduledHi = out.events.find(
      (e) => e.activityId === "a1" && e.status === "scheduled"
    );
    expect(scheduledHi).toBeDefined();
  });

  it("does not double-book the same resource window", () => {
    const a1: Activity = {
      ...baseActivity,
      id: "a1",
      frequency: { times: 1, per: "week" },
    };
    const a2: Activity = {
      ...baseActivity,
      id: "a2",
      frequency: { times: 1, per: "week" },
    };
    const out = schedule(
      { memberId: "m", memberName: "M", activities: [a1, a2] },
      avail,
      { start: "2026-06-01", end: "2026-06-07" }
    );
    const trainerSlots = out.events
      .filter((e) => e.facilitatorId === "trn-1" && e.status === "scheduled")
      .map((e) => `${e.date}T${e.start}`);
    expect(new Set(trainerSlots).size).toBe(trainerSlots.length);
  });
});
