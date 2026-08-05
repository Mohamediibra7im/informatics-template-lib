import { Shield, Radio } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] mx-auto max-w-7xl w-full px-4 py-8 font-mono">
      {/* Mainframe Container */}
      <div className="border-double border-4 border-primary/30 bg-card/90 shadow-[0_0_30px_var(--primary-glow-ultra-weak)] overflow-hidden">
        {/* Mainframe Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-primary/5 select-none">
          <div className="flex items-center gap-2">
            <div className="flex gap-1 shrink-0">
              <span className="h-2 w-2 rounded-full bg-destructive/60 animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-warning/60" />
              <span className="h-2 w-2 rounded-full bg-success/60" />
            </div>
            <span className="text-xs font-bold text-primary tracking-widest uppercase">
              [BIOS Setup Utility — Main Menu]
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
            <Radio className="h-3 w-3 text-primary animate-ping" />
            <span>SECURE_SHELL: ON</span>
          </div>
        </div>

        {/* Diagnostic Admin header panel */}
        <div className="p-6 border-b border-primary/10 bg-muted/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center border border-primary/30 bg-primary/5 shadow-[0_0_10px_var(--primary-glow-weak)]">
              <Shield className="h-5 w-5 text-primary glow-text" />
            </div>
            <div>
              <h1 className="text-md font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <span className="text-primary">$</span> admin --root
              </h1>
              <p className="text-[10px] text-muted-foreground/45 mt-0.5 uppercase tracking-wide">
                Mainframe administrative control terminal
              </p>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6">
          {children}
        </div>

        {/* Mainframe bottom logs panel */}
        <div className="border-t border-primary/20 px-4 py-2 bg-muted/5 flex justify-between items-center text-[9px] text-muted-foreground/30 select-none">
          <span>PORT: 3000 // TTY1</span>
          <span>KEY_AUTH: SHA256-AES</span>
        </div>
      </div>
    </div>
  );
}
