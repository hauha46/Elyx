import type {
  ActionPlan,
  Availability,
  Schedule,
  ScheduledEvent,
  Activity,
  Travel,
} from "./types";
import { addDays, format, parseISO } from "date-fns";
import { expandFrequencyWithDayParts, type DateRange } from "./instances";
import { findSlot, type ConsumedSlot } from "./slot-finder";

function isInTravel(date: string, travel: Travel[]): Travel | null {
  return travel.find((t) => date >= t.start && date <= t.end) ?? null;
}

// How far forward an unplaceable occurrence may slide to find availability —
// the real-world "next available appointment". Daily items don't move days;
// a weekly slot can shift a few days, a monthly one up to a few weeks.
function flexDays(per: "day" | "week" | "month"): number {
  return per === "month" ? 20 : per === "week" ? 3 : 0;
}

function tryPlaceActivity(
  activity: Activity,
  date: string,
  resources: Availability["resources"],
  consumed: ConsumedSlot[],
  travel: Travel[]
): ScheduledEvent | null {
  const trip = isInTravel(date, travel);
  let note: string | undefined;
  // What we actually place: during travel, an on-site facilitator/equipment
  // can't be used, so we place against the member's day only.
  let target = activity;

  if (trip) {
    const selfAdministered = !activity.facilitatorId && !activity.equipmentId;
    if (selfAdministered) {
      note = `During ${trip.location}`;
    } else if (activity.remoteEligible && trip.remoteOk) {
      note = `Remote during ${trip.location}`;
      target = { ...activity, facilitatorId: null, equipmentId: null };
    } else {
      return null; // facility-bound and can't be done remotely → skip
    }
  }

  const slot = findSlot(target, date, resources, consumed);
  if (!slot) return null;

  if (target.facilitatorId)
    consumed.push({ resourceId: target.facilitatorId, date, ...slot });
  if (target.equipmentId)
    consumed.push({ resourceId: target.equipmentId, date, ...slot });
  consumed.push({ resourceId: "__member__", date, ...slot });

  return {
    activityId: activity.id,
    date,
    ...slot,
    facilitatorId: target.facilitatorId,
    status: "scheduled",
    ...(note ? { notes: note } : {}),
  };
}

export function schedule(
  plan: ActionPlan,
  availability: Availability,
  range: DateRange
): Schedule {
  const sorted = [...plan.activities].sort((a, b) => a.priority - b.priority);
  const byId = new Map(plan.activities.map((a) => [a.id, a]));
  const consumed: ConsumedSlot[] = [];
  const events: ScheduledEvent[] = [];

  for (const activity of sorted) {
    const occurrences = expandFrequencyWithDayParts(activity, range);
    for (const { date, preferredTimeOfDay } of occurrences) {
      // A multi-dose day tags each occurrence with its own band; otherwise the
      // activity keeps whatever band it declared.
      const target = preferredTimeOfDay
        ? { ...activity, preferredTimeOfDay }
        : activity;
      const placed = tryPlaceActivity(
        target,
        date,
        availability.resources,
        consumed,
        availability.travel
      );
      if (placed) {
        events.push(placed);
        continue;
      }

      let subbed: ScheduledEvent | null = null;
      for (const backupId of activity.backupActivityIds) {
        const backup = byId.get(backupId);
        if (!backup) continue;
        const placedBackup = tryPlaceActivity(
          backup,
          date,
          availability.resources,
          consumed,
          availability.travel
        );
        if (placedBackup) {
          subbed = {
            ...placedBackup,
            activityId: backup.id,
            status: "backup-substitute",
            substituteForActivityId: activity.id,
          };
          break;
        }
      }
      if (subbed) {
        events.push(subbed);
        continue;
      }

      // Neither the primary nor a backup fit today — slide forward to the next
      // day the activity can actually happen (e.g. the specialist's clinic day).
      let flexed: ScheduledEvent | null = null;
      const maxFlex = flexDays(activity.frequency.per);
      for (let k = 1; k <= maxFlex; k++) {
        const altDate = format(addDays(parseISO(date), k), "yyyy-MM-dd");
        if (altDate > range.end) break;
        const placedAlt = tryPlaceActivity(
          target,
          altDate,
          availability.resources,
          consumed,
          availability.travel
        );
        if (placedAlt) {
          flexed = placedAlt;
          break;
        }
      }
      if (flexed) {
        events.push(flexed);
        continue;
      }

      events.push({
        activityId: activity.id,
        date,
        start: "00:00",
        end: "00:00",
        facilitatorId: null,
        status: "skipped",
        adjustmentApplied: activity.adjustmentIfSkipped,
      });
    }
  }

  events.sort((a, b) =>
    (a.date + a.start).localeCompare(b.date + b.start)
  );
  const summary = events.reduce(
    (s, e) => {
      const key = e.status === "backup-substitute" ? "substituted" : e.status;
      s[key]++;
      return s;
    },
    { scheduled: 0, substituted: 0, skipped: 0 } as Schedule["summary"]
  );

  return { dateRange: range, events, summary };
}
