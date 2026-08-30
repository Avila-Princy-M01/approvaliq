"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { QueueTable } from "@/components/officer/QueueTable";
import type { OfficerQueueItem } from "@/types";

export default function OfficerQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "all" ? "all" : "pending";

  const [items, setItems] = useState<OfficerQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

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

  const filteredItems =
    activeTab === "pending"
      ? items.filter((item) => item.status === "pending")
      : items;

  const pendingCount = items.filter((item) => item.status === "pending").length;

  const handleSelect = (applicationId: string) => {
    router.push(`/officer/${applicationId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Officer Review Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {pendingCount} pending of {items.length} total applications
          </p>
        </div>

        <Separator />

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
              <p className="text-muted-foreground">Loading queue...</p>
            ) : (
              <QueueTable items={filteredItems} onSelect={handleSelect} />
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {loading ? (
              <p className="text-muted-foreground">Loading queue...</p>
            ) : (
              <QueueTable items={filteredItems} onSelect={handleSelect} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
