"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { QueueRow } from "./QueueRow";
import { EmptyQueue } from "./EmptyQueue";
import type { OfficerQueueItem } from "@/types";

interface QueueTableProps {
  items: OfficerQueueItem[];
  onSelect: (applicationId: string) => void;
}

export function QueueTable({ items, onSelect }: QueueTableProps) {
  if (items.length === 0) {
    return <EmptyQueue />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Application ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Risk Score</TableHead>
          <TableHead>Scrutiny</TableHead>
          <TableHead className="text-right">Readiness</TableHead>
          <TableHead>Top Issue</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <QueueRow
            key={item.applicationId}
            item={item}
            onClick={() => onSelect(item.applicationId)}
          />
        ))}
      </TableBody>
    </Table>
  );
}
