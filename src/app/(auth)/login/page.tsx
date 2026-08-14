"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useTerminalTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { Terminal, Lock, Eye, EyeOff, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginContent() {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const { login } = useAuth();
  const { playClick, playBeep, playSuccess } = useTerminalTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginValue.trim() || !password.trim()) {
      playBeep(330, 0.1);
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    const result = await login(loginValue, password);
    setLoading(false);

    const redirect = searchParams.get("redirect") || "/dashboard";
    if (result.success) {
      playSuccess();
      toast.success("ACCESS GRANTED");
      router.push(redirect);
    } else {
      playBeep(180, 0.4);
      setShake(true);
      if (result.needsVerification) {
        toast.warning("Email not verified. Redirecting to verification page...");
        setTimeout(() => {
          router.push(
            `/verify?email=${encodeURIComponent(result.email || "")}&redirect=${encodeURIComponent(redirect)}`
          );
        }, 1500);
      } else {
        toast.error(result.error || "ACCESS DENIED");
      }
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 font-mono select-none">
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

      <div
        className={`w-full max-w-md border border-primary/20 bg-card/65 shadow-md transition-all ${
          shake
            ? "animate-retro-shake border-destructive/60 bg-destructive/5 shadow-[0_0_30px_rgba(239,68,68,0.25)]"
            : "shadow-[0_0_25px_var(--primary-glow-ultra-weak)]"
        }`}
      >
        {/* Terminal Title Bar */}
        <div
          className={`flex items-center justify-between px-3 py-2 border-b border-primary/20 ${
            shake ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-primary/5 text-primary"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1 shrink-0">
              <span className={`h-2.5 w-2.5 rounded-full ${shake ? "bg-destructive" : "bg-destructive/50"}`} />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">
              [ USER AUTHENTICATION ]
            </span>
          </div>
          <span className="text-[9px] font-bold opacity-50 flex items-center gap-1">
            <Terminal className="h-3 w-3" />
            SESSION_INIT
          </span>
        </div>

        {/* Terminal Logs */}
        <div className="p-4 bg-background/20 border-b border-primary/10 text-[10px] text-muted-foreground/50 space-y-1 font-mono">
          <div className="flex items-center gap-1">
            <span className="text-primary font-bold">user@itl:~$</span>
            <span>ssh login --authenticate</span>
          </div>
          <div className="text-success/70">[OK] Connection established</div>
          <div>[INFO] Awaiting credentials...</div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login" className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold flex items-center gap-1.5">
              <User className="h-3 w-3" />
              USERNAME OR EMAIL
            </Label>
            <Input
              id="login"
              type="text"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              placeholder="Enter username or email"
              className="font-mono text-xs bg-background/30 border-primary/15 focus:border-primary/40 placeholder:text-muted-foreground/25"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              PASSWORD
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="font-mono text-xs bg-background/30 border-primary/15 focus:border-primary/40 placeholder:text-muted-foreground/25 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowPassword(!showPassword);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary/60 transition-colors"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-mono text-xs uppercase tracking-wider"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 animate-spin" />
                AUTHENTICATING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-3.5 w-3.5" />
                LOGIN
              </span>
            )}
          </Button>

          <div className="text-center text-[10px] text-muted-foreground/40 pt-2">
            <span>No account? </span>
            <Link
              href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : "/register"}
              onClick={playClick}
              className="text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
            >
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
