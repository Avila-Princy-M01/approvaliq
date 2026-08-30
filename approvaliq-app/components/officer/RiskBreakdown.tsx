"use client";

import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PriorityBadge } from "./PriorityBadge";
import type { RiskAssessment, RiskTier } from "@/types";

interface RiskBreakdownProps {
  type: "submission" | "scrutiny";
  submissionRisk?: RiskAssessment["submissionRisk"] & { topIssue?: string | null };
  regulatoryScrutiny?: RiskAssessment["regulatoryScrutiny"];
}

export function RiskBreakdown({
  type,
  submissionRisk,
  regulatoryScrutiny,
}: RiskBreakdownProps) {
  if (type === "submission") {
    if (!submissionRisk) {
      return (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Submission Risk</h3>
          <p className="text-muted-foreground">Risk data unavailable</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Submission Risk</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Risk Score</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{submissionRisk.score}</span>
              <PriorityBadge tier={submissionRisk.level as RiskTier} />
            </div>
          </div>
          <Progress value={submissionRisk.score} className="h-2" />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Risk Factors</h4>
          {submissionRisk.factors.map((factor, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{factor.label}</span>
                {factor.points !== undefined && factor.points > 0 && (
                  <span className="text-sm font-mono text-destructive">
                    +{factor.points} pts
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{factor.reason}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Scrutiny type
  if (!regulatoryScrutiny) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Regulatory Scrutiny</h3>
        <p className="text-muted-foreground">Risk data unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Regulatory Scrutiny</h3>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Level</span>
        <PriorityBadge tier={regulatoryScrutiny.level as RiskTier} />
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Scrutiny Factors</h4>
        {regulatoryScrutiny.factors.map((factor, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-1">
            <span className="font-medium">{factor.label}</span>
            <p className="text-sm text-muted-foreground">{factor.reason}</p>
          </div>
        ))}
        {regulatoryScrutiny.factors.length === 0 && (
          <p className="text-sm text-muted-foreground">No significant scrutiny factors</p>
        )}
      </div>

      <Alert>
        <AlertDescription>
          Regulatory scrutiny reflects process complexity, not wrongdoing.
        </AlertDescription>
      </Alert>
    </div>
  );
}
