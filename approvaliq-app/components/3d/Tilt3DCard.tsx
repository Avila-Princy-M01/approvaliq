"use client";

import { useState, useRef, ReactNode, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface Tilt3DCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "emerald" | "amber" | "cyan" | "purple";
  intensity?: number;
}

export function Tilt3DCard({
  children,
  className,
  glowColor = "emerald",
  intensity = 15,
}: Tilt3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    setTransform(
      `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    );

    setSpotlight({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseLeave = () => {
    setTransform("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  const glowStyles = {
    emerald: "hover:border-emerald-500/40 hover:shadow-[0_20px_50px_rgba(16,185,129,0.2)]",
    amber: "hover:border-amber-500/40 hover:shadow-[0_20px_50px_rgba(245,158,11,0.2)]",
    cyan: "hover:border-cyan-500/40 hover:shadow-[0_20px_50px_rgba(56,189,248,0.2)]",
    purple: "hover:border-purple-500/40 hover:shadow-[0_20px_50px_rgba(139,92,246,0.2)]",
  };

  return (
    <div
      className="perspective-1000 w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        style={{
          transform,
          transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={cn(
          "preserve-3d relative rounded-2xl glass-card overflow-hidden p-6 border transition-all duration-300",
          glowStyles[glowColor],
          className
        )}
      >
        {/* Dynamic Spotlight Follower */}
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl z-10"
          style={{
            opacity: spotlight.opacity,
            background: `radial-gradient(600px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255, 255, 255, 0.15), transparent 40%)`,
          }}
        />
        <div className="relative z-20">{children}</div>
      </div>
    </div>
  );
}
