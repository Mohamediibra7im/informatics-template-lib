"use client";

import { CSSProperties } from "react";
import { BookOpen, CheckCircle2, Award, FolderOpen, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HandlesStats, Tab } from "./types";

interface OverviewTabProps {
  learningCount: number;
  implementedCount: number;
  masteredCount: number;
  collectionsCount: number;
  totalTracked: number;
  stats: HandlesStats | null;
  getRatingStyle: (platform: string, rating: number | null) => CSSProperties;
  onChangeTab: (tab: Tab) => void;
}

export function OverviewTab({
  learningCount,
  implementedCount,
  masteredCount,
  collectionsCount,
  totalTracked,
  stats,
  getRatingStyle,
  onChangeTab,
}: OverviewTabProps) {
  return (
    <div className="space-y-6 animate-fade-in font-mono">
      {/* Stats Bento boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        {[
          { label: "Learning", count: learningCount, color: "text-blue-400 border-blue-400/30 bg-blue-400/5", glow: "shadow-[0_0_15px_rgba(96,165,250,0.1)]", icon: <BookOpen className="h-4 w-4" /> },
          { label: "Implemented", count: implementedCount, color: "text-warning border-warning/30 bg-warning/5", glow: "shadow-[0_0_15px_rgba(234,179,8,0.1)]", icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: "Mastered", count: masteredCount, color: "text-success border-success/30 bg-success/5", glow: "shadow-[0_0_15px_rgba(34,197,94,0.1)]", icon: <Award className="h-4 w-4" /> },
          { label: "Collections", count: collectionsCount, color: "text-purple-400 border-purple-400/30 bg-purple-400/5", glow: "shadow-[0_0_15px_rgba(192,132,252,0.1)]", icon: <FolderOpen className="h-4 w-4" /> },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`border bg-card/40 backdrop-blur-md p-4 transition-all duration-300 hover:-translate-y-1 ${stat.color} ${stat.glow} relative overflow-hidden group`}
          >
            <div className="flex items-center gap-2 mb-2 select-none opacity-90">
              {stat.icon}
              <span className="text-[10px] uppercase tracking-widest font-extrabold">{stat.label}</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight my-1">{stat.count}</div>

            <div className="mt-3.5 h-[3px] bg-background/50 overflow-hidden border border-border/30">
              <div
                className="h-full bg-current transition-all duration-700 ease-out"
                style={{ width: `${totalTracked > 0 ? (stat.count / totalTracked) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* CP Profiles Diagnostics Integration Grid */}
      {stats && (stats.codeforces?.active || stats.atcoder?.active || stats.leetcode?.active || stats.codechef?.active) ? (
        <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl animate-fade-in">
          <div className="px-4 py-3 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span>Competitive Programming Live Stats</span>
            </div>
            <span className="text-[9px] text-success font-bold tracking-wider">LIVE_FEED</span>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "codeforces", label: "Codeforces", data: stats.codeforces, color: "#ef4444" },
              { key: "atcoder", label: "AtCoder", data: stats.atcoder, color: "#3b82f6" },
              { key: "leetcode", label: "LeetCode", data: stats.leetcode, color: "#f97316" },
              { key: "codechef", label: "CodeChef", data: stats.codechef, color: "#10b981" },
            ].map((p) => {
              if (!p.data?.active) return null;
              const ratingStyle = getRatingStyle(p.key, p.data.rating);

              return (
                <div key={p.key} className="border border-border/70 bg-card/40 backdrop-blur-md p-4 space-y-3 hover:border-primary/40 transition-all duration-300 shadow-md font-mono">
                  <div className="flex items-center gap-2 border-b border-border/30 pb-2.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs uppercase font-extrabold text-foreground tracking-widest">{p.label}</span>
                  </div>

                  <div className="space-y-2 text-xs pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground/45">Handle:</span>
                      <a
                        href={
                          p.key === "codeforces"
                            ? `https://codeforces.com/profile/${p.data.handle}`
                            : p.key === "atcoder"
                            ? `https://atcoder.jp/users/${p.data.handle}`
                            : p.key === "leetcode"
                            ? `https://leetcode.com/${p.data.handle}`
                            : `https://www.codechef.com/users/${p.data.handle}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground font-bold hover:text-primary transition-colors flex items-center gap-1 text-xs"
                      >
                        <span>@{p.data.handle}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground/45">Rating:</span>
                      <span className="font-extrabold font-mono text-xs" style={ratingStyle}>
                        {p.data.rating ?? "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground/45">Tier/Rank:</span>
                      <span className="font-extrabold font-mono text-xs capitalize" style={ratingStyle}>
                        {p.data.rank ?? "Unranked"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground/45">Solved Count:</span>
                      <span className="font-extrabold font-mono text-xs text-foreground">
                        {p.data.solved ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border border-border/80 bg-card/40 backdrop-blur-md p-6 text-center text-xs text-muted-foreground/50 shadow-2xl select-none font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span>Link your Codeforces, AtCoder, LeetCode, or CodeChef handles to show live rating metrics.</span>
          </div>
          <Button
            size="sm"
            onClick={() => onChangeTab("settings")}
            className="font-mono text-[10px] uppercase font-bold px-3 h-7 cursor-pointer"
          >
            Link Handles
          </Button>
        </div>
      )}
    </div>
  );
}
