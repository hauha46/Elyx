import type {
  ActionPlan,
  Schedule,
  ScheduledEvent,
} from "@/lib/scheduler/types";

const CRLF = "\r\n";

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function dt(date: string, time: string): string {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function dtstamp(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}${String(now.getUTCDate()).padStart(2, "0")}T${String(
    now.getUTCHours()
  ).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(
    now.getUTCSeconds()
  ).padStart(2, "0")}Z`;
}

function vevent(
  e: ScheduledEvent,
  activity: ActionPlan["activities"][number]
): string[] {
  const uid = `${e.activityId}-${e.date}-${e.start.replace(":", "")}@elyx`;
  const description = [
    activity.details,
    activity.prepNotes && `Prep: ${activity.prepNotes}`,
    e.notes,
    e.substituteForActivityId && `Substitute for: ${e.substituteForActivityId}`,
  ]
    .filter(Boolean)
    .join("\\n");
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp()}`,
    `DTSTART:${dt(e.date, e.start)}`,
    `DTEND:${dt(e.date, e.end)}`,
    `SUMMARY:${escapeText(activity.name)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(activity.location)}`,
    "END:VEVENT",
  ];
}

export function toICS(plan: ActionPlan, schedule: Schedule): string {
  const byId = new Map(plan.activities.map((a) => [a.id, a]));
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Elyx//Resource Allocator//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(`Elyx — ${plan.memberName}`)}`,
  ];
  for (const e of schedule.events) {
    if (e.status === "skipped") continue;
    const a = byId.get(e.activityId);
    if (!a) continue;
    lines.push(...vevent(e, a));
  }
  lines.push("END:VCALENDAR");
  return lines.join(CRLF) + CRLF;
}
