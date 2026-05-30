import { describe, it, expect } from "vitest";
import { generateSchedule } from "@/app/actions/schedule";
import { SAMPLES } from "@/lib/sample-data";

describe("generateSchedule server action", () => {
  it("returns a valid schedule for Mei Lin Chen sample", async () => {
    const meiLin = SAMPLES.find((s) => s.key === "mei-lin")!;
    const result = await generateSchedule({
      plan: meiLin.plan,
      availability: meiLin.availability,
      range: { start: "2026-06-01", end: "2026-08-23" },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.schedule.events.length).toBeGreaterThan(50);
  });

  it("rejects invalid input with structured error", async () => {
    const result = await generateSchedule({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      plan: { memberId: "", memberName: "", activities: [] } as any,
      availability: { resources: [], travel: [] },
      range: { start: "2026-06-01", end: "2026-08-23" },
    });
    expect(result.ok).toBe(false);
  });
});
