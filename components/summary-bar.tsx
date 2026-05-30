import { Badge } from "@/components/ui/badge";
import type { Schedule } from "@/lib/scheduler/types";

export function SummaryBar({ summary }: { summary: Schedule["summary"] }) {
  return (
    <div className="flex gap-2 items-center">
      <Badge variant="default">{summary.scheduled} scheduled</Badge>
      <Badge variant="secondary">{summary.substituted} substituted</Badge>
      <Badge variant="destructive">{summary.skipped} skipped</Badge>
    </div>
  );
}
