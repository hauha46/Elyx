import { describe, it, expect } from "vitest";
import { toICS } from "@/lib/ics";
import type { ActionPlan, Schedule } from "@/lib/scheduler/types";

const plan: ActionPlan = {
  memberId: "m",
  memberName: "Test Member",
  activities: [
    {
      id: "a1",
      type: "fitness",
      name: "Run",
      priority: 1,
      frequency: { times: 3, per: "week" },
      durationMinutes: 30,
      details: "Zone 2",
      facilitatorId: null,
      equipmentId: null,
      location: "home",
      remoteEligible: false,
      prepNotes: "Hydrate",
      backupActivityIds: [],
      adjustmentIfSkipped: "",
      metrics: [],
    },
  ],
};

const schedule: Schedule = {
  dateRange: { start: "2026-06-01", end: "2026-06-07" },
  events: [
    {
      activityId: "a1",
      date: "2026-06-01",
      start: "06:00",
      end: "06:30",
      facilitatorId: null,
      status: "scheduled",
    },
    {
      activityId: "a1",
      date: "2026-06-03",
      start: "00:00",
      end: "00:00",
      facilitatorId: null,
      status: "skipped",
      adjustmentApplied: "Push to next day",
    },
  ],
  summary: { scheduled: 1, substituted: 0, skipped: 1 },
};

describe("toICS", () => {
  it("emits a VCALENDAR with VERSION and PRODID", () => {
    const out = toICS(plan, schedule);
    expect(out).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(out).toContain("VERSION:2.0");
    expect(out).toContain("PRODID:-//Elyx//Resource Allocator//EN");
    expect(out).toMatch(/END:VCALENDAR\r\n$/);
  });

  it("includes scheduled events as VEVENT blocks", () => {
    const out = toICS(plan, schedule);
    expect(out).toContain("BEGIN:VEVENT");
    expect(out).toContain("SUMMARY:Run");
    expect(out).toContain("DTSTART:20260601T060000");
    expect(out).toContain("DTEND:20260601T063000");
    expect(out).toContain("LOCATION:home");
  });

  it("excludes skipped events", () => {
    const out = toICS(plan, schedule);
    const eventCount = (out.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(eventCount).toBe(1);
  });

  it("escapes commas and semicolons in DESCRIPTION", () => {
    const out = toICS(
      {
        ...plan,
        activities: [
          { ...plan.activities[0], details: "HR 120, 140; pace 5min/km" },
        ],
      },
      schedule
    );
    expect(out).toContain("HR 120\\, 140\\; pace 5min/km");
  });
});
