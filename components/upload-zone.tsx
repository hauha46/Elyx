"use client";
import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, X, FileJson } from "lucide-react";

type Status =
  | { kind: "empty" }
  | { kind: "valid"; file: File; size: number }
  | { kind: "invalid"; file: File; error: string };

export function UploadZone({
  label,
  description,
  parse,
  onValid,
  onClear,
}: {
  label: string;
  description: string;
  parse: (text: string) => void;
  onValid: (file: File) => void;
  onClear: () => void;
}) {
  const [status, setStatus] = useState<Status>({ kind: "empty" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        JSON.parse(text);
        parse(text);
        setStatus({ kind: "valid", file, size: file.size });
        onValid(file);
      } catch (e) {
        setStatus({
          kind: "invalid",
          file,
          error: e instanceof Error ? e.message : "Invalid JSON",
        });
      }
    },
    [parse, onValid]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => status.kind === "empty" && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer min-h-[160px]",
          dragging && "border-primary bg-primary/5",
          status.kind === "valid" &&
            "border-green-500/40 bg-green-500/5 cursor-default",
          status.kind === "invalid" && "border-destructive/50 bg-destructive/5",
          status.kind === "empty" &&
            !dragging &&
            "border-border hover:border-muted-foreground/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {status.kind === "empty" && (
          <>
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm text-center">
              <span className="font-medium">Click to browse</span> or drop a JSON
              file here
            </p>
          </>
        )}

        {status.kind === "valid" && (
          <>
            <FileJson className="size-8 text-green-600" />
            <p className="text-sm font-medium">{status.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(status.size / 1024).toFixed(1)} KB · validated
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setStatus({ kind: "empty" });
                onClear();
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute top-2 right-2"
            >
              <X className="size-4" />
            </Button>
          </>
        )}

        {status.kind === "invalid" && (
          <>
            <FileJson className="size-8 text-destructive" />
            <p className="text-sm font-medium">{status.file.name}</p>
            <p className="text-xs text-destructive text-center max-w-full break-words line-clamp-3">
              {status.error}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setStatus({ kind: "empty" });
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
