"use client";

import Link from "next/link";
import { Heart, BookOpen, ChevronRight } from "lucide-react";
import { LikedTemplate } from "./types";

interface LikedTabProps {
  likedTemplates: LikedTemplate[];
  unliking: number | null;
  playClick: () => void;
  onUnlikeTemplate: (templateId: number) => void;
}

export function LikedTab({
  likedTemplates,
  unliking,
  playClick,
  onUnlikeTemplate,
}: LikedTabProps) {
  return (
    <div className="space-y-5 animate-fade-in font-mono">
      {likedTemplates.length === 0 ? (
        <div className="border border-border bg-card/40 backdrop-blur-md p-16 text-center space-y-4 shadow-2xl select-none font-mono">
          <Heart className="h-10 w-10 text-muted-foreground/20 mx-auto animate-pulse" />
          <p className="text-xs text-muted-foreground/50 font-mono">No liked templates yet.</p>
          <Link
            href="/templates"
            onClick={playClick}
            className="inline-flex items-center gap-2 border border-primary bg-primary text-primary-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-transparent hover:text-primary transition-all duration-300"
          >
            <BookOpen className="h-4 w-4" />
            <span>Browse Templates</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {likedTemplates.map((t) => (
            <div
              key={t.id}
              className="border border-border bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between hover:border-primary/60 transition-all duration-300 group shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest text-primary/80 border border-primary/20 bg-primary/5 px-2 py-0.5 font-bold">
                    {t.categoryName || "Uncategorized"}
                  </span>
                  <button
                    onClick={() => onUnlikeTemplate(t.templateId)}
                    disabled={unliking === t.templateId}
                    className="text-destructive/60 hover:text-destructive transition-colors cursor-pointer p-1 disabled:opacity-40"
                    title="Remove from Liked"
                  >
                    <Heart className="h-4 w-4 fill-current" />
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
                  Liked on: {new Date(t.likedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-border/30 flex items-center justify-between text-[10px] select-none text-muted-foreground/40 font-mono">
                <span className="flex items-center gap-1.5 text-primary font-bold">
                  <Heart className="h-3.5 w-3.5 fill-primary/20" />
                  <span>{t.likeCount} Likes</span>
                </span>
                <Link
                  href={`/template/${t.templateSlug}`}
                  onClick={playClick}
                  className="text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <span>Open Template</span>
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
