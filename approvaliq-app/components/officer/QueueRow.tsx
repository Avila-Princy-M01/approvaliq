"use client";

import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import type { OfficerQueueItem } from "@/types";

interface QueueRowProps {
  item: OfficerQueueItem;
  onClick: () => void;
}

export function QueueRow({ item, onClick }: QueueRowProps) {
  return (
    <TableRow className="cursor-pointer" onClick={onClick}>
      <TableCell className="font-medium">{item.companyName}</TableCell>
      <TableCell className="text-muted-foreground font-mono text-xs">
        {item.applicationId}
      </TableCell>
      <TableCell>
        <StatusBadge status={item.status} />
      </TableCell>
      <TableCell>
        <PriorityBadge tier={item.priority} label={`${item.submissionRisk}`} />
      </TableCell>
      <TableCell>
        <PriorityBadge tier={item.regulatoryScrutiny} />
      </TableCell>
      <TableCell className="text-right">{item.readinessScore}%</TableCell>
      <TableCell className="max-w-[200px] truncate text-muted-foreground">
        {item.topIssue || "—"}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          Open
        </Button>
      </TableCell>
    </TableRow>
  );
}
