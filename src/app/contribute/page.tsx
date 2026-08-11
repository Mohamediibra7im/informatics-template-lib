import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Edit, Lock, LogIn, UserPlus } from "lucide-react";
import { TerminalBreadcrumb, TrafficLights } from "@/components/terminal";
import { getSessionFromCookie } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Submit new competitive programming templates or request edits to existing ones. Help grow the ITL library.",
};

export default async function ContributePage() {
  const session = await getSessionFromCookie();

  if (!session) {
    return (
      <div className="relative z-10 mx-auto max-w-3xl w-full px-4 py-12 font-mono">
        <TerminalBreadcrumb className="mb-8" items={[{ label: "home", href: "/" }, { label: "contribute" }]} />

        <div className="border border-border/80 bg-card/45 backdrop-blur-md p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-2xl" />

          <div className="flex items-center gap-1.5 mb-6">
            <TrafficLights />
            <span className="text-[9px] text-muted-foreground/30">auth_required.sh</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 mb-3">
            <span className="text-destructive font-bold">$</span>
            <span>contribute --verify-session</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-5 w-5 text-destructive" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Authentication Required
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground/65 leading-relaxed max-w-xl mb-6">
            <span className="text-destructive/80">[ERROR]</span> Permission denied. You need an account to contribute
            templates. Log in or register to submit new templates and request edits to the library.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login?redirect=%2Fcontribute"
              className="group flex-1 flex items-center justify-center gap-2 border border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary transition-all duration-200 px-4 py-3 text-xs font-bold uppercase tracking-wider"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
            <Link
              href="/register?redirect=%2Fcontribute"
              className="group flex-1 flex items-center justify-center gap-2 border border-border hover:border-foreground/40 bg-card/25 text-foreground hover:bg-muted/20 transition-all duration-200 px-4 py-3 text-xs font-bold uppercase tracking-wider"
            >
              <UserPlus className="h-4 w-4" />
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto max-w-3xl w-full px-4 py-12 font-mono">
      <TerminalBreadcrumb className="mb-8" items={[{ label: "home", href: "/" }, { label: "contribute" }]} />

      {/* Header */}
      <div className="border border-border/80 bg-card/45 backdrop-blur-md p-6 mb-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-2xl" />
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 mb-3">
          <span className="text-primary font-bold">$</span>
          <span>contribute --help</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary glow-text-strong mb-3">
          Contribute to ITL
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground/65 leading-relaxed max-w-xl">
          Help grow the competitive programming template library. Submit new templates or suggest improvements to existing ones.
          All contributions are reviewed before publishing.
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/contribute/new" className="group block">
          <div className="border border-border bg-card/25 hover:border-primary/50 hover:shadow-[0_0_20px_var(--primary-glow-ultra-weak)] transition-all duration-300 p-6 h-full">
            <div className="flex items-center gap-1.5 mb-4">
              <TrafficLights />
              <span className="text-[9px] text-muted-foreground/30">new_template.sh</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Plus className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Submit New Template</h2>
            </div>
            <p className="text-[11px] text-muted-foreground/45 leading-relaxed mb-4">
              Submit a new algorithm or data structure template with code implementations and notes.
            </p>
            <div className="text-[10px] text-muted-foreground/30 group-hover:text-primary transition-colors flex items-center gap-1">
              <span className="text-primary/50">$</span> ./submit_new.sh
              <span className="inline-block h-2.5 w-1 bg-primary animate-blink opacity-0 group-hover:opacity-100" />
            </div>
          </div>
        </Link>

        <Link href="/contribute/edit" className="group block">
          <div className="border border-border bg-card/25 hover:border-primary/50 hover:shadow-[0_0_20px_var(--primary-glow-ultra-weak)] transition-all duration-300 p-6 h-full">
            <div className="flex items-center gap-1.5 mb-4">
              <TrafficLights />
              <span className="text-[9px] text-muted-foreground/30">edit_request.sh</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Edit className="h-5 w-5 text-info" />
              <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Request Edit</h2>
            </div>
            <p className="text-[11px] text-muted-foreground/45 leading-relaxed mb-4">
              Suggest improvements, fixes, or optimizations to an existing template in the library.
            </p>
            <div className="text-[10px] text-muted-foreground/30 group-hover:text-primary transition-colors flex items-center gap-1">
              <span className="text-primary/50">$</span> ./request_edit.sh
              <span className="inline-block h-2.5 w-1 bg-primary animate-blink opacity-0 group-hover:opacity-100" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
