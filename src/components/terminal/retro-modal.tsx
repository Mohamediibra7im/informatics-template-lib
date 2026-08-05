"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Tone = "destructive" | "warning" | "primary";

const toneMap: Record<
  Tone,
  { border: string; shadow: string; headBorder: string; headBg: string; text: string; confirm: string }
> = {
  destructive: {
    border: "border-destructive",
    shadow: "shadow-[0_0_40px_rgba(239,68,68,0.25)]",
    headBorder: "border-destructive/30",
    headBg: "bg-destructive/10",
    text: "text-destructive",
    confirm: "border-destructive bg-destructive/15 hover:bg-destructive/35 text-destructive",
  },
  warning: {
    border: "border-warning",
    shadow: "shadow-[0_0_40px_rgba(234,179,8,0.2)]",
    headBorder: "border-warning/30",
    headBg: "bg-warning/10",
    text: "text-warning",
    confirm: "border-warning bg-warning/15 hover:bg-warning/35 text-warning",
  },
  primary: {
    border: "border-primary",
    shadow: "shadow-[0_0_40px_rgba(34,197,94,0.15)]",
    headBorder: "border-primary/30",
    headBg: "bg-primary/10",
    text: "text-primary",
    confirm: "border-primary bg-primary/15 hover:bg-primary/35 text-primary",
  },
};

/**
 * The generic BIOS/terminal modal shell: fixed overlay, bordered box, a header
 * bar (ping dot + title + right-aligned tag) and arbitrary body content.
 * Use `RetroConfirmModal` for the common cancel/confirm dialog.
 */
export function RetroModal({
  tone = "destructive",
  title,
  tag,
  onClose,
  children,
  className,
  selectNone = true,
}: {
  tone?: Tone;
  title: React.ReactNode;
  tag?: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  selectNone?: boolean;
}) {
  const t = toneMap[tone];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape when the caller opted in with onClose.
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  const content = (
    <div
      onClick={onClose ? () => onClose() : undefined}
      className={cn(
        "fixed inset-0 z-[9999] bg-background/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto",
        selectNone && "select-none"
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-lg border bg-card/95 overflow-hidden font-mono max-h-[90vh] flex flex-col shadow-2xl my-auto",
          t.border,
          t.shadow,
          className
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2 border-b text-[10px] font-bold uppercase tracking-wider shrink-0",
            t.headBorder,
            t.headBg,
            t.text
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("h-2 w-2 rounded-full animate-ping shrink-0", tone === "destructive" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-primary")} />
            <span className="truncate">{title}</span>
          </div>
          {tag && <span className="shrink-0">{tag}</span>}
        </div>
        <div className="overflow-y-auto flex-1 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

/**
 * Cancel / confirm dialog built on RetroModal. Covers delete, reject, revert,
 * and history-purge confirmations.
 */
export function RetroConfirmModal({
  tone = "destructive",
  title = "[!] [ CAUTION: DESTRUCTIVE ACTION ]",
  tag = "WARN_LEVEL_3",
  commandTarget,
  children,
  cancelLabel = "Abort Command",
  confirmLabel,
  onCancel,
  onConfirm,
  confirmDisabled,
}: {
  tone?: Tone;
  title?: React.ReactNode;
  tag?: React.ReactNode;
  /** Optional `$ cmd path` line shown in a boxed row. */
  commandTarget?: { cmd: string; path: React.ReactNode };
  children: React.ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}) {
  const t = toneMap[tone];
  return (
    <RetroModal tone={tone} title={title} tag={tag}>
      <div className="p-6 space-y-4">
        {commandTarget && (
          <div className="space-y-1">
            <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">command target</div>
            <div className="text-xs font-bold text-foreground bg-muted/20 p-2 border border-border flex items-center gap-2">
              <span className={cn("font-bold", t.text)}>{commandTarget.cmd}</span>
              <span>{commandTarget.path}</span>
            </div>
          </div>
        )}
        <div className="text-xs text-muted-foreground/85 leading-relaxed font-mono">{children}</div>
      </div>
      <div className="border-t border-border/45 px-6 py-4 bg-muted/5 flex justify-end gap-3 text-[10px]">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary/40 hover:text-primary transition-colors uppercase font-mono cursor-pointer"
        >
          <span>[ ESC ]</span>
          <span>{cancelLabel}</span>
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 border transition-colors uppercase font-mono font-bold cursor-pointer disabled:opacity-50",
            t.confirm
          )}
        >
          <span>[ ENTER ]</span>
          <span>{confirmLabel}</span>
        </button>
      </div>
    </RetroModal>
  );
}
