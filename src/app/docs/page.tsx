"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Terminal,
  Search,
  Copy,
  Code2,
  Calendar,
  Trophy,
  BarChart3,
  FolderOpen,
  GitPullRequest,
  Settings,
  Users,
  Layers,
  Heart,
  LayoutDashboard,
  Menu,
  X,
  ArrowUp,
  Compass,
  Library,
  Award,
  Activity,
  Globe,
  UserCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useTerminalTheme } from "@/components/theme-provider";

/* ── Section definitions ─────────────────────────────────────────── */

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
  cmd: string;
}

const sections: Section[] = [
  { id: "getting-started", label: "Getting Started", icon: <Terminal className="h-3.5 w-3.5" />, cmd: "cat getting_started.md" },
  { id: "browsing-templates", label: "Browsing Templates", icon: <Compass className="h-3.5 w-3.5" />, cmd: "ls templates/ --verbose" },
  { id: "copy-and-use", label: "Copy & Use", icon: <Copy className="h-3.5 w-3.5" />, cmd: "cp template.cpp ./solution.cpp" },
  { id: "user-accounts", label: "User Accounts", icon: <Users className="h-3.5 w-3.5" />, cmd: "useradd --register" },
  { id: "dashboard-overview", label: "Dashboard Overview", icon: <LayoutDashboard className="h-3.5 w-3.5" />, cmd: "cat dashboard/overview.log" },
  { id: "my-templates", label: "My Templates", icon: <Library className="h-3.5 w-3.5" />, cmd: "ls ~/templates --saved" },
  { id: "collections", label: "Collections", icon: <FolderOpen className="h-3.5 w-3.5" />, cmd: "ls ~/collections/" },
  { id: "progress-tracking", label: "Progress Tracking", icon: <BarChart3 className="h-3.5 w-3.5" />, cmd: "track --status pipeline" },
  { id: "statistics", label: "Statistics & Analytics", icon: <Activity className="h-3.5 w-3.5" />, cmd: "stats --readiness-score" },
  { id: "contributing", label: "Contributing", icon: <GitPullRequest className="h-3.5 w-3.5" />, cmd: "git push origin contribution" },
  { id: "contest-calendar", label: "Contest Calendar", icon: <Calendar className="h-3.5 w-3.5" />, cmd: "cron contests --watch" },
  { id: "cp-profiles", label: "CP Profiles", icon: <Trophy className="h-3.5 w-3.5" />, cmd: "whoami --cf-stats" },
  { id: "public-profile", label: "Public Profile", icon: <UserCircle className="h-3.5 w-3.5" />, cmd: "cat ~/profile/public.json" },
  { id: "settings", label: "Settings & Preferences", icon: <Settings className="h-3.5 w-3.5" />, cmd: "nano ~/.itl/config" },
];

/* ── Reusable sub-components ─────────────────────────────────────── */

function SectionHeader({ section }: { section: Section }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-mono">
        <span className="text-primary">$</span>
        <span className="text-foreground font-bold">{section.cmd}</span>
        <span className="inline-block h-3 w-1.5 bg-primary animate-blink ml-1" />
      </div>
      <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5 uppercase">
        <span className="text-primary">{section.icon}</span>
        {section.label}
      </h2>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-info/25 bg-info/5 p-3 flex items-start gap-2.5 text-[11px] text-info/80 leading-relaxed my-4">
      <Terminal className="h-3.5 w-3.5 shrink-0 mt-0.5 text-info" />
      <div>{children}</div>
    </div>
  );
}

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 border border-border bg-card/60 text-[9px] font-mono text-muted-foreground tracking-wider mx-0.5">
      {children}
    </kbd>
  );
}

