"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldAlert, Lock, Eye, EyeOff, Cpu } from "lucide-react";
import { useTerminalTheme } from "@/components/theme-provider";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [clientIp, setClientIp] = useState("127.0.0.1");

  const { playClick, playBeep, playSuccess } = useTerminalTheme();
  const router = useRouter();

  useEffect(() => {
    // Generate a random-like local subnet IP for aesthetic diagnostic logs
    const subnet = Math.floor(Math.random() * 254) + 1;
    const node = Math.floor(Math.random() * 254) + 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClientIp(`192.168.${subnet}.${node}`);
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      playBeep(330, 0.1);
      toast.error("Password query is empty");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);

    if (res.ok) {
      playSuccess();
      toast.success("ACCESS GRANTED");
      const params = new URLSearchParams(window.location.search);
      router.push(params.get("redirect") || "/admin");
    } else {
      playBeep(180, 0.4);
      setShake(true);
      toast.error("ACCESS DENIED: PASSWORD INVALID");
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 font-mono select-none">
      {/* Dynamic shake keyframe styles */}
      <style>{`
        @keyframes retro-shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        .animate-retro-shake {
          animation: retro-shake 0.4s ease-in-out;
        }
      `}</style>

      {/* Security mainframe container */}
      <div 
        className={`w-full max-w-md border border-primary/20 bg-card/65 shadow-md transition-all ${
          shake ? "animate-retro-shake border-destructive/60 bg-destructive/5 shadow-[0_0_30px_rgba(239,68,68,0.25)]" : "shadow-[0_0_25px_var(--primary-glow-ultra-weak)]"
        }`}
      >
        {/* Terminal Title Bar */}
        <div className={`flex items-center justify-between px-3 py-2 border-b border-primary/20 ${shake ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-primary/5 text-primary"}`}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 shrink-0">
              <span className={`h-2.5 w-2.5 rounded-full ${shake ? "bg-destructive" : "bg-destructive/50"} animate-pulse`} />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">
              [ SECURE ACCESS GATEWAY ]
            </span>
          </div>
          <span className="text-[9px] font-bold opacity-50 flex items-center gap-1">
            <Cpu className="h-3 w-3 animate-spin duration-3000" />
            PORT_22 // SSHD
          </span>
        </div>

        {/* Immersive Terminal Logs */}
        <div className="p-4 bg-background/20 border-b border-primary/10 text-[10px] text-muted-foreground/50 space-y-1 font-mono select-text selection:bg-primary/15 selection:text-primary">
          <div className="flex items-center gap-1">
            <span className="text-primary font-bold">guest@itl:~$</span>
            <span>sudo login --admin</span>
          </div>
          <div>[BOOT] loading ssh_auth_subsystem... <span className="text-success font-bold">[ OK ]</span></div>
          <div>[INFO] client_node_origin: {clientIp}</div>
          <div>[INFO] handshake: ECDH-256 // AES-GCM-256</div>
          <div className={`${shake ? "text-destructive font-bold animate-pulse" : "text-primary/70"}`}>
            {shake ? "[WARN] 1 INVALID ATTEMPT LOGGED TO SYSLOG" : "[AUTH] enter administrative credentials below:"}
          </div>
        </div>

        {/* Input Form Body */}
        <div className="p-6">
          <form onSubmit={login} className="space-y-4">
            <div className="space-y-2.5">
              <Label htmlFor="password" className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary/70" />
                <span>Security Token Query</span>
              </Label>
              
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-primary font-bold select-none">&gt;</span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { playClick(); setPassword(e.target.value); }}
                  placeholder="Password Hash"
                  autoFocus
                  className="font-mono text-xs h-9 pl-7 pr-10 border border-border bg-background/30 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/15 rounded-none w-full"
                />
                <button
                  type="button"
                  onClick={() => { playClick(); setShowPassword(!showPassword); }}
                  className="absolute right-3 text-muted-foreground/40 hover:text-primary transition-colors focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className={`w-full font-mono text-xs h-9 tracking-widest uppercase rounded-none border transition-all ${
                shake 
                  ? "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20" 
                  : "border-primary bg-primary/10 text-primary hover:bg-primary/20"
              }`} 
              disabled={loading}
            >
              {loading ? "Verifying Token..." : "Execute [ENTER]"}
            </Button>
          </form>
        </div>

        {/* Bottom Warning Banner */}
        <div className="border-t border-primary/10 px-4 py-3 bg-muted/5 flex gap-3 items-start select-none">
          <ShieldAlert className="h-5 w-5 text-warning/70 shrink-0 mt-0.5" />
          <div className="text-[9px] text-muted-foreground/40 leading-relaxed font-mono uppercase tracking-wide">
            <span className="text-warning font-bold">WARNING:</span> This system is protected by administrative access control. Unauthorized actions are strictly logged under security guidelines.
          </div>
        </div>
      </div>
    </div>
  );
}
