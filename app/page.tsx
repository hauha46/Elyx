"use client";

import { useState, useTransition } from "react";
import { SamplePicker } from "@/components/sample-picker";
import { UploadPanel } from "@/components/upload-panel";
import { SummaryBar } from "@/components/summary-bar";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SAMPLES } from "@/lib/sample-data";
import { generateSchedule } from "@/app/actions/schedule";
import type {
  ActionPlan,
  Availability,
  Schedule,
} from "@/lib/scheduler/types";

const DEFAULT_RANGE = { start: "2026-06-01", end: "2026-08-23" };

export default function Page() {
  const [sampleKey, setSampleKey] = useState(SAMPLES[0].key);
  const [custom, setCustom] = useState<{
    plan: ActionPlan;
    availability: Availability;
  } | null>(null);
  const [scheduleResult, setScheduleResult] = useState<Schedule | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sample = SAMPLES.find((s) => s.key === sampleKey)!;
  const active = custom
    ? { plan: custom.plan, availability: custom.availability, label: "Custom upload" }
    : { plan: sample.plan, availability: sample.availability, label: sample.label };

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

  return (
    <main className="container mx-auto p-6 flex flex-col gap-6 max-w-screen-2xl">
      <header>
        <h1 className="text-2xl font-semibold">Elyx Resource Allocator</h1>
        <p className="text-sm text-muted-foreground">
          Generate a personalised calendar from an action plan + resource
          availability.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
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
          <Button onClick={run} disabled={pending}>
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
        <pre className="text-sm text-destructive whitespace-pre-wrap">
          {error}
        </pre>
      )}

      {scheduleResult && (
        <>
          <SummaryBar summary={scheduleResult.summary} />
          <WeeklyCalendar schedule={scheduleResult} plan={active.plan} />
        </>
      )}
    </main>
  );
}