function StatusBadge({ status, color }: { status: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: "text-success border-success/30 bg-success/5",
    yellow: "text-warning border-warning/30 bg-warning/5",
    blue: "text-blue-400 border-blue-400/30 bg-blue-400/5",
    red: "text-destructive border-destructive/30 bg-destructive/5",
    primary: "text-primary border-primary/30 bg-primary/5",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold border ${colorMap[color] || colorMap.primary}`}>
      {status}
    </span>
  );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex items-center justify-center h-7 w-7 border border-primary/15 bg-primary/5 text-primary shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground/55 leading-relaxed mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-2 my-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-2.5 text-[11px] text-muted-foreground/65 leading-relaxed">
          <span className="text-primary font-bold text-[10px] mt-px shrink-0">[{String(i + 1).padStart(2, "0")}]</span>
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */

export default function DocsPage() {
  const { playClick } = useTerminalTheme();
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [tocOpen, setTocOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Intersection Observer to highlight active section in TOC
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    for (const s of sections) {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // Show scroll-to-top after scrolling
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    playClick();
    setTocOpen(false);
    const el = sectionRefs.current[id];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="relative z-10 min-h-screen text-foreground select-none font-mono">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[500px] h-[500px] rounded-full bg-primary/4 blur-[130px] animate-glow-pulse" />
        <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full bg-info/3 blur-[120px] animate-glow-pulse-light" />
        <div className="absolute bottom-[15%] left-[30%] w-[500px] h-[500px] rounded-full bg-success/3 blur-[140px] animate-glow-pulse" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:py-14">
        {/* Page Header */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/" onClick={playClick} className="hover:text-primary transition-colors">home</Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
            <span className="text-primary font-bold">documentation</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="text-primary">$</span>
            <span className="text-foreground font-bold">man itl</span>
            <span className="inline-block h-3 w-1.5 bg-primary animate-blink ml-1" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            DOCUMENTATION
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground/60 leading-relaxed mt-2 max-w-2xl">
            Complete guide to every feature in ITL. Learn how to maximize your competitive programming workflow — from template browsing to progress tracking and contest scheduling.
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="border border-border/60 bg-card/30 px-3 py-1.5 text-[10px] text-muted-foreground/50 flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 text-primary" />
              <span>{sections.length} sections</span>
            </div>
            <div className="border border-border/60 bg-card/30 px-3 py-1.5 text-[10px] text-muted-foreground/50 flex items-center gap-1.5">
              <Layers className="h-3 w-3 text-info" />
              <span>All features covered</span>
            </div>
            <div className="border border-border/60 bg-card/30 px-3 py-1.5 text-[10px] text-muted-foreground/50 flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-success" />
              <span>Always up to date</span>
            </div>
          </div>
        </div>

        {/* Layout: Sidebar + Content */}
        <div className="flex gap-8">
          {/* ── Desktop Sidebar TOC ─────────────────────── */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20">
              <div className="border border-border bg-card/35 backdrop-blur-md shadow-xl">
                <div className="px-3 py-2 border-b border-border/40 bg-muted/15 text-[9px] uppercase tracking-widest text-muted-foreground/40 font-bold flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3 text-primary" />
                  <span>Table of Contents</span>
                </div>
                <nav className="p-2 space-y-0.5 max-h-[calc(100vh-140px)] overflow-y-auto">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] tracking-wide transition-all text-left cursor-pointer ${
                        activeSection === s.id
                          ? "text-primary bg-primary/5 border-l-2 border-primary"
                          : "text-muted-foreground/40 hover:text-foreground border-l-2 border-transparent"
                      }`}
                    >
                      {s.icon}
                      <span className="uppercase font-bold truncate">{s.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* ── Mobile TOC Toggle ─────────────────────── */}
          <div className="lg:hidden fixed bottom-6 right-6 z-50">
            <button
              onClick={() => { playClick(); setTocOpen(!tocOpen); }}
              className="h-11 w-11 flex items-center justify-center border border-primary bg-card/90 backdrop-blur-md text-primary shadow-[0_0_20px_var(--primary-glow-weak)] hover:shadow-[0_0_30px_var(--primary-glow)] transition-all cursor-pointer"
            >
              {tocOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {/* ── Mobile TOC Drawer ─────────────────────── */}
          {tocOpen && (
            <div className="lg:hidden fixed inset-0 z-40">
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setTocOpen(false)} />
              <div className="absolute bottom-20 right-6 w-64 border border-border bg-card/95 backdrop-blur-md shadow-2xl animate-slide-up">
                <div className="px-3 py-2 border-b border-border/40 bg-muted/15 text-[9px] uppercase tracking-widest text-muted-foreground/40 font-bold flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3 text-primary" />
                  <span>Navigate</span>
                </div>
                <nav className="p-2 space-y-0.5 max-h-[60vh] overflow-y-auto">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 text-[10px] tracking-wide transition-all text-left cursor-pointer ${
                        activeSection === s.id
                          ? "text-primary bg-primary/5 border-l-2 border-primary"
                          : "text-muted-foreground/40 hover:text-foreground border-l-2 border-transparent"
                      }`}
                    >
                      {s.icon}
                      <span className="uppercase font-bold">{s.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* ── Main Content ─────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* ━━━ 1. Getting Started ━━━ */}
            <section
              id="getting-started"
              ref={(el) => { sectionRefs.current["getting-started"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[0]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  <strong className="text-foreground">Informatics Template Lib (ITL)</strong> is a competitive programming template library designed to help you find, copy, and organize optimized algorithm implementations for contests. Think of it as your personal algorithm toolbox — always accessible, always ready.
                </p>
                <p>
                  Whether you&apos;re preparing for Codeforces rounds, AtCoder contests, LeetCode weeklies, or CodeChef challenges, ITL centralizes every template you need in one searchable hub.
                </p>

                <div className="border border-border/40 bg-background/30 p-4 space-y-3">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider">Quick Start Checklist</div>
                  <StepList steps={[
                    "Browse the template library at /categories or /templates to find the algorithms you need.",
                    "Click any template to see its full code, complexity analysis, and explanatory notes.",
                    "Copy the code with one click and paste it directly into your contest solution.",
                    "Create an account to unlock personalization: save custom templates, track progress, organize collections, and more.",
                    "Link your competitive programming handles (Codeforces, AtCoder, etc.) in Settings to see your rating stats.",
                  ]} />
                </div>

                <Tip>
                  <strong>Pro tip:</strong> You don&apos;t need an account to browse and copy templates. But creating one unlocks powerful features like progress tracking, custom template versions, and collections.
                </Tip>
              </div>
            </section>

            {/* ━━━ 2. Browsing Templates ━━━ */}
            <section
              id="browsing-templates"
              ref={(el) => { sectionRefs.current["browsing-templates"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[1]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  Templates are organized into <strong className="text-foreground">categories</strong> (Graph Theory, Dynamic Programming, Math, Trees, Geometry, etc.). Each category groups related algorithms together for intuitive discovery.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <FeatureRow
                    icon={<Compass className="h-3.5 w-3.5" />}
                    title="Category Browsing"
                    desc="Navigate by algorithm family. Each category shows a count of available templates and a color-coded icon."
                  />
                  <FeatureRow
                    icon={<Search className="h-3.5 w-3.5" />}
                    title="Fuzzy Search"
                    desc="Hit Ctrl+K (or ⌘K) from anywhere to open the global search. It uses fuzzy matching so you can find templates even with typos."
                  />
                  <FeatureRow
                    icon={<Code2 className="h-3.5 w-3.5" />}
                    title="Syntax Highlighting"
                    desc="All code is rendered with Shiki for accurate, IDE-quality syntax highlighting across C++, Python, Java, and more."
                  />
                  <FeatureRow
                    icon={<BookOpen className="h-3.5 w-3.5" />}
                    title="Rich Notes & Math"
                    desc="Templates include algorithm explanations with Markdown formatting and LaTeX math rendering (via KaTeX) for formulas."
                  />
                </div>

                <div className="border border-border/40 bg-background/30 p-4">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2">Template Detail Page Includes</div>
                  <div className="space-y-1 text-[11px] text-muted-foreground/50">
                    <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Full source code with line numbers</div>
                    <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Time &amp; space complexity annotations</div>
                    <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Multiple language implementations (when available)</div>
                    <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Tags for quick categorization</div>
                    <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Like counter and copy counter</div>
                    <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Contributor attribution</div>
                  </div>
                </div>

                <Tip>
                  Use the keyboard shortcut <KeyBadge>⌘K</KeyBadge> or <KeyBadge>Ctrl+K</KeyBadge> to instantly jump to the search bar from any page. The fuzzy search powered by Fuse.js will match partial words, abbreviations, and even misspellings.
                </Tip>
              </div>
            </section>

            {/* ━━━ 3. Copy & Use ━━━ */}
            <section
              id="copy-and-use"
              ref={(el) => { sectionRefs.current["copy-and-use"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[2]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  Every template has a <strong className="text-foreground">one-click copy button</strong>. Click it, and the entire code block is copied to your clipboard — ready to paste into your IDE or online judge submission box.
                </p>

                <StepList steps={[
                  "Open any template page.",
                  "If the template supports multiple languages, switch between tabs (C++, Python, Java, etc.).",
                  "Click the copy icon in the top-right corner of the code block.",
                  "Paste directly into your contest environment.",
                ]} />

                <p>
                  Templates are <strong className="text-foreground">contest-optimized</strong>: they use fast I/O, minimal headers, and clean naming conventions so you can integrate them into solutions without refactoring.
                </p>

                <Tip>
                  The copy counter on each template tracks how many times it&apos;s been copied globally. Popular templates tend to be battle-tested and reliable for contests.
                </Tip>
              </div>
            </section>

            {/* ━━━ 4. User Accounts ━━━ */}
            <section
              id="user-accounts"
              ref={(el) => { sectionRefs.current["user-accounts"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[3]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  Creating a free account unlocks the full power of ITL. Here&apos;s what you get:
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <FeatureRow icon={<Library className="h-3.5 w-3.5" />} title="Custom Templates" desc="Save your own modified versions of any template with your personal optimizations." />
                  <FeatureRow icon={<FolderOpen className="h-3.5 w-3.5" />} title="Collections" desc="Organize templates into named groups — like 'Contest Favorites' or 'Must-Know Graph'." />
                  <FeatureRow icon={<BarChart3 className="h-3.5 w-3.5" />} title="Progress Tracking" desc="Mark templates as Learning, Implemented, or Mastered to track your algorithmic growth." />
                  <FeatureRow icon={<Heart className="h-3.5 w-3.5" />} title="Liked Templates" desc="Like templates to build a personal favorites list visible in your dashboard." />
                  <FeatureRow icon={<GitPullRequest className="h-3.5 w-3.5" />} title="Contributions" desc="Submit new templates or suggest edits to existing ones for admin review." />
                  <FeatureRow icon={<Trophy className="h-3.5 w-3.5" />} title="CP Profiles" desc="Link your Codeforces, AtCoder, LeetCode, and CodeChef handles for rating tracking." />
                  <FeatureRow icon={<UserCircle className="h-3.5 w-3.5" />} title="Public Profile" desc="A shareable profile page with your avatar, display name, bio, linked handles, and CP stats." />
                </div>

                <div className="border border-border/40 bg-background/30 p-4">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2">How to Register</div>
                  <StepList steps={[
                    "Click Login in the navbar, then 'Create Account'.",
                    "Enter your username, email, and password.",
                    "Check your email for a verification code.",
                    "Enter the code to verify and activate your account.",
                  ]} />
                </div>
              </div>
            </section>

            {/* ━━━ 5. Dashboard Overview ━━━ */}
            <section
              id="dashboard-overview"
              ref={(el) => { sectionRefs.current["dashboard-overview"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[4]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  Your dashboard is the command center. The <strong className="text-foreground">Overview tab</strong> gives you a bird&apos;s-eye view of your entire ITL activity:
                </p>

                <div className="border border-border/40 bg-background/30 p-4">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-3">Overview Bento Cards</div>
                  <div className="space-y-2 text-[11px] text-muted-foreground/50">
                    <div className="flex items-start gap-2">
                      <StatusBadge status="Learning" color="blue" />
                      <StatusBadge status="Implemented" color="yellow" />
                      <StatusBadge status="Mastered" color="green" />
                      <span className="mt-0.5">— Quick count cards showing your progress distribution</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Saved templates count</div>
                    <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Collections count</div>
                    <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Contributions submitted</div>
                    <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Liked templates count</div>
                    <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Recent progress timeline</div>
                    <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary/50" /> Codeforces rating widget (if handle linked)</div>
                  </div>
                </div>

                <p>
                  The dashboard uses a tab-based navigation system. Switch between <strong className="text-foreground">Overview</strong>, <strong className="text-foreground">My Templates</strong>, <strong className="text-foreground">Contributions</strong>, <strong className="text-foreground">Liked</strong>, <strong className="text-foreground">Collections</strong>, <strong className="text-foreground">Statistics</strong>, and <strong className="text-foreground">Preferences</strong>.
                </p>
              </div>
            </section>

            {/* ━━━ 6. My Templates ━━━ */}
            <section
              id="my-templates"
              ref={(el) => { sectionRefs.current["my-templates"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[5]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  The <strong className="text-foreground">My Templates</strong> feature lets you save personalized versions of any template. When you visit a template page while logged in, you can:
                </p>
                <StepList steps={[
                  "Click 'Personalize' on any template detail page.",
                  "Edit the code to match your personal coding style, add custom macros, or optimize for your use case.",
                  "Save your custom version — it's stored in your account and accessible from the dashboard.",
                  "Your custom version is separate from the original. The original stays untouched.",
                ]} />

                <p>
                  In your dashboard under the <strong className="text-foreground">my_templates</strong> tab, you can search, browse, and directly open any of your saved custom templates. Each entry shows the template name, language, and last updated date.
                </p>

                <Tip>
                  This is perfect for maintaining your own &quot;contest kit&quot; — standard templates modified with your preferred variable names, I/O methods, and debug macros.
                </Tip>
              </div>
            </section>

            {/* ━━━ 7. Collections ━━━ */}
            <section
              id="collections"
              ref={(el) => { sectionRefs.current["collections"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[6]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  <strong className="text-foreground">Collections</strong> let you group templates into custom folders. Think of them as playlists for algorithms.
                </p>

                <div className="border border-border/40 bg-background/30 p-4">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2">Example Collections</div>
                  <div className="space-y-1.5 text-[11px] text-muted-foreground/50">
                    <div className="flex items-center gap-2"><FolderOpen className="h-3 w-3 text-warning" /> <strong className="text-foreground/70">Contest Essentials</strong> — BFS, DFS, Dijkstra, Binary Search, Segment Tree</div>
                    <div className="flex items-center gap-2"><FolderOpen className="h-3 w-3 text-info" /> <strong className="text-foreground/70">Weak Topics</strong> — Templates you struggle with and need to practice</div>
                    <div className="flex items-center gap-2"><FolderOpen className="h-3 w-3 text-success" /> <strong className="text-foreground/70">Div2 Must-Know</strong> — Algorithms that appear frequently in Div2 contests</div>
                  </div>
                </div>

                <StepList steps={[
                  "Go to the Collections tab in your dashboard.",
                  "Click 'Create Collection' and give it a name and optional description.",
                  "Visit any template page and add it to a collection from the personalization panel.",
                  "View, manage, and remove items from your collections in the dashboard.",
                ]} />
              </div>
            </section>

            {/* ━━━ 8. Progress Tracking ━━━ */}
            <section
              id="progress-tracking"
              ref={(el) => { sectionRefs.current["progress-tracking"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[7]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  Progress tracking is one of the most powerful features in ITL. It transforms the platform from a passive copy-paste library into an <strong className="text-foreground">active study system</strong>.
                </p>

                <div className="border border-border/40 bg-background/30 p-4">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-3">The 3-Stage Pipeline</div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <StatusBadge status="Learning" color="blue" />
                      <div className="text-[11px] text-muted-foreground/55 leading-relaxed">
                        You&apos;ve started studying this algorithm. You understand the concept but haven&apos;t coded it from memory yet.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <StatusBadge status="Implemented" color="yellow" />
                      <div className="text-[11px] text-muted-foreground/55 leading-relaxed">
                        You&apos;ve successfully coded this algorithm at least once. You can implement it with reference but not fully from memory.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <StatusBadge status="Mastered" color="green" />
                      <div className="text-[11px] text-muted-foreground/55 leading-relaxed">
                        You can write this algorithm from scratch during a contest without looking anything up. It&apos;s in your muscle memory.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-foreground font-bold uppercase tracking-wider mt-4">How to Set Progress</div>
                <StepList steps={[
                  "Visit any template detail page while logged in.",
                  "Look for the 'Progress' selector in the personalization panel on the right side.",
                  "Click one of the three status buttons: Learning, Implemented, or Mastered.",
                  "Your status is saved instantly and reflected in your dashboard statistics.",
                ]} />

                <div className="border border-warning/20 bg-warning/5 p-3 flex items-start gap-2.5 text-[11px] text-warning/70 leading-relaxed">
                  <Award className="h-3.5 w-3.5 shrink-0 mt-0.5 text-warning" />
                  <div>
                    <strong>Why this matters:</strong> Before a contest, check your dashboard. If segment trees are at &quot;Learning&quot; but the contest likely has tree problems, you know to review. This self-awareness directly improves your rating trajectory.
                  </div>
                </div>
              </div>
            </section>

            {/* ━━━ 9. Statistics & Analytics ━━━ */}
            <section
              id="statistics"
              ref={(el) => { sectionRefs.current["statistics"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[8]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  The <strong className="text-foreground">Statistics tab</strong> in your dashboard visualizes your progress data:
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <FeatureRow
                    icon={<Activity className="h-3.5 w-3.5" />}
                    title="Readiness Score"
                    desc="A radial ring showing your mastery percentage — the fraction of tracked templates you've fully mastered."
                  />
                  <FeatureRow
                    icon={<BarChart3 className="h-3.5 w-3.5" />}
                    title="Status Breakdown"
                    desc="Progress bars for each status (Mastered, Implemented, Learning) showing distribution across all tracked templates."
                  />
                  <FeatureRow
                    icon={<Layers className="h-3.5 w-3.5" />}
                    title="Tracked Implementations"
                    desc="A filterable list of every template you're tracking, with status badges and links to the template pages."
                  />
                  <FeatureRow
                    icon={<Settings className="h-3.5 w-3.5" />}
                    title="Status Filters"
                    desc="Filter the list by All, Mastered, Implemented, or Learning to focus on specific areas."
                  />
                </div>

                <Tip>
                  The Readiness Score answers the question: &quot;What percentage of the algorithms I&apos;m studying am I contest-ready for?&quot; Aim for 70%+ before entering a rated contest.
                </Tip>

                <p>
                  The overview tab also shows a <strong className="text-foreground">Recent Progress Timeline</strong> — your latest status changes with timestamps, so you can see your learning momentum at a glance.
                </p>
              </div>
            </section>

            {/* ━━━ 10. Contributing ━━━ */}
            <section
              id="contributing"
              ref={(el) => { sectionRefs.current["contributing"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[9]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  ITL grows through community contributions. Logged-in users can submit two types of contributions:
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="border border-border/40 bg-background/30 p-4">
                    <div className="text-[10px] text-success font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <GitPullRequest className="h-3 w-3" /> New Template
                    </div>
                    <div className="text-[11px] text-muted-foreground/50 leading-relaxed">
                      Submit a new algorithm implementation. Provide the title, category, code (in one or more languages), complexity annotation, and optional notes.
                    </div>
                  </div>
                  <div className="border border-border/40 bg-background/30 p-4">
                    <div className="text-[10px] text-info font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Code2 className="h-3 w-3" /> Edit Request
                    </div>
                    <div className="text-[11px] text-muted-foreground/50 leading-relaxed">
                      Suggest improvements to an existing template — fix bugs, optimize performance, add an alternative language, or improve notes.
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-foreground font-bold uppercase tracking-wider mt-2">Contribution Workflow</div>
                <StepList steps={[
                  "Navigate to the /contribute page (or click 'Contribute' in the navbar).",
                  "Select whether you're submitting a new template or an edit to an existing one.",
                  "Fill in the form with all required fields.",
                  "Submit — your contribution enters the review queue.",
                  "An admin reviews and approves, rejects, or requests changes.",
                  "You get an email with the outcome, and can track it in the dashboard 'Contributions' tab.",
                ]} />

                <div className="text-[10px] text-foreground font-bold uppercase tracking-wider mt-2">Review Outcomes</div>
                <div className="flex flex-wrap gap-2 my-1">
                  <StatusBadge status="Pending" color="yellow" />
                  <StatusBadge status="Changes Requested" color="blue" />
                  <StatusBadge status="Approved" color="green" />
                  <StatusBadge status="Rejected" color="red" />
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-[11px] text-muted-foreground/55 leading-relaxed">
                  <li><strong className="text-success/80">Approved</strong> — your work goes live and you&apos;re credited on the template page.</li>
                  <li><strong className="text-blue-400/80">Changes Requested</strong> — the reviewer emails you what to fix. The email has a button that reopens your submission <strong className="text-foreground/70">pre-filled</strong> so you just apply the changes and resubmit.</li>
                  <li><strong className="text-destructive/80">Rejected</strong> — not accepted this time; the email includes the reviewer&apos;s optional note explaining why.</li>
                </ul>

                <p>
                  Approved contributions are credited with your name and optional Codeforces handle, displayed on the template page.
                </p>
              </div>
            </section>

            {/* ━━━ 11. Contest Calendar ━━━ */}
            <section
              id="contest-calendar"
              ref={(el) => { sectionRefs.current["contest-calendar"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[10]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  ITL aggregates <strong className="text-foreground">live upcoming contests</strong> from all major competitive programming platforms into a single unified timeline:
                </p>

                <div className="flex flex-wrap gap-2 my-3">
                  <StatusBadge status="Codeforces" color="primary" />
                  <StatusBadge status="AtCoder" color="blue" />
                  <StatusBadge status="LeetCode" color="yellow" />
                  <StatusBadge status="CodeChef" color="green" />
                </div>

                <p>
                  The contest calendar is visible on the homepage and shows countdown timers, contest names, durations, and direct links to the contest pages.
                </p>

                <div className="border border-border/40 bg-background/30 p-4">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2">Calendar Feed (ICS)</div>
                  <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                    Logged-in users can generate a <strong className="text-foreground/70">personal calendar subscription link</strong> from the dashboard Settings tab. Add this link to Google Calendar, Apple Calendar, or any ICS-compatible calendar app to get automatic contest reminders.
                  </p>
                </div>

                <Tip>
                  The calendar feed is personalized to your account and updates automatically. Never miss a contest again — your phone will remind you before each one starts.
                </Tip>
              </div>
            </section>

            {/* ━━━ 12. CP Profiles ━━━ */}
            <section
              id="cp-profiles"
              ref={(el) => { sectionRefs.current["cp-profiles"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[11]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  Link your competitive programming handles to see your <strong className="text-foreground">rating statistics</strong> directly in your ITL dashboard:
                </p>

                <div className="border border-border/40 bg-background/30 p-4">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2">Supported Platforms</div>
                  <div className="space-y-1.5 text-[11px] text-muted-foreground/50">
                    <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-blue-400" /> <strong className="text-foreground/70">Codeforces</strong> — Full stats widget: rating, max rating, rank, color badge, contests participated, problems solved</div>
                    <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-info" /> <strong className="text-foreground/70">AtCoder</strong> — Handle linking</div>
                    <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-warning" /> <strong className="text-foreground/70">LeetCode</strong> — Handle linking</div>
                    <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-success" /> <strong className="text-foreground/70">CodeChef</strong> — Handle linking</div>
                  </div>
                </div>

                <StepList steps={[
                  "Go to Dashboard → Preferences tab.",
                  "Enter your handle for each platform.",
                  "For Codeforces, you can verify your handle by adding a verification token to your Codeforces bio.",
                  "Once linked, your rating data appears in the dashboard overview.",
                ]} />

                <p>
                  You can also set a <strong className="text-foreground">rating goal</strong> in your profile to track your progress toward a target rating.
                </p>
              </div>
            </section>

            {/* ━━━ 13. Public Profile ━━━ */}
            <section
              id="public-profile"
              ref={(el) => { sectionRefs.current["public-profile"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[12]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  Every account has a <strong className="text-foreground">public profile page</strong> at
                  {" "}<code className="text-primary/80">/profile/&lt;username&gt;</code>. It&apos;s a shareable
                  card that shows who you are and what you work on — no login required to view it.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <FeatureRow
                    icon={<ImageIcon className="h-3.5 w-3.5" />}
                    title="Avatar Upload"
                    desc="Upload a profile picture (image, up to 1MB). Replacing it automatically cleans up the old file."
                  />
                  <FeatureRow
                    icon={<UserCircle className="h-3.5 w-3.5" />}
                    title="Display Name"
                    desc="Set a friendly display name shown on your profile and used to credit your contributions."
                  />
                  <FeatureRow
                    icon={<BookOpen className="h-3.5 w-3.5" />}
                    title="Bio"
                    desc="Add a short bio to tell visitors about yourself, your goals, or your favorite topics."
                  />
                  <FeatureRow
                    icon={<Trophy className="h-3.5 w-3.5" />}
                    title="Linked Handles & Stats"
                    desc="Your public profile surfaces your linked CP handles and rating stats alongside your identity."
                  />
                </div>

                <div className="border border-border/40 bg-background/30 p-4">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2">How to Edit Your Profile</div>
                  <StepList steps={[
                    "Go to Dashboard → Preferences tab.",
                    "Upload an avatar, set your display name, and write a bio.",
                    "Link your CP handles and rating goal (see CP Profiles above).",
                    "Changes save to your profile and appear at /profile/<your-username>.",
                  ]} />
                </div>

                <p>
                  Contributor chips on template pages link straight to the contributor&apos;s public profile, so
                  approved authors and editors are one click away from their profile.
                </p>

                <Tip>
                  Your profile page is <strong>public</strong> — anyone with the link can view your avatar, name,
                  bio, handles, and stats. Keep the bio to what you&apos;re happy to share publicly.
                </Tip>
              </div>
            </section>

            {/* ━━━ 14. Settings & Preferences ━━━ */}
            <section
              id="settings"
              ref={(el) => { sectionRefs.current["settings"] = el; }}
              className="border border-border bg-card/35 backdrop-blur-md p-5 sm:p-7 shadow-xl animate-fade-in"
            >
              <SectionHeader section={sections[13]} />
              <div className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed space-y-4">
                <p>
                  ITL offers several customization options to tailor the experience to your preferences:
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <FeatureRow
                    icon={<Settings className="h-3.5 w-3.5" />}
                    title="Retro Effects"
                    desc="Open the effects panel (gear icon in the bottom-right corner) to toggle terminal sound FX and the animated matrix background on or off."
                  />
                  <FeatureRow
                    icon={<Activity className="h-3.5 w-3.5" />}
                    title="Reduce Motion"
                    desc="Disable all animations and transitions for a minimal, distraction-free experience. Great for low-performance devices."
                  />
                  <FeatureRow
                    icon={<Layers className="h-3.5 w-3.5" />}
                    title="Compact Density"
                    desc="Shrink the UI density so more content fits on screen — useful on smaller displays or when you want less whitespace."
                  />
                  <FeatureRow
                    icon={<Code2 className="h-3.5 w-3.5" />}
                    title="Line Numbers"
                    desc="Toggle line numbers in code blocks on or off depending on your preference."
                  />
                </div>

                <Tip>
                  Look for the small gear icon floating in the bottom-right corner of any page. That opens the effects panel where you can toggle sound FX, the matrix background, and all display preferences.
                </Tip>
              </div>
            </section>

            {/* ── Bottom CTA ─────────────────────────────── */}
            <div className="border border-primary/20 bg-card/50 backdrop-blur-md p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
              <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="text-[10px] text-primary font-bold uppercase tracking-widest">
                  $ echo &quot;Ready to start?&quot;
                </div>
                <h3 className="text-lg font-extrabold text-foreground">
                  START EXPLORING NOW
                </h3>
                <p className="text-[11px] text-muted-foreground/50 max-w-md mx-auto">
                  Browse the template library, create an account, and build your personal competitive programming toolkit.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Link
                    href="/categories"
                    onClick={playClick}
                    className="inline-flex h-9 items-center justify-center gap-1.5 border border-primary bg-primary text-primary-foreground px-5 text-[10px] uppercase font-bold tracking-wider hover:bg-transparent hover:text-primary transition-all duration-300"
                  >
                    <Compass className="h-3 w-3" />
                    <span>Browse Categories</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={playClick}
                    className="inline-flex h-9 items-center justify-center gap-1.5 border border-border bg-card/30 px-5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-300"
                  >
                    <Users className="h-3 w-3" />
                    <span>Create Account</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => { playClick(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="fixed bottom-4 right-16 z-50 h-9 w-9 flex items-center justify-center border border-border bg-card/90 backdrop-blur-md text-muted-foreground hover:text-primary hover:border-primary/40 transition-all shadow-xl cursor-pointer"
        >
          <ArrowUp className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );
}
