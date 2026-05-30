"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type {
  ActionPlan,
  Schedule,
  ScheduledEvent,
} from "@/lib/scheduler/types";
import { format, parseISO } from "date-fns";

type Filter = "scheduled" | "substituted" | "skipped";

const TITLES: Record<Filter, string> = {
  scheduled: "Scheduled events",
  substituted: "Backup substitutions",
  skipped: "Skipped activities",
};

const DESCRIPTIONS: Record<Filter, string> = {
  scheduled: "Activities placed at their requested time.",
  substituted:
    "Primary activity didn't fit — the listed backup was used instead.",
  skipped:
    "No primary or backup fit. The recorded adjustment explains the recovery plan.",
};

export function FailuresSheet({
  filter,
  schedule,
  plan,
  onClose,
}: {
  filter: Filter | null;
  schedule: Schedule;
  plan: ActionPlan;
  onClose: () => void;
}) {
  const byId = useMemo(
    () => new Map(plan.activities.map((a) => [a.id, a])),
    [plan]
  );

  const matchStatus = (e: ScheduledEvent) =>
    filter === "substituted"
      ? e.status === "backup-substitute"
      : filter === "scheduled"
        ? e.status === "scheduled"
        : e.status === "skipped";

  const matching = filter ? schedule.events.filter(matchStatus) : [];

  const grouped = useMemo(() => {
    if (filter === "scheduled") return null;
    const m = new Map<string, ScheduledEvent[]>();
    for (const e of matching) {
      const key =
        filter === "substituted"
          ? (e.substituteForActivityId ?? e.activityId)
          : e.activityId;
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    }
    return Array.from(m.entries());
  }, [matching, filter]);

  return (
    <Sheet
      open={filter !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent className="w-[480px] sm:w-[560px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{filter ? TITLES[filter] : ""}</SheetTitle>
          <SheetDescription>
            {filter ? DESCRIPTIONS[filter] : ""}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-4 h-full pr-4">
          {matching.length === 0 && (
            <p className="text-sm text-muted-foreground px-4">
              Nothing here. The plan ran clean.
            </p>
          )}

          {filter === "scheduled" && (
            <ul className="flex flex-col gap-2 px-4 pb-4">
              {matching.map((e, i) => {
                const a = byId.get(e.activityId);
                return (
                  <li
                    key={i}
                    className="rounded border p-3 text-sm flex justify-between items-center"
                  >
                    <span>
                      <strong>{a?.name}</strong>
                      <span className="text-muted-foreground">
                        {" "}
                        · {format(parseISO(e.date), "EEE MMM d")}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {e.start}–{e.end}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {grouped && (
            <ul className="flex flex-col gap-3 px-4 pb-4">
              {grouped.map(([key, events]) => {
                const a = byId.get(key);
                return (
                  <li key={key} className="rounded border p-3">
                    <div className="flex justify-between items-start gap-2">
                      <strong className="text-sm">{a?.name ?? key}</strong>
                      <Badge variant="secondary">×{events.length}</Badge>
                    </div>
                    {filter === "skipped" && a?.adjustmentIfSkipped && (
                      <p className="text-xs text-amber-700 mt-2">
                        <em>Adjustment:</em> {a.adjustmentIfSkipped}
                      </p>
                    )}
                    <ul className="mt-2 flex flex-col gap-1">
                      {events.map((e, i) => {
                        const subActivity =
                          e.activityId !== key
                            ? byId.get(e.activityId)
                            : null;
                        return (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground"
                          >
                            {format(parseISO(e.date), "EEE MMM d")}
                            {filter === "substituted" &&
                              subActivity &&
                              ` → used ${subActivity.name} at ${e.start}`}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
