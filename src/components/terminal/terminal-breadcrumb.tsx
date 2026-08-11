import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
  /** Extra classes for this segment (e.g. `text-info font-bold` for a category). */
  className?: string;
}

/**
 * The `guest@itl:~ / … $` breadcrumb used on top of most pages.
 * Renders each item as `/ <label>`, with a trailing prompt + blinking cursor.
 */
export function TerminalBreadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1 font-mono text-xs select-none", className)}>
      <span className="text-primary font-bold">guest@itl:</span>
      <span className="text-muted-foreground/40">~</span>
      {items.map((it, i) => (
        <Fragment key={i}>
          <span className="text-muted-foreground/40">/</span>
          {it.href ? (
            <Link
              href={it.href}
              className={cn(
                "text-muted-foreground hover:text-primary hover:underline transition-colors underline-offset-4",
                it.className
              )}
            >
              {it.label}
            </Link>
          ) : (
            <span className={cn("text-foreground font-bold", it.className)}>{it.label}</span>
          )}
        </Fragment>
      ))}
      <span className="text-primary/60 ml-1 font-bold">$</span>
      <span className="inline-block h-3.5 w-1.5 bg-primary/70 animate-blink ml-1 align-middle" />
    </div>
  );
}
