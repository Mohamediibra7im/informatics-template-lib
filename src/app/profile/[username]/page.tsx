import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/db";
import { users, userProfiles, contributions, templates } from "@/db/schema";
import { eq, or, sql, and, desc } from "drizzle-orm";
import { TerminalBreadcrumb } from "@/components/terminal";
import {
  User,
  ShieldCheck,
  Target,
  Terminal,
  ExternalLink,
  Code2,
  Calendar,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  return {
    title: `${decoded}'s Profile | CP-Base`,
    description: `Public profile and competitive programming templates by ${decoded}`,
  };
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username).trim();
  const db = getDb();
  if (!db) notFound();

  // Find user by username, display name, or CF handle
  const [profileData] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      createdAt: users.createdAt,
      name: userProfiles.name,
      bio: userProfiles.bio,
      avatarUrl: userProfiles.avatarUrl,
      codeforcesHandle: userProfiles.codeforcesHandle,
      atcoderHandle: userProfiles.atcoderHandle,
      leetcodeHandle: userProfiles.leetcodeHandle,
      codechefHandle: userProfiles.codechefHandle,
      ratingGoal: userProfiles.ratingGoal,
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(
      or(
        sql`LOWER(${users.username}) = LOWER(${decodedUsername})`,
        sql`LOWER(${userProfiles.name}) = LOWER(${decodedUsername})`,
        sql`LOWER(${userProfiles.codeforcesHandle}) = LOWER(${decodedUsername})`
      )
    )
    .limit(1);

  if (!profileData) {
    notFound();
  }

  const displayName = profileData.name || profileData.username;
  const handle = profileData.username;
  const avatar = profileData.avatarUrl;
  const bio = profileData.bio;
  const goal = profileData.ratingGoal;

  // Fetch approved template contributions by this user
  const approvedContributions = await db
    .select({
      id: contributions.id,
      title: contributions.title,
      slug: contributions.slug,
      createdAt: contributions.createdAt,
      templateId: contributions.templateId,
      templateTitle: templates.title,
      templateSlug: templates.slug,
    })
    .from(contributions)
    .leftJoin(templates, eq(contributions.templateId, templates.id))
    .where(
      and(
        eq(contributions.userId, profileData.id),
        eq(contributions.status, "approved")
      )
    )
    .orderBy(desc(contributions.createdAt));

  return (
    <div className="relative z-10 mx-auto max-w-4xl w-full px-4 py-12 font-mono">
      <TerminalBreadcrumb
        className="mb-8"
        items={[
          { label: "home", href: "/" },
          { label: "contributors", href: "/contribute" },
          { label: `@${handle}` },
        ]}
      />

      {/* Main Profile Card Container */}
      <div className="border border-border/80 bg-card/45 backdrop-blur-md shadow-2xl overflow-hidden">
        {/* Terminal Header Bar */}
        <div className="px-4 py-3 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span>CONTRIBUTOR_PROFILE // @{handle.toUpperCase()}</span>
          </div>
          <span className="text-[9px] text-primary/70 border border-primary/30 bg-primary/10 px-2 py-0.5">
            VERIFIED_USER
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Identity Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-border/30">
            {/* Avatar with Online Status Dot */}
            <div className="relative flex items-center justify-center h-20 w-20 border-2 border-primary/40 bg-primary/10 shrink-0 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]">
              {avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={avatar}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
              <span
                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-success border-2 border-card shadow-[0_0_10px_#22c55e]"
                title="Status: Online"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-wide">
                  {displayName}
                </h1>
                <span className="text-[9px] uppercase tracking-widest text-primary border border-primary/40 bg-primary/10 px-2 py-0.5 font-bold select-none">
                  CONTRIBUTOR
                </span>
              </div>
              <div className="text-xs text-muted-foreground/60 font-mono">
                @{handle}
              </div>
              <div className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground/50 flex-wrap">
                <span className="flex items-center gap-1 text-success font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>SESSION_ACTIVE</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Joined {new Date(profileData.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Personal Bio */}
          {bio ? (
            <div className="space-y-1.5">
              <div className="text-[9.5px] text-muted-foreground/45 uppercase tracking-widest font-bold flex items-center gap-1 select-none">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Personal Bio / Summary</span>
              </div>
              <div className="bg-background/40 p-4 border border-border/40 text-xs text-foreground/90 leading-relaxed italic break-words break-all whitespace-pre-wrap">
                &ldquo;{bio}&rdquo;
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground/40 italic bg-background/20 p-3 border border-dashed border-border/30">
              No personal bio provided yet.
            </div>
          )}

          {/* Goal Chip (if set) */}
          {goal && (
            <div className="flex items-start gap-2 bg-warning/5 border border-warning/30 p-3 text-xs text-warning font-bold">
              <Target className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="min-w-0 break-words break-all">
                <span className="text-muted-foreground/60 uppercase font-mono mr-1.5">CURRENT GOAL:</span>
                <span>{goal}</span>
              </div>
            </div>
          )}

          {/* Competitive Programming Profiles */}
          <div className="space-y-2.5 pt-2">
            <div className="text-[9.5px] text-muted-foreground/45 uppercase tracking-widest font-bold flex items-center gap-1 select-none">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              <span>Competitive Programming Handles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Codeforces */}
              <div className="bg-card/40 border border-border/50 p-3 space-y-1.5">
                <div className="text-[9.5px] uppercase tracking-widest text-red-400 font-extrabold flex items-center justify-between">
                  <span>Codeforces</span>
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                </div>
                {profileData.codeforcesHandle ? (
                  <a
                    href={`https://codeforces.com/profile/${profileData.codeforcesHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary font-bold transition-colors flex items-center justify-between gap-1 text-xs"
                  >
                    <span className="truncate">@{profileData.codeforcesHandle}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground/40 italic">Unlinked</span>
                )}
              </div>

              {/* AtCoder */}
              <div className="bg-card/40 border border-border/50 p-3 space-y-1.5">
                <div className="text-[9.5px] uppercase tracking-widest text-zinc-400 font-extrabold flex items-center justify-between">
                  <span>AtCoder</span>
                  <span className="h-2 w-2 rounded-full bg-zinc-400" />
                </div>
                {profileData.atcoderHandle ? (
                  <a
                    href={`https://atcoder.jp/users/${profileData.atcoderHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary font-bold transition-colors flex items-center justify-between gap-1 text-xs"
                  >
                    <span className="truncate">@{profileData.atcoderHandle}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground/40 italic">Unlinked</span>
                )}
              </div>

              {/* LeetCode */}
              <div className="bg-card/40 border border-border/50 p-3 space-y-1.5">
                <div className="text-[9.5px] uppercase tracking-widest text-amber-400 font-extrabold flex items-center justify-between">
                  <span>LeetCode</span>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                </div>
                {profileData.leetcodeHandle ? (
                  <a
                    href={`https://leetcode.com/${profileData.leetcodeHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary font-bold transition-colors flex items-center justify-between gap-1 text-xs"
                  >
                    <span className="truncate">@{profileData.leetcodeHandle}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground/40 italic">Unlinked</span>
                )}
              </div>

              {/* CodeChef */}
              <div className="bg-card/40 border border-border/50 p-3 space-y-1.5">
                <div className="text-[9.5px] uppercase tracking-widest text-emerald-400 font-extrabold flex items-center justify-between">
                  <span>CodeChef</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                {profileData.codechefHandle ? (
                  <a
                    href={`https://www.codechef.com/users/${profileData.codechefHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary font-bold transition-colors flex items-center justify-between gap-1 text-xs"
                  >
                    <span className="truncate">@{profileData.codechefHandle}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground/40 italic">Unlinked</span>
                )}
              </div>
            </div>
          </div>

          {/* Approved Contributions Section */}
          <div className="space-y-3 pt-4 border-t border-border/30">
            <div className="text-[9.5px] text-muted-foreground/45 uppercase tracking-widest font-bold flex items-center justify-between select-none">
              <span className="flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                <span>Approved Template Contributions</span>
              </span>
              <span className="text-primary font-mono">{approvedContributions.length} Published</span>
            </div>

            {approvedContributions.length === 0 ? (
              <div className="p-4 border border-dashed border-border/40 bg-background/20 text-[11px] text-muted-foreground/40 text-center italic">
                No approved template contributions published yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {approvedContributions.map((item) => {
                  const targetSlug = item.templateSlug || item.slug;
                  return (
                    <Link
                      key={item.id}
                      href={`/template/${targetSlug}`}
                      className="border border-border/50 bg-background/40 hover:bg-primary/5 hover:border-primary/40 p-3 transition-colors group flex flex-col justify-between space-y-2"
                    >
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {item.templateTitle || item.title}
                      </div>
                      <div className="text-[9.5px] text-muted-foreground/40 font-mono truncate">
                        /template/{targetSlug}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
