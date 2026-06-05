import { describe, it, expect } from "vitest";
import { findSlot } from "@/lib/scheduler/slot-finder";
import type { Activity, Resource } from "@/lib/scheduler/types";

const act: Activity = {
  id: "a",
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
  adjustmentIfSkipped: "",
  metrics: [],
};

const trainerAvailable: Resource = {
  id: "trn-1",
  type: "trainer",
  name: "T",
  windows: [{ date: "2026-06-01", start: "06:00", end: "11:00" }],
};

describe("findSlot", () => {
  it("returns earliest fitting slot when facilitator is free", () => {
    const r = findSlot(act, "2026-06-01", [trainerAvailable], []);
    expect(r).toEqual({ start: "06:00", end: "06:30" });
  });

  it("returns null when facilitator has no window on that day", () => {
    const r = findSlot(act, "2026-06-02", [trainerAvailable], []);
    expect(r).toBeNull();
  });

  it("honors preferredTimeOfDay when set", () => {
    const evening: Activity = { ...act, preferredTimeOfDay: "evening" };
    const eveningWin: Resource = {
      ...trainerAvailable,
      windows: [
        { date: "2026-06-01", start: "06:00", end: "11:00" },
        { date: "2026-06-01", start: "18:00", end: "20:00" },
      ],
    };
    const r = findSlot(evening, "2026-06-01", [eveningWin], []);
    expect(r?.start).toBe("18:30");
  });

  it("anchors a banded morning activity near 07:30, not the window floor", () => {
    const selfCare: Activity = {
      ...act,
      facilitatorId: null,
      equipmentId: null,
      preferredTimeOfDay: "morning",
    };
    const r = findSlot(selfCare, "2026-06-01", [], []);
    expect(r).toEqual({ start: "07:30", end: "08:00" });
  });

  it("falls back to the slot nearest before the anchor when the band tail is consumed", () => {
    const selfCare: Activity = {
      ...act,
      facilitatorId: null,
      equipmentId: null,
      preferredTimeOfDay: "morning",
    };
    // Member busy 07:00 onward → only 05:00-07:00 is free in the morning band.
    const consumed = [
      { resourceId: "__member__", date: "2026-06-01", start: "07:00", end: "22:00" },
    ];
    const r = findSlot(selfCare, "2026-06-01", [], consumed);
    expect(r).toEqual({ start: "06:30", end: "07:00" });
  });

  it("skips already-consumed slots", () => {
    const consumed = [
      { resourceId: "trn-1", date: "2026-06-01", start: "06:00", end: "06:30" },
    ];
    const r = findSlot(act, "2026-06-01", [trainerAvailable], consumed);
    expect(r?.start).toBe("06:30");
  });

  it("requires both facilitator and equipment windows when both set", () => {
    const eqAct: Activity = { ...act, equipmentId: "eq-1" };
    const eq: Resource = {
      id: "eq-1",
      type: "equipment",
      name: "E",
      windows: [{ date: "2026-06-01", start: "09:00", end: "10:00" }],
    };
    const r = findSlot(eqAct, "2026-06-01", [trainerAvailable, eq], []);
    expect(r).toEqual({ start: "09:00", end: "09:30" });
  });
});
