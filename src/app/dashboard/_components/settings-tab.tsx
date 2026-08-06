"use client";

import { useState } from "react";
import { isSafeImageUrl } from "@/lib/utils";
import { Settings, Calendar, Copy, Terminal, User, Lock, Sparkles, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Profile } from "./types";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";

interface SettingsTabProps {
  displayName: string;
  bio: string;
  avatarUrl: string;
  cfHandle: string;
  acHandle: string;
  lcHandle: string;
  ccHandle: string;
  saving: boolean;
  profile: Profile | null;
  username?: string;
  email?: string;
  isLocalhost: boolean;
  playClick: () => void;
  onSaveProfile: () => void;
  onCheckHandleVerification: (platform: string, handle: string) => Promise<void>;
  onCopyCalendarLink: () => void;
  setDisplayName: (val: string) => void;
  setBio: (val: string) => void;
  setAvatarUrl: (val: string) => void;
  setCfHandle: (val: string) => void;
  setAcHandle: (val: string) => void;
  setLcHandle: (val: string) => void;
  setCcHandle: (val: string) => void;
}

const PRESET_AVATARS = [
  { name: "Cyber Bot", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Midoriya" },
  { name: "Quantum Dev", url: "https://api.dicebear.com/7.x/identicon/svg?seed=CPBase" },
  { name: "Neon Hacker", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Hacker" },
  { name: "Algo Master", url: "https://api.dicebear.com/7.x/thumbs/svg?seed=AlgoMaster" },
  { name: "Pixel Knight", url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja" },
];

export function SettingsTab({
  displayName,
  bio,
  avatarUrl,
  cfHandle,
  acHandle,
  lcHandle,
  ccHandle,
  saving,
  profile,
  username,
  email,
  isLocalhost,
  playClick,
  onSaveProfile,
  onCheckHandleVerification,
  onCopyCalendarLink,
  setDisplayName,
  setBio,
  setAvatarUrl,
}: SettingsTabProps) {
  const [verifyingPlatform, setVerifyingPlatform] = useState<string | null>(null);
  const [verifyInputVal, setVerifyInputVal] = useState("");
  const [isCheckingVerify, setIsCheckingVerify] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const { startUpload } = useUploadThing("avatarUploader", {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      setUploadProgress(100);
      if (res?.[0]?.url) {
        setAvatarUrl(res[0].url);
        toast.success("Avatar image uploaded successfully! (< 1MB)");
      }
    },
    onUploadError: (error: Error) => {
      setIsUploading(false);
      toast.error(`Upload error: ${error.message}`);
    },
    onUploadProgress: (p: number) => {
      setUploadProgress(p);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("File size exceeds 1MB limit. Please select a smaller image.");
      e.target.value = "";
      return;
    }

    // Rename file using user's username
    const ext = file.name.split(".").pop() || "png";
    const cleanUsername = username ? username.toLowerCase().replace(/[^a-z0-9_-]/g, "_") : "user";
    const renamedFile = new File([file], `${cleanUsername}_avatar.${ext}`, { type: file.type });

    setIsUploading(true);
    setUploadProgress(10);
    await startUpload([renamedFile]);
    e.target.value = "";
  };

  const handleVerify = async (platform: string) => {
    if (!verifyInputVal.trim()) return;
    setIsCheckingVerify(true);
    await onCheckHandleVerification(platform, verifyInputVal.trim());
    setIsCheckingVerify(false);
    setVerifyingPlatform(null);
    setVerifyInputVal("");
  };

  return (
    <div className="space-y-6 animate-fade-in font-mono">
      
      {/* Profile & Account Preferences Panel */}
      <div className="border border-border bg-card/40 backdrop-blur-md shadow-2xl">
        <div className="px-4 py-3 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold flex items-center gap-2 select-none">
          <User className="h-4 w-4 text-primary" />
          <span>Profile & Public Identity Settings</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar Section */}
          <div className="space-y-3">
            <Label className="text-[10.5px] uppercase tracking-widest text-foreground font-extrabold flex items-center gap-1.5 select-none">
              <ImageIcon className="h-3.5 w-3.5 text-primary" />
              <span>Profile Avatar</span>
            </Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Interactive Avatar Frame with Hover Camera Overlay */}
              <div className="relative group cursor-pointer shrink-0 select-none">
                <div className="relative h-20 w-20 border-2 border-primary/40 bg-primary/10 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary">
                  {avatarUrl && isSafeImageUrl(avatarUrl) ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-primary" />
                  )}

                  {/* Hover Camera Overlay */}
                  <label className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center p-1">
                    <Upload className="h-4 w-4 text-primary animate-bounce mb-1" />
                    <span className="text-[8.5px] font-bold uppercase text-primary tracking-wider">Upload Avatar</span>
                    <span className="text-[7.5px] text-muted-foreground/60">(&lt; 1MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Controls & Progress Section */}
              <div className="space-y-3 flex-1 w-full font-mono">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Custom Upload Button */}
                  <label className={`inline-flex items-center gap-2 px-3.5 py-2 border text-[10.5px] font-bold uppercase tracking-wider font-mono cursor-pointer transition-all select-none ${
                    isUploading
                      ? "border-warning/50 bg-warning/10 text-warning cursor-not-allowed"
                      : "border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary hover:border-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]"
                  }`}>
                    <Upload className={`h-3.5 w-3.5 ${isUploading ? "animate-spin" : ""}`} />
                    <span>{isUploading ? `Uploading ${uploadProgress}%` : "Upload Image (< 1MB)"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  <span className="text-[9.5px] text-muted-foreground/40 uppercase font-bold select-none">— OR —</span>

                  {/* Preset Selector */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9.5px] text-muted-foreground/50 uppercase font-bold select-none">Presets:</span>
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          playClick();
                          setAvatarUrl(preset.url);
                        }}
                        className={`px-2 py-1 text-[9px] border uppercase font-bold transition-colors cursor-pointer ${
                          avatarUrl === preset.url
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/40 text-muted-foreground/50 hover:text-foreground"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Progress Bar (when uploading) */}
                {isUploading && (
                  <div className="space-y-1 bg-background/40 p-2.5 border border-primary/30 animate-pulse">
                    <div className="flex justify-between text-[9.5px] font-mono text-primary uppercase font-bold select-none">
                      <span className="flex items-center gap-1">
                        <Terminal className="h-3 w-3 animate-spin" />
                        <span>UPLOADING_AVATAR_IMAGE...</span>
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-primary/10 overflow-hidden">
                      <div
                        className="h-full bg-primary shadow-[0_0_8px_var(--primary-glow)] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Custom URL Input */}
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Or paste custom image URL (https://...)..."
                  className="font-mono text-xs bg-background/40 border-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/30 h-9"
                />
              </div>
            </div>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <Label className="text-[10.5px] uppercase tracking-widest text-foreground font-extrabold">
              Display Name
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your full name or public alias (e.g. Mohamed Ibrahim)..."
              className="font-mono text-xs bg-background/40 border-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/30 h-9"
            />
          </div>

          {/* Bio Input */}
          <div className="space-y-1.5">
            <Label className="text-[10.5px] uppercase tracking-widest text-foreground font-extrabold">
              Personal Bio / Summary
            </Label>
            <Input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio (e.g. Candidate Master on CF | Graph & DP Specialist)..."
              className="font-mono text-xs bg-background/40 border-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/30 h-9"
            />
          </div>

          {/* System Account Identifiers (Read-only Username & Email) */}
          <div className="pt-2 border-t border-border/30 space-y-3">
            <div className="text-[9.5px] uppercase tracking-widest text-muted-foreground/45 font-bold flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              <span>Account Credentials (Read-Only)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-background/20 p-2.5 border border-border/40 space-y-0.5">
                <span className="text-[9px] text-muted-foreground/40 uppercase block">Username</span>
                <span className="font-extrabold text-foreground">{username}</span>
              </div>
              <div className="bg-background/20 p-2.5 border border-border/40 space-y-0.5">
                <span className="text-[9px] text-muted-foreground/40 uppercase block">Email Address</span>
                <span className="font-extrabold text-foreground">{email}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={onSaveProfile}
            disabled={saving}
            className="font-mono text-xs uppercase font-extrabold tracking-wider h-9.5 border border-primary/30 hover:border-primary bg-primary/10 text-primary cursor-pointer w-full"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Terminal className="h-4 w-4 animate-spin" />
                Saving Profile Settings...
              </span>
            ) : (
              "Save Profile Settings"
            )}
          </Button>
        </div>
      </div>

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
                        className="font-mono text-xs bg-background/40 border-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/30 h-9"
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
                            1. Open Codeforces profile settings.
                            <br />
                            2. Set First Name or Organization to:
                            <br />
                            <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/10 px-1.5 py-0.5 border border-primary/20">
                              {profile?.verificationToken || "..."}
                            </strong>
                            <br />
                            3. Save on Codeforces and click Check Verification below.
                          </div>
                        )}
                        {field.key === "atcoder" && (
                          <div>
                            1. Open AtCoder profile settings.
                            <br />
                            2. Set Affiliation or Bio to:
                            <br />
                            <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/10 px-1.5 py-0.5 border border-primary/20">
                              {profile?.verificationToken || "..."}
                            </strong>
                            <br />
                            3. Save on AtCoder and click Check Verification.
                          </div>
                        )}
                        {field.key === "leetcode" && (
                          <div>
                            1. Open LeetCode profile settings.
                            <br />
                            2. Paste token in About Me / Bio:
                            <br />
                            <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/10 px-1.5 py-0.5 border border-primary/20">
                              {profile?.verificationToken || "..."}
                            </strong>
                            <br />
                            3. Save on LeetCode and click Check Verification.
                          </div>
                        )}
                        {field.key === "codechef" && (
                          <div>
                            1. Open CodeChef profile settings.
                            <br />
                            2. Set Name or Bio to:
                            <br />
                            <strong className="text-primary tracking-wider font-mono font-bold select-all bg-primary/10 px-1.5 py-0.5 border border-primary/20">
                              {profile?.verificationToken || "..."}
                            </strong>
                            <br />
                            3. Save on CodeChef and click Check Verification.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleVerify(field.key)}
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
            onClick={onCopyCalendarLink}
            variant="outline"
            className="font-mono text-xs uppercase font-bold tracking-wider border-primary/30 hover:border-primary text-primary cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5 mr-2" />
            Copy Calendar Feed URL
          </Button>

          <div className="mt-4 pt-4 border-t border-border/30 text-[10.5px] text-muted-foreground/50 space-y-3 font-mono">
            <div className="font-extrabold text-foreground uppercase tracking-widest text-[9.5px]">Calendar Subscription Setup:</div>

            <div className="space-y-1">
              <div className="text-primary font-bold">1. Google Calendar:</div>
              <div className="pl-3 leading-relaxed">
                Web Calendar &rarr; Click <strong className="text-foreground font-bold">+</strong> next to &ldquo;Other calendars&rdquo; &rarr; Select{" "}
                <strong className="text-foreground font-bold">From URL</strong> &rarr; Paste copied URL &rarr; Add calendar.
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
                Outlook Calendar &rarr; <strong className="text-foreground font-bold">Add Calendar</strong> &rarr;{" "}
                <strong className="text-foreground font-bold">Subscribe from web</strong> &rarr; Paste copied URL &rarr; Import.
              </div>
            </div>

            {isLocalhost && (
              <div className="mt-3 p-3 border border-warning/30 bg-warning/10 text-warning text-[10px] leading-relaxed select-text font-mono">
                <strong className="uppercase font-extrabold block mb-1">[!] LOCALHOST NOTE:</strong>
                Cloud web services (Google Calendar, Outlook Web) cannot reach <code className="bg-warning/20 px-1 py-0.5 font-bold">localhost</code> URLs directly. Test with local client apps (Apple Calendar / Windows Calendar) during development. Sync works seamlessly once deployed to public hosting.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
