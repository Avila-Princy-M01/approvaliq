import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              ApprovalIQ
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Navigate regulatory approvals in Maharashtra, India with
              AI-powered guidance and transparent decision-making.
            </p>
          </div>

          {/* Entry Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link href="/officer">
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Review Queue</CardTitle>
                  <CardDescription>
                    Officer dashboard for reviewing and processing applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Open Dashboard</Button>
                </CardContent>
              </Card>
            </Link>

            <Card className="h-full opacity-50">
              <CardHeader>
                <CardTitle>Simulate Approvals</CardTitle>
                <CardDescription>
                  Founder flow for simulating regulatory requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <footer className="text-center space-y-2 pt-8">
            <p className="text-sm text-muted-foreground">
              Engine v1.0.0 • Rule Set mah-2024-v1
            </p>
            <p className="text-xs text-muted-foreground italic">
              Demo integration — no data is transmitted to a live government system.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
