"use client";

import { useState, useTransition } from "react";
import { SamplePicker } from "@/components/sample-picker";
import { UploadPanel } from "@/components/upload-panel";
import { SchemaHelpDialog } from "@/components/schema-help-dialog";
import { SummaryBar } from "@/components/summary-bar";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { FailuresSheet } from "@/components/failures-sheet";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Download, Sparkles } from "lucide-react";
import { SAMPLES } from "@/lib/sample-data";
import { generateSchedule } from "@/app/actions/schedule";
import { toICS } from "@/lib/ics";
import type {
  ActionPlan,
  Availability,
  Schedule,
} from "@/lib/scheduler/types";

const DEFAULT_RANGE = { start: "2026-06-01", end: "2026-08-23" };

type Filter = "scheduled" | "substituted" | "skipped";

export default function Page() {
  const [sampleKey, setSampleKey] = useState(SAMPLES[0].key);
  const [custom, setCustom] = useState<{
    plan: ActionPlan;
    availability: Availability;
  } | null>(null);
  const [scheduleResult, setScheduleResult] = useState<Schedule | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter | null>(null);

  const sample = SAMPLES.find((s) => s.key === sampleKey)!;
  const active = custom
    ? { plan: custom.plan, availability: custom.availability }
    : { plan: sample.plan, availability: sample.availability };

  const run = () => {
    start(async () => {
      setError(null);
      const result = await generateSchedule({
        plan: active.plan,
        availability: active.availability,
        range: DEFAULT_RANGE,
      });
      if (!result.ok) {
        setError(
          result.errors.map((e) => `${e.path}: ${e.message}`).join("\n")
        );
        return;
      }
      setScheduleResult(result.schedule);
    });
  };

  const exportICS = () => {
    if (!scheduleResult) return;
    const ics = toICS(active.plan, scheduleResult);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elyx-${active.plan.memberName.toLowerCase().replace(/\s+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container mx-auto p-6 flex flex-col gap-6 max-w-screen-2xl">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Elyx Resource Allocator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Turn a prioritised health plan into a personalised calendar.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Input</CardTitle>
          <SchemaHelpDialog />
        </CardHeader>
        <CardContent className="flex items-end gap-4 flex-wrap">
          <SamplePicker
            value={sampleKey}
            onChange={(k) => {
              setSampleKey(k);
              setCustom(null);
              setScheduleResult(null);
            }}
          />
          <UploadPanel
            onLoaded={(plan, availability) => {
              setCustom({ plan, availability });
              setScheduleResult(null);
            }}
          />
          <Separator
            orientation="vertical"
            className="h-10 hidden sm:block"
          />
          <Button onClick={run} disabled={pending} size="lg">
            <Sparkles className="size-4 mr-1" />
            {pending ? "Generating…" : "Generate schedule"}
          </Button>
          {custom && (
            <span className="text-xs text-muted-foreground">
              Using uploaded data ({custom.plan.memberName})
            </span>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="whitespace-pre-wrap">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {pending && !scheduleResult && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px]" />
        </div>
      )}

      {!scheduleResult && !pending && !error && <EmptyState />}

      {scheduleResult && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <SummaryBar
              summary={scheduleResult.summary}
              onSelect={setFilter}
            />
            <Button variant="outline" onClick={exportICS}>
              <Download className="size-4 mr-1" /> Export .ics
            </Button>
          </div>
          <WeeklyCalendar schedule={scheduleResult} plan={active.plan} />
          <FailuresSheet
            filter={filter}
            schedule={scheduleResult}
            plan={active.plan}
            onClose={() => setFilter(null)}
          />
        </>
      )}
    </main>
  );
}
