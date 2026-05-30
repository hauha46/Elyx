"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ActionPlanSchema,
  AvailabilitySchema,
} from "@/lib/scheduler/schemas";
import type { ActionPlan, Availability } from "@/lib/scheduler/types";

export function UploadPanel({
  onLoaded,
}: {
  onLoaded: (plan: ActionPlan, avail: Availability) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handle = async (planFile: File, availFile: File) => {
    setError(null);
    try {
      const plan = ActionPlanSchema.parse(JSON.parse(await planFile.text()));
      const avail = AvailabilitySchema.parse(
        JSON.parse(await availFile.text())
      );
      onLoaded(plan, avail);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Upload your own…</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload plan + availability</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const p = fd.get("plan") as File;
            const a = fd.get("avail") as File;
            if (p && a) await handle(p, a);
          }}
        >
          <label className="text-sm">
            Plan JSON
            <input
              type="file"
              name="plan"
              accept="application/json"
              required
              className="block mt-1 text-sm"
            />
          </label>
          <label className="text-sm">
            Availability JSON
            <input
              type="file"
              name="avail"
              accept="application/json"
              required
              className="block mt-1 text-sm"
            />
          </label>
          <Button type="submit">Load</Button>
          {error && (
            <pre className="text-xs text-destructive whitespace-pre-wrap">
              {error}
            </pre>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
