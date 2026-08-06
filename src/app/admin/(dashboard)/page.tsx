"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, LogOut, Terminal, FolderOpen, Folder, Upload } from "lucide-react";
import { toast } from "sonner";
import { useTerminalTheme } from "@/components/theme-provider";
import { RetroConfirmModal, RetroModal } from "@/components/terminal";
import { TemplateFileTable } from "./_components/template-file-table";
import { CategoriesTab } from "./_components/categories-tab";
import { SectionsTab } from "./_components/sections-tab";
import { StatsTab } from "./_components/stats-tab";
import { ContributionsTab } from "./_components/contributions-tab";
import { UsersTab } from "./_components/users-tab";

interface Template {
  id: number;
  title: string;
  slug: string;
  tags: string[];
  hidden: boolean;
  categoryId: number;
  category?: { name: string; slug: string };
  createdAt: string;
  copyCount: number;
  likeCount: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  order: number;
  hidden: boolean;
}

interface Contribution {
  id: number;
  type: "new" | "edit";
  status: "pending" | "approved" | "rejected" | "changes_requested";
  contributorName: string;
  contributorEmail: string;
  contributorCfHandle: string | null;
  title: string | null;
  slug: string | null;
  description: string | null;
  categoryId: number | null;
  tags: string[] | null;
  complexity: string | null;
  notes: string | null;
  codes: { language: string; code: string }[] | null;
  templateId: number | null;
  editReason: string | null;
  editCodes: { language: string; code: string }[] | null;
  editNotes: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  category?: { name: string };
  template?: { title: string; slug: string };
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  calendarToken: string | null;
  codeforcesHandle: string | null;
  atcoderHandle: string | null;
  leetcodeHandle: string | null;
  codechefHandle: string | null;
}

interface CategoryModalState {
  open: boolean;
  isEdit: boolean;
  id?: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  hidden: boolean;
}

// Shape of a template object parsed from an uploaded bulk-import JSON file.
// Fields are all optional since the file is user-supplied and validated at use.
interface ImportItem {
  title?: string;
  slug?: string;
  description?: string;
  categoryId?: number | string;
  categorySlug?: string;
  tags?: string[] | string;
  notes?: string;
  codes?: { language: string; code: string }[];
  code?: string;
  language?: string;
  hidden?: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"templates" | "categories" | "sections" | "stats" | "contributions" | "users">("templates");
  
  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUser | null>(null);

