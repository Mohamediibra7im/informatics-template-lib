"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Library, Copy, Code, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserTemplate } from "./types";

interface TemplatesTabProps {
  userTemplates: UserTemplate[];
  playClick: () => void;
  playSuccess: () => void;
  onToastSuccess: (msg: string) => void;
}

export function TemplatesTab({
  userTemplates,
  playClick,
  playSuccess,
  onToastSuccess,
}: TemplatesTabProps) {
  const [templateSearch, setTemplateSearch] = useState("");

  const filteredTemplates = userTemplates.filter(
    (t) =>
      t.templateTitle.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.language.toLowerCase().includes(templateSearch.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in font-mono">
      {/* Search Bar */}
      <div className="border border-border bg-card/40 backdrop-blur-md p-4 shadow-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/45" />
          <Input
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
            placeholder="Search custom snippets by title or language..."
            className="font-mono text-xs bg-background/30 border-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/30 pl-9 h-9"
          />
        </div>
        <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold shrink-0">
          {filteredTemplates.length} Custom Templates
        </div>
      </div>

      {/* Grid layout */}
      {filteredTemplates.length === 0 ? (
        <div className="border border-border bg-card/40 backdrop-blur-md p-16 text-center space-y-4 shadow-2xl select-none font-mono">
          <Library className="h-10 w-10 text-muted-foreground/20 mx-auto animate-pulse" />
          <p className="text-xs text-muted-foreground/50 font-mono">No custom templates found matching query.</p>
          <p className="text-[10px] text-muted-foreground/30 max-w-sm mx-auto">
            Save custom code versions directly from any template page using the Personalization panel.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredTemplates.map((t) => (
            <div
              key={t.id}
              className="border border-border bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between hover:border-primary/60 transition-all duration-300 group shadow-xl relative"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest text-primary/80 border border-primary/20 bg-primary/5 px-2 py-0.5 font-bold">
                    {t.language}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(t.customCode);
                      playSuccess();
                      onToastSuccess("Snippet code copied!");
                    }}
                    className="text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer p-1"
                    title="Copy Custom Snippet"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <Link
                  href={`/template/${t.templateSlug}`}
                  onClick={playClick}
                  className="block text-sm font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug"
                >
                  {t.templateTitle}
                </Link>

                <p className="text-[9px] text-muted-foreground/40 select-none">
                  Last Modified: {new Date(t.updatedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-border/30 flex items-center justify-between text-[10px] select-none text-muted-foreground/40 font-mono">
                <span className="flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-primary/60" />
                  <span>{t.templateSlug}</span>
                </span>
                <Link
                  href={`/template/${t.templateSlug}`}
                  onClick={playClick}
                  className="text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <span>Edit code</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
