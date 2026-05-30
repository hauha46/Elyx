import { addDays, differenceInCalendarDays, parseISO, format } from "date-fns";
import type { Activity } from "./types";

export type DateRange = { start: string; end: string };

export function expandFrequency(activity: Activity, range: DateRange): string[] {
  const startDate = parseISO(range.start);
  const endDate = parseISO(range.end);
  const totalDays = differenceInCalendarDays(endDate, startDate) + 1;

  const { times, per } = activity.frequency;
  let perPeriodDays: number;
  switch (per) {
    case "day":
      perPeriodDays = 1;
      break;
    case "week":
      perPeriodDays = 7;
      break;
    case "month":
      perPeriodDays = 30;
      break;
  }

  const totalInstances = Math.max(
    1,
    Math.round((totalDays / perPeriodDays) * times)
  );

  if (per === "day" && times === 1) {
    return Array.from({ length: totalDays }, (_, i) =>
      format(addDays(startDate, i), "yyyy-MM-dd")
    );
  }

  if (per === "day" && times > 1) {
    const dates: string[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = format(addDays(startDate, i), "yyyy-MM-dd");
      for (let t = 0; t < times; t++) dates.push(d);
    }
    return dates;
  }

  const step = totalDays / totalInstances;
  const dates: string[] = [];
  for (let i = 0; i < totalInstances; i++) {
    const offset = Math.floor(i * step);
    dates.push(format(addDays(startDate, offset), "yyyy-MM-dd"));
  }
  return dates;
}
