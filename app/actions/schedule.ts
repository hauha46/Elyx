"use server";

import { z } from "zod";
import { ActionPlanSchema, AvailabilitySchema } from "@/lib/scheduler/schemas";
import { schedule } from "@/lib/scheduler";
import type { Schedule } from "@/lib/scheduler/types";

const RangeSchema = z.object({ start: z.string(), end: z.string() });

const InputSchema = z.object({
  plan: ActionPlanSchema,
  availability: AvailabilitySchema,
  range: RangeSchema,
});

export type GenerateInput = z.infer<typeof InputSchema>;
export type GenerateResult =
  | { ok: true; schedule: Schedule }
  | { ok: false; errors: { path: string; message: string }[] };

export async function generateSchedule(
  input: GenerateInput
): Promise<GenerateResult> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    };
  }
  const out = schedule(
    parsed.data.plan,
    parsed.data.availability,
    parsed.data.range
  );
  return { ok: true, schedule: out };
}
