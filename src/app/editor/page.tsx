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
  Hash,
  Pencil,
  AlertTriangle,
  Layers,
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

  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState("");

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
                userNotes: getSavedUserNotes(t.id) || t.notes || "",
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

  // Handle PDF Settings Save
  const handleSaveSettings = (newSettings: PdfSettings) => {
    setSettings(newSettings);
    localStorage.setItem("itl-pdf-settings", JSON.stringify(newSettings));
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

    const layoutCols = { "1-col": 1, "2-col": 2, "3-col": 3 } as const;
    const payload = {
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
        theme: settings.theme,
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

  // Add new section
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
    toast.success(`Created section: ${title}`);
  };

  // Delete section
  const handleDeleteSection = (secId: string) => {
    playClick();
    setSections((prev) => prev.filter((s) => s.id !== secId));
    toast.info("Section deleted");
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
            userNotes: getSavedUserNotes(data.id) || data.notes || "",
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

  return (
    <div className="min-h-screen font-mono flex flex-col bg-background text-foreground">
      {/* ─── Top ICPC Header Toolbar ─── */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md px-4 py-2.5 print:hidden">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-bold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-4 w-px bg-border/60" />
            <BrandLogo size="sm" />
            <span className="hidden md:inline-block text-xs font-bold text-primary">
              ICPC Reference Builder
            </span>
          </div>

          {/* Telemetry Counter */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{sections.length}</strong> categories ·{" "}
              <strong className="text-foreground">{totalTopicsCount}</strong> topics
            </span>
            <div className="px-2 py-0.5 border border-primary/30 bg-primary/10 text-primary text-[10px] font-bold">
              LaTeX PDF
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenSettings(true)}
              className="font-mono text-xs font-bold border-border hover:border-primary/50 cursor-pointer h-8 px-3"
            >
              <Settings2 className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <span>Settings</span>
            </Button>

            <Button
              size="sm"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="font-mono text-xs font-extrabold uppercase bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer h-8 px-4 shadow-[0_0_15px_var(--primary-glow-weak)]"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>Generating PDF...</span>
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

      {/* ─── Two-Pane ICPC Workspace ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Sidebar Pane ── */}
        <aside className="w-72 border-r border-border/80 bg-card/40 flex flex-col shrink-0 overflow-y-auto p-3 space-y-4 print:hidden">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Categories & Topics
              </span>
            </div>

            {/* Inline Add Section Input */}
            <div className="flex gap-1.5">
              <Input
                type="text"
                placeholder="+ New category..."
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
                className="font-mono text-xs h-7.5 bg-background/50 border-border"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddSection}
                className="h-7.5 px-2 border-border hover:border-primary/50 shrink-0"
                title="Add Category"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
              </Button>
            </div>
          </div>

          {/* Section Tree List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {sections.map((sec) => (
              <div
                key={sec.id}
                className={`border transition-all ${
                  activeSectionId === sec.id
                    ? "border-primary/50 bg-primary/[0.03]"
                    : "border-border/60 bg-background/20"
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
                        className="p-1 text-primary hover:text-primary/80"
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
                      <span className="text-[9px] text-muted-foreground font-bold shrink-0">
                        ({sec.topics.length})
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-0.5 shrink-0 ml-1">
                    <button
                      onClick={() => handleOpenAddModal(sec.id)}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      title="Add topic to this section"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSectionId(sec.id);
                        setEditSectionName(sec.title);
                      }}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      title="Rename section"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    {sections.length > 1 && (
                      <button
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete section"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Topics in section */}
                <div className="p-1.5 space-y-1">
                  {sec.topics.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground/50 italic p-1">
                      No topics added yet
                    </div>
                  ) : (
                    sec.topics.map((t, idx) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-1 hover:bg-muted/30 text-xs rounded transition-colors group/topic"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"
                            title="Included in PDF"
                          />
                          <span className="truncate text-[11px] text-muted-foreground group-hover/topic:text-foreground">
                            {t.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover/topic:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleMoveTopic(sec.id, idx, "up")}
                            disabled={idx === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleMoveTopic(sec.id, idx, "down")}
                            disabled={idx === sec.topics.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveTopic(sec.id, t.id)}
                            className="text-muted-foreground hover:text-destructive ml-0.5"
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

        {/* ── Main Content: reference outline (PDF is generated by LaTeX) ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs uppercase tracking-widest">
                Building ICPC Reference Booklet...
              </span>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="border border-border/60 bg-card/40 p-4 space-y-1">
                <div className="text-lg font-bold text-foreground">
                  {settings.customTitle || "ICPC Team Reference"}
                </div>
                {(settings.teamName || settings.institution) && (
                  <div className="text-xs text-muted-foreground">
                    {[settings.teamName, settings.institution].filter(Boolean).join(" — ")}
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground/70 pt-1">
                  {sections.length} categories · {totalTopicsCount} topics ·{" "}
                  {settings.layout.replace("-col", " column")} · compiled to PDF via LaTeX
                </div>
              </div>

              {totalTopicsCount === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-16 border border-dashed border-border/50">
                  Add topics from the sidebar, then hit{" "}
                  <span className="text-primary font-bold">Generate PDF</span>.
                </div>
              ) : (
                sections.map((sec, secIdx) => (
                  <div key={sec.id} className="space-y-2">
                    <h2 className="text-sm font-bold text-foreground border-b border-border/50 pb-1">
                      {secIdx + 1}. {sec.title}
                      <span className="text-[10px] text-muted-foreground font-normal ml-2">
                        ({sec.topics.length})
                      </span>
                    </h2>

                    <div className="space-y-2">
                      {sec.topics.map((tmpl, tIdx) => {
                        const codeObj =
                          tmpl.codes.find((c) => c.language === tmpl.selectedLang) ||
                          tmpl.codes[0];
                        return (
                          <div
                            key={tmpl.id}
                            className="border border-border/40 bg-background/30 p-2.5 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-foreground truncate">
                                {secIdx + 1}.{tIdx + 1}. {tmpl.title}
                                {tmpl.complexity && (
                                  <span className="text-muted-foreground font-normal ml-1">
                                    O({tmpl.complexity})
                                  </span>
                                )}
                              </span>
                              <span className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground">
                                <span className="uppercase">{codeObj?.language || "cpp"}</span>
                                {settings.showCodeHashes && tmpl.hash && (
                                  <span className="font-mono text-primary/70">[{tmpl.hash}]</span>
                                )}
                              </span>
                            </div>

                            {settings.notesStyle === "text" && (
                              <textarea
                                value={tmpl.userNotes || ""}
                                onChange={(e) => handleNoteChange(tmpl.id, e.target.value)}
                                placeholder="Optional note (included in PDF)..."
                                rows={1}
                                className="w-full resize-y bg-muted/20 border border-border/40 rounded px-2 py-1 text-[11px] text-muted-foreground focus:text-foreground focus:border-primary/40 outline-none"
                              />
                            )}
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
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
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
                        className="flex items-center justify-between p-2 border border-border/50 bg-background/30 text-xs"
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
                          className="font-mono text-[10px] h-7 px-2.5 shrink-0 border-border hover:border-primary/50"
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
