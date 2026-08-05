"use client";

import Link from "next/link";
import { GitPullRequest, Plus } from "lucide-react";
import { Contribution } from "./types";

interface ContributionsTabProps {
  userContributions: Contribution[];
  playClick: () => void;
}

export function ContributionsTab({ userContributions, playClick }: ContributionsTabProps) {
  return (
    <div className="space-y-5 animate-fade-in font-mono">
      {userContributions.length === 0 ? (
        <div className="border border-border bg-card/40 backdrop-blur-md p-16 text-center space-y-4 shadow-2xl select-none font-mono">
          <GitPullRequest className="h-10 w-10 text-muted-foreground/20 mx-auto animate-pulse" />
          <p className="text-xs text-muted-foreground/50 font-mono">No contributions submitted yet.</p>
          <Link
            href="/contribute"
            onClick={playClick}
            className="inline-flex items-center gap-2 border border-primary bg-primary text-primary-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-transparent hover:text-primary transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            <span>Submit a Template</span>
          </Link>
        </div>
      ) : (
        <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl divide-y divide-border/30">
          <div className="px-4 py-3 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-primary" />
              <span>Submission History ({userContributions.length})</span>
            </div>
            <Link
              href="/contribute"
              onClick={playClick}
              className="inline-flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
            >
              <Plus className="h-3 w-3" />
              <span>New Submission</span>
            </Link>
          </div>

          {userContributions.map((c) => {
            const label = c.templateTitle || c.title || "Untitled Contribution";
            const statusColor =
              c.status === "approved"
                ? "text-success border-success/30 bg-success/10"
                : c.status === "rejected"
                ? "text-destructive border-destructive/30 bg-destructive/10"
                : "text-warning border-warning/30 bg-warning/10";
            return (
              <div key={c.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] uppercase tracking-widest text-primary/80 border border-primary/20 bg-primary/5 px-2 py-0.5 font-bold select-none">
                      {c.type === "new" ? "New Template" : "Edit Request"}
                    </span>
                    {c.status === "approved" && c.templateSlug ? (
                      <Link
                        href={`/template/${c.templateSlug}`}
                        onClick={playClick}
                        className="text-sm font-extrabold text-foreground hover:text-primary transition-colors truncate"
                      >
                        {label}
                      </Link>
                    ) : (
                      <span className="text-sm font-extrabold text-foreground truncate">{label}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/40 font-mono select-none">
                    Submitted: {new Date(c.createdAt).toLocaleDateString()}
                    {c.reviewedAt && ` · Reviewed: ${new Date(c.reviewedAt).toLocaleDateString()}`}
                  </p>
                  {c.adminNote && (
                    <div className="text-[10.5px] text-muted-foreground/60 leading-relaxed border-l-2 border-primary/40 pl-3 bg-primary/5 p-2 border border-primary/10 select-text">
                      <span className="text-primary font-bold uppercase tracking-wider text-[9px] block mb-0.5">Admin Review Feedback:</span>
                      {c.adminNote}
                    </div>
                  )}
                </div>
                <span className={`shrink-0 text-[10px] uppercase tracking-widest font-extrabold border px-3 py-1 select-none ${statusColor}`}>
                  {c.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
