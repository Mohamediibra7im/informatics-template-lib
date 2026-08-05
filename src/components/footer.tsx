"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, Braces, Library, Heart, Globe, Cpu, Wifi, Code, Clock, ShieldAlert } from "lucide-react";
import { useTerminalTheme } from "./theme-provider";

export function Footer() {
  const year = new Date().getFullYear();
  const { playClick } = useTerminalTheme();
  const [time, setTime] = useState<string>("");
  const [cpuUsage, setCpuUsage] = useState<number>(45);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate server CPU ticking load
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 25) + 30);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="border-t border-border bg-card/25 backdrop-blur-md font-mono select-none relative overflow-hidden">
      {/* Sci-fi Scanline background pattern overlay */}
      <div className="absolute inset-0 bg-grid-line opacity-[0.02] pointer-events-none" />

      {/* Decorative colored top border accents */}
      <div className="h-0.5 w-full bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10" />

      <div className="mx-auto max-w-7xl px-6 relative z-10 py-6 space-y-5">
        
        {/* Main Grid: Info, Navigation, System Monitor */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
          
          {/* Main Logo & Description */}
          <div className="md:col-span-5 space-y-4">
            <Link
              href="/"
              onClick={playClick}
              className="flex items-center gap-2 group w-fit"
            >
              <div className="flex items-center justify-center h-6.5 w-6.5 border border-primary bg-primary/5 shadow-[0_0_10px_var(--primary-glow-weak)] group-hover:shadow-[0_0_15px_var(--primary-glow)] transition-all">
                <Terminal className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-[13px] font-bold tracking-[0.25em] text-primary uppercase glow-text-strong">
                CP-Base // Mainframe
              </span>
            </Link>
            <p className="text-[11px] text-muted-foreground/35 leading-relaxed max-w-sm">
              The ultimate algorithm library repository for competitive programming. 
              Deploying verified, highly optimized code architectures directly into contestant local filesystems.
            </p>

            {/* Server Alert Message of the Day */}
            <div className="border border-border/60 bg-background/50 p-2.5 flex items-start gap-2.5 max-w-xs dark:shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
              <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5 animate-pulse" />
              <div className="text-[9px] text-muted-foreground/45 space-y-0.5">
                <span className="text-warning font-bold uppercase tracking-wider">[MOTD ALERT]</span>
                <p>Compile template scripts locally. Ensure standard C++20 compiler configurations are active.</p>
              </div>
            </div>
          </div>

          {/* Directories / Links */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-primary rounded-full animate-ping" />
              <span>$ ls directories/</span>
            </h4>
            <nav className="flex flex-col gap-3 pl-1.5">
              <Link
                href="/categories"
                onClick={playClick}
                className="flex items-center gap-2 text-[11px] text-muted-foreground/40 hover:text-primary transition-all w-fit group"
              >
                <Braces className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                <span>categories/</span>
              </Link>
              <Link
                href="/templates"
                onClick={playClick}
                className="flex items-center gap-2 text-[11px] text-muted-foreground/40 hover:text-primary transition-all w-fit group"
              >
                <Library className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                <span>templates_all/</span>
              </Link>
            </nav>
          </div>

          {/* Sci-Fi Server System Monitor Pane */}
          <div className="md:col-span-4 space-y-3">
            <div className="w-full border border-border/80 bg-background/60 dark:shadow-[inset_0_0_20px_rgba(0,0,0,0.7)]">
              {/* Window Title Header */}
              <div className="flex items-center justify-between border-b border-border/40 px-3 py-1 bg-muted/10 text-[9px] text-muted-foreground/35 uppercase select-none">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive/60 animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-warning/60" />
                  <span className="h-1.5 w-1.5 rounded-full bg-success/60" />
                  <span className="ml-1 text-[8px] tracking-widest text-primary/70">SYS_DIAGNOSTICS</span>
                </div>
                <span>STATUS: OK</span>
              </div>
              {/* System Performance statistics */}
              <div className="p-3.5 text-[10px] space-y-2 font-mono text-muted-foreground/40">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span>CPU LOAD</span>
                    <span className="text-primary/70 font-bold">{cpuUsage}%</span>
                  </div>
                  <div className="border border-border/50 p-0.5 bg-foreground/5 dark:bg-black/40 flex text-[9px]">
                    {(() => {
                      const totalBlocks = 15;
                      const activeBlocks = Math.round((cpuUsage / 100) * totalBlocks);
                      return (
                        <span className="text-primary tracking-tighter">
                          {"█".repeat(activeBlocks) + "░".repeat(totalBlocks - activeBlocks)}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span>MEMORY UTILS</span>
                    <span className="text-info font-bold">128MB / 512MB</span>
                  </div>
                  <div className="border border-border/50 p-0.5 bg-foreground/5 dark:bg-black/40 flex text-[9px]">
                    <span className="text-info tracking-tighter">
                      {"████░░░░░░░░░░░"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Telemetry Info Bar */}
        <div className="border-t border-border/40 pt-4 flex flex-wrap items-center justify-between gap-4 text-[9px] text-muted-foreground/25 tracking-widest uppercase">
          <div className="flex flex-wrap items-center gap-4.5">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-muted-foreground/20" />
              <span>host: cp-base.net</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-muted-foreground/20" />
              <span>system: online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3 w-3 text-muted-foreground/20 animate-pulse" />
              <span>latency: 12ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Code className="h-3 w-3 text-muted-foreground/20" />
              <span>mode: dark</span>
            </div>
            {time && (
              <div className="flex items-center gap-1.5 animate-pulse">
                <Clock className="h-3 w-3 text-muted-foreground/20" />
                <span>time: {time}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 select-none">
            <span>secure ssl console link active</span>
            <span className="h-1.5 w-1.5 bg-primary rounded-full animate-ping" />
          </div>
        </div>

        {/* Bottom credits line */}
        <div className="border-t border-border/15 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] text-muted-foreground/20">
          <div className="flex items-center gap-1.5">
            <span>© {year} CP-BASE MAINFRAME SYSTEMS</span>
            <span className="text-border/30">·</span>
            <span>compiled with</span>
            <Heart className="h-2.5 w-2.5 text-destructive/40 fill-destructive/40" />
            <span>for active programmers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>crafted by</span>
            <a
              href="https://mohamediibrahim.dev"
              target="_blank"
              rel="noopener noreferrer"
              onClick={playClick}
              className="text-primary/45 hover:text-primary hover:underline transition-all font-bold"
            >
              Mohamed Ibrahim
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
