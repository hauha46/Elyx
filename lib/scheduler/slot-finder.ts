import type { Activity, ActivityType, Resource, TimeOfDay } from "./types";

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

// A believable target time *inside* each band — so events land mid-band
// (breakfast ~07:30, lunch ~12:30, dinner ~18:30) instead of at the band floor.
const timeOfDayAnchors: Record<TimeOfDay, number> = {
  morning: 7 * 60 + 30,
  afternoon: 12 * 60 + 30,
  evening: 18 * 60 + 30,
};

// Fallback anchor by type when an activity has no explicit preferredTimeOfDay.
// `null` keeps the legacy earliest-fit behavior (meals/fitness carry their own
// band in the data; consultations snap to the facilitator's window).
const typeAnchors: Record<ActivityType, number | null> = {
  fitness: null,
  food: null,
  medication: 7 * 60 + 30,
  therapy: 18 * 60 + 30,
  consultation: null,
};

function anchorMinute(activity: Activity): number | null {
  if (activity.preferredTimeOfDay)
    return timeOfDayAnchors[activity.preferredTimeOfDay];
  return typeAnchors[activity.type];
}

// Place `dur` minutes within the free `space`. With no anchor, take the earliest
// fit. With an anchor, prefer the earliest slot at-or-after it; if none fits,
// fall back to the slot nearest before it (latest possible start).
function placeInSpace(
  space: Interval[],
  dur: number,
  anchor: number | null
): Slot | null {
  if (anchor === null) {
    const fit = space.find((c) => c.endMin - c.startMin >= dur);
    return fit
      ? { start: fromMin(fit.startMin), end: fromMin(fit.startMin + dur) }
      : null;
  }
  for (const c of space) {
    const s = Math.max(c.startMin, anchor);
    if (s + dur <= c.endMin) return { start: fromMin(s), end: fromMin(s + dur) };
  }
  for (let i = space.length - 1; i >= 0; i--) {
    const c = space[i];
    if (c.endMin - c.startMin >= dur)
      return { start: fromMin(c.endMin - dur), end: fromMin(c.endMin) };
  }
  return null;
}

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

  // A set preferredTimeOfDay is a hard band (when it has room); otherwise the
  // whole day is fair game and the anchor (if any) just biases placement.
  let searchSpace = candidates;
  if (activity.preferredTimeOfDay) {
    const [lo, hi] = timeOfDayBounds[activity.preferredTimeOfDay];
    const pool = intersect(candidates, [{ startMin: lo, endMin: hi }]);
    if (pool.length) searchSpace = pool;
  }

  return placeInSpace(searchSpace, dur, anchorMinute(activity));
}
