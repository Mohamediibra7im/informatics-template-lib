"use client";

import Link from "next/link";
import { ArrowUpRight, Heart, CheckSquare, Square } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { templates as templatesTable, categories as categoriesTable } from "@/db/schema";
import { useTerminalTheme } from "./theme-provider";
import { useSelection } from "./selection-context";

type Template = InferSelectModel<typeof templatesTable>;
type Category = InferSelectModel<typeof categoriesTable>;
type TemplateWithCategory = Template & { category?: Pick<Category, "name" | "slug"> };

export function TemplateCard({ template }: { template: TemplateWithCategory }) {
  const { playClick } = useTerminalTheme();
  const { isSelected, toggleSelect, selectedIds } = useSelection();

  const selected = isSelected(template.id);
  const inSelectionMode = selectedIds.size > 0;

  // When selection mode is active (1+ templates selected), clicking anywhere on the card toggles selection.
  const handleCardClick = (e: React.MouseEvent) => {
    if (inSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      playClick();
      toggleSelect(template.id);
    } else {
      playClick();
    }
  };

  // Clicking explicit checkbox toggle
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playClick();
    toggleSelect(template.id);
  };

  return (
    <Link
      href={`/template/${template.slug}`}
      onClick={handleCardClick}
      className="block h-full relative group/card select-none"
    >
      <div
        className={`group relative flex flex-col border bg-card hover:shadow-[0_0_20px_var(--primary-glow-ultra-weak)] transition-all duration-300 overflow-hidden h-full min-h-[170px] font-mono ${
          selected
            ? "border-primary bg-primary/[0.06] shadow-[0_0_15px_var(--primary-glow-weak)]"
            : inSelectionMode
            ? "border-border/80 hover:border-primary/50 cursor-pointer"
            : "border-border hover:border-primary/50"
        }`}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-muted/10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheckboxClick}
              className={`flex items-center gap-1 text-[10px] font-mono transition-colors cursor-pointer ${
                selected
                  ? "text-primary font-bold"
                  : "text-muted-foreground/50 hover:text-primary"
              }`}
              title={selected ? "Deselect template" : "Select template"}
            >
              {selected ? (
                <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <Square className="h-3.5 w-3.5 opacity-50 group-hover/card:opacity-100 transition-opacity shrink-0" />
              )}
            </button>

            <div className="flex gap-1 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-warning/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-success/40" />
            </div>
            <span className="text-[9px] text-muted-foreground/40 truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[160px]">
              template_{template.slug}.cpp
            </span>
          </div>

          {selected ? (
            <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 bg-primary/20 text-primary border border-primary/30 shrink-0">
              SELECTED
            </span>
          ) : inSelectionMode ? (
            <span className="text-[8px] font-bold text-muted-foreground/40 group-hover/card:text-primary transition-colors shrink-0">
              CLICK TO SELECT
            </span>
          ) : null}
        </div>

        <div className="p-4 flex flex-col flex-1">
          {/* Main Title Row */}
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                {template.title}
              </h3>
            </div>
            <ArrowUpRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-primary transition-all shrink-0 ml-2 mt-0.5" />
          </div>

          {/* Category */}
          <div className="flex items-center justify-between mb-2 text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0">
              {template.category && (
                <span className="text-info font-bold shrink-0">
                  [{template.category.name}]
                </span>
              )}
              {template.contributorName && (
                <span className="text-[9px] text-muted-foreground/40 truncate select-none">
                  by {template.contributorName}
                </span>
              )}
            </div>
            {(template.likeCount ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-[9px] text-destructive font-mono select-none shrink-0 ml-1">
                <Heart className="h-2.5 w-2.5 fill-destructive text-destructive" />
                <span>{template.likeCount}</span>
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-[11px] text-muted-foreground/45 line-clamp-2 leading-relaxed mb-3 flex-1">
            {template.description}
          </p>

          {/* Tags / Actions Row */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 border-t border-border/30">
            {/* Tags */}
            <div className="flex flex-wrap gap-1 min-w-0 flex-1">
              {template.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[9px] text-muted-foreground/35 border border-border/50 px-1 py-0 select-none truncate max-w-[100px]">
                  #{tag}
                </span>
              ))}
              {template.tags.length > 3 && (
                <span className="text-[9px] text-muted-foreground/25 font-bold shrink-0">
                  +{template.tags.length - 3}
                </span>
              )}
            </div>

            {/* Hover visual prompt */}
            <span className="text-[9px] text-muted-foreground/30 group-hover:text-primary transition-all duration-300 flex items-center gap-0.5 select-none shrink-0">
              <span className="text-primary/50">$</span> {inSelectionMode ? "select" : "cat"} {template.slug.slice(0, 8)}{template.slug.length > 8 ? '..' : ''}
              <span className="inline-block h-2.5 w-1 bg-primary animate-blink opacity-0 group-hover:opacity-100" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
