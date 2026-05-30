import type {
  ActionPlan,
  Availability,
  Schedule,
  ScheduledEvent,
  Activity,
  Travel,
} from "./types";
import { expandFrequency, type DateRange } from "./instances";
import { findSlot, type ConsumedSlot } from "./slot-finder";

function isInTravel(date: string, travel: Travel[]): Travel | null {
  return travel.find((t) => date >= t.start && date <= t.end) ?? null;
}

function addDur(start: string, dur: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + dur;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function tryPlaceActivity(
  activity: Activity,
  date: string,
  resources: Availability["resources"],
  consumed: ConsumedSlot[],
  travel: Travel[]
): ScheduledEvent | null {
  const trip = isInTravel(date, travel);
  if (trip) {
    if (activity.remoteEligible && trip.remoteOk) {
      return {
        activityId: activity.id,
        date,
        start: "09:00",
        end: addDur("09:00", activity.durationMinutes),
        facilitatorId: null,
        status: "scheduled",
        notes: `Remote during ${trip.location}`,
      };
    }
    return null;
  }

  const slot = findSlot(activity, date, resources, consumed);
  if (!slot) return null;

  if (activity.facilitatorId)
    consumed.push({ resourceId: activity.facilitatorId, date, ...slot });
  if (activity.equipmentId)
    consumed.push({ resourceId: activity.equipmentId, date, ...slot });
  consumed.push({ resourceId: "__member__", date, ...slot });

  return {
    activityId: activity.id,
    date,
    ...slot,
    facilitatorId: activity.facilitatorId,
    status: "scheduled",
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
    const dates = expandFrequency(activity, range);
    for (const date of dates) {
      const placed = tryPlaceActivity(
        activity,
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
