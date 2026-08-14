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
  Users,
  UserPlus,
  UserCheck,
  Search,
  Crown,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Collection, CollectionItem, CollectionMember } from "./types";

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

  // Team Members Modal States
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [targetCollForMembers, setTargetCollForMembers] = useState<Collection | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersList, setMembersList] = useState<CollectionMember[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<{ id: number; username: string; email: string } | null>(null);
  const [isCurrentOwner, setIsCurrentOwner] = useState(true);

  // Invite Search States
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: number; username: string; email: string }[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [invitingUser, setInvitingUser] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  const fetchMembers = async (collId: number) => {
    try {
      setMembersLoading(true);
      const res = await fetch(`/api/users/collections/${collId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembersList(data.collaborators || []);
        setOwnerInfo(data.owner || null);
        setIsCurrentOwner(data.isOwner);
      } else {
        toast.error("Failed to load collection team members");
      }
    } catch {
      toast.error("Error loading team members");
    } finally {
      setMembersLoading(false);
    }
  };

  const handleOpenMembersModal = (coll: Collection, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playClick();
    setTargetCollForMembers(coll);
    setMembersModalOpen(true);
    setInviteSearchQuery("");
    setSearchResults([]);
    fetchMembers(coll.id);
  };

  const handleSearchUsers = async (q: string) => {
    setInviteSearchQuery(q);
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchingUsers(true);
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch {
      // silent catch for live search
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleInvite = async (usernameOrEmail: string) => {
    if (!targetCollForMembers || !usernameOrEmail.trim()) return;
    try {
      setInvitingUser(true);
      const res = await fetch(`/api/users/collections/${targetCollForMembers.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: usernameOrEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to invite user");
      }
      toast.success(`Successfully invited @${data.member.username} to the collection!`);
      setMembersList((prev) => [...prev, data.member]);
      setInviteSearchQuery("");
      setSearchResults([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to invite team member");
    } finally {
      setInvitingUser(false);
    }
  };

  const handleRemoveMember = async (memberUserId: number, memberUsername: string) => {
    if (!targetCollForMembers) return;
    try {
      setRemovingUserId(memberUserId);
      const res = await fetch(`/api/users/collections/${targetCollForMembers.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberUserId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove member");
      }
      toast.success(`Removed @${memberUsername}`);
      setMembersList((prev) => prev.filter((m) => m.userId !== memberUserId));
    } catch (err: any) {
      toast.error(err.message || "Error removing member");
    } finally {
      setRemovingUserId(null);
    }
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
                  onClick={(e) => handleOpenMembersModal(activeCollection, e)}
                  className="font-mono text-[10px] uppercase font-extrabold h-7.5 px-3 border-primary/40 hover:bg-primary/10 text-primary cursor-pointer"
                >
                  <Users className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  Team ({activeCollection.memberCount || 1})
                </Button>
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
                          <div className="flex items-center gap-1.5">
                            {c.isOwner === false && (
                              <span className="text-[9px] bg-primary/10 border border-primary/30 px-1.5 py-0.5 text-primary font-bold">
                                Shared by @{c.ownerUsername}
                              </span>
                            )}
                            <span className="text-[10px] text-primary group-hover:underline flex items-center gap-1 font-bold">
                              Open <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>

                        <h4 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                          {c.name}
                        </h4>

                        <p className="text-[10.5px] text-muted-foreground/60 leading-relaxed font-mono line-clamp-2">
                          {c.description || "No description provided."}
                        </p>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-border/30 flex items-center justify-between text-[10px] select-none text-muted-foreground/40 font-mono">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onOpenCollection(c)}
                            className="bg-primary/10 border border-primary/30 px-2.5 py-1 text-primary text-[9px] font-bold uppercase hover:bg-primary/20 transition-colors cursor-pointer"
                          >
                            {Number(c.itemCount || 0)} items
                          </button>
                          <button
                            onClick={(e) => handleOpenMembersModal(c, e)}
                            className="bg-muted/40 border border-border/50 hover:border-primary/40 px-2.5 py-1 text-foreground text-[9px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1"
                            title="Team Members & Collaboration"
                          >
                            <Users className="h-3 w-3 text-primary" />
                            <span>Team ({c.memberCount || 1})</span>
                          </button>
                        </div>
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

      {/* ── Team Members & Collaboration Invite Dialog ── */}
      <Dialog open={membersModalOpen} onOpenChange={setMembersModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#06141B] border-primary/30 text-foreground font-mono shadow-2xl p-6">
          <DialogHeader className="border-b border-border/40 pb-3 mb-4">
            <DialogTitle className="text-sm font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Team Collaboration — {targetCollForMembers?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Invite Registered User Section */}
            {isCurrentOwner ? (
              <div className="space-y-2 border border-primary/20 bg-primary/5 p-3.5 rounded-none">
                <label className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Invite Team Member</span>
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        placeholder="Enter registered username or email..."
                        value={inviteSearchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        className="font-mono text-xs bg-background/60 border-primary/30 h-8 pr-7"
                      />
                      {searchingUsers && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin absolute right-2 top-2 text-primary" />
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleInvite(inviteSearchQuery)}
                      disabled={invitingUser || !inviteSearchQuery.trim()}
                      className="font-mono text-xs uppercase h-8 px-3 shrink-0 cursor-pointer"
                    >
                      {invitingUser ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          Invite
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Autocomplete Search Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-primary/40 shadow-2xl divide-y divide-border/30 max-h-48 overflow-y-auto font-mono">
                      {searchResults.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            handleInvite(u.username);
                          }}
                          className="p-2 text-xs flex items-center justify-between hover:bg-primary/10 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-primary">@{u.username}</span>
                            <span className="text-[10px] text-muted-foreground">({u.email})</span>
                          </div>
                          <span className="text-[9px] uppercase font-bold text-primary flex items-center gap-1">
                            <UserCheck className="h-3 w-3" /> Add
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[9.5px] text-muted-foreground/60 leading-tight">
                  Team members can view, add, and edit templates in this collection.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-muted/20 border border-border/40 text-xs text-muted-foreground/80 flex items-center justify-between">
                <span>Owned by <strong className="text-primary">@{ownerInfo?.username}</strong></span>
                <span className="text-[9px] uppercase bg-primary/10 border border-primary/30 px-2 py-0.5 text-primary font-bold">Collaborator</span>
              </div>
            )}

            {/* Current Members List */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center justify-between">
                <span>Collection Members ({membersList.length + 1})</span>
              </div>

              {membersLoading ? (
                <div className="p-6 text-center text-xs text-muted-foreground/40 animate-pulse">
                  Loading team members...
                </div>
              ) : (
                <div className="border border-border/50 bg-card/20 divide-y divide-border/30 max-h-56 overflow-y-auto">
                  {/* Owner Row */}
                  {ownerInfo && (
                    <div className="p-2.5 flex items-center justify-between text-xs hover:bg-muted/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <Crown className="h-4 w-4 text-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate">
                            @{ownerInfo.username}
                          </div>
                          <div className="text-[10px] text-muted-foreground/50 truncate">
                            {ownerInfo.email}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-400 shrink-0">
                        Owner
                      </span>
                    </div>
                  )}

                  {/* Collaborators Rows */}
                  {membersList.map((m) => (
                    <div key={m.userId} className="p-2.5 flex items-center justify-between text-xs hover:bg-muted/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate">
                            @{m.username}
                          </div>
                          <div className="text-[10px] text-muted-foreground/50 truncate">
                            {m.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary">
                          {m.role || "Editor"}
                        </span>
                        {isCurrentOwner && (
                          <button
                            onClick={() => handleRemoveMember(m.userId, m.username)}
                            disabled={removingUserId === m.userId}
                            className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 cursor-pointer"
                            title="Remove team member"
                          >
                            {removingUserId === m.userId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
