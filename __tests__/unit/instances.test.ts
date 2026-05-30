import { describe, it, expect } from "vitest";
import { expandFrequency } from "@/lib/scheduler/instances";
import type { Activity } from "@/lib/scheduler/types";

const base: Activity = {
  id: "a",
  type: "fitness",
  name: "Run",
  priority: 1,
  frequency: { times: 3, per: "week" },
  durationMinutes: 30,
  details: "",
  facilitatorId: null,
  equipmentId: null,
  location: "home",
  remoteEligible: true,
  prepNotes: "",
  backupActivityIds: [],
  adjustmentIfSkipped: "",
  metrics: [],
};

describe("expandFrequency", () => {
  it("3x/week over 4 weeks yields 12 dates", () => {
    const dates = expandFrequency(base, {
      start: "2026-06-01",
      end: "2026-06-28",
    });
    expect(dates).toHaveLength(12);
    expect(dates[0]).toBe("2026-06-01");
  });

  it("1x/day yields one date per day inclusive", () => {
    const daily: Activity = { ...base, frequency: { times: 1, per: "day" } };
    const dates = expandFrequency(daily, {
      start: "2026-06-01",
      end: "2026-06-07",
    });
    expect(dates).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
      "2026-06-06",
      "2026-06-07",
    ]);
  });

  it("2x/day yields each date twice", () => {
    const twice: Activity = { ...base, frequency: { times: 2, per: "day" } };
    const dates = expandFrequency(twice, {
      start: "2026-06-01",
      end: "2026-06-02",
    });
    expect(dates).toEqual([
      "2026-06-01",
      "2026-06-01",
      "2026-06-02",
      "2026-06-02",
    ]);
  });

  it("1x/month over 3 months yields 3 dates", () => {
    const monthly: Activity = {
      ...base,
      frequency: { times: 1, per: "month" },
    };
    const dates = expandFrequency(monthly, {
      start: "2026-06-01",
      end: "2026-08-31",
    });
    expect(dates).toHaveLength(3);
  });
});
