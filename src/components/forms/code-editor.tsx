"use client";

import dynamic from "next/dynamic";

/**
 * Monaco (the editor that powers VS Code) — dynamically imported client-side
 * only so it never runs during SSR. Gives line numbers, IntelliSense, minimap,
 * bracket colorization, multi-cursor, find/replace, and the F1 command palette.
 */
const MonacoCodeEditor = dynamic(() => import("./monaco-code-editor"), {
  ssr: false,
  loading: () => (
    <div className="p-3 font-mono text-[11px] text-muted-foreground/40 animate-pulse">
      booting editor…
    </div>
  ),
});

export function CodeEditor(props: {
  value: string;
  language: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  height?: number;
}) {
  return <MonacoCodeEditor {...props} />;
}
