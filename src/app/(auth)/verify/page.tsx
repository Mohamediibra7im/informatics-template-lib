"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useTerminalTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { Terminal, Key, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const redirect = searchParams.get("redirect") || "/dashboard";

  const { refresh } = useAuth();
  const { playClick, playBeep, playSuccess } = useTerminalTheme();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("Email parameter missing");
      router.push("/login");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length < 4) {
      playBeep(330, 0.1);
      toast.error("Please enter a valid verification code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        playSuccess();
        toast.success("EMAIL VERIFIED - ACCESS GRANTED");
        await refresh();
        router.push(redirect);
      } else {
        playBeep(180, 0.4);
        setShake(true);
        toast.error(data.error || "Verification failed");
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setLoading(false);
      playBeep(180, 0.4);
      toast.error("Network error");
    }
  };

  const handleResend = async () => {
    playClick();
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResending(false);

      if (res.ok) {
        playSuccess();
        toast.success("Verification code resent");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to resend code");
      }
    } catch {
      setResending(false);
      toast.error("Network error");
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
              [ EMAIL VERIFICATION ]
            </span>
          </div>
          <span className="text-[9px] font-bold opacity-50 flex items-center gap-1">
            <Terminal className="h-3 w-3" />
            VERIFY_SESSION
          </span>
        </div>

        {/* Terminal Logs */}
        <div className="p-4 bg-background/20 border-b border-primary/10 text-[10px] text-muted-foreground/50 space-y-1 font-mono">
          <div className="flex items-center gap-1">
            <span className="text-primary font-bold">user@itl:~$</span>
            <span>emailverify --send</span>
          </div>
          <div className="text-success/70">[OK] Verification email dispatched to:</div>
          <div className="text-foreground/80">{email}</div>
          <div>[INFO] Enter 6-digit code to activate account...</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5" />
              VERIFICATION CODE
            </Label>
            <Input
              id="code"
              type="text"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 123456"
              className="font-mono text-center text-lg tracking-[0.2em] bg-background/30 border-primary/15 focus:border-primary/40 placeholder:text-muted-foreground/20"
              autoComplete="one-time-code"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || code.length < 4}
            className="w-full font-mono text-xs uppercase tracking-wider"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 animate-spin" />
                VERIFYING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                SUBMIT CODE
              </span>
            )}
          </Button>

          <div className="text-center text-[10px] text-muted-foreground/40 pt-2 flex flex-col gap-2">
            <div>
              <span>Didn&apos;t receive code? </span>
              <button
                type="button"
                disabled={resending}
                onClick={handleResend}
                className="text-primary/70 hover:text-primary underline underline-offset-2 transition-colors disabled:opacity-50"
              >
                {resending ? (
                  <span className="flex items-center gap-1 inline-flex">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                    Resending...
                  </span>
                ) : (
                  "Resend Code"
                )}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}
