"use client";

import { useState, useEffect, useCallback, Suspense, CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useTerminalTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Library,
  GitPullRequest,
  Heart,
  FolderOpen,
  BarChart3,
  Settings,
  Terminal,
} from "lucide-react";

import {
  Tab,
  ProgressItem,
  UserTemplate,
  Collection,
  CollectionItem,
  Contribution,
  LikedTemplate,
  Profile,
  HandlesStats,
} from "./_components/types";
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { OverviewTab } from "./_components/overview-tab";
import { TemplatesTab } from "./_components/templates-tab";
import { ContributionsTab } from "./_components/contributions-tab";
import { LikedTab } from "./_components/liked-tab";
import { CollectionsTab } from "./_components/collections-tab";
import { ProgressTab } from "./_components/progress-tab";
import { SettingsTab } from "./_components/settings-tab";

// Rating color styling per platform
const getRatingStyle = (platform: string, rating: number | null): CSSProperties => {
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

  // Profile Settings form
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [cfHandle, setCfHandle] = useState("");
  const [acHandle, setAcHandle] = useState("");
  const [lcHandle, setLcHandle] = useState("");
  const [ccHandle, setCcHandle] = useState("");
  const [saving, setSaving] = useState(false);

  // New collection form
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

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

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
  const fetchData = useCallback(
    async (forceRefresh = false) => {
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
            setDisplayName(d.profile.name || "");
            setBio(d.profile.bio || "");
            setAvatarUrl(d.profile.avatarUrl || "");
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

      fetchHandlesStats(forceRefresh);
    },
    [fetchHandlesStats]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          name: displayName,
          bio: bio,
          avatarUrl: avatarUrl,
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
      toast.error("Failed to update profile");
      playBeep(220, 0.3);
    } finally {
      setSaving(false);
    }
  };

  const updateRatingGoal = async (newGoal: string | null) => {
    const goalValue = newGoal?.trim() || null;
    try {
      const res = await fetch("/api/users/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratingGoal: goalValue,
        }),
      });
      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, ratingGoal: goalValue } : prev));
        toast.success(goalValue ? "Goal updated" : "Goal cleared");
        playSuccess();
      } else {
        toast.error("Failed to update goal");
      }
    } catch {
      toast.error("Failed to update goal");
    }
  };

  const checkHandleVerification = async (platform: string, handle: string) => {
    try {
      const res = await fetch("/api/users/profiles/verify-handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, handle }),
      });
      const data = await res.json();

      if (res.ok && data.verified) {
        toast.success(`${platform} handle verified and saved successfully!`);
        playSuccess();
        fetchData(true);
      } else {
        toast.error(data.error || "Verification failed. Please ensure the token is set on your profile.");
        playBeep(220, 0.4);
      }
    } catch {
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

  const createCollection = async (name: string, description?: string) => {
    setCreatingColl(true);
    try {
      const res = await fetch("/api/users/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Collection created");
        playSuccess();
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

  const learningCount = progress.filter((p) => p.status === "learning").length;
  const implementedCount = progress.filter((p) => p.status === "implemented").length;
  const masteredCount = progress.filter((p) => p.status === "mastered").length;
  const totalTracked = progress.length;

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
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[140px] animate-glow-pulse" />
        <div className="absolute bottom-[20%] right-[-5%] w-[450px] h-[450px] rounded-full bg-info/4 blur-[130px] animate-glow-pulse-light" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row gap-6">
        <DashboardSidebar
          username={user.username}
          displayName={displayName}
          avatarUrl={avatarUrl}
          bio={bio}
          ratingGoal={profile?.ratingGoal}
          activeTab={activeTab}
          tabs={tabs}
          onChangeTab={changeTab}
          onUpdateRatingGoal={updateRatingGoal}
        />

        <main className="flex-1 min-w-0 space-y-6">
          <DashboardHeader
            username={user.username}
            loading={loading}
            masteredCount={masteredCount}
            implementedCount={implementedCount}
            learningCount={learningCount}
            onRefresh={() => {
              playClick();
              fetchData(true);
            }}
          />

          {loading ? (
            <div className="border border-border bg-card/40 backdrop-blur-md p-16 flex items-center justify-center shadow-2xl">
              <div className="flex items-center gap-3 text-xs text-muted-foreground/50 font-mono tracking-wider">
                <Terminal className="h-4 w-4 animate-spin text-primary" />
                <span>FETCHING_USER_DASHBOARD_DATA...</span>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <OverviewTab
                  learningCount={learningCount}
                  implementedCount={implementedCount}
                  masteredCount={masteredCount}
                  collectionsCount={collections.length}
                  totalTracked={totalTracked}
                  stats={stats}
                  getRatingStyle={getRatingStyle}
                  onChangeTab={changeTab}
                />
              )}

              {activeTab === "templates" && (
                <TemplatesTab
                  userTemplates={userTemplates}
                  playClick={playClick}
                  playSuccess={playSuccess}
                  onToastSuccess={(msg) => toast.success(msg)}
                />
              )}

              {activeTab === "contributions" && (
                <ContributionsTab userContributions={userContributions} playClick={playClick} />
              )}

              {activeTab === "liked" && (
                <LikedTab
                  likedTemplates={likedTemplates}
                  unliking={unliking}
                  playClick={playClick}
                  onUnlikeTemplate={unlikeTemplate}
                />
              )}

              {activeTab === "collections" && (
                <CollectionsTab
                  collections={collections}
                  activeCollection={activeCollection}
                  collectionItems={collectionItems}
                  loadingCollItems={loadingCollItems}
                  creatingColl={creatingColl}
                  editingCollId={editingCollId}
                  editCollName={editCollName}
                  editCollDesc={editCollDesc}
                  savingCollEdit={savingCollEdit}
                  playClick={playClick}
                  onOpenCollection={openCollection}
                  onBackToCollections={() => {
                    playClick();
                    setActiveCollection(null);
                  }}
                  onCreateCollection={createCollection}
                  onStartEditCollection={startEditCollection}
                  onCancelEditCollection={cancelEditCollection}
                  onSaveCollectionEdit={saveCollectionEdit}
                  onDeleteCollection={deleteCollection}
                  onRemoveItemFromCollection={removeItemFromCollection}
                  setEditCollName={setEditCollName}
                  setEditCollDesc={setEditCollDesc}
                />
              )}

              {activeTab === "progress" && (
                <ProgressTab
                  progress={progress}
                  masteredCount={masteredCount}
                  implementedCount={implementedCount}
                  learningCount={learningCount}
                  totalTracked={totalTracked}
                  playClick={playClick}
                />
              )}

              {activeTab === "settings" && (
                <SettingsTab
                  displayName={displayName}
                  bio={bio}
                  avatarUrl={avatarUrl}
                  cfHandle={cfHandle}
                  acHandle={acHandle}
                  lcHandle={lcHandle}
                  ccHandle={ccHandle}
                  saving={saving}
                  profile={profile}
                  username={user.username}
                  email={user.email}
                  isLocalhost={isLocalhost}
                  playClick={playClick}
                  onSaveProfile={saveProfile}
                  onCheckHandleVerification={checkHandleVerification}
                  onCopyCalendarLink={copyCalendarLink}
                  setDisplayName={setDisplayName}
                  setBio={setBio}
                  setAvatarUrl={setAvatarUrl}
                  setCfHandle={setCfHandle}
                  setAcHandle={setAcHandle}
                  setLcHandle={setLcHandle}
                  setCcHandle={setCcHandle}
                />
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
