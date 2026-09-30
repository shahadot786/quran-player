"use client";

import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils";

export function IslamicWaveBackground({ className }: { className?: string }) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden select-none",
        className,
      )}
    >
      {/* Radial glow pinned to the right third of the panel */}
      <div className="absolute inset-0 bg-radial-[circle_at_85%_30%] from-gold/20 via-gold/5 to-transparent dark:from-gold/25 dark:via-gold/5 dark:to-transparent" />

      {/* SVG: all elements anchored to the right — waves sweep leftward */}
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 900 700"
        fill="none"
        preserveAspectRatio="xMaxYMin meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient fades from right-centre (bright) toward left (transparent) */}
          <linearGradient id="inplayer-gold-1" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--color-gold, #d4af37)" stopOpacity="0" />
            <stop offset="20%" stopColor="var(--color-gold, #d4af37)" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#f3e5ab" stopOpacity="0.7" />
            <stop offset="80%" stopColor="var(--color-gold, #d4af37)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-gold, #d4af37)" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="inplayer-gold-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--color-gold, #d4af37)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="inplayer-kaaba-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-gold, #d4af37)" stopOpacity="0.55" />
            <stop offset="45%" stopColor="var(--color-gold, #d4af37)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-gold, #d4af37)" stopOpacity="0" />
          </radialGradient>

          <filter id="inplayer-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient divine aura centred on right anchor point */}
        <circle
          cx="760"
          cy="200"
          r={isPlaying ? "210" : "165"}
          fill="url(#inplayer-kaaba-glow)"
          className={cn(
            "transition-all duration-1000",
            isPlaying ? "animate-pulse" : "opacity-60",
          )}
        />

        {/* Tawaf ripple ellipses — expand from right anchor, clip at left edge */}
        {[90, 150, 215, 295, 385].map((radius, i) => (
          <ellipse
            key={radius}
            cx="760"
            cy="215"
            rx={radius}
            ry={radius * 0.46}
            stroke="url(#inplayer-gold-1)"
            strokeWidth={i === 1 || i === 3 ? "1.5" : "1"}
            strokeDasharray={i % 2 === 0 ? "6 5" : undefined}
            className={cn(
              "origin-[760px_215px] opacity-40 transition-opacity duration-700 dark:opacity-55",
              isPlaying && "animate-[ping_7s_cubic-bezier(0,0,0.2,1)_infinite]",
            )}
            style={{
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${6 + i * 2}s`,
            }}
          />
        ))}

        {/* Flowing harmonic wave paths — originate from right, sweep left */}
        <path
          d="M 900 180 Q 700 120, 550 200 T 0 190"
          stroke="url(#inplayer-gold-1)"
          strokeWidth="2"
          filter="url(#inplayer-glow)"
          className={cn(
            "opacity-45 transition-all duration-1000",
            isPlaying ? "animate-[wave_6s_ease-in-out_infinite_alternate]" : "opacity-25",
          )}
        />
        <path
          d="M 900 300 Q 680 380, 520 290 T 0 310"
          stroke="url(#inplayer-gold-2)"
          strokeWidth="1.5"
          className={cn(
            "opacity-35 transition-all duration-1000",
            isPlaying ? "animate-[wave_8s_ease-in-out_infinite_alternate-reverse]" : "opacity-20",
          )}
        />
        <path
          d="M 900 420 Q 700 360, 540 410 T 0 390"
          stroke="url(#inplayer-gold-1)"
          strokeWidth="1.2"
          strokeDasharray="4 4"
          className={cn(
            "opacity-30 transition-all duration-1000",
            isPlaying ? "animate-[wave_10s_ease-in-out_infinite_alternate]" : "opacity-15",
          )}
        />

        {/* Rub-el-Hizb sacred stars around the right Kaaba zone */}
        {[
          { x: 620, y: 80,  s: 0.7,  d: "0s"   },
          { x: 870, y: 65,  s: 0.65, d: "1.2s"  },
          { x: 610, y: 330, s: 0.6,  d: "2s"    },
          { x: 875, y: 340, s: 0.6,  d: "0.8s"  },
        ].map(({ x, y, s, d }, index) => (
          <g
            key={index}
            transform={`translate(${x} ${y}) scale(${s})`}
            className="animate-pulse opacity-40 dark:opacity-60"
            style={{ animationDuration: "4s", animationDelay: d }}
          >
            <rect x="-10" y="-10" width="20" height="20" fill="none" stroke="var(--color-gold, #d4af37)" strokeWidth="1.2" />
            <rect x="-10" y="-10" width="20" height="20" fill="none" stroke="var(--color-gold, #d4af37)" strokeWidth="1.2" transform="rotate(45)" />
            <circle cx="0" cy="0" r="2" fill="var(--color-gold, #d4af37)" opacity="0.8" />
          </g>
        ))}

        {/* Majestic Kaaba Sharif — anchored right side, centred at (760, 195) */}
        <g transform="translate(760, 195)">
          {/* Shadharwan base platform */}
          <path d="M -54 44 L 0 70 L 54 44 L 0 20 Z" fill="none" stroke="var(--color-gold, #d4af37)" strokeWidth="1" opacity="0.35" />

          {/* Left wall — Kiswah */}
          <path d="M -50 40 L 0 65 L 0 -10 L -50 -35 Z" className="fill-zinc-900/90 stroke-gold/60 dark:fill-zinc-950/95 dark:stroke-gold/70" strokeWidth="1.5" />

          {/* Right wall — Kiswah */}
          <path d="M 0 65 L 50 40 L 50 -35 L 0 -10 Z" className="fill-zinc-950/95 stroke-gold/60 dark:fill-black dark:stroke-gold/70" strokeWidth="1.5" />

          {/* Roof */}
          <path d="M 0 -10 L 50 -35 L 0 -60 L -50 -35 Z" className="fill-zinc-800/80 stroke-gold/40 dark:fill-zinc-900 dark:stroke-gold/50" strokeWidth="1.2" />

          {/* Golden Hizam calligraphy band — left face */}
          <path d="M -50 -18 L 0 7 L 0 2 L -50 -23 Z" fill="var(--color-gold, #d4af37)" opacity="0.9" className="drop-shadow-[0_0_8px_rgba(212,175,55,0.7)]" />

          {/* Golden Hizam calligraphy band — right face */}
          <path d="M 0 7 L 50 -18 L 50 -23 L 0 2 Z" fill="var(--color-gold, #d4af37)" opacity="0.95" className="drop-shadow-[0_0_8px_rgba(212,175,55,0.7)]" />

          {/* Hizam inscription detail lines */}
          <line x1="-45" y1="-20" x2="-4" y2="3" stroke="#fff" strokeWidth="0.8" opacity="0.5" strokeDasharray="2 3" />
          <line x1="4" y1="3" x2="45" y2="-20" stroke="#fff" strokeWidth="0.8" opacity="0.5" strokeDasharray="2 3" />

          {/* Bab al-Kaaba — golden door */}
          <g transform="translate(13, 9)">
            <path d="M 0 11 L 18 2 L 18 35 L 0 44 Z" fill="var(--color-gold, #d4af37)" opacity="0.95" className="drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
            <path d="M 2 14 L 16 7 L 16 21 L 2 28 Z" fill="none" stroke="#5a4208" strokeWidth="0.8" />
            <path d="M 2 30 L 16 23 L 16 37 L 2 44 Z" fill="none" stroke="#5a4208" strokeWidth="0.8" />
          </g>

          {/* Mizab ar-Rahmah — golden rain spout */}
          <path d="M -22 -25 L -28 -28 L -28 -26 L -22 -23 Z" fill="var(--color-gold, #d4af37)" className="drop-shadow-[0_0_4px_rgba(212,175,55,0.9)]" />

          {/* Al-Hajar al-Aswad — Black Stone glow */}
          <circle cx="0" cy="65" r="2.5" fill="#fef08a" className="animate-ping" style={{ animationDuration: "3s" }} />
          <circle cx="0" cy="65" r="1.8" fill="var(--color-gold, #d4af37)" />
        </g>
      </svg>
    </div>
  );
}
