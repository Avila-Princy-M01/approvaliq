"use client";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyQueue() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium text-muted-foreground">
          No applications in the queue
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          All applications have been processed or no new submissions are pending.
        </p>
      </CardContent>
    </Card>
  );
}
