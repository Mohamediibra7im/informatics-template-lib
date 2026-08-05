"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { useTerminalTheme } from "./theme-provider";
import { toast } from "sonner";
import {
  Terminal,
  Bookmark,
  CheckCircle,
  Edit3,
  Save,
  Check,
  ChevronDown,
  BookOpen,
  Award,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeEditor } from "./forms/code-editor";
import { formatCode } from "@/lib/format-code";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TemplatePersonalizationProps {
  templateId: number;
  templateTitle: string;
  templateSlug: string;
  defaultCode: string;
  language: string;
  onCodeChange?: (code: string, isCustom: boolean) => void;
}

interface CollectionSummary {
  id: number;
  name: string;
}

export function TemplatePersonalization({
  templateId,
  templateSlug,
  defaultCode,
  language,
  onCodeChange,
}: TemplatePersonalizationProps) {
  const { user } = useAuth();
  const { playClick, playSuccess } = useTerminalTheme();

  const [status, setStatus] = useState<string | null>(null);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [inCollections, setInCollections] = useState<number[]>([]); // Array of collection IDs this template belongs to
  const [customCode, setCustomCode] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorValue, setEditorValue] = useState("");
  const [isCustomActive, setIsCustomActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formatting, setFormatting] = useState(false);

  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewCollection, setShowNewCollection] = useState(false);

  // Fetch all user personalization state for this template
  const fetchPersonalData = useCallback(async () => {
    if (!user) return;
    try {
      const [progRes, templRes, collRes] = await Promise.all([
        fetch("/api/users/progress"),
        fetch("/api/users/templates"),
        fetch("/api/users/collections"),
      ]);

      if (progRes.ok) {
        const d = await progRes.json();
        const foundProg = d.progress?.find((p: { templateId: number; status: string }) => p.templateId === templateId);
        if (foundProg) setStatus(foundProg.status);
      }

      if (templRes.ok) {
        const d = await templRes.json();
        const foundTempl = d.templates?.find((t: { templateId: number; customCode: string }) => t.templateId === templateId);
        if (foundTempl) {
          setCustomCode(foundTempl.customCode);
          setEditorValue(foundTempl.customCode);
          setIsCustomActive(true);
        } else {
          setCustomCode(null);
          setEditorValue(defaultCode);
          setIsCustomActive(false);
        }
      }

      if (collRes.ok) {
        const d = await collRes.json();
        setCollections(d.collections || []);

        // Check which collections this template is in
        const membershipChecks = await Promise.all(
          (d.collections || []).map(async (c: CollectionSummary) => {
            const itemsRes = await fetch(`/api/users/collections/${c.id}/items`);
            if (itemsRes.ok) {
              const itemsData = await itemsRes.json();
              const hasItem = itemsData.items?.some((i: { templateId: number }) => i.templateId === templateId);
              return hasItem ? c.id : null;
            }
            return null;
          })
        );
        setInCollections(membershipChecks.filter(Boolean) as number[]);
      }
    } catch {
      // Fail silently or log
    }
  }, [user, templateId, defaultCode]);

  useEffect(() => {
    if (user) {
      // Load personalization state when the user is present; setState inside is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchPersonalData();
    }
  }, [user, fetchPersonalData]);

  // Synchronize active code with parent container
  useEffect(() => {
    onCodeChange?.(isCustomActive ? customCode || defaultCode : defaultCode, isCustomActive);
  }, [isCustomActive, customCode, defaultCode, onCodeChange]);

  const handleStatusChange = async (newStatus: string) => {
    playClick();
    try {
      const res = await fetch("/api/users/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        playSuccess();
        toast.success(`Progress set to ${newStatus.toUpperCase()}`);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleToggleCollection = async (collectionId: number) => {
    playClick();
    const isIn = inCollections.includes(collectionId);
    const url = `/api/users/collections/${collectionId}/items`;
    const method = isIn ? "DELETE" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (res.ok) {
        if (isIn) {
          setInCollections(inCollections.filter((id) => id !== collectionId));
          toast.success("Removed from collection");
        } else {
          setInCollections([...inCollections, collectionId]);
          playSuccess();
          toast.success("Added to collection");
        }
      }
    } catch {
      toast.error("Failed to update collection");
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      const res = await fetch("/api/users/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        setCollections([...collections, d.collection]);
        setNewCollectionName("");
        setShowNewCollection(false);
        // Automatically add to this new collection
        handleToggleCollection(d.collection.id);
      }
    } catch {
      toast.error("Failed to create collection");
    }
  };

  const handleSaveCustomCode = async () => {
    setLoading(true);
    playClick();
    try {
      const res = await fetch("/api/users/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, customCode: editorValue, language }),
      });
      if (res.ok) {
        setCustomCode(editorValue);
        setIsCustomActive(true);
        setIsEditing(false);
        onCodeChange?.(editorValue, true);
        playSuccess();
        toast.success("Custom template saved");
      }
    } catch {
      toast.error("Failed to save custom template");
    } finally {
      setLoading(false);
    }
  };

  const handleFormat = async () => {
    playClick();
    setFormatting(true);
    try {
      setEditorValue(await formatCode(editorValue, language));
    } finally {
      setFormatting(false);
    }
  };

  const handleToggleCodeSource = (toCustom: boolean) => {
    playClick();
    setIsCustomActive(toCustom);
    onCodeChange?.(toCustom ? customCode || defaultCode : defaultCode, toCustom);
  };

  if (!user) {
    return (
      <div className="border border-border/40 bg-card/20 p-4 mb-6 font-mono text-[11px] text-muted-foreground/50 flex justify-between items-center">
        <span>Log in to track progress, save custom versions, and organize into collections.</span>
        <Link
          href={`/login?redirect=/template/${templateSlug}`}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-7 px-2.5 text-[0.8rem] text-[10px] uppercase font-mono transition-colors"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-primary/20 bg-card/45 backdrop-blur-md p-4 mb-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status Tracker */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">Progress:</span>
          <div className="flex gap-1">
            {[
              { id: "learning", label: "Learning", icon: <BookOpen className="h-3 w-3" />, activeClass: "border-blue-400/30 bg-blue-400/10 text-blue-400" },
              { id: "implemented", label: "Implemented", icon: <CheckCircle className="h-3 w-3" />, activeClass: "border-warning/30 bg-warning/10 text-warning" },
              { id: "mastered", label: "Mastered", icon: <Award className="h-3 w-3" />, activeClass: "border-success/30 bg-success/10 text-success" },
            ].map((s) => {
              const active = status === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleStatusChange(s.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 border text-[9px] uppercase transition-all ${
                    active
                      ? s.activeClass
                      : "border-border/60 bg-card/20 text-muted-foreground/40 hover:text-foreground"
                  }`}
                >
                  {s.icon}
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collection Selector & Custom Version Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Collection Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  onClick={playClick}
                  className="flex items-center gap-1.5 px-3 py-1 border border-border/80 bg-card/30 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-all"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Collections ({inCollections.length})</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              }
            />
            <DropdownMenuContent className="w-56 font-mono text-xs border border-border bg-popover/95 backdrop-blur-md">
              <div className="px-2 py-1.5 border-b border-border/40 text-[9px] text-muted-foreground/40 uppercase tracking-widest font-bold">
                Select collections
              </div>
              {collections.map((c) => {
                const checked = inCollections.includes(c.id);
                return (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => handleToggleCollection(c.id)}
                    className="flex items-center justify-between cursor-pointer focus:bg-primary/5 focus:text-primary"
                  >
                    <span>{c.name}</span>
                    {checked && <Check className="h-3.5 w-3.5 text-success" />}
                  </DropdownMenuItem>
                );
              })}

              {!showNewCollection ? (
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    playClick();
                    setShowNewCollection(true);
                  }}
                  className="w-full text-left px-2 py-1.5 border-t border-border/30 hover:bg-primary/5 hover:text-primary text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Collection
                </button>
              ) : (
                <div className="p-2 border-t border-border/30 space-y-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <Input
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Collection name"
                    className="h-7 text-[11px] font-mono"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" className="h-6 text-[9px] px-2" onClick={handleCreateCollection}>
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"

                      className="h-6 text-[9px] px-2"
                      onClick={() => setShowNewCollection(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Custom Version Toggles */}
          {customCode !== null && (
            <div className="flex gap-0.5 border border-border bg-muted/10 p-0.5 rounded-none">
              <button
                onClick={() => handleToggleCodeSource(false)}
                className={`px-2.5 py-1 text-[9px] uppercase font-bold transition-all ${
                  !isCustomActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground/45 hover:text-foreground"
                }`}
              >
                Original
              </button>
              <button
                onClick={() => handleToggleCodeSource(true)}
                className={`px-2.5 py-1 text-[9px] uppercase font-bold transition-all ${
                  isCustomActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground/45 hover:text-foreground"
                }`}
              >
                Custom
              </button>
            </div>
          )}

          {/* Edit Custom Code Button */}
          {!isEditing ? (
            <Button
              onClick={() => {
                playClick();
                setIsEditing(true);
              }}
              size="sm"
              variant="outline"
              className="text-[10px] uppercase font-mono h-7"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              {customCode !== null ? "Edit Custom" : "Customize"}
            </Button>
          ) : (
            <Button
              onClick={handleSaveCustomCode}
              disabled={loading}
              size="sm"
              className="text-[10px] uppercase font-mono h-7"
            >
              {loading ? <Terminal className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Code Editor Panel */}
      {isEditing && (
        <div className="mt-4 border border-primary/10 bg-background/40">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-primary/10 bg-primary/5 text-[9px] text-muted-foreground/40 font-bold uppercase select-none">
            <span>Editor: customize_{templateSlug}.cpp</span>
            <div className="flex gap-2">
              <button
                onClick={handleFormat}
                disabled={formatting}
                className="text-primary hover:underline disabled:opacity-40"
              >
                {formatting ? "[FORMATTING…]" : "[FORMAT]"}
              </button>
              <button onClick={handleSaveCustomCode} className="text-success hover:underline">
                [SAVE]
              </button>
              <button
                onClick={() => {
                  playClick();
                  setIsEditing(false);
                }}
                className="text-destructive hover:underline"
              >
                [CANCEL]
              </button>
            </div>
          </div>
          <CodeEditor
            value={editorValue}
            language={language}
            onChange={setEditorValue}
            height={420}
          />
        </div>
      )}
    </div>
  );
}
