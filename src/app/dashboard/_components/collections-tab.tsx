"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  ArrowLeft,
  Pencil,
  Trash2,
  Save,
  Library,
  BookOpen,
  Code,
  ExternalLink,
  Plus,
  ChevronRight,
  Printer,
  FolderDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Collection, CollectionItem } from "./types";

interface CollectionsTabProps {
  collections: Collection[];
  activeCollection: Collection | null;
  collectionItems: CollectionItem[];
  loadingCollItems: boolean;
  creatingColl: boolean;
  editingCollId: number | null;
  editCollName: string;
  editCollDesc: string;
  savingCollEdit: boolean;
  playClick: () => void;
  onOpenCollection: (coll: Collection) => void;
  onBackToCollections: () => void;
  onCreateCollection: (name: string, desc: string) => void;
  onStartEditCollection: (coll: Collection, e?: React.MouseEvent) => void;
  onCancelEditCollection: () => void;
  onSaveCollectionEdit: (id: number) => void;
  onDeleteCollection: (id: number) => void;
  onRemoveItemFromCollection: (collectionId: number, templateId: number) => void;
  setEditCollName: (val: string) => void;
  setEditCollDesc: (val: string) => void;
}

export function CollectionsTab({
  collections,
  activeCollection,
  collectionItems,
  loadingCollItems,
  creatingColl,
  editingCollId,
  editCollName,
  editCollDesc,
  savingCollEdit,
  playClick,
  onOpenCollection,
  onBackToCollections,
  onCreateCollection,
  onStartEditCollection,
  onCancelEditCollection,
  onSaveCollectionEdit,
  onDeleteCollection,
  onRemoveItemFromCollection,
  setEditCollName,
  setEditCollDesc,
}: CollectionsTabProps) {
  const [newCollName, setNewCollName] = useState("");
  const [newCollDesc, setNewCollDesc] = useState("");
  const [downloadingCollId, setDownloadingCollId] = useState<number | null>(null);

  const handleDownloadCppZip = async (collectionId: number, collectionName: string) => {
    try {
      setDownloadingCollId(collectionId);
      toast.loading("Preparing C++ collection ZIP...", { id: `download-${collectionId}` });

      const res = await fetch(`/api/users/collections/${collectionId}/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to download collection" }));
        throw new Error(data.error || "Failed to download collection");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const sanitizedName = collectionName.replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_");
      a.download = `${sanitizedName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("C++ folder ZIP downloaded!", { id: `download-${collectionId}` });
    } catch (err: any) {
      toast.error(err.message || "Failed to download C++ collection ZIP", { id: `download-${collectionId}` });
    } finally {
      setDownloadingCollId(null);
    }
  };

  const handleCreate = () => {
    if (!newCollName.trim()) return;
    onCreateCollection(newCollName.trim(), newCollDesc.trim());
    setNewCollName("");
    setNewCollDesc("");
  };

  return (
    <div className="space-y-6 animate-fade-in font-mono">
      {activeCollection ? (
        /* ── View Single Collection Detail ── */
        <div className="space-y-6">
          <div className="border border-border bg-card/40 backdrop-blur-md p-5 shadow-2xl font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4 mb-4">
              <button
                onClick={onBackToCollections}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold w-fit cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to all collections</span>
              </button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCppZip(activeCollection.id, activeCollection.name)}
                  disabled={downloadingCollId === activeCollection.id}
                  className="font-mono text-[10px] uppercase font-extrabold h-7.5 px-3 border-primary/40 hover:bg-primary/10 text-primary cursor-pointer"
                >
                  {downloadingCollId === activeCollection.id ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <FolderDown className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  )}
                  Download C++ (.cpp)
                </Button>
                <Link href={`/editor?collectionId=${activeCollection.id}`}>
                  <Button
                    size="sm"
                    className="font-mono text-[10px] uppercase font-extrabold h-7.5 px-3 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Print Collection PDF
                  </Button>
                </Link>
                {editingCollId !== activeCollection.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStartEditCollection(activeCollection)}
                    className="font-mono text-[10px] uppercase h-7.5 px-3 border-border hover:border-primary/50 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    Edit Details
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteCollection(activeCollection.id)}
                  className="font-mono text-[10px] uppercase h-7.5 px-3 border-destructive/40 hover:bg-destructive/10 text-destructive cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>

            {editingCollId === activeCollection.id ? (
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
                    className="font-mono text-xs bg-background/50 border-primary/30 h-9"
                  />
                  <Input
                    value={editCollDesc}
                    onChange={(e) => setEditCollDesc(e.target.value)}
                    placeholder="Collection Description (optional)..."
                    className="font-mono text-xs bg-background/50 border-primary/30 h-9"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancelEditCollection}
                    className="font-mono text-xs uppercase h-7.5 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={savingCollEdit || !editCollName.trim()}
                    onClick={() => onSaveCollectionEdit(activeCollection.id)}
                    className="font-mono text-xs uppercase h-7.5 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
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
                        onClick={() => onRemoveItemFromCollection(activeCollection.id, item.templateId)}
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
                  if (e.key === "Enter") handleCreate();
                }}
              />
              <Button
                onClick={handleCreate}
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
                    <div className="space-y-3">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Edit Collection</span>
                      </div>
                      <Input
                        value={editCollName}
                        onChange={(e) => setEditCollName(e.target.value)}
                        placeholder="Collection Name..."
                        className="font-mono text-xs bg-background/50 border-primary/30 h-9"
                      />
                      <Input
                        value={editCollDesc}
                        onChange={(e) => setEditCollDesc(e.target.value)}
                        placeholder="Description (optional)..."
                        className="font-mono text-xs bg-background/50 border-primary/30 h-9"
                      />
                      <div className="flex gap-2 justify-end pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onCancelEditCollection}
                          className="font-mono text-[10px] uppercase h-7 px-2.5 cursor-pointer"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={savingCollEdit || !editCollName.trim()}
                          onClick={() => onSaveCollectionEdit(c.id)}
                          className="font-mono text-[10px] uppercase h-7 px-2.5 cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="space-y-2.5 cursor-pointer"
                        onClick={() => onOpenCollection(c)}
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
                          onClick={() => onOpenCollection(c)}
                          className="bg-primary/10 border border-primary/30 px-2.5 py-1 text-primary text-[9px] font-bold uppercase hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          {Number(c.itemCount || 0)} items
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playClick();
                              handleDownloadCppZip(c.id, c.name);
                            }}
                            disabled={downloadingCollId === c.id}
                            className="text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer p-1 disabled:opacity-50"
                            title="Download C++ (.cpp) folder ZIP"
                          >
                            {downloadingCollId === c.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <FolderDown className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => onStartEditCollection(c, e)}
                            className="text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer p-1"
                            title="Rename or edit description"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playClick();
                              onDeleteCollection(c.id);
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
  );
}
