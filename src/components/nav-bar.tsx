"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Braces, Library, Menu, GitPullRequest, LogIn, LayoutDashboard, LogOut, BookOpen, Zap, Rows3, Hash, Volume2, VolumeX } from "lucide-react";
import { useTerminalTheme } from "./theme-provider";
import { useAuth } from "./auth-provider";
import { BrandLogo } from "./brand-logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function NavSearch({ autoFocus }: { autoFocus?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { playClick } = useTerminalTheme();
  const [value, setValue] = useState(searchParams.get("q") || "");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const lastPushed = useRef(searchParams.get("q") || "");

  const pushSearch = useCallback(
    (q: string) => {
      if (q === lastPushed.current) return;
      lastPushed.current = q;
      const params = new URLSearchParams();
      if (q.trim()) {
        params.set("q", q.trim());
      }
      const qs = params.toString();
      router.push(`/templates${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      pushSearch(value);
    }, 400);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, pushSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        playClick();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setFocused(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playClick]);

  return (
    <div className="relative flex items-center w-full min-w-0 max-w-full">
      <div
        className={`flex items-center gap-2 border transition-all duration-200 w-full min-w-0 max-w-full ${
          focused
            ? "border-primary/50 bg-card md:w-80"
            : "border-border bg-card/30 md:w-64"
        }`}
      >
        <div className="flex items-center gap-1.5 pl-2.5 py-1.5">
          <span className="text-primary/60 text-xs">$</span>
          <Search className="h-3 w-3 text-muted-foreground/40" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            playClick();
            setValue(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="grep templates..."
          className="flex-1 min-w-0 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/30 outline-none py-1.5 pr-2"
        />
        {!value && !focused && (
          <div className="hidden sm:flex items-center gap-0.5 pr-2.5 shrink-0">
            <kbd className="text-[9px] text-muted-foreground/25 border border-border/50 px-1 py-0.5 font-mono">⌘K</kbd>
          </div>
        )}
        {value && (
          <button
            type="button"
            onClick={() => {
              playClick();
              setValue("");
              lastPushed.current = "";
              router.push("/templates", { scroll: false });
            }}
            className="pr-2.5 text-muted-foreground/30 hover:text-primary transition-colors shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function NavBar() {
  const pathname = usePathname();
  if (pathname === "/editor" || pathname?.startsWith("/editor/")) return null;
  const {
    sound,
    setSound,
    reduceMotion,
    setReduceMotion,
    compact,
    setCompact,
    lineNumbers,
    setLineNumbers,
    playClick,
  } = useTerminalTheme();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.classList.add("no-scrollbar");
      document.documentElement.classList.add("no-scrollbar");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.classList.remove("no-scrollbar");
      document.documentElement.classList.remove("no-scrollbar");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("no-scrollbar");
      document.documentElement.classList.remove("no-scrollbar");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all duration-300 ${
        scrolled ? "border-border/50 bg-background/95" : ""
      }`}
    >
      <div className="container flex h-11 items-center justify-between px-4 mx-auto max-w-7xl">
        {showSearch ? (
          /* Mobile search overlay */
          <div className="flex-1 flex items-center gap-2 animate-fade-in">
            <div className="flex-1">
              <NavSearch autoFocus />
            </div>
            <button
              onClick={() => {
                playClick();
                setShowSearch(false);
              }}
              className="h-8 w-8 flex items-center justify-center border border-border bg-card/30 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            {/* Left: Logo + Nav links */}
            <div className="flex items-center gap-8">
              <BrandLogo size="md" />

              {/* Nav links */}
              <nav className="hidden sm:flex items-center gap-1">
                <Link
                  href="/categories"
                  onClick={playClick}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] tracking-wide uppercase transition-colors ${
                    isActive("/categories")
                      ? "text-primary"
                      : "text-muted-foreground/40 hover:text-foreground"
                  }`}
                >
                  <Braces className="h-3 w-3" />
                  <span>categories</span>
                  {isActive("/categories") && (
                    <span className="absolute bottom-0 left-3 right-3 h-px bg-primary" />
                  )}
                </Link>
                <Link
                  href="/templates"
                  onClick={playClick}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] tracking-wide uppercase transition-colors ${
                    isActive("/templates")
                      ? "text-primary"
                      : "text-muted-foreground/40 hover:text-foreground"
                  }`}
                >
                  <Library className="h-3 w-3" />
                  <span>templates</span>
                  {isActive("/templates") && (
                    <span className="absolute bottom-0 left-3 right-3 h-px bg-primary" />
                  )}
                </Link>
                <Link
                  href="/contribute"
                  onClick={playClick}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] tracking-wide uppercase transition-colors ${
                    isActive("/contribute")
                      ? "text-primary"
                      : "text-muted-foreground/40 hover:text-foreground"
                  }`}
                >
                  <GitPullRequest className="h-3 w-3" />
                  <span>contribute</span>
                  {isActive("/contribute") && (
                    <span className="absolute bottom-0 left-3 right-3 h-px bg-primary" />
                  )}
                </Link>
                <Link
                  href="/docs"
                  onClick={playClick}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] tracking-wide uppercase transition-colors ${
                    isActive("/docs")
                      ? "text-primary"
                      : "text-muted-foreground/40 hover:text-foreground"
                  }`}
                >
                  <BookOpen className="h-3 w-3" />
                  <span>docs</span>
                  {isActive("/docs") && (
                    <span className="absolute bottom-0 left-3 right-3 h-px bg-primary" />
                  )}
                </Link>
              </nav>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex">
              <NavSearch />
            </div>

            {/* Right: Status indicator + Mobile controls */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/25 pr-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span className="hidden sm:inline font-mono">online</span>
              </div>

              {/* Auth Links (Desktop) */}
              <div className="hidden sm:flex items-center gap-1.5">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={playClick}
                      className={`flex items-center gap-1.5 px-2.5 h-7 border text-[10px] tracking-wide uppercase transition-all ${
                        isActive("/dashboard")
                          ? "border-primary/20 bg-primary/5 text-primary"
                          : "border-border bg-card/30 text-muted-foreground/40 hover:text-foreground hover:border-border/80"
                      }`}
                    >
                      <LayoutDashboard className="h-3 w-3" />
                      <span>{user.username}</span>
                    </Link>
                    <button
                      onClick={() => {
                        playClick();
                        logout();
                      }}
                      className="flex items-center justify-center h-7 w-7 border border-border bg-card/30 text-muted-foreground/40 hover:text-destructive hover:border-destructive/30 transition-all text-[10px] tracking-wide uppercase cursor-pointer"
                    >
                      <LogOut className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={playClick}
                    className={`flex items-center gap-1.5 px-2.5 h-7 border text-[10px] tracking-wide uppercase transition-all ${
                      isActive("/login") || isActive("/register")
                        ? "border-primary/20 bg-primary/5 text-primary"
                        : "border-border bg-card/30 text-muted-foreground/40 hover:text-foreground hover:border-border/80"
                    }`}
                  >
                    <LogIn className="h-3 w-3" />
                    <span>login</span>
                  </Link>
                )}
              </div>

              {/* Mobile Search Button */}
              <button
                onClick={() => {
                  playClick();
                  setShowSearch(true);
                }}
                className="flex md:hidden h-8 w-8 items-center justify-center border border-border bg-card/30 hover:border-primary/30 transition-all shrink-0"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
              </button>

              {/* Mobile Menu Trigger */}
              <div className="flex sm:hidden">
                <Sheet open={open} onOpenChange={(val) => { playClick(); setOpen(val); }}>
                  <SheetTrigger
                    render={
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center border border-border bg-card/30 hover:border-primary/30 transition-all"
                      />
                    }
                  >
                    <Menu className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                  </SheetTrigger>
                  <SheetContent side="right" className="border-l border-border bg-background p-6 pt-16 w-80 max-w-[85vw] flex flex-col justify-between overflow-x-hidden overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:hidden">
                    <div>
                      <SheetHeader className="mb-6 p-0">
                        <SheetTitle className="text-left font-mono text-xs font-bold tracking-[0.2em] text-primary uppercase flex items-center gap-2">
                          <BrandLogo size="sm" />
                        </SheetTitle>
                      </SheetHeader>

                      {/* Mobile Search */}
                      <div className="mb-8 flex flex-col gap-2">
                        <div className="text-[10px] text-muted-foreground/40 font-mono flex items-center gap-1">
                          <span className="text-primary">$</span>
                          <span>grep templates --all</span>
                        </div>
                        <NavSearch />
                      </div>

                      {/* Mobile Links */}
                      <nav className="flex flex-col gap-3 font-mono">
                        <div className="text-[10px] text-muted-foreground/40 font-mono mb-1 flex items-center gap-1">
                          <span className="text-primary">$</span>
                          <span>cd navigation/</span>
                        </div>
                        <Link
                          href="/categories"
                          onClick={() => {
                            playClick();
                            setOpen(false);
                          }}
                          className={`flex items-center gap-2 px-3 py-2 border text-xs tracking-wide uppercase transition-all ${
                            isActive("/categories")
                              ? "border-primary/20 bg-primary/5 text-primary"
                              : "border-border bg-card/30 text-muted-foreground hover:text-foreground hover:border-border/80"
                          }`}
                        >
                          <Braces className="h-3.5 w-3.5" />
                          <span>categories</span>
                        </Link>
                        <Link
                          href="/templates"
                          onClick={() => {
                            playClick();
                            setOpen(false);
                          }}
                          className={`flex items-center gap-2 px-3 py-2 border text-xs tracking-wide uppercase transition-all ${
                            isActive("/templates")
                              ? "border-primary/20 bg-primary/5 text-primary"
                              : "border-border bg-card/30 text-muted-foreground hover:text-foreground hover:border-border/80"
                          }`}
                        >
                          <Library className="h-3.5 w-3.5" />
                          <span>templates</span>
                        </Link>
                        <Link
                          href="/contribute"
                          onClick={() => {
                            playClick();
                            setOpen(false);
                          }}
                          className={`flex items-center gap-2 px-3 py-2 border text-xs tracking-wide uppercase transition-all ${
                            isActive("/contribute")
                              ? "border-primary/20 bg-primary/5 text-primary"
                              : "border-border bg-card/30 text-muted-foreground hover:text-foreground hover:border-border/80"
                          }`}
                        >
                        <GitPullRequest className="h-3.5 w-3.5" />
                          <span>contribute</span>
                        </Link>
                        <Link
                          href="/docs"
                          onClick={() => {
                            playClick();
                            setOpen(false);
                          }}
                          className={`flex items-center gap-2 px-3 py-2 border text-xs tracking-wide uppercase transition-all ${
                            isActive("/docs")
                              ? "border-primary/20 bg-primary/5 text-primary"
                              : "border-border bg-card/30 text-muted-foreground hover:text-foreground hover:border-border/80"
                          }`}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>docs</span>
                        </Link>

                        {/* Auth Links (Mobile) */}
                        <div className="border-t border-border/50 mt-2 pt-3">
                          <div className="text-[10px] text-muted-foreground/40 font-mono mb-2 flex items-center gap-1">
                            <span className="text-primary">$</span>
                            <span>whoami</span>
                          </div>
                          {user ? (
                            <>
                              <Link
                                href="/dashboard"
                                onClick={() => {
                                  playClick();
                                  setOpen(false);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 border text-xs tracking-wide uppercase transition-all mb-2 ${
                                  isActive("/dashboard")
                                    ? "border-primary/20 bg-primary/5 text-primary"
                                    : "border-border bg-card/30 text-muted-foreground hover:text-foreground hover:border-border/80"
                                }`}
                              >
                                <LayoutDashboard className="h-3.5 w-3.5" />
                                <span>{user.username}</span>
                              </Link>
                              <button
                                onClick={() => {
                                  playClick();
                                  logout();
                                  setOpen(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2 border border-border bg-card/30 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all text-xs tracking-wide uppercase w-full"
                              >
                                <LogOut className="h-3.5 w-3.5" />
                                <span>logout</span>
                              </button>
                            </>
                          ) : (
                            <Link
                              href="/login"
                              onClick={() => {
                                playClick();
                                setOpen(false);
                              }}
                              className={`flex items-center gap-2 px-3 py-2 border text-xs tracking-wide uppercase transition-all ${
                                isActive("/login")
                                  ? "border-primary/20 bg-primary/5 text-primary"
                                  : "border-border bg-card/30 text-muted-foreground hover:text-foreground hover:border-border/80"
                              }`}
                            >
                              <LogIn className="h-3.5 w-3.5" />
                              <span>login</span>
                            </Link>
                          )}
                        </div>

                        {/* Mobile Interface Settings ($ configure --interface) */}
                        <div className="border-t border-border/50 mt-3 pt-3 space-y-2">
                          <div className="text-[10px] text-muted-foreground/40 font-mono mb-2 flex items-center gap-1">
                            <span className="text-primary">$</span>
                            <span>configure --interface</span>
                          </div>

                          {/* Reduce Motion */}
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="flex items-center gap-2 text-muted-foreground/70">
                              <Zap className="h-3.5 w-3.5" />
                              Reduce Motion
                            </span>
                            <button
                              onClick={() => {
                                playClick();
                                setReduceMotion(!reduceMotion);
                              }}
                              className={`px-2 py-0.5 border text-[9px] font-bold uppercase transition-all ${
                                reduceMotion
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/60 text-muted-foreground/40 hover:border-border"
                              }`}
                            >
                              {reduceMotion ? "ENABLED" : "DISABLED"}
                            </button>
                          </div>

                          {/* Compact Density */}
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="flex items-center gap-2 text-muted-foreground/70">
                              <Rows3 className="h-3.5 w-3.5" />
                              Compact Density
                            </span>
                            <button
                              onClick={() => {
                                playClick();
                                setCompact(!compact);
                              }}
                              className={`px-2 py-0.5 border text-[9px] font-bold uppercase transition-all ${
                                compact
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/60 text-muted-foreground/40 hover:border-border"
                              }`}
                            >
                              {compact ? "ENABLED" : "DISABLED"}
                            </button>
                          </div>

                          {/* Line Numbers */}
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="flex items-center gap-2 text-muted-foreground/70">
                              <Hash className="h-3.5 w-3.5" />
                              Line Numbers
                            </span>
                            <button
                              onClick={() => {
                                playClick();
                                setLineNumbers(!lineNumbers);
                              }}
                              className={`px-2 py-0.5 border text-[9px] font-bold uppercase transition-all ${
                                lineNumbers
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/60 text-muted-foreground/40 hover:border-border"
                              }`}
                            >
                              {lineNumbers ? "ENABLED" : "DISABLED"}
                            </button>
                          </div>

                          {/* Retro Sounds */}
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="flex items-center gap-2 text-muted-foreground/70">
                              {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                              Retro Sounds
                            </span>
                            <button
                              onClick={() => {
                                playClick();
                                setSound(!sound);
                              }}
                              className={`px-2 py-0.5 border text-[9px] font-bold uppercase transition-all ${
                                sound
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/60 text-muted-foreground/40 hover:border-border"
                              }`}
                            >
                              {sound ? "ENABLED" : "DISABLED"}
                            </button>
                          </div>
                        </div>
                      </nav>
                    </div>

                    <div className="mt-8 font-mono text-[9px] text-muted-foreground/30 flex justify-between items-center border-t border-border/50 pt-4 shrink-0">
                      <span>itl --version 1.0</span>
                      <span>[online]</span>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
