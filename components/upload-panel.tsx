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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ActionPlanSchema,
  AvailabilitySchema,
} from "@/lib/scheduler/schemas";
import type { ActionPlan, Availability } from "@/lib/scheduler/types";
import { UploadZone } from "@/components/upload-zone";
import { Upload } from "lucide-react";

export function UploadPanel({
  onLoaded,
}: {
  onLoaded: (plan: ActionPlan, avail: Availability) => void;
}) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [avail, setAvail] = useState<Availability | null>(null);

  const reset = () => {
    setPlan(null);
    setAvail(null);
  };

  const onLoad = () => {
    if (plan && avail) {
      onLoaded(plan, avail);
      setOpen(false);
      reset();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline">
            <Upload className="size-4 mr-1" /> Upload your own…
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload your action plan + availability</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UploadZone
            label="Plan JSON"
            description="ActionPlan schema"
            parse={(text) => {
              setPlan(ActionPlanSchema.parse(JSON.parse(text)));
            }}
            onValid={() => {}}
            onClear={() => setPlan(null)}
          />
          <UploadZone
            label="Availability JSON"
            description="Availability schema"
            parse={(text) => {
              setAvail(AvailabilitySchema.parse(JSON.parse(text)));
            }}
            onValid={() => {}}
            onClear={() => setAvail(null)}
          />
        </div>

        {(plan || avail) && (
          <Alert>
            <AlertDescription>
              {plan && avail
                ? `Ready: "${plan.memberName}" with ${plan.activities.length} activities and ${avail.resources.length} resources.`
                : "Drop the other file to enable Load."}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onLoad} disabled={!plan || !avail}>
            Load schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
