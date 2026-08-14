"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, ArrowUpRight } from "lucide-react";
import { useTerminalTheme } from "./theme-provider";
import { BrandLogo } from "./brand-logo";

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/editor" || pathname?.startsWith("/editor/")) return null;
  const year = new Date().getFullYear();
  const { playClick } = useTerminalTheme();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="border-t border-border/40 bg-background font-mono select-none text-foreground pt-8 pb-6 px-6 text-xs">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Top Header: Brand, Description & Live Telemetry Widgets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border/30">
          
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" />
              <span className="text-border">|</span>
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-widest font-semibold font-mono">
                Verified Algorithm Vault
              </span>
            </div>
            <p className="text-muted-foreground/75 text-xs leading-relaxed">
              Fast, contest-ready algorithm vault & code snippet library for competitive programmers.
            </p>
          </div>

          {/* Widgets: System Status & Live Clock */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 border border-border/50 bg-card/40 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-foreground font-medium">Operational</span>
            </div>

            {time && (
              <div className="flex items-center gap-2 px-2.5 py-1 border border-border/50 bg-card/40 text-muted-foreground text-[11px]">
                <Clock className="h-3 w-3 text-primary" />
                <span className="font-semibold text-foreground tracking-wider">{time}</span>
                <span className="text-[9px] text-primary font-bold uppercase">LOCAL</span>
              </div>
            )}
          </div>

        </div>

        {/* Middle Section: Categorized Topics & Essential Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-1">
          
          {/* Quick Topics Pills (7 Cols) */}
          <div className="md:col-span-7 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mr-1">
              Topics:
            </span>
            {[
              { label: "#data-structures", href: "/templates?q=data-structures" },
              { label: "#graph-theory", href: "/templates?q=graph" },
              { label: "#dynamic-programming", href: "/templates?q=dp" },
              { label: "#math", href: "/templates?q=math" },
              { label: "#strings", href: "/templates?q=strings" },
            ].map((topic) => (
              <Link
                key={topic.label}
                href={topic.href}
                onClick={playClick}
                className="px-2 py-0.5 border border-border/40 bg-card/30 hover:border-primary/50 hover:bg-card text-[11px] text-muted-foreground hover:text-foreground transition-all"
              >
                {topic.label}
              </Link>
            ))}
          </div>

          {/* Quick Links (5 Cols) */}
          <div className="md:col-span-5 flex flex-wrap items-center justify-start md:justify-end gap-3 text-muted-foreground/80 font-medium">
            <Link href="/" onClick={playClick} className="hover:text-primary transition-colors">
              Home
            </Link>
            <span className="text-border/60">·</span>
            <Link href="/categories" onClick={playClick} className="hover:text-primary transition-colors">
              Categories
            </Link>
            <span className="text-border/60">·</span>
            <Link href="/templates" onClick={playClick} className="hover:text-primary transition-colors">
              Templates
            </Link>
            <span className="text-border/60">·</span>
            <Link href="/docs" onClick={playClick} className="hover:text-primary transition-colors">
              Docs
            </Link>
          </div>

        </div>

        {/* Bottom Signature Line */}
        <div className="pt-4 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10.5px] sm:text-[11px] text-muted-foreground/65 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span>© {year} ITL. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-1 gap-y-0.5">
            <span>crafted for competitive programmers by</span>
            <a
              href="https://mohamediibrahim.dev"
              target="_blank"
              rel="noopener noreferrer"
              onClick={playClick}
              className="text-foreground hover:text-primary transition-colors font-semibold inline-flex items-center gap-0.5 whitespace-nowrap ml-0.5"
            >
              <span>Mohamed Ibrahim</span>
              <ArrowUpRight className="h-2.5 w-2.5 opacity-60 shrink-0" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
