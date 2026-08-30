"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tilt3DCard } from "@/components/3d/Tilt3DCard";
import { Sliders, TrendingUp, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import type { ChangeImpactResult } from "@/types";

const STATUTORY_RULES = [
  {
    id: "factory-license-workers-power",
    name: "Factories Act (Power + Workers Threshold)",
    conditionIndex: 1,
    label: "Worker Count Threshold (With Power)",
    defaultVal: 10,
    min: 5,
    max: 50,
    unit: "workers",
  },
  {
    id: "factory-license-workers-nopower",
    name: "Factories Act (No Power Workers Threshold)",
    conditionIndex: 1,
    label: "Worker Count Threshold (Without Power)",
    defaultVal: 20,
    min: 10,
    max: 100,
    unit: "workers",
  },
  {
    id: "building-plan-area-threshold",
    name: "Factories / Building Plan (Area Limit)",
    conditionIndex: 0,
    label: "Facility Area Minimum Threshold",
    defaultVal: 500,
    min: 200,
    max: 5000,
    unit: "sq ft",
  },
  {
    id: "fire-noc-area-safety",
    name: "Fire Safety Act (NOC Area Minimum)",
    conditionIndex: 0,
    label: "Fire NOC Premises Minimum Area",
    defaultVal: 500,
    min: 200,
    max: 5000,
    unit: "sq ft",
  },
];

export default function ChangeImpactPage() {
  const [selectedRule, setSelectedRule] = useState(STATUTORY_RULES[0]);
  const [newValue, setNewValue] = useState(selectedRule.defaultVal);
  const [impact, setImpact] = useState<ChangeImpactResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runImpactCalculation = useCallback(async (ruleId: string, condIdx: number, val: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/change-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleId,
          conditionIndex: condIdx,
          newValue: val,
        }),
      });
      if (res.ok) {
        const data: ChangeImpactResult = await res.json();
        setImpact(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/change-impact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruleId: selectedRule.id,
        conditionIndex: selectedRule.conditionIndex,
        newValue,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setImpact(data);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [selectedRule.id, selectedRule.conditionIndex, newValue]);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-purple-500/40 text-purple-400 font-mono text-xs">
              MAHARASHTRA POLICY IMPACT SIMULATOR
            </Badge>
            <span className="text-xs text-gray-400 font-mono">
              • Baseline: {impact?.totalBusinessesEvaluated ?? 13} Seeded Businesses
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Statutory Threshold Change Impact</h1>
          <p className="text-sm text-gray-400">
            Simulate how revising statutory threshold conditions under Maharashtra law affects business approval requirements state-wide.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Tilt3DCard glowColor="purple" intensity={6} className="sticky top-24">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  <span>Rule Threshold Controls</span>
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-gray-300">Select Statutory Rule</label>
                  <select
                    className="w-full mt-1.5 h-11 rounded-xl bg-slate-900/90 border border-white/10 px-3 text-xs text-white focus:border-purple-500"
                    value={selectedRule.label}
                    onChange={(e) => {
                      const r = STATUTORY_RULES.find((rule) => rule.label === e.target.value);
                      if (r) {
                        setSelectedRule(r);
                        setNewValue(r.defaultVal);
                      }
                    }}
                  >
                    {STATUTORY_RULES.map((r) => (
                      <option key={r.label} value={r.label} className="bg-slate-900 text-white">
                        {r.name} - {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-400">Hypothetical New Value</span>
                    <span className="text-lg font-extrabold text-purple-400 font-mono">
                      {newValue} {selectedRule.unit}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={selectedRule.min}
                    max={selectedRule.max}
                    step={selectedRule.unit === "sq ft" ? 50 : 1}
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-gray-400">
                    <span>Min: {selectedRule.min} {selectedRule.unit}</span>
                    <span>Baseline: {selectedRule.defaultVal}</span>
                    <span>Max: {selectedRule.max} {selectedRule.unit}</span>
                  </div>
                </div>

                <Button
                  onClick={() => runImpactCalculation(selectedRule.id, selectedRule.conditionIndex, newValue)}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-11 rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>{loading ? "Re-calculating Impact..." : "Re-evaluate State Impact"}</span>
                </Button>
              </div>
            </div>
          </Tilt3DCard>
        </div>

        {/* Results View */}
        <div className="lg:col-span-2 space-y-6">
          {impact && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Tilt3DCard glowColor="purple" intensity={8}>
                  <div className="text-center py-1">
                    <p className="text-3xl font-extrabold text-purple-400">{impact.affected.length}</p>
                    <p className="text-[10px] font-mono text-gray-300 uppercase">Businesses Affected</p>
                  </div>
                </Tilt3DCard>

                <Tilt3DCard glowColor="cyan" intensity={8}>
                  <div className="text-center py-1">
                    <p className="text-3xl font-extrabold text-cyan-400">{impact.totalBusinessesEvaluated}</p>
                    <p className="text-[10px] font-mono text-gray-300 uppercase">Statewide Baseline</p>
                  </div>
                </Tilt3DCard>

                <Tilt3DCard glowColor="emerald" intensity={8}>
                  <div className="text-center py-1">
                    <p className="text-3xl font-extrabold text-emerald-400">
                      {impact.totalBusinessesEvaluated > 0
                        ? ((impact.affected.length / impact.totalBusinessesEvaluated) * 100).toFixed(1)
                        : "0.0"}%
                    </p>
                    <p className="text-[10px] font-mono text-gray-300 uppercase">Impact Share</p>
                  </div>
                </Tilt3DCard>
              </div>

              {/* Affected Companies List */}
              <div className="glass-panel p-6 rounded-2xl space-y-6 border border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <span>Statewide Business Impact Breakdown</span>
                  </h3>
                  <Badge variant="outline" className="border-purple-500/40 text-purple-400 font-mono text-xs">
                    {impact.affected.length} Businesses Changed
                  </Badge>
                </div>

                {impact.affected.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-semibold text-white">No statutory status changes detected</p>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Adjust the slider parameters to test different policy thresholds and analyze business impact.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {impact.affected.map((b, i) => (
                      <div key={b.businessId || i} className="glass-card p-4 rounded-xl border border-white/10 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-white text-sm">{b.name}</h4>
                            <p className="text-xs font-mono text-gray-400">District: {b.district}</p>
                          </div>
                          <Badge variant="outline" className="border-white/10 text-gray-300 font-mono text-[10px]">
                            {b.reason}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {b.newlyRequiredApprovals.length > 0 && (
                            <div className="bg-red-950/30 p-2.5 rounded-lg border border-red-500/30 space-y-1">
                              <p className="font-mono text-red-400 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Newly Required Clearances:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {b.newlyRequiredApprovals.map((app) => (
                                  <Badge key={app} variant="outline" className="border-red-500/40 text-red-300 text-[10px]">
                                    {app}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {b.noLongerRequiredApprovals.length > 0 && (
                            <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/30 space-y-1">
                              <p className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Deregulated / Exempted:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {b.noLongerRequiredApprovals.map((app) => (
                                  <Badge key={app} variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px]">
                                    {app}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
