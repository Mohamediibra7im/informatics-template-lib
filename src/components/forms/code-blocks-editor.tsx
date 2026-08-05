"use client";

import { useState } from "react";
import { Plus, X, Sparkles } from "lucide-react";
import { TrafficLights } from "@/components/terminal";
import { CodeEditor } from "./code-editor";
import { formatCode } from "@/lib/format-code";
import { toast } from "sonner";

export interface CodeBlock {
  language: string;
  code: string;
}

export const CONTRIBUTE_LANGUAGES = ["cpp", "python", "java", "rust", "go", "javascript", "kotlin"];

/**
 * Multi-language code editor used by both contribute forms.
 * - Includes a "Format Code" button for automatic formatting.
 * - Pass `onLanguageChange` to render a language <select> (new-template form).
 *   Omit it to show the language as a static label (edit-request form).
 * - Pass `onAdd` to render the "add language" button.
 * - Pass `onRemove` to allow removing blocks (only shown when >1 block).
 */
export function CodeBlocksEditor({
  blocks,
  onCodeChange,
  onLanguageChange,
  onAdd,
  onRemove,
  languages = CONTRIBUTE_LANGUAGES,
  onInteract,
}: {
  blocks: CodeBlock[];
  onCodeChange: (index: number, code: string) => void;
  onLanguageChange?: (index: number, language: string) => void;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  languages?: string[];
  onInteract?: () => void;
}) {
  const [formattingIndex, setFormattingIndex] = useState<number | null>(null);

  const handleFormat = async (index: number, code: string, lang: string) => {
    if (!code.trim()) return;
    setFormattingIndex(index);
    try {
      const formatted = await formatCode(code, lang);
      onCodeChange(index, formatted);
      toast.success("Code formatted");
    } catch {
      toast.error("Failed to format code");
    } finally {
      setFormattingIndex(null);
    }
  };

  return (
    <>
      {blocks.map((block, index) => (
        <div key={index} className="border border-border/60 bg-background/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrafficLights />
              {onLanguageChange ? (
                <select
                  value={block.language}
                  onChange={(e) => {
                    onInteract?.();
                    onLanguageChange(index, e.target.value);
                  }}
                  className="bg-background/40 border border-border text-xs font-mono h-7 px-2 outline-none cursor-pointer appearance-none"
                >
                  {languages.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[10px] text-muted-foreground/40 font-mono font-bold uppercase">
                  {block.language}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFormat(index, block.code, block.language)}
                disabled={formattingIndex === index || !block.code.trim()}
                className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold px-2 py-1 border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
                title="Format code automatically"
              >
                <Sparkles className={`h-3 w-3 ${formattingIndex === index ? "animate-spin" : ""}`} />
                <span>{formattingIndex === index ? "Formatting..." : "Format"}</span>
              </button>

              {onRemove && blocks.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 cursor-pointer"
                  title="Remove code block"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="border border-border/40 overflow-hidden bg-black/40">
            <CodeEditor
              value={block.code}
              language={block.language}
              onChange={(val) => {
                onInteract?.();
                onCodeChange(index, val);
              }}
              height={320}
            />
          </div>
        </div>
      ))}

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="text-[10px] px-3 py-1.5 border border-border hover:border-primary/40 text-muted-foreground hover:text-primary transition-colors uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="h-3 w-3" />
          add language
        </button>
      )}
    </>
  );
}
