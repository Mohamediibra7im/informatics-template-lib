"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="relative z-10 flex min-h-[75vh] flex-col items-center justify-center px-4 py-12 font-mono">
      <div className="w-full max-w-xl border border-primary bg-card/90 shadow-[0_0_25px_var(--primary-glow-weak)]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-primary/40 bg-muted/10 select-none">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive/60 animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-warning/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-success/60" />
            </div>
            <span className="text-[10px] font-bold text-destructive animate-pulse uppercase tracking-wider">
              [kernel_panic: 404_PAGE_NOT_FOUND]
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground/30">
            TTY_ALERT_0
          </span>
        </div>

        {/* Crash Output Logs */}
        <div className="p-5 space-y-3.5 text-xs text-foreground bg-[#020703] border-b border-primary/20 select-text leading-relaxed">
          <div className="flex items-start gap-2.5 text-destructive border-b border-destructive/20 pb-2 mb-2">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold tracking-wider text-[11px] uppercase">*** FATAL EXCEPTION DETECTED ***</div>
              <div className="text-[10px] text-muted-foreground/50">Core dumped at page registration layer</div>
            </div>
          </div>

          <div className="space-y-1 text-muted-foreground/45 text-[11px]">
            <div>[  0.000000] Booting ITL Core kernel...</div>
            <div>[  0.003102] Loading algorithms and template schemas... done</div>
            <div>[  0.009482] Initializing virtual routes... done</div>
            <div className="text-destructive font-bold">[  0.012548] [ERROR] route pointer resolved to NULL pointer exception!</div>
            <div className="text-destructive font-bold">[  0.012570] [ERROR] target path: &quot;{pathname}&quot; not found in router table</div>
            <div>[  0.012595] Exception handler loaded (status: 404)</div>
            <div>[  0.012620] Diagnostic: check domain parameters and link query parameters</div>
          </div>

          <div className="flex items-center gap-1 mt-4 text-[11px] text-primary/70">
            <span>guest@itl:~$</span>
            <span>locate {pathname}</span>
            <span className="inline-block h-3 w-1.5 bg-primary animate-blink ml-0.5" />
          </div>
        </div>

        {/* Action setup as system configuration buttons */}
        <div className="p-4 bg-card flex flex-col sm:flex-row gap-2.5 justify-end">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 h-9 border border-border bg-muted/10 text-xs px-4 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all rounded-none cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>[ ESC: cd - (back) ]</span>
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 h-9 border border-primary bg-primary/5 text-xs px-4 text-primary hover:bg-primary/10 transition-all rounded-none"
          >
            <Home className="h-3.5 w-3.5" />
            <span>[ ENTER: cd ~ (home) ]</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