  // Templates State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string | number, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    open: boolean;
    total: number;
    successCount: number;
    failedCount: number;
    items: {
      title: string;
      slug: string;
      categoryName: string;
      status: "success" | "error";
      reason?: string;
    }[];
  } | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    total: number;
    current: number;
    currentName: string;
    loading: boolean;
  } | null>(null);

  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);
  
  // Category Modal State
  const [categoryModal, setCategoryModal] = useState<CategoryModalState | null>(null);

  // Homepage Sections State
  const [sections, setSections] = useState({
    show_hero_section: true,
    show_contests_section: true,
    show_categories_section: true,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Contributions State
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loadingContributions, setLoadingContributions] = useState(true);
  const [contribFilter, setContribFilter] = useState<"all" | "pending" | "approved" | "rejected" | "changes_requested">("all");
  const [expandedContribution, setExpandedContribution] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; adminNote: string } | null>(null);
  const [requestChangesModal, setRequestChangesModal] = useState<{ id: number; adminNote: string } | null>(null);
  const [deleteContribTarget, setDeleteContribTarget] = useState<Contribution | null>(null);

  const { playClick, playBeep, playSuccess } = useTerminalTheme();

  // Fetch functions
  const fetchTemplates = async () => {
    const res = await fetch("/api/admin/templates");
    if (res.ok) setTemplates(await res.json());
    setLoadingTemplates(false);
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) setCategories(await res.json());
    setLoadingCategories(false);
  };

  const fetchSettings = async () => {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = await res.json();
      setSections({
        show_hero_section: data.show_hero_section !== "false",
        show_contests_section: data.show_contests_section !== "false",
        show_categories_section: data.show_categories_section !== "false",
      });
    }
    setLoadingSettings(false);
  };

  const fetchContributions = async () => {
    const res = await fetch("/api/admin/contributions");
    if (res.ok) setContributions(await res.json());
    setLoadingContributions(false);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoadingUsers(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTemplates();
    fetchCategories();
    fetchSettings();
    fetchContributions();
    fetchUsers();
  }, []);

  // Templates action handlers
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    playClick();
    const id = deleteTarget.id;
    setDeleteTarget(null);
    const res = await fetch(`/api/admin/templates?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      playSuccess();
      toast.success("Template file purged successfully");
      fetchTemplates();
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to delete template file");
    }
  };

  const toggleTemplateVisibility = async (tpl: Template) => {
    playClick();
    const newHidden = !tpl.hidden;
    const res = await fetch("/api/admin/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: tpl.id,
        hidden: newHidden,
      }),
    });
    if (res.ok) {
      playSuccess();
      toast.success(`Template ${newHidden ? "hidden" : "visible"}`);
      fetchTemplates();
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to update visibility");
    }
  };

  const bulkToggleVisibility = async () => {
    playClick();
    const selectedList = templates.filter((t) => selectedIds[t.id]);
    if (selectedList.length === 0) return;

    setBulkLoading(true);
    try {
      const promises = selectedList.map(async (tpl) => {
        return fetch("/api/admin/templates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: tpl.id,
            hidden: !tpl.hidden,
          }),
        });
      });

      await Promise.all(promises);
      toast.success(`Updated visibility for ${selectedList.length} templates`);
      setSelectedIds({});
      fetchTemplates();
    } catch {
      toast.error("Failed to update template visibilities in bulk");
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkDelete = () => {
    playBeep(330, 0.25);
    const selectedList = templates.filter((t) => selectedIds[t.id]);
    if (selectedList.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    playClick();
    const selectedList = templates.filter((t) => selectedIds[t.id]);
    if (selectedList.length === 0) return;

    setBulkLoading(true);
    setShowBulkDeleteConfirm(false);
    try {
      const promises = selectedList.map(async (tpl) => {
        return fetch(`/api/admin/templates?id=${tpl.id}`, { method: "DELETE" });
      });

      await Promise.all(promises);
      playSuccess();
      toast.success(`Deleted ${selectedList.length} templates`);
      setSelectedIds({});
      fetchTemplates();
    } catch {
      playBeep(440, 0.15);
      toast.error("Failed to delete templates in bulk");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    playClick();

    const flatItems: {
      file: File;
      item: ImportItem;
    }[] = [];
    const reportItems: {
      title: string;
      slug: string;
      categoryName: string;
      status: "success" | "error";
      reason?: string;
    }[] = [];

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });

        let data = JSON.parse(fileContent);
        if (!Array.isArray(data)) {
          data = [data];
        }

        for (const item of data) {
          flatItems.push({ file, item });
        }
      } catch (err) {
        reportItems.push({
          title: file.name,
          slug: file.name,
          categoryName: "None",
          status: "error",
          reason: `Failed to parse JSON file: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
        failedCount++;
      }
    }

    const totalTemplates = flatItems.length;
    if (totalTemplates === 0) {
      playBeep(440, 0.15);
      setImportSummary({
        open: true,
        total: failedCount,
        successCount: 0,
        failedCount,
        items: reportItems,
      });
      e.target.value = "";
      return;
    }

    setImportProgress({
      total: totalTemplates,
      current: 0,
      currentName: "Initializing queue...",
      loading: true,
    });

    for (let idx = 0; idx < flatItems.length; idx++) {
      const { item } = flatItems[idx];
      const currentName = item.title || item.slug || "unnamed";

      setImportProgress({
        total: totalTemplates,
        current: idx,
        currentName,
        loading: true,
      });

      try {
        if (!item.title || !item.slug) {
          reportItems.push({
            title: item.title || "Unknown Title",
            slug: item.slug || "unknown-slug",
            categoryName: "None",
            status: "error",
            reason: "Missing title or slug",
          });
          failedCount++;
          continue;
        }

        let catId = item.categoryId;
        let catName = "unassigned";
        if (item.categorySlug) {
          const categorySlug = item.categorySlug.toLowerCase();
          const matchedCat = categories.find(
            (c) => c.slug.toLowerCase() === categorySlug
          );
          if (matchedCat) {
            catId = matchedCat.id;
            catName = matchedCat.name;
          }
        } else if (catId) {
          const matchedCat = categories.find((c) => c.id === Number(catId));
          if (matchedCat) {
            catName = matchedCat.name;
          }
        }

        const res = await fetch("/api/admin/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            slug: item.slug,
            description: item.description || "",
            categoryId: catId ? Number(catId) : undefined,
            tags: Array.isArray(item.tags) ? item.tags : (item.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean),
            notes: item.notes || "",
            codes: Array.isArray(item.codes) ? item.codes : item.code ? [{ language: item.language || "cpp", code: item.code }] : [],
            hidden: !!item.hidden,
          }),
        });

        if (res.ok) {
          if (item.notes) {
            await fetch("/api/admin/notes", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug: item.slug, content: item.notes }),
            }).catch((err) => console.error("Error saving bulk notes:", err));
          }

          reportItems.push({
            title: item.title,
            slug: item.slug,
            categoryName: catName,
            status: "success",
          });
          successCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          reportItems.push({
            title: item.title,
            slug: item.slug,
            categoryName: catName,
            status: "error",
            reason: errData.error || "API creation failed",
          });
          failedCount++;
        }
      } catch (itemErr) {
        reportItems.push({
          title: item.title || "Unknown Title",
          slug: item.slug || "unknown-slug",
          categoryName: "None",
          status: "error",
          reason: itemErr instanceof Error ? itemErr.message : "Internal processing error",
        });
        failedCount++;
      }
    }

    setImportProgress(null);
    playSuccess();

    setImportSummary({
      open: true,
      total: totalTemplates + (reportItems.length - successCount - failedCount),
      successCount,
      failedCount: reportItems.length - successCount,
      items: reportItems,
    });

    fetchTemplates();
    e.target.value = "";
  };

  // Categories action handlers
  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    playClick();
    const id = deleteCategoryTarget.id;
    setDeleteCategoryTarget(null);
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      playSuccess();
      toast.success("Category deleted successfully");
      fetchCategories();
      fetchTemplates(); // since cascading delete might delete templates
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to delete category");
    }
  };

  const toggleCategoryVisibility = async (cat: Category) => {
    playClick();
    const newHidden = !cat.hidden;
    const res = await fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...cat,
        hidden: newHidden,
      }),
    });
    if (res.ok) {
      playSuccess();
      toast.success(`Category ${newHidden ? "hidden" : "visible"}`);
      fetchCategories();
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to update visibility");
    }
  };

  const editCategory = (cat: Category) => {
    playClick();
    setCategoryModal({
      open: true,
      isEdit: true,
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      icon: cat.icon,
      color: cat.color,
      order: cat.order,
      hidden: cat.hidden,
    });
  };

  const newCategory = () => {
    playClick();
    setCategoryModal({
      open: true,
      isEdit: false,
      name: "",
      slug: "",
      description: "",
      icon: "Code",
      color: "#3b82f6",
      order: 0,
      hidden: false,
    });
  };

  const handleSaveCategory = async () => {
    if (!categoryModal || !categoryModal.name.trim()) return;
    playClick();
    const method = categoryModal.isEdit ? "PUT" : "POST";
    const bodyPayload = {
      id: categoryModal.id,
      name: categoryModal.name.trim(),
      slug: categoryModal.slug.trim() || categoryModal.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: categoryModal.description.trim(),
      icon: categoryModal.icon || "Code",
      color: categoryModal.color || "#3b82f6",
      order: Number(categoryModal.order) || 0,
      hidden: categoryModal.hidden,
    };

    const res = await fetch("/api/admin/categories", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    });

    if (res.ok) {
      playSuccess();
      toast.success(`Category ${categoryModal.isEdit ? "updated" : "created"}`);
      setCategoryModal(null);
      fetchCategories();
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to save category");
    }
  };

  // Settings action handlers
  const toggleSection = async (key: keyof typeof sections) => {
    playClick();
    const newValue = !sections[key];
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: newValue }),
    });
    if (res.ok) {
      playSuccess();
      setSections((prev) => ({ ...prev, [key]: newValue }));
      toast.success("Home section visibility updated");
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to update settings");
    }
  };

  const logout = async () => {
    playClick();
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/";
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    playClick();
    const id = deleteUserTarget.id;
    setDeleteUserTarget(null);
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      playSuccess();
      toast.success("User account purged successfully");
      fetchUsers();
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to purge user account");
    }
  };

  // Contributions action handlers
  const approveContribution = async (id: number) => {
    playClick();
    const res = await fetch("/api/admin/contributions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "approve" }),
    });
    if (res.ok) {
      playSuccess();
      toast.success("Contribution approved and published");
      fetchContributions();
      fetchTemplates();
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to approve contribution");
    }
  };

  const confirmRejectContribution = async () => {
    if (!rejectModal) return;
    playClick();
    const { id, adminNote } = rejectModal;
    setRejectModal(null);
    const res = await fetch("/api/admin/contributions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "reject", adminNote: adminNote.trim() || undefined }),
    });
    if (res.ok) {
      playSuccess();
      toast.success("Contribution rejected");
      fetchContributions();
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to reject contribution");
    }
  };

  const confirmRequestChanges = async () => {
    if (!requestChangesModal) return;
    const note = requestChangesModal.adminNote.trim();
    if (!note) {
      playBeep(440, 0.15);
      toast.error("Describe the changes you want before sending");
      return;
    }
    playClick();
    const { id } = requestChangesModal;
    setRequestChangesModal(null);
    const res = await fetch("/api/admin/contributions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "request_changes", adminNote: note }),
    });
    if (res.ok) {
      playSuccess();
      toast.success("Changes requested — contributor notified by email");
      fetchContributions();
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to request changes");
    }
  };

  const confirmDeleteContribution = async () => {
    if (!deleteContribTarget) return;
    playClick();
    const id = deleteContribTarget.id;
    setDeleteContribTarget(null);
    const res = await fetch(`/api/admin/contributions?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      playSuccess();
      toast.success("Contribution record purged");
      fetchContributions();
      fetchTemplates();
    } else {
      playBeep(440, 0.15);
      toast.error("Failed to delete contribution");
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }, [templates, search]);

  const templatesByCategory = useMemo(() => {
    const groups: Record<number | string, Template[]> = {};
    categories.forEach((cat) => {
      groups[cat.id] = [];
    });
    groups["unassigned"] = [];

    filteredTemplates.forEach((t) => {
      const catId = t.categoryId;
      if (catId && groups[catId] !== undefined) {
        groups[catId].push(t);
      } else {
        groups["unassigned"].push(t);
      }
    });
    return groups;
  }, [categories, filteredTemplates]);

  // Auto-expand folder directories when search is active
  useEffect(() => {
    if (search.trim()) {
      const autoExpanded: Record<string | number, boolean> = {};
      Object.entries(templatesByCategory).forEach(([catId, list]) => {
        if (list.length > 0) {
          autoExpanded[catId] = true;
        }
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedCats(autoExpanded);
    }
  }, [search, templatesByCategory]);

  const selectedCount = useMemo(() => {
    return Object.keys(selectedIds).filter((id) => selectedIds[Number(id)]).length;
  }, [selectedIds]);

  const pendingContribCount = useMemo(
    () => contributions.filter((c) => c.status === "pending").length,
    [contributions]
  );

  const filteredContributions = useMemo(() => {
    if (contribFilter === "all") return contributions;
    return contributions.filter((c) => c.status === contribFilter);
  }, [contributions, contribFilter]);

  return (
    <div className="space-y-6 font-mono">
      {/* Tab switch navigation */}
      <div className="flex flex-wrap gap-2 border-b border-primary/20 pb-4">
        <button
          onClick={() => { playClick(); setActiveTab("templates"); }}
          className={`px-3 py-1.5 border text-[11px] font-mono font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer ${
            activeTab === "templates"
              ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_var(--primary-glow-weak)]"
              : "border-border text-muted-foreground/45 hover:text-foreground"
          }`}
        >
          $ ls templates/
        </button>
        <button
          onClick={() => { playClick(); setActiveTab("categories"); }}
          className={`px-3 py-1.5 border text-[11px] font-mono font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer ${
            activeTab === "categories"
              ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_var(--primary-glow-weak)]"
              : "border-border text-muted-foreground/45 hover:text-foreground"
          }`}
        >
          $ ls categories/
        </button>
        <button
          onClick={() => { playClick(); setActiveTab("sections"); }}
          className={`px-3 py-1.5 border text-[11px] font-mono font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer ${
            activeTab === "sections"
              ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_var(--primary-glow-weak)]"
              : "border-border text-muted-foreground/45 hover:text-foreground"
          }`}
        >
          $ config site-sections/
        </button>
        <button
          onClick={() => { playClick(); setActiveTab("stats"); }}
          className={`px-3 py-1.5 border text-[11px] font-mono font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer ${
            activeTab === "stats"
              ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_var(--primary-glow-weak)]"
              : "border-border text-muted-foreground/45 hover:text-foreground"
          }`}
        >
          $ sys-stats --view
        </button>
        <button
          onClick={() => { playClick(); setActiveTab("contributions"); }}
          className={`px-3 py-1.5 border text-[11px] font-mono font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer flex items-center gap-2 ${
            activeTab === "contributions"
              ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_var(--primary-glow-weak)]"
              : "border-border text-muted-foreground/45 hover:text-foreground"
          }`}
        >
          $ review contributions/
          {pendingContribCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 border border-warning bg-warning/10 text-warning rounded-none normal-case tracking-normal">
              {pendingContribCount} pending
            </span>
          )}
        </button>
        <button
          onClick={() => { playClick(); setActiveTab("users"); }}
          className={`px-3 py-1.5 border text-[11px] font-mono font-bold uppercase tracking-wider transition-all rounded-none cursor-pointer ${
            activeTab === "users"
              ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_var(--primary-glow-weak)]"
              : "border-border text-muted-foreground/45 hover:text-foreground"
          }`}
        >
          $ ls users/
        </button>
      </div>

      {/* VIEW: Templates */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-primary/10 pb-4">
            <div className="relative w-full sm:max-w-sm flex items-center border border-border bg-card/50 focus-within:border-primary/50 transition-colors px-2.5 py-1">
              <span className="text-[10px] text-primary/60 shrink-0 mr-1.5 select-none font-bold">$ find . -name</span>
              <Input
                placeholder="&quot;*query*&quot;"
                className="border-none bg-transparent h-7 p-0 text-xs focus-visible:ring-0 placeholder:text-muted-foreground/25 text-foreground"
                value={search}
                onChange={(e) => {
                  playClick();
                  setSearch(e.target.value);
                }}
              />
              <Search className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 ml-1.5" />
            </div>

            <div className="flex gap-3 w-full sm:w-auto justify-end">
              <input
                type="file"
                accept=".json"
                id="bulk-import-input"
                className="hidden"
                onChange={handleBulkImport}
                multiple
              />
              <label
                htmlFor="bulk-import-input"
                className="font-mono text-xs h-9 px-4 rounded-none tracking-wider uppercase border border-primary bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center cursor-pointer select-none"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                <span>[ bulk_import.sh ]</span>
              </label>
              <Link href="/admin/templates/new">
                <Button className="font-mono text-xs h-9 px-4 rounded-none tracking-wider uppercase border border-primary bg-primary/10 text-primary hover:bg-primary/20">
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span>[ new_template.sh ]</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={logout}
                className="font-mono text-xs h-9 px-4 rounded-none tracking-wider uppercase border-border hover:border-destructive/40 hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                <span>[ logout ]</span>
              </Button>
            </div>
          </div>

          {loadingTemplates ? (
            <div className="text-center py-16 text-muted-foreground/45 font-mono text-xs animate-pulse">
              $ read_directory --status
              <br />
              [LOAD] Loading templates files...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center text-muted-foreground/50 text-xs">
              $ ls -la templates/
              <br />
              {search ? "No matches found for query." : "total 0 (no files found)."}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground/45 select-none">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-primary font-bold">$</span>
                  <span>tree -F templates/</span>
                  <span className="inline-block h-3 w-1.5 bg-primary/40 animate-blink" />
                </div>
                <span className="font-mono">total {filteredTemplates.length} files in {categories.length} folders</span>
              </div>

              {/* Bulk Actions Banner */}
              {selectedCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 border border-warning/30 bg-warning/5 text-warning text-xs font-mono select-none">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-warning"></span>
                    </span>
                    <span>{selectedCount} templates selected</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={bulkToggleVisibility}
                      disabled={bulkLoading}
                      className="px-2.5 py-1 border border-warning bg-warning/10 hover:bg-warning/20 disabled:opacity-50 text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                    >
                      [ toggle_visibility ]
                    </button>
                    <button
                      onClick={bulkDelete}
                      disabled={bulkLoading}
                      className="px-2.5 py-1 border border-destructive bg-destructive/10 hover:bg-destructive/20 disabled:opacity-50 text-[10px] uppercase font-bold tracking-wider cursor-pointer text-destructive"
                    >
                      [ delete_selected ]
                    </button>
                    <button
                      onClick={() => { playClick(); setSelectedIds({}); }}
                      disabled={bulkLoading}
                      className="px-2.5 py-1 border border-border/50 bg-card hover:bg-primary/5 disabled:opacity-50 text-[10px] uppercase font-bold tracking-wider cursor-pointer text-muted-foreground"
                    >
                      [ clear_selection ]
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 select-none">
                {categories.map((cat) => {
                  const list = templatesByCategory[cat.id] || [];
                  const isExpanded = !!expandedCats[cat.id];

                  // When searching, hide empty folders that do not match search criteria
                  if (search.trim() && list.length === 0) return null;

                  return (
                    <div key={cat.id} className="border border-border/80 bg-card/15 transition-all">
                      {/* Folder Row Header */}
                      <button
                        onClick={() => {
                          playClick();
                          setExpandedCats((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }));
                        }}
                        className="w-full flex items-center justify-between p-3 text-xs font-bold hover:bg-primary/[0.02] transition-colors select-none text-left cursor-pointer font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-primary/60 text-[10px] w-3">{isExpanded ? "▼" : "▶"}</span>
                          <FolderOpen className={`h-4 w-4 shrink-0 transition-colors ${isExpanded ? "text-primary" : "text-muted-foreground/50"}`} />
                          <span className="text-info font-bold">{cat.slug}/</span>
                          <span className="text-muted-foreground/45 text-[10px]">({cat.name})</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground/40 font-normal">
                          {list.length} {list.length === 1 ? "file" : "files"}
                        </div>
                      </button>

                      {/* File Items Table inside the Expanded Folder */}
                      {isExpanded && (
                        <div className="border-t border-border/50 p-3 bg-black/10 overflow-x-auto scrollbar-thin">
                          {list.length === 0 ? (
                            <div className="py-6 text-center text-muted-foreground/40 text-[10px] italic font-mono">
                              total 0 files
                            </div>
                          ) : (
                            <TemplateFileTable
                              list={list}
                              selectedIds={selectedIds}
                              onRowClickSound={playClick}
                              onToggleSelectAll={(checked) =>
                                setSelectedIds((prev) => {
                                  const next = { ...prev };
                                  list.forEach((t) => { next[t.id] = checked; });
                                  return next;
                                })
                              }
                              onToggleSelect={(id, checked) => setSelectedIds((prev) => ({ ...prev, [id]: checked }))}
                              onToggleVisibility={toggleTemplateVisibility}
                              onDelete={(t) => { playBeep(330, 0.25); setDeleteTarget(t); }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unassigned Folder */}
                {templatesByCategory["unassigned"]?.length > 0 && (
                  <div className="border border-border bg-card/15 transition-all">
                    <button
                      onClick={() => {
                        playClick();
                        setExpandedCats((prev) => ({ ...prev, unassigned: !prev.unassigned }));
                      }}
                      className="w-full flex items-center justify-between p-3 text-xs font-bold hover:bg-primary/[0.02] transition-colors select-none text-left cursor-pointer font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-primary/60 text-[10px] w-3">{expandedCats["unassigned"] ? "▼" : "▶"}</span>
                        <Folder className={`h-4 w-4 shrink-0 transition-colors ${expandedCats["unassigned"] ? "text-primary" : "text-muted-foreground/50"}`} />
                        <span className="text-warning font-bold">unassigned/</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground/40 font-normal">
                        {templatesByCategory["unassigned"].length} files
                      </div>
                    </button>

                    {expandedCats["unassigned"] && (
                      <div className="border-t border-border/50 p-3 bg-black/10 overflow-x-auto scrollbar-thin">
                        <TemplateFileTable
                          list={templatesByCategory["unassigned"]}
                          selectedIds={selectedIds}
                          onRowClickSound={playClick}
                          onToggleSelectAll={(checked) =>
                            setSelectedIds((prev) => {
                              const next = { ...prev };
                              templatesByCategory["unassigned"].forEach((t) => { next[t.id] = checked; });
                              return next;
                            })
                          }
                          onToggleSelect={(id, checked) => setSelectedIds((prev) => ({ ...prev, [id]: checked }))}
                          onToggleVisibility={toggleTemplateVisibility}
                          onDelete={(t) => { playBeep(330, 0.25); setDeleteTarget(t); }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: Categories */}
      {activeTab === "categories" && <CategoriesTab categories={categories} loadingCategories={loadingCategories} onNew={newCategory} onEdit={editCategory} onToggleVisibility={toggleCategoryVisibility} onDelete={(c) => { playBeep(330, 0.25); setDeleteCategoryTarget(c); }} />}

      {/* VIEW: Homepage Sections */}
      {activeTab === "sections" && <SectionsTab sections={sections} loadingSettings={loadingSettings} onToggle={toggleSection} />}

      {/* VIEW: Sys Stats */}
      {activeTab === "stats" && <StatsTab templates={templates} categories={categories} playClick={playClick} playSuccess={playSuccess} totalUsers={users.length} />}

      {/* VIEW: Users */}
      {activeTab === "users" && <UsersTab users={users} loading={loadingUsers} onDelete={(u) => { playBeep(330, 0.25); setDeleteUserTarget(u); }} onSelectUser={(u) => setSelectedUserDetail(u)} onRowClickSound={playClick} />}

      {/* VIEW: Contributions Review */}
      {activeTab === "contributions" && <ContributionsTab loadingContributions={loadingContributions} contribFilter={contribFilter} setContribFilter={setContribFilter} pendingContribCount={pendingContribCount} filteredContributions={filteredContributions} expandedContribution={expandedContribution} setExpandedContribution={setExpandedContribution} playClick={playClick} playBeep={playBeep} onApprove={approveContribution} onReject={(c) => setRejectModal({ id: c.id, adminNote: "" })} onRequestChanges={(c) => setRequestChangesModal({ id: c.id, adminNote: "" })} onDelete={(c) => setDeleteContribTarget(c)} />}

      {/* Retro Delete warning modal overlay (Templates) */}
      {deleteTarget && (
        <RetroConfirmModal
          commandTarget={{ cmd: "$ rm -rf", path: `templates/${deleteTarget.slug}.cpp` }}
          confirmLabel="Force Purge File"
          onCancel={() => { playClick(); setDeleteTarget(null); }}
          onConfirm={confirmDelete}
        >
          WARNING: You are about to permanently delete the template file <span className="text-foreground font-semibold">&quot;{deleteTarget.title}&quot;</span>.
          This action is irreversible and will purge the file record from the repository index.
        </RetroConfirmModal>
      )}

      {/* Retro Delete warning modal overlay (Bulk Templates) */}
      {showBulkDeleteConfirm && (
        <RetroConfirmModal
          commandTarget={{ cmd: "$ rm -rf", path: `templates/ [ ${selectedCount} files ]` }}
          confirmLabel="Force Purge Files"
          onCancel={() => { playClick(); setShowBulkDeleteConfirm(false); }}
          onConfirm={confirmBulkDelete}
          confirmDisabled={bulkLoading}
        >
          WARNING: You are about to permanently delete <span className="text-foreground font-semibold">{selectedCount}</span> template files.
          This action is irreversible and will purge these files and their note documentation permanently from the mainframe index.
        </RetroConfirmModal>
      )}

      {/* Retro Delete warning modal overlay (Categories) */}
      {deleteCategoryTarget && (
        <RetroConfirmModal
          commandTarget={{ cmd: "$ rm -rf", path: `categories/${deleteCategoryTarget.slug}/` }}
          confirmLabel="Force Purge Folder"
          onCancel={() => { playClick(); setDeleteCategoryTarget(null); }}
          onConfirm={confirmDeleteCategory}
        >
          WARNING: You are about to permanently delete the category folder <span className="text-foreground font-semibold">&quot;{deleteCategoryTarget.name}&quot;</span>.
          This action is irreversible and will purge all templates directly linked to this category!
        </RetroConfirmModal>
      )}

      {/* Retro Delete warning modal overlay (Users) */}
      {deleteUserTarget && (
        <RetroConfirmModal
          commandTarget={{ cmd: "$ userdel -r", path: `users/${deleteUserTarget.username}` }}
          confirmLabel="Force Purge User"
          onCancel={() => { playClick(); setDeleteUserTarget(null); }}
          onConfirm={confirmDeleteUser}
        >
          WARNING: You are about to permanently delete the user account <span className="text-foreground font-semibold">&quot;{deleteUserTarget.username}&quot;</span> (<span className="text-muted-foreground">{deleteUserTarget.email}</span>).
          This action is irreversible and will purge all custom templates, collections, and progress records associated with this account from the mainframe database!
        </RetroConfirmModal>
      )}

      {/* Selected User Details retro modal dialog overlay */}
      {selectedUserDetail && (
        <RetroModal
          tone="primary"
          title={`ℹ [ USER_DETAILS: ${selectedUserDetail.username.toUpperCase()} ]`}
          tag="USER_MANAGEMENT_SYS"
          selectNone={false}
        >
          <div className="p-6 space-y-4 text-xs select-text font-mono">
            <div className="text-[10px] text-muted-foreground/45 border-b border-primary/10 pb-2 flex justify-between select-none">
              <span>USER ID: {selectedUserDetail.id}</span>
              <span>STATUS: ACTIVE</span>
            </div>

            <div className="space-y-3.5 leading-relaxed">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground/40 font-bold select-none uppercase">Username:</span>
                <span className="col-span-2 text-foreground font-bold">{selectedUserDetail.username}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground/40 font-bold select-none uppercase">Email:</span>
                <span className="col-span-2 text-foreground font-bold">{selectedUserDetail.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground/40 font-bold select-none uppercase">Verified Status:</span>
                <span className="col-span-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                    selectedUserDetail.emailVerified 
                      ? "border-success bg-success/5 text-success" 
                      : "border-warning bg-warning/5 text-warning"
                  }`}>
                    {selectedUserDetail.emailVerified ? "EMAIL_VERIFIED (TRUE)" : "EMAIL_UNVERIFIED (FALSE)"}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground/40 font-bold select-none uppercase">Joined Date:</span>
                <span className="col-span-2 text-foreground">{new Date(selectedUserDetail.createdAt).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground/40 font-bold select-none uppercase">Calendar Token:</span>
                <span className="col-span-2 text-primary font-bold tracking-wider break-all select-all">{selectedUserDetail.calendarToken || "None linked"}</span>
              </div>
            </div>

            <div className="border-t border-border/30 pt-3 mt-4 space-y-2.5">
              <div className="text-[9px] text-muted-foreground/45 uppercase tracking-widest font-bold select-none">
                Linked Platform Handles
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Codeforces", val: selectedUserDetail.codeforcesHandle, color: "text-red-400", url: `https://codeforces.com/profile/${selectedUserDetail.codeforcesHandle}` },
                  { label: "AtCoder", val: selectedUserDetail.atcoderHandle, color: "text-zinc-400", url: `https://atcoder.jp/users/${selectedUserDetail.atcoderHandle}` },
                  { label: "LeetCode", val: selectedUserDetail.leetcodeHandle, color: "text-amber-400", url: `https://leetcode.com/${selectedUserDetail.leetcodeHandle}` },
                  { label: "CodeChef", val: selectedUserDetail.codechefHandle, color: "text-emerald-400", url: `https://www.codechef.com/users/${selectedUserDetail.codechefHandle}` },
                ].map((ph) => {
                  const content = (
                    <>
                      <span className="text-[8px] text-muted-foreground/35 uppercase select-none">{ph.label}</span>
                      <span className={`text-xs font-bold mt-1 ${ph.val ? ph.color : "text-muted-foreground/20 italic"}`}>
                        {ph.val ? `@${ph.val}` : "Not linked"}
                      </span>
                    </>
                  );

                  if (ph.val) {
                    return (
                      <a
                        key={ph.label}
                        href={ph.url}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-border/30 p-2.5 bg-card/25 hover:bg-primary/5 hover:border-primary/40 flex flex-col justify-between transition-all duration-200 cursor-pointer"
                      >
                        {content}
                      </a>
                    );
                  }

                  return (
                    <div key={ph.label} className="border border-border/30 p-2.5 bg-card/25 flex flex-col justify-between opacity-50">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/45 px-6 py-4 bg-muted/5 flex justify-end gap-3 text-[10px] select-none">
            <button
              type="button"
              onClick={() => { playClick(); setSelectedUserDetail(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-primary bg-primary/5 hover:bg-primary/15 text-primary transition-colors uppercase font-mono font-bold cursor-pointer"
            >
              <span>[ ESC ]</span>
              <span>Close Window</span>
            </button>
          </div>
        </RetroModal>
      )}

      {/* Reject Contribution retro modal dialog overlay */}
      {rejectModal && (
        <RetroModal tone="destructive" title="✖ [ REJECT_CONTRIBUTION.SH ]" tag="REVIEW_SYS_V1" selectNone={false}>
          <div className="p-6 space-y-4 text-xs select-text">
            <div className="text-xs text-muted-foreground/85 leading-relaxed font-mono">
              You are about to reject this contribution. The submitter will be notified via email. You may include an optional note explaining the decision.
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold block">
                Admin Note (optional)
              </label>
              <textarea
                value={rejectModal.adminNote}
                onChange={(e) => setRejectModal((prev) => (prev ? { ...prev, adminNote: e.target.value } : prev))}
                placeholder="Reason for rejection..."
                rows={4}
                className="w-full bg-background/40 border border-border focus:border-primary/50 focus:outline-none text-xs font-mono p-2 rounded-none resize-none placeholder:text-muted-foreground/25 text-foreground"
              />
            </div>
          </div>
          <div className="border-t border-border/45 px-6 py-4 bg-muted/5 flex justify-end gap-3 text-[10px] select-none">
            <button
              type="button"
              onClick={() => { playClick(); setRejectModal(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary/40 hover:text-primary transition-colors uppercase font-mono cursor-pointer"
            >
              <span>[ ESC ]</span>
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={confirmRejectContribution}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive bg-destructive/15 hover:bg-destructive/35 text-destructive transition-colors uppercase font-mono font-bold cursor-pointer"
            >
              <span>[ ENTER ]</span>
              <span>Reject Submission</span>
            </button>
          </div>
        </RetroModal>
      )}

      {requestChangesModal && (
        <RetroModal tone="primary" title="✎ [ REQUEST_CHANGES.SH ]" tag="REVIEW_SYS_V1" selectNone={false}>
          <div className="p-6 space-y-4 text-xs select-text">
            <div className="text-xs text-muted-foreground/85 leading-relaxed font-mono">
              Describe the changes the contributor should make. They will receive an email with your message and a button that reopens their submission pre-filled for revision.
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold block">
                Requested Changes (required)
              </label>
              <textarea
                value={requestChangesModal.adminNote}
                onChange={(e) => setRequestChangesModal((prev) => (prev ? { ...prev, adminNote: e.target.value } : prev))}
                placeholder="e.g. Add a complexity note and fix the off-by-one in the build() loop..."
                rows={4}
                className="w-full bg-background/40 border border-border focus:border-primary/50 focus:outline-none text-xs font-mono p-2 rounded-none resize-none placeholder:text-muted-foreground/25 text-foreground"
              />
            </div>
          </div>
          <div className="border-t border-border/45 px-6 py-4 bg-muted/5 flex justify-end gap-3 text-[10px] select-none">
            <button
              type="button"
              onClick={() => { playClick(); setRequestChangesModal(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary/40 hover:text-primary transition-colors uppercase font-mono cursor-pointer"
            >
              <span>[ ESC ]</span>
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={confirmRequestChanges}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-primary bg-primary/15 hover:bg-primary/35 text-primary transition-colors uppercase font-mono font-bold cursor-pointer"
            >
              <span>[ ENTER ]</span>
              <span>Send Request</span>
            </button>
          </div>
        </RetroModal>
      )}

      {/* Delete Contribution retro modal dialog overlay */}
      {deleteContribTarget && (
        <RetroConfirmModal
          commandTarget={{ cmd: "$ rm -rf", path: `contributions/${deleteContribTarget.id}` }}
          confirmLabel="Purge Record"
          onCancel={() => { playClick(); setDeleteContribTarget(null); }}
          onConfirm={confirmDeleteContribution}
        >
          WARNING: You are about to permanently delete this {deleteContribTarget.type === "edit" ? "edit request" : "template submission"} from{" "}
          <span className="text-foreground font-semibold">&quot;{deleteContribTarget.contributorName}&quot;</span>.
          {deleteContribTarget.type === "edit" && deleteContribTarget.status === "approved"
            ? " If approved, their applied changes will be rolled back (template restored to the version before their edit) and their history snapshot purged."
            : " If approved, the contributor credit will be removed from the template (the template itself stays published)."}{" "}
          No email is sent.
        </RetroConfirmModal>
      )}

      {/* Category Create/Edit retro modal dialog overlay */}
      {categoryModal && categoryModal.open && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg border border-primary bg-card/95 shadow-[0_0_40px_rgba(34,197,94,0.15)] overflow-hidden font-mono">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-primary/30 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider select-none">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>[DIR] [ {categoryModal.isEdit ? "EDIT_CATEGORY.SH" : "NEW_CATEGORY.SH"} ]</span>
              </div>
              <span>SETUP_SYS_V1</span>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-4 text-xs select-text">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold block">
                  Folder Name
                </label>
                <Input
                  value={categoryModal.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    setCategoryModal((prev) => prev && ({ ...prev, name: val, slug: generatedSlug }));
                  }}
                  placeholder="Graphs"
                  className="bg-background/40 border-border focus:border-primary/50 text-xs font-mono h-8 rounded-none w-full"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold block">
                  Slug
                </label>
                <Input
                  value={categoryModal.slug}
                  onChange={(e) => setCategoryModal((prev) => prev && ({ ...prev, slug: e.target.value }))}
                  placeholder="graphs"
                  className="bg-background/40 border-border focus:border-primary/50 text-xs font-mono h-8 rounded-none w-full"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold block">
                  Description
                </label>
                <Input
                  value={categoryModal.description}
                  onChange={(e) => setCategoryModal((prev) => prev && ({ ...prev, description: e.target.value }))}
                  placeholder="Graph algorithms and utilities"
                  className="bg-background/40 border-border focus:border-primary/50 text-xs font-mono h-8 rounded-none w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Icon option */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold block">
                    Lucide Icon Name
                  </label>
                  <Input
                    value={categoryModal.icon}
                    onChange={(e) => setCategoryModal((prev) => prev && ({ ...prev, icon: e.target.value }))}
                    placeholder="GitBranch"
                    className="bg-background/40 border-border focus:border-primary/50 text-xs font-mono h-8 rounded-none w-full"
                  />
                </div>

                {/* Color option */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold block">
                    Tailwind HEX Color
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={categoryModal.color}
                      onChange={(e) => setCategoryModal((prev) => prev && ({ ...prev, color: e.target.value }))}
                      placeholder="#ef4444"
                      className="bg-background/40 border-border focus:border-primary/50 text-xs font-mono h-8 rounded-none flex-1"
                    />
                    <div className="relative h-8 w-8 border border-border bg-card overflow-hidden">
                      <input
                        type="color"
                        value={categoryModal.color.startsWith("#") ? categoryModal.color : "#3b82f6"}
                        onChange={(e) => setCategoryModal((prev) => prev && ({ ...prev, color: e.target.value }))}
                        className="w-full h-full cursor-pointer absolute inset-0 opacity-0 z-10"
                      />
                      <div
                        className="w-full h-full pointer-events-none"
                        style={{ backgroundColor: categoryModal.color }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Sort Order */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold block">
                    Order Index
                  </label>
                  <Input
                    type="number"
                    value={categoryModal.order}
                    onChange={(e) => setCategoryModal((prev) => prev && ({ ...prev, order: Number(e.target.value) }))}
                    placeholder="10"
                    className="bg-background/40 border-border focus:border-primary/50 text-xs font-mono h-8 rounded-none w-full"
                  />
                </div>

                {/* Hidden Flag */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold block select-none">
                    Visibility
                  </label>
                  <button
                    onClick={() => setCategoryModal((prev) => prev && ({ ...prev, hidden: !prev.hidden }))}
                    className={`h-8 w-full border text-xs font-mono font-bold uppercase transition-all rounded-none cursor-pointer ${
                      categoryModal.hidden
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-primary bg-primary/10 text-primary"
                    }`}
                  >
                    {categoryModal.hidden ? "[ HIDDEN ]" : "[ VISIBLE ]"}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-border/45 px-6 py-4 bg-muted/5 flex justify-end gap-3 text-[10px] select-none">
              <button
                type="button"
                onClick={() => { playClick(); setCategoryModal(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary/40 hover:text-primary transition-colors uppercase font-mono cursor-pointer"
              >
                <span>[ ESC ]</span>
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCategory}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-primary bg-primary/15 hover:bg-primary/35 text-primary transition-colors uppercase font-mono font-bold cursor-pointer"
              >
                <span>[ ENTER ]</span>
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Import Progress Overlay */}
      {importProgress && importProgress.loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="border border-primary bg-card max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between text-primary font-bold border-b border-primary/20 pb-2">
              <div className="flex items-center gap-1.5 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                <span>UPLOADING_INDEX_FILES...</span>
              </div>
              <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-muted-foreground/60">
                <span className="truncate max-w-[180px]">Processing: {importProgress.currentName}</span>
                <span>[{importProgress.current + 1}/{importProgress.total}]</span>
              </div>

              {/* Progress Bar Container */}
              <div className="border border-border/80 p-0.5 bg-card/20 select-none flex">
                {(() => {
                  const pct = importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0;
                  const totalBlocks = 20;
                  const activeBlocks = Math.round((pct / 100) * totalBlocks);
                  const barStr = "█".repeat(activeBlocks) + "░".repeat(totalBlocks - activeBlocks);
                  return (
                    <span className="text-primary text-[11px] font-mono tracking-tighter w-full text-left px-1.5 font-bold">
                      {barStr}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="text-[9px] text-muted-foreground/30 text-center italic animate-pulse">
              Please do not refresh or interrupt the mainframe terminal.
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Report Modal */}
      {importSummary && importSummary.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="border border-primary bg-card max-w-2xl w-full shadow-2xl overflow-hidden font-mono text-xs">
            {/* Window title bar */}
            <div className="flex justify-between items-center bg-primary/10 border-b border-primary/20 px-3 py-2 text-primary font-bold">
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5" />
                <span>BULK_IMPORT_REPORT.TXT</span>
              </div>
              <button
                onClick={() => { playClick(); setImportSummary(null); }}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer border border-transparent hover:border-primary/20 px-1 py-0.5"
              >
                [close]
              </button>
            </div>

            {/* Content pane */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin select-text">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 border border-border/85 p-3 bg-card/20 text-center">
                <div>
                  <div className="text-[10px] text-muted-foreground/50 uppercase">Total Files</div>
                  <div className="text-base font-bold text-foreground">{importSummary.total}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground/50 uppercase">Success</div>
                  <div className="text-base font-bold text-primary">{importSummary.successCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground/50 uppercase">Failed</div>
                  <div className="text-base font-bold text-destructive">{importSummary.failedCount}</div>
                </div>
              </div>

              {/* Items List Table */}
              <div className="border border-border bg-card/5 select-text overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-primary/20 bg-primary/5 text-primary/60 font-bold uppercase select-none text-[9px]">
                      <th className="py-2 px-3">Filename</th>
                      <th className="py-2 px-3">Folder</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Log Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {importSummary.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-primary/[0.01] transition-colors leading-relaxed">
                        <td className="py-2 px-3 font-semibold text-foreground">
                          {item.slug}.cpp
                        </td>
                        <td className="py-2 px-3 text-info font-bold">
                          {item.categoryName}/
                        </td>
                        <td className="py-2 px-3 select-none">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-none ${
                              item.status === "success"
                                ? "border-primary/40 bg-primary/5 text-primary"
                                : "border-destructive/40 bg-destructive/5 text-destructive"
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[10px]">
                          {item.status === "success" ? (
                            <span className="text-muted-foreground/45">File written successfully</span>
                          ) : (
                            <span className="text-destructive font-bold">{item.reason}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer action bar */}
            <div className="flex justify-end p-3 border-t border-border bg-card/35 select-none">
              <Button
                onClick={() => { playClick(); setImportSummary(null); }}
                className="font-mono text-[10px] h-7 px-4 rounded-none tracking-wider uppercase border border-primary bg-primary/10 text-primary hover:bg-primary/20"
              >
                [ finish_task.sh ]
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
