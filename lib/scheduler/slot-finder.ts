import type { Activity, Resource } from "./types";

export type ConsumedSlot = {
  resourceId: string;
  date: string;
  start: string;
  end: string;
};
type Slot = { start: string; end: string };
type Interval = { startMin: number; endMin: number };

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

const timeOfDayBounds: Record<string, [number, number]> = {
  morning: [5 * 60, 12 * 60],
  afternoon: [12 * 60, 17 * 60],
  evening: [17 * 60, 22 * 60],
};

function resourceFreeIntervals(
  resource: Resource,
  date: string,
  consumed: ConsumedSlot[]
): Interval[] {
  const wins = resource.windows
    .filter((w) => w.date === date)
    .map((w) => ({ startMin: toMin(w.start), endMin: toMin(w.end) }));
  const blocks = consumed
    .filter((c) => c.resourceId === resource.id && c.date === date)
    .map((c) => ({ startMin: toMin(c.start), endMin: toMin(c.end) }));
  return subtract(wins, blocks);
}

function subtract(wins: Interval[], blocks: Interval[]): Interval[] {
  let result = [...wins];
  for (const b of blocks) {
    const next: Interval[] = [];
    for (const w of result) {
      if (b.endMin <= w.startMin || b.startMin >= w.endMin) {
        next.push(w);
        continue;
      }
      if (b.startMin > w.startMin)
        next.push({ startMin: w.startMin, endMin: b.startMin });
      if (b.endMin < w.endMin)
        next.push({ startMin: b.endMin, endMin: w.endMin });
    }
    result = next;
  }
  return result.sort((a, b) => a.startMin - b.startMin);
}

function intersect(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const x of a)
    for (const y of b) {
      const s = Math.max(x.startMin, y.startMin);
      const e = Math.min(x.endMin, y.endMin);
      if (e > s) out.push({ startMin: s, endMin: e });
    }
  return out.sort((a, b) => a.startMin - b.startMin);
}

export function findSlot(
  activity: Activity,
  date: string,
  resources: Resource[],
  consumed: ConsumedSlot[]
): Slot | null {
  const dur = activity.durationMinutes;
  const intervals: Interval[][] = [];

  if (activity.facilitatorId) {
    const fac = resources.find((r) => r.id === activity.facilitatorId);
    if (!fac) return null;
    intervals.push(resourceFreeIntervals(fac, date, consumed));
  }
  if (activity.equipmentId) {
    const eq = resources.find((r) => r.id === activity.equipmentId);
    if (!eq) return null;
    intervals.push(resourceFreeIntervals(eq, date, consumed));
  }

  const memberConsumed = consumed
    .filter((c) => c.resourceId === "__member__" && c.date === date)
    .map((c) => ({ startMin: toMin(c.start), endMin: toMin(c.end) }));
  const memberWin: Interval[] = subtract(
    [{ startMin: 5 * 60, endMin: 22 * 60 }],
    memberConsumed
  );
  intervals.push(memberWin);

  let candidates = intervals[0];
  for (let i = 1; i < intervals.length; i++)
    candidates = intersect(candidates, intervals[i]);

  if (activity.preferredTimeOfDay) {
    const [lo, hi] = timeOfDayBounds[activity.preferredTimeOfDay];
    const preferred = intersect(candidates, [{ startMin: lo, endMin: hi }]);
    const fit = preferred.find((c) => c.endMin - c.startMin >= dur);
    if (fit)
      return { start: fromMin(fit.startMin), end: fromMin(fit.startMin + dur) };
  }

  const fit = candidates.find((c) => c.endMin - c.startMin >= dur);
  return fit
    ? { start: fromMin(fit.startMin), end: fromMin(fit.startMin + dur) }
    : null;
}
