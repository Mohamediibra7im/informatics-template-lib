"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { CategoryCreator } from "@/components/category-creator";
import { useTerminalTheme } from "@/components/theme-provider";
import { formatCode } from "@/lib/format-code";
import { AdminCodeEditor, type CodeEntry } from "@/components/forms/admin-code-editor";

interface Category {
  id: number;
  name: string;
  slug: string;
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

export default function NewTemplate() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"main" | "notes" | "code">("main");
  const [focusedField, setFocusedField] = useState<string>("default");

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
  const [codes, setCodes] = useState<CodeEntry[]>([{ language: "cpp", code: "" }]);
  const [formattingIdx, setFormattingIdx] = useState<number | null>(null);

  const fetchCategories = useCallback(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playClick();
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== "string") return;

        const data = JSON.parse(text);

        // Find category ID by categorySlug
        let matchedCategoryId = "";
        if (data.categorySlug) {
          const match = categories.find(
            (c) => c.slug.toLowerCase() === data.categorySlug.toLowerCase()
          );
          if (match) {
            matchedCategoryId = String(match.id);
          }
        }

        setForm({
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          categoryId: matchedCategoryId || String(data.categoryId || ""),
          complexity: "",
          notes: data.notes || "",
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || ""),
          hidden: !!data.hidden,
        });

        if (Array.isArray(data.codes)) {
          setCodes(
            data.codes.map((c: { language?: string; code?: string }) => ({
              language: c.language || "cpp",
              code: c.code || "",
            }))
          );
        } else if (data.code) {
          setCodes([{ language: data.language || "cpp", code: data.code }]);
        }

        playSuccess();
        toast.success("JSON template imported successfully!");
      } catch (err) {
        playBeep(440, 0.15);
        toast.error("Failed to parse JSON file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const onTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: generateSlug(title) }));
  };

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

  const save = async () => {
    if (!form.title || !form.categoryId) {
      playBeep(440, 0.15);
      toast.error("Title and category are required");
      return;
    }
    playClick();
    setSaving(true);
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        categoryId: Number(form.categoryId),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        codes: codes.filter((c) => c.code.trim()),
      }),
    });
    
    // Save notes to .md file if template was created
    if (res.ok) {
      try {
        await fetch("/api/admin/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: form.slug, content: form.notes }),
        });
      } catch (error) {
        console.error("Error saving notes file:", error);
      }
    }
    
    setSaving(false);

    if (res.ok) {
      playSuccess();
      toast.success("Template created");
      router.push("/admin");
      router.refresh();
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to create template");
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

  const help = HELP_TEXTS[focusedField] || HELP_TEXTS.default;

  return (
    <div className="space-y-6 font-mono">
      {/* BIOS Screen Top Header info */}
      <div className="flex justify-between items-center text-xs text-muted-foreground/45 border-b border-primary/25 pb-2">
        <div className="flex items-center gap-1">
          <span>UTILITY: WRITE_TEMPLATE.EXE</span>
        </div>
        <div>ROM VERSION 6.22-A</div>
      </div>

      {/* Main BIOS border frame wrapper */}
      <div className="border border-primary/20 bg-card/40 shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-primary/20 bg-primary/5 select-none text-[11px]">
          <div className="flex">
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
          </div>

          {/* Import JSON button */}
          <div className="px-4 py-1.5 shrink-0 flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              id="json-import-input"
              className="hidden"
              onChange={handleJsonImport}
            />
            <Label
              htmlFor="json-import-input"
              className="inline-flex items-center gap-1.5 px-3 py-1 border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider cursor-pointer font-mono select-none"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import JSON</span>
            </Label>
          </div>
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
                      onChange={(e) => onTitleChange(e.target.value)}
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
    </div>
  );
}
