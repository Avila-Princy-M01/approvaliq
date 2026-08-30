import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-black">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-5xl w-full space-y-16">
          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
              System Active — Demo Mode
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
              ApprovalIQ
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Navigate regulatory approvals in Maharashtra with
              AI-powered guidance, transparent decision-making, and
              full evidence traceability.
            </p>
          </div>

          {/* Entry Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/officer">
              <Card className="h-full hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group">
                <CardHeader>
                  <div className="text-3xl mb-2">👨‍⚖️</div>
                  <CardTitle>Officer Dashboard</CardTitle>
                  <CardDescription>
                    Review queue with risk scoring, evidence traces, and audit trail
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full group-hover:bg-primary/90">Open Dashboard</Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/simulate">
              <Card className="h-full hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group">
                <CardHeader>
                  <div className="text-3xl mb-2">🧪</div>
                  <CardTitle>Simulate Approvals</CardTitle>
                  <CardDescription>
                    Input a business profile and see which approvals apply with decision traces
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full group-hover:bg-primary/90">Run Simulation</Button>
                </CardContent>
              </Card>
            </Link>

            <Card className="h-full">
              <CardHeader>
                <div className="text-3xl mb-2">📊</div>
                <CardTitle>Change Impact</CardTitle>
                <CardDescription>
                  See how rule threshold changes affect businesses across Maharashtra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>Coming Soon</Button>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "⚖️", label: "Dual Risk Scoring", desc: "Separate submission risk and regulatory scrutiny" },
              { icon: "📜", label: "Citation Evidence", desc: "Every rule decision backed by source clause" },
              { icon: "🔍", label: "Decision Traces", desc: "Full why/why-not for every approval" },
              { icon: "🛡️", label: "Advisory Only", desc: "System suggests, officers decide" },
            ].map((f) => (
              <Card key={f.label} className="text-center">
                <CardContent className="pt-6 space-y-2">
                  <div className="text-2xl">{f.icon}</div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer */}
          <footer className="text-center space-y-2 pt-8 border-t">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline">Engine v1.0.0</Badge>
              <Badge variant="outline">Rule Set mah-2024-v1</Badge>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Demo integration — no data is transmitted to a live government system.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
