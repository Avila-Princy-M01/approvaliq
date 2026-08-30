"use client";

import { Badge } from "@/components/ui/badge";
import type { Citation } from "@/types";

interface CitationBadgeProps {
  citation: Citation | null;
}

export function CitationBadge({ citation }: CitationBadgeProps) {
  if (!citation) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
        Evidence unavailable
      </Badge>
    );
  }

  if (citation.verificationStatus === "needs-review") {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
        Needs review — {citation.sourceTitle}
      </Badge>
    );
  }

  // verified
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
      Verified — {citation.sourceTitle}
    </Badge>
  );
}
