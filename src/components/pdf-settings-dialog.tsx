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
      <DialogContent className="border border-primary/30 bg-card p-6 sm:p-8 font-mono max-w-2xl sm:max-w-3xl w-full shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <DialogHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              ICPC TRD PDF Export & Layout Settings
            </DialogTitle>
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            Configure Team Reference booklet layout, column density, typography, and KACTL verification hashes.
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-4 text-xs max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* Section 1: Document Metadata */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold text-primary/80 tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Document Identification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/10 p-3 border border-border/50">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground/80">
                  Document Title
                </label>
                <Input
                  type="text"
                  value={settings.customTitle}
                  onChange={(e) => handleChange("customTitle", e.target.value)}
                  placeholder="e.g. ICPC Team Reference"
                  className="font-mono text-xs bg-background/60 border-border focus:border-primary/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground/80">
                  Team Name / University
                </label>
                <Input
                  type="text"
                  value={settings.teamName}
                  onChange={(e) => handleChange("teamName", e.target.value)}
                  placeholder="e.g. Informatics Template Lib"
                  className="font-mono text-xs bg-background/60 border-border focus:border-primary/60"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Columns Layout */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold text-primary/80 tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Column Layout Format</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleChange("layout", "1-col")}
                className={`p-3 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  settings.layout === "1-col"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-[0_0_15px_var(--primary-glow-ultra-weak)]"
                    : "border-border/60 hover:border-primary/40 bg-background/30 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Rows className="h-4 w-4" />
                  {settings.layout === "1-col" && (
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-foreground">1-Column</div>
                  <div className="text-[10px] opacity-70 mt-0.5">Full page width code blocks</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChange("layout", "2-col")}
                className={`p-3 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  settings.layout === "2-col"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-[0_0_15px_var(--primary-glow-ultra-weak)]"
                    : "border-border/60 hover:border-primary/40 bg-background/30 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <LayoutGrid className="h-4 w-4" />
                  {settings.layout === "2-col" && (
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-foreground">2-Column (ICPC TRD)</div>
                  <div className="text-[10px] opacity-70 mt-0.5">Official 25-page contest booklet standard</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChange("layout", "3-col")}
                className={`p-3 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  settings.layout === "3-col"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-[0_0_15px_var(--primary-glow-ultra-weak)]"
                    : "border-border/60 hover:border-primary/40 bg-background/30 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Grid3X3 className="h-4 w-4" />
                  {settings.layout === "3-col" && (
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-foreground">3-Column</div>
                  <div className="text-[10px] opacity-70 mt-0.5">Ultra dense layout for maximum algorithms</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Color Theme & Typography */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Color Theme */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-primary/80 tracking-wider flex items-center gap-1.5">
                <Sun className="h-3.5 w-3.5" />
                <span>Color Theme</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange("theme", "monochrome")}
                  className={`p-2 border text-center transition-all cursor-pointer ${
                    settings.theme === "monochrome"
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border/60 hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 mx-auto mb-1" />
                  <span className="text-[10px]">Monochrome</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange("theme", "light")}
                  className={`p-2 border text-center transition-all cursor-pointer ${
                    settings.theme === "light"
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border/60 hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5 mx-auto mb-1" />
                  <span className="text-[10px]">Clean Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange("theme", "dark")}
                  className={`p-2 border text-center transition-all cursor-pointer ${
                    settings.theme === "dark"
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border/60 hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5 mx-auto mb-1" />
                  <span className="text-[10px]">Cyber Dark</span>
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-primary/80 tracking-wider flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5" />
                <span>Code Font Size</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["small", "medium", "large"] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleChange("fontSize", sz)}
                    className={`p-2 border text-center font-bold uppercase transition-all cursor-pointer ${
                      settings.fontSize === sz
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    <div className="text-xs">{sz}</div>
                    <div className="text-[9px] opacity-70">
                      {sz === "small" ? "7.5pt" : sz === "medium" ? "9pt" : "11pt"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Notes Box Mode */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold text-primary/80 tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>Notes & Handwriting Options</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleChange("notesStyle", "text")}
                className={`p-2.5 border text-center transition-all cursor-pointer ${
                  settings.notesStyle === "text"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border/60 hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <div className="font-bold text-xs">Typed Notes</div>
                <div className="text-[9px] opacity-70">Render custom typed notes</div>
              </button>

              <button
                type="button"
                onClick={() => handleChange("notesStyle", "lines")}
                className={`p-2.5 border text-center transition-all cursor-pointer ${
                  settings.notesStyle === "lines"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border/60 hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <div className="font-bold text-xs">Blank Lined Box</div>
                <div className="text-[9px] opacity-70">For handwriting after printing</div>
              </button>

              <button
                type="button"
                onClick={() => handleChange("notesStyle", "none")}
                className={`p-2.5 border text-center transition-all cursor-pointer ${
                  settings.notesStyle === "none"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border/60 hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <div className="font-bold text-xs">Hide Notes</div>
                <div className="text-[9px] opacity-70">Compact code-only view</div>
              </button>
            </div>
          </div>

          {/* Section 5: Toggles Grid */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/10 p-3 border border-border/40">
              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors">
                <span className="flex items-center gap-2 font-bold text-foreground text-xs">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  Table of Contents (TOC) Page
                </span>
                <input
                  type="checkbox"
                  checked={settings.showToc}
                  onChange={(e) => handleChange("showToc", e.target.checked)}
                  className="accent-primary h-4 w-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors">
                <span className="flex items-center gap-2 font-bold text-foreground text-xs">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                  KACTL Code Verification Hashes
                </span>
                <input
                  type="checkbox"
                  checked={settings.showCodeHashes}
                  onChange={(e) => handleChange("showCodeHashes", e.target.checked)}
                  className="accent-primary h-4 w-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-foreground text-xs font-bold">
                  Code Line Numbers
                </span>
                <input
                  type="checkbox"
                  checked={settings.showLineNumbers}
                  onChange={(e) => handleChange("showLineNumbers", e.target.checked)}
                  className="accent-primary h-4 w-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-foreground text-xs font-bold">
                  Page Break Per Section
                </span>
                <input
                  type="checkbox"
                  checked={settings.pageBreakPerTemplate}
                  onChange={(e) => handleChange("pageBreakPerTemplate", e.target.checked)}
                  className="accent-primary h-4 w-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-end pt-3 border-t border-border/40">
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="font-mono text-xs font-extrabold uppercase bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 shadow-[0_0_20px_var(--primary-glow-weak)] cursor-pointer"
            >
              <Check className="h-4 w-4 mr-2" />
              <span>Apply Settings</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
