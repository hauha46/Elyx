"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Download } from "lucide-react";
import { SAMPLES } from "@/lib/sample-data";

function downloadJSON(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const ACTIVITY_FIELDS: { key: string; type: string; desc: string }[] = [
  { key: "id", type: "string", desc: "Unique identifier within the plan." },
  {
    key: "type",
    type: "'fitness' | 'food' | 'medication' | 'therapy' | 'consultation'",
    desc: "Category — drives color in the calendar.",
  },
  { key: "name", type: "string", desc: "Human-readable label shown in events." },
  {
    key: "priority",
    type: "number ≥ 1",
    desc: "1 = highest. Higher priority gets first pick of contested slots.",
  },
  {
    key: "frequency",
    type: "{ times: number; per: 'day' | 'week' | 'month' }",
    desc: "Used by expandFrequency to spread instances evenly.",
  },
  {
    key: "durationMinutes",
    type: "number > 0",
    desc: "Duration; the scheduler reserves this much time.",
  },
  {
    key: "details",
    type: "string",
    desc: "Free text — appears in day-detail and ICS description.",
  },
  {
    key: "facilitatorId",
    type: "string | null",
    desc: "Reference to a Resource id, or null for self-directed.",
  },
  {
    key: "equipmentId",
    type: "string | null",
    desc: "Reference to an equipment Resource id, or null.",
  },
  {
    key: "location",
    type: "'home' | 'gym' | 'clinic' | 'remote'",
    desc: "Where it happens. Shown in ICS LOCATION.",
  },
  {
    key: "remoteEligible",
    type: "boolean",
    desc: "Can the activity be done remotely (e.g. during travel).",
  },
  { key: "prepNotes", type: "string", desc: "Reminders before the session." },
  {
    key: "backupActivityIds",
    type: "string[]",
    desc: "Activity ids tried (in order) when the primary doesn't fit.",
  },
  {
    key: "adjustmentIfSkipped",
    type: "string",
    desc: "What to do if the activity is skipped.",
  },
  {
    key: "metrics",
    type: "string[]",
    desc: "Metric names to log against this activity.",
  },
  {
    key: "preferredTimeOfDay",
    type: "'morning' | 'afternoon' | 'evening' | undefined",
    desc: "Optional hint — slot finder honours it when possible.",
  },
];

const RESOURCE_FIELDS: { key: string; type: string; desc: string }[] = [
  {
    key: "id",
    type: "string",
    desc: "Referenced by activity.facilitatorId or .equipmentId.",
  },
  {
    key: "type",
    type: "'trainer' | 'specialist' | 'allied-health' | 'equipment'",
    desc: "Resource category.",
  },
  { key: "name", type: "string", desc: "Display name." },
  {
    key: "windows",
    type: "{ date: yyyy-mm-dd; start: HH:mm; end: HH:mm }[]",
    desc: "When this resource is AVAILABLE. Multiple windows per date are allowed.",
  },
];

const TRAVEL_FIELDS: { key: string; type: string; desc: string }[] = [
  { key: "start", type: "yyyy-mm-dd", desc: "Inclusive trip start." },
  { key: "end", type: "yyyy-mm-dd", desc: "Inclusive trip end." },
  {
    key: "location",
    type: "string",
    desc: "Free-text label shown in remote events.",
  },
  {
    key: "remoteOk",
    type: "boolean",
    desc: "If false, even remote-eligible activities are skipped during this trip.",
  },
];

function FieldTable({
  rows,
}: {
  rows: { key: string; type: string; desc: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-2 font-medium">Field</th>
            <th className="text-left p-2 font-medium">Type</th>
            <th className="text-left p-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t">
              <td className="p-2 font-mono text-xs">{r.key}</td>
              <td className="p-2 font-mono text-xs text-muted-foreground">
                {r.type}
              </td>
              <td className="p-2">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SchemaHelpDialog() {
  const meiLin = SAMPLES.find((s) => s.key === "mei-lin")!;
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <HelpCircle className="size-4 mr-1" /> Format help
          </Button>
        }
      />
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload file format</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="font-medium mb-2">ActionPlan (plan.json)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Top-level:{" "}
                <code>{`{ memberId, memberName, activities: Activity[] }`}</code>
                . Each activity:
              </p>
              <FieldTable rows={ACTIVITY_FIELDS} />
            </section>

            <Separator />

            <section>
              <h3 className="font-medium mb-2">
                Availability (availability.json)
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Top-level:{" "}
                <code>{`{ resources: Resource[]; travel: Travel[] }`}</code>.
                Each resource:
              </p>
              <FieldTable rows={RESOURCE_FIELDS} />
              <p className="text-sm text-muted-foreground my-3">
                Each travel block:
              </p>
              <FieldTable rows={TRAVEL_FIELDS} />
            </section>

            <Separator />

            <section>
              <h3 className="font-medium mb-2">Start from a sample</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Both files for Mei Lin Chen — edit the values, keep the shape.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadJSON("plan.json", meiLin.plan)}
                >
                  <Download className="size-4 mr-1" /> plan.json
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadJSON("availability.json", meiLin.availability)
                  }
                >
                  <Download className="size-4 mr-1" /> availability.json
                </Button>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
