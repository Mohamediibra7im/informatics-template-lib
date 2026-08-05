"use client";

import { useEffect, useState, useMemo } from "react";
import { createHighlighter, type Highlighter } from "shiki";
import { Check, Clipboard } from "lucide-react";

const langMap: Record<string, string> = {
  cpp: "cpp",
  python: "python",
  java: "java",
  rust: "rust",
  go: "go",
  javascript: "javascript",
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      langs: ["cpp", "python", "java", "rust", "go", "javascript"],
      themes: ["github-dark"],
    });
  }
  return highlighterPromise;
}

export function CodeBlock({ code: originalCode, language, templateId }: { code: string; language: string; templateId?: number }) {
  const code = useMemo(() => {
    const lines = originalCode.trimEnd().split("\n");
    while (lines.length > 1 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }
    return lines.join("\n");
  }, [originalCode]);
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const lineCount = useMemo(() => code.split("\n").length, [code]);

  useEffect(() => {
    const lang = langMap[language] || "cpp";
    getHighlighter().then((hl) => {
      let themed = hl.codeToHtml(code, {
        lang,
        theme: "github-dark",
      });
      themed = themed.replace(/(<span class="line"><\/span>\s*)+(<\/code>)/, "$2");
      setHtml(themed);
    });
  }, [code, language]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (templateId) {
      fetch("/api/templates/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      }).catch((err) => console.error("Failed to increment copy count:", err));
    }
  };

  return (
    <div className="relative border border-border bg-background overflow-hidden">
      {/* Top bar — minimal */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-error/60" />
            <span className="h-2 w-2 rounded-full bg-warning/60" />
            <span className="h-2 w-2 rounded-full bg-success/60" />
          </div>
          <span className="text-[10px] text-muted-foreground/40 font-mono uppercase tracking-widest">
            {language}
          </span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40 hover:text-primary transition-colors uppercase tracking-wider"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-success" />
              <span className="text-success">copied</span>
            </>
          ) : (
            <>
              <Clipboard className="h-3 w-3" />
              <span>copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code area — line numbers ride shiki's own .line spans via CSS
          counters, so the gutter can never drift out of sync with the code. */}
      <style>{`
        .cb-code code { counter-reset: cb-line; }
        .cb-code .line { counter-increment: cb-line; }
        .cb-code .line::before {
          content: counter(cb-line, decimal-leading-zero);
          display: inline-block;
          width: 3ch;
          margin-right: 1.5rem;
          text-align: right;
          color: var(--muted-foreground);
          opacity: 0.25;
          user-select: none;
        }
      `}</style>
      <div className="overflow-x-auto py-3 px-4">
        {html ? (
          <div
            className="cb-code text-[12px] [&_pre]:!bg-transparent [&_code]:!bg-transparent"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="text-[12px] text-foreground/80">
            <code>{code}</code>
          </pre>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-border/50 bg-muted/20 text-[10px] text-muted-foreground/30">
        <span>{lineCount} lines</span>
        <span>utf-8</span>
      </div>
    </div>
  );
}
