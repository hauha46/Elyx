"use client";

import { useMemo, useState } from "react";
import { addDays, startOfWeek, format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DayDetailSheet } from "@/components/day-detail-sheet";
import type {
  ActionPlan,
  Schedule,
  ScheduledEvent,
} from "@/lib/scheduler/types";

const HOURS = Array.from({ length: 17 }, (_, i) => 5 + i);
const TYPE_COLOR: Record<string, string> = {
  fitness: "bg-blue-500/80",
  food: "bg-green-500/80",
  medication: "bg-amber-500/80",
  therapy: "bg-purple-500/80",
  consultation: "bg-pink-500/80",
};

export function WeeklyCalendar({
  schedule,
  plan,
}: {
  schedule: Schedule;
  plan: ActionPlan;
}) {
  const activityById = useMemo(
    () => new Map(plan.activities.map((a) => [a.id, a])),
    [plan]
  );
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(parseISO(schedule.dateRange.start), { weekStartsOn: 1 })
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const days = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), "yyyy-MM-dd")
  );
  const eventsByDay = useMemo(() => {
    const map = new Map<string, ScheduledEvent[]>();
    for (const e of schedule.events) {
      if (e.status === "skipped") continue;
      if (!days.includes(e.date)) continue;
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [schedule, days.join(",")]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
        >
          ‹ Prev
        </Button>
        <h2 className="font-medium">
          Week of {format(weekStart, "MMM d, yyyy")}
        </h2>
        <Button
          variant="outline"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
        >
          Next ›
        </Button>
      </div>

      <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-border text-xs">
        <div />
        {days.map((d) => (
          <button
            key={d}
            className="bg-background p-2 font-medium hover:bg-muted text-left"
            onClick={() => setSelectedDay(d)}
          >
            {format(parseISO(d), "EEE d")}
          </button>
        ))}
        {HOURS.flatMap((h) => [
          <div
            key={`h-${h}`}
            className="bg-background p-1 text-right text-muted-foreground"
          >
            {String(h).padStart(2, "0")}:00
          </div>,
          ...days.map((d) => {
            const dayEvents = (eventsByDay.get(d) ?? []).filter(
              (e) => Number(e.start.slice(0, 2)) === h
            );
            return (
              <div
                key={`${d}-${h}`}
                className="bg-background min-h-[40px] p-0.5 relative"
              >
                {dayEvents.map((e, i) => {
                  const a = activityById.get(e.activityId);
                  return (
                    <div
                      key={i}
                      className={`text-[10px] text-white px-1 py-0.5 rounded mb-0.5 ${TYPE_COLOR[a?.type ?? "fitness"]}`}
                      title={a?.name}
                    >
                      {e.start} {a?.name}
                    </div>
                  );
                })}
              </div>
            );
          }),
        ])}
      </div>

      <DayDetailSheet
        date={selectedDay}
        schedule={schedule}
        plan={plan}
        onClose={() => setSelectedDay(null)}
      />
    </Card>
  );
}
