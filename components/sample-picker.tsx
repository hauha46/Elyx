"use client";

import { SAMPLES } from "@/lib/sample-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function SamplePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="sample">Sample member</Label>
      <Select
        value={value}
        onValueChange={(v) => {
          if (typeof v === "string") onChange(v);
        }}
      >
        <SelectTrigger id="sample" className="w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SAMPLES.map((s) => (
            <SelectItem key={s.key} value={s.key}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
