"use client";

import { Plus, X } from "lucide-react";
import { TrafficLights } from "@/components/terminal";

export interface CodeBlock {
  language: string;
  code: string;
}

export const CONTRIBUTE_LANGUAGES = ["cpp", "python", "java", "rust", "go", "javascript", "kotlin"];

/**
 * Multi-language code editor used by both contribute forms.
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
                  onChange={(e) => { onInteract?.(); onLanguageChange(index, e.target.value); }}
                  className="bg-background/40 border border-border text-xs font-mono h-7 px-2 outline-none cursor-pointer appearance-none"
                >
                  {languages.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              ) : (
                <span className="text-[10px] text-muted-foreground/40">{block.language}</span>
              )}
            </div>
            {onRemove && blocks.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-muted-foreground/40 hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <textarea
            value={block.code}
            onChange={(e) => onCodeChange(index, e.target.value)}
            placeholder="Paste your code here..."
            rows={12}
            className="w-full bg-foreground/5 dark:bg-black/30 border border-border/40 text-xs font-mono px-3 py-2.5 outline-none transition-colors resize-y text-foreground/90 leading-relaxed"
            spellCheck={false}
          />
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
