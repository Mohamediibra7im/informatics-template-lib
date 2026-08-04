"use client";

import { useEffect, useRef } from "react";
import { useTerminalTheme } from "./theme-provider";

const CP_KEYWORDS = [
  "#include",
  "vector<int>",
  "segment_tree",
  "O(N log N)",
  "std::cout",
  "dfs(0, -1)",
  "dp[i][j]",
  "dijkstra()",
  "struct SegTree",
  "template <typename T>",
  "using namespace std;",
  "long long",
  "push_back()",
  "memset()",
  "priority_queue",
  "Sieve()",
  "modpow()",
  "cin >> n >> m",
  "NULL",
  "int main()",
  "return 0;",
  "define INF 1e9",
  "bitset<32>",
  "KMP()",
  "DSU dsu(N)",
  "__builtin_popcount",
  "ios_base::sync_with_stdio(0)",
  "cin.tie(NULL)",
  "std::max",
  "solve()",
  "map<string, int>",
  "set<int>",
  "pair<int, int>",
  "typedef long long ll"
];

export function MatrixRain() {
  const { theme, matrix } = useTerminalTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!matrix) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Get color based on theme
    const getThemeColor = () => {
      switch (theme) {
        case "amber": return { text: "#f59e0b", glow: "rgba(245, 158, 11, 0.2)" };
        case "cyan": return { text: "#06b6d4", glow: "rgba(6, 182, 212, 0.2)" };
        case "red": return { text: "#ef4444", glow: "rgba(239, 68, 68, 0.2)" };
        case "purple": return { text: "#a855f7", glow: "rgba(168, 85, 247, 0.2)" };
        case "green":
        default:
          return { text: "#22c55e", glow: "rgba(34, 197, 94, 0.2)" };
      }
    };

    const fontSize = 12;
    // Calculate columns
    let columns = Math.floor(canvas.width / 90); // wider columns since we write full words
    if (columns < 5) columns = 5;

    interface Drop {
      x: number;
      y: number;
      speed: number;
      word: string;
      charsPrinted: number;
      delay: number;
    }

    const initDrop = (colIndex: number): Drop => {
      const x = colIndex * (canvas.width / columns);
      const word = CP_KEYWORDS[Math.floor(Math.random() * CP_KEYWORDS.length)];
      return {
        x,
        y: -Math.random() * 200 - 50,
        speed: Math.random() * 1.5 + 0.8,
        word,
        charsPrinted: 0,
        delay: Math.floor(Math.random() * 100)
      };
    };

    const drops: Drop[] = Array.from({ length: columns }, (_, i) => initDrop(i));

    ctx.font = `${fontSize}px monospace`;

    let lastTime = 0;
    const fpsInterval = 1000 / 30; // throttle to 30fps to protect CPU

    const draw = (timestamp: number) => {
      animationId = requestAnimationFrame(draw);

      const elapsed = timestamp - lastTime;
      if (elapsed < fpsInterval) return;
      lastTime = timestamp - (elapsed % fpsInterval);

      // clear with semi-transparent background to create trailing effect
      ctx.fillStyle = "rgba(3, 10, 5, 0.1)"; // default fallback green-black
      if (theme === "amber") ctx.fillStyle = "rgba(8, 5, 1, 0.1)";
      if (theme === "cyan") ctx.fillStyle = "rgba(1, 7, 10, 0.1)";
      if (theme === "red") ctx.fillStyle = "rgba(7, 1, 1, 0.1)";
      if (theme === "purple") ctx.fillStyle = "rgba(4, 1, 10, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const themeColors = getThemeColor();
      ctx.font = `${fontSize}px JetBrains Mono, Courier New, monospace`;

      drops.forEach((drop, index) => {
        if (drop.delay > 0) {
          drop.delay--;
          return;
        }

        // Draw the word
        ctx.fillStyle = themeColors.text;
        // Make the leading character glow brighter
        ctx.shadowBlur = 4;
        ctx.shadowColor = themeColors.text;
        
        // Print character by character or full word with opacity
        const opacity = Math.max(0.15, Math.min(0.6, 1 - (drop.y / canvas.height)));
        ctx.fillStyle = `${themeColors.text}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        
        ctx.fillText(drop.word, drop.x, drop.y);
        ctx.shadowBlur = 0; // reset glow

        // move drops down
        drop.y += drop.speed * 2.5;

        // Reset if it hits the bottom
        if (drop.y > canvas.height) {
          drops[index] = initDrop(index);
        }
      });
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [theme, matrix]);

  if (!matrix) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.06]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
