"use client";

import { useState } from "react";
import { useTerminalTheme } from "./theme-provider";
import { Settings, Volume2, VolumeX, Zap, Rows3, Hash } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function RetroSettings() {
  const [open, setOpen] = useState(false);
  const {
    sound,
    setSound,
    reduceMotion,
    setReduceMotion,
    compact,
    setCompact,
    lineNumbers,
    setLineNumbers,
    playClick
  } = useTerminalTheme();

  const handleToggle = (setter: (v: boolean) => void, val: boolean) => {
    playClick();
    setter(!val);
  };

  return (
    <div className="hidden sm:block fixed bottom-4 right-4 z-50 font-mono">
      {/* Settings toggle button */}
      <button
        onClick={() => {
          playClick();
          setOpen(!open);
        }}
        className="flex items-center justify-center h-9 w-9 border border-primary bg-card/90 text-primary shadow-[0_0_10px_var(--primary-glow-weak)] hover:shadow-[0_0_15px_var(--primary-glow)] transition-all hover:bg-primary/10 rounded-none cursor-pointer"
        title="Open Bios Settings"
      >
        <Settings className={`h-4.5 w-4.5 ${open ? 'animate-spin' : ''}`} />
      </button>

      {/* Floating Card */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-12 right-0 w-80 border border-primary bg-card/95 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.8),0_0_20px_var(--primary-glow-weak)]"
          >
            {/* Window header */}
            <div className="flex items-center justify-between border-b border-primary px-3 py-1.5 bg-primary/10 select-none">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  [bios_setup.cfg]
                </span>
              </div>
              <button
                onClick={() => {
                  playClick();
                  setOpen(false);
                }}
                className="text-[10px] text-primary hover:text-foreground hover:bg-primary/20 px-1 border border-transparent hover:border-primary/30"
              >
                [X]
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 text-xs text-foreground">
              {/* Interface toggles */}
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold block mb-1">
                  $ configure --interface
                </label>

                {/* Reduce Motion */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground/60">
                    <Zap className="h-3.5 w-3.5" />
                    Reduce Motion
                  </span>
                  <button
                    onClick={() => handleToggle(setReduceMotion, reduceMotion)}
                    className={`px-2 py-0.5 border text-[10px] font-bold uppercase transition-all ${
                      reduceMotion
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground/30 hover:border-border/80"
                    }`}
                  >
                    {reduceMotion ? "ENABLED" : "DISABLED"}
                  </button>
                </div>

                {/* Compact Density */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground/60">
                    <Rows3 className="h-3.5 w-3.5" />
                    Compact Density
                  </span>
                  <button
                    onClick={() => handleToggle(setCompact, compact)}
                    className={`px-2 py-0.5 border text-[10px] font-bold uppercase transition-all ${
                      compact
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground/30 hover:border-border/80"
                    }`}
                  >
                    {compact ? "ENABLED" : "DISABLED"}
                  </button>
                </div>

                {/* Code Line Numbers */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground/60">
                    <Hash className="h-3.5 w-3.5" />
                    Line Numbers
                  </span>
                  <button
                    onClick={() => handleToggle(setLineNumbers, lineNumbers)}
                    className={`px-2 py-0.5 border text-[10px] font-bold uppercase transition-all ${
                      lineNumbers
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground/30 hover:border-border/80"
                    }`}
                  >
                    {lineNumbers ? "ENABLED" : "DISABLED"}
                  </button>
                </div>

                {/* Retro Sounds */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground/60">
                    {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    Retro Sounds
                  </span>
                  <button
                    onClick={() => {
                      playClick();
                      setSound(!sound);
                    }}
                    className={`px-2 py-0.5 border text-[10px] font-bold uppercase transition-all ${
                      sound
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground/30 hover:border-border/80"
                    }`}
                  >
                    {sound ? "ENABLED" : "DISABLED"}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-3 py-1.5 bg-muted/15 flex justify-between text-[9px] text-muted-foreground/30 select-none">
              <span>SYSTEM: OK</span>
              <span>VER: 1.0.8</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
