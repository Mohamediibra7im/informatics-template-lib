"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useTerminalTheme } from "./theme-provider";
import { toast } from "sonner";

export function CliBanner() {
  const [copied, setCopied] = useState(false);
  const { playSuccess } = useTerminalTheme();
  const command = "npx itl --init --template=all";

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    playSuccess();
    setCopied(true);
    toast.success("Command copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      <button
        onClick={handleCopy}
        className="border border-border/80 bg-card/45 hover:border-primary/50 hover:shadow-[0_0_15px_var(--primary-glow-weak)] transition-all px-4 py-3 w-full flex items-center justify-between font-mono text-[11px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-left cursor-pointer group outline-none"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-primary/70">$</span>
          <span className="text-foreground">{command}</span>
        </div>
        <div className="flex items-center gap-2 select-none">
          {copied ? (
            <span className="text-success text-[9px] font-bold uppercase flex items-center gap-1">
              <Check className="h-3.5 w-3.5" />
              Copied
            </span>
          ) : (
            <span className="text-muted-foreground/35 group-hover:text-primary transition-colors text-[9px] uppercase tracking-wider font-bold flex items-center gap-1">
              <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              [COPY]
            </span>
          )}
        </div>
      </button>
      <p className="text-[10px] text-muted-foreground/35 leading-normal select-none pl-1">
        * Note: The CLI package is currently under construction. Please copy templates directly from the web interface.
      </p>
    </div>
  );
}
