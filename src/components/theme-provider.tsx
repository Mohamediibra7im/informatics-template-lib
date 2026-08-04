"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type TerminalThemeType = "green" | "amber" | "cyan" | "red" | "purple" | "mono";

interface TerminalThemeContextValue {
  theme: TerminalThemeType;
  setTheme: (t: TerminalThemeType) => void;
  scanlines: boolean;
  setScanlines: (b: boolean) => void;
  flicker: boolean;
  setFlicker: (b: boolean) => void;
  sound: boolean;
  setSound: (b: boolean) => void;
  matrix: boolean;
  setMatrix: (b: boolean) => void;
  playClick: () => void;
  playBeep: (freq?: number, duration?: number) => void;
  playSuccess: () => void;
  playBoot: () => void;
}

const TerminalThemeCtx = createContext<TerminalThemeContextValue | null>(null);

let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  return sharedAudioCtx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<TerminalThemeType>("green");
  const [scanlines, setScanlinesState] = useState(true);
  const [flicker, setFlickerState] = useState(true);
  const [sound, setSoundState] = useState(true);
  const [matrix, setMatrixState] = useState(true);

  // Load from local storage
  useEffect(() => {
    const storedTheme = localStorage.getItem("terminal-theme") as TerminalThemeType;
    if (storedTheme && ["green", "amber", "cyan", "red", "purple", "mono"].includes(storedTheme)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(storedTheme);
    }

    const storedScanlines = localStorage.getItem("terminal-scanlines");
    if (storedScanlines !== null) {
      setScanlinesState(storedScanlines === "true");
    }

    const storedFlicker = localStorage.getItem("terminal-flicker");
    if (storedFlicker !== null) {
      setFlickerState(storedFlicker === "true");
    }

    const storedSound = localStorage.getItem("terminal-sound");
    if (storedSound !== null) {
      setSoundState(storedSound === "true");
    }

    const storedMatrix = localStorage.getItem("terminal-matrix");
    if (storedMatrix !== null) {
      setMatrixState(storedMatrix === "true");
    }

    setMounted(true);
  }, []);

  // Update HTML tag attributes on changes
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    root.setAttribute("data-terminal-theme", theme);
    root.setAttribute("data-scanlines", String(scanlines));
    root.setAttribute("data-flicker", String(flicker));
  }, [theme, scanlines, flicker, mounted]);

  const setTheme = (t: TerminalThemeType) => {
    setThemeState(t);
    localStorage.setItem("terminal-theme", t);
    if (sound) playSuccess();
  };

  const setScanlines = (b: boolean) => {
    setScanlinesState(b);
    localStorage.setItem("terminal-scanlines", String(b));
    if (sound) playClick();
  };

  const setFlicker = (b: boolean) => {
    setFlickerState(b);
    localStorage.setItem("terminal-flicker", String(b));
    if (sound) playClick();
  };

  const setSound = (b: boolean) => {
    setSoundState(b);
    localStorage.setItem("terminal-sound", String(b));
    if (b) {
      // Play a quick sound to show it's enabled
      setTimeout(() => {
        const ctx = getAudioContext();
        if (ctx) playSuccessSound(ctx);
      }, 50);
    }
  };

  const setMatrix = (b: boolean) => {
    setMatrixState(b);
    localStorage.setItem("terminal-matrix", String(b));
    if (sound) playClick();
  };

  // Audio synthethizers
  const playClick = () => {
    if (!sound) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playClickSound(ctx));
    } else {
      playClickSound(ctx);
    }
  };

  const playBeep = (freq = 800, duration = 0.15) => {
    if (!sound) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playBeepSound(ctx, freq, duration));
    } else {
      playBeepSound(ctx, freq, duration);
    }
  };

  const playSuccess = () => {
    if (!sound) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playSuccessSound(ctx));
    } else {
      playSuccessSound(ctx);
    }
  };

  const playBoot = () => {
    if (!sound) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playBootSound(ctx));
    } else {
      playBootSound(ctx);
    }
  };

  const playClickSound = (ctx: AudioContext) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.012, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  };

  const playBeepSound = (ctx: AudioContext, freq: number, duration: number) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  const playSuccessSound = (ctx: AudioContext) => {
    try {
      const time = ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time + idx * 0.05);
        gain.gain.setValueAtTime(0.02, time + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + idx * 0.05 + 0.12);
        osc.start(time + idx * 0.05);
        osc.stop(time + idx * 0.05 + 0.12);
      });
    } catch {}
  };

  const playBootSound = (ctx: AudioContext) => {
    try {
      const time = ctx.currentTime;
      // Retro synth chord
      const chords = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      const step = 0.08;
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time + idx * step);
        gain.gain.setValueAtTime(0, time + idx * step);
        gain.gain.linearRampToValueAtTime(0.015, time + idx * step + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + idx * step + 0.3);
        osc.start(time + idx * step);
        osc.stop(time + idx * step + 0.3);
      });
    } catch {}
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <TerminalThemeCtx.Provider
      value={{
        theme,
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
        playSuccess,
        playBoot,
      }}
    >
      {children}
    </TerminalThemeCtx.Provider>
  );
}

export function useTerminalTheme() {
  const context = useContext(TerminalThemeCtx);
  if (!context) {
    // Return a safe fallback during SSR / static prerendering when provider is not mounted
    return {
      theme: "green" as const,
      setTheme: () => {},
      scanlines: true,
      setScanlines: () => {},
      flicker: true,
      setFlicker: () => {},
      sound: false,
      setSound: () => {},
      matrix: true,
      setMatrix: () => {},
      playClick: () => {},
      playBeep: () => {},
      playSuccess: () => {},
      playBoot: () => {},
    };
  }
  return context;
}

// Fallback legacy export to keep original types happy if they import useTheme
export function useTheme() {
  return { resolvedTheme: "dark" as const };
}
