"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, History, RotateCcw } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { CategoryCreator } from "@/components/category-creator";
import { useTerminalTheme } from "@/components/theme-provider";
import { formatCode } from "@/lib/format-code";
import { AdminCodeEditor } from "@/components/forms/admin-code-editor";

interface CodeEntry {
  language: string;
  code: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface HistoryEntry {
  id: number;
  title: string;
  slug: string;
  reason: string | null;
  createdAt: string;
  contributorName: string | null;
  codes: { language: string; code: string }[] | null;
  tags: string[];
  complexity: string;
}

const HELP_TEXTS: Record<string, { title: string; description: string }> = {
  title: {
    title: "Template Title",
    description: "Enter the formal name of the algorithm, template, or data structure. This is used for sorting and displaying in search queries."
  },
  slug: {
    title: "URL Slug",
    description: "A URL-friendly string identifier. Auto-generated from title, but can be manually changed. Use lowercase letters, numbers, and dashes."
  },
  description: {
    title: "Short Description",
    description: "Provide a brief, single-sentence summary of this code template. Used for previews in directories."
  },
  categoryId: {
    title: "Category Folder",
    description: "Choose the target group folder. Organization dictates search indexing and landing page layouts."
  },
  complexity: {
    title: "Complexity Metric",
    description: "Define the worst-case time complexity (e.g. O(V + E) or O(N log N)). Displayed in performance badges."
  },
  tags: {
    title: "Search Keywords",
    description: "Provide comma-separated keywords/tags. Used to boost query relevancy scores (e.g. 'graphs, sorting, templates')."
  },
  hidden: {
    title: "Hidden Flag",
    description: "If set to hidden, this template will not appear on the home page or in the templates list for regular visitors. It remains visible to administrators."
  },
  notes: {
    title: "Markdown Documentation",
    description: "Write details, explanations, sample uses, inputs/outputs, or notes in GitHub Flavored Markdown. Supports math equations with $$."
  },
  code: {
    title: "Source Code Blocks",
    description: "Enter source code implementation. You can create multiple language tabs for the same template by clicking 'Add Language'."
  },
  default: {
    title: "BIOS Setup Helper",
    description: "Use TAB or Mouse to navigate options. Select a field to view help documentation. Press [F10] to write files and save configurations."
  }
};

export default function EditTemplate({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"main" | "notes" | "code" | "history">("main");
  const [focusedField, setFocusedField] = useState<string>("default");

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [revertTarget, setRevertTarget] = useState<HistoryEntry | null>(null);
  const [reverting, setReverting] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<Record<number, boolean>>({});
  const [deleteHistoryTarget, setDeleteHistoryTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const [deletingHistory, setDeletingHistory] = useState(false);

  const { playClick, playBeep, playSuccess } = useTerminalTheme();

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    categoryId: "",
    complexity: "",
    notes: "",
    tags: "",
    hidden: false,
  });
  const [codes, setCodes] = useState<CodeEntry[]>([]);
  const [formattingIdx, setFormattingIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { id } = await params;
      if (cancelled) return;
      setTemplateId(Number(id));
      const fetchJson = async (url: string) => {
        try {
          const r = await fetch(url);
          if (!r.ok) return null;
          const text = await r.text();
          return text ? JSON.parse(text) : null;
        } catch {
          return null;
        }
      };
      const [cats, template] = await Promise.all([
        fetchJson("/api/admin/categories"),
        fetchJson(`/api/admin/templates?id=${id}`),
      ]);
      if (cancelled) return;
      setCategories(Array.isArray(cats) ? cats : []);
      if (template && !template.error) {
        // Load notes from .md file if exists, fallback to database
        let notesContent = template.notes || "";
        try {
          const notesRes = await fetch(`/api/admin/notes?slug=${template.slug}`);
          if (notesRes.ok) {
            const notesData = await notesRes.json();
            if (notesData.content) {
              notesContent = notesData.content;
            }
          }
        } catch {
          // Fallback to database notes
        }
        
        setForm({
          title: template.title,
          slug: template.slug,
          description: template.description,
          categoryId: String(template.categoryId),
          complexity: template.complexity,
          notes: notesContent,
          tags: (template.tags || []).join(", "),
          hidden: template.hidden ?? false,
        });
        setCodes(template.codes?.map((c: { language: string; code: string }) => ({ language: c.language, code: c.code })) || []);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [params]);

  const updateCode = (index: number, field: keyof CodeEntry, value: string) => {
    setCodes((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addCode = () => {
    playClick();
    setCodes((prev) => [...prev, { language: "cpp", code: "" }]);
  };

  const removeCode = (index: number) => {
    playClick();
    setCodes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFormat = async (index: number, code: string, language: string) => {
    playClick();
    setFormattingIdx(index);
    const formatted = await formatCode(code, language);
    setFormattingIdx(null);
    updateCode(index, "code", formatted);
  };

  const fetchHistory = useCallback(async (id: number) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/templates/history?templateId=${id}`, { cache: "no-store" });
      if (res.ok) setHistory(await res.json());
    } catch {
      // ignore — history is non-critical
    }
    setLoadingHistory(false);
  }, []);

  const reloadTemplate = useCallback(async (id: number) => {
    try {
      const template = await fetch(`/api/admin/templates?id=${id}`, { cache: "no-store" }).then((r) => r.json());
      if (template && !template.error) {
        setForm({
          title: template.title,
          slug: template.slug,
          description: template.description,
          categoryId: String(template.categoryId),
          complexity: template.complexity,
          notes: template.notes || "",
          tags: (template.tags || []).join(", "),
          hidden: template.hidden ?? false,
        });
        setCodes(
          template.codes?.map((c: { language: string; code: string }) => ({ language: c.language, code: c.code })) || []
        );
      }
    } catch {
      // non-critical
    }
  }, []);

  const doRevert = async () => {
    if (!revertTarget || !templateId) return;
    playClick();
    setReverting(true);
    const res = await fetch("/api/admin/templates/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ historyId: revertTarget.id }),
    });
    setReverting(false);
    setRevertTarget(null);
    if (res.ok) {
      playSuccess();
      toast.success("Template reverted — reloaded below");
      // Refresh in place so the form + history reflect the new state and the
      // next revert operates on a fresh, correctly-ordered list.
      await Promise.all([reloadTemplate(templateId), fetchHistory(templateId)]);
      setExpandedHistory(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      playBeep(440, 0.15);
      toast.error(data.error || "Failed to revert template");
    }
  };

  const doDeleteHistory = async () => {
    if (!deleteHistoryTarget || !templateId) return;
    playClick();
    const ids = deleteHistoryTarget.ids;
    setDeletingHistory(true);
    const res = await fetch("/api/admin/templates/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setDeletingHistory(false);
    setDeleteHistoryTarget(null);
    if (res.ok) {
      playSuccess();
      toast.success(ids.length > 1 ? `Deleted ${ids.length} snapshots` : "Snapshot deleted");
      setSelectedHistory((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      fetchHistory(templateId);
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to delete history");
    }
  };

  const save = async () => {
    if (!form.title || !form.categoryId || !templateId) {
      playBeep(440, 0.15);
      toast.error("Title and category are required");
      return;
    }
    playClick();
    setSaving(true);
    
    // Save notes to .md file
    try {
      await fetch("/api/admin/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: form.slug, content: form.notes }),
      });
    } catch (error) {
      console.error("Error saving notes file:", error);
    }
    
    // Save template to database
    const res = await fetch("/api/admin/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: templateId,
        ...form,
        categoryId: Number(form.categoryId),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        codes: codes.filter((c) => c.code.trim()),
      }),
    });
    setSaving(false);

    if (res.ok) {
      playSuccess();
      toast.success("Template updated");
      router.push("/admin");
      router.refresh();
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to update template");
    }
  };

  // Setup Keyboard shortcuts
  const saveRef = useRef(save);
  const addCodeRef = useRef(addCode);

  useEffect(() => {
    saveRef.current = save;
    addCodeRef.current = addCode;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F10") {
        e.preventDefault();
        saveRef.current();
      }
      if (e.key === "F1" && activeTab === "code") {
        e.preventDefault();
        addCodeRef.current();
      }
      if (e.key === "Escape") {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== "input" && activeTag !== "textarea") {
          playClick();
          router.push("/admin");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, router, playClick]);

  if (loading) {
    return (
      <div className="text-center py-16 text-muted-foreground/45 font-mono text-xs animate-pulse">
        $ read_settings --id={templateId || "..."}
        <br />
        [LOAD] Loading current template configurations...
      </div>
    );
  }

  const help = HELP_TEXTS[focusedField] || HELP_TEXTS.default;

  return (
    <div className="space-y-6 font-mono">
      {/* BIOS Screen Top Header info */}
      <div className="flex justify-between items-center text-xs text-muted-foreground/45 border-b border-primary/25 pb-2">
        <div className="flex items-center gap-1">
          <span>UTILITY: MODIFY_TEMPLATE.EXE</span>
        </div>
        <div>ROM VERSION 6.22-A</div>
      </div>

      {/* Main BIOS border frame wrapper */}
      <div className="border border-primary/20 bg-card/40 shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex border-b border-primary/20 bg-primary/5 select-none text-[11px]">
          <button
            type="button"
            onClick={() => { playClick(); setActiveTab("main"); setFocusedField("default"); }}
            className={`px-4 py-2.5 border-r border-primary/20 uppercase tracking-widest font-bold ${
              activeTab === "main" ? "bg-background text-primary border-b-2 border-b-primary" : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"
            }`}
          >
            [ Main Settings ]
          </button>
          <button
            type="button"
            onClick={() => { playClick(); setActiveTab("notes"); setFocusedField("notes"); }}
            className={`px-4 py-2.5 border-r border-primary/20 uppercase tracking-widest font-bold ${
              activeTab === "notes" ? "bg-background text-primary border-b-2 border-b-primary" : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"
            }`}
          >
            [ Notes / Docs ]
          </button>
          <button
            type="button"
            onClick={() => { playClick(); setActiveTab("code"); setFocusedField("code"); }}
            className={`px-4 py-2.5 border-r border-primary/20 uppercase tracking-widest font-bold ${
              activeTab === "code" ? "bg-background text-primary border-b-2 border-b-primary" : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"
            }`}
          >
            [ Source Code ]
          </button>
          <button
            type="button"
            onClick={() => { playClick(); setActiveTab("history"); setFocusedField("default"); if (templateId) fetchHistory(templateId); }}
            className={`px-4 py-2.5 border-r border-primary/20 uppercase tracking-widest font-bold flex items-center gap-1.5 ${
              activeTab === "history" ? "bg-background text-primary border-b-2 border-b-primary" : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"
            }`}
          >
            <History className="h-3 w-3" />
            [ History ]
          </button>
        </div>

        {/* Dynamic Dual-Pane Settings Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left Fields Pane */}
          <div className="lg:col-span-8 space-y-4">
            {activeTab === "main" && (
              <div className="space-y-1 divide-y divide-border/20">
                {/* Title */}
                <div
                  className={`py-3 px-2 border border-transparent transition-all ${
                    focusedField === "title" ? "bg-primary/[0.03] border-primary/10" : ""
                  }`}
                  onClick={() => { playClick(); setFocusedField("title"); }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Label htmlFor="title" className="text-xs font-bold tracking-wider text-foreground flex items-center gap-1.5 cursor-pointer select-none">
                      <span className={focusedField === "title" ? "text-primary animate-pulse" : "text-transparent"}>▶</span>
                      <span>Template Title</span>
                    </Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Segment Tree"
                      className="bg-background/40 border-border focus:border-primary/50 text-xs font-mono h-8 rounded-none md:max-w-md w-full"
                      onFocus={() => { playClick(); setFocusedField("title"); }}
                    />
                  </div>
                </div>

                {/* Slug */}
                <div
                  className={`py-3 px-2 border border-transparent transition-all ${
                    focusedField === "slug" ? "bg-primary/[0.03] border-primary/10" : ""
                  }`}
                  onClick={() => { playClick(); setFocusedField("slug"); }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Label htmlFor="slug" className="text-xs font-bold tracking-wider text-foreground flex items-center gap-1.5 cursor-pointer select-none">
                      <span className={focusedField === "slug" ? "text-primary animate-pulse" : "text-transparent"}>▶</span>
                      <span>URL Slug</span>
                    </Label>
                    <Input
                      id="slug"
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      placeholder="segment-tree"
                      className="bg-background/40 border-border focus:border-primary/50 text-xs font-mono h-8 rounded-none md:max-w-md w-full"
                      onFocus={() => { playClick(); setFocusedField("slug"); }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div
                  className={`py-3 px-2 border border-transparent transition-all ${
                    focusedField === "description" ? "bg-primary/[0.03] border-primary/10" : ""
                  }`}
                  onClick={() => { playClick(); setFocusedField("description"); }}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <Label htmlFor="desc" className="text-xs font-bold tracking-wider text-foreground flex items-center gap-1.5 cursor-pointer select-none pt-1">
                      <span className={focusedField === "description" ? "text-primary animate-pulse" : "text-transparent"}>▶</span>
                      <span>Short Description</span>
                    </Label>
                    <Textarea
                      id="desc"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Point update, range query segment tree implementation"
                      className="bg-background/40 border-border focus:border-primary/50 text-xs font-mono min-h-[60px] rounded-none md:max-w-md w-full resize-none"
                      onFocus={() => { playClick(); setFocusedField("description"); }}
                    />
                  </div>
                </div>

                {/* Category ID */}
                <div
                  className={`py-3 px-2 border border-transparent transition-all ${
                    focusedField === "categoryId" ? "bg-primary/[0.03] border-primary/10" : ""
                  }`}
                  onClick={() => { playClick(); setFocusedField("categoryId"); }}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <Label className="text-xs font-bold tracking-wider text-foreground flex items-center gap-1.5 cursor-pointer select-none pt-1">
                      <span className={focusedField === "categoryId" ? "text-primary animate-pulse" : "text-transparent"}>▶</span>
                      <span>Category Folder</span>
                    </Label>
                    <div className="flex flex-col md:max-w-md w-full gap-2">
                      <Select value={form.categoryId} onValueChange={(v) => { playClick(); if (v) setForm((f) => ({ ...f, categoryId: v })); }}>
                        <SelectTrigger className="bg-background/40 border-border focus:border-primary/50 text-xs font-mono h-8 rounded-none">
                          <SelectValue placeholder="Select Category..." />
                        </SelectTrigger>
                        <SelectContent className="font-mono text-xs">
                          {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <CategoryCreator onCreated={(cat) => {
                        playSuccess();
                        setCategories((prev) => [...prev, cat]);
                        setForm((f) => ({ ...f, categoryId: String(cat.id) }));
                      }} />
                    </div>
                  </div>
                </div>


                {/* Tags */}
                <div
                  className={`py-3 px-2 border border-transparent transition-all ${
                    focusedField === "tags" ? "bg-primary/[0.03] border-primary/10" : ""
                  }`}
                  onClick={() => { playClick(); setFocusedField("tags"); }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Label htmlFor="tags" className="text-xs font-bold tracking-wider text-foreground flex items-center gap-1.5 cursor-pointer select-none">
                      <span className={focusedField === "tags" ? "text-primary animate-pulse" : "text-transparent"}>▶</span>
                      <span>Search Keywords</span>
                    </Label>
                    <Input
                      id="tags"
                      value={form.tags}
                      onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                      placeholder="segment-tree, range-query"
                      className="bg-background/40 border-border focus:border-primary/50 text-xs font-mono h-8 rounded-none md:max-w-md w-full"
                      onFocus={() => { playClick(); setFocusedField("tags"); }}
                    />
                  </div>
                </div>

                {/* Hidden toggle */}
                <div
                  className={`py-3 px-2 border border-transparent transition-all ${
                    focusedField === "hidden" ? "bg-primary/[0.03] border-primary/10" : ""
                  }`}
                  onClick={() => { playClick(); setFocusedField("hidden"); }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Label htmlFor="hidden-toggle" className="text-xs font-bold tracking-wider text-foreground flex items-center gap-1.5 cursor-pointer select-none">
                      <span className={focusedField === "hidden" ? "text-primary animate-pulse" : "text-transparent"}>▶</span>
                      <span>Hide Template (Admin Panel Only)</span>
                    </Label>
                    <div className="md:max-w-md w-full flex">
                      <button
                        id="hidden-toggle"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          setForm((f) => ({ ...f, hidden: !f.hidden }));
                        }}
                        className={`px-3 py-1 border text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer ${
                          form.hidden
                            ? "border-destructive bg-destructive/10 text-destructive shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                            : "border-primary bg-primary/10 text-primary shadow-[0_0_10px_var(--primary-glow-weak)]"
                        }`}
                        onFocus={() => { playClick(); setFocusedField("hidden"); }}
                      >
                        {form.hidden ? "[ HIDDEN ]" : "[ VISIBLE ]"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div
                className="space-y-4"
                onClick={() => setFocusedField("notes")}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold tracking-wider text-foreground flex items-center gap-1.5">
                    <span className="text-primary animate-pulse">▶</span>
                    <span>Documentation Notes File (Markdown supported)</span>
                  </Label>
                </div>
                <div className="border border-border bg-background/25">
                  <MarkdownEditor
                    value={form.notes}
                    onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
                    placeholder="Optional notes, algorithm explanation, tips..."
                    minHeight="220px"
                  />
                </div>
              </div>
            )}

            {activeTab === "code" && (
              <AdminCodeEditor
                codes={codes}
                formattingIdx={formattingIdx}
                onAdd={addCode}
                onUpdateCode={updateCode}
                onRemove={removeCode}
                onFormat={handleFormat}
                onSound={playClick}
                onFocusCode={() => setFocusedField("code")}
              />
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                  <Label className="text-xs font-bold tracking-wider text-foreground flex items-center gap-1.5">
                    <span className="text-primary animate-pulse">▶</span>
                    <span>Version History — Restore or Prune Snapshots</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground/40 font-mono flex items-center gap-2">
                    {history.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          const allSelected = history.every((h) => selectedHistory[h.id]);
                          if (allSelected) {
                            setSelectedHistory({});
                          } else {
                            const next: Record<number, boolean> = {};
                            history.forEach((h) => { next[h.id] = true; });
                            setSelectedHistory(next);
                          }
                        }}
                        className="uppercase tracking-wider hover:text-primary transition-colors cursor-pointer"
                      >
                        [ {history.every((h) => selectedHistory[h.id]) ? "deselect_all" : "select_all"} ]
                      </button>
                    )}
                    <span>{history.length} snapshots</span>
                  </span>
                </div>

                {(() => {
                  const selectedIds = history.filter((h) => selectedHistory[h.id]).map((h) => h.id);
                  if (selectedIds.length === 0) return null;
                  return (
                    <div className="flex items-center justify-between gap-3 p-2.5 border border-warning/30 bg-warning/5 text-warning text-[11px] font-mono select-none">
                      <span>{selectedIds.length} selected</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { playBeep(330, 0.25); setDeleteHistoryTarget({ ids: selectedIds, label: `${selectedIds.length} snapshots` }); }}
                          className="px-2.5 py-1 border border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                        >
                          [ delete_selected ]
                        </button>
                        <button
                          type="button"
                          onClick={() => { playClick(); setSelectedHistory({}); }}
                          className="px-2.5 py-1 border border-border/50 hover:bg-primary/5 text-[10px] uppercase font-bold tracking-wider cursor-pointer text-muted-foreground"
                        >
                          [ clear ]
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {loadingHistory ? (
                  <div className="text-center py-12 text-muted-foreground/45 font-mono text-xs animate-pulse">
                    $ git log --oneline
                    <br />
                    [LOAD] Reading version history...
                  </div>
                ) : history.length === 0 ? (
                  <div className="border border-dashed border-border p-10 text-center text-muted-foreground/50 text-xs font-mono">
                    No history yet. A snapshot is saved automatically each time this template is edited or reverted.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                    {history.map((h, idx) => {
                      const isOpen = expandedHistory === h.id;
                      return (
                        <div key={h.id} className="border border-primary/15 bg-primary/[0.01]">
                          <div className="flex items-center justify-between p-3 gap-3">
                            <input
                              type="checkbox"
                              checked={!!selectedHistory[h.id]}
                              onChange={(e) => {
                                playClick();
                                const checked = e.target.checked;
                                setSelectedHistory((prev) => ({ ...prev, [h.id]: checked }));
                              }}
                              className="cursor-pointer accent-primary h-3.5 w-3.5 bg-background border border-border/80 rounded-none focus:ring-0 shrink-0"
                            />
                            <button
                              type="button"
                              onClick={() => { playClick(); setExpandedHistory(isOpen ? null : h.id); }}
                              className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                            >
                              <span className="text-primary/60 text-[10px] w-3 shrink-0">{isOpen ? "▼" : "▶"}</span>
                              <span className="text-[10px] text-muted-foreground/40 font-mono shrink-0">
                                v{history.length - idx}
                              </span>
                              <div className="min-w-0">
                                <div className="text-[11px] text-foreground font-bold truncate">
                                  {h.reason || "Edit"}
                                </div>
                                <div className="text-[9px] text-muted-foreground/45 font-mono">
                                  {new Date(h.createdAt).toLocaleString()}
                                  {h.contributorName ? ` · by ${h.contributorName}` : ""}
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => { playBeep(330, 0.2); setRevertTarget(h); }}
                              className="shrink-0 flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 border border-warning/40 bg-warning/5 text-warning hover:bg-warning/15 transition-colors uppercase font-bold tracking-wider cursor-pointer rounded-none"
                            >
                              <RotateCcw className="h-3 w-3" />
                              revert
                            </button>
                            <button
                              type="button"
                              onClick={() => { playBeep(330, 0.2); setDeleteHistoryTarget({ ids: [h.id], label: `v${history.length - idx} (${h.reason || "Edit"})` }); }}
                              title="Delete this snapshot"
                              className="shrink-0 flex items-center justify-center text-[10px] p-1.5 border border-transparent text-muted-foreground/45 hover:text-destructive hover:border-destructive/20 transition-colors cursor-pointer rounded-none"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {isOpen && (
                            <div className="border-t border-border/40 p-3 space-y-2 bg-black/10">
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground/60">
                                <span><span className="text-primary/60 font-bold">title:</span> {h.title}</span>
                                <span><span className="text-primary/60 font-bold">slug:</span> {h.slug}</span>
                                {h.complexity && <span><span className="text-primary/60 font-bold">complexity:</span> {h.complexity}</span>}
                                {h.tags?.length > 0 && <span><span className="text-primary/60 font-bold">tags:</span> {h.tags.join(", ")}</span>}
                              </div>
                              {h.codes && h.codes.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  {h.codes.map((blk, i) => (
                                    <div key={i} className="border border-border/40 bg-black/25">
                                      <div className="px-2 py-1 border-b border-border/40 bg-primary/5 text-[9px] text-primary/70 font-bold uppercase">{blk.language}</div>
                                      <pre className="p-2 text-[9px] text-foreground/80 overflow-x-auto scrollbar-thin whitespace-pre max-h-40">{blk.code}</pre>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Help Pane (Visible only on large screens) */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="flex flex-col h-full justify-between min-h-[350px] border border-primary/15 p-4 bg-primary/[0.01]">
              <div>
                <div className="text-[9px] text-primary/40 uppercase tracking-widest font-mono mb-2 select-none">Item Specific Help</div>
                <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2 font-mono select-none">
                  {help.title}
                </h3>
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-mono">
                  {help.description}
                </p>
              </div>
              
              <div className="border-t border-primary/10 pt-4 mt-4 font-mono text-[9px] text-muted-foreground/40 space-y-1 uppercase select-none">
                <div className="flex justify-between"><span>TAB/CLICK</span> <span>SELECT FIELD</span></div>
                <div className="flex justify-between"><span>F10</span> <span>SAVE SETTINGS</span></div>
                <div className="flex justify-between"><span>ESC</span> <span>EXIT UTILITY</span></div>
                {activeTab === "code" && (
                  <div className="flex justify-between text-primary/70"><span>F1</span> <span>ADD CODE FILE</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Button Controls Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono select-none border-t border-primary/15 pt-4 mt-6">
        <button
          type="button"
          onClick={() => { playClick(); router.push("/admin"); }}
          className="flex items-center gap-2 px-3 py-2 border border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-left text-muted-foreground hover:text-primary transition-all rounded-none"
        >
          <span className="text-primary font-bold">[ESC]</span>
          <span>Exit Setup</span>
        </button>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-3 py-2 border border-primary bg-primary/10 hover:bg-primary/20 text-left text-primary transition-all font-semibold rounded-none"
        >
          <span className="text-primary font-bold">[F10]</span>
          <span>{saving ? "Writing..." : "Save Template"}</span>
        </button>

        {activeTab === "code" && (
          <button
            type="button"
            onClick={addCode}
            className="flex items-center gap-2 px-3 py-2 border border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-left text-muted-foreground hover:text-primary transition-all rounded-none"
          >
            <span className="text-primary font-bold">[F1]</span>
            <span>Add Language</span>
          </button>
        )}
      </div>

      {/* Revert confirmation modal */}
      {revertTarget && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md border border-warning bg-card/95 shadow-[0_0_40px_rgba(234,179,8,0.2)] overflow-hidden font-mono">
            <div className="flex items-center justify-between px-3 py-2 border-b border-warning/30 bg-warning/10 text-warning text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning animate-ping" />
                <span>↺ [ REVERT_VERSION.SH ]</span>
              </div>
              <span>RESTORE_SYS_V1</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">restore target</div>
                <div className="text-xs font-bold text-foreground bg-muted/20 p-2 border border-border">
                  {revertTarget.reason || "Edit"}
                  <span className="block text-[9px] text-muted-foreground/45 font-normal mt-0.5">
                    {new Date(revertTarget.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground/85 leading-relaxed">
                This restores the template (fields + code) to this saved version. The current state is snapshotted first, so you can undo the revert from history.
              </div>
            </div>
            <div className="border-t border-border/45 px-6 py-4 bg-muted/5 flex justify-end gap-3 text-[10px]">
              <button
                type="button"
                onClick={() => { playClick(); setRevertTarget(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary/40 hover:text-primary transition-colors uppercase cursor-pointer"
              >
                <span>[ ESC ]</span>
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={doRevert}
                disabled={reverting}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-warning bg-warning/15 hover:bg-warning/35 text-warning transition-colors uppercase font-bold cursor-pointer disabled:opacity-50"
              >
                <span>[ ENTER ]</span>
                <span>{reverting ? "Restoring..." : "Restore Version"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete history confirmation modal */}
      {deleteHistoryTarget && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md border border-destructive bg-card/95 shadow-[0_0_40px_rgba(239,68,68,0.25)] overflow-hidden font-mono">
            <div className="flex items-center justify-between px-3 py-2 border-b border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive animate-ping" />
                <span>[WARN] [ DELETE_HISTORY.SH ]</span>
              </div>
              <span>WARN_LEVEL_2</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">command target</div>
                <div className="text-xs font-bold text-foreground bg-muted/20 p-2 border border-border flex items-center gap-2">
                  <span className="text-destructive font-bold">$ rm</span>
                  <span>history/{deleteHistoryTarget.label}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground/85 leading-relaxed">
                {deleteHistoryTarget.ids.length > 1
                  ? `Permanently delete these ${deleteHistoryTarget.ids.length} snapshots.`
                  : "Permanently delete this snapshot."}{" "}
                This only removes saved history — the current template is unaffected. You will not be able to revert to {deleteHistoryTarget.ids.length > 1 ? "these versions" : "this version"} afterward.
              </div>
            </div>
            <div className="border-t border-border/45 px-6 py-4 bg-muted/5 flex justify-end gap-3 text-[10px]">
              <button
                type="button"
                onClick={() => { playClick(); setDeleteHistoryTarget(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary/40 hover:text-primary transition-colors uppercase cursor-pointer"
              >
                <span>[ ESC ]</span>
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={doDeleteHistory}
                disabled={deletingHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive bg-destructive/15 hover:bg-destructive/35 text-destructive transition-colors uppercase font-bold cursor-pointer disabled:opacity-50"
              >
                <span>[ ENTER ]</span>
                <span>{deletingHistory ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
