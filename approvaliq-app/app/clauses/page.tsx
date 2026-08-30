"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tilt3DCard } from "@/components/3d/Tilt3DCard";
import { validateExplanation } from "@/lib/evidence/validate";
import { Search, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";

import boilersActData from "@/data/clauses/boilers-act.json";
import factoriesActData from "@/data/clauses/factories-act.json";
import fireActData from "@/data/clauses/fire-act-maharashtra.json";
import fssaiRulesData from "@/data/clauses/fssai-rules.json";
import hazwasteRulesData from "@/data/clauses/hazardous-waste-rules.json";
import mpcbCatData from "@/data/clauses/mpcb-categorisation.json";
import rtsActData from "@/data/clauses/rts-act-timelines.json";

interface ClauseItem {
  clauseId: string;
  clause: string;
  page: number | null;
  heading: string;
  text: string;
  verificationStatus: string;
}

interface ClauseFile {
  sourceTitle: string;
  authority: string;
  version: string;
  sourceUrl: string;
  lastVerified: string;
  clauses: ClauseItem[];
}

const ALL_CLAUSE_FILES: ClauseFile[] = [
  boilersActData as ClauseFile,
  factoriesActData as ClauseFile,
  fireActData as ClauseFile,
  fssaiRulesData as ClauseFile,
  hazwasteRulesData as ClauseFile,
  mpcbCatData as ClauseFile,
  rtsActData as ClauseFile,
];

export default function StatutoryClausesPage() {
  const [search, setSearch] = useState("");
  const [selectedAuthority, setSelectedAuthority] = useState<string>("all");

  // AI Evidence Guardrail Live Validator state
  const [testExplanation, setTestExplanation] = useState(
    "Factory license is required under Section 6 of the Factories Act 1948 for carrying on manufacturing with 10+ workers."
  );
  const [testClauseIds, setTestClauseIds] = useState("dgfasli/factories-act-1948/section-6");
  const [validationResult, setValidationResult] = useState<{ valid: boolean; reason?: string } | null>(null);

  const allClauses = ALL_CLAUSE_FILES.flatMap((file) =>
    file.clauses.map((c) => ({ ...c, sourceTitle: file.sourceTitle, authority: file.authority, sourceUrl: file.sourceUrl }))
  );

  const authorities = Array.from(new Set(ALL_CLAUSE_FILES.map((f) => f.authority)));

  const filteredClauses = allClauses.filter((c) => {
    const matchesSearch =
      c.clauseId.toLowerCase().includes(search.toLowerCase()) ||
      c.clause.toLowerCase().includes(search.toLowerCase()) ||
      c.heading.toLowerCase().includes(search.toLowerCase()) ||
      c.text.toLowerCase().includes(search.toLowerCase()) ||
      c.sourceTitle.toLowerCase().includes(search.toLowerCase());
    const matchesAuthority = selectedAuthority === "all" || c.authority === selectedAuthority;
    return matchesSearch && matchesAuthority;
  });

  const handleValidateExplanation = () => {
    const clauseIdsArr = testClauseIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const allowedClauseIds = allClauses.map((c) => c.clauseId);

    const result = validateExplanation(
      {
        explanation: testExplanation,
        usedClauseIds: clauseIdsArr,
      },
      allowedClauseIds
    );

    setValidationResult(result);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-xs">
              STATUTORY EVIDENCE VAULT
            </Badge>
            <span className="text-xs font-mono text-gray-400">• Maharashtra Gazette Provisions</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Source Statutory Clause Library</h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse and search exact legal clauses backing ApprovalIQ AI decision traces and officer compliance advice.
          </p>
        </div>

        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-xs py-1.5 px-3">
          {allClauses.length} Indexed Clauses
        </Badge>
      </div>

      {/* AI Citation Guardrail Interactive Tester Card */}
      <Tilt3DCard glowColor="purple" intensity={6}>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>AI Evidence Citation Guardrail Validator</span>
            </h2>
            <Badge variant="outline" className="border-purple-500/40 text-purple-300 font-mono text-[10px]">
              Live Guardrail Sandbox
            </Badge>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Tests generated AI explanation texts against ApprovalIQ strict citation rules (prohibits unverified hallucinated sections or uncited requirement claims).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-mono text-gray-300">Generated Explanation Text</label>
              <textarea
                rows={3}
                className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs focus:border-purple-500"
                value={testExplanation}
                onChange={(e) => setTestExplanation(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-gray-300">Used Clause IDs (Comma Separated)</label>
              <input
                type="text"
                className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs focus:border-purple-500"
                value={testClauseIds}
                onChange={(e) => setTestClauseIds(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              onClick={handleValidateExplanation}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 px-5 rounded-lg shadow-lg shadow-purple-600/20"
            >
              Run Citation Guardrail Check
            </Button>

            {validationResult && (
              <div className="flex items-center gap-2 font-mono text-xs">
                {validationResult.valid ? (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/40 flex items-center gap-1.5 py-1 px-3">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PASSED: Citation Fully Traceable</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-500/40 text-red-400 bg-red-950/40 flex items-center gap-1.5 py-1 px-3">
                    <AlertTriangle className="w-4 h-4" />
                    <span>REJECTED: {validationResult.reason}</span>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Tilt3DCard>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="relative w-full sm:w-1/2">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search statutory section, keywords, or title..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-gray-500 focus:border-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-1/2">
          <select
            className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:border-emerald-500"
            value={selectedAuthority}
            onChange={(e) => setSelectedAuthority(e.target.value)}
          >
            <option value="all">All Statutory Authorities</option>
            {authorities.map((auth) => (
              <option key={auth} value={auth} className="bg-slate-950 text-white">
                {auth}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clause Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClauses.map((clause) => (
          <Tilt3DCard key={clause.clauseId} glowColor="emerald" intensity={4}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                    {clause.clause}
                  </Badge>
                  <h3 className="font-bold text-white text-sm mt-1">{clause.heading}</h3>
                </div>
                <Badge
                  variant="outline"
                  className={
                    clause.verificationStatus === "verified"
                      ? "border-emerald-500/40 text-emerald-300 font-mono text-[9px]"
                      : "border-amber-500/40 text-amber-300 font-mono text-[9px]"
                  }
                >
                  {clause.verificationStatus.toUpperCase()}
                </Badge>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed font-sans">{clause.text}</p>

              <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span className="truncate max-w-[240px]">{clause.sourceTitle}</span>
                <span className="text-emerald-400 shrink-0">{clause.clauseId}</span>
              </div>
            </div>
          </Tilt3DCard>
        ))}
      </div>
    </div>
  );
}
