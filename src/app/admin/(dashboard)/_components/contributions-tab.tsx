"use client";

import { Fragment } from "react";

interface ContributionCodeBlock {
  language: string;
  code: string;
}

interface Contribution {
  id: number;
  type: "new" | "edit";
  status: "pending" | "approved" | "rejected" | "changes_requested";
  contributorName: string;
  contributorEmail: string;
  contributorCfHandle: string | null;
  title: string | null;
  slug: string | null;
  description: string | null;
  categoryId: number | null;
  tags: string[] | null;
  complexity: string | null;
  notes: string | null;
  codes: ContributionCodeBlock[] | null;
  templateId: number | null;
  editReason: string | null;
  editCodes: ContributionCodeBlock[] | null;
  editNotes: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  category?: { name: string };
  template?: { title: string; slug: string };
}

type ContribFilter = "all" | "pending" | "approved" | "rejected" | "changes_requested";

interface ContributionsTabProps {
  loadingContributions: boolean;
  contribFilter: ContribFilter;
  setContribFilter: (filter: ContribFilter) => void;
  pendingContribCount: number;
  filteredContributions: Contribution[];
  expandedContribution: number | null;
  setExpandedContribution: (updater: (prev: number | null) => number | null) => void;
  playClick: () => void;
  playBeep: (freq?: number, duration?: number) => void;
  onApprove: (id: number) => void;
  onReject: (c: Contribution) => void;
  onRequestChanges: (c: Contribution) => void;
  onDelete: (c: Contribution) => void;
}

