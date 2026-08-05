"use client";

import { useState, ReactNode } from "react";
import { User, ShieldCheck, Cpu, Target, Check, X } from "lucide-react";
import { Tab } from "./types";

interface SidebarProps {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  ratingGoal?: number | string | null;
  activeTab: Tab;
  tabs: { id: Tab; label: string; icon: ReactNode; count?: number }[];
  onChangeTab: (tabId: Tab) => void;
  onUpdateRatingGoal?: (goal: string | null) => Promise<void>;
}

export function DashboardSidebar({
  username,
  displayName,
  avatarUrl,
  bio,
  ratingGoal,
  activeTab,
  tabs,
  onChangeTab,
  onUpdateRatingGoal,
}: SidebarProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalVal, setGoalVal] = useState(ratingGoal ? String(ratingGoal) : "");
  const [savingGoal, setSavingGoal] = useState(false);

  const handleSaveGoal = async () => {
    setSavingGoal(true);
    try {
      if (onUpdateRatingGoal) {
        await onUpdateRatingGoal(goalVal.trim() || null);
      }
    } finally {
      setSavingGoal(false);
      setIsEditingGoal(false);
    }
  };

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-5 font-mono">
      {/* User console session overview widget */}
      <div className="border border-border bg-card/40 backdrop-blur-md p-4 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-primary/10 blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all duration-500" />
        
        {/* User Identity Header */}
        <div className="flex items-center gap-3">
          {/* Avatar with glowing green online dot indicator on the side */}
          <div className="relative flex items-center justify-center h-11 w-11 border border-primary/40 bg-primary/10 text-primary shrink-0 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-5.5 w-5.5" />
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card shadow-[0_0_8px_#22c55e]"
              title="Status: Online"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-xs font-extrabold text-foreground truncate tracking-wide">
              {displayName || username}
            </div>
            <div className="text-[10px] text-muted-foreground/60 truncate font-mono">
              @{username}
            </div>
            <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1 mt-0.5 font-bold">
              <ShieldCheck className="h-3 w-3 text-success" />
              <span>SESSION_ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-mono mt-3 italic border-t border-border/30 pt-2 break-words break-all whitespace-pre-wrap">
            &ldquo;{bio}&rdquo;
          </p>
        )}

        {/* Optional Custom Goal Chip with Dotted Line & Checkmark button */}
        <div className="mt-3 pt-2.5 border-t border-border/30">
          {!isEditingGoal ? (
            <div
              onClick={() => {
                setGoalVal(ratingGoal ? String(ratingGoal) : "");
                setIsEditingGoal(true);
              }}
              className="flex items-start justify-between text-[10px] font-mono cursor-pointer group py-1.5 px-2 border-b border-dashed border-border/60 hover:border-warning/60 bg-background/20 hover:bg-warning/5 transition-all select-none gap-2 min-w-0"
              title={ratingGoal ? `Goal: ${ratingGoal}` : "Click to set or edit optional custom goal"}
            >
              <span className="text-muted-foreground/60 flex items-center gap-1.5 group-hover:text-foreground shrink-0 select-none pt-0.5">
                <Target className="h-3 w-3 text-warning group-hover:scale-110 transition-transform shrink-0" />
                <span className="uppercase font-bold whitespace-nowrap">GOAL:</span>
              </span>
              <span
                className={`font-mono text-right break-words break-all min-w-0 flex-1 ${
                  ratingGoal ? "text-warning font-extrabold tracking-wide" : "text-muted-foreground/40 italic font-medium"
                }`}
              >
                {ratingGoal ? ratingGoal : "+ Set Goal"}
              </span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveGoal();
              }}
              className="flex items-center gap-1.5 py-1 px-1 border-b border-dashed border-warning bg-warning/5 font-mono select-none"
            >
              <Target className="h-3.5 w-3.5 text-warning shrink-0" />
              <input
                type="text"
                value={goalVal}
                maxLength={40}
                onChange={(e) => setGoalVal(e.target.value)}
                placeholder="Goal (e.g. Reach Master)..."
                autoFocus
                className="bg-transparent text-[10.5px] font-extrabold text-warning outline-none w-full min-w-0 p-0 placeholder:text-muted-foreground/30 font-mono tracking-wide"
              />
              <button
                type="submit"
                disabled={savingGoal}
                className="h-6 w-6 flex items-center justify-center text-success hover:bg-success/20 border border-success/40 bg-success/10 transition-colors cursor-pointer shrink-0"
                title="Save Goal"
              >
                {savingGoal ? (
                  <span className="animate-spin text-[9px]">...</span>
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingGoal(false)}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-card/60 border border-border/40 transition-colors cursor-pointer shrink-0"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Desktop Sidebar Tab Selectors */}
      <nav className="hidden lg:flex flex-col gap-1.5 border border-border bg-card/40 backdrop-blur-md p-3 shadow-2xl">
        <div className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-bold px-2.5 mb-1.5 flex items-center justify-between select-none">
          <span>SYSTEM MENU</span>
          <Cpu className="h-3 w-3 text-primary/60" />
        </div>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`w-full text-left px-3 py-2.5 border text-[11px] font-bold uppercase transition-all duration-200 flex items-center justify-between cursor-pointer group ${
                isActive
                  ? "border-primary/60 bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.12)] border-l-4 border-l-primary"
                  : "border-transparent text-muted-foreground/50 hover:text-foreground hover:bg-card/40 hover:border-border/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? "text-primary" : "text-muted-foreground/40 group-hover:text-foreground"}>
                  {tab.icon}
                </span>
                <span className="tracking-wide">{tab.label}</span>
              </div>
              {tab.count !== undefined && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 border ${
                    isActive ? "border-primary/30 bg-primary/10 text-primary font-bold" : "border-border/40 text-muted-foreground/30"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Tab Selectors (Horizontal layout) */}
      <div className="flex lg:hidden overflow-x-auto scrollbar-thin pb-2 border-b border-border/40 gap-2 select-none shrink-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 border text-[10px] tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-primary/50 bg-primary/10 text-primary font-bold shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]"
                  : "border-border bg-card/40 text-muted-foreground/50 hover:text-foreground hover:border-border/80"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && <span className="text-[8px] opacity-60 font-bold">({tab.count})</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
