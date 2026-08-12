"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, ArrowRight, ShieldCheck, Terminal, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTerminalTheme } from "./theme-provider";

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  linkText?: string;
  enabled: boolean;
  createdAt: number;
}

export function AnnouncementPopup() {
  const [activeAnnouncements, setActiveAnnouncements] = useState<AnnouncementItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { playClick, playSuccess } = useTerminalTheme();

  useEffect(() => {
    async function checkAnnouncements() {
      try {
        const res = await fetch("/api/announcement");
        if (!res.ok) return;
        const data = await res.json();
        const announcements: AnnouncementItem[] = data.announcements || [];

        if (announcements.length > 0) {
          let dismissedIds: string[] = [];
          try {
            const raw = localStorage.getItem("itl_dismissed_announcements");
            if (raw) dismissedIds = JSON.parse(raw);
          } catch {
            const singleLegacy = localStorage.getItem("itl_dismissed_announcement_id");
            if (singleLegacy) dismissedIds = [singleLegacy];
          }

          const unDismissed = announcements.filter((a) => !dismissedIds.includes(a.id));

          if (unDismissed.length > 0) {
            setActiveAnnouncements(unDismissed);
            setCurrentIndex(0);
            setTimeout(() => {
              setIsOpen(true);
            }, 600);
          }
        }
      } catch (err) {
        console.error("Failed to check announcements:", err);
      }
    }

    checkAnnouncements();
  }, []);

  const markDismissed = (id: string) => {
    try {
      let dismissedIds: string[] = [];
      const raw = localStorage.getItem("itl_dismissed_announcements");
      if (raw) dismissedIds = JSON.parse(raw);
      if (!dismissedIds.includes(id)) {
        dismissedIds.push(id);
      }
      localStorage.setItem("itl_dismissed_announcements", JSON.stringify(dismissedIds));
    } catch (e) {
      console.error(e);
    }
  };

  const currentItem = activeAnnouncements[currentIndex];

  const handleDismissCurrent = () => {
    playClick();
    if (!currentItem) return;

    markDismissed(currentItem.id);

    if (currentIndex < activeAnnouncements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handleCtaClick = () => {
    playSuccess();
    if (!currentItem) return;

    markDismissed(currentItem.id);

    if (currentIndex < activeAnnouncements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsOpen(false);
    }
  };

  if (!currentItem || !isOpen) return null;

  const cleanTitle = currentItem.title
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .trim();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismissCurrent()}>
      <DialogContent className="border-2 border-primary/50 bg-[#06141B]/95 p-3.5 sm:p-6 font-mono max-w-[calc(100vw-1.5rem)] sm:max-w-xl w-full shadow-[0_0_60px_var(--primary-glow-weak),0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-foreground rounded-none z-50 overflow-hidden">
        {/* Terminal Header Decoration Bar */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 border-b border-primary/20 pb-2 mb-3 pr-7 sm:pr-8">
          <div className="flex items-center gap-1.5 font-bold">
            <Terminal className="h-3 w-3 text-primary" />
            <span>[ SYSTEM_BROADCAST // REF: 0x{currentIndex + 1} ]</span>
          </div>
          <div className="flex items-center gap-2">
            {activeAnnouncements.length > 1 && (
              <span className="text-[9px] font-mono text-primary font-bold bg-primary/10 border border-primary/30 px-1.5 py-0.2">
                {currentIndex + 1} OF {activeAnnouncements.length}
              </span>
            )}
            <div className="flex items-center gap-1 text-primary font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE</span>
            </div>
          </div>
        </div>

        {/* Dialog Main Title Section */}
        <DialogHeader className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-none border border-primary/60 bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_15px_var(--primary-glow-weak)] shrink-0 mt-0.5">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 border border-primary/40 bg-primary/15 text-primary tracking-widest select-none">
                  SYSTEM ANNOUNCEMENT
                </span>
              </div>
              <DialogTitle className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground leading-snug break-words">
                {cleanTitle}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Body Message */}
        <div className="space-y-4 pt-2 text-xs">
          <div className="border-l-2 border-primary/70 bg-[#0B1B24]/90 p-3.5 border border-border/80 text-muted-foreground/90 leading-relaxed font-mono whitespace-pre-wrap text-[11px] sm:text-xs shadow-inner max-h-60 overflow-y-auto custom-scrollbar">
            {currentItem.message}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border/40">
            {currentItem.link && (
              <Link href={currentItem.link} className="w-full sm:w-auto" onClick={handleCtaClick}>
                <Button
                  size="sm"
                  className="w-full font-mono text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 shadow-[0_0_15px_var(--primary-glow-weak)] hover:shadow-[0_0_25px_var(--primary-glow)] rounded-none cursor-pointer border border-primary transition-all flex items-center justify-center"
                >
                  <span>{currentItem.linkText || "EXPLORE FEATURE"}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleDismissCurrent}
              className="w-full sm:w-auto font-mono text-xs font-bold uppercase tracking-wider border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground h-9 px-4 rounded-none cursor-pointer transition-colors flex items-center justify-center"
            >
              {currentIndex < activeAnnouncements.length - 1 ? (
                <>
                  <span>NEXT</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                  <span>ACKNOWLEDGE</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
