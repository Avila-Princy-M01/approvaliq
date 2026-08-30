"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CitationBadge } from "./CitationBadge";
import { buildDecisionTraces } from "@/lib/explanation/explain";
import type { Approval, BusinessProfile } from "@/types";

interface TraceExplainerProps {
  profile: BusinessProfile;
  approval: Approval;
}

export function TraceExplainer({ profile, approval }: TraceExplainerProps) {
  const traces = buildDecisionTraces(profile, approval);
  const matchedTraces = traces.filter((t) => t.matched);
  const unmatchedTraces = traces.filter((t) => !t.matched);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="matched">
        <TabsList>
          <TabsTrigger value="matched">
            Why applicable? ({matchedTraces.length})
          </TabsTrigger>
          <TabsTrigger value="unmatched">
            Why not applicable? ({unmatchedTraces.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matched" className="space-y-2 mt-4">
          {matchedTraces.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No rule conditions were met for this approval.
            </p>
          ) : (
            matchedTraces.map((trace, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">{trace.condition}</p>
                    <p className="text-xs text-muted-foreground">
                      Applicant value: <span className="font-mono">{String(trace.applicantValue)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expected: <span className="font-mono">{trace.expectedCondition}</span>
                    </p>
                  </div>
                  <CitationBadge citation={trace.citation} />
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="unmatched" className="space-y-2 mt-4">
          {unmatchedTraces.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              All rule conditions were met for this approval.
            </p>
          ) : (
            unmatchedTraces.map((trace, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">{trace.condition}</p>
                    <p className="text-xs text-muted-foreground">
                      Applicant value: <span className="font-mono">{String(trace.applicantValue)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expected: <span className="font-mono">{trace.expectedCondition}</span>
                    </p>
                  </div>
                  <CitationBadge citation={trace.citation} />
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
