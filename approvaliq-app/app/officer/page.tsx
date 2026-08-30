"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { QueueTable } from "@/components/officer/QueueTable";
import type { OfficerQueueItem } from "@/types";

export default function OfficerQueuePage() {
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Officer Review Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {pendingCount} pending of {items.length} total applications
          </p>
        </div>

        {/* Summary Stats */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold text-red-600">{highRiskCount}</p>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold">{avgReadiness}%</p>
                <p className="text-xs text-muted-foreground">Avg Readiness</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold">{items.length}</p>
                <p className="text-xs text-muted-foreground">Total Applications</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Separator />

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by company, ID, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            {["all", "high", "medium", "low"].map((risk) => (
              <Badge
                key={risk}
                variant={riskFilter === risk ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setRiskFilter(risk)}
              >
                {risk === "all" ? "All Risk" : risk.charAt(0).toUpperCase() + risk.slice(1)}
              </Badge>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({items.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <QueueTable items={filteredItems} onSelect={handleSelect} />
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <QueueTable items={filteredItems} onSelect={handleSelect} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
