import meiLinPlan from "./mei-lin-chen.plan.json";
import meiLinAvail from "./mei-lin-chen.availability.json";
import baoPlan from "./bao-nguyen.plan.json";
import baoAvail from "./bao-nguyen.availability.json";
import type { ActionPlan, Availability } from "@/lib/scheduler/types";

export const SAMPLES: Array<{
  key: string;
  label: string;
  plan: ActionPlan;
  availability: Availability;
}> = [
  {
    key: "mei-lin",
    label: "Mei Lin Chen — cardio focus",
    plan: meiLinPlan as ActionPlan,
    availability: meiLinAvail as Availability,
  },
  {
    key: "bao",
    label: "Bao Nguyen — strength focus",
    plan: baoPlan as ActionPlan,
    availability: baoAvail as Availability,
  },
];
