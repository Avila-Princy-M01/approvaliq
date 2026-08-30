"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tilt3DCard } from "@/components/3d/Tilt3DCard";
import { FileText, AlertTriangle, Zap, Cpu } from "lucide-react";
import type { DryRunResult, RequiredDocument, ExtractedField } from "@/types";

const DOCUMENT_PACKS = [
  { id: "demo-mismatch", label: "Demo Pack (Cross-Document Contradiction Mismatch)" },
  { id: "demo-complete", label: "Demo Pack (Complete Valid Document Suite)" },
  { id: "demo-missing-fire", label: "Demo Pack (Missing Mandatory Fire Safety NOC)" },
];

export default function MaitriPage() {
  const [selectedPack, setSelectedPack] = useState("demo-mismatch");
  const [result, setResult] = useState<DryRunResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runDryRunValidation = useCallback(async (pack: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/dryrun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentPack: pack }),
      });
      if (res.ok) {
        const data: DryRunResult = await res.json();
        setResult(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/dryrun", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentPack: selectedPack }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setResult(data);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [selectedPack]);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-xs">
              MAITRI SINGLE-WINDOW GATEWAY
            </Badge>
            <span className="text-xs text-gray-400 font-mono">• Document Validation Tracer</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Cross-Document Verification Engine</h1>
          <p className="text-sm text-gray-400">
            Automatically extracts document attributes, detects cross-document name/address contradictions, and predicts officer scrutiny queries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Selector Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Tilt3DCard glowColor="cyan" intensity={6} className="sticky top-24">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span>Document Pack Selector</span>
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-gray-300">Choose Fixture Pack</label>
                  <select
                    className="w-full mt-1.5 h-11 rounded-xl bg-slate-900/90 border border-white/10 px-3 text-xs text-white focus:border-cyan-500"
                    value={selectedPack}
                    onChange={(e) => setSelectedPack(e.target.value)}
                  >
                    {DOCUMENT_PACKS.map((pack) => (
                      <option key={pack.id} value={pack.id} className="bg-slate-900 text-white">
                        {pack.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={() => runDryRunValidation(selectedPack)}
                  disabled={loading}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs h-11 rounded-xl shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>{loading ? "Extracting Fields..." : "Re-run Dry-Run Validation"}</span>
                </Button>
              </div>
            </div>
          </Tilt3DCard>
        </div>

        {/* Validation Results */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <>
              {/* Stat Gauges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Tilt3DCard glowColor={result.readiness.overall > 80 ? "emerald" : "amber"} intensity={8}>
                  <div className="text-center py-1">
                    <p className="text-3xl font-extrabold text-emerald-400">{result.readiness.overall}%</p>
                    <p className="text-[10px] font-mono text-gray-300 uppercase">Readiness Score</p>
                  </div>
                </Tilt3DCard>

                <Tilt3DCard glowColor="cyan" intensity={8}>
                  <div className="text-center py-1">
                    <p className="text-3xl font-extrabold text-cyan-400">{result.documentsFound}/{result.documentsExpected}</p>
                    <p className="text-[10px] font-mono text-gray-300 uppercase">Uploaded Docs</p>
                  </div>
                </Tilt3DCard>

                <Tilt3DCard glowColor={result.contradictions.length > 0 ? "purple" : "emerald"} intensity={8}>
                  <div className="text-center py-1">
                    <p className="text-3xl font-extrabold text-red-400">{result.contradictions.length}</p>
                    <p className="text-[10px] font-mono text-gray-300 uppercase">Contradictions</p>
                  </div>
                </Tilt3DCard>

                <Tilt3DCard glowColor="amber" intensity={8}>
                  <div className="text-center py-1">
                    <p className="text-3xl font-extrabold text-amber-400">{result.predictedQueries.length}</p>
                    <p className="text-[10px] font-mono text-gray-300 uppercase">Predicted Queries</p>
                  </div>
                </Tilt3DCard>
              </div>

              {/* Contradictions Detected Alert Card */}
              {result.contradictions.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl border-red-500/30 bg-red-950/20 space-y-4">
                  <h3 className="text-sm font-bold font-mono text-red-400 uppercase flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cross-Document Contradiction Alert Detected</span>
                  </h3>
                  <div className="space-y-3">
                    {result.contradictions.map((c) => (
                      <div key={c.id} className="bg-slate-950/80 p-4 rounded-xl border border-red-500/20 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">{c.label} ({c.field})</span>
                          <Badge
                            variant="outline"
                            className={
                              c.severity === "blocking"
                                ? "border-red-500/40 text-red-400 text-[10px]"
                                : "border-amber-500/40 text-amber-400 text-[10px]"
                            }
                          >
                            {c.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-gray-300">{c.predictedQuery}</p>

                        {c.documents.length >= 2 && (
                          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                            <div className="bg-slate-900 p-2 rounded border border-white/5">
                              <span className="text-gray-400">{c.documents[0]}:</span>{" "}
                              <span className="text-red-400">{String(c.values[0])}</span>
                            </div>
                            <div className="bg-slate-900 p-2 rounded border border-white/5">
                              <span className="text-gray-400">{c.documents[1]}:</span>{" "}
                              <span className="text-red-400">{String(c.values[1])}</span>
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] text-cyan-400 pt-1">
                          <span className="font-mono font-semibold">Recommended Action:</span> {c.recommendedAction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Documents Alert */}
              {result.missingDocuments.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl border-amber-500/30 bg-amber-950/20 space-y-3">
                  <h3 className="text-sm font-bold font-mono text-amber-400 uppercase flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Missing Mandatory Documents ({result.missingDocuments.length})</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingDocuments.map((doc: RequiredDocument | string, i: number) => {
                      const label = typeof doc === "string" ? doc : doc.label;
                      const id = typeof doc === "string" ? `doc-${i}` : doc.id;
                      const isMandatory = typeof doc === "string" ? true : doc.mandatory;

                      return (
                        <Badge
                          key={id}
                          variant="outline"
                          className={
                            isMandatory
                              ? "border-red-500/40 text-red-300 text-xs"
                              : "border-amber-500/40 text-amber-300 text-xs"
                          }
                        >
                          📄 {label} {isMandatory ? "(Mandatory)" : ""}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Predicted Officer Queries */}
              {result.predictedQueries.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl space-y-4 border border-white/10">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <span>Predicted Officer Scrutiny Queries</span>
                  </h3>
                  <div className="space-y-3">
                    {result.predictedQueries.map((query: string, i: number) => (
                      <div key={i} className="glass-card p-4 rounded-xl border border-white/10 space-y-1.5 text-xs">
                        <p className="font-semibold text-white">{query}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Document Fields List */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 border border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>Extracted Document Attributes ({result.extractedFields.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.extractedFields.map((f: ExtractedField, i: number) => (
                    <div key={i} className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-gray-400 font-mono text-[10px]">{f.label} ({f.field})</p>
                        <p className="font-bold text-white">{String(f.value)}</p>
                        <p className="text-[10px] text-gray-500 font-mono">Source: {f.sourceDocument}</p>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                        {(f.confidence * 100).toFixed(0)}% confidence
                      </Badge>
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
