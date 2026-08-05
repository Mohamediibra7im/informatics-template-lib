"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, BarChart3 } from "lucide-react";
import { ProgressItem } from "./types";

interface ProgressTabProps {
  progress: ProgressItem[];
  masteredCount: number;
  implementedCount: number;
  learningCount: number;
  totalTracked: number;
  playClick: () => void;
}

export function ProgressTab({
  progress,
  masteredCount,
  implementedCount,
  learningCount,
  totalTracked,
  playClick,
}: ProgressTabProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "mastered" | "implemented" | "learning">("all");

  return (
    <div className="space-y-6 animate-fade-in font-mono">
      {/* Radial ring & status summary details */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* SVG Radial Mastery Score */}
        <div className="border border-border bg-card/40 backdrop-blur-md p-6 shadow-2xl flex flex-col items-center justify-center font-mono select-none md:col-span-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold mb-4 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Readiness Score</span>
          </div>
          <div className="relative flex items-center justify-center h-32 w-32 mb-4">
            <svg className="h-full w-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="#22c55e"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={339.29}
                strokeDashoffset={339.29 - 339.29 * (masteredCount / Math.max(totalTracked, 1))}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {totalTracked > 0 ? Math.round((masteredCount / totalTracked) * 100) : 0}%
              </div>
              <div className="text-[8px] text-muted-foreground/50 uppercase tracking-widest font-bold">MASTERY</div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground/50 text-center font-bold">
            {masteredCount} of {totalTracked} algorithms mastered
          </div>
        </div>

        {/* Progress details stats grid */}
        <div className="border border-border bg-card/40 backdrop-blur-md p-6 shadow-2xl flex flex-col justify-between font-mono select-none md:col-span-2">
          <div className="space-y-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center justify-between">
              <span>Implementation Pipeline Summary</span>
              <span className="text-primary">{totalTracked} Total Tracked</span>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-success uppercase">Mastered</span>
                  <span>
                    {masteredCount} / {totalTracked}
                  </span>
                </div>
                <div className="h-2 bg-background/40 border border-border p-0.5">
                  <div
                    className="h-full bg-success transition-all duration-700"
                    style={{ width: `${totalTracked > 0 ? (masteredCount / totalTracked) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-warning uppercase">Implemented</span>
                  <span>
                    {implementedCount} / {totalTracked}
                  </span>
                </div>
                <div className="h-2 bg-background/40 border border-border p-0.5">
                  <div
                    className="h-full bg-warning transition-all duration-700"
                    style={{ width: `${totalTracked > 0 ? (implementedCount / totalTracked) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-blue-400 uppercase">Learning</span>
                  <span>
                    {learningCount} / {totalTracked}
                  </span>
                </div>
                <div className="h-2 bg-background/40 border border-border p-0.5">
                  <div
                    className="h-full bg-blue-400 transition-all duration-700"
                    style={{ width: `${totalTracked > 0 ? (learningCount / totalTracked) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-muted-foreground/40 border-t border-border/30 pt-3 flex justify-between uppercase font-bold">
            <span>Status DB Synced</span>
            <span className="text-primary">AUTOMATIC</span>
          </div>
        </div>
      </div>

      {/* List of Tracked templates */}
      <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl">
        <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between select-none">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span>Tracked Algorithms ({progress.length})</span>
          </div>

          {/* Filter Controls */}
          <div className="flex gap-1.5">
            {["all", "mastered", "implemented", "learning"].map((sf) => (
              <button
                key={sf}
                onClick={() => {
                  playClick();
                  setStatusFilter(sf as typeof statusFilter);
                }}
                className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold border transition-all cursor-pointer ${
                  statusFilter === sf
                    ? "border-primary/60 bg-primary/10 text-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.15)]"
                    : "border-border/50 text-muted-foreground/40 hover:text-foreground hover:border-border"
                }`}
              >
                {sf}
              </button>
            ))}
          </div>
        </div>

        {progress.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground/40 font-mono select-none">
            No progress items mapped yet.
          </div>
        ) : (
          <div className="divide-y divide-border/25">
            {progress
              .filter((p) => statusFilter === "all" || p.status === statusFilter)
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/template/${p.templateSlug}`}
                  onClick={playClick}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-primary/5 transition-colors group"
                >
                  <span className="text-xs font-bold text-foreground/90 group-hover:text-primary transition-colors">
                    {p.templateTitle}
                  </span>
                  <span
                    className={`text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 border ${
                      p.status === "mastered"
                        ? "text-success border-success/30 bg-success/10"
                        : p.status === "implemented"
                        ? "text-warning border-warning/30 bg-warning/10"
                        : "text-blue-400 border-blue-400/30 bg-blue-400/10"
                    }`}
                  >
                    {p.status}
                  </span>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
