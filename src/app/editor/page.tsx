"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Settings2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Loader2,
  FileCode,
  BookOpen,
  Check,
  Edit3,
  Pencil,
  AlertTriangle,
  Layers,
  Search,
  Eye,
  Code2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTerminalTheme } from "@/components/theme-provider";
import { BrandLogo } from "@/components/brand-logo";
import {
  PdfSettingsDialog,
  PdfSettings,
  DEFAULT_PDF_SETTINGS,
} from "@/components/pdf-settings-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { computeCodeHash } from "@/lib/hash-utils";
import MonacoCodeEditor from "@/components/forms/monaco-code-editor";
import { highlightCodeLine } from "@/lib/syntax-highlighter";
import { toast } from "sonner";

interface TemplateCode {
  language: string;
  code: string;
}

interface EditorTopic {
  id: number;
  title: string;
  slug: string;
  description?: string;
  categoryName?: string;
  complexity?: string;
  codes: TemplateCode[];
  notes?: string;
  userNotes?: string;
  selectedLang?: string;
  hash?: string;
}

interface EditorSection {
  id: string;
  title: string;
  topics: EditorTopic[];
}

function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { playClick, playSuccess } = useTerminalTheme();

  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<EditorSection[]>([]);
  const [settings, setSettings] = useState<PdfSettings>(DEFAULT_PDF_SETTINGS);
  const [openSettings, setOpenSettings] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const [availableTemplates, setAvailableTemplates] = useState<
    { id: number; title: string; categoryName?: string }[]
  >([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [sidebarFilter, setSidebarFilter] = useState("");

  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [editingCodeTopicId, setEditingCodeTopicId] = useState<number | null>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [viewMode, setViewMode] = useState<"studio" | "preview">("studio");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Load PDF settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("itl-pdf-settings");
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_PDF_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (err) {
        console.error("Error parsing saved PDF settings:", err);
      }
    }
  }, []);

  const getSavedUserNotes = (id: number): string => {
    return localStorage.getItem(`itl-template-note-${id}`) || "";
  };

  const saveUserNote = (id: number, text: string) => {
    localStorage.setItem(`itl-template-note-${id}`, text);
  };

  // Load templates and organize into ICPC sections
  useEffect(() => {
    const idsParam = searchParams.get("ids");
    const collectionIdParam = searchParams.get("collectionId");

    const loadTemplates = async () => {
      setLoading(true);
      try {
        let fetchIds: number[] = [];

        if (collectionIdParam) {
          const res = await fetch(`/api/users/collections/${collectionIdParam}/items`);
          if (res.ok) {
            const data = await res.json();
            if (data.items) {
              fetchIds = data.items.map((it: { templateId: number }) => it.templateId);
              if (data.collection?.name) {
                setSettings((prev) => ({
                  ...prev,
                  customTitle: `${data.collection.name} Reference`,
                }));
              }
            }
          }
        } else if (idsParam) {
          fetchIds = idsParam
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n));
        }

        let loadedTopics: EditorTopic[] = [];

        if (fetchIds.length > 0) {
          const res = await fetch("/api/templates/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: fetchIds }),
          });

          if (res.ok) {
            const data: EditorTopic[] = await res.json();
            loadedTopics = data.map((t) => {
              const lang = t.codes?.[0]?.language || "cpp";
              const codeObj = t.codes?.find((c) => c.language === lang) || t.codes?.[0];
              return {
                ...t,
                userNotes: getSavedUserNotes(t.id) || "",
                selectedLang: lang,
                hash: computeCodeHash(codeObj?.code || ""),
              };
            });
          }
        } else {
          // Default load demo templates
          const res = await fetch("/api/templates?includeCodes=true");
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
              loadedTopics = data.slice(0, 16).map((t: EditorTopic) => {
                const lang = t.codes?.[0]?.language || "cpp";
                const codeObj = t.codes?.find((c) => c.language === lang) || t.codes?.[0];
                return {
                  ...t,
                  userNotes: getSavedUserNotes(t.id) || "",
                  selectedLang: lang,
                  hash: computeCodeHash(codeObj?.code || ""),
                };
              });
            }
          }
        }

        // Group loaded topics by category into sections
        const grouped = new Map<string, EditorTopic[]>();
        for (const topic of loadedTopics) {
          const cat = topic.categoryName || "General Algorithms";
          if (!grouped.has(cat)) grouped.set(cat, []);
          grouped.get(cat)!.push(topic);
        }

        const initialSections: EditorSection[] = Array.from(grouped.entries()).map(
          ([cat, topics], idx) => ({
            id: `sec-${idx + 1}`,
            title: cat,
            topics,
          })
        );

        if (initialSections.length === 0) {
          initialSections.push({
            id: "sec-1",
            title: "Data Structures",
            topics: [],
          });
        }

        setSections(initialSections);
        setActiveSectionId(initialSections[0].id);
      } catch (err) {
        toast.error("Failed to load templates for editor");
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [searchParams]);

  // Compute total counts
  const totalTopicsCount = sections.reduce((acc, sec) => acc + sec.topics.length, 0);

  // Estimate page count
  const estimatedPages = Math.max(1, Math.ceil(totalTopicsCount / 3) + 2);
  const isOverPageLimit = estimatedPages > 25;

  // Handle PDF Settings Save
  const handleSaveSettings = (newSettings: PdfSettings) => {
    setSettings(newSettings);
    localStorage.setItem("itl-pdf-settings", JSON.stringify(newSettings));
  };

  // Build the service payload from current sections + settings (shared by
  // download and live preview).
  const buildPdfPayload = () => {
    const layoutCols = { "1-col": 1, "2-col": 2, "3-col": 3 } as const;
    return {
      title: settings.customTitle || "ICPC Team Reference",
      subtitle: [settings.teamName, settings.institution].filter(Boolean).join(" — "),
      date: new Date().toISOString().split("T")[0],
      options: {
        columns: layoutCols[settings.layout],
        fontSize: settings.fontSize,
        showToc: settings.showToc,
        showLineNumbers: settings.showLineNumbers,
        showCodeHashes: settings.showCodeHashes,
        pageBreakPerTemplate: settings.pageBreakPerTemplate,
        // theme picker removed — always colored (syntax highlighted). Ignoring
        // any stale settings.theme from older localStorage.
        theme: "light",
      },
      sections: sections.map((sec) => ({
        title: sec.title,
        topics: sec.topics.map((t) => {
          const codeObj =
            t.codes.find((c) => c.language === t.selectedLang) || t.codes[0];
          return {
            title: t.title,
            complexity: t.complexity,
            hash: t.hash,
            language: codeObj?.language || "cpp",
            code: codeObj?.code || "",
            notes: settings.notesStyle === "text" ? t.userNotes : undefined,
          };
        }),
      })),
    };
  };

  // Generate PDF via the LaTeX service and download the returned file
  const handleGeneratePdf = async () => {
    playClick();

    if (totalTopicsCount === 0) {
      toast.error("Add at least one topic before generating");
      return;
    }

    setIsGeneratingPdf(true);
    toast.info("Generating ICPC Team Reference PDF...", { id: "pdf-toast" });

    const payload = buildPdfPayload();

    try {
      const cleanTitle = (settings.customTitle || "ICPC_Team_Reference").replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${cleanTitle}.pdf`;

      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        toast.error(error || "Failed to generate PDF", { id: "pdf-toast" });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      playSuccess();
      toast.success(`Downloaded ${filename}!`, { id: "pdf-toast" });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Error generating PDF file", { id: "pdf-toast" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate the PDF and show it inline (real output, not an HTML mimic)
  const refreshPreview = async () => {
    if (totalTopicsCount === 0) {
      setPreviewError("Add at least one topic to preview");
      setPreviewUrl(null);
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPdfPayload()),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        setPreviewError(error || "Failed to render preview");
        return;
      }
      const blob = await res.blob();
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      setPreviewError("PDF service unavailable");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Enter preview mode and render the PDF (triggered from the toggle)
  const openPreview = () => {
    playClick();
    setViewMode("preview");
    refreshPreview();
  };

  // clean up the blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleAddSection = () => {
    playClick();
    const title = newSectionTitle.trim() || `Section ${sections.length + 1}`;
    const newSec: EditorSection = {
      id: `sec-${Date.now()}`,
      title,
      topics: [],
    };
    setSections([...sections, newSec]);
    setActiveSectionId(newSec.id);
    setNewSectionTitle("");
    toast.success(`Created category: ${title}`);
  };

  // Delete section
  const handleDeleteSection = (secId: string) => {
    playClick();
    setSections((prev) => prev.filter((s) => s.id !== secId));
    toast.info("Category deleted");
  };

  // Rename section
  const handleRenameSection = (secId: string) => {
    playClick();
    if (!editSectionName.trim()) return;
    setSections((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, title: editSectionName.trim() } : s))
    );
    setEditingSectionId(null);
    setEditSectionName("");
  };

  // Move topic within section
  const handleMoveTopic = (secId: string, topicIndex: number, direction: "up" | "down") => {
    playClick();
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== secId) return sec;
        const targetIndex = direction === "up" ? topicIndex - 1 : topicIndex + 1;
        if (targetIndex < 0 || targetIndex >= sec.topics.length) return sec;
        const updated = [...sec.topics];
        const temp = updated[topicIndex];
        updated[topicIndex] = updated[targetIndex];
        updated[targetIndex] = temp;
        return { ...sec, topics: updated };
      })
    );
  };

  // Remove topic from section
  const handleRemoveTopic = (secId: string, topicId: number) => {
    playClick();
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === secId
          ? { ...sec, topics: sec.topics.filter((t) => t.id !== topicId) }
          : sec
      )
    );
  };

  // Open add template modal
  const handleOpenAddModal = async (secId?: string) => {
    playClick();
    if (secId) setActiveSectionId(secId);
    setOpenAddModal(true);
    if (availableTemplates.length === 0) {
      setLoadingAvailable(true);
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const data = await res.json();
          setAvailableTemplates(data);
        }
      } catch {
        toast.error("Failed to load template index");
      } finally {
        setLoadingAvailable(false);
      }
    }
  };

  // Add template to target section
  const handleAddTemplateToSection = async (templateId: number) => {
    playClick();
    const targetSecId = activeSectionId || sections[0]?.id;
    if (!targetSecId) return;

    const exists = sections.some((sec) => sec.topics.some((t) => t.id === templateId));
    if (exists) {
      toast.info("Template is already in your reference document");
      return;
    }

    try {
      const res = await fetch("/api/templates/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [templateId] }),
      });
      if (res.ok) {
        const [data]: EditorTopic[] = await res.json();
        if (data) {
          const lang = data.codes?.[0]?.language || "cpp";
          const codeObj = data.codes?.find((c) => c.language === lang) || data.codes?.[0];
          const newTopic: EditorTopic = {
            ...data,
            userNotes: getSavedUserNotes(data.id) || "",
            selectedLang: lang,
            hash: computeCodeHash(codeObj?.code || ""),
          };

          setSections((prev) =>
            prev.map((sec) =>
              sec.id === targetSecId ? { ...sec, topics: [...sec.topics, newTopic] } : sec
            )
          );
          playSuccess();
          toast.success(`Added ${data.title}!`);
        }
      }
    } catch {
      toast.error("Failed to add template");
    }
  };

  // Note change handler
  const handleNoteChange = (topicId: number, val: string) => {
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        topics: sec.topics.map((t) => (t.id === topicId ? { ...t, userNotes: val } : t)),
      }))
    );
    saveUserNote(topicId, val);
  };

  // Pull the template's original note into this topic's note box
  const handleLoadTemplateNote = (topicId: number, templateNote?: string) => {
    playClick();
    if (!templateNote) {
      toast.info("This template has no saved note");
      return;
    }
    handleNoteChange(topicId, templateNote);
  };

  // Edit code handler
  const handleCodeChange = (topicId: number, val: string) => {
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        topics: sec.topics.map((t) => {
          if (t.id !== topicId) return t;
          const codes = t.codes.map((c) =>
            c.language === t.selectedLang ? { ...c, code: val } : c
          );
          return { ...t, codes, hash: computeCodeHash(val) };
        }),
      }))
    );
  };

  // Filter sections by sidebar search
  const filteredSections = sections.map((sec) => ({
    ...sec,
    topics: sec.topics.filter(
      (t) =>
        t.title.toLowerCase().includes(sidebarFilter.toLowerCase()) ||
        sec.title.toLowerCase().includes(sidebarFilter.toLowerCase())
    ),
  }));

  return (
    <div className="min-h-screen font-mono flex flex-col bg-[#06141B] text-[#CCD0CF]">
      {/* ─── Ultra-Premium Cybernetic Control Header ─── */}
      <header className="sticky top-0 z-40 border-b border-primary/20 bg-[#06141B]/90 backdrop-blur-xl px-4 py-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-bold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-4 w-px bg-border/60" />
            <BrandLogo size="sm" />
            <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2 py-0.5 border border-primary/40 bg-primary/10 text-primary shadow-[0_0_10px_var(--primary-glow-weak)]">
              <Sparkles className="h-3 w-3" />
              <span>Studio v2.0</span>
            </span>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-card/80 p-0.5 border border-border/80 rounded-none">
            <button
              onClick={() => {
                playClick();
                setViewMode("studio");
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "studio"
                  ? "bg-primary text-primary-foreground shadow-[0_0_10px_var(--primary-glow-weak)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Code Studio</span>
            </button>
            <button
              onClick={openPreview}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "preview"
                  ? "bg-primary text-primary-foreground shadow-[0_0_10px_var(--primary-glow-weak)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>PDF Preview</span>
            </button>
          </div>

          {/* Telemetry Hub */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground bg-card/40 px-2.5 py-1 border border-border/50">
              <span>Categories: <strong className="text-primary">{sections.length}</strong></span>
              <span>·</span>
              <span>Topics: <strong className="text-primary">{totalTopicsCount}</strong></span>
            </div>

            {/* ICPC 25-Page Telemetry Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-extrabold uppercase transition-all ${
                isOverPageLimit
                  ? "border-destructive bg-destructive/15 text-destructive animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  : estimatedPages > 20
                  ? "border-warning bg-warning/15 text-warning"
                  : "border-primary/40 bg-primary/10 text-primary"
              }`}
            >
              {isOverPageLimit && <AlertTriangle className="h-3.5 w-3.5" />}
              <span>~{estimatedPages} / 25 Pages Used</span>
            </div>
          </div>

          {/* Action Studio Toolbar */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenSettings(true)}
              className="font-mono text-xs font-bold border-border hover:border-primary/50 text-foreground cursor-pointer h-8 px-3"
            >
              <Settings2 className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <span>Settings</span>
            </Button>

            <Button
              size="sm"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="font-mono text-xs font-extrabold uppercase bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer h-8 px-4 shadow-[0_0_20px_var(--primary-glow-weak)]"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>Compiling PDF...</span>
                </>
              ) : (
                <>
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  <span>Generate PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Two-Pane Studio Workspace ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Sidebar Pane ── */}
        <aside className="w-80 border-r border-border/60 bg-[#06141B]/95 flex flex-col shrink-0 overflow-y-auto p-3.5 space-y-4">
          {/* Search Filter */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search algorithms in book..."
              value={sidebarFilter}
              onChange={(e) => setSidebarFilter(e.target.value)}
              className="font-mono text-xs pl-8 bg-background/50 border-border/70 text-foreground h-8"
            />
          </div>

          {/* Add Category Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Category Tree
              </span>
              <span className="text-primary font-bold">{sections.length} Active</span>
            </div>

            <div className="flex gap-1.5">
              <Input
                type="text"
                placeholder="+ New category (e.g. Graph Theory)"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
                className="font-mono text-xs h-8 bg-background/50 border-border"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddSection}
                className="h-8 px-2.5 border-border hover:border-primary/50 text-primary shrink-0 cursor-pointer"
                title="Add Category"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Section Tree List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {filteredSections.map((sec) => (
              <div
                key={sec.id}
                className={`border transition-all ${
                  activeSectionId === sec.id
                    ? "border-primary/50 bg-primary/[0.04] shadow-[0_0_15px_var(--primary-glow-ultra-weak)]"
                    : "border-border/60 bg-card/30 hover:border-primary/30"
                }`}
              >
                {/* Section Header */}
                <div className="flex items-center justify-between p-2 bg-muted/20 border-b border-border/40">
                  {editingSectionId === sec.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        type="text"
                        value={editSectionName}
                        onChange={(e) => setEditSectionName(e.target.value)}
                        className="font-mono text-xs h-6 bg-background border-border p-1"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameSection(sec.id)}
                        className="p-1 text-primary hover:text-primary/80 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        playClick();
                        setActiveSectionId(sec.id);
                      }}
                      className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                    >
                      <span className="font-extrabold text-xs uppercase text-foreground truncate">
                        {sec.title}
                      </span>
                      <span className="text-[9px] text-muted-[#CCD0CF] font-bold shrink-0 px-1 py-0.2 bg-primary/10 border border-primary/20 text-primary">
                        {sec.topics.length}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-0.5 shrink-0 ml-1">
                    <button
                      onClick={() => handleOpenAddModal(sec.id)}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      title="Add topic to this section"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSectionId(sec.id);
                        setEditSectionName(sec.title);
                      }}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      title="Rename category"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    {sections.length > 1 && (
                      <button
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Topics in section */}
                <div className="p-1.5 space-y-1">
                  {sec.topics.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground/40 italic p-1">
                      No topics added yet
                    </div>
                  ) : (
                    sec.topics.map((t, idx) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-1.5 hover:bg-muted/40 text-xs rounded-none transition-colors group/topic border border-transparent hover:border-border/40"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse"
                            title="Included in PDF"
                          />
                          <span className="truncate text-[11px] text-muted-foreground group-hover/topic:text-foreground font-medium">
                            {t.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover/topic:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleMoveTopic(sec.id, idx, "up")}
                            disabled={idx === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer p-0.5"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleMoveTopic(sec.id, idx, "down")}
                            disabled={idx === sec.topics.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer p-0.5"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveTopic(sec.id, t.id)}
                            className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5 ml-0.5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Center Content Workspace ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#06141B]/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs uppercase tracking-widest font-bold text-primary">
                Loading ICPC Studio Workspace...
              </span>
            </div>
          ) : viewMode === "preview" ? (
            /* ── VIEW MODE: real generated PDF, embedded ── */
            <div className="mx-auto max-w-4xl h-full min-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-widest font-bold text-primary">
                  Live PDF Preview
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshPreview}
                  disabled={previewLoading}
                  className="h-7 px-3 text-[11px] font-bold border-border hover:border-primary/50"
                >
                  {previewLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>Refresh</>
                  )}
                </Button>
              </div>

              {previewLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground border border-border/50 bg-card/30">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-xs uppercase tracking-widest">Compiling PDF…</span>
                </div>
              ) : previewError ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-destructive border border-destructive/30 bg-destructive/5">
                  <AlertTriangle className="h-6 w-6" />
                  <span className="text-xs">{previewError}</span>
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  title="PDF preview"
                  className="flex-1 w-full border border-border/60 bg-white rounded-sm"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border/50">
                  No preview yet.
                </div>
              )}
            </div>
          ) : (
            /* ── VIEW MODE: Interactive Code & Section Studio ── */
            <div className="mx-auto max-w-4xl space-y-6">
              {/* Document Info Card */}
              <div className="border border-border/80 bg-card/60 p-5 space-y-3 backdrop-blur-md shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
                      <Edit3 className="h-3.5 w-3.5" />
                      Document Header Metadata
                    </label>
                    <Input
                      type="text"
                      value={settings.customTitle}
                      onChange={(e) =>
                        handleSaveSettings({ ...settings, customTitle: e.target.value })
                      }
                      placeholder="ICPC Team Reference Document"
                      className="font-mono text-sm font-bold bg-background/50 border-border text-foreground h-9"
                    />
                  </div>

                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Team Name & University
                    </label>
                    <Input
                      type="text"
                      value={settings.teamName}
                      onChange={(e) =>
                        handleSaveSettings({ ...settings, teamName: e.target.value })
                      }
                      placeholder="Informatics Template Lib — Contest Reference"
                      className="font-mono text-xs bg-background/50 border-border text-foreground h-9"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold">{sections.length} categories</span>
                    <span>·</span>
                    <span className="text-primary font-bold">{totalTopicsCount} algorithms</span>
                    <span>·</span>
                    <span className="uppercase text-[10px] px-1.5 py-0.5 border border-primary/30 bg-primary/10 text-primary font-bold">
                      {settings.layout}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenAddModal()}
                    className="font-mono text-xs font-bold border-border hover:border-primary/50 text-primary h-7 px-2.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    <span>Add Algorithm</span>
                  </Button>
                </div>
              </div>

              {/* Sections List in Studio */}
              {totalTopicsCount === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-20 border border-dashed border-border/50 bg-card/20 space-y-3">
                  <FileCode className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <div>
                    No templates added yet. Add algorithms from the sidebar or click{" "}
                    <button
                      onClick={() => handleOpenAddModal()}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      + Add Algorithm
                    </button>.
                  </div>
                </div>
              ) : (
                sections.map((sec, secIdx) => (
                  <div key={sec.id} className="space-y-3">
                    {/* Category Title Header */}
                    <div className="flex items-center justify-between border-b border-primary/30 pb-1.5">
                      <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
                        <span className="px-1.5 py-0.5 border border-primary/40 bg-primary/10 text-primary text-[10px]">
                          {secIdx + 1}
                        </span>
                        <span>{sec.title}</span>
                      </h2>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {sec.topics.length} topic{sec.topics.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {/* Topic Cards */}
                    <div className="space-y-4">
                      {sec.topics.map((tmpl, tIdx) => {
                        const codeObj =
                          tmpl.codes.find((c) => c.language === tmpl.selectedLang) ||
                          tmpl.codes[0];

                        return (
                          <div
                            key={tmpl.id}
                            className="border border-border/70 bg-card/40 p-4 space-y-3 shadow-lg hover:border-primary/40 transition-all"
                          >
                            {/* Card Header Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-primary font-bold">
                                  {secIdx + 1}.{tIdx + 1}
                                </span>
                                <h3 className="font-bold text-xs sm:text-sm text-foreground">
                                  {tmpl.title}
                                </h3>
                                {tmpl.complexity && (
                                  <span className="text-[10px] text-info font-mono font-bold px-1.5 py-0.2 border border-info/30 bg-info/10">
                                    O({tmpl.complexity})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
                                {/* Move / Delete */}
                                <div className="flex items-center gap-1 border-l border-border/50 pl-2">
                                  <button
                                    onClick={() => handleMoveTopic(sec.id, tIdx, "up")}
                                    disabled={tIdx === 0}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer p-0.5"
                                    title="Move up"
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveTopic(sec.id, tIdx, "down")}
                                    disabled={tIdx === sec.topics.length - 1}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer p-0.5"
                                    title="Move down"
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveTopic(sec.id, tmpl.id)}
                                    className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5 ml-1"
                                    title="Remove algorithm"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* User Custom Notes */}
                            {settings.notesStyle === "text" && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="uppercase font-bold text-muted-foreground/80 flex items-center gap-1">
                                    <Edit3 className="h-3 w-3 text-primary" />
                                    Notes & Implementation Hints
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleLoadTemplateNote(tmpl.id, tmpl.notes)}
                                    className="inline-flex items-center gap-1 font-bold text-primary/80 hover:text-primary border border-border/50 hover:border-primary/40 rounded px-1.5 py-0.5 cursor-pointer transition-colors"
                                  >
                                    <BookOpen className="h-3 w-3" />
                                    <span>Load saved template note</span>
                                  </button>
                                </div>
                                <textarea
                                  value={tmpl.userNotes || ""}
                                  onChange={(e) => handleNoteChange(tmpl.id, e.target.value)}
                                  placeholder="Type custom hints or edge cases (included in PDF)..."
                                  rows={2}
                                  className="w-full resize-y bg-background/50 border border-border/60 rounded-none px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 outline-none font-mono"
                                />
                              </div>
                            )}

                            {/* Code Container */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="uppercase font-bold text-muted-foreground/70">
                                  Implementation Code ({codeObj?.language || "cpp"})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClick();
                                    setEditingCodeTopicId((prev) => (prev === tmpl.id ? null : tmpl.id));
                                  }}
                                  className="inline-flex items-center gap-1 font-bold text-primary/90 hover:text-primary border border-border/50 hover:border-primary/40 rounded px-1.5 py-0.5 cursor-pointer transition-colors"
                                >
                                  {editingCodeTopicId === tmpl.id ? (
                                    <>
                                      <Check className="h-3 w-3" />
                                      <span>Done Editing</span>
                                    </>
                                  ) : (
                                    <>
                                      <Pencil className="h-3 w-3" />
                                      <span>Edit Code Snippet</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {editingCodeTopicId === tmpl.id ? (
                                <MonacoCodeEditor
                                  value={codeObj?.code || ""}
                                  language={codeObj?.language || "cpp"}
                                  onChange={(v) => handleCodeChange(tmpl.id, v)}
                                  height={260}
                                />
                              ) : (
                                <div className="bg-[#06141B] rounded border border-border/60 p-3 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-60">
                                  <pre className="whitespace-pre font-mono">
                                    <code>
                                      {(codeObj?.code || "// No code snippet").split("\n").map((line, lIdx) => (
                                        <div key={lIdx} className="flex">
                                          <span className="select-none text-muted-foreground/30 pr-3 shrink-0 w-8 text-right">
                                            {lIdx + 1}
                                          </span>
                                          <span className="flex-1">{highlightCodeLine(line)}</span>
                                        </div>
                                      ))}
                                    </code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Settings Dialog ── */}
      <PdfSettingsDialog
        open={openSettings}
        onOpenChange={setOpenSettings}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* ── Add Template Dialog ── */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent className="border border-primary/30 bg-card p-6 font-mono max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Template to ICPC Reference
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <Input
              type="text"
              placeholder="Search algorithms..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="font-mono text-xs bg-background/50 border-border"
            />

            {loadingAvailable ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                <span>Loading algorithm index...</span>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {availableTemplates
                  .filter((t) =>
                    t.title.toLowerCase().includes(searchFilter.toLowerCase())
                  )
                  .map((tmpl) => {
                    const inBook = sections.some((sec) =>
                      sec.topics.some((tp) => tp.id === tmpl.id)
                    );
                    return (
                      <div
                        key={tmpl.id}
                        className="flex items-center justify-between p-2 border border-border/50 bg-background/30 text-xs hover:border-primary/40 transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-foreground truncate">
                            {tmpl.title}
                          </div>
                          {tmpl.categoryName && (
                            <div className="text-[9px] text-info">
                              [{tmpl.categoryName}]
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={inBook ? "ghost" : "outline"}
                          disabled={inBook}
                          onClick={() => handleAddTemplateToSection(tmpl.id)}
                          className="font-mono text-[10px] h-7 px-2.5 shrink-0 border-border hover:border-primary/50 cursor-pointer"
                        >
                          {inBook ? (
                            <span className="text-muted-foreground">Added</span>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1 text-primary" />
                              <span>Add</span>
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06141B] flex flex-col items-center justify-center font-mono text-xs text-muted-foreground gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading ICPC Reference Builder...</span>
        </div>
      }
    >
      <EditorPageContent />
    </Suspense>
  );
}
