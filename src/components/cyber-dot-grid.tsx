"use client";

import { useEffect, useRef } from "react";
import { useTerminalTheme } from "./theme-provider";

interface Dot {
  x0: number; // Base grid X
  y0: number; // Base grid Y
  x: number;  // Current X
  y: number;  // Current Y
  vx: number; // Velocity X
  vy: number; // Velocity Y
  baseSize: number;
  size: number;
  targetSize: number;
  alpha: number;
  targetAlpha: number;
  phase: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  intensity: number;
}

export function CyberDotGrid({ className = "" }: { className?: string }) {
  const { bgStyle } = useTerminalTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const dotsRef = useRef<Dot[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  useEffect(() => {
    if (bgStyle !== "dots") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SPACING = 34; // Spacing between dots in CSS pixels
    const HOVER_RADIUS = 140; // Mouse interaction radius

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Re-generate dot grid based on new dimensions
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      const newDots: Dot[] = [];

      const startX = (width - (cols - 1) * SPACING) / 2;
      const startY = (height - (rows - 1) * SPACING) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x0 = startX + c * SPACING;
          const y0 = startY + r * SPACING;
          const baseSize = 1.25 + Math.random() * 0.4;
          newDots.push({
            x0,
            y0,
            x: x0,
            y: y0,
            vx: 0,
            vy: 0,
            baseSize,
            size: baseSize,
            targetSize: baseSize,
            alpha: 0.18,
            targetAlpha: 0.18,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
      dotsRef.current = newDots;
    };

    resize();
    window.addEventListener("resize", resize);

    // Mouse listeners
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.45,
        speed: 7,
        intensity: 1.0,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick);

    let time = 0;

    const render = () => {
      time += 0.02;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      // Palette setup (dark-only)
      const baseDotColor = "155, 168, 171";
      const highlightColor = "6, 182, 212"; // Cyan glow

      // Update & render ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += r.speed;
        r.intensity = Math.max(0, 1 - r.radius / r.maxRadius);

        if (r.radius >= r.maxRadius) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        // Draw faint expanding ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${highlightColor}, ${r.intensity * 0.15})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const mouse = mouseRef.current;
      const dots = dotsRef.current;
      const ripples = ripplesRef.current;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // 1. Base ambient sine wave oscillation
        const wave = Math.sin(time + dot.x0 * 0.008 + dot.y0 * 0.008 + dot.phase);
        dot.targetAlpha = 0.12 + wave * 0.05;
        dot.targetSize = dot.baseSize + wave * 0.25;

        // 2. Cursor hover effect
        if (mouse.active) {
          const dx = dot.x0 - mouse.x;
          const dy = dot.y0 - mouse.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < HOVER_RADIUS * HOVER_RADIUS) {
            const dist = Math.sqrt(distSq);
            const factor = 1 - dist / HOVER_RADIUS;
            const easeFactor = factor * factor; // smooth dropoff

            // Push dot away slightly
            const angle = Math.atan2(dy, dx);
            const pushDist = easeFactor * 14;
            const targetX = dot.x0 + Math.cos(angle) * pushDist;
            const targetY = dot.y0 + Math.sin(angle) * pushDist;

            dot.vx += (targetX - dot.x) * 0.15;
            dot.vy += (targetY - dot.y) * 0.15;

            // Increase dot size & glow
            dot.targetSize += easeFactor * 2.8;
            dot.targetAlpha = Math.min(0.9, dot.targetAlpha + easeFactor * 0.75);
          }
        }

        // 3. Ripple shockwave effect
        for (let j = 0; j < ripples.length; j++) {
          const rip = ripples[j];
          const dx = dot.x0 - rip.x;
          const dy = dot.y0 - rip.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const distFromRing = Math.abs(dist - rip.radius);

          const ringThickness = 45;
          if (distFromRing < ringThickness) {
            const ripFactor = (1 - distFromRing / ringThickness) * rip.intensity;
            const angle = Math.atan2(dy, dx);
            const push = ripFactor * 12;

            dot.vx += Math.cos(angle) * push * 0.2;
            dot.vy += Math.sin(angle) * push * 0.2;

            dot.targetSize += ripFactor * 2.2;
            dot.targetAlpha = Math.min(0.95, dot.targetAlpha + ripFactor * 0.7);
          }
        }

        // 4. Spring physics returning to base position
        const springK = 0.08;
        const damping = 0.82;

        const ax = (dot.x0 - dot.x) * springK;
        const ay = (dot.y0 - dot.y) * springK;

        dot.vx = (dot.vx + ax) * damping;
        dot.vy = (dot.vy + ay) * damping;

        dot.x += dot.vx;
        dot.y += dot.vy;

        // Smooth size and alpha transition
        dot.size += (dot.targetSize - dot.size) * 0.15;
        dot.alpha += (dot.targetAlpha - dot.alpha) * 0.15;

        // 5. Draw the dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Math.max(0.5, dot.size), 0, Math.PI * 2);

        // If boosted by hover or ripple, use bright highlight color
        const isHighlighted = dot.alpha > 0.4;
        const color = isHighlighted ? highlightColor : baseDotColor;

        ctx.fillStyle = `rgba(${color}, ${Math.min(1, Math.max(0, dot.alpha))})`;
        ctx.fill();

        // Extra glow halo for strongly highlighted dots
        if (dot.alpha > 0.5) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color}, ${dot.alpha * 0.2})`;
          ctx.fill();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
    };
  }, [bgStyle]);

  if (bgStyle !== "dots") return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${className}`}
    />
  );
}
