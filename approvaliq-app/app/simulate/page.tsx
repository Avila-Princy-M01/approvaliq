"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PriorityBadge } from "@/components/officer/PriorityBadge";
import { CitationBadge } from "@/components/officer/CitationBadge";
import type { BusinessProfile, SimulationResult, Approval, RiskTier } from "@/types";

const DISTRICTS = [
  "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Kolhapur",
  "Latur", "Amravati", "Nanded", "Ratnagiri", "Dharashiv",
];

const INDUSTRIES = [
  "food-processing", "textiles", "chemicals", "engineering", "metals",
  "ceramics", "plastics", "pharmaceuticals", "dairy", "paper",
  "auto-components", "paints", "agro-processing", "electronics",
];

function defaultProfile(): BusinessProfile {
  return {
    companyName: "",
    industry: "food-processing",
    district: "Pune",
    areaSqFt: 5000,
    investmentCrore: 5,
    employees: 40,
    usesPower: true,
    powerLoadHP: 50,
    hasBoiler: false,
    boilerCapacityLitres: undefined,
    hazardousMaterials: false,
    generatesHazardousWaste: false,
    annualTurnoverLakh: 200,
    projectStage: "operating",
  };
}

export default function SimulatePage() {
  const [profile, setProfile] = useState<BusinessProfile>(defaultProfile);
  const [result, setResult] = useState<SimulationResult | null>(null);
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
      setResult(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const applicable = result?.approvals.filter((a) => a.applies) ?? [];
  const notApplicable = result?.approvals.filter((a) => !a.applies) ?? [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Approval Simulation</h1>
          <p className="text-muted-foreground mt-1">
            Enter a business profile to see which regulatory approvals apply and why.
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Business Profile</CardTitle>
                <CardDescription>Fill in the details to simulate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    value={profile.companyName ?? ""}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="Acme Manufacturing"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={profile.industry}
                    onChange={(e) => update("industry", e.target.value)}
                  >
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>
                        {i.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">District</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={profile.district}
                    onChange={(e) => update("district", e.target.value)}
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Area (sq ft)</label>
                    <Input
                      type="number"
                      value={profile.areaSqFt}
                      onChange={(e) => update("areaSqFt", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Investment (₹ Cr)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={profile.investmentCrore}
                      onChange={(e) => update("investmentCrore", Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Employees</label>
                    <Input
                      type="number"
                      value={profile.employees}
                      onChange={(e) => update("employees", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Power Load (HP)</label>
                    <Input
                      type="number"
                      value={profile.powerLoadHP ?? 0}
                      onChange={(e) => update("powerLoadHP", Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Flags</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ["usesPower", "Uses Power"],
                      ["hasBoiler", "Has Boiler"],
                      ["hazardousMaterials", "Hazardous Materials"],
                      ["generatesHazardousWaste", "Hazardous Waste"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(profile[key])}
                          onChange={(e) => update(key, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Project Stage</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={profile.projectStage}
                    onChange={(e) => update("projectStage", e.target.value)}
                  >
                    <option value="planning">Planning</option>
                    <option value="construction">Construction</option>
                    <option value="operating">Operating</option>
                  </select>
                </div>

                <Button
                  onClick={runSimulation}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Running Simulation..." : "Run Simulation"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-4 text-red-700 text-sm">{error}</CardContent>
              </Card>
            )}

            {!result && !error && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-lg font-medium text-muted-foreground">
                    No simulation results yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fill in the business profile and click &quot;Run Simulation&quot; to see applicable approvals.
                  </p>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-3xl font-bold">{result.summary.applicableApprovalCount}</p>
                      <p className="text-xs text-muted-foreground">Approvals Required</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-3xl font-bold">{result.summary.uniqueDocumentCount}</p>
                      <p className="text-xs text-muted-foreground">Documents Needed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-3xl font-bold">{result.summary.criticalPathDays}</p>
                      <p className="text-xs text-muted-foreground">Critical Path (days)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-3xl font-bold">₹{(result.summary.indicativeFeeTotal / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-muted-foreground">Est. Total Fees</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Critical Path */}
                {result.summary.criticalPath.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Critical Path</CardTitle>
                      <CardDescription>
                        Longest dependency chain — {result.summary.criticalPathDays} days total
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 flex-wrap">
                        {result.summary.criticalPath.map((id, i) => {
                          const approval = result.approvals.find((a) => a.id === id);
                          return (
                            <div key={id} className="flex items-center gap-2">
                              {i > 0 && <span className="text-muted-foreground">→</span>}
                              <Badge variant="outline" className={id === result.summary.bottleneckApprovalId ? "border-red-400 bg-red-50" : ""}>
                                {approval?.name ?? id}
                                {id === result.summary.bottleneckApprovalId && " ⚡"}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Applicable Approvals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Applicable Approvals ({applicable.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {applicable.map((approval) => (
                      <ApprovalCard key={approval.id} approval={approval} />
                    ))}
                    {applicable.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No approvals apply to this profile.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Not Applicable */}
                {notApplicable.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-muted-foreground">
                        Not Applicable ({notApplicable.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {notApplicable.map((approval) => (
                        <div key={approval.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{approval.name}</p>
                            <p className="text-xs text-muted-foreground">{approval.appliesReason || "Conditions not met"}</p>
                          </div>
                          <Badge variant="secondary">Not Required</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApprovalCard({ approval }: { approval: Approval }) {
  const matchedTraces = approval.traces.filter((t) => t.matched);
  const unmatchedTraces = approval.traces.filter((t) => !t.matched);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-medium">{approval.name}</h4>
          <p className="text-xs text-muted-foreground">{approval.department}</p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge tier={approval.riskTier as RiskTier} />
          {approval.statutoryDays && (
            <Badge variant="outline">{approval.statutoryDays}d</Badge>
          )}
          {approval.indicativeFee != null && approval.indicativeFee > 0 && (
            <Badge variant="outline">₹{(approval.indicativeFee / 1000).toFixed(0)}k</Badge>
          )}
        </div>
      </div>

      {/* Decision Traces */}
      {approval.traces.length > 0 && (
        <div className="space-y-2">
          {matchedTraces.map((trace, i) => (
            <div key={`m-${i}`} className="flex items-start gap-2 text-sm">
              <span className="text-green-600 mt-0.5">✅</span>
              <div className="flex-1">
                <p>{trace.condition}</p>
                <p className="text-xs text-muted-foreground">
                  Value: <span className="font-mono">{String(trace.applicantValue)}</span>
                  {" → "}
                  <span className="text-green-600">Matched</span>
                </p>
              </div>
              <CitationBadge citation={trace.citation} />
            </div>
          ))}
          {unmatchedTraces.map((trace, i) => (
            <div key={`u-${i}`} className="flex items-start gap-2 text-sm">
              <span className="text-red-500 mt-0.5">❌</span>
              <div className="flex-1">
                <p>{trace.condition}</p>
                <p className="text-xs text-muted-foreground">
                  Value: <span className="font-mono">{String(trace.applicantValue)}</span>
                  {" → "}
                  <span className="text-red-500">Not matched</span>
                </p>
              </div>
              <CitationBadge citation={trace.citation} />
            </div>
          ))}
        </div>
      )}

      {/* Required Documents */}
      {approval.requiredDocuments.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Required Documents</p>
          <div className="flex flex-wrap gap-1">
            {approval.requiredDocuments.map((doc) => (
              <Badge
                key={doc.id}
                variant={doc.mandatory ? "default" : "secondary"}
                className="text-xs"
              >
                {doc.label}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
