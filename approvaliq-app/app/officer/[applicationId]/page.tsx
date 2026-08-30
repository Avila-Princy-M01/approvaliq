"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RiskBreakdown } from "@/components/officer/RiskBreakdown";
import { TraceExplainer } from "@/components/officer/TraceExplainer";
import { AuditTimeline } from "@/components/officer/AuditTimeline";
import { DecisionPanel } from "@/components/officer/DecisionPanel";
import { useToast } from "@/components/shared/Toaster";
import type {
  OfficerQueueItem,
  AuditEvent,
  RiskAssessment,
  Approval,
  BusinessProfile,
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
  const { addToast } = useToast();

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

  // For the evidence tab, we need a simulated profile to feed TraceExplainer
  // Since the officer detail doesn't return the full profile, we derive
  // a minimal one from the queue item
  const buildProfileFromQueue = (item: OfficerQueueItem): BusinessProfile => ({
    companyName: item.companyName,
    industry: "manufacturing",
    district: item.district,
    areaSqFt: 5000,
    investmentCrore: 5,
    employees: 40,
    usesPower: true,
    hasBoiler: false,
    hazardousMaterials: false,
    generatesHazardousWaste: false,
    projectStage: "operating",
  });

  if (loading || !data) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
        {/* Skeleton loading */}
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <Separator />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const { queueItem, risk, audit } = data;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
      {/* Back navigation */}
      <Link
        href="/officer"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
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
        <div className="flex items-center gap-2">
          <StatusBadge status={queueItem.status} />
          {queueItem.recommendation && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
              ⚠️ Advisory Only
            </Badge>
          )}
        </div>
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
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold">{queueItem.readinessScore}%</p>
                <p className="text-xs text-muted-foreground">Readiness</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold">{queueItem.submissionRisk}</p>
                <p className="text-xs text-muted-foreground">Submission Risk</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold capitalize">{queueItem.regulatoryScrutiny}</p>
                <p className="text-xs text-muted-foreground">Reg. Scrutiny</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold capitalize">{queueItem.priority}</p>
                <p className="text-xs text-muted-foreground">Priority</p>
              </CardContent>
            </Card>
          </div>

          {/* Advisory Recommendation */}
          {queueItem.recommendation && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-amber-800 italic flex items-center gap-2">
                  ⚠️ Advisory Recommendation — Final decision remains with the officer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{queueItem.recommendation.action.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                <p className="text-sm text-muted-foreground mt-1">{queueItem.recommendation.rationale}</p>
              </CardContent>
            </Card>
          )}

          {/* Business Profile Card */}
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
                <p className="text-sm text-muted-foreground">Top Issue</p>
                <p className="font-medium">{queueItem.topIssue || "None detected"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Decision Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Decision Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <DecisionPanel
                applicationId={applicationId}
                currentStatus={queueItem.status}
                onDecisionSubmitted={() => {
                  addToast("Decision recorded successfully", "success");
                  fetchData();
                }}
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
              Each trace shows the rule condition, applicant value, match status,
              and supporting citation where available.
            </p>

            {/* We use a simplified trace view here since we don't have the full
                simulation data in the detail response. The evidence is derived
                from the risk assessment and audit trail. */}
            <Card>
              <CardContent className="py-6 space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Submission Risk Factors</h4>
                  {risk.submissionRisk.factors.map((factor, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{factor.label}</span>
                        {factor.points !== undefined && factor.points > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            +{factor.points} pts
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{factor.reason}</p>
                      {factor.evidence && factor.evidence.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {factor.evidence.map((ev, j) => (
                            <Badge key={j} variant="outline" className="text-xs">
                              📄 {ev}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Regulatory Complexity Factors</h4>
                  {risk.regulatoryScrutiny.factors.map((factor, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-1">
                      <span className="font-medium text-sm">{factor.label}</span>
                      <p className="text-sm text-muted-foreground">{factor.reason}</p>
                    </div>
                  ))}
                  {risk.regulatoryScrutiny.factors.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No significant regulatory complexity factors.
                    </p>
                  )}
                </div>

                <Separator />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 italic">
                    Regulatory scrutiny reflects process complexity, not wrongdoing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Audit Trail</h3>
            <p className="text-sm text-muted-foreground">
              Complete history of all actions taken on this application.
            </p>
            <AuditTimeline events={audit} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
