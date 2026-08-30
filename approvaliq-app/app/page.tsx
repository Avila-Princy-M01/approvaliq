import Link from "next/link";
import { Hero3DCanvas } from "@/components/3d/Hero3DCanvas";
import { Tilt3DCard } from "@/components/3d/Tilt3DCard";
import { RiskGlobe3D } from "@/components/3d/RiskGlobe3D";
import { CitationGraph3D } from "@/components/3d/CitationGraph3D";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Sliders, 
  ArrowRight, 
  Scale, 
  FileCheck, 
  Activity, 
  Cpu, 
  Sparkles 
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* 3D WebGL Background Canvas */}
      <Hero3DCanvas />

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Live Status Eyebrow Tag */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border-emerald-500/30 text-emerald-400 text-xs font-mono mb-8 animate-float-slow">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>MAHARASHTRA REGULATORY ENGINE 2026.08 ACTIVE</span>
        </div>

        {/* 2-Line Max Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-emerald-400 drop-shadow-sm">
          Regulatory Approvals in Maharashtra, Decoded with AI Scrutiny.
        </h1>

        {/* Subtitle Copy */}
        <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
          Navigate Maharashtra statutory mandates, risk scoring, evidence traces, and automated compliance routing with full statutory transparency.
        </p>

        {/* Dual High-Contrast CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link href="/officer" className="w-full sm:w-auto">
            <Button size="lg" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Officer Review Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/simulate" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full glass-panel border-white/20 hover:border-emerald-500/50 text-white font-semibold text-sm h-12 px-8 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>Simulate Business Profile</span>
            </Button>
          </Link>
        </div>

        {/* Dynamic Metric Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
          {[
            { label: "STATUTORY ACTS COVERED", value: "6 Major Acts", detail: "MPCB, Factories, Boilers, FSSAI, Fire, RTS" },
            { label: "MAHARASHTRA DISTRICTS", value: "36 Districts", detail: "Active GIS Mapping" },
            { label: "EVIDENCE CITATIONS", value: "100% Traceable", detail: "Source Clause Citations" },
            { label: "DECISION AUDITABILITY", value: "Full Trail", detail: "Immutable Officer Logs" },
          ].map((metric) => (
            <div key={metric.label} className="glass-card p-4 rounded-xl text-center border-white/5">
              <p className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">{metric.label}</p>
              <p className="text-xl font-extrabold text-white mt-1">{metric.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{metric.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive 3D Scrutiny Radar & Bento Section */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-xs px-3 py-1">
            INTELLIGENT REGULATORY HUB
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Comprehensive Statutory Intelligence
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
            Every business approval recommendation is dynamically linked to statutory clauses, risk matrices, and officer workflow controls.
          </p>
        </div>

        {/* 3D WebGL District Risk Globe Radar */}
        <RiskGlobe3D />

        {/* 3D Tilt Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <Tilt3DCard glowColor="emerald">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Dual Risk Scoring Engine</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Calculates submission risk (completeness & profile consistency) independently from regulatory scrutiny level across Maharashtra state thresholds.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span>View Risk Algorithm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Tilt3DCard>

          <Tilt3DCard glowColor="amber">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Source Clause Traceability</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                No black-box decisions. Every approval recommendation cites exact sections of the Maharashtra Fire Act, MPCB Pollution Rules, or Boilers Act.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-amber-400">
                <span>Explore Citations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Tilt3DCard>

          <Tilt3DCard glowColor="cyan">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Real-Time Rule Simulation</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Enter any factory or commercial profile parameters (power HP, worker count, hazardous materials) to instantly evaluate required clearances.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-cyan-400">
                <span>Launch Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Tilt3DCard>
        </div>

        {/* 3D Statutory Evidence Graph Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-8">
          <div className="space-y-6">
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 font-mono text-xs">
              EVIDENCE TRACEABILITY
            </Badge>
            <h3 className="text-3xl font-bold tracking-tight text-white">
              Dynamic Statutory Knowledge Graph
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              ApprovalIQ constructs a 3D citation graph connecting your business profile attributes directly to statutory thresholds under Maharashtra state law.
            </p>
            <div className="space-y-3">
              {[
                { title: "MPCB Pollution Categorisation", desc: "Red/Orange/Green category determination based on industrial process type." },
                { title: "Maharashtra RTS Act Compliance", desc: "Monitors statutory SLA timelines and alerts officers to upcoming deadlines." },
                { title: "Factories & Boilers Clearance", desc: "Evaluates horsepower, worker thresholds, and boiler pressure parameters." },
              ].map((item) => (
                <div key={item.title} className="glass-card p-3.5 rounded-xl flex items-start gap-3 border-white/5">
                  <Cpu className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CitationGraph3D />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-4 text-center space-y-4 bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center justify-center gap-3">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-xs">
            Engine demo-2026.08
          </Badge>
          <Badge variant="outline" className="border-white/20 text-gray-300 font-mono text-xs">
            Rule Set 2026.08.1
          </Badge>
        </div>
        <p className="text-xs text-gray-400 max-w-xl mx-auto">
          ApprovalIQ provides AI-assisted statutory scrutiny for government officers in Maharashtra. All officer decisions remain under human oversight with immutable audit trails.
        </p>
      </footer>
    </div>
  );
}
