import { describe, it, expect } from "vitest";
import { SAMPLES } from "@/lib/sample-data";
import {
  ActionPlanSchema,
  AvailabilitySchema,
  schedule,
} from "@/lib/scheduler";

const RANGE = { start: "2026-06-01", end: "2026-08-23" };

describe("sample data", () => {
  for (const sample of SAMPLES) {
    it(`${sample.key}: plan validates`, () => {
      expect(() => ActionPlanSchema.parse(sample.plan)).not.toThrow();
    });
    it(`${sample.key}: availability validates`, () => {
      expect(() =>
        AvailabilitySchema.parse(sample.availability)
      ).not.toThrow();
    });
    it(`${sample.key}: schedule has no double-booked resources`, () => {
      const out = schedule(sample.plan, sample.availability, RANGE);
      const seen = new Set<string>();
      for (const e of out.events) {
        if (e.status === "skipped") continue;
        if (!e.facilitatorId) continue;
        const key = `${e.facilitatorId}@${e.date}T${e.start}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });
    it(`${sample.key}: schedule events fall within date range`, () => {
      const out = schedule(sample.plan, sample.availability, RANGE);
      for (const e of out.events) {
        expect(e.date >= RANGE.start && e.date <= RANGE.end).toBe(true);
      }
    });
  }

  it("combined samples produce >= 100 events", () => {
    const total = SAMPLES.reduce(
      (sum, s) =>
        sum + schedule(s.plan, s.availability, RANGE).events.length,
      0
    );
    expect(total).toBeGreaterThanOrEqual(100);
  });
});
