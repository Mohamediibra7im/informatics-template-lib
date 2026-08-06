"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, ChevronDown } from "lucide-react";
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

export default function ContributeNewPage() {
  const { playClick, playBeep, playSuccess } = useTerminalTheme();
  const { user } = useAuth();

  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Name and email are derived from the account; only the CF handle is editable.
  const [cfHandle, setCfHandle] = useState("");
  const contributor: ContributorInfo = { name: user?.username ?? "", email: user?.email ?? "", cfHandle };

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [complexity, setComplexity] = useState("");
  const [notes, setNotes] = useState("");
  const [codes, setCodes] = useState<CodeBlock[]>([{ language: "cpp", code: "" }]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Pre-fill from a prior submission when an admin requested changes
  // (?resubmit=<id>). Owner + status are enforced server-side.
  useEffect(() => {
    const resubmitId = new URLSearchParams(window.location.search).get("resubmit");
    if (!resubmitId) return;
    fetch(`/api/users/contributions/${resubmitId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (!c || c.type !== "new") return;
        setTitle(c.title ?? "");
        setCategoryId(c.categoryId ?? "");
        setDescription(c.description ?? "");
        setTags(Array.isArray(c.tags) ? c.tags.join(", ") : "");
        setComplexity(c.complexity ?? "");
        setNotes(c.notes ?? "");
        if (Array.isArray(c.codes) && c.codes.length > 0) setCodes(c.codes);
        if (c.contributorCfHandle) setCfHandle(c.contributorCfHandle);
        toast.info("Loaded your previous submission for revision.");
      })
      .catch(() => {});
  }, []);

  const addCodeBlock = () => {
    playClick();
    setCodes((prev) => [...prev, { language: "cpp", code: "" }]);
  };

  const removeCodeBlock = (index: number) => {
    playClick();
    setCodes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCode = (index: number, field: keyof CodeBlock, value: string) => {
    setCodes((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (!title.trim()) {
      playBeep(440, 0.15);
      toast.error("Template title is required");
      return;
    }
    if (codes.every((c) => !c.code.trim())) {
      playBeep(440, 0.15);
      toast.error("At least one code block is required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new",
          contributorCfHandle: contributor.cfHandle.trim() || undefined,
          title: title.trim(),
          categoryId: categoryId || undefined,
          description: description.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          complexity: complexity.trim() || undefined,
          notes: notes.trim() || undefined,
          codes: codes.filter((c) => c.code.trim()),
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
        title="Submission Received"
        message="Your template has been queued for review. You will receive an email notification when it is approved."
      />
    );
  }

  return (
    <div className="relative z-10 mx-auto max-w-3xl w-full px-4 py-12 font-mono">
      <TerminalBreadcrumb
        className="mb-8"
        items={[{ label: "home", href: "/" }, { label: "contribute", href: "/contribute" }, { label: "new" }]}
      />

      {/* Header */}
      <div className="border border-border/80 bg-card/45 backdrop-blur-md p-6 mb-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-2xl" />
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 mb-2">
          <span className="text-primary font-bold">$</span>
          <span>./submit_new_template.sh</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary glow-text-strong mb-2">Submit New Template</h1>
        <p className="text-[11px] text-muted-foreground/50">Fill in the details below. All submissions are reviewed before publishing.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ContributorFields value={contributor} onChange={(patch) => { if (patch.cfHandle !== undefined) setCfHandle(patch.cfHandle); }} />

        {/* Template Details */}
        <RetroFieldset legend="Template Details">
          <div className="space-y-1.5">
            <label className={TERMINAL_LABEL_CLS}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Segment Tree with Lazy Propagation"
              className={TERMINAL_INPUT_CLS}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={TERMINAL_LABEL_CLS}>Category</label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => { playClick(); setCategoryId(e.target.value ? Number(e.target.value) : ""); }}
                  className={`${TERMINAL_INPUT_CLS} appearance-none cursor-pointer`}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={TERMINAL_LABEL_CLS}>Complexity</label>
              <input
                type="text"
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
                placeholder="O(n log n)"
                className={TERMINAL_INPUT_CLS}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={TERMINAL_LABEL_CLS}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this template does..."
              rows={3}
              className={TERMINAL_TEXTAREA_CLS}
            />
          </div>

          <div className="space-y-1.5">
            <label className={TERMINAL_LABEL_CLS}>Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="segment tree, lazy propagation, range query"
              className={TERMINAL_INPUT_CLS}
            />
          </div>
        </RetroFieldset>

        {/* Code Blocks */}
        <RetroFieldset legend="Code Implementations">
          <CodeBlocksEditor
            blocks={codes}
            onCodeChange={(i, code) => updateCode(i, "code", code)}
            onLanguageChange={(i, language) => updateCode(i, "language", language)}
            onAdd={addCodeBlock}
            onRemove={removeCodeBlock}
            onInteract={playClick}
          />
        </RetroFieldset>

        {/* Notes */}
        <RetroFieldset legend="Notes (optional, markdown)" className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Explanation, complexity analysis, usage examples... (Markdown + KaTeX supported)"
            rows={6}
            className={TERMINAL_TEXTAREA_CLS}
          />
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
            {submitting ? "submitting..." : "[ submit template ]"}
          </button>
        </div>
      </form>
    </div>
  );
}
