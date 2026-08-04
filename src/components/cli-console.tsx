"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTerminalTheme, type TerminalThemeType } from "./theme-provider";
import { Terminal as TerminalIcon, ChevronRight, X, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandLog {
  text: string;
  type: "input" | "output" | "error" | "system" | "success";
}

export function CliConsole() {
  const router = useRouter();
  const {
    setTheme,
    scanlines,
    setScanlines,
    flicker,
    setFlicker,
    sound,
    setSound,
    matrix,
    setMatrix,
    playClick,
    playBeep,
  } = useTerminalTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [logs, setLogs] = useState<CommandLog[]>([
    { text: "CP-Base OS v1.0.8 (tty1)", type: "system" },
    { text: "Type 'help' to see available commands. Press ` (backtick) to toggle console.", type: "system" },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [templates, setTemplates] = useState<{ id: number; title: string; slug: string }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch categories & templates on mount for navigation/info
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(data))
      .catch(() => {});

    fetch("/api/admin/templates")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTemplates(data))
      .catch(() => {});
  }, []);

  // Scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, isOpen]);

  // Handle backtick keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "`") {
        e.preventDefault();
        playClick();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playClick]);

  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const addLog = (text: string, type: CommandLog["type"] = "output") => {
    setLogs((prev) => [...prev, { text, type }]);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmdStr = inputValue.trim();
    if (!cmdStr) return;

    // Add to logs & history
    addLog(`$ ${cmdStr}`, "input");
    setHistory((prev) => [cmdStr, ...prev.filter((h) => h !== cmdStr)]);
    setHistoryIndex(-1);
    setInputValue("");
    playClick();

    // Command parser
    const args = cmdStr.split(" ");
    const command = args[0].toLowerCase();
    const subArg = args.slice(1).join(" ");

    switch (command) {
      case "help":
        addLog("Available commands:", "system");
        addLog("  ls                           List all templates categories", "output");
        addLog("  cd <category-slug>           Navigate to a category page", "output");
        addLog("  cd ..                        Go back to home page", "output");
        addLog("  cat <template-slug>          View a specific template", "output");
        addLog("  theme <color>                Set terminal theme color (green|amber|cyan|red|purple)", "output");
        addLog("  scanlines                    Toggle CRT Scanline overlay effect", "output");
        addLog("  flicker                      Toggle CRT Screen Flicker effect", "output");
        addLog("  sound                        Toggle Retro Audio synthesizer", "output");
        addLog("  matrix                       Toggle Canvas Matrix falling code background", "output");
        addLog("  clear                        Clear terminal output buffer", "output");
        addLog("  about                        Print system information", "output");
        addLog("  sudo rm -rf /                [!] CRITICAL SYSTEM DELETE", "output");
        break;

      case "ls":
        if (categories.length === 0) {
          addLog("No categories found in system.", "error");
        } else {
          addLog("Found categories:", "system");
          categories.forEach((cat) => {
            addLog(`  - ${cat.slug.padEnd(20)} (${cat.name})`, "output");
          });
        }
        break;

      case "cd":
        if (!subArg || subArg === "..") {
          addLog("Navigating to Home directory...", "success");
          router.push("/");
        } else {
          const match = categories.find((c) => c.slug.toLowerCase() === subArg.toLowerCase());
          if (match) {
            addLog(`cd /category/${match.slug}`, "success");
            router.push(`/category/${match.slug}`);
          } else {
            addLog(`cd: no such category directory: ${subArg}`, "error");
          }
        }
        break;

      case "cat":
        if (!subArg) {
          addLog("Usage: cat <template-slug>. Example: cat segment-tree", "error");
        } else {
          const match = templates.find((t) => t.slug.toLowerCase() === subArg.toLowerCase());
          if (match) {
            addLog(`cat /template/${match.slug}`, "success");
            router.push(`/template/${match.slug}`);
          } else {
            addLog(`cat: template not found: ${subArg}. Try 'grep' search in navigation header.`, "error");
          }
        }
        break;

      case "theme":
        const t = subArg.toLowerCase();
        if (["green", "amber", "cyan", "red", "purple"].includes(t)) {
          setTheme(t as TerminalThemeType);
          addLog(`Terminal theme color changed to ${t.toUpperCase()}.`, "success");
        } else {
          addLog("Invalid theme. Select: green, amber, cyan, red, or purple", "error");
        }
        break;

      case "scanlines":
        setScanlines(!scanlines);
        addLog(`CRT Scanline filter set to: ${!scanlines ? "ON" : "OFF"}.`, "system");
        break;

      case "flicker":
        setFlicker(!flicker);
        addLog(`Monitor Flicker set to: ${!flicker ? "ON" : "OFF"}.`, "system");
        break;

      case "sound":
        setSound(!sound);
        addLog(`Sound effects set to: ${!sound ? "ON" : "OFF"}.`, "system");
        break;

      case "matrix":
        setMatrix(!matrix);
        addLog(`Matrix falling code background set to: ${!matrix ? "ON" : "OFF"}.`, "system");
        break;

      case "clear":
        setLogs([]);
        break;

      case "about":
        addLog("CP-Base — A Premium Competitive Programming Template Library", "system");
        addLog("Developed with Next.js, Bun, Tailwind CSS and Neon Postgres.", "output");
        addLog("Aesthetics modeled after retro 1980s phosphor terminals.", "output");
        break;

      case "sudo":
        if (subArg === "rm -rf /") {
          triggerCrashSimulation();
        } else {
          addLog("Permission denied. Try: sudo rm -rf /", "error");
        }
        break;

      default:
        addLog(`bash: command not found: ${command}. Type 'help' to show commands.`, "error");
        break;
    }
  };

  const triggerCrashSimulation = () => {
    playBeep(220, 0.4);
    addLog("[CRITICAL] PREPARING SYSTEM DESTRUCTION PROTOCOL...", "error");
    addLog("Deleting database schema...", "error");
    addLog("Wiping local storage cache...", "error");
    addLog("Overheating CPU core 0, 1, 2, 3...", "error");
    
    // Distort screen
    const html = document.documentElement;
    html.style.transition = "none";
    html.style.filter = "invert(1) hue-rotate(180deg) blur(2px) contrast(3)";
    
    setTimeout(() => {
      playBeep(110, 0.5);
      addLog("[WARNING] EMERGENCY MELTDOWN PREVENTED BY BIO_SHIELD_GATE", "system");
      addLog("Permission denied. Access Denied, nice try kid!", "success");
      html.style.filter = "";
      html.style.transition = "";
    }, 2800);
  };

  // Keyboard navigation through history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInputValue(history[nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputValue(history[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue("");
      }
    }
  };

  return (
    <>
      {/* Small floating toggle button for the terminal */}
      {!isOpen && (
        <>
        <button
          onClick={() => {
            playClick();
            setIsOpen(true);
          }}
          className="fixed bottom-4 left-4 sm:flex items-center gap-2 px-3 h-9 border border-primary bg-card/90 text-primary shadow-[0_0_10px_var(--primary-glow-weak)] hover:shadow-[0_0_15px_var(--primary-glow)] transition-all hover:bg-primary/10 rounded-none cursor-pointer text-xs font-mono z-50 hidden"
        >
          <TerminalIcon className="h-4 w-4" />
          <span>CON: CLOSED</span>
        </button>
        <button
          onClick={() => {
            playClick();
            setIsOpen(true);
          }}
          className="fixed bottom-16 right-4 flex sm:hidden items-center justify-center h-9 w-9 border border-primary bg-card/90 text-primary shadow-[0_0_10px_var(--primary-glow-weak)] hover:shadow-[0_0_15px_var(--primary-glow)] transition-all hover:bg-primary/10 rounded-none cursor-pointer z-50"
        >
          <TerminalIcon className="h-4.5 w-4.5" />
        </button>
        </>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.2 }}
            className={`fixed left-0 right-0 bottom-0 z-50 border-t border-primary bg-background/95 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.8)] font-mono flex flex-col ${
              isMaximized ? "h-[85vh]" : "h-[32vh]"
            }`}
          >
            {/* Terminal Top bar */}
            <div className="flex items-center justify-between border-b border-primary/40 px-4 py-2 bg-primary/5 select-none shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <TerminalIcon className="h-3.5 w-3.5" />
                <span>guest@cp-base: ~</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Maximize / Minimize toggle */}
                <button
                  onClick={() => {
                    playClick();
                    setIsMaximized(!isMaximized);
                  }}
                  className="text-primary hover:text-foreground hover:bg-primary/20 p-1 border border-transparent"
                  title={isMaximized ? "Restore size" : "Maximize window"}
                >
                  {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
                {/* Close Button */}
                <button
                  onClick={() => {
                    playClick();
                    setIsOpen(false);
                  }}
                  className="text-primary hover:text-foreground hover:bg-primary/20 p-1 border border-transparent"
                  title="Close console"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Terminal logs buffer */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 text-xs text-foreground scrollbar-thin select-text">
              {logs.map((log, index) => {
                let colorClass = "text-foreground";
                if (log.type === "system") colorClass = "text-muted-foreground/60";
                if (log.type === "error") colorClass = "text-destructive animate-pulse";
                if (log.type === "success") colorClass = "text-primary glow-text";
                if (log.type === "input") colorClass = "text-foreground font-bold";

                return (
                  <div key={index} className={`leading-relaxed break-all ${colorClass}`}>
                    {log.text}
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </div>

            {/* Prompt input field */}
            <form
              onSubmit={handleCommandSubmit}
              className="border-t border-primary/30 py-2.5 px-4 bg-primary/5 flex items-center gap-1.5 shrink-0"
            >
              <span className="text-primary/70 text-xs shrink-0 select-none">guest@cp-base:~$</span>
              <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 select-none" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type command..."
                className="flex-1 bg-transparent text-xs text-foreground outline-none border-none p-0 focus:ring-0 placeholder:text-muted-foreground/20"
                autoComplete="off"
                spellCheck={false}
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
