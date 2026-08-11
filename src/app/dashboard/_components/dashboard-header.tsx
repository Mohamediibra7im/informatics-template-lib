"use client";

import { Terminal, RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  username: string;
  loading: boolean;
  masteredCount: number;
  implementedCount: number;
  learningCount: number;
  onRefresh: () => void;
}

export function DashboardHeader({
  username,
  loading,
  masteredCount,
  implementedCount,
  learningCount,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden relative font-mono">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-border/40 bg-muted/20 select-none">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex gap-1.5 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70 shadow-[0_0_6px_rgba(234,179,8,0.4)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          </div>
          <span className="text-[10px] sm:text-[10.5px] uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5 min-w-0 truncate">
            <Terminal className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">[ {username}@itl_console ]</span>
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="text-muted-foreground/70 hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer px-2 sm:px-2.5 py-1 border border-border/40 bg-background/20 hover:border-primary/40 text-[9px] uppercase tracking-wider font-bold shrink-0 ml-1 sm:ml-2"
          title="Sync Data"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
          <span className="hidden sm:inline">SYNC DATA</span>
          <span className="sm:hidden">SYNC</span>
        </button>
      </div>

      <div className="px-4 py-3 text-[10.5px] text-muted-foreground/60 space-y-1.5 border-b border-primary/10 bg-black/25">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 break-all">
          <span className="text-primary font-bold shrink-0">{username}@itl:~$</span>
          <span className="text-foreground/90 font-bold break-all">cat /sys/diagnostics --status</span>
          <span className="inline-block h-3 w-1.5 bg-primary animate-blink shrink-0" />
        </div>
        <div className="text-foreground/75 leading-relaxed text-[11px]">
          System Online. Tracked: <span className="text-success font-bold">{masteredCount}</span> mastered,{" "}
          <span className="text-warning font-bold">{implementedCount}</span> implemented, and{" "}
          <span className="text-blue-400 font-bold">{learningCount}</span> active study templates.
        </div>
      </div>
    </div>
  );
}
