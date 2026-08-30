"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tilt3DCard } from "@/components/3d/Tilt3DCard";
import { CitationGraph3D } from "@/components/3d/CitationGraph3D";
import { RiskBreakdown } from "@/components/officer/RiskBreakdown";
import { AuditTimeline } from "@/components/officer/AuditTimeline";
import { DecisionPanel } from "@/components/officer/DecisionPanel";
import { useToast } from "@/components/shared/Toaster";
import { explainApproval } from "@/lib/evidence/explain";
import { evaluateApprovals } from "@/lib/engine";
import { ArrowLeft, ShieldAlert, FileText, History, AlertTriangle, BookOpen } from "lucide-react";
import type {
  OfficerQueueItem,
  AuditEvent,
  RiskAssessment,
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

  const fetchData = useCallback(async () => {
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
  }, [applicationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate deterministic statutory explanations for applicable clearances
  const statutoryExplanations = useMemo(() => {
    if (!data?.queueItem) return [];
    // Evaluate approvals for demo profile
    const dummyProfile = {
      companyName: data.queueItem.companyName,
      industry: "chemicals",
      district: data.queueItem.district,
      areaSqFt: 15000,
      investmentCrore: 18.5,
      employees: 85,
      usesPower: true,
      powerLoadHP: 120,
      hasBoiler: true,
      boilerCapacityLitres: 2500,
      hazardousMaterials: true,
      generatesHazardousWaste: true,
      annualTurnoverLakh: 1200,
      projectStage: "operating" as const,
    };
    const approvals = evaluateApprovals(dummyProfile).filter((a) => a.applies);
    return approvals.map((app) => ({
      approval: app,
      explanation: explainApproval(app),
    }));
  }, [data]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-6 w-36 bg-slate-900 animate-pulse rounded-lg" />
        <div className="h-12 w-80 bg-slate-900 animate-pulse rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-900 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { queueItem, risk, audit } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Back Link */}
      <Link
        href="/officer"
        className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Officer Review Queue</span>
      </Link>

      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-xs">
              SCRUTINY DOSSIER
            </Badge>
            <span className="text-xs font-mono text-gray-400">{queueItem.applicationId}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{queueItem.companyName}</h1>
          <p className="text-xs text-gray-400 font-mono mt-1">District Zone: {queueItem.district}</p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={queueItem.status} />
          {queueItem.recommendation && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-950/40 text-amber-400 text-xs font-mono py-1 px-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>AI Advisory Only</span>
            </Badge>
          )}
        </div>
      </div>

      {/* 3D Stat Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tilt3DCard glowColor="emerald" intensity={8}>
          <div className="text-center py-1">
            <p className="text-3xl font-extrabold text-emerald-400">{queueItem.readinessScore}%</p>
            <p className="text-[10px] font-mono text-gray-300 uppercase">Readiness Score</p>
          </div>
        </Tilt3DCard>

        <Tilt3DCard glowColor="amber" intensity={8}>
          <div className="text-center py-1">
            <p className="text-3xl font-extrabold text-amber-400">{queueItem.submissionRisk}</p>
            <p className="text-[10px] font-mono text-gray-300 uppercase">Submission Risk</p>
          </div>
        </Tilt3DCard>

        <Tilt3DCard glowColor="cyan" intensity={8}>
          <div className="text-center py-1">
            <p className="text-3xl font-extrabold text-cyan-400 capitalize">{queueItem.regulatoryScrutiny}</p>
            <p className="text-[10px] font-mono text-gray-300 uppercase">Reg. Scrutiny</p>
          </div>
        </Tilt3DCard>

        <Tilt3DCard glowColor="purple" intensity={8}>
          <div className="text-center py-1">
            <p className="text-3xl font-extrabold text-purple-400 capitalize">{queueItem.priority}</p>
            <p className="text-[10px] font-mono text-gray-300 uppercase">Queue Priority</p>
          </div>
        </Tilt3DCard>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-900/80 border border-white/10 p-1 rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs font-mono">
            Overview
          </TabsTrigger>
          <TabsTrigger value="explanations" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs font-mono">
            Statutory Explanations
          </TabsTrigger>
          <TabsTrigger value="risk" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs font-mono">
            Risk Analysis
          </TabsTrigger>
          <TabsTrigger value="evidence" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs font-mono">
            Evidence Graph
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs font-mono">
            Audit Trail
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {queueItem.recommendation && (
            <div className="glass-panel p-5 rounded-2xl border-amber-500/30 bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-bold font-mono">
                <AlertTriangle className="w-4 h-4" />
                <span>AI Statutory Recommendation: {queueItem.recommendation.action.toUpperCase()}</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{queueItem.recommendation.rationale}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Application Summary & Profile</span>
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-400 font-mono">Company Name</p>
                  <p className="font-semibold text-white mt-1">{queueItem.companyName}</p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-400 font-mono">District Region</p>
                  <p className="font-semibold text-white mt-1">{queueItem.district}</p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-400 font-mono">Application Reference</p>
                  <p className="font-semibold font-mono text-emerald-400 mt-1">{queueItem.applicationId}</p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-400 font-mono">Top Detected Issue</p>
                  <p className="font-semibold text-white mt-1">{queueItem.topIssue || "No major compliance flags"}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <span>Officer Decision Console</span>
              </h2>
              <DecisionPanel
                applicationId={applicationId}
                currentStatus={queueItem.status}
                onDecisionSubmitted={() => {
                  addToast("Officer decision successfully recorded to immutable audit log", "success");
                  fetchData();
                }}
              />
            </div>
          </div>
        </TabsContent>

        {/* Statutory Explanations Tab */}
        <TabsContent value="explanations" className="space-y-6 mt-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span>Deterministic Statutory Explanations</span>
            </h3>
            <p className="text-xs text-gray-400">
              Human-readable compliance rationales generated deterministically from rule engine decision traces.
            </p>

            <div className="space-y-4 pt-2">
              {statutoryExplanations.map(({ approval, explanation }) => (
                <div key={approval.id} className="glass-card p-4 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{approval.name}</h4>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-[10px]">
                      {approval.department}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-300 font-sans leading-relaxed">{explanation.explanation}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {explanation.usedClauseIds.map((cid) => (
                      <Badge key={cid} variant="outline" className="border-white/10 text-gray-400 font-mono text-[9px]">
                        Clause: {cid.split("/").pop()}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk" className="space-y-6 mt-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <RiskBreakdown
              type="submission"
              submissionRisk={risk.submissionRisk as RiskAssessment["submissionRisk"] & { topIssue?: string | null }}
            />
            <div className="border-t border-white/10 pt-6">
              <RiskBreakdown
                type="scrutiny"
                regulatoryScrutiny={risk.regulatoryScrutiny}
              />
            </div>
          </div>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CitationGraph3D />

            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white">Statutory Evidence Factors</h3>
              <div className="space-y-3">
                {risk.submissionRisk.factors.map((factor, i) => (
                  <div key={i} className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 space-y-1">
                    <p className="text-xs font-semibold text-white">{factor.label}</p>
                    <p className="text-xs text-gray-400">{factor.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="mt-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              <span>Application Audit Trail</span>
            </h3>
            <AuditTimeline events={audit} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
