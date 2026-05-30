"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ActionPlan, Schedule } from "@/lib/scheduler/types";

export function DayDetailSheet({
  date,
  schedule,
  plan,
  onClose,
}: {
  date: string | null;
  schedule: Schedule;
  plan: ActionPlan;
  onClose: () => void;
}) {
  const events = date
    ? schedule.events.filter((e) => e.date === date)
    : [];
  const byId = new Map(plan.activities.map((a) => [a.id, a]));

  return (
    <Sheet open={!!date} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{date}</SheetTitle>
        </SheetHeader>
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground mt-4 px-4">No events.</p>
        )}
        <ul className="mt-4 flex flex-col gap-3 px-4 pb-4">
          {events.map((e, i) => {
            const a = byId.get(e.activityId);
            return (
              <li key={i} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <strong>{a?.name ?? e.activityId}</strong>
                  <span className="text-xs">{e.status}</span>
                </div>
                {e.status !== "skipped" && (
                  <div className="text-xs text-muted-foreground">
                    {e.start}–{e.end}
                  </div>
                )}
                {a && <div className="text-xs mt-1">{a.details}</div>}
                {a?.prepNotes && (
                  <div className="text-xs mt-1">
                    <em>Prep:</em> {a.prepNotes}
                  </div>
                )}
                {e.adjustmentApplied && (
                  <div className="text-xs mt-1 text-amber-700">
                    <em>Adjustment:</em> {e.adjustmentApplied}
                  </div>
                )}
                {e.substituteForActivityId && (
                  <div className="text-xs mt-1">
                    <em>Substitute for:</em>{" "}
                    {byId.get(e.substituteForActivityId)?.name}
                  </div>
                )}
                {e.notes && (
                  <div className="text-xs mt-1 text-muted-foreground">
                    {e.notes}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
