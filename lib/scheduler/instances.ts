import { addDays, differenceInCalendarDays, parseISO, format } from "date-fns";
import type { Activity, TimeOfDay } from "./types";

export type DateRange = { start: string; end: string };
export type Occurrence = { date: string; preferredTimeOfDay?: TimeOfDay };

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

// How to spread N same-day doses across the day. 2/day → morning + evening,
// 3/day → morning + afternoon + evening; 4+ spread evenly across the bands.
const DAY_PART_SPLITS: Record<number, TimeOfDay[]> = {
  2: ["morning", "evening"],
  3: ["morning", "afternoon", "evening"],
};

function evenSplit(times: number): TimeOfDay[] {
  const order: TimeOfDay[] = ["morning", "afternoon", "evening"];
  return Array.from(
    { length: times },
    (_, t) => order[Math.min(2, Math.floor((t * 3) / times))]
  );
}

// Like expandFrequency, but for multi-dose-per-day activities it tags each
// same-day occurrence with a distinct day-part so the scheduler spreads them
// (a 2x/day pill lands morning AND evening, not twice before breakfast).
// Other frequencies carry no override — they keep the activity's own band.
export function expandFrequencyWithDayParts(
  activity: Activity,
  range: DateRange
): Occurrence[] {
  const dates = expandFrequency(activity, range);
  const { times, per } = activity.frequency;
  if (per === "day" && times > 1) {
    const bands = DAY_PART_SPLITS[times] ?? evenSplit(times);
    return dates.map((date, i) => ({
      date,
      preferredTimeOfDay: bands[i % times],
    }));
  }
  return dates.map((date) => ({ date }));
}
