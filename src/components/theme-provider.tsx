"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type BgStyleType = "dots" | "matrix" | "off";

interface TerminalThemeContextValue {
  sound: boolean;
  setSound: (b: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (b: boolean) => void;
  compact: boolean;
  setCompact: (b: boolean) => void;
  lineNumbers: boolean;
  setLineNumbers: (b: boolean) => void;
  matrix: boolean;
  setMatrix: (b: boolean) => void;
  bgStyle: BgStyleType;
  setBgStyle: (style: BgStyleType) => void;
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
  const [sound, setSoundState] = useState(true);
  const [reduceMotion, setReduceMotionState] = useState(false);
  const [compact, setCompactState] = useState(false);
  const [lineNumbers, setLineNumbersState] = useState(true);
  const [matrix, setMatrixState] = useState(false);
  const [bgStyle, setBgStyleState] = useState<BgStyleType>("dots");

  // Load from local storage
  useEffect(() => {
    const storedSound = localStorage.getItem("terminal-sound");
    if (storedSound !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSoundState(storedSound === "true");
    }

    const storedReduceMotion = localStorage.getItem("terminal-reduce-motion");
    if (storedReduceMotion !== null) {
      setReduceMotionState(storedReduceMotion === "true");
    }

    const storedCompact = localStorage.getItem("terminal-compact");
    if (storedCompact !== null) {
      setCompactState(storedCompact === "true");
    }

    const storedLineNumbers = localStorage.getItem("terminal-line-numbers");
    if (storedLineNumbers !== null) {
      setLineNumbersState(storedLineNumbers === "true");
    }

    const storedBgStyle = localStorage.getItem("terminal-bg-style") as BgStyleType;
    if (storedBgStyle === "dots" || storedBgStyle === "off") {
      setBgStyleState(storedBgStyle);
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
    root.setAttribute("data-reduce-motion", String(reduceMotion));
    root.setAttribute("data-compact", String(compact));
    root.setAttribute("data-line-numbers", String(lineNumbers));
  }, [reduceMotion, compact, lineNumbers, mounted]);

  const setReduceMotion = (b: boolean) => {
    setReduceMotionState(b);
    localStorage.setItem("terminal-reduce-motion", String(b));
    if (sound) playClick();
  };

  const setCompact = (b: boolean) => {
    setCompactState(b);
    localStorage.setItem("terminal-compact", String(b));
    if (sound) playClick();
  };

  const setLineNumbers = (b: boolean) => {
    setLineNumbersState(b);
    localStorage.setItem("terminal-line-numbers", String(b));
    if (sound) playClick();
  };

  const setSound = (b: boolean) => {
    setSoundState(b);
    localStorage.setItem("terminal-sound", String(b));
    if (b) {
      setTimeout(() => {
        const ctx = getAudioContext();
        if (ctx) playSuccessSound(ctx);
      }, 50);
    }
  };

  const setMatrix = (b: boolean) => {
    setMatrixState(b);
    if (sound) playClick();
  };

  const setBgStyle = (style: BgStyleType) => {
    setBgStyleState(style);
    localStorage.setItem("terminal-bg-style", style);
    if (sound) playClick();
  };

  // Audio synthesizers
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
        sound,
        setSound,
        reduceMotion,
        setReduceMotion,
        compact,
        setCompact,
        lineNumbers,
        setLineNumbers,
        matrix,
        setMatrix,
        bgStyle,
        setBgStyle,
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
    return {
      sound: false,
      setSound: () => {},
      reduceMotion: false,
      setReduceMotion: () => {},
      compact: false,
      setCompact: () => {},
      lineNumbers: true,
      setLineNumbers: () => {},
      matrix: false,
      setMatrix: () => {},
      bgStyle: "dots" as const,
      setBgStyle: () => {},
      playClick: () => {},
      playBeep: () => {},
      playSuccess: () => {},
      playBoot: () => {},
    };
  }
  return context;
}

export function useTheme() {
  return { resolvedTheme: "dark" as const };
}
