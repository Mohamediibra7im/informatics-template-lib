"use client";

import Link from "next/link";

export interface Contributor {
  name: string;
  cfHandle: string | null;
  username: string | null;
  role: "creator" | "editor";
  avatar: string;
  contributions: number;
  cfRating: number | null;
  cfRank: string | null;
}

/**
 * GitHub-style contributor credits. Each chip links directly to the
 * contributor's dedicated public profile page (/profile/[username]).
 */
export function ContributorChips({ contributors }: { contributors: Contributor[] }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {contributors.map((c, i) => (
        <Link
          key={i}
          href={`/profile/${encodeURIComponent(c.username || c.name)}`}
          title={`View ${c.name}'s profile`}
          className="flex items-center gap-1.5 border border-border/60 bg-card/30 px-2.5 py-1.5 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={c.avatar}
            alt={c.name}
            loading="lazy"
            className="h-5 w-5 rounded-full border border-primary/25 bg-primary/10 object-cover shrink-0"
          />
          <span className="font-bold">{c.name}</span>
          {c.role === "creator" && (
            <span className="text-[8px] uppercase tracking-wider text-primary/70 border border-primary/25 bg-primary/5 px-1 py-0.5 select-none">
              creator
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
