"use client";

import { Badge } from "@/components/ui/badge";
import type { RiskTier } from "@/types";

interface PriorityBadgeProps {
  tier: RiskTier;
  label?: string;
}

const tierConfig: Record<RiskTier, { className: string }> = {
  high: {
    className: "bg-red-100 text-red-800 border-red-300",
  },
  medium: {
    className: "bg-amber-50 text-amber-700 border-amber-300",
  },
  low: {
    className: "bg-green-50 text-green-700 border-green-300",
  },
};

export function PriorityBadge({ tier, label }: PriorityBadgeProps) {
  const config = tierConfig[tier] || tierConfig.low;

  return (
    <Badge variant="outline" className={config.className}>
      {label || tier.charAt(0).toUpperCase() + tier.slice(1)}
    </Badge>
  );
}
