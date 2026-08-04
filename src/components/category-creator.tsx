"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, FolderPlus } from "lucide-react";
import * as LucideIcons from "lucide-react";

const ICON_OPTIONS = [
  { name: "Code", label: "Code" },
  { name: "GitBranch", label: "Git Branch" },
  { name: "Layers", label: "Layers" },
  { name: "Zap", label: "Zap" },
  { name: "Sigma", label: "Sigma" },
  { name: "Text", label: "Text" },
  { name: "Database", label: "Database" },
  { name: "Binary", label: "Binary" },
  { name: "Hash", label: "Hash" },
  { name: "TreePine", label: "Tree" },
  { name: "Network", label: "Network" },
  { name: "Cpu", label: "CPU" },
  { name: "Brain", label: "Brain" },
  { name: "Lightbulb", label: "Lightbulb" },
  { name: "BookOpen", label: "Book" },
  { name: "Calculator", label: "Calculator" },
  { name: "Puzzle", label: "Puzzle" },
  { name: "Workflow", label: "Workflow" },
  { name: "Box", label: "Box" },
  { name: "Stack", label: "Stack" },
  { name: "List", label: "List" },
  { name: "Grid", label: "Grid" },
  { name: "Search", label: "Search" },
  { name: "SortAsc", label: "Sort" },
  { name: "Shuffle", label: "Shuffle" },
  { name: "Target", label: "Target" },
  { name: "Crosshair", label: "Crosshair" },
  { name: "TrendingUp", label: "Trending" },
  { name: "BarChart", label: "Chart" },
  { name: "PieChart", label: "Pie" },
];

interface CategoryCreatorProps {
  onCreated: (cat: { id: number; name: string; slug: string }) => void;
}

export function CategoryCreator({ onCreated }: CategoryCreatorProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("Code");
  const [color, setColor] = useState("#22c55e");
  const [saving, setSaving] = useState(false);
  const [showIcons, setShowIcons] = useState(false);

  const generateSlug = (n: string) =>
    n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        slug: slug.trim() || generateSlug(name.trim()),
        description: "",
        icon,
        color,
        order: 0,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const cat = await res.json();
      onCreated(cat);
      setName("");
      setSlug("");
      setIcon("Code");
      setColor("#22c55e");
      setOpen(false);
      setShowIcons(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setName("");
    setSlug("");
    setIcon("Code");
    setColor("#22c55e");
    setShowIcons(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SelectedIcon = (LucideIcons as any)[icon] || LucideIcons.Code;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors mt-1 uppercase tracking-wider"
      >
        <FolderPlus className="h-3 w-3" />
        Create new category
      </button>
    );
  }

  return (
    <div className="border border-border bg-card p-3 mt-2 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">New Category</span>
        <button
          type="button"
          onClick={handleClose}
          className="text-muted-foreground/30 hover:text-primary transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] text-muted-foreground/40 uppercase">Name</label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(generateSlug(e.target.value));
            }}
            placeholder="Category name"
            className="h-8 text-xs font-mono"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground/40 uppercase">Icon</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowIcons(!showIcons)}
              className="flex items-center justify-center h-8 w-8 border border-border bg-card hover:border-primary/30 transition-colors"
              style={{ color }}
            >
              <SelectedIcon className="h-4 w-4" />
            </button>
            {showIcons && (
              <div className="absolute top-full left-0 mt-1 p-2 border border-border bg-card z-50 w-64 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-6 gap-1">
                  {ICON_OPTIONS.map((opt) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const Icon = (LucideIcons as any)[opt.name] || LucideIcons.Code;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => {
                          setIcon(opt.name);
                          setShowIcons(false);
                        }}
                        className={`flex items-center justify-center h-8 w-8 hover:bg-primary/10 transition-colors ${
                          icon === opt.name ? "bg-primary/10 text-primary" : "text-muted-foreground/50"
                        }`}
                        title={opt.label}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground/40 uppercase">Color</label>
          <div className="flex items-center h-8 w-8 border border-border bg-card">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-full cursor-pointer opacity-0"
            />
            <div
              className="absolute h-4 w-4 pointer-events-none"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleClose}
          className="h-7 text-xs"
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="h-7 font-mono text-xs"
        >
          {saving ? "..." : <><Plus className="h-3 w-3 mr-1" />Create</>}
        </Button>
      </div>
    </div>
  );
}
