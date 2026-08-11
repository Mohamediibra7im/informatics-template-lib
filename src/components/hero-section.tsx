"use client";

import { useEffect, useState, useMemo } from "react";
import { Terminal, Code2, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTerminalTheme } from "./theme-provider";

// A custom typewriter animation for console commands
function TypedLine({ text, prefix, onComplete }: { text: string; prefix: string; onComplete: () => void }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayedText("");
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < text.length) {
        setDisplayedText((prev) => prev + text.charAt(idx));
        idx++;
      } else {
        clearInterval(interval);
        const timeout = setTimeout(onComplete, 400); // Small pause at the end
        return () => clearTimeout(timeout);
      }
    }, 45); // Typing speed: 45ms per character
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return (
    <div className="flex items-start gap-1.5 font-mono text-xs">
      <span className="text-primary font-bold">{prefix}</span>
      <span className="text-foreground">
        {displayedText}
        <span className="inline-block h-3.5 w-1.5 bg-primary animate-blink align-middle ml-0.5" />
      </span>
    </div>
  );
}

export function HeroSection({ totalTemplates, totalCategories }: { totalTemplates: number; totalCategories: number }) {
  const [mounted, setMounted] = useState(false);
  const { playClick } = useTerminalTheme();

  const [history, setHistory] = useState<Array<{ type: string; text: string }>>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Dynamic console output based on database stats
  const terminalSteps = useMemo(() => [
    { type: "input", text: "./init_cp_contest.sh" },
    { type: "output", text: "Loading competitive programming environment..." },
    { type: "success", text: `[OK]   Retrieved ${totalTemplates} optimized code templates.` },
    { type: "success", text: `[OK]   Indexed ${totalCategories} logical algorithm categories.` },
    { type: "input", text: "cat segment-tree.cpp | head -n 5" },
    { type: "code", text: `template <typename T>
struct SegTree {
  int n;
  vector<T> tree;
  SegTree(int n) : n(n), tree(4 * n) {}
};` },
  ], [totalTemplates, totalCategories]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // CLI Simulation state machine
  useEffect(() => {
    if (!mounted) return;

    const currentStep = terminalSteps[currentStepIndex];
    if (!currentStep) {
      // Finished all steps, wait 6 seconds and then reset
      const timeout = setTimeout(() => {
        setHistory([]);
        setCurrentStepIndex(0);
      }, 6000);
      return () => clearTimeout(timeout);
    }

    if (currentStep.type === "input") {
      // Typewriter line will call handleInputComplete, which advances index
      return;
    }

    // Computer responses print instantly
    const delay = currentStep.type === "code" ? 3500 : 700;
    const timeout = setTimeout(() => {
      setHistory((prev) => [...prev, currentStep]);
      setCurrentStepIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timeout);
  }, [currentStepIndex, mounted, terminalSteps]);

  const handleInputComplete = () => {
    const currentStep = terminalSteps[currentStepIndex];
    setHistory((prev) => [...prev, currentStep]);
    setCurrentStepIndex((prev) => prev + 1);
  };

  return (
    <section className="relative overflow-hidden border-b border-border py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-background via-background to-card/10 select-none animate-fade-in">
      {/* Background decoration glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-12 left-1/4 w-[450px] h-[450px] rounded-full bg-primary/3 blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-12 right-1/4 w-[400px] h-[400px] rounded-full bg-info/3 blur-[100px] animate-glow-pulse-light" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* Left Column: Text & Hero Action */}
        <div className="flex-1 w-full text-left">
          
          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-2.5 py-1 mb-6 text-[10px] uppercase tracking-wider font-mono text-primary transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
            </span>
            <span>CLI SYSTEM STATUS: ACTIVE</span>
          </div>

          {/* Main Title */}
          <h1
            className={`text-6xl sm:text-7xl lg:text-9xl font-bold tracking-tight text-primary mb-6 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-muted-foreground/30">[</span>
            <span className="glow-text-strong">ITL</span>
            <span className="text-muted-foreground/30">]</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-base sm:text-lg text-muted-foreground/75 mb-8 max-w-xl leading-relaxed transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <strong className="text-primary">Informatics Template Lib</strong> — ultra-optimized, copy-paste ready competitive programming templates. Curated structures, complexity-optimized algorithms, and ready to deploy in real-time contests.
          </p>

          {/* Stats Dashboard */}
          <div
            className={`grid grid-cols-2 gap-4 max-w-sm mb-10 font-mono transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="border border-border/60 bg-card/35 p-4 hover:border-primary/30 transition-all group relative">
              <div className="text-[9px] text-muted-foreground/45 uppercase tracking-wider mb-1 select-none">
                templates
              </div>
              <div className="text-3xl font-bold text-primary group-hover:glow-text transition-all duration-300">
                {totalTemplates}
              </div>
            </div>
            <div className="border border-border/60 bg-card/35 p-4 hover:border-primary/30 transition-all group relative">
              <div className="text-[9px] text-muted-foreground/45 uppercase tracking-wider mb-1 select-none">
                categories
              </div>
              <div className="text-3xl font-bold text-info group-hover:glow-text transition-all duration-300">
                {totalCategories}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-3.5 transition-all duration-700 delay-[400ms] ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Link
              href="/categories"
              onClick={playClick}
              className="group inline-flex h-11 items-center justify-center gap-2 border border-primary bg-primary text-primary-foreground px-8 text-xs uppercase font-bold tracking-wider hover:bg-transparent hover:text-primary transition-all duration-300 shadow-[0_0_15px_var(--primary-glow-weak)] hover:shadow-[0_0_25px_var(--primary-glow)] shrink-0"
            >
              <Code2 className="h-4 w-4" />
              <span>./browse_templates.sh</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/templates"
              onClick={playClick}
              className="inline-flex h-11 items-center justify-center gap-2 border border-border bg-card/45 px-6 text-xs uppercase font-bold tracking-wider hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all duration-300"
            >
              <Terminal className="h-4 w-4" />
              <span>grep --all</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Console Typing Simulator */}
        <div
          className={`flex-1 w-full transition-all duration-1000 delay-500 ${
            mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          }`}
        >
          <div className="relative w-full max-w-lg mx-auto lg:mx-0 border border-border/80 bg-card/45 backdrop-blur-md shadow-2xl overflow-hidden font-mono text-[11px] leading-relaxed">
            {/* Window Topbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/15">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                </div>
                <span className="text-[10px] text-muted-foreground/35 select-none ml-2">
                  guest@itl:~ (bash)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground/20 text-[9px] uppercase tracking-widest select-none">
                <Zap className="h-3 w-3 text-primary animate-pulse" />
                <span>tty1</span>
              </div>
            </div>

            {/* Simulated Shell Screen */}
            <div className="p-4 min-h-[250px] flex flex-col justify-end space-y-2 select-text bg-black/15">
              
              {/* Static History */}
              {history.map((step, idx) => (
                <div key={idx} className="animate-boot-line">
                  {step.type === "input" && (
                    <div className="flex items-start gap-1.5 text-muted-foreground/60">
                      <span className="text-primary font-bold">guest@itl:~$</span>
                      <span className="text-foreground">{step.text}</span>
                    </div>
                  )}
                  {(step.type === "output" || step.type === "success") && (
                    <div
                      className={`pl-4 ${
                        step.type === "success" ? "text-success/80 font-bold" : "text-muted-foreground/60"
                      }`}
                    >
                      {step.text}
                    </div>
                  )}
                  {step.type === "code" && (
                    <div className="relative group my-1">
                      <pre className="text-muted-foreground/95 bg-black/45 p-3 border border-border/40 overflow-x-auto text-[10px] leading-relaxed select-all">
                        <code>{step.text}</code>
                      </pre>
                      <span className="absolute top-2 right-2 text-[8px] text-muted-foreground/20 uppercase tracking-widest pointer-events-none group-hover:text-primary/30 transition-colors">
                        c++
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Active Typing Input */}
              {terminalSteps[currentStepIndex]?.type === "input" && (
                <TypedLine
                  prefix="guest@itl:~$"
                  text={terminalSteps[currentStepIndex].text}
                  onComplete={handleInputComplete}
                />
              )}

              {/* Action/Processing Dot */}
              {terminalSteps[currentStepIndex] && terminalSteps[currentStepIndex].type !== "input" && (
                <div className="flex items-center gap-2 pl-4 text-muted-foreground/40 animate-pulse text-[10px]">
                  <span>Processing...</span>
                  <span className="inline-block h-3 w-1.5 bg-primary animate-blink" />
                </div>
              )}

              {/* Inactive blinking cursor state at end */}
              {currentStepIndex >= terminalSteps.length && (
                <div className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">guest@itl:~$</span>
                  <span className="inline-block h-3.5 w-1.5 bg-primary animate-blink" />
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
