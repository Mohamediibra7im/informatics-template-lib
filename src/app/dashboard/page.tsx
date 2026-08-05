"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useTerminalTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import {
  Terminal,
  LayoutDashboard,
  Library,
  FolderOpen,
  BarChart3,
  Settings,
  BookOpen,
  CheckCircle2,
  Award,
  Calendar,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  ChevronRight,
  RefreshCw,
  User,
  Activity,
  Search,
  Code,
  GitPullRequest,
  Heart,
  Pencil,
  ArrowLeft,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tab = "overview" | "templates" | "contributions" | "liked" | "collections" | "progress" | "settings";

interface ProgressItem {
  id: number;
  templateId: number;
  templateTitle: string;
  templateSlug: string;
  status: string;
  updatedAt: string;
}

interface UserTemplate {
  id: number;
  templateId: number;
  templateTitle: string;
  templateSlug: string;
  customCode: string;
  language: string;
  updatedAt: string;
}

interface Collection {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  itemCount: number;
}

interface CollectionItem {
  id: number;
  templateId: number;
  templateTitle: string;
  templateSlug: string;
  addedAt: string;
}

interface Contribution {
  id: number;
  type: string;
  status: string;
  title: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  templateId: number | null;
  templateTitle: string | null;
  templateSlug: string | null;
}

interface LikedTemplate {
  id: number;
  templateId: number;
  templateTitle: string;
  templateSlug: string;
  categoryName: string | null;
  likeCount: number;
  likedAt: string;
}

interface Profile {
  codeforcesHandle: string | null;
  atcoderHandle: string | null;
  leetcodeHandle: string | null;
  codechefHandle: string | null;
  ratingGoal: string | null;
  calendarToken: string | null;
  verificationToken: string | null;
}

interface PlatformStat {
  handle: string | null;
  rating: number | null;
  rank: string | null;
  solved: number | null;
  active: boolean;
}

interface HandlesStats {
  codeforces: PlatformStat;
  atcoder: PlatformStat;
  leetcode: PlatformStat;
  codechef: PlatformStat;
}

const getRatingStyle = (platform: string, rating: number | null) => {
  if (rating === null) return { color: "#71717a" }; // zinc-500
  switch (platform) {
    case "codeforces":
      if (rating < 1200) return { color: "#a1a1aa" }; // Newbie - Gray
      if (rating < 1400) return { color: "#22c55e" }; // Pupil - Green
      if (rating < 1600) return { color: "#06b6d4" }; // Specialist - Cyan
      if (rating < 1900) return { color: "#3b82f6" }; // Expert - Blue
      if (rating < 2100) return { color: "#d946ef" }; // Candidate Master - Purple/Fuchsia
      if (rating < 2400) return { color: "#f97316" }; // Master - Orange
      return { color: "#ef4444" }; // Grandmaster+ - Red
    case "atcoder":
      if (rating < 400) return { color: "#a1a1aa" }; // Gray
      if (rating < 800) return { color: "#b45309" }; // Brown
      if (rating < 1200) return { color: "#22c55e" }; // Green
      if (rating < 1600) return { color: "#06b6d4" }; // Cyan
      if (rating < 2000) return { color: "#3b82f6" }; // Blue
      if (rating < 2400) return { color: "#eab308" }; // Yellow
      if (rating < 2800) return { color: "#f97316" }; // Orange
      return { color: "#ef4444" }; // Red
    case "leetcode":
      if (rating >= 2190) return { color: "#f97316" }; // Guardian - Orange
      if (rating >= 1850) return { color: "#a78bfa" }; // Knight - Purple
      return { color: "#10b981" }; // Default Green
    case "codechef":
      if (rating < 1400) return { color: "#a1a1aa" }; // 1★
      if (rating < 1600) return { color: "#22c55e" }; // 2★
      if (rating < 1800) return { color: "#3b82f6" }; // 3★
      if (rating < 2000) return { color: "#d946ef" }; // 4★
      if (rating < 2200) return { color: "#eab308" }; // 5★
      if (rating < 2500) return { color: "#f97316" }; // 6★
      return { color: "#ef4444" }; // 7★
    default:
      return {};
  }
};

