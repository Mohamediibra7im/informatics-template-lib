"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelection } from "./selection-context";
import { useAuth } from "./auth-provider";
import { useTerminalTheme } from "./theme-provider";
import { Printer, FolderPlus, X, Check, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Collection {
  id: number;
  name: string;
  itemCount: number;
}

export function MultiSelectBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { playClick, playSuccess } = useTerminalTheme();
  const { selectedIds, clearSelection } = useSelection();

  const [openCollectionModal, setOpenCollectionModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [addingToColl, setAddingToColl] = useState(false);

  const count = selectedIds.size;

  useEffect(() => {
    if (openCollectionModal && user) {
      fetchCollections();
    }
  }, [openCollectionModal, user]);

  const fetchCollections = async () => {
    setLoadingCollections(true);
    try {
      const res = await fetch("/api/users/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch {
      toast.error("Failed to load collections");
    } finally {
      setLoadingCollections(false);
    }
  };

  if (count === 0 || pathname === "/editor") return null;

  const handlePrint = () => {
    playClick();
    const ids = Array.from(selectedIds).join(",");
    clearSelection();
    router.push(`/editor?ids=${ids}`);
  };

  const handleAddToCollection = async () => {
    if (!user) {
      toast.error("Please login to save to a collection");
      router.push("/login");
      return;
    }
    setOpenCollectionModal(true);
  };

  const handleConfirmAddToCollection = async () => {
    playClick();
    let targetId = selectedCollectionId;

    if (!targetId && newCollectionName.trim()) {
      // Create new collection first
      try {
        setAddingToColl(true);
        const res = await fetch("/api/users/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCollectionName.trim() }),
        });
        const data = await res.json();
        if (res.ok && data.collection) {
          targetId = data.collection.id;
        } else {
          toast.error(data.error || "Failed to create collection");
          setAddingToColl(false);
          return;
        }
      } catch {
        toast.error("Failed to create collection");
        setAddingToColl(false);
        return;
      }
    }

    if (!targetId) {
      toast.error("Please select or name a collection");
      return;
    }

    try {
      setAddingToColl(true);
      const templateIds = Array.from(selectedIds);
      const res = await fetch("/api/users/collections/batch-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: targetId, templateIds }),
      });
      const data = await res.json();

      if (res.ok) {
        playSuccess();
        toast.success(
          `Added ${data.addedCount} template${data.addedCount === 1 ? "" : "s"} to collection!`
        );
        setOpenCollectionModal(false);
        setSelectedCollectionId(null);
        setNewCollectionName("");
        clearSelection();
      } else {
        toast.error(data.error || "Failed to add items to collection");
      }
    } catch {
      toast.error("Error adding templates to collection");
    } finally {
      setAddingToColl(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in font-mono print:hidden w-[calc(100vw-1.5rem)] max-w-fit sm:w-auto">
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-2.5 border border-primary/40 bg-card/95 backdrop-blur-md shadow-[0_0_35px_rgba(0,0,0,0.8)] rounded-none w-full max-w-full">
          <div className="flex items-center gap-1.5 sm:gap-2 pr-1.5 sm:pr-2 border-r border-border text-xs font-extrabold text-foreground shrink-0">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
            <span>{count}</span>
            <span className="text-muted-foreground uppercase text-[10px] tracking-wider hidden sm:inline">selected</span>
            <span className="text-muted-foreground uppercase text-[9px] tracking-wider sm:hidden">sel</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handlePrint}
              className="font-mono text-[11px] sm:text-xs font-extrabold uppercase bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer h-8 px-2 sm:px-3 shrink-0"
            >
              <Printer className="h-3.5 w-3.5 mr-1 sm:mr-1.5 shrink-0" />
              <span className="hidden sm:inline">Print Book</span>
              <span className="sm:hidden">Print</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToCollection}
              className="font-mono text-[11px] sm:text-xs font-bold uppercase border-border hover:border-primary/50 text-foreground cursor-pointer h-8 px-2 sm:px-3 shrink-0"
            >
              <FolderPlus className="h-3.5 w-3.5 mr-1 sm:mr-1.5 text-primary shrink-0" />
              <span className="hidden md:inline">Add to Collection</span>
              <span className="hidden sm:inline md:hidden">Collection</span>
              <span className="sm:hidden">+ Collection</span>
            </Button>

            <button
              onClick={() => {
                playClick();
                clearSelection();
              }}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-0.5 sm:ml-1 shrink-0"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add to Collection Modal */}
      <Dialog open={openCollectionModal} onOpenChange={setOpenCollectionModal}>
        <DialogContent className="border border-primary/30 bg-card p-4 sm:p-6 font-mono max-w-[calc(100vw-2rem)] sm:max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              Add {count} Templates to Collection
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Existing collections */}
            {loadingCollections ? (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                <span>Loading collections...</span>
              </div>
            ) : collections.length > 0 ? (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground/70">
                  Select Existing Collection
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {collections.map((coll) => (
                    <button
                      key={coll.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setSelectedCollectionId(coll.id);
                        setNewCollectionName("");
                      }}
                      className={`w-full flex items-center justify-between p-2 text-xs border text-left transition-all ${
                        selectedCollectionId === coll.id
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border/60 hover:border-primary/40 bg-background/30 text-foreground"
                      }`}
                    >
                      <span className="truncate">{coll.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {coll.itemCount} items
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Create new inline */}
            <div className="space-y-2 pt-1 border-t border-border/40">
              <label className="text-[10px] uppercase font-bold text-muted-foreground/70">
                Or Create New Collection
              </label>
              <Input
                type="text"
                placeholder="Collection name (e.g. Graph Algorithms)"
                value={newCollectionName}
                onChange={(e) => {
                  setNewCollectionName(e.target.value);
                  if (e.target.value) setSelectedCollectionId(null);
                }}
                className="font-mono text-xs bg-background/50 border-border"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenCollectionModal(false)}
                className="font-mono text-xs border-border"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAddToCollection}
                disabled={addingToColl || (!selectedCollectionId && !newCollectionName.trim())}
                className="font-mono text-xs font-bold uppercase bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {addingToColl ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    <span>Confirm Add</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
