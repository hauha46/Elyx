"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Schedule } from "@/lib/scheduler/types";

type Filter = "scheduled" | "substituted" | "skipped";

export function SummaryBar({
  summary,
  onSelect,
}: {
  summary: Schedule["summary"];
  onSelect: (filter: Filter) => void;
}) {
  const Item = ({
    filter,
    count,
    variant,
    hint,
  }: {
    filter: Filter;
    count: number;
    variant: "default" | "secondary" | "destructive";
    hint: string;
  }) => (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            onClick={() => onSelect(filter)}
            disabled={count === 0}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Badge variant={variant} className="cursor-pointer">
              {count} {filter}
            </Badge>
          </button>
        }
      />
      <TooltipContent>
        {count === 0 ? "None to show" : hint}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex gap-2 items-center">
      <Item
        filter="scheduled"
        count={summary.scheduled}
        variant="default"
        hint="View all scheduled events"
      />
      <Item
        filter="substituted"
        count={summary.substituted}
        variant="secondary"
        hint="View substitutions"
      />
      <Item
        filter="skipped"
        count={summary.skipped}
        variant="destructive"
        hint="View skipped activities + adjustments"
      />
    </div>
  );
}
