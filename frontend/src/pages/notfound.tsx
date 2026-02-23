import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function FloatingParticles({ count = 12 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-foreground/10 animate-pulse"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function GlitchyNumber({ children }: { children: string }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`text-[8rem] sm:text-[10rem] font-bold leading-none select-none transition-all duration-100 ${
        glitching
          ? "text-destructive [text-shadow:_2px_2px_0_var(--color-destructive),_-2px_-2px_0_var(--color-chart-2)] tracking-[-0.15em] blur-[1px]"
          : "text-foreground tracking-[-0.05em]"
      }`}
    >
      {children}
    </span>
  );
}

function FloatingPaths() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="path-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${20 + i * 50} ${250 - i * 40} Q ${120 + i * 60} ${80 + i * 30} ${320 - i * 40} ${220 - i * 20}`}
          fill="none"
          stroke="url(#path-grad)"
          strokeWidth="0.8"
          className="animate-pulse"
          style={{ animationDelay: `${i * 0.7}s`, animationDuration: "5s" }}
        />
      ))}
    </svg>
  );
}

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div
      className={`relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden px-4 transition-opacity duration-700 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      <FloatingParticles />
      <FloatingPaths />

      <div className="relative z-10 flex flex-col items-center text-center">
        <GlitchyNumber>404</GlitchyNumber>

        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent blur-xl" />
          <h2 className="relative text-2xl sm:text-3xl font-semibold tracking-tight">
            Lost in Space
          </h2>
        </div>

        <p className="text-muted-foreground mb-10 max-w-md text-sm sm:text-base leading-relaxed">
          The page you're looking for has drifted into the void. 
          Maybe it never existed, or it just took a wrong turn.
        </p>

        <Link
          to="/"
          className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_-4px_var(--color-primary)] active:scale-95"
        >
          <span className="relative z-10">Take Me Home</span>
          <svg
            className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>
    </div>
  );
}
