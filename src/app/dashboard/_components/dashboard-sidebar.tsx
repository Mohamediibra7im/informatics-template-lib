"use client";

import { ReactNode } from "react";
import { User, ShieldCheck, Zap, Cpu } from "lucide-react";
import { Tab } from "./types";

interface SidebarProps {
  username: string;
  hasCalendarToken: boolean;
  activeTab: Tab;
  tabs: { id: Tab; label: string; icon: ReactNode; count?: number }[];
  onChangeTab: (tabId: Tab) => void;
}

export function DashboardSidebar({
  username,
  hasCalendarToken,
  activeTab,
  tabs,
  onChangeTab,
}: SidebarProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-5 font-mono">
      {/* User console session overview widget */}
      <div className="border border-border bg-card/40 backdrop-blur-md p-4 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-primary/10 blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all duration-500" />
        <div className="flex items-center gap-3 mb-3.5 border-b border-border/40 pb-3">
          <div className="relative flex items-center justify-center h-10 w-10 border border-primary/40 bg-primary/10 text-primary shrink-0 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]">
            <User className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-foreground truncate tracking-wide">{username}</div>
            <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1 mt-0.5 font-bold">
              <ShieldCheck className="h-3 w-3 text-success" />
              <span>SESSION_ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-[9.5px] text-muted-foreground/60 leading-relaxed font-mono">
          <div className="flex justify-between items-center bg-background/30 px-2 py-1 border border-border/30">
            <span className="text-muted-foreground/45">$ USER</span>
            <span className="text-primary font-bold">{username}</span>
          </div>
          <div className="flex justify-between items-center bg-background/30 px-2 py-1 border border-border/30">
            <span className="text-muted-foreground/45">$ STATUS</span>
            <span className="text-success font-bold flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" /> 100% ONLINE
            </span>
          </div>
          <div className="flex justify-between items-center bg-background/30 px-2 py-1 border border-border/30">
            <span className="text-muted-foreground/45">$ CALENDAR</span>
            <span className={hasCalendarToken ? "text-success font-bold" : "text-warning font-bold"}>
              {hasCalendarToken ? "LINKED" : "UNLINKED"}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar Tab Selectors */}
      <nav className="hidden lg:flex flex-col gap-1.5 border border-border bg-card/40 backdrop-blur-md p-3 shadow-2xl">
        <div className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-bold px-2.5 mb-1.5 flex items-center justify-between">
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
