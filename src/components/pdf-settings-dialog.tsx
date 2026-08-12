"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings2,
  Check,
  LayoutGrid,
  Rows,
  Sun,
  Moon,
  FileText,
  Hash,
  BookOpen,
  Sliders,
  Type,
  FileSpreadsheet,
  Grid3X3,
  FileCode2,
  Layers,
} from "lucide-react";

export interface PdfSettings {
  layout: "1-col" | "2-col" | "3-col";
  fontSize: "small" | "medium" | "large";
  theme: "monochrome" | "dark" | "light";
  showLineNumbers: boolean;
  notesStyle: "text" | "lines" | "none";
  pageBreakPerTemplate: boolean;
  customTitle: string;
  teamName: string;
  institution: string;
  showToc: boolean;
  showCodeHashes: boolean;
  compactCode: boolean;
  showPageNumbers: boolean;
}

export const DEFAULT_PDF_SETTINGS: PdfSettings = {
  layout: "2-col",
  fontSize: "small",
  theme: "monochrome",
  showLineNumbers: true,
  notesStyle: "text",
  pageBreakPerTemplate: false,
  customTitle: "ICPC Team Reference Document",
  teamName: "Informatics Template Lib",
  institution: "Competitive Programming Reference",
  showToc: true,
  showCodeHashes: true,
  compactCode: false,
  showPageNumbers: true,
};

interface PdfSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PdfSettings;
  onSaveSettings: (newSettings: PdfSettings) => void;
}

