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
  Globe,
  Sparkles,
  Zap,
  Check,
  ShieldCheck,
  Cpu,
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
  status: "learning" | "implemented" | "mastered";
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
  templateSlug: string | null;
  templateTitle: string | null;
}

interface LikedTemplate {
  id: number;
  templateId: number;
  templateTitle: string;
  templateSlug: string;
  categoryName: string | null;
  likedAt: string;
  likeCount: number;
}

interface Profile {
  id: number;
  userId: number;
  codeforcesHandle: string | null;
  atcoderHandle: string | null;
  leetcodeHandle: string | null;
  codechefHandle: string | null;
  ratingGoal: number | null;
  verificationToken: string;
  isVerified: boolean;
  calendarToken?: string | null;
}

interface PlatformData {
  active: boolean;
  handle: string;
  rating: number | null;
  maxRating: number | null;
  rank: string | null;
  solved: number | null;
  contests: number | null;
  verified?: boolean;
}

interface HandlesStats {
  codeforces?: PlatformData;
  atcoder?: PlatformData;
  leetcode?: PlatformData;
  codechef?: PlatformData;
}

// Rating color styling per platform
const getRatingStyle = (platform: string, rating: number | null) => {
  if (rating === null) return { color: "var(--muted-foreground)" };
  switch (platform) {
    case "codeforces":
      if (rating < 1200) return { color: "#808080" }; // Newbie - Gray
      if (rating < 1400) return { color: "#008000" }; // Pupil - Green
      if (rating < 1600) return { color: "#03a89e" }; // Specialist - Cyan
      if (rating < 1900) return { color: "#0000ff" }; // Expert - Blue
      if (rating < 2100) return { color: "#aa00aa" }; // Candidate Master - Purple
      if (rating < 2300) return { color: "#ff8c00" }; // Master - Orange
      if (rating < 2400) return { color: "#ff8c00" }; // International Master - Orange
      return { color: "#ff0000" }; // Grandmaster+ - Red
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
    try {
      const res = await fetch("/api/users/profiles/verify-handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, handle: handle.trim() }),
      });
      const data = await res.json();
      setIsCheckingVerify(false);

      if (res.ok && data.verified) {
        toast.success(`${platform} handle verified and saved successfully!`);
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

        setCollections((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, name: data.collection.name, description: data.collection.description }
              : c
          )
        );

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

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview", label: "overview", icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
    { id: "templates", label: "my_templates", icon: <Library className="h-3.5 w-3.5" />, count: userTemplates.length },
    { id: "contributions", label: "contributions", icon: <GitPullRequest className="h-3.5 w-3.5" />, count: userContributions.length },
    { id: "liked", label: "liked", icon: <Heart className="h-3.5 w-3.5" />, count: likedTemplates.length },
    { id: "collections", label: "collections", icon: <FolderOpen className="h-3.5 w-3.5" />, count: collections.length },
    { id: "progress", label: "statistics", icon: <BarChart3 className="h-3.5 w-3.5" />, count: totalTracked },
    { id: "settings", label: "preferences", icon: <Settings className="h-3.5 w-3.5" /> },
  ];

  if (!user) return null;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 font-mono min-h-screen text-foreground select-none">
      
      {/* Decorative Radial glows behind dashboard content */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[140px] animate-glow-pulse" />
        <div className="absolute bottom-[20%] right-[-5%] w-[450px] h-[450px] rounded-full bg-info/4 blur-[130px] animate-glow-pulse-light" />
      </div>

      {/* Main Container Grid */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column Sidebar: Navigation & Diagnostics */}
        <aside className="w-full lg:w-64 shrink-0 space-y-5">
          
          {/* User console session overview widget */}
          <div className="border border-border bg-card/40 backdrop-blur-md p-4 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-primary/10 blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all duration-500" />
            <div className="flex items-center gap-3 mb-3.5 border-b border-border/40 pb-3">
              <div className="relative flex items-center justify-center h-10 w-10 border border-primary/40 bg-primary/10 text-primary shrink-0 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]">
                <User className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-foreground truncate tracking-wide">{user.username}</div>
                <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1 mt-0.5 font-bold">
                  <ShieldCheck className="h-3 w-3 text-success" />
                  <span>SESSION_ACTIVE</span>
                </div>
              </div>
            </div>

            {/* System variables */}
            <div className="space-y-2 text-[9.5px] text-muted-foreground/60 leading-relaxed font-mono">
              <div className="flex justify-between items-center bg-background/30 px-2 py-1 border border-border/30">
                <span className="text-muted-foreground/45">$ USER</span>
                <span className="text-primary font-bold">{user.username}</span>
              </div>
              <div className="flex justify-between items-center bg-background/30 px-2 py-1 border border-border/30">
                <span className="text-muted-foreground/45">$ STATUS</span>
                <span className="text-success font-bold flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5" /> 100% ONLINE
                </span>
              </div>
              <div className="flex justify-between items-center bg-background/30 px-2 py-1 border border-border/30">
                <span className="text-muted-foreground/45">$ CALENDAR</span>
                <span className={profile?.calendarToken ? "text-success font-bold" : "text-warning font-bold"}>
                  {profile?.calendarToken ? "LINKED" : "UNLINKED"}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Sidebar Tab Selectors */}
          <nav className="hidden lg:flex flex-col gap-1.5 border border-border bg-card/40 backdrop-blur-md p-3 shadow-2xl">
            <div className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-bold px-2.5 mb-1.5 flex items-center justify-between">
              <span>SYSTEM MENU</span>
              <Cpu className="h-3 w-3 text-primary/60" />
            </div>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => changeTab(tab.id)}
                  className={`w-full text-left px-3 py-2.5 border text-[11px] font-bold uppercase transition-all duration-200 flex items-center justify-between cursor-pointer group ${
                    isActive
                      ? "border-primary/60 bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.12)] border-l-4 border-l-primary"
                      : "border-transparent text-muted-foreground/50 hover:text-foreground hover:bg-card/40 hover:border-border/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? "text-primary" : "text-muted-foreground/40 group-hover:text-foreground"}>
                      {tab.icon}
                    </span>
                    <span className="tracking-wide">{tab.label}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span className={`text-[9px] px-1.5 py-0.2 border ${
                      isActive ? "border-primary/30 bg-primary/10 text-primary font-bold" : "border-border/40 text-muted-foreground/30"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile Tab Selectors (Horizontal layout) */}
          <div className="flex lg:hidden overflow-x-auto scrollbar-thin pb-2 border-b border-border/40 gap-2 select-none shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => changeTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 border text-[10px] tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "border-primary/50 bg-primary/10 text-primary font-bold shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]"
                      : "border-border bg-card/40 text-muted-foreground/50 hover:text-foreground hover:border-border/80"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[8px] opacity-60 font-bold">({tab.count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Column: Main Console Output Panel */}
        <main className="flex-1 min-w-0 space-y-6">
          
          {/* Header diagnostics banner */}
          <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/20 select-none">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5 shrink-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/70 shadow-[0_0_6px_rgba(234,179,8,0.4)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/70 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
                </div>
                <span className="text-[10.5px] uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>[ {user.username}@cp-base_console ]</span>
                </span>
              </div>
              <button
                onClick={() => {
                  playClick();
                  fetchData(true);
                }}
                className="text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer px-2.5 py-1 border border-border/40 bg-background/20 hover:border-primary/40 text-[9px] uppercase tracking-wider font-bold"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
                <span>SYNC DATA</span>
              </button>
            </div>
            
            <div className="px-4 py-3 text-[10.5px] text-muted-foreground/60 space-y-1.5 border-b border-primary/10 bg-black/25">
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold">{user.username}@cp-base:~$</span>
                <span className="text-foreground/90 font-bold">cat /sys/diagnostics --status</span>
                <span className="inline-block h-3 w-1.5 bg-primary animate-blink" />
              </div>
              <div className="text-foreground/75 leading-relaxed text-[11px]">
                System Online. Tracked: <span className="text-success font-bold">{masteredCount}</span> mastered,{" "}
                <span className="text-warning font-bold">{implementedCount}</span> implemented, and{" "}
                <span className="text-blue-400 font-bold">{learningCount}</span> active study templates.
              </div>
            </div>
          </div>

          {/* Loading Panel */}
          {loading ? (
            <div className="border border-border bg-card/40 backdrop-blur-md p-16 flex items-center justify-center shadow-2xl">
              <div className="flex items-center gap-3 text-xs text-muted-foreground/50 font-mono tracking-wider">
                <Terminal className="h-4 w-4 animate-spin text-primary" />
                <span>FETCHING_USER_DASHBOARD_DATA...</span>
              </div>
            </div>
          ) : (
            <>
              {/* ════ OVERVIEW TAB ════ */}
              {activeTab === "overview" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Stats Bento boxes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
                    {[
                      { label: "Learning", count: learningCount, color: "text-blue-400 border-blue-400/30 bg-blue-400/5", glow: "shadow-[0_0_15px_rgba(96,165,250,0.1)]", icon: <BookOpen className="h-4 w-4" /> },
                      { label: "Implemented", count: implementedCount, color: "text-warning border-warning/30 bg-warning/5", glow: "shadow-[0_0_15px_rgba(234,179,8,0.1)]", icon: <CheckCircle2 className="h-4 w-4" /> },
                      { label: "Mastered", count: masteredCount, color: "text-success border-success/30 bg-success/5", glow: "shadow-[0_0_15px_rgba(34,197,94,0.1)]", icon: <Award className="h-4 w-4" /> },
                      { label: "Collections", count: collections.length, color: "text-purple-400 border-purple-400/30 bg-purple-400/5", glow: "shadow-[0_0_15px_rgba(192,132,252,0.1)]", icon: <FolderOpen className="h-4 w-4" /> },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={`border bg-card/40 backdrop-blur-md p-4 transition-all duration-300 hover:-translate-y-1 ${stat.color} ${stat.glow} relative overflow-hidden group`}
                      >
                        <div className="flex items-center gap-2 mb-2 select-none opacity-90">
                          {stat.icon}
                          <span className="text-[10px] uppercase tracking-widest font-extrabold">{stat.label}</span>
                        </div>
                        <div className="text-3xl font-extrabold tracking-tight my-1">{stat.count}</div>
                        
                        {/* Micro Progress Bar */}
                        <div className="mt-3.5 h-[3px] bg-background/50 overflow-hidden border border-border/30">
                          <div
                            className="h-full bg-current transition-all duration-700 ease-out"
                            style={{ width: `${totalTracked > 0 ? (stat.count / totalTracked) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CP Profiles Diagnostics Integration Grid */}
                  {stats && (stats.codeforces?.active || stats.atcoder?.active || stats.leetcode?.active || stats.codechef?.active) ? (
                    <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl animate-fade-in">
                      <div className="px-4 py-3 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center justify-between select-none">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <span>Competitive Programming Live Stats</span>
                        </div>
                        <span className="text-[9px] text-success font-bold tracking-wider">LIVE_FEED</span>
                      </div>
                      
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: "codeforces", label: "Codeforces", data: stats.codeforces, color: "#ef4444" },
                          { key: "atcoder", label: "AtCoder", data: stats.atcoder, color: "#3b82f6" },
                          { key: "leetcode", label: "LeetCode", data: stats.leetcode, color: "#f97316" },
                          { key: "codechef", label: "CodeChef", data: stats.codechef, color: "#10b981" },
                        ].map((p) => {
                          if (!p.data?.active) return null;
                          const ratingStyle = getRatingStyle(p.key, p.data.rating);
                          return (
                            <div key={p.key} className="border border-border/70 bg-background/10 p-4 flex justify-between relative group hover:border-primary/40 transition-all duration-300 shadow-md">
                              <div className="space-y-3 flex-1 min-w-0">
                                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                                    <span className="text-xs uppercase font-extrabold text-foreground tracking-wide">{p.label}</span>
                                  </div>
                                  <a
                                    href={p.key === "codeforces" ? `https://codeforces.com/profile/${p.data.handle}` : p.key === "atcoder" ? `https://atcoder.jp/users/${p.data.handle}` : p.key === "leetcode" ? `https://leetcode.com/${p.data.handle}` : `https://www.codechef.com/users/${p.data.handle}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary font-bold hover:underline flex items-center gap-1 text-[10px]"
                                  >
                                    <span>@{p.data.handle}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                  </a>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                  <div className="bg-background/20 p-2 border border-border/30">
                                    <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider block font-mono">Rating</span>
                                    <span className="font-extrabold font-mono text-sm" style={ratingStyle}>{p.data.rating ?? "—"}</span>
                                  </div>
                                  <div className="bg-background/20 p-2 border border-border/30">
                                    <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider block font-mono">Rank</span>
                                    <span className="font-extrabold capitalize font-mono text-xs truncate block" style={ratingStyle}>{p.data.rank ?? "—"}</span>
                                  </div>
                                  <div className="bg-background/20 p-2 border border-border/30">
                                    <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider block font-mono">Solved</span>
                                    <span className="font-extrabold text-foreground font-mono text-sm">{p.data.solved ?? "—"}</span>
                                  </div>
                                  <div className="bg-background/20 p-2 border border-border/30">
                                    <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider block font-mono">Max Rating</span>
                                    <span className="font-extrabold text-foreground font-mono text-sm" style={ratingStyle}>{p.data.maxRating ?? "—"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-border/80 bg-card/40 backdrop-blur-md p-6 text-center text-xs text-muted-foreground/50 shadow-2xl select-none font-mono flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span>Link your Codeforces, AtCoder, LeetCode, or CodeChef handles to show live rating metrics.</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => changeTab("settings")}
                        className="font-mono text-[10px] uppercase font-bold px-3 h-7 cursor-pointer"
                      >
                        Link Handles
                      </Button>
                    </div>
                  )}

                </div>
              )}

              {/* ════ MY TEMPLATES TAB ════ */}
              {activeTab === "templates" && (
                <div className="space-y-5 animate-fade-in font-mono">
                  {/* Search Bar */}
                  <div className="border border-border bg-card/40 backdrop-blur-md p-4 shadow-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/45" />
                      <Input
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search custom snippets by title or language..."
                        className="font-mono text-xs bg-background/30 border-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/30 pl-9"
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold shrink-0">
                      {filteredTemplates.length} Custom Templates
                    </div>
                  </div>

                  {/* Grid layout */}
                  {filteredTemplates.length === 0 ? (
                    <div className="border border-border bg-card/40 backdrop-blur-md p-16 text-center space-y-4 shadow-2xl select-none font-mono">
                      <Library className="h-10 w-10 text-muted-foreground/20 mx-auto animate-pulse" />
                      <p className="text-xs text-muted-foreground/50 font-mono">No custom templates found matching query.</p>
                      <p className="text-[10px] text-muted-foreground/30 max-w-sm mx-auto">
                        Save custom code versions directly from any template page using the Personalization panel.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredTemplates.map((t) => (
                        <div
                          key={t.id}
                          className="border border-border bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between hover:border-primary/60 transition-all duration-300 group shadow-xl relative"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-widest text-primary/80 border border-primary/20 bg-primary/5 px-2 py-0.5 font-bold">
                                {t.language}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(t.customCode);
                                  playSuccess();
                                  toast.success("Snippet code copied!");
                                }}
                                className="text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer p-1"
                                title="Copy Custom Snippet"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <Link
                              href={`/template/${t.templateSlug}`}
                              onClick={playClick}
                              className="block text-sm font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug"
                            >
                              {t.templateTitle}
                            </Link>

                            <p className="text-[9px] text-muted-foreground/40 select-none">
                              Last Modified: {new Date(t.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="mt-5 pt-3.5 border-t border-border/30 flex items-center justify-between text-[10px] select-none text-muted-foreground/40 font-mono">
                            <span className="flex items-center gap-1.5">
                              <Code className="h-3.5 w-3.5 text-primary/60" />
                              <span>{t.templateSlug}</span>
                            </span>
                            <Link
                              href={`/template/${t.templateSlug}`}
                              onClick={playClick}
                              className="text-primary font-bold hover:underline flex items-center gap-1"
                            >
                              <span>Edit code</span>
                              <ChevronRight className="h-3.5 w-3.5" />
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
                <div className="space-y-5 animate-fade-in font-mono">
                  {userContributions.length === 0 ? (
                    <div className="border border-border bg-card/40 backdrop-blur-md p-16 text-center space-y-4 shadow-2xl select-none font-mono">
                      <GitPullRequest className="h-10 w-10 text-muted-foreground/20 mx-auto animate-pulse" />
                      <p className="text-xs text-muted-foreground/50 font-mono">No contributions submitted yet.</p>
                      <Link
                        href="/contribute"
                        onClick={playClick}
                        className="inline-flex items-center gap-2 border border-primary bg-primary text-primary-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-transparent hover:text-primary transition-all duration-300"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Submit a Template</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl divide-y divide-border/30">
                      <div className="px-4 py-3 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GitPullRequest className="h-4 w-4 text-primary" />
                          <span>Submission History ({userContributions.length})</span>
                        </div>
                        <Link
                          href="/contribute"
                          onClick={playClick}
                          className="inline-flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
                        >
                          <Plus className="h-3 w-3" />
                          <span>New Submission</span>
                        </Link>
                      </div>

                      {userContributions.map((c) => {
                        const label = c.templateTitle || c.title || "Untitled Contribution";
                        const statusColor =
                          c.status === "approved"
                            ? "text-success border-success/30 bg-success/10"
                            : c.status === "rejected"
                            ? "text-destructive border-destructive/30 bg-destructive/10"
                            : "text-warning border-warning/30 bg-warning/10";
                        return (
                          <div key={c.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-[9px] uppercase tracking-widest text-primary/80 border border-primary/20 bg-primary/5 px-2 py-0.5 font-bold select-none">
                                  {c.type === "new" ? "New Template" : "Edit Request"}
                                </span>
                                {c.status === "approved" && c.templateSlug ? (
                                  <Link
                                    href={`/template/${c.templateSlug}`}
                                    onClick={playClick}
                                    className="text-sm font-extrabold text-foreground hover:text-primary transition-colors truncate"
                                  >
                                    {label}
                                  </Link>
                                ) : (
                                  <span className="text-sm font-extrabold text-foreground truncate">{label}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground/40 font-mono select-none">
                                Submitted: {new Date(c.createdAt).toLocaleDateString()}
                                {c.reviewedAt && ` · Reviewed: ${new Date(c.reviewedAt).toLocaleDateString()}`}
                              </p>
                              {c.adminNote && (
                                <div className="text-[10.5px] text-muted-foreground/60 leading-relaxed border-l-2 border-primary/40 pl-3 bg-primary/5 p-2 border border-primary/10 select-text">
                                  <span className="text-primary font-bold uppercase tracking-wider text-[9px] block mb-0.5">Admin Review Feedback:</span>
                                  {c.adminNote}
                                </div>
                              )}
                            </div>
                            <span
                              className={`shrink-0 text-[10px] uppercase tracking-widest font-extrabold border px-3 py-1 select-none ${statusColor}`}
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
                <div className="space-y-5 animate-fade-in font-mono">
                  {likedTemplates.length === 0 ? (
                    <div className="border border-border bg-card/40 backdrop-blur-md p-16 text-center space-y-4 shadow-2xl select-none font-mono">
                      <Heart className="h-10 w-10 text-muted-foreground/20 mx-auto animate-pulse" />
                      <p className="text-xs text-muted-foreground/50 font-mono">No liked templates yet.</p>
                      <Link
                        href="/templates"
                        onClick={playClick}
                        className="inline-flex items-center gap-2 border border-primary bg-primary text-primary-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-transparent hover:text-primary transition-all duration-300"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Browse Templates</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {likedTemplates.map((t) => (
                        <div
                          key={t.id}
                          className="border border-border bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between hover:border-primary/60 transition-all duration-300 group shadow-xl"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-widest text-primary/80 border border-primary/20 bg-primary/5 px-2 py-0.5 font-bold">
                                {t.categoryName || "Uncategorized"}
                              </span>
                              <button
                                onClick={() => unlikeTemplate(t.templateId)}
                                disabled={unliking === t.templateId}
                                className="text-destructive/60 hover:text-destructive transition-colors cursor-pointer p-1 disabled:opacity-40"
                                title="Remove from Liked"
                              >
                                <Heart className="h-4 w-4 fill-current" />
                              </button>
                            </div>

                            <Link
                              href={`/template/${t.templateSlug}`}
                              onClick={playClick}
                              className="block text-sm font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug"
                            >
                              {t.templateTitle}
                            </Link>

                            <p className="text-[9px] text-muted-foreground/40 select-none">
                              Liked on: {new Date(t.likedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="mt-5 pt-3.5 border-t border-border/30 flex items-center justify-between text-[10px] select-none text-muted-foreground/40 font-mono">
                            <span className="flex items-center gap-1.5 text-primary font-bold">
                              <Heart className="h-3.5 w-3.5 fill-primary/20" />
                              <span>{t.likeCount} Likes</span>
                            </span>
                            <Link
                              href={`/template/${t.templateSlug}`}
                              onClick={playClick}
                              className="text-primary font-bold hover:underline flex items-center gap-1"
                            >
                              <span>Open Template</span>
                              <ChevronRight className="h-3.5 w-3.5" />
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
                <div className="space-y-6 animate-fade-in font-mono">
                  {activeCollection ? (
                    /* ── View Single Collection Detail ── */
                    <div className="space-y-6">
                      <div className="border border-border bg-card/40 backdrop-blur-md p-5 shadow-2xl font-mono">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4 mb-4">
                          <button
                            onClick={() => {
                              playClick();
                              setActiveCollection(null);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold w-fit cursor-pointer"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to all collections</span>
                          </button>
                          <div className="flex items-center gap-2">
                            {editingCollId !== activeCollection.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditCollection(activeCollection)}
                                className="font-mono text-[10px] uppercase h-7.5 px-3 border-border hover:border-primary/50 cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                Edit Details
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                deleteCollection(activeCollection.id);
                              }}
                              className="font-mono text-[10px] uppercase h-7.5 px-3 border-destructive/40 hover:bg-destructive/10 text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {editingCollId === activeCollection.id ? (
                          /* Edit Form inside detail view */
                          <div className="space-y-3 p-4 border border-primary/30 bg-primary/5">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Edit Collection Details</span>
                            </div>
                            <div className="space-y-2">
                              <Input
                                value={editCollName}
                                onChange={(e) => setEditCollName(e.target.value)}
                                placeholder="Collection Title..."
                                className="font-mono text-xs bg-background/50 border-primary/30"
                              />
                              <Input
                                value={editCollDesc}
                                onChange={(e) => setEditCollDesc(e.target.value)}
                                placeholder="Collection Description (optional)..."
                                className="font-mono text-xs bg-background/50 border-primary/30"
                              />
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditCollection}
                                className="font-mono text-xs uppercase h-7.5 cursor-pointer"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                disabled={savingCollEdit || !editCollName.trim()}
                                onClick={() => saveCollectionEdit(activeCollection.id)}
                                className="font-mono text-xs uppercase h-7.5 cursor-pointer"
                              >
                                <Save className="h-3.5 w-3.5 mr-1.5" />
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
                            <h3 className="text-xl font-extrabold text-foreground tracking-wide">{activeCollection.name}</h3>
                            <p className="text-xs text-muted-foreground/75 leading-relaxed max-w-2xl">
                              {activeCollection.description || "No description provided for this collection."}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Collection Items List */}
                      <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl font-mono">
                        <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center gap-2">
                            <Library className="h-4 w-4 text-primary" />
                            <span>Templates in this collection ({collectionItems.length})</span>
                          </div>
                        </div>

                        {loadingCollItems ? (
                          <div className="p-12 text-center text-xs text-muted-foreground/40 animate-pulse">
                            Loading collection templates...
                          </div>
                        ) : collectionItems.length === 0 ? (
                          <div className="p-12 text-center space-y-2 text-xs text-muted-foreground/40 select-none">
                            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/20" />
                            <p className="font-bold">No templates added to this collection yet.</p>
                            <p className="text-[10px] text-muted-foreground/30 max-w-xs mx-auto">
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
                                  className="flex items-center gap-2.5 text-xs font-extrabold text-foreground/90 group-hover:text-primary transition-colors flex-1"
                                >
                                  <Code className="h-4 w-4 text-primary/60 group-hover:text-primary" />
                                  <span>{item.templateTitle}</span>
                                  <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                                </Link>
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/45">
                                  <span className="hidden sm:inline">
                                    Added {new Date(item.addedAt).toLocaleDateString()}
                                  </span>
                                  <button
                                    onClick={() => removeItemFromCollection(activeCollection.id, item.templateId)}
                                    className="text-muted-foreground/30 hover:text-destructive transition-colors p-1 cursor-pointer"
                                    title="Remove from collection"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
                      <div className="border border-border bg-card/40 backdrop-blur-md p-5 shadow-2xl font-mono">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold mb-3 flex items-center gap-2 select-none">
                          <Plus className="h-4 w-4 text-primary" />
                          <span>New Collection Setup</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <Input
                            value={newCollName}
                            onChange={(e) => setNewCollName(e.target.value)}
                            placeholder="Collection title (e.g., Graph Algorithms)..."
                            className="font-mono text-xs bg-background/30 border-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/30 flex-1 h-9"
                          />
                          <Input
                            value={newCollDesc}
                            onChange={(e) => setNewCollDesc(e.target.value)}
                            placeholder="Description (optional)..."
                            className="font-mono text-xs bg-background/30 border-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/30 flex-1 h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") createCollection();
                            }}
                          />
                          <Button
                            onClick={createCollection}
                            disabled={creatingColl || !newCollName.trim()}
                            className="font-mono text-xs uppercase tracking-wider h-9 shrink-0 cursor-pointer"
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Create
                          </Button>
                        </div>
                      </div>

                      {/* Collections Card Grid */}
                      {collections.length === 0 ? (
                        <div className="border border-border bg-card/40 backdrop-blur-md p-16 text-center space-y-4 shadow-2xl select-none font-mono">
                          <FolderOpen className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                          <p className="text-xs text-muted-foreground/50 font-mono">No collections initialized yet.</p>
                          <p className="text-[10px] text-muted-foreground/30 max-w-sm mx-auto leading-relaxed">
                            Create a collection directory above. Group and organize custom templates easily.
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 select-none font-mono">
                          {collections.map((c) => (
                            <div
                              key={c.id}
                              className="border border-border/80 bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between hover:border-primary/60 transition-all duration-300 group shadow-xl"
                            >
                              {editingCollId === c.id ? (
                                /* Edit inline form */
                                <div className="space-y-3">
                                  <div className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span>Edit Collection</span>
                                  </div>
                                  <Input
                                    value={editCollName}
                                    onChange={(e) => setEditCollName(e.target.value)}
                                    placeholder="Collection Name..."
                                    className="font-mono text-xs bg-background/50 border-primary/30"
                                  />
                                  <Input
                                    value={editCollDesc}
                                    onChange={(e) => setEditCollDesc(e.target.value)}
                                    placeholder="Description (optional)..."
                                    className="font-mono text-xs bg-background/50 border-primary/30"
                                  />
                                  <div className="flex gap-2 justify-end pt-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={cancelEditCollection}
                                      className="font-mono text-[10px] uppercase h-7 px-2.5 cursor-pointer"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={savingCollEdit || !editCollName.trim()}
                                      onClick={() => saveCollectionEdit(c.id)}
                                      className="font-mono text-[10px] uppercase h-7 px-2.5 cursor-pointer"
                                    >
                                      <Save className="h-3.5 w-3.5 mr-1" />
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
                                      <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider text-primary/80 font-bold font-mono">
                                        <FolderOpen className="h-3.5 w-3.5 text-primary" />
                                        <span>~/collections/{c.name.toLowerCase().replace(/\s+/g, "_")}</span>
                                      </div>
                                      <span className="text-[10px] text-primary group-hover:underline flex items-center gap-1 font-bold">
                                        Open <ChevronRight className="h-3.5 w-3.5" />
                                      </span>
                                    </div>

                                    <h4 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                                      {c.name}
                                    </h4>

                                    <p className="text-[10.5px] text-muted-foreground/60 leading-relaxed font-mono line-clamp-2">
                                      {c.description || "No description provided."}
                                    </p>
                                  </div>

                                  <div className="mt-5 pt-3.5 border-t border-border/30 flex items-center justify-between text-[10px] select-none text-muted-foreground/40 font-mono">
                                    <button
                                      onClick={() => openCollection(c)}
                                      className="bg-primary/10 border border-primary/30 px-2.5 py-1 text-primary text-[9px] font-bold uppercase hover:bg-primary/20 transition-colors cursor-pointer"
                                    >
                                      {Number(c.itemCount || 0)} items
                                    </button>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => startEditCollection(c, e)}
                                        className="text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer p-1"
                                        title="Rename or edit description"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          playClick();
                                          deleteCollection(c.id);
                                        }}
                                        className="text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer p-1"
                                        title="Delete collection"
                                      >
                                        <Trash2 className="h-4 w-4" />
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
                <div className="space-y-6 animate-fade-in font-mono">
                  
                  {/* Radial ring & status summary details */}
                  <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* SVG Radial Mastery Score */}
                    <div className="border border-border bg-card/40 backdrop-blur-md p-6 shadow-2xl flex flex-col items-center justify-center font-mono select-none md:col-span-1">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold mb-4 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>Readiness Score</span>
                      </div>
                      <div className="relative flex items-center justify-center h-32 w-32 mb-4">
                        <svg className="h-full w-full transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="54"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="10"
                            fill="transparent"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="54"
                            stroke="#22c55e"
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={339.29}
                            strokeDashoffset={339.29 - (339.29 * (masteredCount / Math.max(totalTracked, 1)))}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <div className="text-2xl font-extrabold text-foreground tracking-tight">
                            {totalTracked > 0 ? Math.round((masteredCount / totalTracked) * 100) : 0}%
                          </div>
                          <div className="text-[8px] text-muted-foreground/50 uppercase tracking-widest font-bold">MASTERY</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground/50 text-center font-bold">
                        {masteredCount} of {totalTracked} algorithms mastered
                      </div>
                    </div>

                    {/* Progress details stats grid */}
                    <div className="border border-border bg-card/40 backdrop-blur-md p-6 shadow-2xl flex flex-col justify-between font-mono select-none md:col-span-2">
                      <div className="space-y-4">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center justify-between">
                          <span>Implementation Pipeline Summary</span>
                          <span className="text-primary">{totalTracked} Total Tracked</span>
                        </div>
                        
                        <div className="space-y-3.5 pt-2">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-success uppercase">Mastered</span>
                              <span>{masteredCount} / {totalTracked}</span>
                            </div>
                            <div className="h-2 bg-background/40 border border-border p-0.5">
                              <div className="h-full bg-success transition-all duration-700" style={{ width: `${totalTracked > 0 ? (masteredCount / totalTracked) * 100 : 0}%` }} />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-warning uppercase">Implemented</span>
                              <span>{implementedCount} / {totalTracked}</span>
                            </div>
                            <div className="h-2 bg-background/40 border border-border p-0.5">
                              <div className="h-full bg-warning transition-all duration-700" style={{ width: `${totalTracked > 0 ? (implementedCount / totalTracked) * 100 : 0}%` }} />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-blue-400 uppercase">Learning</span>
                              <span>{learningCount} / {totalTracked}</span>
                            </div>
                            <div className="h-2 bg-background/40 border border-border p-0.5">
                              <div className="h-full bg-blue-400 transition-all duration-700" style={{ width: `${totalTracked > 0 ? (learningCount / totalTracked) * 100 : 0}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-[9px] text-muted-foreground/40 border-t border-border/30 pt-3 flex justify-between uppercase font-bold">
                        <span>Status DB Synced</span>
                        <span className="text-primary">AUTOMATIC</span>
                      </div>
                    </div>

                  </div>

                  {/* List of Tracked templates */}
                  <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl">
                    <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between select-none">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span>Tracked Algorithms ({progress.length})</span>
                      </div>
                      
                      {/* Filter Controls */}
                      <div className="flex gap-1.5">
                        {["all", "mastered", "implemented", "learning"].map((sf) => (
                          <button
                            key={sf}
                            onClick={() => {
                              playClick();
                              setStatusFilter(sf as typeof statusFilter);
                            }}
                            className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold border transition-all cursor-pointer ${
                              statusFilter === sf
                                ? "border-primary/60 bg-primary/10 text-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.15)]"
                                : "border-border/50 text-muted-foreground/40 hover:text-foreground hover:border-border"
                            }`}
                          >
                            {sf}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {progress.length === 0 ? (
                      <div className="p-12 text-center text-xs text-muted-foreground/40 font-mono select-none">
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
                              className="flex items-center justify-between px-4 py-3.5 hover:bg-primary/5 transition-colors group"
                            >
                              <span className="text-xs font-bold text-foreground/90 group-hover:text-primary transition-colors">
                                {p.templateTitle}
                              </span>
                              <span
                                className={`text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 border ${
                                  p.status === "mastered"
                                    ? "text-success border-success/30 bg-success/10"
                                    : p.status === "implemented"
                                    ? "text-warning border-warning/30 bg-warning/10"
                                    : "text-blue-400 border-blue-400/30 bg-blue-400/10"
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
                <div className="space-y-6 animate-fade-in font-mono">
                  
                  {/* Platform Verification Settings panel */}
                  <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl">
                    <div className="px-4 py-3 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center gap-2 select-none">
                      <Settings className="h-4 w-4 text-primary" />
                      <span>Handle Verification & Linking</span>
                    </div>
                    
                    <div className="p-5 space-y-4">
                      {[
                        { key: "codeforces", label: "Codeforces", handle: cfHandle, color: "text-red-400 border-red-400/30 bg-red-400/10" },
                        { key: "atcoder", label: "AtCoder", handle: acHandle, color: "text-zinc-400 border-zinc-400/30 bg-zinc-400/10" },
                        { key: "leetcode", label: "LeetCode", handle: lcHandle, color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
                        { key: "codechef", label: "CodeChef", handle: ccHandle, color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
                      ].map((field) => {
                        const isVerifying = verifyingPlatform === field.key;
                        return (
                          <div key={field.key} className="border border-border/60 p-4 bg-background/20 space-y-3">
                            <div className="flex justify-between items-center select-none">
                              <Label className="text-[10.5px] uppercase tracking-widest text-foreground font-extrabold">
                                {field.label}
                              </Label>
                              {field.handle ? (
                                <span className={`text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 border ${field.color}`}>
                                  Linked: @{field.handle}
                                </span>
                              ) : (
                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 border border-border/40 bg-card/30 px-2 py-0.5 font-bold">
                                  Unlinked
                                </span>
                              )}
                            </div>

                            {!isVerifying ? (
                              <div className="flex items-center justify-between select-none pt-1">
                                <span className="text-[10.5px] text-muted-foreground/50">
                                  {field.handle ? "Modify linked profile username handle" : "Link and verify profile for live metrics"}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    playClick();
                                    setVerifyingPlatform(field.key);
                                    setVerifyInputVal(field.handle || "");
                                  }}
                                  className="text-[9.5px] uppercase h-7 font-extrabold font-mono border-primary/30 hover:border-primary text-primary cursor-pointer"
                                >
                                  {field.handle ? "Modify" : "Verify Handle"}
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4 pt-3 border-t border-border/30">
                                <div className="space-y-1.5">
                                  <Label className="text-[9.5px] uppercase tracking-wider text-muted-foreground/60 font-bold">
                                    Enter {field.label} username handle
                                  </Label>
                                  <Input
                                    value={verifyInputVal}
                                    onChange={(e) => setVerifyInputVal(e.target.value)}
                                    placeholder={`Enter handle (e.g. ${field.label === "LeetCode" ? "Mohamediibra7im" : "Midoriya"})`}
                                    className="font-mono text-xs bg-background/40 border-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/30"
                                  />
                                </div>

                                {verifyInputVal.trim() && (
                                  <div className="p-3.5 bg-primary/5 border border-primary/20 text-[10.5px] text-muted-foreground/60 space-y-2 leading-relaxed">
                                    <div className="font-bold text-primary uppercase select-none flex items-center gap-1.5 text-[10px]">
                                      <Terminal className="h-3.5 w-3.5" />
                                      <span>Verification Steps for {field.label}</span>
                                    </div>
                                    {field.key === "codeforces" && (
                                      <div>
                                        1. Open Codeforces profile settings.<br />
                                        2. Set First Name or Organization to:<br />
                                        <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/10 px-1.5 py-0.5 border border-primary/20">{profile?.verificationToken || "..."}</strong><br />
                                        3. Save on Codeforces and click Check Verification below.
                                      </div>
                                    )}
                                    {field.key === "atcoder" && (
                                      <div>
                                        1. Open AtCoder profile settings.<br />
                                        2. Set Affiliation or Bio to:<br />
                                        <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/10 px-1.5 py-0.5 border border-primary/20">{profile?.verificationToken || "..."}</strong><br />
                                        3. Save on AtCoder and click Check Verification.
                                      </div>
                                    )}
                                    {field.key === "leetcode" && (
                                      <div>
                                        1. Open LeetCode profile settings.<br />
                                        2. Paste token in About Me / Bio:<br />
                                        <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/10 px-1.5 py-0.5 border border-primary/20">{profile?.verificationToken || "..."}</strong><br />
                                        3. Save on LeetCode and click Check Verification.
                                      </div>
                                    )}
                                    {field.key === "codechef" && (
                                      <div>
                                        1. Open CodeChef profile settings.<br />
                                        2. Set Name or Bio to:<br />
                                        <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/10 px-1.5 py-0.5 border border-primary/20">{profile?.verificationToken || "..."}</strong><br />
                                        3. Save on CodeChef and click Check Verification.
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => checkHandleVerification(field.key, verifyInputVal)}
                                    disabled={isCheckingVerify || !verifyInputVal.trim()}
                                    className="text-[9.5px] uppercase font-bold font-mono cursor-pointer"
                                  >
                                    {isCheckingVerify ? (
                                      <span className="flex items-center gap-1.5">
                                        <Terminal className="h-3.5 w-3.5 animate-spin" />
                                        <span>Checking...</span>
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
                                    className="text-[9.5px] uppercase font-mono cursor-pointer"
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
                        className="font-mono text-xs uppercase font-extrabold tracking-wider h-9.5 border border-primary/30 hover:border-primary bg-primary/10 text-primary cursor-pointer w-full"
                      >
                        {saving ? (
                          <span className="flex items-center justify-center gap-2">
                            <Terminal className="h-4 w-4 animate-spin" />
                            Saving Preferences...
                          </span>
                        ) : (
                          "Save Profile Handles"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Calendar Sync feed option panel */}
                  <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl select-none">
                    <div className="px-4 py-3 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Dynamic Calendar Sync Feed</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <p className="text-xs text-muted-foreground/60 leading-relaxed">
                        Subscribe to your personalized ICS feed to automatically sync CP contest alerts with Google Calendar, Apple Calendar, or Outlook.
                      </p>
                      
                      <Button
                        onClick={() => {
                          playClick();
                          copyCalendarLink();
                        }}
                        variant="outline"
                        className="font-mono text-xs uppercase font-bold tracking-wider border-primary/30 hover:border-primary text-primary cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5 mr-2" />
                        Copy Calendar Feed URL
                      </Button>

                      {/* Import Instructions */}
                      <div className="mt-4 pt-4 border-t border-border/30 text-[10.5px] text-muted-foreground/50 space-y-3 font-mono">
                        <div className="font-extrabold text-foreground uppercase tracking-widest text-[9.5px]">Calendar Subscription Setup:</div>
                        
                        <div className="space-y-1">
                          <div className="text-primary font-bold">1. Google Calendar:</div>
                          <div className="pl-3 leading-relaxed">
                            Web Calendar &rarr; Click <strong className="text-foreground font-bold">+</strong> next to &ldquo;Other calendars&rdquo; &rarr; Select <strong className="text-foreground font-bold">From URL</strong> &rarr; Paste copied URL &rarr; Add calendar.
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-primary font-bold">2. Apple Calendar (macOS / iOS):</div>
                          <div className="pl-3 leading-relaxed">
                            Calendar App &rarr; <strong className="text-foreground font-bold">File &gt; New Calendar Subscription...</strong> &rarr; Paste copied URL &rarr; Subscribe.
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-primary font-bold">3. Outlook Calendar:</div>
                          <div className="pl-3 leading-relaxed">
                            Outlook Calendar &rarr; <strong className="text-foreground font-bold">Add Calendar</strong> &rarr; <strong className="text-foreground font-bold">Subscribe from web</strong> &rarr; Paste copied URL &rarr; Import.
                          </div>
                        </div>

                        {/* Localhost Warning */}
                        {isLocalhost && (
                          <div className="mt-3 p-3 border border-warning/30 bg-warning/10 text-warning text-[10px] leading-relaxed select-text font-mono">
                            <strong className="uppercase font-extrabold block mb-1">[!] LOCALHOST NOTE:</strong>
                            Cloud web services (Google Calendar, Outlook Web) cannot reach <code className="bg-warning/20 px-1 py-0.5 font-bold">localhost</code> URLs directly. Test with local client apps (Apple Calendar / Windows Calendar) during development. Sync works seamlessly once deployed to public hosting.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Standard metadata fields */}
                  <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl select-none">
                    <div className="px-4 py-3 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-primary" />
                      <span>Account Information</span>
                    </div>
                    <div className="p-5 space-y-3 text-xs text-muted-foreground/60 font-mono">
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-muted-foreground/35 uppercase font-bold">Username:</span>
                        <span className="text-foreground font-extrabold">{user?.username}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-muted-foreground/35 uppercase font-bold">Email:</span>
                        <span className="text-foreground font-extrabold">{user?.email}</span>
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
