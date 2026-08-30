"use client";

import { Badge } from "@/components/ui/badge";

type Status = "pending" | "clarification-requested" | "approved" | "rejected";

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: {
    label: "Pending",
    variant: "secondary",
  },
  "clarification-requested": {
    label: "Clarification Requested",
    variant: "outline",
  },
  approved: {
    label: "Approved",
    variant: "default",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge
      variant={config.variant}
      className={
        status === "clarification-requested"
          ? "border-yellow-500 text-yellow-700 bg-yellow-50"
          : status === "approved"
          ? "border-green-500 text-green-700 bg-green-50"
          : undefined
      }
    >
      {config.label}
    </Badge>
  );
}
