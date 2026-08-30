"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tilt3DCard } from "@/components/3d/Tilt3DCard";
import { QueueTable } from "@/components/officer/QueueTable";
import { Search, Sparkles, Filter } from "lucide-react";
import type { OfficerQueueItem } from "@/types";

function QueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "all" ? "all" : "pending";

  const [items, setItems] = useState<OfficerQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const fetchQueue = async () => {
    try {
      const response = await fetch("/api/officer/queue");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/officer?tab=${value}`, { scroll: false });
  };

  const filteredItems = useMemo(() => {
    let result = activeTab === "pending"
      ? items.filter((item) => item.status === "pending")
      : items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.companyName.toLowerCase().includes(q) ||
          item.applicationId.toLowerCase().includes(q) ||
          item.district.toLowerCase().includes(q)
      );
    }

    if (riskFilter !== "all") {
      result = result.filter((item) => item.priority === riskFilter);
    }

    return result;
  }, [items, activeTab, searchQuery, riskFilter]);

  const pendingCount = items.filter((item) => item.status === "pending").length;
  const highRiskCount = items.filter((item) => item.priority === "high").length;
  const avgReadiness = items.length > 0
    ? Math.round(items.reduce((sum, item) => sum + item.readinessScore, 0) / items.length)
    : 0;

  const handleSelect = (applicationId: string) => {
    router.push(`/officer/${applicationId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-xs">
              OFFICER COMMAND CONSOLE
            </Badge>
            <span className="text-xs text-gray-400 font-mono">• Maharashtra RTS Act</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Application Scrutiny Queue</h1>
          <p className="text-sm text-gray-400">
            {pendingCount} pending applications requiring statutory decision trace review
          </p>
        </div>

        <Button
          onClick={() => router.push("/simulate")}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Approval Simulation</span>
        </Button>
      </div>

      {/* 3D Stat Cards */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tilt3DCard glowColor="amber" intensity={10}>
            <div className="space-y-1 text-center py-1">
              <p className="text-3xl font-extrabold text-amber-400">{pendingCount}</p>
              <p className="text-xs font-mono text-gray-300 uppercase tracking-wider">Pending Review</p>
            </div>
          </Tilt3DCard>

          <Tilt3DCard glowColor="purple" intensity={10}>
            <div className="space-y-1 text-center py-1">
              <p className="text-3xl font-extrabold text-red-400">{highRiskCount}</p>
              <p className="text-xs font-mono text-gray-300 uppercase tracking-wider">High Risk Alert</p>
            </div>
          </Tilt3DCard>

          <Tilt3DCard glowColor="emerald" intensity={10}>
            <div className="space-y-1 text-center py-1">
              <p className="text-3xl font-extrabold text-emerald-400">{avgReadiness}%</p>
              <p className="text-xs font-mono text-gray-300 uppercase tracking-wider">Avg Readiness</p>
            </div>
          </Tilt3DCard>

          <Tilt3DCard glowColor="cyan" intensity={10}>
            <div className="space-y-1 text-center py-1">
              <p className="text-3xl font-extrabold text-cyan-400">{items.length}</p>
              <p className="text-xs font-mono text-gray-300 uppercase tracking-wider">Total Active Queue</p>
            </div>
          </Tilt3DCard>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by company, application ID, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/80 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-emerald-500 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Risk Level:
          </span>
          {["all", "high", "medium", "low"].map((risk) => (
            <button
              key={risk}
              onClick={() => setRiskFilter(risk)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                riskFilter === risk
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-md shadow-emerald-500/10"
                  : "bg-slate-900/60 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              {risk === "all" ? "All Risk" : risk.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-slate-900/80 border border-white/10 p-1 rounded-xl">
          <TabsTrigger value="pending" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs font-mono">
            Pending Queue ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs font-mono">
            All Applications ({items.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 p-1">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-slate-900/60 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <QueueTable items={filteredItems} onSelect={handleSelect} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 p-1">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-slate-900/60 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <QueueTable items={filteredItems} onSelect={handleSelect} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function OfficerQueuePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-12 w-80 bg-slate-900 animate-pulse rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-900 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    }>
      <QueueContent />
    </Suspense>
  );
}
