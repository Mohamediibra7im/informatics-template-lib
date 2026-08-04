"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Wand2 } from "lucide-react";

export interface CodeEntry {
  language: string;
  code: string;
}

export const ADMIN_LANGUAGES = [
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "javascript", label: "JavaScript" },
];

/**
 * The "Source Code" tab of the admin template editor — shared by the new and
 * edit template pages. Handles the language <Select>, per-block format/delete,
 * and the add-language button.
 */
export function AdminCodeEditor({
  codes,
  formattingIdx,
  languages = ADMIN_LANGUAGES,
  onAdd,
  onUpdateCode,
  onRemove,
  onFormat,
  onSound,
  onFocusCode,
}: {
  codes: CodeEntry[];
  formattingIdx: number | null;
  languages?: { value: string; label: string }[];
  onAdd: () => void;
  onUpdateCode: (index: number, field: keyof CodeEntry, value: string) => void;
  onRemove: (index: number) => void;
  onFormat: (index: number, code: string, language: string) => void;
  onSound: () => void;
  onFocusCode: () => void;
}) {
  return (
    <div className="space-y-4" onClick={onFocusCode}>
      <div className="flex items-center justify-between border-b border-primary/10 pb-2">
        <Label className="text-xs font-bold tracking-wider text-foreground flex items-center gap-1.5">
          <span className="text-primary animate-pulse">▶</span>
          <span>Language Code Source Files</span>
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="font-mono text-[10px] h-7 border-primary/30 hover:border-primary hover:text-primary rounded-none bg-primary/5"
        >
          <Plus className="h-3 w-3 mr-1" />
          <span>Add Language</span>
        </Button>
      </div>

      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
        {codes.map((entry, i) => (
          <div key={i} className="p-4 border border-primary/15 bg-primary/[0.01] space-y-3 rounded-none relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/50 select-none">FILE_{i + 1}:</span>
                <Select value={entry.language} onValueChange={(v) => { onSound(); if (v) onUpdateCode(i, "language", v); }}>
                  <SelectTrigger className="w-32 bg-background/50 border-border text-xs font-mono h-7 rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs">
                    {languages.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={formattingIdx === i}
                  onClick={() => onFormat(i, entry.code, entry.language)}
                  className="text-[10px] text-muted-foreground/35 hover:text-primary transition-colors border border-transparent hover:border-primary/20 px-1.5 py-0.5 disabled:opacity-30"
                >
                  <Wand2 className={`h-3 w-3 inline mr-1 ${formattingIdx === i ? "animate-spin" : ""}`} />[Format]
                </button>
                {codes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="text-[10px] text-muted-foreground/35 hover:text-destructive transition-colors border border-transparent hover:border-destructive/20 px-1.5 py-0.5"
                  >
                    <Trash2 className="h-3 w-3 inline mr-1" />[Delete]
                  </button>
                )}
              </div>
            </div>
            <Textarea
              value={entry.code}
              onChange={(e) => onUpdateCode(i, "code", e.target.value)}
              placeholder={`// Paste your ${languages.find((l) => l.value === entry.language)?.label || entry.language} code here...`}
              className="font-mono text-xs bg-background/30 border-border focus:border-primary/50 min-h-[150px] rounded-none resize-y"
              onFocus={onFocusCode}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
