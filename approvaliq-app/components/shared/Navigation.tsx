"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShieldCheck, Compass, Sliders, TrendingUp, FileCheck, Scale, Zap } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Compass },
  { href: "/officer", label: "Officer Queue", icon: ShieldCheck },
  { href: "/simulate", label: "Rule Simulator", icon: Sliders },
  { href: "/impact", label: "Policy Impact", icon: TrendingUp },
  { href: "/maitri", label: "MAITRI Gateway", icon: FileCheck },
  { href: "/clauses", label: "Clause Vault", icon: Scale },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-3 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="container mx-auto max-w-7xl flex items-center justify-between">
        {/* Brand Logo with 3D Holographic Marker */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              Approval<span className="text-emerald-400">IQ</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase -mt-1">
              Maharashtra Scrutiny AI
            </span>
          </div>
        </Link>

        {/* Floating Glass Pill Navigation */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-full border border-white/10 backdrop-blur-md overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 whitespace-nowrap",
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-400 rounded-full blur-[1px]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Live Engine Status Badge */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Engine active • mah-2024-v1</span>
        </div>
      </div>
    </header>
  );
}
