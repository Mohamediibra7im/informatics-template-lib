"use client";

import { useEffect } from "react";
import { ThemeProvider, useTerminalTheme } from "./theme-provider";
import { AuthProvider } from "./auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { CyberDotGrid } from "./cyber-dot-grid";
import { RetroSettings } from "./retro-settings";
import { CliConsole } from "./cli-console";

function AppContent({ children }: { children: React.ReactNode }) {
  const { playBoot, playClick } = useTerminalTheme();

  useEffect(() => {
    // Play boot sound on first user action if blocked, or try immediately
    const playBootAudio = () => {
      playBoot();
      window.removeEventListener("click", playBootAudio);
      window.removeEventListener("keydown", playBootAudio);
    };

    // Attempt to play on mount (with short delay for context stability)
    const timer = setTimeout(() => {
      playBoot();
    }, 600);

    // Bind fallback interaction listeners
    window.addEventListener("click", playBootAudio);
    window.addEventListener("keydown", playBootAudio);

    // Global click listener to play mechanical sound on all links/buttons
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest("a") || target.closest("button") || target.closest("[role='button']");
      
      // Ignore clicks inside the terminal input to prevent double sound (since inputs have keypress typing sounds)
      if (interactive && !interactive.closest("form") && target.tagName !== "INPUT") {
        playClick();
      }
    };
    window.addEventListener("click", handleGlobalClick, { capture: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", playBootAudio);
      window.removeEventListener("keydown", playBootAudio);
      window.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [playBoot, playClick]);

  return (
    <>
      <CyberDotGrid />
      {children}
      <RetroSettings />
      <CliConsole />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent>
          {children}
        </AppContent>
        <Toaster richColors position="top-center" className="font-mono text-xs" />
      </AuthProvider>
    </ThemeProvider>
  );
}
