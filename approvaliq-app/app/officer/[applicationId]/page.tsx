"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RiskBreakdown } from "@/components/officer/RiskBreakdown";
import { TraceExplainer } from "@/components/officer/TraceExplainer";
import { AuditTimeline } from "@/components/officer/AuditTimeline";
import { DecisionPanel } from "@/components/officer/DecisionPanel";
import type {
  OfficerQueueItem,
  AuditEvent,
  RiskAssessment,
  Approval,
} from "@/types";

interface OfficerDetailData {
  queueItem: OfficerQueueItem;
  risk: RiskAssessment;
  audit: AuditEvent[];
}

export default function OfficerDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const [applicationId, setApplicationId] = useState<string>("");
  const [data, setData] = useState<OfficerDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setApplicationId(p.applicationId));
  }, [params]);

  const fetchData = async () => {
    if (!applicationId) return;
    try {
      const response = await fetch(`/api/officer/${applicationId}`);
      if (response.ok) {
        const detail = await response.json();
        setData(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [applicationId]);

  if (loading || !data) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <p className="text-muted-foreground">Loading application details...</p>
      </div>
    );
  }

  const { queueItem, risk, audit } = data;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
      {/* Back navigation */}
      <Link
        href="/officer"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to queue
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{queueItem.companyName}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            {queueItem.applicationId}
          </p>
        </div>
        <StatusBadge status={queueItem.status} />
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Applicant Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="font-medium">{queueItem.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">District</p>
                <p className="font-medium">{queueItem.district}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Application ID</p>
                <p className="font-mono text-sm">{queueItem.applicationId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Readiness Score</p>
                <p className="font-medium">{queueItem.readinessScore}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground italic">
                Advisory recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                This is an advisory recommendation based on automated rule evaluation.
                The final decision rests with the reviewing officer.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Decision Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <DecisionPanel
                applicationId={applicationId}
                currentStatus={queueItem.status}
                onDecisionSubmitted={fetchData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk" className="space-y-6 mt-6">
          <RiskBreakdown
            type="submission"
            submissionRisk={risk.submissionRisk as RiskAssessment["submissionRisk"] & { topIssue?: string | null }}
          />

          <Separator />

          <RiskBreakdown
            type="scrutiny"
            regulatoryScrutiny={risk.regulatoryScrutiny}
          />
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Evidence & Citations</h3>
            <p className="text-sm text-muted-foreground">
              Review the decision traces for each applicable approval.
            </p>

            {/* For now, show a placeholder for the evidence tab */}
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">
                  Evidence traces are available through the simulation engine.
                  Each applicable approval&apos;s decision traces show the rule conditions
                  that were evaluated and the supporting citations.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Audit Trail</h3>
            <AuditTimeline events={audit} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
