"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, X, Search } from "lucide-react";
import { toast } from "sonner";
import { useTerminalTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { TerminalBreadcrumb } from "@/components/terminal";
import {
  RetroFieldset,
  ContributorFields,
  CodeBlocksEditor,
  ContributeResult,
  type ContributorInfo,
  type CodeBlock,
  TERMINAL_INPUT_CLS,
  TERMINAL_TEXTAREA_CLS,
  TERMINAL_LABEL_CLS,
} from "@/components/forms";

interface TemplateOption {
  id: number;
  title: string;
  slug: string;
  categoryId?: number | null;
  notes?: string | null;
  codes?: { language: string; code: string }[];
}

export default function ContributeEditPage() {
  const { playClick, playBeep, playSuccess } = useTerminalTheme();
  const { user } = useAuth();

  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Name and email are derived from the account; only the CF handle is editable.
  const [cfHandle, setCfHandle] = useState("");
  const contributor: ContributorInfo = { name: user?.username ?? "", email: user?.email ?? "", cfHandle };

  const [editReason, setEditReason] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCodes, setEditCodes] = useState<CodeBlock[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/templates?includeCodes=true").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([cats, tpls]) => {
        setCategories(cats);
        setTemplates(tpls);
      })
      .catch(() => {});
  }, []);

  const filteredTemplates = templates.filter((t) => {
    if (selectedCategoryId !== "" && t.categoryId !== Number(selectedCategoryId)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
    }
    return true;
  });

  const selectTemplate = (t: TemplateOption) => {
    playClick();
    setSelectedTemplate(t);
    setSearchQuery("");
    if (t.codes && t.codes.length > 0) {
      setEditCodes(t.codes.map((c) => ({ language: c.language, code: c.code })));
    } else {
      setEditCodes([{ language: "cpp", code: "" }]);
    }
    // Pre-fill the current notes so the contributor edits them instead of
    // starting blank (a blank submission would wipe the existing notes).
    setEditNotes(t.notes || "");
  };

  const updateCode = (index: number, code: string) => {
    setEditCodes((prev) => prev.map((c, i) => (i === index ? { ...c, code } : c)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (!selectedTemplate) {
      playBeep(440, 0.15);
      toast.error("Select a template to edit");
      return;
    }
    if (!editReason.trim()) {
      playBeep(440, 0.15);
      toast.error("Edit reason is required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "edit",
          contributorCfHandle: contributor.cfHandle.trim() || undefined,
          templateId: selectedTemplate.id,
          editReason: editReason.trim(),
          editCodes: editCodes.some((c) => c.code.trim()) ? editCodes.filter((c) => c.code.trim()) : undefined,
          editNotes: editNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        playSuccess();
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        playBeep(440, 0.15);
        toast.error(data.error || "Submission failed");
      }
    } catch {
      playBeep(440, 0.15);
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <ContributeResult
        title="Edit Request Received"
        message="Your edit request has been queued for review. You will receive an email notification when it is processed."
      />
    );
  }

  return (
    <div className="relative z-10 mx-auto max-w-3xl w-full px-4 py-12 font-mono">
      <TerminalBreadcrumb
        className="mb-8"
        items={[{ label: "home", href: "/" }, { label: "contribute", href: "/contribute" }, { label: "edit" }]}
      />

      {/* Header */}
      <div className="border border-border/80 bg-card/45 backdrop-blur-md p-6 mb-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-info/5 blur-2xl" />
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 mb-2">
          <span className="text-primary font-bold">$</span>
          <span>./request_edit.sh</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary glow-text-strong mb-2">Request Template Edit</h1>
        <p className="text-[11px] text-muted-foreground/50">Suggest improvements or fixes to an existing template.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ContributorFields value={contributor} onChange={(patch) => { if (patch.cfHandle !== undefined) setCfHandle(patch.cfHandle); }} />

        {/* Step 1: Select Category & Step 2: Select Template */}
        <RetroFieldset legend="Select Target Template">
          <div className="space-y-4">
            {/* Step 1: Category Selector */}
            <div className="space-y-1.5">
              <label className={TERMINAL_LABEL_CLS}>1. Select Category *</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  playClick();
                  setSelectedCategoryId(e.target.value ? Number(e.target.value) : "");
                  setSelectedTemplate(null);
                }}
                className={`${TERMINAL_INPUT_CLS} cursor-pointer`}
              >
                <option value="">-- Select a Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Template Selector */}
            <div className="space-y-1.5 pt-2 border-t border-border/30">
              <label className={TERMINAL_LABEL_CLS}>2. Select Template *</label>

              {selectedTemplate ? (
                <div className="flex items-center justify-between border border-primary/30 bg-primary/5 p-3">
                  <div>
                    <div className="text-xs font-bold text-primary">{selectedTemplate.title}</div>
                    <div className="text-[10px] text-muted-foreground/50">{selectedTemplate.slug}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { playClick(); setSelectedTemplate(null); setEditCodes([]); setEditNotes(""); }}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : selectedCategoryId === "" ? (
                <div className="p-4 border border-dashed border-border/40 bg-background/20 text-[10.5px] text-muted-foreground/40 text-center italic select-none">
                  Please select a category above to view its templates.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search templates in this category..."
                      className={`${TERMINAL_INPUT_CLS} pl-8 pr-2.5`}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-border/50 bg-background/30 scrollbar-thin">
                    {filteredTemplates.length === 0 ? (
                      <div className="p-3 text-[10px] text-muted-foreground/40 text-center">
                        No templates found in this category
                      </div>
                    ) : (
                      filteredTemplates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => selectTemplate(t)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-primary/5 transition-colors border-b border-border/20 last:border-0 cursor-pointer"
                        >
                          <span className="font-bold text-foreground">{t.title}</span>
                          <span className="text-muted-foreground/40 ml-2 text-[10px]">{t.slug}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </RetroFieldset>

        {/* Edit Details */}
        <RetroFieldset legend="Edit Details">
          <div className="space-y-1.5">
            <label className={TERMINAL_LABEL_CLS}>Reason for Edit *</label>
            <textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Describe what should be changed and why..."
              rows={3}
              className={TERMINAL_TEXTAREA_CLS}
              required
            />
          </div>

          {editCodes.length > 0 && (
            <div className="space-y-3">
              <label className={TERMINAL_LABEL_CLS}>Modified Code (edit below)</label>
              <CodeBlocksEditor blocks={editCodes} onCodeChange={updateCode} />
            </div>
          )}

          <div className="space-y-1.5">
            <label className={TERMINAL_LABEL_CLS}>Notes (markdown) — current content pre-loaded, edit as needed</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="The template's existing notes appear here — modify them instead of starting from scratch."
              rows={8}
              className={TERMINAL_TEXTAREA_CLS}
            />
            <p className="text-[9px] text-muted-foreground/40">Leave unchanged to keep the notes as they are.</p>
          </div>
        </RetroFieldset>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href="/contribute"
            className="text-[10px] px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors uppercase tracking-wider"
          >
            [ cancel ]
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="text-[10px] px-5 py-2 border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors uppercase font-bold tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Terminal className="h-3 w-3" />
            {submitting ? "submitting..." : "[ submit edit request ]"}
          </button>
        </div>
      </form>
    </div>
  );
}
