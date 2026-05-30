import { describe, it, expect } from "vitest";
import { ActionPlanSchema, AvailabilitySchema } from "@/lib/scheduler/schemas";

const minimalPlan = {
  memberId: "m1",
  memberName: "Test",
  activities: [
    {
      id: "a1",
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
    },
  ],
};

describe("ActionPlanSchema", () => {
  it("accepts a minimal valid plan", () => {
    expect(() => ActionPlanSchema.parse(minimalPlan)).not.toThrow();
  });
  it("rejects priority < 1", () => {
    const bad = {
      ...minimalPlan,
      activities: [{ ...minimalPlan.activities[0], priority: 0 }],
    };
    expect(() => ActionPlanSchema.parse(bad)).toThrow();
  });
  it("rejects unknown activity type", () => {
    const bad = {
      ...minimalPlan,
      activities: [{ ...minimalPlan.activities[0], type: "sleeping" }],
    };
    expect(() => ActionPlanSchema.parse(bad)).toThrow();
  });
});

describe("AvailabilitySchema", () => {
  it("accepts empty availability", () => {
    expect(() =>
      AvailabilitySchema.parse({ resources: [], travel: [] })
    ).not.toThrow();
  });
  it("rejects malformed HH:mm", () => {
    const bad = {
      resources: [
        {
          id: "r1",
          type: "trainer",
          name: "x",
          windows: [{ date: "2026-06-01", start: "25:00", end: "26:00" }],
        },
      ],
      travel: [],
    };
    expect(() => AvailabilitySchema.parse(bad)).toThrow();
  });
});