function DashboardContent() {
  const { user } = useAuth();
  const { playClick, playSuccess, playBeep } = useTerminalTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Search & Filter State
  const [templateSearch, setTemplateSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "mastered" | "implemented" | "learning">("all");

  // Data state
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [userContributions, setUserContributions] = useState<Contribution[]>([]);
  const [likedTemplates, setLikedTemplates] = useState<LikedTemplate[]>([]);
  const [unliking, setUnliking] = useState<number | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<HandlesStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings form
  const [cfHandle, setCfHandle] = useState("");
  const [acHandle, setAcHandle] = useState("");
  const [lcHandle, setLcHandle] = useState("");
  const [ccHandle, setCcHandle] = useState("");
  const [saving, setSaving] = useState(false);

  // Handle verification state
  const [verifyingPlatform, setVerifyingPlatform] = useState<string | null>(null);
  const [verifyInputVal, setVerifyInputVal] = useState("");
  const [isCheckingVerify, setIsCheckingVerify] = useState(false);

  // New collection form
  const [newCollName, setNewCollName] = useState("");
  const [newCollDesc, setNewCollDesc] = useState("");
  const [creatingColl, setCreatingColl] = useState(false);

  // Selected Collection & items state
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [loadingCollItems, setLoadingCollItems] = useState(false);

  // Edit Collection state
  const [editingCollId, setEditingCollId] = useState<number | null>(null);
  const [editCollName, setEditCollName] = useState("");
  const [editCollDesc, setEditCollDesc] = useState("");
  const [savingCollEdit, setSavingCollEdit] = useState(false);

  const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  // Decoupled background fetch for Codeforces stats (never blocks dashboard render)
  const fetchHandlesStats = useCallback(async (forceRefresh = false) => {
    try {
      const res = await fetch(`/api/users/handles-stats${forceRefresh ? "?refresh=true" : ""}`);
      if (res.ok) {
        const d = await res.json();
        setStats(d);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  // Fast initial fetch of local database items
  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const [progRes, templRes, collRes, contribRes, likesRes, profRes] = await Promise.all([
        fetch("/api/users/progress"),
        fetch("/api/users/templates"),
        fetch("/api/users/collections"),
        fetch("/api/users/contributions"),
        fetch("/api/users/likes"),
        fetch("/api/users/profiles"),
      ]);

      if (progRes.ok) {
        const d = await progRes.json();
        setProgress(d.progress || []);
      }
      if (templRes.ok) {
        const d = await templRes.json();
        setUserTemplates(d.templates || []);
      }
      if (collRes.ok) {
        const d = await collRes.json();
        setCollections(d.collections || []);
      }
      if (contribRes.ok) {
        const d = await contribRes.json();
        setUserContributions(d.contributions || []);
      }
      if (likesRes.ok) {
        const d = await likesRes.json();
        setLikedTemplates(d.liked || []);
      }
      if (profRes.ok) {
        const d = await profRes.json();
        if (d.profile) {
          setProfile(d.profile);
          setCfHandle(d.profile.codeforcesHandle || "");
          setAcHandle(d.profile.atcoderHandle || "");
          setLcHandle(d.profile.leetcodeHandle || "");
          setCcHandle(d.profile.codechefHandle || "");
        }
      }
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }

    // Trigger external stats fetch in background asynchronously
    fetchHandlesStats(forceRefresh);
  }, [fetchHandlesStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync active tab with URL query parameter ?tab=...
  useEffect(() => {
    const tabParam = searchParams.get("tab") as Tab | null;
    if (tabParam && ["overview", "templates", "contributions", "liked", "collections", "progress", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const changeTab = (tabId: Tab) => {
    playClick();
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codeforcesHandle: cfHandle,
          atcoderHandle: acHandle,
          leetcodeHandle: lcHandle,
          codechefHandle: ccHandle,
        }),
      });
      if (res.ok) {
        toast.success("Profile updated");
        playSuccess();
        fetchData(true);
      } else {
        toast.error("Failed to update profile");
        playBeep(220, 0.3);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const checkHandleVerification = async (platform: string, handle: string) => {
    if (!handle.trim()) return;
    setIsCheckingVerify(true);
    playClick();
    try {
      const res = await fetch("/api/users/profiles/verify-handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, handle }),
      });
      const data = await res.json();
      setIsCheckingVerify(false);
      if (res.ok && data.success) {
        toast.success(`${platform.toUpperCase()} handle verified successfully!`);
        playSuccess();
        setVerifyingPlatform(null);
        setVerifyInputVal("");
        fetchData(true);
      } else {
        toast.error(data.error || "Verification failed. Please ensure the token is set on your profile.");
        playBeep(220, 0.4);
      }
    } catch {
      setIsCheckingVerify(false);
      toast.error("Network error. Please try again.");
    }
  };

  const openCollection = async (coll: Collection) => {
    playClick();
    setActiveCollection(coll);
    setLoadingCollItems(true);
    try {
      const res = await fetch(`/api/users/collections/${coll.id}/items`);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        setCollectionItems(items);
        setActiveCollection((prev) =>
          prev
            ? {
                ...prev,
                name: data.collection?.name || prev.name,
                description: data.collection?.description ?? prev.description,
                itemCount: items.length,
              }
            : null
        );
        setCollections((prev) =>
          prev.map((c) => (c.id === coll.id ? { ...c, itemCount: items.length } : c))
        );
      }
    } catch {
      toast.error("Failed to load collection items");
    } finally {
      setLoadingCollItems(false);
    }
  };

  const createCollection = async () => {
    if (!newCollName.trim()) return;
    setCreatingColl(true);
    try {
      const res = await fetch("/api/users/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCollName.trim(),
          description: newCollDesc.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Collection created");
        playSuccess();
        setNewCollName("");
        setNewCollDesc("");
        fetchData();
      }
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setCreatingColl(false);
    }
  };

  const startEditCollection = (coll: Collection, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playClick();
    setEditingCollId(coll.id);
    setEditCollName(coll.name);
    setEditCollDesc(coll.description || "");
  };

  const cancelEditCollection = () => {
    playClick();
    setEditingCollId(null);
    setEditCollName("");
    setEditCollDesc("");
  };

  const saveCollectionEdit = async (id: number) => {
    if (!editCollName.trim()) return;
    setSavingCollEdit(true);
    try {
      const res = await fetch("/api/users/collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editCollName.trim(),
          description: editCollDesc.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Collection updated");
        playSuccess();
        setEditingCollId(null);

        // Update local collections state
        setCollections((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, name: data.collection.name, description: data.collection.description }
              : c
          )
        );

        // Update active collection state if open
        if (activeCollection && activeCollection.id === id) {
          setActiveCollection((prev) =>
            prev
              ? { ...prev, name: data.collection.name, description: data.collection.description }
              : null
          );
        }
      } else {
        toast.error("Failed to update collection");
      }
    } catch {
      toast.error("Error updating collection");
    } finally {
      setSavingCollEdit(false);
    }
  };

  const deleteCollection = async (id: number) => {
    try {
      const res = await fetch("/api/users/collections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Collection deleted");
        playSuccess();
        if (activeCollection?.id === id) {
          setActiveCollection(null);
        }
        fetchData();
      }
    } catch {
      toast.error("Failed to delete collection");
    }
  };

  const removeItemFromCollection = async (collectionId: number, templateId: number) => {
    playClick();
    try {
      const res = await fetch(`/api/users/collections/${collectionId}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (res.ok) {
        toast.success("Template removed from collection");
        playSuccess();
        setCollectionItems((prev) => prev.filter((item) => item.templateId !== templateId));
        setCollections((prev) =>
          prev.map((c) => (c.id === collectionId ? { ...c, itemCount: Math.max(0, c.itemCount - 1) } : c))
        );
      }
    } catch {
      toast.error("Failed to remove template");
    }
  };

  const unlikeTemplate = async (templateId: number) => {
    setUnliking(templateId);
    try {
      const res = await fetch("/api/templates/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, action: "unlike" }),
      });
      if (res.ok) {
        setLikedTemplates((prev) => prev.filter((t) => t.templateId !== templateId));
        playClick();
        toast.success("Removed from liked");
      } else {
        toast.error("Failed to remove like");
        playBeep(220, 0.3);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUnliking(null);
    }
  };

  const copyCalendarLink = () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const token = profile?.calendarToken || "token_placeholder";
    const link = `${base}/api/users/calendar-feed?token=${token}`;
    navigator.clipboard.writeText(link);
    playSuccess();
    toast.success("Calendar feed link copied");
  };

  // Stats calculations
  const learningCount = progress.filter((p) => p.status === "learning").length;
  const implementedCount = progress.filter((p) => p.status === "implemented").length;
  const masteredCount = progress.filter((p) => p.status === "mastered").length;
  const totalTracked = progress.length;

  // Filter templates list
  const filteredTemplates = userTemplates.filter(t => 
    t.templateTitle.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.language.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "overview", icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
    { id: "templates", label: "my_templates", icon: <Library className="h-3.5 w-3.5" /> },
    { id: "contributions", label: "contributions", icon: <GitPullRequest className="h-3.5 w-3.5" /> },
    { id: "liked", label: "liked", icon: <Heart className="h-3.5 w-3.5" /> },
    { id: "collections", label: "collections", icon: <FolderOpen className="h-3.5 w-3.5" /> },
    { id: "progress", label: "statistics", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: "settings", label: "preferences", icon: <Settings className="h-3.5 w-3.5" /> },
  ];

  if (!user) return null;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 font-mono min-h-screen text-foreground select-none">
      
      {/* Decorative Radial glows behind dashboard content */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[450px] h-[450px] rounded-full bg-primary/4 blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-info/3 blur-[110px] animate-glow-pulse-light" />
      </div>

      {/* Main Container Grid */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column Sidebar: Navigation & Diagnostics */}
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          {/* User console session overview widget */}
          <div className="border border-border/85 bg-card/35 backdrop-blur-md p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3 border-b border-border/40 pb-2.5">
              <div className="relative flex items-center justify-center h-8 w-8 border border-primary/30 bg-primary/5 text-primary shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-foreground truncate">{user.username}</div>
                <div className="text-[8px] text-muted-foreground/35 uppercase tracking-wider leading-none">logged_session</div>
              </div>
            </div>
            {/* System variables */}
            <div className="space-y-1.5 text-[9px] text-muted-foreground/45 leading-relaxed font-mono">
              <div className="flex justify-between">
                <span>$ WHOAMI</span>
                <span className="text-primary font-bold">active</span>
              </div>
              <div className="flex justify-between">
                <span>$ STABILITY</span>
                <span className="text-success font-bold">100%</span>
              </div>
              <div className="flex justify-between">
                <span>$ CALENDAR</span>
                <span className={profile?.calendarToken ? "text-success font-bold" : "text-warning font-bold"}>
                  {profile?.calendarToken ? "linked" : "unlinked"}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Sidebar Tab Selectors */}
          <nav className="hidden lg:flex flex-col gap-1.5 border border-border/80 bg-card/35 backdrop-blur-md p-3 shadow-xl">
            <div className="text-[8px] text-muted-foreground/30 uppercase tracking-widest font-bold px-2 mb-2 select-none">
              Navigation Menu
            </div>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => changeTab(tab.id)}
                  className={`w-full text-left px-3 py-2 border text-[11px] font-bold uppercase transition-all flex items-center gap-2 select-none ${
                    isActive
                      ? "border-primary/50 bg-primary/5 text-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.08)]"
                      : "border-transparent text-muted-foreground/40 hover:text-foreground hover:bg-card/25"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Tab Selectors (Horizontal layout) */}
          <div className="flex lg:hidden overflow-x-auto scrollbar-thin pb-2 border-b border-border/40 gap-1.5 select-none shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => changeTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 border text-[10px] tracking-wide uppercase transition-all whitespace-nowrap ${
                    isActive
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-card/35 text-muted-foreground/40 hover:text-foreground hover:border-border/80"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Column: Main Console Output Panel */}
        <main className="flex-1 min-w-0 space-y-6">
          
          {/* Header diagnostics banner */}
          <div className="border border-border bg-card/35 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/15 select-none">
              <div className="flex items-center gap-2">
                <div className="flex gap-1 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-destructive/60" />
                  <span className="h-2 w-2 rounded-full bg-warning/60" />
                  <span className="h-2 w-2 rounded-full bg-success/60" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  [ {user.username}@cp-base_dashboard ]
                </span>
              </div>
              <button
                onClick={() => {
                  playClick();
                  fetchData();
                }}
                className="text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                <span className="text-[8px] uppercase tracking-wider font-bold">sync</span>
              </button>
            </div>
            
            <div className="px-4 py-3 text-[10px] text-muted-foreground/50 space-y-1.5 border-b border-primary/10 bg-black/15">
              <div className="flex items-center gap-1.5">
                <span className="text-primary font-bold">{user.username}@cp-base:~$</span>
                <span>cat /sys/diagnostics</span>
              </div>
              <div className="text-foreground/75 leading-relaxed">
                Diagnostics online. Tracked: <span className="text-success font-bold">{masteredCount}</span> mastered,{" "}
                <span className="text-warning font-bold">{implementedCount}</span> implemented, and{" "}
                <span className="text-blue-400 font-bold">{learningCount}</span> active templates.
              </div>
            </div>
          </div>

          {/* Loading Panel */}
          {loading ? (
            <div className="border border-border bg-card/35 backdrop-blur-md p-16 flex items-center justify-center shadow-xl">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground/40">
                <Terminal className="h-4 w-4 animate-spin text-primary" />
                <span>QUERYING_DASHBOARD_DATABASE...</span>
              </div>
            </div>
          ) : (
            <>
              {/* ════ OVERVIEW TAB ════ */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Stats Bento boxes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
                    {[
                      { label: "Learning", count: learningCount, color: "text-blue-400 border-blue-400/20 bg-blue-400/5", icon: <BookOpen className="h-4 w-4" /> },
                      { label: "Implemented", count: implementedCount, color: "text-warning border-warning/20 bg-warning/5", icon: <CheckCircle2 className="h-4 w-4" /> },
                      { label: "Mastered", count: masteredCount, color: "text-success border-success/20 bg-success/5", icon: <Award className="h-4 w-4" /> },
                      { label: "Collections", count: collections.length, color: "text-purple-400 border-purple-400/20 bg-purple-400/5", icon: <FolderOpen className="h-4 w-4" /> },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={`border bg-card/35 backdrop-blur-md p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${stat.color} animate-fade-in`}
                      >
                        <div className="flex items-center gap-2 mb-2 select-none opacity-85">
                          {stat.icon}
                          <span className="text-[9px] uppercase tracking-widest font-bold">{stat.label}</span>
                        </div>
                        <div className="text-3xl font-extrabold tracking-tight">{stat.count}</div>
                        {/* Micro Progress Bar placeholder for bento layout */}
                        <div className="mt-3.5 h-[2px] bg-white/5 overflow-hidden">
                          <div
                            className="h-full bg-current opacity-60 transition-all duration-500"
                            style={{ width: `${totalTracked > 0 ? (stat.count / totalTracked) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CP Profiles Diagnostics Integration Grid */}
                  {stats && (stats.codeforces?.active || stats.atcoder?.active || stats.leetcode?.active || stats.codechef?.active) ? (
                    <div className="border border-border bg-card/35 backdrop-blur-md shadow-xl animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/15 text-[10px] uppercase tracking-wider text-muted-foreground/45 font-bold flex items-center gap-1.5 select-none">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <span>Platform Handle Metrics</span>
                      </div>
                      
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: "codeforces", label: "Codeforces", data: stats.codeforces, color: "#ef4444" },
                          { key: "atcoder", label: "AtCoder", data: stats.atcoder, color: "#71717a" },
                          { key: "leetcode", label: "LeetCode", data: stats.leetcode, color: "#f97316" },
                          { key: "codechef", label: "CodeChef", data: stats.codechef, color: "#10b981" },
                        ].map((p) => {
                          if (!p.data?.active) return null;
                          const ratingStyle = getRatingStyle(p.key, p.data.rating);
                          return (
                            <div key={p.key} className="border border-border/55 bg-background/5 p-4 flex justify-between relative group hover:border-[var(--brand-color)]/30 transition-colors duration-300" style={{ "--brand-color": p.color } as React.CSSProperties}>
                              <div className="space-y-3 flex-1 min-w-0">
                                <div className="flex items-center gap-2 border-b border-border/30 pb-2">
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="text-[10px] uppercase font-bold text-foreground">{p.label}</span>
                                </div>
                                
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex justify-between max-w-[240px]">
                                    <span className="text-muted-foreground/30 font-mono">Handle:</span>
                                    <a
                                      href={p.key === "codeforces" ? `https://codeforces.com/profile/${p.data.handle}` : p.key === "atcoder" ? `https://atcoder.jp/users/${p.data.handle}` : p.key === "leetcode" ? `https://leetcode.com/${p.data.handle}` : `https://www.codechef.com/users/${p.data.handle}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-primary font-bold hover:underline flex items-center gap-1 truncate"
                                    >
                                      <span>@{p.data.handle}</span>
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                  </div>
                                  <div className="flex justify-between max-w-[240px]">
                                    <span className="text-muted-foreground/30 font-mono">Rating:</span>
                                    <span className="font-bold font-mono" style={ratingStyle}>{p.data.rating ?? "—"}</span>
                                  </div>
                                  <div className="flex justify-between max-w-[240px]">
                                    <span className="text-muted-foreground/30 font-mono">Tier/Rank:</span>
                                    <span className="font-bold capitalize font-mono text-[11px]" style={ratingStyle}>{p.data.rank ?? "—"}</span>
                                  </div>
                                  <div className="flex justify-between max-w-[240px]">
                                    <span className="text-muted-foreground/30 font-mono">Solved Count:</span>
                                    <span className="font-bold text-foreground font-mono">{p.data.solved ?? "—"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-border bg-card/35 backdrop-blur-md p-6 text-center text-xs text-muted-foreground/35 shadow-xl select-none font-mono">
                      [INFO] No handle statistics profiles linked. Link profiles in the Preferences tab to see live rating updates.
                    </div>
                  )}

                  {/* Split Recent activity timeline & Custom templates list */}
                  <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* Activity timeline component */}
                    <div className="border border-border bg-card/35 backdrop-blur-md shadow-xl flex flex-col">
                      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/15 text-[10px] uppercase tracking-wider text-muted-foreground/45 font-bold flex items-center gap-1.5 select-none">
                        <Activity className="h-3.5 w-3.5 text-primary" />
                        <span>Recent Progress Timeline</span>
                      </div>
                      
                      {progress.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground/30 flex-1 flex items-center justify-center">
                          No progress tracked yet. Visit any template page to update status.
                        </div>
                      ) : (
                        <div className="p-4 space-y-4 flex-1">
                          <div className="relative border-l border-border/40 pl-4 ml-2 space-y-5">
                            {progress.slice(0, 4).map((p) => (
                              <div key={p.id} className="relative group text-xs">
                                {/* Timeline Node Dot */}
                                <span className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border border-card ${
                                  p.status === "mastered"
                                    ? "bg-success shadow-[0_0_8px_#22c55e]"
                                    : p.status === "implemented"
                                    ? "bg-warning shadow-[0_0_8px_#eab308]"
                                    : "bg-blue-400 shadow-[0_0_8px_#60a5fa]"
                                }`} />
                                
                                <div className="flex items-center justify-between">
                                  <Link href={`/template/${p.templateSlug}`} className="font-bold text-foreground/80 hover:text-primary transition-colors">
                                    {p.templateTitle}
                                  </Link>
                                  <span className={`text-[8px] uppercase tracking-widest font-mono font-bold px-1.5 border rounded-none ${
                                    p.status === "mastered"
                                      ? "text-success border-success/30 bg-success/5"
                                      : p.status === "implemented"
                                      ? "text-warning border-warning/30 bg-warning/5"
                                      : "text-blue-400 border-blue-400/30 bg-blue-400/5"
                                  }`}>
                                    {p.status}
                                  </span>
                                </div>
                                <div className="text-[9px] text-muted-foreground/30 mt-0.5">
                                  {new Date(p.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Custom templates list card panel */}
                    <div className="border border-border bg-card/35 backdrop-blur-md shadow-xl flex flex-col">
                      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/15 text-[10px] uppercase tracking-wider text-muted-foreground/45 font-bold flex items-center gap-1.5 select-none">
                        <Library className="h-3.5 w-3.5 text-primary" />
                        <span>Recent Custom Snippets ({userTemplates.length})</span>
                      </div>
                      
                      {userTemplates.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground/30 flex-1 flex items-center justify-center">
                          No custom versions saved yet. Save your own templates directly inside template pages.
                        </div>
                      ) : (
                        <div className="divide-y divide-border/25 flex-1 overflow-auto max-h-[220px]">
                          {userTemplates.slice(0, 4).map((t) => (
                            <Link
                              key={t.id}
                              href={`/template/${t.templateSlug}`}
                              onClick={playClick}
                              className="flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors group"
                            >
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors block truncate">
                                  {t.templateTitle}
                                </span>
                                <span className="text-[9px] text-muted-foreground/35 uppercase tracking-wider font-mono">
                                  {t.language}
                                </span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors shrink-0" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* ════ MY TEMPLATES TAB ════ */}
              {activeTab === "templates" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Search Bar */}
                  <div className="border border-border/80 bg-card/35 backdrop-blur-md p-4 shadow-xl">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/35" />
                      <Input
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search custom templates by title or language..."
                        className="font-mono text-xs bg-background/30 border-primary/15 focus:border-primary/40 placeholder:text-muted-foreground/25 pl-9"
                      />
                    </div>
                  </div>

                  {/* Grid layout */}
                  {filteredTemplates.length === 0 ? (
                    <div className="border border-border bg-card/35 backdrop-blur-md p-16 text-center space-y-4 shadow-xl select-none font-mono">
                      <Library className="h-8 w-8 text-muted-foreground/15 mx-auto animate-pulse" />
                      <p className="text-xs text-muted-foreground/40">No custom templates found matching query.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredTemplates.map((t) => (
                        <div
                          key={t.id}
                          className="border border-border bg-card/35 backdrop-blur-md p-4 flex flex-col justify-between hover:border-primary/50 transition-all duration-300 group shadow-md"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground/35 font-bold font-mono">
                                {t.language}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(t.customCode);
                                  playSuccess();
                                  toast.success("Snippet copied!");
                                }}
                                className="text-muted-foreground/35 hover:text-primary transition-colors cursor-pointer p-1"
                                title="Copy Snippet"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            
                            <Link
                              href={`/template/${t.templateSlug}`}
                              onClick={playClick}
                              className="block text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug"
                            >
                              {t.templateTitle}
                            </Link>

                            <p className="text-[9px] text-muted-foreground/30 font-mono select-none">
                              Modified: {new Date(t.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="mt-5 pt-3.5 border-t border-border/25 flex items-center justify-between text-[9px] select-none text-muted-foreground/30 font-mono">
                            <span className="flex items-center gap-1">
                              <Code className="h-3 w-3" />
                              <span>{t.templateSlug}.cpp</span>
                            </span>
                            <Link
                              href={`/template/${t.templateSlug}`}
                              onClick={playClick}
                              className="text-primary/70 hover:text-primary font-bold flex items-center gap-0.5"
                            >
                              <span>Edit code</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ════ CONTRIBUTIONS TAB ════ */}
              {activeTab === "contributions" && (
                <div className="space-y-4 animate-fade-in">
                  {userContributions.length === 0 ? (
                    <div className="border border-border bg-card/35 backdrop-blur-md p-16 text-center space-y-4 shadow-xl select-none font-mono">
                      <GitPullRequest className="h-8 w-8 text-muted-foreground/15 mx-auto animate-pulse" />
                      <p className="text-xs text-muted-foreground/40">No contributions submitted yet.</p>
                      <Link
                        href="/contribute"
                        onClick={playClick}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary/70 hover:text-primary transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Submit a template</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="border border-border/80 bg-card/35 backdrop-blur-md shadow-xl divide-y divide-border/30">
                      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/15 text-[10px] uppercase tracking-wider text-muted-foreground/45 font-bold flex items-center gap-1.5">
                        <GitPullRequest className="h-3.5 w-3.5 text-primary" />
                        <span>Submission History ({userContributions.length})</span>
                      </div>
                      {userContributions.map((c) => {
                        const label = c.templateTitle || c.title || "Untitled";
                        const statusColor =
                          c.status === "approved"
                            ? "text-success border-success/30 bg-success/5"
                            : c.status === "rejected"
                            ? "text-destructive border-destructive/30 bg-destructive/5"
                            : "text-warning border-warning/30 bg-warning/5";
                        return (
                          <div key={c.id} className="p-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] uppercase tracking-wider text-muted-foreground/35 border border-border/60 px-1 py-0.5 font-bold select-none">
                                  {c.type === "new" ? "new template" : "edit"}
                                </span>
                                {c.status === "approved" && c.templateSlug ? (
                                  <Link
                                    href={`/template/${c.templateSlug}`}
                                    onClick={playClick}
                                    className="text-xs font-bold text-foreground hover:text-primary transition-colors truncate"
                                  >
                                    {label}
                                  </Link>
                                ) : (
                                  <span className="text-xs font-bold text-foreground truncate">{label}</span>
                                )}
                              </div>
                              <p className="text-[9px] text-muted-foreground/30 font-mono select-none">
                                Submitted: {new Date(c.createdAt).toLocaleDateString()}
                                {c.reviewedAt && ` · Reviewed: ${new Date(c.reviewedAt).toLocaleDateString()}`}
                              </p>
                              {c.adminNote && (
                                <p className="text-[10px] text-muted-foreground/50 leading-relaxed border-l-2 border-border/40 pl-2 select-text">
                                  <span className="text-muted-foreground/30 uppercase tracking-wider">note: </span>
                                  {c.adminNote}
                                </p>
                              )}
                            </div>
                            <span
                              className={`shrink-0 text-[9px] uppercase tracking-wider font-bold border px-2 py-1 select-none ${statusColor}`}
                            >
                              {c.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ════ LIKED TAB ════ */}
              {activeTab === "liked" && (
                <div className="space-y-4 animate-fade-in">
                  {likedTemplates.length === 0 ? (
                    <div className="border border-border bg-card/35 backdrop-blur-md p-16 text-center space-y-4 shadow-xl select-none font-mono">
                      <Heart className="h-8 w-8 text-muted-foreground/15 mx-auto animate-pulse" />
                      <p className="text-xs text-muted-foreground/40">No liked templates yet.</p>
                      <Link
                        href="/templates"
                        onClick={playClick}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary/70 hover:text-primary transition-colors"
                      >
                        <Library className="h-3 w-3" />
                        <span>Browse templates</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {likedTemplates.map((t) => (
                        <div
                          key={t.id}
                          className="border border-border bg-card/35 backdrop-blur-md p-4 flex flex-col justify-between hover:border-primary/50 transition-all duration-300 group shadow-md"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground/35 font-bold font-mono">
                                {t.categoryName || "uncategorized"}
                              </span>
                              <button
                                onClick={() => unlikeTemplate(t.templateId)}
                                disabled={unliking === t.templateId}
                                className="text-destructive/60 hover:text-destructive transition-colors cursor-pointer p-1 disabled:opacity-40"
                                title="Remove from liked"
                              >
                                <Heart className="h-3.5 w-3.5 fill-current" />
                              </button>
                            </div>

                            <Link
                              href={`/template/${t.templateSlug}`}
                              onClick={playClick}
                              className="block text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug"
                            >
                              {t.templateTitle}
                            </Link>

                            <p className="text-[9px] text-muted-foreground/30 font-mono select-none">
                              Liked: {new Date(t.likedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="mt-5 pt-3.5 border-t border-border/25 flex items-center justify-between text-[9px] select-none text-muted-foreground/30 font-mono">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              <span>{t.likeCount} likes</span>
                            </span>
                            <Link
                              href={`/template/${t.templateSlug}`}
                              onClick={playClick}
                              className="text-primary/70 hover:text-primary font-bold flex items-center gap-0.5"
                            >
                              <span>Open</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ════ COLLECTIONS TAB ════ */}
              {activeTab === "collections" && (
                <div className="space-y-6 animate-fade-in">
                  {activeCollection ? (
                    /* ── View Single Collection Detail ── */
                    <div className="space-y-6">
                      <div className="border border-border bg-card/35 backdrop-blur-md p-5 shadow-xl font-mono">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4 mb-4">
                          <button
                            onClick={() => {
                              playClick();
                              setActiveCollection(null);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold w-fit cursor-pointer"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to all collections
                          </button>
                          <div className="flex items-center gap-2">
                            {editingCollId !== activeCollection.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditCollection(activeCollection)}
                                className="font-mono text-[10px] uppercase h-7 px-2.5 border-border hover:border-primary/40 cursor-pointer"
                              >
                                <Pencil className="h-3 w-3 mr-1 text-primary" />
                                Edit Details
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                deleteCollection(activeCollection.id);
                              }}
                              className="font-mono text-[10px] uppercase h-7 px-2.5 border-destructive/30 hover:bg-destructive/10 text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {editingCollId === activeCollection.id ? (
                          /* Edit Form inside detail view */
                          <div className="space-y-3 p-4 border border-primary/20 bg-primary/5">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Edit Collection Details</span>
                            </div>
                            <div className="space-y-2">
                              <Input
                                value={editCollName}
                                onChange={(e) => setEditCollName(e.target.value)}
                                placeholder="Collection Title..."
                                className="font-mono text-xs bg-background/50 border-primary/20"
                              />
                              <Input
                                value={editCollDesc}
                                onChange={(e) => setEditCollDesc(e.target.value)}
                                placeholder="Collection Description (optional)..."
                                className="font-mono text-xs bg-background/50 border-primary/20"
                              />
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditCollection}
                                className="font-mono text-xs uppercase h-7 cursor-pointer"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                disabled={savingCollEdit || !editCollName.trim()}
                                onClick={() => saveCollectionEdit(activeCollection.id)}
                                className="font-mono text-xs uppercase h-7 cursor-pointer"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Collection info display */
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-primary font-bold">
                              <FolderOpen className="h-4 w-4" />
                              <span>~/collections/{activeCollection.name.toLowerCase().replace(/\s+/g, "_")}</span>
                            </div>
                            <h3 className="text-lg font-bold text-foreground">{activeCollection.name}</h3>
                            <p className="text-xs text-muted-foreground/70 leading-relaxed max-w-2xl">
                              {activeCollection.description || "No description provided for this collection."}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Collection Items List */}
                      <div className="border border-border bg-card/35 backdrop-blur-md shadow-xl font-mono">
                        <div className="px-4 py-2.5 border-b border-border/40 bg-muted/15 flex items-center justify-between">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/45 font-bold flex items-center gap-1.5">
                            <Library className="h-3.5 w-3.5 text-primary" />
                            <span>Templates in this collection ({collectionItems.length})</span>
                          </div>
                        </div>

                        {loadingCollItems ? (
                          <div className="p-12 text-center text-xs text-muted-foreground/35 animate-pulse">
                            Loading templates...
                          </div>
                        ) : collectionItems.length === 0 ? (
                          <div className="p-12 text-center space-y-2 text-xs text-muted-foreground/35 select-none">
                            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/15" />
                            <p>No templates added to this collection yet.</p>
                            <p className="text-[10px] text-muted-foreground/25 max-w-xs mx-auto">
                              Visit any template page and use the Personalization panel to add templates to "{activeCollection.name}".
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border/25">
                            {collectionItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors group"
                              >
                                <Link
                                  href={`/template/${item.templateSlug}`}
                                  onClick={playClick}
                                  className="flex items-center gap-2 text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors flex-1"
                                >
                                  <Code className="h-3.5 w-3.5 text-primary/50 group-hover:text-primary" />
                                  <span>{item.templateTitle}</span>
                                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                                </Link>
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
                                  <span className="hidden sm:inline">
                                    Added {new Date(item.addedAt).toLocaleDateString()}
                                  </span>
                                  <button
                                    onClick={() => removeItemFromCollection(activeCollection.id, item.templateId)}
                                    className="text-muted-foreground/30 hover:text-destructive transition-colors p-1 cursor-pointer"
                                    title="Remove from collection"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ── All Collections Grid View ── */
                    <div className="space-y-6">
                      {/* Create Collection Form */}
                      <div className="border border-border bg-card/35 backdrop-blur-md p-5 shadow-xl font-mono">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/45 font-bold mb-3 flex items-center gap-1.5 select-none">
                          <Plus className="h-3.5 w-3.5 text-primary" />
                          <span>New Collection Setup</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={newCollName}
                            onChange={(e) => setNewCollName(e.target.value)}
                            placeholder="Collection title (e.g., Graph Algorithms)..."
                            className="font-mono text-xs bg-background/30 border-primary/15 focus:border-primary/40 placeholder:text-muted-foreground/25 flex-1"
                          />
                          <Input
                            value={newCollDesc}
                            onChange={(e) => setNewCollDesc(e.target.value)}
                            placeholder="Description (optional)..."
                            className="font-mono text-xs bg-background/30 border-primary/15 focus:border-primary/40 placeholder:text-muted-foreground/25 flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") createCollection();
                            }}
                          />
                          <Button
                            onClick={createCollection}
                            disabled={creatingColl || !newCollName.trim()}
                            className="font-mono text-xs uppercase tracking-wider h-9 shrink-0 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Create
                          </Button>
                        </div>
                      </div>

                      {/* Collections Card Grid */}
                      {collections.length === 0 ? (
                        <div className="border border-border bg-card/35 backdrop-blur-md p-16 text-center space-y-4 shadow-xl select-none font-mono">
                          <FolderOpen className="h-8 w-8 text-muted-foreground/15 mx-auto" />
                          <p className="text-xs text-muted-foreground/40 font-mono">No collections initialized yet.</p>
                          <p className="text-[10px] text-muted-foreground/25 max-w-sm mx-auto leading-relaxed">
                            Create a collection directory above. Group and organize custom templates easily.
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 select-none font-mono">
                          {collections.map((c) => (
                            <div
                              key={c.id}
                              className="border border-border/80 bg-card/35 backdrop-blur-md p-4 flex flex-col justify-between hover:border-primary/50 transition-all duration-300 group shadow-md"
                            >
                              {editingCollId === c.id ? (
                                /* Edit inline form */
                                <div className="space-y-3">
                                  <div className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                                    <Pencil className="h-3 w-3" />
                                    <span>Edit Collection</span>
                                  </div>
                                  <Input
                                    value={editCollName}
                                    onChange={(e) => setEditCollName(e.target.value)}
                                    placeholder="Collection Name..."
                                    className="font-mono text-xs bg-background/50 border-primary/20"
                                  />
                                  <Input
                                    value={editCollDesc}
                                    onChange={(e) => setEditCollDesc(e.target.value)}
                                    placeholder="Description (optional)..."
                                    className="font-mono text-xs bg-background/50 border-primary/20"
                                  />
                                  <div className="flex gap-2 justify-end pt-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={cancelEditCollection}
                                      className="font-mono text-[10px] uppercase h-7 px-2 cursor-pointer"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={savingCollEdit || !editCollName.trim()}
                                      onClick={() => saveCollectionEdit(c.id)}
                                      className="font-mono text-[10px] uppercase h-7 px-2 cursor-pointer"
                                    >
                                      <Save className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                /* Collection Card Body */
                                <>
                                  <div
                                    className="space-y-2.5 cursor-pointer"
                                    onClick={() => openCollection(c)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-primary/75 font-bold font-mono">
                                        <FolderOpen className="h-3.5 w-3.5 text-primary" />
                                        <span>~/collections/{c.name.toLowerCase().replace(/\s+/g, "_")}</span>
                                      </div>
                                      <span className="text-[9px] text-primary group-hover:underline flex items-center gap-1">
                                        Open <ChevronRight className="h-3 w-3" />
                                      </span>
                                    </div>

                                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                      {c.name}
                                    </h4>

                                    <p className="text-[10px] text-muted-foreground/50 leading-relaxed font-mono line-clamp-2">
                                      {c.description || "No description provided."}
                                    </p>
                                  </div>

                                  <div className="mt-5 pt-3.5 border-t border-border/25 flex items-center justify-between text-[9px] select-none text-muted-foreground/35 font-mono">
                                    <button
                                      onClick={() => openCollection(c)}
                                      className="bg-primary/5 border border-primary/20 px-2 py-0.5 text-primary text-[8px] font-bold uppercase hover:bg-primary/10 transition-colors cursor-pointer"
                                    >
                                      {Number(c.itemCount || 0)} items
                                    </button>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => startEditCollection(c, e)}
                                        className="text-muted-foreground/30 hover:text-primary transition-colors cursor-pointer p-1"
                                        title="Rename or edit description"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          playClick();
                                          deleteCollection(c.id);
                                        }}
                                        className="text-muted-foreground/20 hover:text-destructive transition-colors cursor-pointer p-1"
                                        title="Delete collection"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ════ STATISTICS (PROGRESS) TAB ════ */}
              {activeTab === "progress" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Radial ring & status summary details */}
                  <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* SVG Radial Mastery Score */}
                    <div className="border border-border bg-card/35 backdrop-blur-md p-5 shadow-xl flex flex-col items-center justify-center font-mono select-none md:col-span-1">
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/45 font-bold mb-4">
                        Readiness Score
                      </div>
                      <div className="relative flex items-center justify-center h-28 w-28 mb-3">
                        <svg className="h-full w-full transform -rotate-90">
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke="rgba(255,255,255,0.03)"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke="#22c55e"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={301.6}
                            strokeDashoffset={301.6 - (301.6 * (masteredCount / Math.max(totalTracked, 1)))}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <div className="text-xl font-extrabold text-foreground">
                            {totalTracked > 0 ? Math.round((masteredCount / totalTracked) * 100) : 0}%
                          </div>
                          <div className="text-[7px] text-muted-foreground/45 uppercase tracking-wider font-bold">mastery</div>
                        </div>
                      </div>
                      <div className="text-[8px] text-muted-foreground/35 text-center mt-2">
                        {masteredCount} of {totalTracked} templates fully mastered.
                      </div>
                    </div>

                    {/* Progress details stats grid */}
                    <div className="border border-border bg-card/35 backdrop-blur-md p-5 shadow-xl flex flex-col justify-between font-mono select-none md:col-span-2">
                      <div className="space-y-4">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/45 font-bold">
                          Implementation Status Summary
                        </div>
                        
                        <div className="space-y-3 pt-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-success uppercase">Mastered</span>
                              <span>{masteredCount} / {totalTracked}</span>
                            </div>
                            <div className="h-1.5 bg-background/30 border border-border p-px">
                              <div className="h-full bg-success/80" style={{ width: `${totalTracked > 0 ? (masteredCount / totalTracked) * 100 : 0}%` }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-warning uppercase">Implemented</span>
                              <span>{implementedCount} / {totalTracked}</span>
                            </div>
                            <div className="h-1.5 bg-background/30 border border-border p-px">
                              <div className="h-full bg-warning/80" style={{ width: `${totalTracked > 0 ? (implementedCount / totalTracked) * 100 : 0}%` }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-blue-400 uppercase">Learning</span>
                              <span>{learningCount} / {totalTracked}</span>
                            </div>
                            <div className="h-1.5 bg-background/30 border border-border p-px">
                              <div className="h-full bg-blue-400/80" style={{ width: `${totalTracked > 0 ? (learningCount / totalTracked) * 100 : 0}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-[8px] text-muted-foreground/30 border-t border-border/30 pt-3 flex justify-between uppercase">
                        <span>Database synchronized</span>
                        <span className="text-primary font-bold">online</span>
                      </div>
                    </div>

                  </div>

                  {/* List of Tracked templates */}
                  <div className="border border-border bg-card/35 backdrop-blur-md shadow-xl">
                    <div className="px-4 py-2.5 border-b border-border/40 bg-muted/15 flex items-center justify-between select-none">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/45 font-bold flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-primary" />
                        <span>Tracked Implementations list ({progress.length})</span>
                      </div>
                      
                      {/* Filter Controls */}
                      <div className="flex gap-1">
                        {["all", "mastered", "implemented", "learning"].map((sf) => (
                          <button
                            key={sf}
                            onClick={() => {
                              playClick();
                              setStatusFilter(sf as typeof statusFilter);
                            }}
                            className={`px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold border transition-all cursor-pointer ${
                              statusFilter === sf
                                ? "border-primary/45 bg-primary/5 text-primary"
                                : "border-transparent text-muted-foreground/35 hover:text-foreground"
                            }`}
                          >
                            {sf}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {progress.length === 0 ? (
                      <div className="p-12 text-center text-xs text-muted-foreground/35 font-mono select-none">
                        No progress items mapped yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/25">
                        {progress
                          .filter((p) => statusFilter === "all" || p.status === statusFilter)
                          .map((p) => (
                            <Link
                              key={p.id}
                              href={`/template/${p.templateSlug}`}
                              onClick={playClick}
                              className="flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors group"
                            >
                              <span className="text-xs font-bold text-foreground/75 group-hover:text-primary transition-colors">
                                {p.templateTitle}
                              </span>
                              <span
                                className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 border ${
                                  p.status === "mastered"
                                    ? "text-success border-success/30 bg-success/5"
                                    : p.status === "implemented"
                                    ? "text-warning border-warning/30 bg-warning/5"
                                    : "text-blue-400 border-blue-400/30 bg-blue-400/5"
                                }`}
                              >
                                {p.status}
                              </span>
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ════ SETTINGS TAB ════ */}
              {activeTab === "settings" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Platform Verification Settings panel */}
                  <div className="border border-border bg-card/35 backdrop-blur-md shadow-xl">
                    <div className="px-4 py-2.5 border-b border-border/40 bg-muted/15 text-[10px] uppercase tracking-wider text-muted-foreground/45 font-bold flex items-center gap-1.5 select-none">
                      <Settings className="h-3.5 w-3.5 text-primary" />
                      <span>Handle Verification Preferences</span>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {[
                        { key: "codeforces", label: "Codeforces", handle: cfHandle, color: "text-red-400 border-red-400/20 bg-red-400/5" },
                        { key: "atcoder", label: "AtCoder", handle: acHandle, color: "text-zinc-400 border-zinc-400/20 bg-zinc-400/5" },
                        { key: "leetcode", label: "LeetCode", handle: lcHandle, color: "text-amber-400 border-amber-400/20 bg-amber-400/5" },
                        { key: "codechef", label: "CodeChef", handle: ccHandle, color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" },
                      ].map((field) => {
                        const isVerifying = verifyingPlatform === field.key;
                        return (
                          <div key={field.key} className="border border-border/40 p-4 bg-background/5 space-y-2.5">
                            <div className="flex justify-between items-center select-none">
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold">
                                {field.label}
                              </Label>
                              {field.handle ? (
                                <span className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 border ${field.color}`}>
                                  Linked: {field.handle}
                                </span>
                              ) : (
                                <span className="text-[8px] uppercase tracking-wider text-muted-foreground/25 border border-border/30 bg-card/25 px-2 py-0.5 font-bold">
                                  Unlinked
                                </span>
                              )}
                            </div>

                            {!isVerifying ? (
                              <div className="flex items-center justify-between select-none">
                                <span className="text-[10px] text-muted-foreground/35">
                                  {field.handle ? "Modify linked profile handle" : "Link and verify handle statistics"}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    playClick();
                                    setVerifyingPlatform(field.key);
                                    setVerifyInputVal(field.handle || "");
                                  }}
                                  className="text-[9px] uppercase h-6.5 font-bold font-mono border-primary/20 hover:border-primary text-primary"
                                >
                                  {field.handle ? "Modify" : "Verify handle"}
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4 pt-3 border-t border-border/30">
                                <div className="space-y-1.5">
                                  <Label className="text-[9px] uppercase tracking-wider text-muted-foreground/45 font-bold">
                                    Enter {field.label} username handle
                                  </Label>
                                  <Input
                                    value={verifyInputVal}
                                    onChange={(e) => setVerifyInputVal(e.target.value)}
                                    placeholder={`Enter handle (e.g. ${field.label === "LeetCode" ? "Mohamediibra7im" : "Midoriya"})`}
                                    className="font-mono text-xs bg-background/30 border-primary/15 focus:border-primary/40 placeholder:text-muted-foreground/20"
                                  />
                                </div>

                                {verifyInputVal.trim() && (
                                  <div className="p-3 bg-primary/5 border border-primary/15 text-[10px] text-muted-foreground/50 space-y-2 leading-relaxed">
                                    <div className="font-bold text-primary uppercase select-none flex items-center gap-1.5">
                                      <Terminal className="h-3 w-3" />
                                      <span>Verification instructions</span>
                                    </div>
                                    {field.key === "codeforces" && (
                                      <div>
                                        1. Open your Codeforces profile configurations page.<br />
                                        2. Set either your <strong className="text-foreground">First Name</strong>, <strong className="text-foreground">Last Name</strong>, or <strong className="text-foreground">Organization</strong> to:<br />
                                        <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/5 px-1 py-0.5 border border-primary/10">{profile?.verificationToken || "..."}</strong><br />
                                        3. Save profile updates on Codeforces and click Check Verification.
                                      </div>
                                    )}
                                    {field.key === "atcoder" && (
                                      <div>
                                        1. Open your AtCoder profile configurations page.<br />
                                        2. Set either your <strong className="text-foreground">Affiliation</strong> or <strong className="text-foreground">Self-Introduction</strong> to:<br />
                                        <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/5 px-1 py-0.5 border border-primary/10">{profile?.verificationToken || "..."}</strong><br />
                                        3. Save profile updates on AtCoder and click Check Verification.
                                      </div>
                                    )}
                                    {field.key === "leetcode" && (
                                      <div>
                                        1. Open your LeetCode profile configurations page.<br />
                                        2. Paste the token below anywhere inside your profile <strong className="text-foreground">Bio / Summary / About Me</strong>:<br />
                                        <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/5 px-1 py-0.5 border border-primary/10">{profile?.verificationToken || "..."}</strong><br />
                                        3. Save profile updates on LeetCode and click Check Verification.
                                      </div>
                                    )}
                                    {field.key === "codechef" && (
                                      <div>
                                        1. Open your CodeChef profile configurations page.<br />
                                        2. Set either your <strong className="text-foreground">Name</strong> or <strong className="text-foreground">About Me</strong> bio to:<br />
                                        <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/5 px-1 py-0.5 border border-primary/10">{profile?.verificationToken || "..."}</strong><br />
                                        3. Save profile updates on CodeChef and click Check Verification.
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => checkHandleVerification(field.key, verifyInputVal)}
                                    disabled={isCheckingVerify || !verifyInputVal.trim()}
                                    className="text-[9px] uppercase font-mono animate-pulse"
                                  >
                                    {isCheckingVerify ? (
                                      <span className="flex items-center gap-1.5">
                                        <Terminal className="h-3 w-3 animate-spin" />
                                        <span>checking...</span>
                                      </span>
                                    ) : (
                                      "Check Verification"
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      playClick();
                                      setVerifyingPlatform(null);
                                      setVerifyInputVal("");
                                    }}
                                    className="text-[9px] uppercase font-mono"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <Button
                        onClick={saveProfile}
                        disabled={saving}
                        className="font-mono text-xs uppercase tracking-wider h-9 border border-primary/20 hover:border-primary bg-primary/5 text-primary"
                      >
                        {saving ? (
                          <span className="flex items-center gap-2">
                            <Terminal className="h-3.5 w-3.5 animate-spin" />
                            Saving...
                          </span>
                        ) : (
                          "Save Settings"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Calendar Sync feed option panel */}
                  <div className="border border-border bg-card/35 backdrop-blur-md shadow-xl select-none">
                    <div className="px-4 py-2.5 border-b border-border/40 bg-muted/15 text-[10px] uppercase tracking-wider text-muted-foreground/45 font-bold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>Dynamic Calendar Sync Feed</span>
                    </div>
                    <div className="p-4 space-y-3.5">
                      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
                        Copy the personalized ICS feed link below and subscribe to it inside Google Calendar, Apple Calendar, or Outlook to automatically sync cp contests alerts.
                      </p>
                      
                      <Button
                        onClick={() => {
                          playClick();
                          copyCalendarLink();
                        }}
                        variant="outline"
                        className="font-mono text-xs uppercase tracking-wider border-primary/20 hover:border-primary text-primary"
                      >
                        <Copy className="h-3 w-3 mr-1.5" />
                        Copy calendar feed URL
                      </Button>

                      {/* Import Instructions */}
                      <div className="mt-4 pt-4 border-t border-border/20 text-[10px] text-muted-foreground/40 space-y-3 font-mono">
                        <div className="font-bold text-foreground uppercase tracking-widest text-[9px]">How to Subscribe / Import:</div>
                        
                        <div className="space-y-1">
                          <div className="text-primary font-bold">1. Google Calendar:</div>
                          <div className="pl-3 leading-relaxed">
                            Open Google Calendar (Web) &rarr; Click the <strong className="text-foreground/75 font-bold">+</strong> icon next to &ldquo;Other calendars&rdquo; &rarr; Select <strong className="text-foreground/75 font-bold">From URL</strong> &rarr; Paste the copied URL &rarr; Click <strong className="text-foreground/75 font-bold">Add calendar</strong>.
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-primary font-bold">2. Apple Calendar (macOS / iOS):</div>
                          <div className="pl-3 leading-relaxed">
                            Open Calendar app &rarr; Go to <strong className="text-foreground/75 font-bold">File &gt; New Calendar Subscription...</strong> &rarr; Paste the copied URL &rarr; Click <strong className="text-foreground/75 font-bold">Subscribe</strong>.
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-primary font-bold">3. Outlook Calendar:</div>
                          <div className="pl-3 leading-relaxed">
                            Go to Outlook Calendar &rarr; Click <strong className="text-foreground/75 font-bold">Add Calendar</strong> &rarr; Select <strong className="text-foreground/75 font-bold">Subscribe from web</strong> &rarr; Paste the copied URL &rarr; Choose a name &rarr; Click <strong className="text-foreground/75 font-bold">Import</strong>.
                          </div>
                        </div>

                        {/* Localhost Warning */}
                        {isLocalhost && (
                          <div className="mt-3 p-2.5 border border-warning/20 bg-warning/5 text-warning text-[9px] leading-relaxed select-text">
                            <strong className="uppercase font-bold block mb-1">[!] LOCALHOST LIMITATION:</strong>
                            Cloud calendar services (Google Calendar, Outlook Web) cannot fetch from a <code className="bg-warning/10 px-1 py-0.5 rounded font-mono">localhost</code> address. To test calendar syncing during local development, use a local client calendar app (like Apple Calendar or Windows Calendar) that runs on your local machine. Sync will work on Google/Outlook once the website is deployed to a public host (e.g. Vercel, Railway).
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Standard metadata fields */}
                  <div className="border border-border bg-card/35 backdrop-blur-md shadow-xl select-none">
                    <div className="px-4 py-2.5 border-b border-border/40 bg-muted/15 text-[10px] uppercase tracking-wider text-muted-foreground/45 font-bold flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-primary" />
                      <span>Account Information</span>
                    </div>
                    <div className="p-4 space-y-2 text-xs text-muted-foreground/45 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-muted-foreground/25">Username:</span>
                        <span className="text-foreground/70 font-bold">{user?.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-muted-foreground/25">Email:</span>
                        <span className="text-foreground/70 font-bold">{user?.email}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </main>

      </div>

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 font-mono min-h-screen text-foreground select-none flex items-center justify-center">
          <div className="text-xs text-muted-foreground/40 animate-pulse flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
