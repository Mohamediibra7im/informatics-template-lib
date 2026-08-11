"use client";

import Link from "next/link";
import { useTerminalTheme } from "./theme-provider";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "stacked" | "inline" | "text-only";
  className?: string;
}

export function BrandLogo({
  size = "md",
  variant = "stacked",
  className = "",
}: BrandLogoProps) {
  const { playClick } = useTerminalTheme();

  const isSm = size === "sm";
  const isLg = size === "lg";

  // VARIANT: INLINE (Single-line premium developer tool layout like Linear / Raycast)
  if (variant === "inline") {
    return (
      <Link
        href="/"
        onClick={playClick}
        aria-label="Informatics Template Library — Home"
        className={`group inline-flex shrink-0 items-center gap-2.5 select-none font-mono py-1 transition-opacity hover:opacity-90 ${className}`}
      >
        <div className={`flex shrink-0 items-center justify-center rounded border border-primary/30 bg-primary/10 font-mono font-black text-primary transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground ${
          isSm ? "h-5 w-5 text-[8px]" : isLg ? "h-7 w-7 text-xs" : "h-6 w-6 text-[9.5px]"
        }`}>
          ITL
        </div>

        <div className="flex items-center gap-2">
          <span className={`font-black uppercase text-foreground group-hover:text-primary transition-colors ${
            isSm ? "text-xs tracking-[0.14em]" : isLg ? "text-base tracking-[0.2em]" : "text-xs sm:text-sm tracking-[0.16em]"
          }`}>
            INFORMATICS
          </span>
          <span className="text-primary/30 font-light text-xs hidden sm:inline-block">|</span>
          <span className={`font-semibold uppercase text-muted-foreground/75 group-hover:text-foreground transition-colors hidden sm:inline-block ${
            isSm ? "text-[9px] tracking-[0.14em]" : isLg ? "text-xs tracking-[0.2em]" : "text-[10px] tracking-[0.16em]"
          }`}>
            TEMPLATE LIBRARY
          </span>
        </div>
      </Link>
    );
  }

  // VARIANT: TEXT ONLY (Ultra minimalist typographic brand)
  if (variant === "text-only") {
    return (
      <Link
        href="/"
        onClick={playClick}
        aria-label="Informatics Template Library — Home"
        className={`group inline-flex shrink-0 flex-col leading-none select-none font-mono py-0.5 transition-opacity hover:opacity-90 ${className}`}
      >
        <span className={`font-black uppercase text-foreground transition-colors duration-300 group-hover:text-primary ${
          isSm ? "text-xs tracking-[0.16em]" : isLg ? "text-base sm:text-xl tracking-[0.24em]" : "text-xs sm:text-sm tracking-[0.18em]"
        }`}>
          INFORMATICS
        </span>
        <span className={`mt-0.5 font-bold uppercase text-muted-foreground/60 transition-colors duration-300 group-hover:text-foreground ${
          isSm ? "text-[7px] tracking-[0.18em]" : isLg ? "text-[10px] tracking-[0.26em]" : "text-[8px] sm:text-[8.5px] tracking-[0.22em]"
        }`}>
          TEMPLATE LIBRARY
        </span>
      </Link>
    );
  }

  // DEFAULT VARIANT: STACKED (Premium & Simple Dual-Line Brand)
  return (
    <Link
      href="/"
      onClick={playClick}
      aria-label="Informatics Template Library — Home"
      className={`group inline-flex shrink-0 items-center gap-3 leading-none select-none font-mono py-0.5 transition-opacity hover:opacity-90 ${className}`}
    >
      {/* Sleek Minimalist ITL Icon Badge */}
      <div className={`relative flex shrink-0 items-center justify-center rounded border border-primary/30 bg-primary/10 font-mono font-black text-primary transition-all duration-300 group-hover:border-primary/60 group-hover:bg-primary/20 group-hover:shadow-[0_0_12px_var(--primary-glow-weak)] ${
        isSm ? "h-6 w-6 text-[9px]" : isLg ? "h-9 w-9 text-xs" : "h-7.5 w-7.5 text-[10px]"
      }`}>
        ITL
      </div>

      {/* Clean Premium Typographic Stack */}
      <div className="flex flex-col leading-none justify-center">
        <span className={`font-black uppercase text-foreground transition-colors duration-300 group-hover:text-primary ${
          isSm ? "text-[11px] tracking-[0.16em]" : isLg ? "text-base sm:text-xl tracking-[0.22em]" : "text-xs sm:text-sm tracking-[0.18em]"
        }`}>
          INFORMATICS
        </span>
        <span className={`mt-1 font-bold uppercase text-muted-foreground/60 transition-colors duration-300 group-hover:text-muted-foreground ${
          isSm ? "text-[7px] tracking-[0.18em]" : isLg ? "text-[10px] tracking-[0.26em]" : "text-[8px] sm:text-[8.5px] tracking-[0.22em]"
        }`}>
          TEMPLATE LIBRARY
        </span>
      </div>
    </Link>
  );
}