export function PdfSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSaveSettings,
}: PdfSettingsDialogProps) {
  const handleChange = <K extends keyof PdfSettings>(
    key: K,
    value: PdfSettings[K]
  ) => {
    onSaveSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-primary/40 bg-[#06141B]/95 p-4 sm:p-8 font-mono max-w-[calc(100vw-2rem)] sm:max-w-2xl lg:max-w-3xl w-full shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_var(--primary-glow-weak)] backdrop-blur-2xl rounded-none text-foreground">
        {/* Header */}
        <DialogHeader className="border-b border-border/60 pb-3 sm:pb-4 pr-6 sm:pr-8">
          <div className="flex items-start sm:items-center justify-between">
            <div className="flex items-start sm:items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-none border border-primary/40 bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_15px_var(--primary-glow-weak)] shrink-0 mt-0.5 sm:mt-0">
                <Sliders className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xs sm:text-base font-extrabold uppercase tracking-wider text-primary flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span>ICPC TRD PDF Export & Layout Settings</span>
                  <span className="text-[9px] px-1.5 py-0.5 border border-primary/40 bg-primary/15 text-primary font-bold uppercase shrink-0">
                    PRO FORMATTER
                  </span>
                </DialogTitle>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                  Configure Team Reference booklet layout, column density, typography, and KACTL code hashes.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 pt-3 sm:pt-4 text-xs max-h-[75vh] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
          {/* Section 1: Document Identification */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-extrabold text-primary tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Document Identification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-[#11212D]/80 p-3 sm:p-4 border border-border/80">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Document Title
                </label>
                <Input
                  type="text"
                  value={settings.customTitle}
                  onChange={(e) => handleChange("customTitle", e.target.value)}
                  placeholder="e.g. ICPC Team Reference"
                  className="font-mono text-xs bg-[#06141B] border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-none h-8 sm:h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Team Name / University
                </label>
                <Input
                  type="text"
                  value={settings.teamName}
                  onChange={(e) => handleChange("teamName", e.target.value)}
                  placeholder="e.g. Informatics Template Lib"
                  className="font-mono text-xs bg-[#06141B] border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-none h-8 sm:h-9"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Columns Layout */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-extrabold text-primary tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Column Layout Format</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => handleChange("layout", "1-col")}
                className={`p-3 sm:p-3.5 border text-left transition-all cursor-pointer flex flex-col justify-between rounded-none ${
                  settings.layout === "1-col"
                    ? "border-primary bg-primary/15 text-primary font-bold shadow-[0_0_20px_var(--primary-glow-weak)]"
                    : "border-border/70 hover:border-primary/50 bg-[#11212D]/50 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <Rows className="h-4 w-4 text-primary" />
                  {settings.layout === "1-col" && (
                    <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)]" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-xs text-foreground">1-Column</div>
                  <div className="text-[10px] opacity-70 mt-0.5 sm:mt-1">Full page width code blocks</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChange("layout", "2-col")}
                className={`p-3 sm:p-3.5 border text-left transition-all cursor-pointer flex flex-col justify-between rounded-none ${
                  settings.layout === "2-col"
                    ? "border-primary bg-primary/15 text-primary font-bold shadow-[0_0_20px_var(--primary-glow-weak)]"
                    : "border-border/70 hover:border-primary/50 bg-[#11212D]/50 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  {settings.layout === "2-col" && (
                    <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)]" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-xs text-foreground">2-Column (ICPC TRD)</div>
                  <div className="text-[10px] opacity-70 mt-0.5 sm:mt-1">Official 25-page contest booklet standard</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChange("layout", "3-col")}
                className={`p-3 sm:p-3.5 border text-left transition-all cursor-pointer flex flex-col justify-between rounded-none ${
                  settings.layout === "3-col"
                    ? "border-primary bg-primary/15 text-primary font-bold shadow-[0_0_20px_var(--primary-glow-weak)]"
                    : "border-border/70 hover:border-primary/50 bg-[#11212D]/50 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <Grid3X3 className="h-4 w-4 text-primary" />
                  {settings.layout === "3-col" && (
                    <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)]" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-xs text-foreground">3-Column</div>
                  <div className="text-[10px] opacity-70 mt-0.5 sm:mt-1">Ultra dense layout for maximum algorithms</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Typography & Code Font Size */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-extrabold text-primary tracking-wider flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              <span>Code Font Size</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {(["small", "medium", "large"] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleChange("fontSize", sz)}
                  className={`p-2.5 sm:p-3 border text-center font-bold uppercase transition-all cursor-pointer rounded-none ${
                    settings.fontSize === sz
                      ? "border-primary bg-primary/15 text-primary font-bold shadow-[0_0_15px_var(--primary-glow-weak)]"
                      : "border-border/70 hover:border-primary/50 bg-[#11212D]/50 text-muted-foreground"
                  }`}
                >
                  <div className="text-xs font-extrabold text-foreground">{sz}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">
                    {sz === "small" ? "7.5pt (Ultra Dense)" : sz === "medium" ? "9pt (Balanced)" : "11pt (Large)"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Notes Box Mode */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-extrabold text-primary tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>Notes & Handwriting Options</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => handleChange("notesStyle", "text")}
                className={`p-2.5 sm:p-3 border text-center transition-all cursor-pointer rounded-none ${
                  settings.notesStyle === "text"
                    ? "border-primary bg-primary/15 text-primary font-bold shadow-[0_0_15px_var(--primary-glow-weak)]"
                    : "border-border/70 hover:border-primary/50 bg-[#11212D]/50 text-muted-foreground"
                }`}
              >
                <div className="font-extrabold text-xs text-foreground">Typed Notes</div>
                <div className="text-[10px] opacity-70 mt-0.5">Render custom typed notes</div>
              </button>

              <button
                type="button"
                onClick={() => handleChange("notesStyle", "lines")}
                className={`p-2.5 sm:p-3 border text-center transition-all cursor-pointer rounded-none ${
                  settings.notesStyle === "lines"
                    ? "border-primary bg-primary/15 text-primary font-bold shadow-[0_0_15px_var(--primary-glow-weak)]"
                    : "border-border/70 hover:border-primary/50 bg-[#11212D]/50 text-muted-foreground"
                }`}
              >
                <div className="font-extrabold text-xs text-foreground">Blank Lined Box</div>
                <div className="text-[10px] opacity-70 mt-0.5">For handwriting after printing</div>
              </button>

              <button
                type="button"
                onClick={() => handleChange("notesStyle", "none")}
                className={`p-2.5 sm:p-3 border text-center transition-all cursor-pointer rounded-none ${
                  settings.notesStyle === "none"
                    ? "border-primary bg-primary/15 text-primary font-bold shadow-[0_0_15px_var(--primary-glow-weak)]"
                    : "border-border/70 hover:border-primary/50 bg-[#11212D]/50 text-muted-foreground"
                }`}
              >
                <div className="font-extrabold text-xs text-foreground">Hide Notes</div>
                <div className="text-[10px] opacity-70 mt-0.5">Compact code-only view</div>
              </button>
            </div>
          </div>

          {/* Section 5: Custom Toggle Switches Grid */}
          <div className="space-y-2 pt-2 sm:pt-3 border-t border-border/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 bg-[#11212D]/80 p-3 sm:p-4 border border-border/80">
              {/* Table of Contents Toggle */}
              <label className="flex items-center justify-between cursor-pointer p-2 border border-border/60 hover:border-primary/50 bg-[#06141B]/70 transition-all">
                <span className="flex items-center gap-2 font-bold text-foreground text-xs">
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <span>Table of Contents (TOC) Page</span>
                </span>
                <div className="relative inline-flex items-center shrink-0 ml-2">
                  <input
                    type="checkbox"
                    checked={settings.showToc}
                    onChange={(e) => handleChange("showToc", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#253745] peer-focus:outline-none border border-[#4A5C6A] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#253745] after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:border-primary" />
                </div>
              </label>

              {/* KACTL Code Hashes Toggle */}
              <label className="flex items-center justify-between cursor-pointer p-2 border border-border/60 hover:border-primary/50 bg-[#06141B]/70 transition-all">
                <span className="flex items-center gap-2 font-bold text-foreground text-xs">
                  <Hash className="h-4 w-4 text-primary shrink-0" />
                  <span>KACTL Verification Hashes</span>
                </span>
                <div className="relative inline-flex items-center shrink-0 ml-2">
                  <input
                    type="checkbox"
                    checked={settings.showCodeHashes}
                    onChange={(e) => handleChange("showCodeHashes", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#253745] peer-focus:outline-none border border-[#4A5C6A] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#253745] after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:border-primary" />
                </div>
              </label>

              {/* Code Line Numbers Toggle */}
              <label className="flex items-center justify-between cursor-pointer p-2 border border-border/60 hover:border-primary/50 bg-[#06141B]/70 transition-all">
                <span className="flex items-center gap-2 font-bold text-foreground text-xs">
                  <FileCode2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Code Line Numbers</span>
                </span>
                <div className="relative inline-flex items-center shrink-0 ml-2">
                  <input
                    type="checkbox"
                    checked={settings.showLineNumbers}
                    onChange={(e) => handleChange("showLineNumbers", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#253745] peer-focus:outline-none border border-[#4A5C6A] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#253745] after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:border-primary" />
                </div>
              </label>

              {/* Page Break Per Section Toggle */}
              <label className="flex items-center justify-between cursor-pointer p-2 border border-border/60 hover:border-primary/50 bg-[#06141B]/70 transition-all">
                <span className="flex items-center gap-2 font-bold text-foreground text-xs">
                  <Layers className="h-4 w-4 text-primary shrink-0" />
                  <span>Page Break Per Section</span>
                </span>
                <div className="relative inline-flex items-center shrink-0 ml-2">
                  <input
                    type="checkbox"
                    checked={settings.pageBreakPerTemplate}
                    onChange={(e) => handleChange("pageBreakPerTemplate", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#253745] peer-focus:outline-none border border-[#4A5C6A] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#253745] after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:border-primary" />
                </div>
              </label>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-end pt-3 sm:pt-4 border-t border-border/60">
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="font-mono text-xs font-extrabold uppercase bg-primary text-primary-foreground hover:bg-primary/90 px-6 sm:px-7 py-2.5 sm:py-3 shadow-[0_0_20px_var(--primary-glow-weak)] hover:shadow-[0_0_30px_var(--primary-glow)] transition-all cursor-pointer rounded-none border-none w-full sm:w-auto"
            >
              <Check className="h-4 w-4 mr-2 stroke-[3]" />
              <span>Apply Settings</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
