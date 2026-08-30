"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tilt3DCard } from "@/components/3d/Tilt3DCard";
import { PriorityBadge } from "@/components/officer/PriorityBadge";
import { CitationBadge } from "@/components/officer/CitationBadge";
import { Sliders, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Zap, TrendingUp } from "lucide-react";
import type { BusinessProfile, SimulationResult, SimulationDiff, RiskTier } from "@/types";

const DISTRICTS = [
  "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Kolhapur",
  "Latur", "Amravati", "Nanded", "Ratnagiri", "Dharashiv", "Mumbai Suburban", "Thane"
];

const INDUSTRIES = [
  "food-processing", "textiles", "chemicals", "engineering", "metals",
  "ceramics", "plastics", "pharmaceuticals", "dairy", "paper",
  "auto-components", "paints", "agro-processing", "electronics"
];

function defaultProfile(): BusinessProfile {
  return {
    companyName: "Vanguard Bio-Chem Tech",
    industry: "chemicals",
    district: "Pune",
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
    projectStage: "operating",
  };
}

export default function SimulatePage() {
  const [profile, setProfile] = useState<BusinessProfile>(defaultProfile);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [diffResult, setDiffResult] = useState<SimulationDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof BusinessProfile, value: unknown) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Simulation failed");
      }
      const data: SimulationResult = await res.json();

      // If we already have a previous result, run scenario diff comparison!
      if (result) {
        const diffRes = await fetch("/api/simulate/diff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            previousProfile: result.profile,
            currentProfile: data.profile,
          }),
        });
        if (diffRes.ok) {
          setDiffResult(await diffRes.json());
        }
      }

      setResult(data);

      // Launch celebration 3D confetti burst!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#38bdf8", "#8b5cf6", "#f59e0b"],
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const applicable = result?.approvals.filter((a) => a.applies) ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 font-mono text-xs">
              3D STATUTORY SIMULATION STUDIO
            </Badge>
            <span className="text-xs text-gray-400 font-mono">• Maharashtra State Rules</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Interactive Rule Engine Simulator</h1>
          <p className="text-sm text-gray-400">
            Configure any industrial or commercial business profile to simulate applicable Maharashtra clearances and statutory timelines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Input Form Card */}
        <div className="lg:col-span-1">
          <Tilt3DCard glowColor="emerald" intensity={6} className="sticky top-24">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  <span>Business Attributes</span>
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-400">
                  Form Mode
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-gray-300">Company / Enterprise Name</label>
                  <Input
                    value={profile.companyName ?? ""}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="Acme Manufacturing Ltd"
                    className="bg-slate-900/90 border-white/10 text-white rounded-xl mt-1 text-sm focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-gray-300">Industry Sector</label>
                    <select
                      className="w-full mt-1 h-10 rounded-xl bg-slate-900/90 border border-white/10 px-3 text-xs text-white focus:border-emerald-500"
                      value={profile.industry}
                      onChange={(e) => update("industry", e.target.value)}
                    >
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i} className="bg-slate-900 text-white">
                          {i.replace(/-/g, " ").toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-gray-300">District Zone</label>
                    <select
                      className="w-full mt-1 h-10 rounded-xl bg-slate-900/90 border border-white/10 px-3 text-xs text-white focus:border-emerald-500"
                      value={profile.district}
                      onChange={(e) => update("district", e.target.value)}
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-gray-300">Area (sq ft)</label>
                    <Input
                      type="number"
                      value={profile.areaSqFt}
                      onChange={(e) => update("areaSqFt", Number(e.target.value))}
                      className="bg-slate-900/90 border-white/10 text-white rounded-xl mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-gray-300">Investment (₹ Cr)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={profile.investmentCrore}
                      onChange={(e) => update("investmentCrore", Number(e.target.value))}
                      className="bg-slate-900/90 border-white/10 text-white rounded-xl mt-1 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-gray-300">Workforce (Employees)</label>
                    <Input
                      type="number"
                      value={profile.employees}
                      onChange={(e) => update("employees", Number(e.target.value))}
                      className="bg-slate-900/90 border-white/10 text-white rounded-xl mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-gray-300">Power Load (HP)</label>
                    <Input
                      type="number"
                      value={profile.powerLoadHP ?? 0}
                      onChange={(e) => update("powerLoadHP", Number(e.target.value))}
                      className="bg-slate-900/90 border-white/10 text-white rounded-xl mt-1 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-mono text-gray-300 uppercase tracking-wider">Statutory Risk Parameters</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/5">
                    {[
                      ["usesPower", "Uses Industrial Power"],
                      ["hasBoiler", "Has Pressure Boiler"],
                      ["hazardousMaterials", "Hazardous Chemicals"],
                      ["generatesHazardousWaste", "Hazardous Waste"],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={Boolean(profile[key as keyof BusinessProfile])}
                          onChange={(e) => update(key as keyof BusinessProfile, e.target.checked)}
                          className="rounded accent-emerald-500"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={runSimulation}
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm h-12 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>{loading ? "Calculating Rule Traces..." : "Execute 3D Simulation"}</span>
                </Button>
              </div>
            </div>
          </Tilt3DCard>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="glass-panel border-red-500/30 bg-red-950/20 p-4 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {!result && !error && (
            <div className="glass-panel rounded-2xl p-16 text-center space-y-4 border border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-emerald-400">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white">Engine Ready for Input</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Adjust the business parameters on the left and click &quot;Execute 3D Simulation&quot; to evaluate statutory clearance rules.
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Scenario Comparison (Diff Engine) Banner */}
              {diffResult && (
                <div className="glass-panel p-5 rounded-2xl border-purple-500/30 bg-purple-950/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" /> SCENARIO COMPARISON DIFF ENGINE
                    </span>
                    <Badge variant="outline" className="border-purple-500/40 text-purple-300 font-mono text-[10px]">
                      DELTA COMPARISON
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-white/5">
                      <span className="text-gray-400 font-mono">SLA Timeline Change:</span>
                      <p className={`font-bold ${diffResult.daysChange > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {diffResult.daysChange > 0 ? `+${diffResult.daysChange} Days` : `${diffResult.daysChange} Days`}
                      </p>
                    </div>

                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-white/5">
                      <span className="text-gray-400 font-mono">Statutory Fee Delta:</span>
                      <p className={`font-bold ${diffResult.feeChange > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {diffResult.feeChange > 0 ? `+₹${diffResult.feeChange}` : `₹${diffResult.feeChange}`}
                      </p>
                    </div>

                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-white/5">
                      <span className="text-gray-400 font-mono">Newly Added Clearances:</span>
                      <p className="font-bold text-purple-400">{diffResult.addedApprovals.length}</p>
                    </div>

                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-white/5">
                      <span className="text-gray-400 font-mono">Exempted Clearances:</span>
                      <p className="font-bold text-emerald-400">{diffResult.removedApprovals.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Tilt3DCard glowColor="emerald" intensity={8}>
                  <div className="text-center py-1">
                    <p className="text-3xl font-extrabold text-emerald-400">{result.summary.applicableApprovalCount}</p>
                    <p className="text-[10px] font-mono text-gray-300 uppercase">Clearances Required</p>
                  </div>
                </Tilt3DCard>

                <Tilt3DCard glowColor="cyan" intensity={8}>
                  <div className="text-center py-1">
                    <p className="text-3xl font-extrabold text-cyan-400">{result.summary.uniqueDocumentCount}</p>
                    <p className="text-[10px] font-mono text-gray-300 uppercase">Documents Needed</p>
                  </div>
                </Tilt3DCard>

                <Tilt3DCard glowColor="amber" intensity={8}>
                  <div className="text-center py-1">
                    <p className="text-3xl font-extrabold text-amber-400">{result.summary.criticalPathDays}d</p>
                    <p className="text-[10px] font-mono text-gray-300 uppercase">Critical Path SLA</p>
                  </div>
                </Tilt3DCard>

                <Tilt3DCard glowColor="purple" intensity={8}>
                  <div className="text-center py-1">
                    <p className="text-3xl font-extrabold text-purple-400">₹{(result.summary.indicativeFeeTotal / 1000).toFixed(1)}k</p>
                    <p className="text-[10px] font-mono text-gray-300 uppercase">Est. Statutory Fees</p>
                  </div>
                </Tilt3DCard>
              </div>

              {/* Critical Path Pipeline */}
              {result.summary.criticalPath.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl space-y-4 border border-white/10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-sm font-bold font-mono uppercase text-emerald-400 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>Critical Path Approval Sequence</span>
                    </h3>
                    <span className="text-xs font-mono text-gray-400">{result.summary.criticalPathDays} Days Total SLA</span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {result.summary.criticalPath.map((id, i) => {
                      const approval = result.approvals.find((a) => a.id === id);
                      const isBottleneck = id === result.summary.bottleneckApprovalId;
                      return (
                        <div key={id} className="flex items-center gap-3">
                          {i > 0 && <ArrowRight className="w-4 h-4 text-gray-500" />}
                          <div className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            isBottleneck
                              ? "bg-red-500/20 text-red-400 border-red-500/50 shadow-lg shadow-red-500/20"
                              : "bg-slate-900/80 text-gray-200 border-white/10"
                          }`}>
                            <span>{approval?.name ?? id}</span>
                            {isBottleneck && <span className="ml-1 text-[10px] font-mono text-red-400">(Bottleneck)</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Applicable Approvals List */}
              <div className="glass-panel p-6 rounded-2xl space-y-6 border border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center justify-between">
                  <span>Applicable Statutory Clearances ({applicable.length})</span>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-xs">
                    ACTIVE SCENARIO
                  </Badge>
                </h3>

                <div className="space-y-4">
                  {applicable.map((approval) => (
                    <div key={approval.id} className="glass-card p-5 rounded-2xl border border-white/10 space-y-4 hover:border-emerald-500/30 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-white text-base">{approval.name}</h4>
                          <p className="text-xs text-gray-400 font-mono">{approval.department}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <PriorityBadge tier={approval.riskTier as RiskTier} />
                          {approval.statutoryDays && (
                            <Badge variant="outline" className="border-white/10 font-mono text-xs text-gray-300">
                              {approval.statutoryDays} Days SLA
                            </Badge>
                          )}
                          {approval.indicativeFee != null && approval.indicativeFee > 0 && (
                            <Badge variant="outline" className="border-white/10 font-mono text-xs text-emerald-400">
                              ₹{(approval.indicativeFee / 1000).toFixed(0)}k
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Traces */}
                      {approval.traces.length > 0 && (
                        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                          {approval.traces.map((trace, i) => (
                            <div key={i} className="flex items-start justify-between gap-3 text-xs">
                              <div className="flex items-start gap-2">
                                {trace.matched ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                )}
                                <span className="text-gray-300 font-mono">{trace.condition}</span>
                              </div>
                              <CitationBadge citation={trace.citation} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
