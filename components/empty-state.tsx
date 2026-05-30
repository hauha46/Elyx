import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";

export function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center text-center py-16 gap-3">
        <CalendarCheck className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-medium">No schedule yet</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Pick a sample member or upload your own plan + availability, then
          click
          <span className="font-medium"> Generate schedule</span>. The
          personalised calendar will appear here.
        </p>
      </CardContent>
    </Card>
  );
}
