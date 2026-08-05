import { getDb, schema } from "@/db";
import { eq, sql, and } from "drizzle-orm";
import { Terminal, Code2, Calendar, Trophy, ArrowRight, Play, TerminalSquare, Compass, BookOpen } from "lucide-react";
import Link from "next/link";
import { ContestCalendar } from "@/components/contest-calendar";
import { AnimateOnMount } from "@/components/animate-on-mount";
import { LandingSandbox } from "@/components/landing-sandbox";
import { CliBanner } from "@/components/cli-banner";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = getDb();

  if (!db) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 font-mono select-none">
        <div className="border border-border bg-card p-8 max-w-md w-full shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <div className="text-xs space-y-2 text-left">
            <div className="text-muted-foreground">$ cp-base --status</div>
            <div className="text-error animate-blink">[ERR] Database environment offline</div>
            <div className="text-muted-foreground">Please check setup or try again.</div>
            <div className="flex items-center gap-1 mt-3">
              <span className="text-primary">$</span>
              <span className="inline-block h-3 w-1.5 bg-primary animate-blink" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  let cats: Awaited<ReturnType<typeof db.query.categories.findMany>> = [];
  const countMap: Record<number, number> = {};
  let totalTemplates = 0;

  try {
    cats = await db.query.categories.findMany({
      where: eq(schema.categories.hidden, false),
      orderBy: (c, { asc }) => [asc(c.order)],
    });

    for (const cat of cats) {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.templates)
        .where(and(eq(schema.templates.categoryId, cat.id), eq(schema.templates.hidden, false)));
      countMap[cat.id] = row?.count ?? 0;
    }

    totalTemplates = Object.values(countMap).reduce((a, b) => a + b, 0);
  } catch (err) {
    console.error("Error loading homepage stats:", err);
  }

  return (
    <div className="relative z-10 flex flex-col min-h-screen text-foreground select-none overflow-hidden pb-12">
      
      {/* 1. Immersive Glowing Hero Background Decoration */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-primary/4 blur-[130px] animate-glow-pulse" />
        <div className="absolute top-[20%] right-[15%] w-[450px] h-[450px] rounded-full bg-info/4 blur-[120px] animate-glow-pulse-light" />
        <div className="absolute bottom-[10%] left-[20%] w-[600px] h-[600px] rounded-full bg-success/3 blur-[140px] animate-glow-pulse" />
      </div>

      {/* 2. Premium Landing Hero Area */}
      <section className="relative z-10 mx-auto max-w-7xl w-full px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Hero Content */}
          <div className="flex-1 text-left space-y-6">
            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] uppercase tracking-widest font-mono text-primary animate-fade-in shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              <span>ENVIRONMENT_STABLE v1.0.0</span>
            </div>

            {/* Brand Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-mono">
              <span className="text-foreground">COMPETITIVE</span>
              <br />
              <span className="text-primary glow-text-strong bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-400 to-info">
                PROGRAMMING
              </span>
              <br />
              <span className="text-foreground">PIPELINE.</span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-muted-foreground/75 leading-relaxed max-w-lg font-mono">
              Stop writing boilerplate from scratch. Copy-paste optimized, highly benchmarked, 
              and complexity-tested templates to stay ahead during real-time algorithmic contests.
            </p>

            {/* Quick npx Command Banner */}
            <CliBanner />

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/categories"
                  className="group inline-flex h-11 items-center justify-center gap-2 border border-primary bg-primary text-primary-foreground px-8 text-xs uppercase font-bold tracking-wider hover:bg-transparent hover:text-primary transition-all duration-300 shadow-[0_0_15px_var(--primary-glow-weak)] hover:shadow-[0_0_25px_var(--primary-glow)] shrink-0 font-mono"
                >
                  <Compass className="h-4 w-4" />
                  <span>Explore Categories</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/templates"
                  className="inline-flex h-11 items-center justify-center gap-2 border border-border bg-card/45 px-6 text-xs uppercase font-bold tracking-wider hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all duration-300 font-mono"
                >
                  <Terminal className="h-4 w-4" />
                  <span>All Templates</span>
                </Link>
              </div>
              <Link
                href="/docs"
                className="inline-flex h-11 items-center justify-center gap-2 border border-border bg-card/45 px-6 text-xs uppercase font-bold tracking-wider hover:border-info/40 text-muted-foreground hover:text-info transition-all duration-300 font-mono w-fit"
              >
                <BookOpen className="h-4 w-4" />
                <span>Read the Docs</span>
              </Link>
            </div>
          </div>

          {/* Hero Console Side Panel */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <AnimateOnMount delay={200}>
              <div className="border border-border/85 bg-card/30 backdrop-blur-md p-5 font-mono shadow-2xl relative">
                {/* Accent Lights */}
                <div className="absolute top-2.5 left-3 flex gap-1.5 select-none">
                  <span className="h-2 w-2 rounded-full bg-destructive/60" />
                  <span className="h-2 w-2 rounded-full bg-warning/60" />
                  <span className="h-2 w-2 rounded-full bg-success/60" />
                </div>
                <div className="text-[10px] text-muted-foreground/30 text-right uppercase tracking-wider mb-4 select-none">
                  system_status.log
                </div>

                {/* Simulated Log Output */}
                <div className="space-y-2 text-[10px] sm:text-[11px] leading-relaxed text-muted-foreground/60 select-text">
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-bold">[SYS]</span>
                    <span>Loading CP-Base contest configurations...</span>
                  </div>
                  <div className="flex items-start gap-2 text-success/80">
                    <span className="font-bold">[OK]</span>
                    <span>Found {totalTemplates} pre-compiled, highly optimized templates.</span>
                  </div>
                  <div className="flex items-start gap-2 text-info">
                    <span className="font-bold">[OK]</span>
                    <span>Indexed {cats.length} major categories (Graph, Math, DP, Trees).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-warning/80">[WARN]</span>
                    <span>Contests starting within 24 hours detected. Syncing calendar...</span>
                  </div>
                  <div className="h-px bg-border/40 my-3" />
                  <div className="p-2 border border-border/30 bg-black/15 text-[10px] space-y-1 select-all font-mono">
                    <div className="text-muted-foreground/40">{"// Copy-ready fast IO boilerplate"}</div>
                    <div className="text-foreground">#include &lt;bits/stdc++.h&gt;</div>
                    <div className="text-foreground">using namespace std;</div>
                    <div className="text-foreground">#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL);</div>
                  </div>
                </div>
              </div>
            </AnimateOnMount>
          </div>

        </div>
      </section>

      {/* 3. Bento Features Grid Section */}
      <section className="relative z-10 border-t border-b border-border/40 bg-muted/5 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl w-full px-4">
          <div className="mb-10 text-left font-mono">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span className="text-primary">$</span>
              <span className="text-foreground font-bold">cat config/features.md</span>
              <span className="inline-block h-3 w-1.5 bg-primary animate-blink ml-1" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              CORE CP ENGINE INTEGRATIONS
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Bento Block 1: Library */}
            <div className="border border-border/80 bg-card/45 p-6 flex flex-col justify-between group hover:border-primary/50 transition-all duration-300 font-mono shadow-[0_4px_15px_rgba(0,0,0,0.15)] relative">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center border border-primary/20 bg-primary/5 text-primary">
                  <Code2 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Optimized Snippet Core
                </h3>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  Clean, well-structured, complexity-annotated C++ templates. Tailored explicitly for competitive programming environments.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px] text-muted-foreground/45 border-t border-border/40 pt-3 select-none">
                <span>C++ / PYTHON / JAVA</span>
                <span className="text-primary/70 font-bold">$ ls templates/</span>
              </div>
            </div>

            {/* Bento Block 2: Contest Monitor */}
            <div className="border border-border/80 bg-card/45 p-6 flex flex-col justify-between group hover:border-info/50 transition-all duration-300 font-mono shadow-[0_4px_15px_rgba(0,0,0,0.15)]">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center border border-info/20 bg-info/5 text-info">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-info transition-colors">
                  Live Contest Scheduler
                </h3>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  Consolidated timeline dashboard tracking Codeforces, AtCoder, LeetCode, and CodeChef. Includes calendar alerts.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px] text-muted-foreground/45 border-t border-border/40 pt-3 select-none">
                <span>REAL-TIME TIMER SYNC</span>
                <span className="text-info font-bold">$ cron contests --watch</span>
              </div>
            </div>

            {/* Bento Block 3: Profile Tracking */}
            <div className="border border-border/80 bg-card/45 p-6 flex flex-col justify-between group hover:border-warning/50 transition-all duration-300 font-mono shadow-[0_4px_15px_rgba(0,0,0,0.15)] md:col-span-2 lg:col-span-1">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center border border-warning/20 bg-warning/5 text-warning">
                  <Trophy className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-warning transition-colors">
                  Multi-Platform Diagnostics
                </h3>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  Track ratings, colors, active handle statistics, and solved counts directly inside your developer dashboard.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px] text-muted-foreground/45 border-t border-border/40 pt-3 select-none">
                <span>RATING & LEVEL BADGES</span>
                <span className="text-warning font-bold">$ whoami --stats</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Interactive Sandbox Showcase Section */}
      <section className="relative z-10 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl w-full px-4">
          <div className="mb-10 text-left font-mono">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span className="text-primary">$</span>
              <span className="text-foreground font-bold">./test_sandbox.sh --live</span>
              <span className="inline-block h-3 w-1.5 bg-primary animate-blink ml-1" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              INTERACTIVE CODE SANDBOX DEMO
            </h2>
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed mt-1 max-w-2xl">
              Preview optimized templates, space-time complexity analysis, and structure models live. Click an algorithm tab below.
            </p>
          </div>

          <AnimateOnMount delay={200}>
            <LandingSandbox />
          </AnimateOnMount>
        </div>
      </section>

      {/* 5. Live Feeds Monitor */}
      <section className="relative z-10 border-t border-border/40 bg-muted/5 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl w-full px-4">
          <div className="space-y-6 font-mono max-w-5xl mx-auto">
            <div className="mb-3 text-left">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="text-primary">$</span>
                <span className="text-foreground font-bold">ls contests/ --active</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                UPCOMING CONTEST TIMELINE
              </h3>
            </div>
            <AnimateOnMount delay={300}>
              <ContestCalendar />
            </AnimateOnMount>
          </div>
        </div>
      </section>

      {/* 6. Dynamic Footer Call to Action Banner */}
      <section className="relative z-10 mx-auto max-w-7xl w-full px-4 pt-16">
        <AnimateOnMount delay={200}>
          <div className="border border-primary/20 bg-card/65 p-8 sm:p-12 text-center font-mono relative overflow-hidden shadow-[0_0_35px_var(--primary-glow-ultra-weak)]">
            {/* Neon Accent Blob inside box */}
            <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <div className="flex justify-center items-center gap-2 text-xs text-primary mb-2 select-none">
                <TerminalSquare className="h-4.5 w-4.5" />
                <span>$ cp-base --initiate-session</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                READY TO ELEVATE YOUR SPEED?
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground/60 leading-relaxed max-w-md mx-auto">
                Gain access to templates, customized fast-IO setups, and a centralized hub to track ratings and schedules.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4 select-none">
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center justify-center gap-1.5 border border-primary bg-primary text-primary-foreground px-6 text-xs uppercase font-bold tracking-wider hover:bg-transparent hover:text-primary transition-all duration-300"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Register Session</span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center border border-border bg-card/30 hover:border-primary/45 px-6 text-xs uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground transition-all duration-300"
                >
                  <span>Authenticate Login</span>
                </Link>
              </div>
            </div>
          </div>
        </AnimateOnMount>
      </section>

    </div>
  );
}