export function ContributionsTab({
  loadingContributions,
  contribFilter,
  setContribFilter,
  pendingContribCount,
  filteredContributions,
  expandedContribution,
  setExpandedContribution,
  playClick,
  playBeep,
  onApprove,
  onReject,
  onRequestChanges,
  onDelete,
}: ContributionsTabProps) {
  return (
    <div className="space-y-4">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-primary/10 pb-4">
        <div className="text-xs text-muted-foreground/45 flex items-center gap-2">
          <span className="text-primary font-bold">$</span>
          <span>review contributions --queue</span>
          <span className="inline-block h-3 w-1.5 bg-primary/40 animate-blink" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "changes_requested", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { playClick(); setContribFilter(f); }}
              className={`px-2.5 py-1 border text-[10px] font-mono font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer ${
                contribFilter === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground/45 hover:text-foreground"
              }`}
            >
              [ {f.replace(/_/g, " ")} ]
              {f === "pending" && pendingContribCount > 0 && (
                <span className="ml-1 text-warning">{pendingContribCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loadingContributions ? (
        <div className="text-center py-16 text-muted-foreground/45 font-mono text-xs animate-pulse">
          $ read_queue --status
          <br />
          [LOAD] Loading contribution queue...
        </div>
      ) : filteredContributions.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-muted-foreground/50 text-xs">
          $ ls -la contributions/
          <br />
          {contribFilter === "all" ? "total 0 (no submissions found)." : `No ${contribFilter} contributions found.`}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground/45 select-none">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-primary font-bold">$</span>
              <span>cat contributions/{contribFilter === "all" ? "*" : contribFilter}.log</span>
            </div>
            <span className="font-mono">total {filteredContributions.length} submissions</span>
          </div>

          <div className="border border-border bg-card/25 overflow-x-auto select-text scrollbar-thin">
            <table className="w-full text-[11px] text-left border-collapse min-w-[720px] font-mono">
              <thead>
                <tr className="border-b border-primary/20 bg-primary/5 text-primary/60 font-bold uppercase tracking-wider select-none text-[9px]">
                  <th className="py-2 px-3 w-6"></th>
                  <th className="py-2 px-3">Contributor</th>
                  <th className="py-2 px-3">CF Handle</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Submitted</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredContributions.map((c) => {
                  const isExpanded = expandedContribution === c.id;
                  const displayTitle = c.type === "edit" ? (c.template?.title || "(unknown template)") : (c.title || "(untitled)");
                  return (
                    <Fragment key={c.id}>
                      <tr
                        onClick={() => {
                          playClick();
                          setExpandedContribution((prev) => (prev === c.id ? null : c.id));
                        }}
                        className="hover:bg-primary/[0.02] transition-colors leading-relaxed cursor-pointer select-none"
                      >
                        <td className="py-2.5 px-3 text-primary/60 text-[10px] w-6">{isExpanded ? "▼" : "▶"}</td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">{c.contributorName}</td>
                        <td className="py-2.5 px-3 text-info">{c.contributorCfHandle || "—"}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-none ${
                              c.type === "new"
                                ? "border-primary/40 bg-primary/5 text-primary"
                                : "border-info/40 bg-info/5 text-info"
                            }`}
                          >
                            {c.type === "new" ? "[ NEW ]" : "[ EDIT ]"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-foreground/85">{displayTitle}</td>
                        <td className="py-2.5 px-3 text-muted-foreground/50 text-[10px]">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-none ${
                              c.status === "pending"
                                ? "border-warning/40 bg-warning/5 text-warning"
                                : c.status === "approved"
                                ? "border-primary/40 bg-primary/5 text-primary"
                                : c.status === "changes_requested"
                                ? "border-info/40 bg-info/5 text-info"
                                : "border-destructive/40 bg-destructive/5 text-destructive"
                            }`}
                          >
                            {c.status.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2.5 select-none">
                            {c.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => onApprove(c.id)}
                                  className="text-[10px] px-3 py-1.5 border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors uppercase font-bold tracking-wider cursor-pointer"
                                >
                                  [ approve ]
                                </button>
                                <button
                                  onClick={() => { playClick(); onRequestChanges(c); }}
                                  className="text-[10px] px-3 py-1.5 border border-info bg-info/10 text-info hover:bg-info/20 transition-colors uppercase font-bold tracking-wider cursor-pointer"
                                >
                                  [ request updates ]
                                </button>
                                <button
                                  onClick={() => { playBeep(330, 0.25); onReject(c); }}
                                  className="text-[10px] px-3 py-1.5 border border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors uppercase font-bold tracking-wider cursor-pointer"
                                >
                                  [ reject ]
                                </button>
                              </>
                            ) : (
                              <span className="text-[9px] text-muted-foreground/40 italic">
                                reviewed {c.reviewedAt ? new Date(c.reviewedAt).toLocaleDateString() : ""}
                              </span>
                            )}
                            <button
                              onClick={() => { playBeep(330, 0.25); onDelete(c); }}
                              title="Delete record"
                              className="text-[10px] px-1.5 py-1.5 border border-transparent text-muted-foreground/45 hover:text-destructive hover:border-destructive/20 transition-colors uppercase font-bold tracking-wider cursor-pointer"
                            >
                              [ del ]
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${c.id}-details`} className="bg-black/15">
                          <td colSpan={8} className="p-0">
                            <div className="border-t border-border/40 p-4 space-y-4 select-text">
                              <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-muted-foreground/60">
                                <span>
                                  <span className="text-primary/60 font-bold">email:</span> {c.contributorEmail}
                                </span>
                                <span>
                                  <span className="text-primary/60 font-bold">submitted:</span>{" "}
                                  {new Date(c.createdAt).toLocaleString()}
                                </span>
                                {c.adminNote && (
                                  <span>
                                    <span className="text-destructive/70 font-bold">admin note:</span> {c.adminNote}
                                  </span>
                                )}
                              </div>

                              {c.type === "new" ? (
                                <div className="space-y-3">
                                  {c.category?.name && (
                                    <div className="text-[10px]">
                                      <span className="text-primary/60 font-bold uppercase tracking-widest">Category: </span>
                                      <span className="text-info font-bold">{c.category.name}</span>
                                    </div>
                                  )}
                                  {c.description && (
                                    <div className="space-y-1">
                                      <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">Description</div>
                                      <div className="text-xs text-foreground/85 leading-relaxed">{c.description}</div>
                                    </div>
                                  )}
                                  {c.complexity && (
                                    <div className="text-[10px]">
                                      <span className="text-primary/60 font-bold uppercase tracking-widest">Complexity: </span>
                                      <span className="text-foreground/85 font-mono">{c.complexity}</span>
                                    </div>
                                  )}
                                  {c.tags && c.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {c.tags.map((tag) => (
                                        <span key={tag} className="text-[8px] text-muted-foreground/50 border border-border/40 px-1 py-0 select-none">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {c.notes && (
                                    <div className="space-y-1">
                                      <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">Notes</div>
                                      <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap border border-border/40 bg-card/20 p-3">{c.notes}</div>
                                    </div>
                                  )}
                                  {c.codes && c.codes.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">Code Blocks</div>
                                      {c.codes.map((blk, idx) => (
                                        <div key={idx} className="border border-border/50 bg-black/25 overflow-hidden">
                                          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/40 bg-primary/5 text-[9px] uppercase tracking-wider">
                                            <span className="h-1.5 w-1.5 rounded-full bg-destructive/40" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-warning/40" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-success/40" />
                                            <span className="ml-1 text-primary/70 font-bold">{blk.language}</span>
                                          </div>
                                          <pre className="p-3 text-[10px] text-foreground/85 overflow-x-auto scrollbar-thin leading-relaxed whitespace-pre">{blk.code}</pre>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="text-[10px]">
                                    <span className="text-primary/60 font-bold uppercase tracking-widest">Target Template: </span>
                                    <span className="text-info font-bold">{c.template?.title || "(unknown)"}</span>
                                    {c.template?.slug && <span className="text-muted-foreground/45"> ({c.template.slug})</span>}
                                  </div>
                                  {c.editReason && (
                                    <div className="space-y-1">
                                      <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">Edit Reason</div>
                                      <div className="text-xs text-foreground/85 leading-relaxed">{c.editReason}</div>
                                    </div>
                                  )}
                                  {c.editNotes && (
                                    <div className="space-y-1">
                                      <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">Proposed Notes</div>
                                      <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap border border-border/40 bg-card/20 p-3">{c.editNotes}</div>
                                    </div>
                                  )}
                                  {c.editCodes && c.editCodes.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">Proposed Code Blocks</div>
                                      {c.editCodes.map((blk, idx) => (
                                        <div key={idx} className="border border-border/50 bg-black/25 overflow-hidden">
                                          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/40 bg-primary/5 text-[9px] uppercase tracking-wider">
                                            <span className="h-1.5 w-1.5 rounded-full bg-destructive/40" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-warning/40" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-success/40" />
                                            <span className="ml-1 text-primary/70 font-bold">{blk.language}</span>
                                          </div>
                                          <pre className="p-3 text-[10px] text-foreground/85 overflow-x-auto scrollbar-thin leading-relaxed whitespace-pre">{blk.code}</pre>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
