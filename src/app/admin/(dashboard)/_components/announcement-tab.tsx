"use client";

import { useState, useEffect } from "react";
import {
  Radio,
  Save,
  Loader2,
  Megaphone,
  ArrowRight,
  Eye,
  ShieldCheck,
  Terminal,
  Activity,
  Plus,
  Trash2,
  Edit3,
  Check,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTerminalTheme } from "@/components/theme-provider";

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  linkText?: string;
  enabled: boolean;
  createdAt: number;
}

export function AnnouncementTab() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [linkText, setLinkText] = useState("");
  const [enabled, setEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { playClick, playSuccess, playBeep } = useTerminalTheme();

  const stripEmojis = (str: string) =>
    (str || "")
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .trim();

  // Load announcements from settings API
  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          let list: AnnouncementItem[] = [];

          if (data.site_announcements) {
            try {
              list = JSON.parse(data.site_announcements);
            } catch (e) {
              console.error("Failed to parse site_announcements JSON", e);
            }
          }

          // Legacy single fallback if no array list exists yet
          if (list.length === 0 && data.announcement_title) {
            list = [
              {
                id: data.announcement_id || `ann_${Date.now()}`,
                title: stripEmojis(data.announcement_title),
                message: stripEmojis(data.announcement_message || ""),
                link: data.announcement_link || "",
                linkText: stripEmojis(data.announcement_link_text || "EXPLORE FEATURE"),
                enabled: data.announcement_enabled === "true",
                createdAt: Date.now(),
              },
            ];
          }

          setAnnouncements(list);

          if (list.length > 0) {
            selectForEdit(list[0]);
          } else {
            resetForm();
          }
        }
      } catch (err) {
        console.error("Failed to load announcements:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  const selectForEdit = (item: AnnouncementItem) => {
    setSelectedId(item.id);
    setTitle(item.title);
    setMessage(item.message);
    setLink(item.link || "");
    setLinkText(item.linkText || "");
    setEnabled(item.enabled);
  };

  const resetForm = () => {
    setSelectedId(null);
    setTitle("NEW FEATURE: ICPC CONTEST REFERENCE BOOKLET GENERATOR");
    setMessage(
      "You can now customize, reorder, and export 2-column or 3-column contest reference booklets directly in ITL! Visit the /docs page for complete guidelines on formatting your booklet."
    );
    setLink("/editor");
    setLinkText("OPEN REFERENCE EDITOR");
    setEnabled(true);
  };

  const saveAnnouncementsList = async (updatedList: AnnouncementItem[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_announcements: JSON.stringify(updatedList),
        }),
      });

      if (res.ok) {
        playSuccess();
        setAnnouncements(updatedList);
        toast.success("Announcements database updated successfully!");
      } else {
        toast.error("Failed to save announcements to server.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error communicating with settings API.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveForm = async () => {
    playClick();
    const cleanTitle = stripEmojis(title);
    const cleanMessage = stripEmojis(message);
    const cleanLinkText = stripEmojis(linkText);

    if (!cleanTitle || !cleanMessage) {
      toast.error("Announcement title and message content are required.");
      return;
    }

    let newList: AnnouncementItem[];

    if (selectedId) {
      // Update existing item
      newList = announcements.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              title: cleanTitle,
              message: cleanMessage,
              link: link.trim(),
              linkText: cleanLinkText,
              enabled,
            }
          : item
      );
    } else {
      // Create new announcement
      const newItem: AnnouncementItem = {
        id: `ann_${Date.now()}`,
        title: cleanTitle,
        message: cleanMessage,
        link: link.trim(),
        linkText: cleanLinkText,
        enabled,
        createdAt: Date.now(),
      };
      newList = [newItem, ...announcements];
      setSelectedId(newItem.id);
    }

    await saveAnnouncementsList(newList);
  };

  const handleToggleItem = async (id: string, currentStatus: boolean) => {
    playClick();
    const newList = announcements.map((item) =>
      item.id === id ? { ...item, enabled: !currentStatus } : item
    );
    if (selectedId === id) {
      setEnabled(!currentStatus);
    }
    await saveAnnouncementsList(newList);
  };

  const handleDeleteItem = async (id: string) => {
    playBeep(330, 0.25);
    const newList = announcements.filter((item) => item.id !== id);
    if (selectedId === id) {
      if (newList.length > 0) selectForEdit(newList[0]);
      else resetForm();
    }
    await saveAnnouncementsList(newList);
  };

  const activeCount = announcements.filter((a) => a.enabled).length;

  return (
    <div className="space-y-6 font-mono select-text">
      {/* Top Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/20 pb-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground/60 flex items-center gap-1.5 font-bold">
            <span className="text-primary font-bold">$</span>
            <span>broadcast --manage --multi-announcements</span>
          </div>
          <h2 className="text-sm sm:text-base font-black uppercase text-foreground tracking-wider flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <span>ANNOUNCEMENTS BROADCAST SYSTEM</span>
          </h2>
        </div>

        {/* Global Stats Counter */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 bg-[#11212D]/90 p-2.5 border border-border/80 text-xs font-mono w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span className="text-muted-foreground font-bold uppercase text-[11px] sm:text-xs">TOTAL:</span>
              <strong className="text-foreground font-black text-xs">{announcements.length}</strong>
            </div>
            <span className="text-border/60 hidden xs:inline">|</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-muted-foreground font-bold uppercase text-[11px] sm:text-xs">BROADCASTING:</span>
              <span
                className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 border ${
                  activeCount > 0
                    ? "border-primary bg-primary/20 text-primary shadow-[0_0_10px_var(--primary-glow-weak)]"
                    : "border-destructive/60 bg-destructive/15 text-destructive"
                }`}
              >
                {activeCount} ACTIVE
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              playClick();
              resetForm();
            }}
            className="font-mono text-[10px] font-bold uppercase bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 rounded-none h-7 px-2.5 cursor-pointer shrink-0 ml-auto sm:ml-0"
          >
            <Plus className="h-3 w-3 mr-1" />
            <span>NEW ANNOUNCEMENT</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground/45 text-xs font-mono animate-pulse">
          $ get_announcements --status
          <br />
          [LOAD] Loading announcements database...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Announcement Manager Table */}
          <div className="border border-border bg-card/25 overflow-x-auto max-w-full select-text custom-scrollbar">
            <table className="w-full text-[11px] text-left border-collapse min-w-[550px] sm:min-w-[650px]">
              <thead>
                <tr className="border-b border-primary/20 bg-primary/5 text-primary/60 font-bold uppercase tracking-wider select-none text-[10px]">
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Announcement Title</th>
                  <th className="py-2.5 px-3">Target Action Link</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground/40 italic">
                      No announcements found. Click [+ NEW ANNOUNCEMENT] to create your first broadcast message.
                    </td>
                  </tr>
                ) : (
                  announcements.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-primary/[0.04] transition-colors leading-relaxed ${
                        selectedId === item.id ? "bg-primary/[0.06] border-l-2 border-primary" : ""
                      }`}
                    >
                      <td className="py-3 px-3 select-none">
                        <button
                          onClick={() => handleToggleItem(item.id, item.enabled)}
                          className={`text-[9px] font-black px-2 py-0.5 border cursor-pointer flex items-center gap-1 transition-all ${
                            item.enabled
                              ? "border-primary bg-primary/15 text-primary shadow-[0_0_8px_var(--primary-glow-ultra-weak)]"
                              : "border-destructive/50 bg-destructive/10 text-destructive opacity-75"
                          }`}
                        >
                          <Power className="h-2.5 w-2.5" />
                          <span>{item.enabled ? "ACTIVE" : "DISABLED"}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3 font-bold text-foreground">
                        <div className="truncate max-w-[140px] xs:max-w-[220px] sm:max-w-md">{item.title}</div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground font-mono">
                        {item.link || <span className="opacity-40">None</span>}
                      </td>
                      <td className="py-3 px-3 text-right select-none space-x-2">
                        <button
                          onClick={() => selectForEdit(item)}
                          className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer border border-transparent hover:border-primary/20 px-2 py-0.5"
                        >
                          <Edit3 className="h-3 w-3 inline mr-1" />
                          [edit]
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer border border-transparent hover:border-destructive/20 px-2 py-0.5"
                        >
                          <Trash2 className="h-3 w-3 inline mr-1" />
                          [delete]
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Form Editor & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Editor Card */}
            <div className="space-y-4 bg-card/30 p-4 sm:p-5 border border-border/80">
              <div className="text-xs font-extrabold uppercase text-primary tracking-wider flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                <span className="flex items-center gap-1.5 min-w-0">
                  <Radio className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{selectedId ? "EDIT ANNOUNCEMENT RECORD" : "CREATE NEW ANNOUNCEMENT RECORD"}</span>
                </span>
                {selectedId && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 border border-primary/30 text-primary shrink-0">
                    ID: {selectedId}
                  </span>
                )}
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  ANNOUNCEMENT TITLE
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. NEW FEATURE: ICPC CONTEST REFERENCE BOOKLET GENERATOR"
                  className="font-mono text-xs bg-[#06141B] border-border text-foreground h-9 rounded-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                />
              </div>

              {/* Details Textarea */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  ANNOUNCEMENT DETAILS / MESSAGE
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write clear description explaining the new feature release and helpful guidance..."
                  className="w-full font-mono text-xs bg-[#06141B] border border-border text-foreground p-3 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none rounded-none resize-y"
                />
              </div>

              {/* CTA Link & Link Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    ACTION LINK URL
                  </label>
                  <Input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="e.g. /editor or /docs"
                    className="font-mono text-xs bg-[#06141B] border-border text-foreground h-9 rounded-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    ACTION BUTTON LABEL
                  </label>
                  <Input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="e.g. OPEN REFERENCE EDITOR"
                    className="font-mono text-xs bg-[#06141B] border-border text-foreground h-9 rounded-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Status Toggle & Save Action */}
              <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#253745] peer-focus:outline-none border border-[#4A5C6A] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#253745] after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:border-primary shrink-0" />
                  <span className="text-xs font-bold text-foreground uppercase">
                    Broadcast Status: {enabled ? "Active" : "Disabled"}
                  </span>
                </label>

                <Button
                  onClick={handleSaveForm}
                  disabled={saving}
                  className="w-full sm:w-auto font-mono text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 shadow-[0_0_15px_var(--primary-glow-weak)] hover:shadow-[0_0_25px_var(--primary-glow)] rounded-none cursor-pointer border-none transition-all flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      <span>SAVING...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      <span>{selectedId ? "SAVE CHANGES" : "CREATE ANNOUNCEMENT"}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Live Preview Window */}
            <div className="space-y-3">
              <div className="text-xs font-extrabold uppercase text-primary tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  <span>LIVE USER POPUP PREVIEW</span>
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  MOCKUP VIEW
                </span>
              </div>

              {/* Mocked Popup Window */}
              <div className="border-2 border-primary/50 bg-[#06141B]/95 p-4 sm:p-5 font-mono shadow-[0_0_40px_var(--primary-glow-ultra-weak)] relative text-foreground rounded-none">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 border-b border-primary/20 pb-2 mb-3">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Terminal className="h-3 w-3 text-primary" />
                    <span>[ SYSTEM_BROADCAST // REF: 0x1 ]</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>LIVE</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-b border-border/40 pb-3 mb-3">
                  <div className="h-8 w-8 rounded-none border border-primary/60 bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_12px_var(--primary-glow-weak)] shrink-0">
                    <Radio className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 border border-primary/40 bg-primary/15 text-primary tracking-widest">
                        SYSTEM ANNOUNCEMENT
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground leading-snug break-words">
                      {stripEmojis(title) || "UNTITLED ANNOUNCEMENT"}
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="border-l-2 border-primary/70 bg-[#0B1B24]/90 p-3.5 border border-border/80 text-muted-foreground/90 leading-relaxed font-mono whitespace-pre-wrap text-[11px] sm:text-xs min-h-[80px]">
                    {stripEmojis(message) || "No announcement details entered."}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-border/40">
                    {link && (
                      <Button
                        size="sm"
                        className="w-full sm:w-auto font-mono text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground pointer-events-none px-4 h-9 shadow-[0_0_15px_var(--primary-glow-weak)] rounded-none border border-primary flex items-center justify-center"
                      >
                        <span>{stripEmojis(linkText) || "EXPLORE FEATURE"}</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto font-mono text-xs font-bold uppercase tracking-wider border border-border text-muted-foreground pointer-events-none h-9 px-4 rounded-none flex items-center justify-center"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                      <span>ACKNOWLEDGE</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
