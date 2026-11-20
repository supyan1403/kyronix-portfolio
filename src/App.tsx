import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { Lang, LangCtx, useLang } from "./langCtx";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import Lenis from "lenis";
import type { MotionValue } from "motion/react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  AnimatePresence,
} from "motion/react";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Cpu,
  Database,
  Download,
  FileText,
  Folder,
  FolderOpen,
  GraduationCap,
  Mail,
  MapPin,
  Radio,
  Layers,
  Lightbulb,
  Compass,
  X,
} from "lucide-react";
/* brand full-color icons — simple-icons + local asseticon via react-icons/si (Draw.io kept via si) */
import {
  SiArduino,
  SiDiagramsdotnet,
  SiEspressif,
  SiGit,
  SiGithub,
  SiNodedotjs,
  SiTailwindcss,
  SiVercel,
} from "react-icons/si";
import { lazy, Suspense } from "react";
const DashboardEmbed = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.DashboardEmbed })),
);

/* ---------- Utility: Warm Dark palette tokens ---------- */
const WARM = {
  cream: "#1A1816",
  creamDeep: "#252220",
  surface: "#252220",
  ink: "#F5EFE6",
  muted: "#A8A298",
  border: "#3A3632",
  terracotta: "#C4713C",
  sage: "#8FA89B",
  sageDeep: "#6B8A7A",
  violet: "#7c3aed",
  retroYellow: "#E07A5F",
  retroPink: "#E07A5F",
  offwhite: "#F5EFE6",
  steel: "#A8A298",
  navyDark: "#1A1816",
  navySurface: "#252220",
  neonLime: "#E07A5F",
  coral: "#E07A5F",
} as const;
const RETRO = WARM as unknown as typeof WARM;

/* ---------- ChipPixel ---------- */
function ChipPixel({
  size = 24,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
    >
      <rect x={6.5} y={6.5} width={11} height={11} rx={0} />
      <rect x={9.7} y={9.7} width={4.6} height={4.6} rx={0} />
      <path d="M9 6.5V4.2M12 6.5V3.6M15 6.5V4.2" />
      <path d="M9 17.5V19.8M12 17.5V20.4M15 17.5V19.8" />
      <path d="M6.5 9H4.2M6.5 12H3.6M6.5 15H4.2" />
      <path d="M17.5 9H19.8M17.5 12H20.4M17.5 15H19.8" />
    </svg>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;

/* --- Hero KYRONIX "sketch": ukur advance per huruf pakai canvas (font Anton) --- */
const HERO_FONT_STACK = 'Anton, Impact, "Arial Black", sans-serif';
let heroMeasureCtx: CanvasRenderingContext2D | null = null;
function measureHeroTitle(text: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const rootFs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  // sama dengan text-[clamp(4.2rem,17.5vw,13rem)]
  const fs = Math.min(Math.max(4.2 * rootFs, 0.175 * window.innerWidth), 13 * rootFs);
  if (!heroMeasureCtx) heroMeasureCtx = document.createElement("canvas").getContext("2d");
  if (!heroMeasureCtx) return null;
  heroMeasureCtx.font = `400 ${fs}px ${HERO_FONT_STACK}`;
  const gap = 0.085 * fs;
  const advances: number[] = [];
  let width = 0;
  for (let i = 0; i < text.length; i += 1) {
    const w = heroMeasureCtx.measureText(text[i]).width;
    advances.push(w);
    width += w + (i < text.length - 1 ? gap : 0);
  }
  return { fs, gap, advances, width };
}

let lenisInstance: Lenis | null = null;

function useIsMobile() {
  const [v, setV] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        window.matchMedia("(max-width: 768px)").matches ||
        window.matchMedia("(pointer: coarse)").matches
      );
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const upd = () => setV(mq.matches || window.matchMedia("(pointer: coarse)").matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);
  return v;
}

function useIsLowEnd() {
  const [v, setV] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const dm = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
      const cores = navigator.hardwareConcurrency ?? 8;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const low = (typeof dm === "number" ? dm <= 4 : false) || cores <= 4;
      return coarse && low;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      const dm = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
      const cores = navigator.hardwareConcurrency ?? 8;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const low = (typeof dm === "number" ? dm <= 4 : false) || cores <= 4;
      setV(coarse && low);
    } catch {
      setV(false);
    }
  }, []);
  return v;
}

function useInViewActive() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, active } as const;
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const isCentered = id === "projects" || id === "lab";
  if (lenisInstance) {
    if (isCentered) {
      const opening = el.querySelector("section") as HTMLElement | null;
      const target = opening ?? el;
      const h = target.offsetHeight || el.offsetHeight;
      const vh = window.innerHeight;
      const offset = -(vh / 2 - h / 2);
      lenisInstance.scrollTo(target, {
        offset,
        duration: 2.2,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      });
      return;
    }
    lenisInstance.scrollTo(el, {
      offset: 0,
      duration: 2.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
  } else {
    if (isCentered) el.scrollIntoView({ behavior: "smooth", block: "center" });
    else el.scrollIntoView({ behavior: "smooth" });
  }
}

/* ---------- Smooth scroll (Lenis) — desktop smooth, HP native 120Hz ---------- */
function useLenis(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      if (lenisInstance) {
        lenisInstance.destroy();
        lenisInstance = null;
      }
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      try {
        delete (window as unknown as Record<string, unknown>).__lenis;
      } catch {
        (window as unknown as Record<string, unknown>).__lenis = null;
      }
      return;
    }
    const isCoarse =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 768px)").matches;
    if (isCoarse) {
      // HP: tanpa Lenis — scroll native (fling 120Hz di compositor) dan scrollToId pakai
      // scrollIntoView bawaan. Instance Lenis di coarse bikin tombol/nav tidak jalan karena
      // rAF-nya cuma hidup saat ada event scroll, jadi lenis.scrollTo() tidak pernah dianimasikan.
      if (lenisInstance) {
        lenisInstance.destroy();
        lenisInstance = null;
      }
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      try {
        delete (window as unknown as Record<string, unknown>).__lenis;
      } catch {
        (window as unknown as Record<string, unknown>).__lenis = null;
      }
      return;
    }
    const dm = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency ?? 8;
    const isLow = (typeof dm === "number" ? dm <= 4 : false) || cores <= 4;
    const lenis = new Lenis({
      duration: isLow ? 1.0 : 1.15,
      wheelMultiplier: 0.95,
      smoothWheel: true,
      smoothTouch: false,
      gestureOrientation: "vertical",
      easing: (t: number) => 1 - Math.pow(1 - t, 2.8),
    });
    lenisInstance = lenis;
    (window as unknown as Record<string, unknown>).__lenis = lenis;
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisInstance = null;
      try {
        delete (window as unknown as Record<string, unknown>).__lenis;
      } catch {
        (window as unknown as Record<string, unknown>).__lenis = null;
      }
    };
  }, [enabled]);
}

/* ---------- Micro-interactions ---------- */
function GlowCursor() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 180, damping: 26, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 180, damping: 26, mass: 0.35 });
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX - 110);
      y.set(e.clientY - 110);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[5] hidden h-[220px] w-[220px] rounded-full md:block"
      style={{
        x: sx,
        y: sy,
        background:
          "radial-gradient(circle, rgba(224,122,95,0.045), rgba(143,168,155,0.035) 38%, transparent 68%)",
      }}
    />
  );
}

/* ---------- Micro-interactions: Retro chunky button (Magnetic) ---------- */
function Magnetic({
  children,
  href,
  onClick,
  variant = "primary",
  external,
}: {
  children: ReactNode;
  href: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  external?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 30, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 280, damping: 30, mass: 0.35 });
  return (
    <motion.a
      ref={ref}
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.12);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.12);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      style={{ x: sx, y: sy }}
      className={`warm-btn ${variant}`}
    >
      {children}
    </motion.a>
  );
}

/* ---------- Text reveal: split-word mask up + reverse replay (amount:0.45, amount:0) ---------- */
function SplitReveal({
  text,
  className = "",
  delay = 0,
  play,
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  delay?: number;
  play?: boolean;
  as?: "h1" | "h2" | "h3";
}) {
  const low = useIsLowEnd();
  const words = text.split(" ");
  const MotionTag = motion[Tag];
  const onceMode = play === undefined;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      {...(onceMode
        ? { whileInView: "show", viewport: { amount: 0.45, margin: "0px 0px -10% 0px" } }
        : { animate: play ? "show" : "hidden" })}
      transition={{ staggerChildren: 0.07, delayChildren: delay }}
    >
      {words.map((w, i) => (
        <span className="mask-line" key={i}>
          <motion.span
            className="inline-block"
            variants={
              low
                ? ({
                    hidden: { y: "14px", opacity: 0 },
                    show: { y: 0, opacity: 1 },
                  } as unknown as Record<string, unknown>)
                : ({
                    hidden: { y: "115%", opacity: 0, filter: "blur(6px)" },
                    show: { y: 0, opacity: 1, filter: "blur(0px)" },
                  } as unknown as Record<string, unknown>)
            }
            transition={{ duration: 0.9, ease: EASE }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </MotionTag>
  );
}

/* Karakter slogan — ngetik satu-satu, hilang reverse saat scroll dari Hero */
function SloganChar({
  char,
  index,
  emph,
  ready,
  progress,
}: {
  char: string;
  index: number;
  emph: boolean;
  ready: boolean;
  progress: MotionValue<number>;
}) {
  // reverse: huruf paling kanan menghilang lebih dulu (1 = tampil, 0 = hilang)
  const outStart = 0.42 - index * 0.014;
  const outOpacity = useTransform(progress, [outStart - 0.02, outStart], [1, 0]);
  return (
    <motion.span
      className={emph ? "inline-block font-semibold text-terracotta" : "inline-block"}
      style={{ opacity: outOpacity } as unknown as Record<string, unknown>}
    >
      <motion.span
        className="inline-block"
        initial={{ opacity: 0 } as unknown as Record<string, unknown>}
        animate={
          ready
            ? ({ opacity: 1 } as unknown as Record<string, unknown>)
            : ({ opacity: 0 } as unknown as Record<string, unknown>)
        }
        transition={{ duration: 0.06, ease: "linear", delay: 0.7 + index * 0.055 }}
      >
        {char}
      </motion.span>
    </motion.span>
  );
}

function Eyebrow({ index, label }: { index: string; label: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ amount: 0.5, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease: EASE }}
      className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em]"
      style={{ color: WARM.muted }}
    >
      <ChipPixel size={14} className="text-terracotta/60" />
      {label}
    </motion.p>
  );
}

function Tag({
  children,
  tone = "yellow",
}: {
  children: ReactNode;
  tone?: "yellow" | "pink" | "violet" | "silver";
}) {
  const t = {
    yellow: "warm-tag yellow",
    pink: "warm-tag",
    violet: "warm-tag",
    silver: "warm-tag silver",
  }[tone];
  return (
    <span
      className={`inline-block rounded-[10px] border px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider ${t}`}
    >
      {children}
    </span>
  );
}

/* ---------- Kinetic band — tanpa BG solid 3× selang-seling (adaptive: scroll-linked desktop, CSS marquee low-end) ---------- */
function KineticBand({
  text,
  accent,
  reverse,
}: {
  text: string;
  accent?: string;
  reverse?: boolean;
}) {
  const low = useIsLowEnd();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rawX = useTransform(scrollYProgress, [0, 1], reverse ? ["-50%", "0%"] : ["0%", "-50%"]);
  const x = useSpring(rawX, { stiffness: 120, damping: 30, mass: 0.35 });
  // low-end: no 5× scroll listeners — pure CSS marquee (same look selang-seling via reverse direction)
  if (low) {
    return (
      <div className="overflow-hidden bg-transparent py-4 md:py-6" aria-hidden>
        <div
          className={`kinetic flex w-max items-center gap-12 whitespace-nowrap px-[4vw] font-display text-[clamp(2.2rem,5.8vw,4.4rem)] font-extrabold uppercase tracking-[0.06em] text-ink md:gap-16 marquee-track ${reverse ? "[animation-direction:reverse]" : ""}`}
          style={{ animationDuration: "28s" } as React.CSSProperties}
        >
          <span>{text}</span>
          <span className="text-terracotta">{accent ?? "//"}</span>
          <span>{text}</span>
          <span className="text-terracotta">{accent ?? "//"}</span>
          <span>{text}</span>
          <span className="text-terracotta">{accent ?? "//"}</span>
          <span>{text}</span>
          <span className="text-terracotta">{accent ?? "//"}</span>
          <span>{text}</span>
        </div>
      </div>
    );
  }
  return (
    <div ref={ref} className="overflow-hidden bg-transparent py-4 md:py-6" aria-hidden>
      <motion.div
        className="kinetic flex w-max items-center gap-12 whitespace-nowrap px-[4vw] font-display text-[clamp(2.2rem,5.8vw,4.4rem)] font-extrabold uppercase tracking-[0.06em] text-ink md:gap-16"
        style={{ x }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ amount: 0.2, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <span>{text}</span>
        <span className="text-terracotta">{accent ?? "//"}</span>
        <span>{text}</span>
        <span className="text-terracotta">{accent ?? "//"}</span>
        <span>{text}</span>
      </motion.div>
    </div>
  );
}

/* ---------- HUD ---------- */

/* ---------- Arcade "CONTINUE?" countdown ---------- */

/* ---------- Intro — Hybrid brutalist terminal typing (B) ---------- */
function Intro({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const finish = () => {
    // mount KPage di bawah Intro SEBELUM clip wipe — jangan buka overflow, biar stack tidak bocor saat Intro wipe
    onDone();
    setLeaving(true);
  };

  const LINES: { prompt: string; text: string }[] = [
    { prompt: "$", text: "whoami" },
    { prompt: ">", text: "supyan sauri — system architect" },
    { prompt: "$", text: "boot kyronix.my.id" },
  ];
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLineIdx(LINES.length);
      setDone(true);
      const t = setTimeout(finish, 400);
      return () => {
        clearTimeout(t);
        document.documentElement.style.overflow = "";
      };
    }
    if (done) {
      const t = setTimeout(finish, 550);
      return () => clearTimeout(t);
    }
    if (lineIdx >= LINES.length) {
      setDone(true);
      return;
    }
    const cur = LINES[lineIdx].text;
    if (charIdx < cur.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), 32);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        setLineIdx((i) => i + 1);
        setCharIdx(0);
      },
      lineIdx % 2 === 0 ? 220 : 380,
    );
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, done]);

  // ESC / click to skip — mount KPage dulu (onDone) biar stack tidak bocor saat Intro wipe
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDone();
        setLeaving(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!leaving && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-cream px-6"
          exit={{ clipPath: "inset(0 0 100% 0)", y: "-2%", filter: "blur(6px)", scale: 1.01 }}
          transition={{ duration: 0.72, ease: EASE }}
          onClick={() => {
            onDone();
            setLeaving(true);
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-45deg, transparent 0 14px, rgba(232,17,45,0.5) 14px 16px)",
            }}
          />
          <p className="absolute left-6 top-6 font-mono text-xs uppercase tracking-[0.3em] text-muted">
            FRAME 001 / BOOTING — SUPYAN SAURI
          </p>
          <div className="relative w-[min(560px,92vw)] border border-border bg-surface p-5 shadow-[0_8px_32px_rgba(28,25,23,0.06)] md:p-7">
            <div className="absolute -right-2 -top-2 bg-terracotta px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
              BOOTING
            </div>
            <div className="mb-3 flex gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-terracotta" />
              <i className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
              <i className="h-2.5 w-2.5 rounded-full bg-terracotta" />
            </div>
            <div className="space-y-1.5 font-mono text-sm leading-6">
              {LINES.slice(0, lineIdx + 1).map((ln, i) => {
                const isActive = i === lineIdx && !done;
                const visible = i < lineIdx ? ln.text : isActive ? ln.text.slice(0, charIdx) : "";
                const isPrompt = ln.prompt === "$";
                return (
                  <p key={i} className={isPrompt ? "text-muted" : "text-ink"}>
                    <span className={isPrompt ? "mr-2 text-terracotta" : "mr-2 text-terracotta"}>
                      {ln.prompt}
                    </span>
                    <span>{visible}</span>
                    {isActive && (
                      <span className="ml-[2px] inline-block h-[1.15em] w-[8px] translate-y-[3px] bg-terracotta animate-pulse" />
                    )}
                  </p>
                );
              })}
              {done && (
                <p className="text-muted">
                  <span className="mr-2 text-terracotta">$</span>
                  <span className="inline-block h-[1.15em] w-[8px] translate-y-[3px] bg-terracotta animate-pulse" />
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              <span
                className={`h-2 w-2 rounded-full ${done ? "bg-terracotta live-dot" : "bg-[#fbbf24] animate-pulse"}`}
              />
              {done ? (
                <span className="text-terracotta">ready — click or ESC to skip</span>
              ) : (
                <span>typing...</span>
              )}
            </div>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            SYSTEMS OVER SYNTAX
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- K — dedicated page after boot (K-PAGE2 3D copper, bg hitam) ---------- */
function KPage({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [pct, setPct] = useState(0);
  const lastPct = useRef(-1);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 110, damping: 18, mass: 0.45 });
  const smy = useSpring(my, { stiffness: 110, damping: 18, mass: 0.45 });
  const rx = useTransform(smy, [-1, 1], [11, -11]);
  const ry = useTransform(smx, [-1, 1], [-10, 10]);
  const kx = useTransform(smx, [-1, 1], [-22, 22]);
  const ky = useTransform(smy, [-1, 1], [-14, 14]);
  const glowX = useTransform(smx, [-1, 1], [34, -34]);
  const glowY = useTransform(smy, [-1, 1], [24, -24]);
  const glowOpacity = useTransform(
    [smx, smy],
    ([x, y]: number[]) => 0.55 + Math.min(0.45, (Math.abs(x) + Math.abs(y)) * 0.22),
  );
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    lenisInstance?.stop();

    let cancelled = false;
    let raf = 0;
    let finished = false;
    let assetsReady = false;
    const timers: number[] = [];

    const markDone = () => {
      if (finished || cancelled) return;
      finished = true;
      setPct(100);
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setLeaving(true);
        }, 420),
      );
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      assetsReady = true;
      markDone();
    } else {
      // tahan di 92% sampai K + font siap, biar % jujur (tidak bohong 100% sebelum render)
      Promise.all([
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = "/kyronix-k-hex.webp";
        }),
        document.fonts?.ready ?? Promise.resolve(),
        // pastikan Anton siap sebelum Hero mengukur lebar huruf (sketch SVG)
        document.fonts?.load?.("400 100px Anton").catch(() => {}) ?? Promise.resolve(),
      ]).then(() => {
        assetsReady = true;
      });

      const DUR = 4000;
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled || finished) return;
        const t = Math.min(1, (now - start) / DUR);
        // ease-out: naik cepat di awal, melambat menjelang akhir biar terasa disengaja
        const eased = (1 - Math.pow(1 - t, 2.4)) * 100;
        const next = Math.min(eased, assetsReady ? 100 : 92);
        // throttle: re-render cuma saat angka bulat berubah (bukan tiap frame)
        const rounded = Math.round(next);
        if (rounded !== lastPct.current) {
          lastPct.current = rounded;
          setPct(rounded);
        }
        if (t >= 1) {
          if (assetsReady) {
            markDone();
            return;
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  const handleExitComplete = () => {
    document.documentElement.style.overflow = "";
    lenisInstance?.start();
    requestAnimationFrame(() => lenisInstance?.resize());
    onDone();
  };
  const onPointer = (clientX: number, clientY: number, rect: DOMRect) => {
    mx.set(((clientX - rect.left) / rect.width - 0.5) * 2);
    my.set(((clientY - rect.top) / rect.height - 0.5) * 2);
  };
  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {!leaving && (
        <motion.div
          className="fixed inset-0 z-[150] flex flex-col items-center justify-center overflow-hidden bg-black px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.85, ease: EASE }}
          onMouseMove={(e) =>
            onPointer(
              e.clientX,
              e.clientY,
              (e.currentTarget as HTMLElement).getBoundingClientRect(),
            )
          }
          onMouseLeave={() => {
            mx.set(0);
            my.set(0);
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (!t) return;
            onPointer(
              t.clientX,
              t.clientY,
              (e.currentTarget as HTMLElement).getBoundingClientRect(),
            );
          }}
          onTouchEnd={() => {
            mx.set(0);
            my.set(0);
          }}
        >
          {/* frame 0 hitam solid — fade in, bukan pop */}
          <div aria-hidden className="absolute inset-0 bg-black" />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 bg-terracotta/14 blur-[80px] max-sm:h-[380px] max-sm:w-[380px] max-sm:blur-[56px]"
            style={
              { x: glowX, y: glowY, opacity: glowOpacity } as unknown as Record<string, unknown>
            }
            initial={{ scale: 0.82 }}
            animate={{ scale: 1 }}
            exit={
              { opacity: 0, scale: 0.92, filter: "blur(8px)" } as unknown as Record<string, unknown>
            }
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          />
          <motion.div
            className="relative flex items-center justify-center will-change-transform"
            style={{ perspective: 900 } as unknown as Record<string, unknown>}
          >
            <motion.img
              src="/kyronix-k-hex.webp"
              alt="KYRONIX K"
              width={1024}
              height={1024}
              loading="eager"
              decoding="async"
              draggable={false}
              className="relative h-[min(52dvh,460px)] w-auto max-w-[min(86vw,620px)] select-none will-change-transform object-contain max-sm:h-[min(48dvh,360px)] max-sm:max-w-[88vw]"
              style={
                { rotateX: rx, rotateY: ry, x: kx, y: ky } as unknown as Record<string, unknown>
              }
              initial={{ opacity: 0, scale: 0.72, rotateX: 16, rotateY: -14, filter: "blur(14px)" }}
              animate={
                {
                  opacity: 1,
                  scale: 1,
                  rotateX: 0,
                  rotateY: 0,
                  filter: "blur(0px)",
                } as unknown as Record<string, unknown>
              }
              exit={
                { opacity: 0, scale: 0.86, filter: "blur(8px)" } as unknown as Record<
                  string,
                  unknown
                >
              }
              transition={
                {
                  type: "spring",
                  stiffness: 165,
                  damping: 17,
                  mass: 1.2,
                  delay: 0.25,
                } as unknown as Record<string, unknown>
              }
            />
            {/* sweep ngikut siluet K hex */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={
                {
                  WebkitMaskImage: "url(/kyronix-k-hex.webp)",
                  maskImage: "url(/kyronix-k-hex.webp)",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  filter: "blur(0.5px)",
                } as React.CSSProperties
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 1, 0] } as unknown as Record<string, unknown>}
              exit={{ opacity: 0 } as unknown as Record<string, unknown>}
              transition={
                {
                  duration: 4.3,
                  times: [0, 0.1, 0.16, 0.94, 1],
                  ease: "easeInOut",
                } as unknown as Record<string, unknown>
              }
            >
              <motion.div
                className="absolute inset-y-0 w-[60%] bg-gradient-to-r from-transparent via-[#FFDDBE]/50 to-transparent"
                initial={{ x: "-115%" }}
                animate={{ x: "215%" }}
                transition={{ duration: 3, delay: 0.95, ease: [0.45, 0, 0.55, 1] }}
                style={{ transform: "skewX(-18deg)" }}
              />
            </motion.div>
          </motion.div>
          <motion.div
            className="pointer-events-none absolute bottom-[6%] left-1/2 w-[min(300px,74vw)] -translate-x-1/2 max-sm:bottom-[5%]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 } as unknown as Record<string, unknown>}
            transition={{ delay: 0.35, duration: 0.5, ease: EASE }}
          >
            <div className="mb-2 flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.28em]">
              <span className="text-white/35">kyronix</span>
              <span className="tabular-nums font-bold text-white/80">{Math.round(pct)}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Memuat KYRONIX"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
              className="relative h-[2px] w-full overflow-hidden bg-white/12"
            >
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 bg-terracotta"
                style={{ width: `${pct}%` }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Nav ---------- */
const links = [
  { id: "profile", label: { id: "KYRONIX LAB", en: "KYRONIX LAB" } },
  { id: "stack", label: { id: "Stack", en: "Stack" } },
  { id: "projects", label: { id: "Proyek", en: "Projects" } },
  { id: "experience", label: { id: "Pengalaman", en: "Experience" } },
  { id: "lab", label: { id: "Cara Kerja", en: "How I Work" } },
  { id: "contact", label: { id: "Kontak", en: "Contact" } },
];

function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex rounded-xl border border-white/15 bg-surface p-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] transition-all sm:px-3.5 sm:py-1.5 sm:text-xs sm:tracking-[0.14em] ${lang === l ? "bg-terracotta font-sans text-white shadow-sm" : "bg-white/[0.08] font-mono text-ink hover:bg-white/15"}`}
        >
          {l === "id" ? "ID" : "EN"}
        </button>
      ))}
    </div>
  );
}

function Nav({ ready }: { ready: boolean }) {
  const { lang } = useLang();
  const [activeId, setActiveId] = useState("top");
  // chip ID/EN: di mobile sembunyi saat scroll turun supaya tidak menimpa kartu
  const [langHidden, setLangHidden] = useState(false);
  useEffect(() => {
    const ids = ["top", ...links.map((l) => l.id)];
    const pick = () => {
      const vh = window.innerHeight;
      const bandTop = vh * 0.45;
      const bandBottom = vh * 0.58;
      let best = "top";
      let bestMid: number | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const mid = (r.top + r.bottom) / 2;
        const inBand = r.top <= bandBottom && r.bottom >= bandTop;
        if (inBand) {
          const d = Math.abs(mid - vh / 2);
          if (bestMid === null || d < bestMid) {
            bestMid = d;
            best = id;
          }
        }
      }
      if (bestMid !== null) {
        setActiveId(best);
        return;
      }
      let b = "top";
      let bd = Infinity;
      const cy = vh / 2;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const mid = (r.top + r.bottom) / 2;
        const d = Math.abs(mid - cy);
        if (d < bd) {
          bd = d;
          b = id;
        }
      }
      setActiveId(b);
    };
    let raf = 0;
    let lastY = window.scrollY;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        pick();
        const y = window.scrollY;
        // chip ID/EN kembali muncul saat di atas atau saat scroll naik
        if (y < 96 || y < lastY - 6) setLangHidden(false);
        else if (y > lastY + 6) setLangHidden(true);
        lastY = y;
      });
    };
    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", pick);
    };
  }, []);
  const dots = [
    { id: "top", label: "SUPYAN SAURI", active: true },
    ...links.map((l) => ({ id: l.id, label: l.label[lang], active: false })),
  ];
  // last dot (contact) highlight as hire
  return (
    <>
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-terracotta focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      {/* desktop: vertical right-6 center — pixel square dots */}
      <nav
        aria-label="Section navigation"
        className="fixed right-6 top-1/2 z-[90] hidden -translate-y-1/2 flex-col items-center gap-3.5 opacity-[0.78] transition-opacity duration-300 hover:opacity-100 md:flex"
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-border/60" />
        {dots.map((d, i) => {
          const isActive = activeId === d.id;
          return (
            <button
              key={d.id}
              onClick={() => scrollToId(d.id)}
              aria-label={d.label}
              aria-current={isActive ? "true" : undefined}
              className="group relative flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              <span
                className={`relative block border bg-cream transition-colors ${
                  isActive
                    ? `h-3 w-3 rounded-full border-terracotta bg-terracotta group-hover:bg-terracotta group-hover:border-terracotta shadow-[0_0_10px_rgba(224,122,95,0.35)]`
                    : `h-2.5 w-2.5 rounded-full border-border group-hover:border-terracotta group-hover:bg-terracotta`
                }`}
              />
              <span className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 whitespace-nowrap border border-border/20 bg-cream px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink opacity-0 transition-opacity group-hover:opacity-100 md:block">
                {d.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* mobile: horizontal bottom center — pixel square dots */}
      <nav
        aria-label="Section navigation"
        className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-[90] flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1.5 opacity-[0.72] transition-opacity hover:opacity-100 active:opacity-100 md:hidden"
      >
        <div className="pointer-events-none absolute inset-x-3 top-1/2 h-[2px] -translate-y-1/2 bg-border/60" />
        {dots.map((d, i) => {
          const isActive = activeId === d.id;
          return (
            <button
              key={d.id}
              onClick={() => scrollToId(d.id)}
              aria-label={d.label}
              aria-current={isActive ? "true" : undefined}
              className="relative flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              <span
                className={`relative block border bg-border/80 transition-colors ${
                  isActive
                    ? `h-3.5 w-3.5 rounded-full border-terracotta bg-terracotta active:bg-terracotta active:border-terracotta`
                    : `h-3 w-3 rounded-full border-border/40 active:border-terracotta active:bg-terracotta`
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* lang switch - always visible, napas dari pinggir */}
      <div
        className={`fixed right-3 top-3 z-[90] flex transition-all duration-300 md:right-6 md:top-4 ${
          langHidden ? "max-md:pointer-events-none max-md:-translate-y-16 max-md:opacity-0" : ""
        }`}
      >
        <LangSwitch />
      </div>
    </>
  );
}

/* ---------- Hero: mask reveal elegant (Option A) ---------- */
function SlamLine({
  text,
  delay,
  outline,
  x,
  shadow,
  Tag,
  play,
}: {
  text: string;
  delay: number;
  outline?: boolean;
  x: MotionValue<string>;
  shadow: MotionValue<string>;
  Tag: "h1" | "h2";
  play: boolean;
}) {
  const MotionTag = motion[Tag];
  return (
    <MotionTag
      aria-label={text}
      style={{ x, textShadow: shadow }}
      className={`font-display flex overflow-visible py-3 text-[clamp(4rem,13vw,10.5rem)] leading-[0.85] tracking-[0.02em] ${
        outline ? "text-outline" : ""
      }`}
    >
      <span className="mask-line overflow-hidden py-2">
        <motion.span
          aria-hidden
          className="inline-block py-1"
          initial={{ y: "115%", scale: 0.96, rotate: 1 }}
          animate={play ? { y: "0%", scale: 1, rotate: 0 } : {}}
          transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1], delay }}
        >
          {text}
        </motion.span>
      </span>
    </MotionTag>
  );
}

/* ---------- Hero 3D: stacked brutalist cubes (CSS 3D, no Three.js) ---------- */
function Hero3D({
  ready,
  mx,
  my,
}: {
  ready: boolean;
  mx: MotionValue<number>;
  my: MotionValue<number>;
}) {
  const rx = useTransform(my, (v) => 16 + v * -8);
  const ry = useTransform(mx, (v) => -26 + v * 10);
  const z1 = useTransform(mx, (v) => 20 + v * 6);
  const z2 = useTransform(mx, (v) => 20 + v * -4);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: 6 }}
      animate={ready ? { opacity: 1, scale: 1, rotate: 0 } : {}}
      transition={{ duration: 0.7, ease: EASE, delay: 1.15 }}
      className="relative hidden aspect-square w-full max-w-[480px] select-none items-center justify-center lg:flex"
      style={{ perspective: 1200 } as React.CSSProperties}
    >
      <motion.div
        className="relative h-[360px] w-[360px]"
        style={
          { transformStyle: "preserve-3d", rotateX: rx, rotateY: ry } as unknown as Record<
            string,
            unknown
          >
        }
      >
        {/* shadow ground */}
        <div className="absolute left-1/2 top-[68%] h-[120px] w-[220px] -translate-x-1/2 rounded-[50%] bg-black/60 blur-[18px]" />
        {/* cube 1 - lime bottom */}
        <motion.div
          className="absolute left-[18%] top-[38%] h-[160px] w-[160px] rounded-[20px] border border-border bg-surface shadow-[0_8px_24px_rgba(28,25,23,0.08)]"
          style={{ transformStyle: "preserve-3d", z: z1 } as unknown as Record<string, unknown>}
        >
          <div className="absolute inset-0 bg-[radial-gradient(rgba(5,5,5,0.12)_1.2px,transparent_1.6px)] [background-size:7px_7px]" />
          <span className="absolute right-2 top-2 font-mono text-[10px] font-bold tracking-[0.14em] text-muted/70">
            01
          </span>
          <span className="absolute bottom-2 left-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            STACK
          </span>
          <span
            className="absolute inset-0 hidden hidden hidden border border-border bg-surface"
            style={{ transform: "translateZ(-18px)" } as React.CSSProperties}
          />
          <span
            className="absolute left-0 top-0 h-[18px] w-full -translate-y-full bg-terracotta border border-border"
            style={
              {
                transform: "rotateX(90deg) translateZ(0)",
                transformOrigin: "bottom",
              } as React.CSSProperties
            }
          />
        </motion.div>
        {/* cube 2 - coral mid */}
        <motion.div
          className="absolute left-[42%] top-[22%] h-[150px] w-[150px] rounded-[20px] border border-border bg-surface shadow-[0_8px_24px_rgba(28,25,23,0.08)]"
          style={{ transformStyle: "preserve-3d", z: z2 } as unknown as Record<string, unknown>}
        >
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.18)_1.2px,transparent_1.6px)] [background-size:7px_7px]" />
          <span className="absolute right-2 top-2 font-mono text-[10px] font-bold tracking-[0.14em] text-ink/80">
            02
          </span>
          <span className="absolute bottom-2 left-2 font-display text-[18px] leading-none tracking-wide text-ink">
            LAB
          </span>
          <span
            className="absolute inset-0 hidden hidden hidden border border-border bg-surface"
            style={{ transform: "translateZ(-16px)" } as React.CSSProperties}
          />
          <span
            className="absolute left-0 top-0 h-[18px] w-full -translate-y-full bg-terracotta border border-border"
            style={
              {
                transform: "rotateX(90deg) translateZ(0)",
                transformOrigin: "bottom",
              } as React.CSSProperties
            }
          />
        </motion.div>
        {/* cube 3 - snow top small */}
        <div
          className="absolute left-[58%] top-[12%] h-[92px] w-[92px] rounded-[20px] border border-border bg-surface shadow-[0_8px_24px_rgba(28,25,23,0.08)]"
          style={
            { transform: "translateZ(48px) rotateX(14deg) rotateY(-18deg)" } as React.CSSProperties
          }
        >
          <span className="absolute inset-0 bg-[radial-gradient(rgba(5,5,5,0.1)_1.1px,transparent_1.5px)] [background-size:6px_6px]" />
          <span className="absolute bottom-1.5 left-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
            DATA
          </span>
          <span
            className="absolute left-0 top-0 h-[12px] w-full -translate-y-full bg-cream-deep border border-border"
            style={
              {
                transform: "rotateX(90deg) translateZ(0)",
                transformOrigin: "bottom",
              } as React.CSSProperties
            }
          />
        </div>
        {/* floating dots */}
        <motion.span
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[8%] top-[54%] h-2 w-2 rounded-full bg-terracotta border border-border"
        />
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="absolute left-[12%] top-[18%] h-2 w-2 rounded-full bg-terracotta border border-border"
        />
      </motion.div>
    </motion.div>
  );
}

/* ---------- Holographic Core — Procedural A refined (gap clean, pure circle) ---------- */
function HoloCore({
  ready,
  mx,
  my,
}: {
  ready: boolean;
  mx: MotionValue<number>;
  my: MotionValue<number>;
}) {
  const rx = useTransform(my, (v) => -10 + v * -8);
  const ry = useTransform(mx, (v) => 12 + v * 10);
  const rz = useTransform(mx, (v) => v * 5);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, rotate: -4 }}
      animate={ready ? { opacity: 1, scale: 1, rotate: 0 } : {}}
      transition={{ duration: 0.9, ease: EASE, delay: 0.95 }}
      className="relative flex h-[160px] w-[160px] items-center justify-center select-none lg:h-[170px] lg:w-[170px]"
      style={{ perspective: 900 } as React.CSSProperties}
    >
      <motion.div
        className="relative h-[150px] w-[150px] lg:h-[160px] lg:w-[160px]"
        style={
          {
            transformStyle: "preserve-3d",
            rotateX: rx,
            rotateY: ry,
            rotateZ: rz,
          } as unknown as Record<string, unknown>
        }
      >
        {/* soft ground shadow */}
        <div className="absolute left-1/2 top-[72%] h-[48px] w-[90px] -translate-x-1/2 rounded-[50%] bg-black/35 blur-[10px]" />
        {/* ring 1 — outer 1.5px */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[124px] w-[124px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-terracotta/28 lg:h-[132px] lg:w-[132px]"
          style={
            {
              transform: "translate(-50%,-50%) rotateX(74deg)",
              boxShadow: "0 0 12px rgba(247,255,60,0.16), inset 0 0 10px rgba(224,122,95,0.08)",
            } as React.CSSProperties
          }
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[106px] w-[106px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-violet/28 lg:h-[114px] lg:w-[114px]"
          style={
            {
              transform: "translate(-50%,-50%) rotateY(68deg) rotateX(12deg)",
              boxShadow: "0 0 10px rgba(232,17,45,0.16), inset 0 0 8px rgba(232,17,45,0.08)",
            } as React.CSSProperties
          }
        />
        {/* ring 2 — dashed thinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border/14 lg:h-[100px] lg:w-[100px]"
          style={
            {
              transform: "translate(-50%,-50%) rotateX(58deg) rotateZ(20deg)",
            } as React.CSSProperties
          }
        />
        {/* core — pure circle 62px, no square border */}
        <div
          className="absolute left-1/2 top-1/2 h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-[radial-gradient(circle_at_35%_30%,#E07A5F_0%,#E7E5E4_42%,#2a0a14_72%,#0a1628_100%)] shadow-[0_0_14px_rgba(232,17,45,0.35),0_0_22px_rgba(124,58,237,0.22)] lg:h-[62px] lg:w-[62px]"
          style={{ transform: "translate(-50%,-50%) translateZ(14px)" } as React.CSSProperties}
        >
          <span className="absolute inset-[14%] rounded-full border border-border bg-white/8 blur-[1px]" />
          <span className="absolute left-[22%] top-[18%] h-[10px] w-[10px] rounded-full bg-white/80 blur-[0.5px]" />
        </div>
        {/* orbiting dots smaller */}
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[124px] w-[124px] -translate-x-1/2 -translate-y-1/2 lg:h-[132px] lg:w-[132px]"
          style={{ transform: "translate(-50%,-50%) rotateX(74deg)" } as React.CSSProperties}
        >
          <i className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-surface shadow-[0_0_8px_rgba(224,122,95,0.25)]" />
        </motion.span>
        <motion.span
          animate={{ rotate: -360 }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[106px] w-[106px] -translate-x-1/2 -translate-y-1/2 lg:h-[114px] lg:w-[114px]"
          style={{ transform: "translate(-50%,-50%) rotateY(68deg)" } as React.CSSProperties}
        >
          <i className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-surface shadow-[0_0_8px_rgba(224,122,95,0.25)]" />
        </motion.span>
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[160px] w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-lime/10 to-transparent blur-[0.5px]"
          style={{ transform: "translate(-50%,-50%) translateZ(-18px)" } as React.CSSProperties}
        />
      </motion.div>
    </motion.div>
  );
}

/* ---------- i18n — ID / EN ---------- */
const dict = {
  id: {
    nav: {
      profile: "LAB",
      stack: "Stack",
      projects: "Proyek",
      experience: "Pengalaman",
      lab: "Cara Kerja",
      contact: "Kontak",
    },
    hero: {
      hi: "Halo, saya Supyan Sauri",
      ctaPrimary: "Hubungi Saya",
      ctaSecondary: "Jelajahi Hasil",
      tagline: "DARI IDE KE INFRA.",
      desc: "Sebagai seorang system architect yang mengandalkan perangkat modern, cara saya memadukan proses penelitian, pemodelan sistem, dan pengembangan web untuk mewujudkan gagasan menjadi solusi fungsional yang terstruktur.",
    },
    profile: {
      eyebrow: "DI BALIK KYRONIX",
      title: "HALO, SAYA SUPYAN SAURI",
      name: "Supyan Sauri",
      role: "System Architect – Data & Web Systems",
      bio: "Memiliki ketertarikan tinggi terhadap proses pembelajaran mendalam serta eksplorasi teknologi baru. Melalui pemodelan sistem yang terstruktur dan pengembangan web secara berkelanjutan, cara saya menterjemahkan berbagai gagasan kompleks menjadi solusi yang fungsional dan andal",
      ctaPrimary: "MASUK LAB",
      ctaSecondary: "HUBUNGI SAYA",
      ctaDashboard: "LIHAT AKTIVITAS",
    },
    stackEyebrow: "Ekosistem Kerja",
    stackTitle: "PERANGKAT YANG SAYA ANDALKAN.",
    stackSubtitle:
      "Berbagai perangkat dan teknologi pilihan yang diandalkan dalam mendukung cara saya mengeksplorasi setiap gagasan.",
    projectsEyebrow: "Karya Terpilih",
    projectsTitle: "IDE YANG MENJADI KARYA.",
    projectsSubtitle:
      "Kumpulan konsep, tahap pengerjaan, dan hasil akhir yang merefleksikan cara saya menerjemahkan gagasan menjadi solusi.",
    experience: {
      eyebrow: "Rekam Jejak",
      title: "PERJALANAN SAYA SEJAUH INI.",
      subtitle:
        "Rekam jejak langkah dan proses yang saya jalani sejauh ini untuk terus berkembang secara berkelanjutan.",
      viewCert: "Lihat Sertifikat",
      download: "Unduh",
      showDetail: "Lihat Detail ↓",
      hideDetail: "Tutup ↑",
    },
    labEyebrow: "Cara Kerja",
    labTitle: "CARA SAYA BEKERJA.",
    labDesc:
      "Memahami masalah secara presisi, merancang solusi yang andal, dan memastikan eksekusi yang berdampak nyata.",
    labSteps: [
      {
        title: "Pahami",
        desc: "Mendengarkan kebutuhan secara mendalam dan memetakan alur sistem sebelum memulai proses perancangan.",
        tags: ["ARSITEKTUR SISTEM", "ALUR SISTEM"],
      },
      {
        title: "Rakit",
        desc: "Mengorkestrasi perangkat modern dan kecerdasan buatan untuk merakit sistem yang fungsional secara terstruktur.",
        tags: ["OTOMASI PYTHON", "ROUTER API"],
      },
      {
        title: "Jalankan",
        desc: "Meluncurkan sistem ke lingkungan produksi, memantau performa, dan memastikan seluruh fungsi berjalan optimal.",
        tags: ["PIPELINE ETL", "POSTGRESQL", "KYRONIX.MY.ID"],
      },
    ],
    contactEyebrow: "Kontak",
    contactTitle: "HUBUNGI SAYA",
    contactDesc: "Terbuka untuk kolaborasi di bidang data engineering dan riset.",
    contactForm: {
      name: "Nama",
      email: "Email",
      subject: "Subjek (opsional)",
      phone: "No HP (opsional)",
      message: "Pesan",
      send: "Kirim Pesan",
      sending: "Mengirim…",
      success: "Terkirim! Saya akan balas via email.",
      error: "Gagal kirim. Coba lagi atau email langsung.",
      namePh: "",
      emailPh: "",
      subjectPh: "",
      phonePh: "",
      messagePh: "",
    },
    backToTop: "Kembali ke atas ↑",
    downloadCv: "Unduh CV",
    bands: {
      behindKyronix: "DI BALIK KYRONIX",
      capabilities: "KAPABILITAS",
      selectedWork: "DARI IDE JADI NYATA",
      experience: "PENGALAMAN",
      howIBuild: "CARA KERJA",
      letsBuild: "HUBUNGI SAYA",
    },
    watermarks: {
      lab: "LAB",
      stack: "STACK",
      karya: "KARYA",
      jejak: "JEJAK",
      cara: "CARA",
      kontak: "KONTAK",
    },
    folders: {
      all: "Semua",
      research: "Penelitian",
      iot: "IoT Project",
      webapp: "Pengembangan Web",
    },
    projectModal: {
      title: "Belum Tersedia",
      body: "Belum di-deploy. Tautan demo akan aktif setelah rilis.",
      inProgressBody:
        "Masih dalam pengerjaan — prototype & integrasi berjalan. Tautan demo akan aktif setelah pengembangan selesai.",
      conceptBody:
        "Masih tahap konsep — belum ada demo. Hubungi saya untuk diskusi konsep & roadmap.",
      articleTitle: "Artikel Riset Tersedia",
      articleBody:
        "Ini adalah riset, bukan demo web. Dokumen lengkap tersedia sebagai PDF — baca langsung atau unduh untuk offline.",
      conceptLabel: "KONSEP",
      conceptInitialLabel: "KONSEP AWAL",
      cta: "Hubungi saya untuk preview",
      articleCta: "Hubungi saya untuk diskusi",
      readArticle: "Baca Artikel",
      download: "Unduh PDF",
      close: "Tutup",
    },
    viewer: {
      certificate: "Sertifikat — KYRONIX",
      article: "Artikel — KYRONIX",
      openInNewTab: "Buka di Tab Baru",
      hintFailed: "Preview diblokir Chrome — pakai Buka di Tab Baru di header.",
      hintMobile: "Mobile tidak preview? Pakai Buka di Tab Baru di header.",
      loading: "Memuat PDF…",
      blocked: "Preview diblokir — buka tab baru di bawah.",
      openPdf: "Buka PDF ↗",
    },
  },
  en: {
    nav: {
      profile: "LAB",
      stack: "Stack",
      projects: "Projects",
      experience: "Experience",
      lab: "How I Work",
      contact: "Contact",
    },
    hero: {
      hi: "Hey — I'm Supyan Sauri",
      ctaPrimary: "Contact Me",
      ctaSecondary: "Explore Builds",
      tagline: "FROM IDEA TO INFRA.",
      desc: "As a system architect leveraging modern tools, the way I combine research, system modeling, and web development to turn ideas into structured, functional solutions.",
    },
    profile: {
      eyebrow: "BEHIND KYRONIX",
      title: "HI, I AM SUPYAN SAURI",
      name: "Supyan Sauri",
      role: "System Architect – Data & Web Systems",
      bio: "Highly interested in deep learning processes and exploration of new technologies. Through structured system modeling and continuous web development, the way I translate various complex ideas into functional and reliable solutions",
      ctaPrimary: "Enter Lab",
      ctaSecondary: "Contact Me",
      ctaDashboard: "VIEW ACTIVITY",
    },
    stackEyebrow: "Work Ecosystem",
    stackTitle: "MY TRUSTED TOOLKIT.",
    stackSubtitle: "A curated set of tools and technologies I rely on to explore every idea.",
    projectsEyebrow: "Selected Works",
    projectsTitle: "IDEAS INTO WORKS.",
    projectsSubtitle:
      "A collection of concepts, build phases, and final outcomes reflecting how I turn ideas into solutions.",
    experience: {
      eyebrow: "Track Record",
      title: "MY JOURNEY SO FAR.",
      subtitle: "A record of steps and processes I've taken so far to keep growing sustainably.",
      viewCert: "View Certificate",
      download: "Download",
      showDetail: "View Detail ↓",
      hideDetail: "Hide ↑",
    },
    labEyebrow: "How I Work",
    labTitle: "HOW I WORK.",
    labDesc:
      "Understanding problems precisely, designing reliable solutions, and ensuring execution delivers real impact.",
    labSteps: [
      {
        title: "Understand",
        desc: "Listening deeply to the needs and mapping the system flow before starting the design process.",
        tags: ["SYSTEM ARCHITECTURE", "SYSTEM FLOWS"],
      },
      {
        title: "Assemble",
        desc: "Orchestrating modern tooling and AI to assemble a functional system in a structured way.",
        tags: ["PYTHON AUTOMATION", "API ROUTERS"],
      },
      {
        title: "Run",
        desc: "Launching the system into production, monitoring performance, and ensuring every function runs optimally.",
        tags: ["ETL PIPELINES", "POSTGRESQL", "KYRONIX.MY.ID"],
      },
    ],
    contactEyebrow: "Contact",
    contactTitle: "GET IN TOUCH",
    contactDesc: "Open to collaboration in data engineering and research.",
    contactForm: {
      name: "Name",
      email: "Email",
      subject: "Subject (optional)",
      phone: "Phone (optional)",
      message: "Message",
      send: "Send Message",
      sending: "Sending…",
      success: "Sent! I'll reply via email.",
      error: "Failed to send. Try again or email directly.",
      namePh: "",
      emailPh: "",
      subjectPh: "",
      phonePh: "",
      messagePh: "",
    },
    backToTop: "Back to top ↑",
    downloadCv: "Download CV",
    bands: {
      behindKyronix: "BEHIND KYRONIX",
      capabilities: "CAPABILITIES",
      selectedWork: "SELECTED WORK",
      experience: "EXPERIENCE",
      howIBuild: "HOW I WORK",
      letsBuild: "GET IN TOUCH",
    },
    watermarks: {
      lab: "LAB",
      stack: "STACK",
      karya: "WORK",
      jejak: "TRACE",
      cara: "HOW",
      kontak: "CONTACT",
    },
    folders: {
      all: "All",
      research: "Research",
      iot: "IoT Project",
      webapp: "Pengembangan Web",
    },
    projectModal: {
      title: "Project Not Yet Available",
      body: "This project isn't deployed yet. The live link will be available after release.",
      inProgressBody:
        "Still in progress — prototype & integration ongoing. The live link will be available after development is complete.",
      conceptBody:
        "Still at concept stage — no demo yet. Contact me to discuss the concept & roadmap.",
      articleTitle: "Research Article Available",
      articleBody:
        "This is a research project, not a web demo. The full paper is available as PDF — read inline or download for offline.",
      conceptLabel: "CONCEPT",
      conceptInitialLabel: "INITIAL CONCEPT",
      cta: "Contact me for a preview",
      articleCta: "Contact me to discuss",
      readArticle: "Read Article",
      download: "Download PDF",
      close: "Close",
    },
    viewer: {
      certificate: "Certificate — KYRONIX",
      article: "Article — KYRONIX",
      openInNewTab: "Open in New Tab",
      hintFailed: "Preview blocked by Chrome — use Open in New Tab in the header.",
      hintMobile: "No preview on mobile? Use Open in New Tab in the header.",
      loading: "Loading PDF…",
      blocked: "Preview blocked — open in a new tab below.",
      openPdf: "Open PDF ↗",
    },
  },
} as const;

/* ---------- 1. Hero — Warm Dark Center + epic KYRONIX 3D block tembaga persis K ---------- */
function Hero({ ready }: { ready: boolean }) {
  const { lang } = useLang();
  const t2 = dict[lang];
  const ref = useRef<HTMLElement>(null);
  const low = useIsLowEnd();
  const isMobile = useIsMobile();
  const light = isMobile;
  const FULL = "KYRONIX";
  const [metrics, setMetrics] = useState(() => measureHeroTitle(FULL));
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    const update = () => setMetrics(measureHeroTitle(FULL));
    update();
    window.addEventListener("resize", update);
    const fonts = document.fonts;
    fonts
      ?.load?.("400 100px Anton")
      .then(update)
      .catch(() => {});
    fonts?.ready.then(update).catch(() => {});
    return () => window.removeEventListener("resize", update);
  }, [FULL]);
  // tilt 3D persis KPage — HP = laptop (onTouch + onMouse)
  const heroMx = useMotionValue(0);
  const heroMy = useMotionValue(0);
  const heroRx = useTransform(heroMy, [-1, 1], [5, -5]);
  const heroRy = useTransform(heroMx, [-1, 1], [-6, 6]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // spring halus — desktop saja; mobile/low native scroll tanpa spring biar 120hz mulus
  const smooth = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    mass: 0.22,
    restDelta: 0.001,
  });
  const heroY = useTransform(smooth, [0, 1], [0, light || low ? 0 : -96]);
  const heroOpacity = useTransform(smooth, [0, 0.55], [1, light || low ? 1 : 0]);
  const heroScale = useTransform(smooth, [0, 1], [1, light || low ? 1 : 0.96]);
  const gridY = useTransform(smooth, [0, 1], [0, light || low ? 0 : -16]);
  const taglineY = useTransform(smooth, [0, 1], [0, 0]);
  // reverse sketcher: tiap huruf KYRONIX hilang dengan urutan kebalikan dari masuk (X duluan, K terakhir)
  const kyOut0 = useTransform(smooth, [0.44, 0.6], [1, 0]);
  const kyOut1 = useTransform(smooth, [0.38, 0.54], [1, 0]);
  const kyOut2 = useTransform(smooth, [0.32, 0.48], [1, 0]);
  const kyOut3 = useTransform(smooth, [0.26, 0.42], [1, 0]);
  const kyOut4 = useTransform(smooth, [0.2, 0.36], [1, 0]);
  const kyOut5 = useTransform(smooth, [0.14, 0.3], [1, 0]);
  const kyOut6 = useTransform(smooth, [0.08, 0.24], [1, 0]);
  const kyOut = [kyOut0, kyOut1, kyOut2, kyOut3, kyOut4, kyOut5, kyOut6] as const;
  // watermark: keluar ke samping seperti kinetic band saat halaman di-scroll
  const wmRightX = useTransform(smooth, [0, 0.85], [0, light ? 160 : 320]);
  const wmLeftX = useTransform(smooth, [0, 0.85], [0, light ? -160 : -320]);
  const wmFade = useTransform(smooth, [0, 0.6], [1, 0]);
  const slogan = t2.hero.tagline;
  const emphFrom = slogan.indexOf("INFRA.");
  const sloganWords = slogan.split(" ");
  return (
    <section
      id="top"
      ref={ref}
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-x-clip bg-transparent pt-24 sm:pt-28"
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        heroMx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
        heroMy.set(((e.clientY - r.top) / r.height - 0.5) * 2);
      }}
      onMouseLeave={() => {
        heroMx.set(0);
        heroMy.set(0);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (!t) return;
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        heroMx.set(((t.clientX - r.left) / r.width - 0.5) * 2);
        heroMy.set(((t.clientY - r.top) / r.height - 0.5) * 2);
      }}
      onTouchEnd={() => {
        heroMx.set(0);
        heroMy.set(0);
      }}
    >
      {/* Hero: Blueprint Grid 32px — keep, K circuit ganti watermark diagonal */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[1]"
        style={
          {
            y: gridY,
            backgroundImage:
              "linear-gradient(to right, rgba(224,122,95,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(224,122,95,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          } as unknown as Record<string, unknown>
        }
      />
      {/* Watermark KYRONIX horizontal — masuk saat Hero muncul, keluar ke samping saat scroll */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        <div className="absolute right-0 top-[3%] translate-x-[30%] max-sm:top-[1%]">
          <motion.div
            style={{ x: wmRightX, opacity: wmFade } as unknown as Record<string, unknown>}
          >
            <motion.span
              className="hero-watermark block whitespace-nowrap text-[28vw] leading-none max-sm:text-[36vw]"
              initial={{ opacity: 0, x: light ? 90 : 260 }}
              animate={
                ready
                  ? ({ opacity: 0.11, x: 0 } as unknown as Record<string, unknown>)
                  : ({} as unknown as Record<string, unknown>)
              }
              transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1], delay: 0.34 }}
            >
              KYRONIX
            </motion.span>
          </motion.div>
        </div>
        <div className="absolute bottom-[3%] left-0 -translate-x-[70%] max-sm:bottom-[1%]">
          <motion.div style={{ x: wmLeftX, opacity: wmFade } as unknown as Record<string, unknown>}>
            <motion.span
              className="hero-watermark block whitespace-nowrap text-[28vw] leading-none max-sm:text-[36vw]"
              initial={{ opacity: 0, x: light ? -90 : -260 }}
              animate={
                ready
                  ? ({ opacity: 0.11, x: 0 } as unknown as Record<string, unknown>)
                  : ({} as unknown as Record<string, unknown>)
              }
              transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1], delay: 0.44 }}
            >
              KYRONIX
            </motion.span>
          </motion.div>
        </div>
      </div>
      {/* corner brackets blueprint — keep */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[24px] top-[88px] h-[22px] w-[22px] border-l-[1.5px] border-t-[1.5px] border-terracotta/20 max-sm:left-[16px] max-sm:top-[84px] max-sm:h-[18px] max-sm:w-[18px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[24px] top-[88px] h-[22px] w-[22px] border-r-[1.5px] border-t-[1.5px] border-terracotta/20 max-sm:right-[16px] max-sm:top-[84px] max-sm:h-[18px] max-sm:w-[18px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[24px] left-[24px] h-[22px] w-[22px] border-b-[1.5px] border-l-[1.5px] border-terracotta/20 max-sm:bottom-[16px] max-sm:left-[16px] max-sm:h-[18px] max-sm:w-[18px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[24px] right-[24px] h-[22px] w-[22px] border-b-[1.5px] border-r-[1.5px] border-terracotta/20 max-sm:bottom-[16px] max-sm:right-[16px] max-sm:h-[18px] max-sm:w-[18px]"
      />
      <motion.div
        className="relative z-20 mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-center justify-center gap-5 px-[6vw] pb-16 pt-6 sm:gap-6 sm:px-[5vw] md:px-[4vw] lg:items-start lg:gap-6 lg:text-left"
        style={
          light
            ? ({ opacity: heroOpacity } as unknown as Record<string, unknown>)
            : ({ y: heroY, opacity: heroOpacity, scale: heroScale } as unknown as Record<
                string,
                unknown
              >)
        }
        initial={
          light
            ? ({ opacity: 0 } as unknown as Record<string, unknown>)
            : low
              ? ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
              : ({ opacity: 0, filter: "blur(10px)" } as unknown as Record<string, unknown>)
        }
        animate={
          light
            ? ({ opacity: 1 } as unknown as Record<string, unknown>)
            : low
              ? ready
                ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                : ({} as unknown as Record<string, unknown>)
              : ready
                ? ({ opacity: 1, filter: "blur(0px)" } as unknown as Record<string, unknown>)
                : ({} as unknown as Record<string, unknown>)
        }
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
      >
        {/* KYRONIX — outline digambar seperti sketcher (SVG stroke draw) */}
        <motion.div
          aria-label={FULL}
          role="img"
          className="relative select-none will-change-transform"
          style={
            {
              perspective: 800,
              transformStyle: "preserve-3d",
              rotateX: heroRx,
              rotateY: heroRy,
              transform: "translateZ(0)",
            } as unknown as Record<string, unknown>
          }
        >
          <span className="sr-only">{FULL}</span>
          {metrics ? (
            <svg
              width={metrics.width}
              height={Math.round(metrics.fs * 0.95)}
              viewBox={`0 0 ${metrics.width} ${Math.round(metrics.fs * 0.95)}`}
              aria-hidden="true"
              className="block max-w-full overflow-visible"
            >
              {(() => {
                const CHUNKS = light || low ? 5 : 8;
                const SEG = light || low ? 660 : 420;
                const baseY = metrics.fs * 0.78;
                let x = 0;
                return FULL.split("").map((ch, i) => {
                  const t0 = 0.08 + i * (light ? 0.05 : 0.07);
                  const slotStep = light ? 0.17 : 0.15;
                  // urutan acak tapi deterministik (biar tidak berubah tiap render)
                  let s = (i + 1) * 7919;
                  const rnd = () => {
                    s = (s * 9301 + 49297) % 233280;
                    return s / 233280;
                  };
                  const order = Array.from({ length: CHUNKS }, (_, k) => k);
                  for (let k = order.length - 1; k > 0; k -= 1) {
                    const j = Math.floor(rnd() * (k + 1));
                    const tmp = order[k];
                    order[k] = order[j];
                    order[j] = tmp;
                  }
                  const letterEnd = t0 + CHUNKS * slotStep + 0.38;
                  const node = (
                    <motion.g
                      key={ch + i}
                      style={{ opacity: kyOut[i] } as unknown as Record<string, unknown>}
                    >
                      {/* potongan outline muncul acak — digambar per segmen */}
                      {order.map((segIdx, slot) => {
                        const delay = t0 + slot * slotStep;
                        const start = -segIdx * SEG;
                        return (
                          <motion.text
                            key={segIdx}
                            x={x}
                            y={baseY}
                            fontSize={metrics.fs}
                            className="hero-sketch sketch-scrawl"
                            style={
                              { strokeDasharray: `${SEG} 5200` } as unknown as React.CSSProperties
                            }
                            initial={
                              { strokeDashoffset: start, opacity: 0 } as unknown as Record<
                                string,
                                unknown
                              >
                            }
                            animate={
                              ready && !reduceMotion
                                ? ({
                                    strokeDashoffset: start + 22,
                                    opacity: [0, 1, 1, 0],
                                  } as unknown as Record<string, unknown>)
                                : ({} as unknown as Record<string, unknown>)
                            }
                            transition={
                              {
                                duration: Math.max(0.25, letterEnd - delay),
                                times: [0, 0.12, 0.86, 1],
                                delay,
                                ease: "linear",
                              } as unknown as Record<string, unknown>
                            }
                          >
                            {ch}
                          </motion.text>
                        );
                      })}
                      {/* outline final — menegaskan bentuk setelah semua segmen */}
                      <motion.text
                        x={x}
                        y={baseY}
                        fontSize={metrics.fs}
                        className="hero-sketch"
                        initial={
                          {
                            opacity: reduceMotion ? 1 : 0,
                            fillOpacity: reduceMotion ? 1 : 0,
                          } as unknown as Record<string, unknown>
                        }
                        animate={
                          ready
                            ? ({ opacity: 1, fillOpacity: 1 } as unknown as Record<string, unknown>)
                            : ({} as unknown as Record<string, unknown>)
                        }
                        transition={
                          {
                            opacity: { duration: 0.34, ease: EASE, delay: letterEnd - 0.22 },
                            fillOpacity: { duration: 0.55, ease: EASE, delay: letterEnd + 0.06 },
                          } as unknown as Record<string, unknown>
                        }
                      >
                        {ch}
                      </motion.text>
                    </motion.g>
                  );
                  x += metrics.advances[i] + metrics.gap;
                  return node;
                });
              })()}
            </svg>
          ) : null}
        </motion.div>
        {/* bawah KYRONIX — single kolom kiri (tanpa split) */}
        <div className="flex w-full max-w-[640px] flex-col gap-5 lg:mx-0 lg:items-start lg:text-left">
          <motion.p
            className="max-w-[24ch] text-balance font-sans text-[clamp(1.1rem,2.6vw,1.45rem)] leading-relaxed tracking-[0.08em] text-muted sm:max-w-none lg:text-left"
            style={{ y: taglineY } as unknown as Record<string, unknown>}
          >
            {sloganWords.map((word, wi) => {
              const start = sloganWords.slice(0, wi).reduce((a, w) => a + w.length + 1, 0);
              return (
                <span key={wi}>
                  <span className="inline-block whitespace-nowrap">
                    {Array.from(word).map((ch, ci) => (
                      <SloganChar
                        key={ci}
                        char={ch}
                        index={start + ci}
                        emph={start + ci >= emphFrom}
                        ready={ready}
                        progress={smooth}
                      />
                    ))}
                  </span>
                  {wi < sloganWords.length - 1 ? " " : null}
                </span>
              );
            })}
          </motion.p>
        </div>
        <motion.button
          aria-label="Scroll"
          onClick={() => scrollToId("stack")}
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ delay: 1.25, duration: 0.6 }}
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted hover:text-ink md:flex"
        >
          <span>Scroll</span>
          <span className="h-7 w-px bg-border">
            <motion.i
              className="block h-3 w-px bg-terracotta"
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </motion.button>
      </motion.div>
    </section>
  );
}

/* ---------- 1.5 Profile — Kyronix Lab (cyber-sleek lab, dark + neon oranye, no colon, no project) ---------- */
function Profile() {
  const { lang } = useLang();
  const t = dict[lang].profile as (typeof dict)["id"]["profile"] & { ctaDashboard?: string };
  const isId = lang === "id";
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const gridY = useTransform(scrollYProgress, [0, 1], [22, -22]);
  const titleY = useTransform(scrollYProgress, [0, 1], [14, -14]);
  const inView = useInView(ref, { amount: 0.35, margin: "0px 0px -12% 0px" });
  const rows = [
    {
      k: "Asal",
      kEn: "Based",
      Icon: MapPin,
      v: "Tasikmalaya, Jawa Barat, Indonesia",
      vEn: "Tasikmalaya, West Java, Indonesia",
    },
    {
      k: "Fokus",
      kEn: "Focus",
      Icon: Layers,
      v: "Pengelolaan Data, Pemodelan Sistem, & Pengembangan Web",
      vEn: "Data Management, System Modeling & Web Development",
    },
    {
      k: "Pendekatan",
      kEn: "Approach",
      Icon: Compass,
      v: "Selalu antusias belajar berbagai hal baru, menikmati proses belajar yang mendalam, dan menerjemahkan gagasan kompleks menjadi solusi yang fungsional",
      vEn: "Always enthusiastic to explore new things, enjoying deep learning and translating complex ideas into functional solutions",
    },
    {
      k: "Eksplorasi",
      kEn: "Exploration",
      Icon: Lightbulb,
      v: "Aktif memperluas wawasan melalui pengembangan web secara mandiri dan berkelanjutan",
      vEn: "Actively expanding horizons through independent and continuous web development",
    },
  ];
  const goDashboard = () => scrollToId("activity");
  return (
    <section
      ref={ref}
      id="profile"
      className="relative flex min-h-[100dvh] items-center overflow-visible bg-transparent px-[5vw] py-[12vh]"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={
          {
            y: gridY,
            backgroundImage:
              "linear-gradient(to right, rgba(224,122,95,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(224,122,95,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          } as unknown as Record<string, unknown>
        }
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-[10%] top-[18%] h-[520px] w-[520px] bg-terracotta/10 blur-[80px] will-change-transform max-sm:hidden"
        style={{ y: titleY } as unknown as Record<string, unknown>}
      />
      {/* LAB watermark dipindah ke seam Profil ↔ Aktivitas (Activity) */}
      {/* lab scan line neon */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[5vw] right-[5vw] top-[8%] h-px bg-gradient-to-r from-transparent via-terracotta/25 to-transparent"
        style={{ y: titleY } as unknown as Record<string, unknown>}
      />
      <div className="relative mx-auto w-full max-w-[1120px]">
        <div className="grid gap-8 md:grid-cols-12 md:gap-10 md:items-start">
          <motion.div
            style={{ y: titleY } as unknown as Record<string, unknown>}
            className="flex flex-col gap-5 md:col-span-7 will-change-transform"
          >
            <Eyebrow index="" label={t.eyebrow} />
            <SplitReveal
              key={t.title}
              play={inView}
              text={t.title}
              className="font-display text-[clamp(2.4rem,6.2vw,5rem)] font-extrabold leading-[0.88] tracking-[0.01em] text-ink"
            />
            <motion.p
              initial={{ opacity: 0, y: 10 } as unknown as Record<string, unknown>}
              animate={
                inView
                  ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                  : ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
              }
              transition={{ duration: 0.6, ease: EASE, delay: inView ? 0.44 : 0.04 }}
              className="font-mono text-xs uppercase tracking-[0.18em] text-terracotta"
            >
              {t.role}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 } as unknown as Record<string, unknown>}
              animate={
                inView
                  ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                  : ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
              }
              transition={{ duration: 0.6, ease: EASE, delay: inView ? 0.5 : 0.02 }}
              className="max-w-[52ch] font-sans text-[15px] leading-relaxed text-muted"
            >
              {t.bio}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 } as unknown as Record<string, unknown>}
              animate={
                inView
                  ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                  : ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
              }
              transition={{ duration: 0.6, ease: EASE, delay: inView ? 0.58 : 0 }}
              className="flex flex-wrap gap-3 pt-2"
            >
              <Magnetic href="#activity" variant="primary" onClick={goDashboard}>
                {(t as unknown as { ctaDashboard: string }).ctaDashboard || t.ctaPrimary}{" "}
                <ArrowUpRight size={16} />
              </Magnetic>
              <Magnetic href="#contact" variant="ghost" onClick={() => scrollToId("contact")}>
                {t.ctaSecondary} <Mail size={16} />
              </Magnetic>
            </motion.div>
          </motion.div>
          <div
            style={{ y: titleY } as unknown as Record<string, unknown>}
            className="flex flex-col gap-3 will-change-transform md:col-span-5 md:pl-2"
          >
            {/* System-spec layout — Origin / Fokus stack / Pendekatan+Eksplorasi */}
            {/* Origin */}
            <motion.div
              initial={{ opacity: 0, y: 10 } as unknown as Record<string, unknown>}
              animate={
                inView
                  ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                  : ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
              }
              transition={{ duration: 0.6, ease: EASE, delay: inView ? 0.36 : 0.04 }}
              className="warm-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
                    <MapPin size={12} strokeWidth={1.9} />{" "}
                    {isId ? "BASE NODE / ORIGIN" : "BASE NODE / ORIGIN"}
                  </p>
                  <p className="mt-2 font-sans text-[12.5px] font-bold uppercase leading-[1.4] tracking-[0.03em] text-ink">
                    {(isId ? rows[0].v : rows[0].vEn).toUpperCase()}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                    <span>COORDS -7.32° S, 108.22° E</span>
                    <span>TIMEZONE WIB (UTC+07:00)</span>
                  </div>
                </div>
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center border border-terracotta/30 bg-terracotta/10 text-terracotta">
                  <span className="h-2 w-2 rounded-full bg-terracotta live-dot" />
                </span>
              </div>
            </motion.div>
            {/* Fokus stack */}
            <motion.div
              initial={{ opacity: 0, y: 10 } as unknown as Record<string, unknown>}
              animate={
                inView
                  ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                  : ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
              }
              transition={{ duration: 0.6, ease: EASE, delay: inView ? 0.45 : 0.04 }}
              className="warm-card p-4"
            >
              <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
                <Layers size={12} strokeWidth={1.9} /> {isId ? "FOKUS SISTEM" : "SYSTEM FOCUS"}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="border border-border/15 bg-cream/5 px-2 py-2.5 text-center">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink">
                    {isId ? "Pengelolaan Data" : "Data Management"}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                    ETL & Validation
                  </p>
                </div>
                <div className="border border-terracotta/40 bg-terracotta/15 px-2 py-2.5 text-center">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink">
                    {isId ? "Pemodelan Sistem" : "System Modeling"}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                    Relational / Graph
                  </p>
                </div>
                <div className="border border-border/15 bg-cream/5 px-2 py-2.5 text-center">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink">
                    {isId ? "Pengembangan Web" : "Web Development"}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                    Reactive Core
                  </p>
                </div>
              </div>
            </motion.div>
            {/* Pendekatan + Eksplorasi — 2 col */}
            <div className="grid gap-3 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 10 } as unknown as Record<string, unknown>}
                animate={
                  inView
                    ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                    : ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
                }
                transition={{ duration: 0.6, ease: EASE, delay: inView ? 0.54 : 0.04 }}
                className="warm-card flex flex-col p-4"
              >
                <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
                  <Compass size={12} strokeWidth={1.9} /> {isId ? "PENDEKATAN" : "APPROACH"}
                </p>
                <p className="mt-2 font-sans text-[12px] leading-relaxed text-muted">
                  {isId ? rows[2].v : rows[2].vEn}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 } as unknown as Record<string, unknown>}
                animate={
                  inView
                    ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                    : ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
                }
                transition={{ duration: 0.6, ease: EASE, delay: inView ? 0.62 : 0.04 }}
                className="warm-card flex flex-col p-4"
              >
                <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
                  <Lightbulb size={12} strokeWidth={1.9} /> {isId ? "EKSPLORASI" : "EXPLORATION"}
                </p>
                <p className="mt-2 font-sans text-[12px] leading-relaxed text-muted">
                  {isId ? rows[3].v : rows[3].vEn}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Activity() {
  const { lang } = useLang();
  const secRef = useRef<HTMLElement>(null);
  // ringankan: 1 MotionValue aja untuk blur, reveal pakai whileInView (tanpa 8 useTransform bareng)
  const { scrollYProgress } = useScroll({ target: secRef, offset: ["start end", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 1], [8, -8]);
  const actGridY = useSpring(raw, { stiffness: 140, damping: 30, mass: 0.3 });
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as unknown as React.RefObject<Element>, {
    amount: 0.1,
    margin: "0px 0px -12% 0px",
  });
  return (
    <section
      ref={secRef}
      id="activity"
      className="relative overflow-visible bg-transparent px-[5vw] py-10"
    >
      {/* satu-satunya LAB watermark — duduk di seam Profil ↔ Aktivitas */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[22vw] font-black leading-none tracking-[0.02em] watermark will-change-transform max-sm:text-[30vw]"
        style={{ y: actGridY, opacity: 0.11 } as unknown as Record<string, unknown>}
      >
        {dict[lang].watermarks.lab}
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-[8%] bottom-[-6%] h-[420px] w-[420px] bg-terracotta/10 blur-[48px] will-change-transform max-sm:hidden"
        style={{ y: actGridY } as unknown as Record<string, unknown>}
      />
      <motion.div
        ref={ref as unknown as React.RefObject<HTMLDivElement>}
        initial={{ opacity: 0, y: 14 } as unknown as Record<string, unknown>}
        animate={
          inView
            ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
            : ({ opacity: 0, y: 14 } as unknown as Record<string, unknown>)
        }
        transition={{ duration: 0.6, ease: EASE }}
        className="relative mx-auto w-full max-w-[1120px] will-change-transform"
      >
        <Suspense
          fallback={<div className="min-h-[320px] animate-pulse rounded-2xl bg-cream-deep/40" />}
        >
          <DashboardEmbed lazy />
        </Suspense>
      </motion.div>
    </section>
  );
}

/* ---------- 2. Tech stack — MY SYSTEM TOOLKIT (Gallery: folder + full-color brand icons, HANYA APLIKASI REAL) ---------- */
type Tile = {
  label: string;
  Icon?: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  src?: string;
  brand?: boolean;
  color?: string;
};
const stackGallery: { id: string; title: Record<Lang, string>; tiles: Tile[] }[] = [
  {
    id: "bahasa",
    title: { id: "Bahasa", en: "Languages" },
    tiles: [
      { label: "PHP", src: "/icons/php.svg", brand: true, color: "#8892BF" },
      { label: "JavaScript", src: "/icons/javascript.svg", brand: true, color: "#F7DF1E" },
      { label: "Python", src: "/icons/python.svg", brand: true, color: "#3776AB" },
      { label: "TypeScript", src: "/icons/typescript.svg", brand: true, color: "#3178C6" },
      { label: "HTML", src: "/icons/html.svg", brand: true, color: "#E44D26" },
      { label: "CSS", src: "/icons/css.svg", brand: true, color: "#1172B8" },
    ],
  },
  {
    id: "desain",
    title: { id: "Desain", en: "Design" },
    tiles: [
      { label: "Figma", src: "/icons/figma.svg", brand: true, color: "#F24E1E" },
      { label: "Tailwind CSS", Icon: SiTailwindcss, brand: true, color: "#06B6D4" },
    ],
  },
  {
    id: "database",
    title: { id: "Database", en: "Database" },
    tiles: [
      { label: "PostgreSQL", src: "/icons/postgresql.svg", brand: true, color: "#336791" },
      { label: "MySQL", src: "/icons/mysql.svg", brand: true, color: "#00758F" },
      { label: "Supabase", src: "/icons/supabase.svg", brand: true, color: "#3ECF8E" },
    ],
  },
  {
    id: "rancangan",
    title: { id: "Rancangan Sistem & Diagram", en: "System Design & Diagrams" },
    tiles: [{ label: "Draw.io", Icon: SiDiagramsdotnet, brand: true, color: "#F08705" }],
  },
  {
    id: "tools",
    title: { id: "Tools & Workflow", en: "Tools & Workflow" },
    tiles: [
      { label: "VS Code", src: "/icons/vscode.svg", brand: true, color: "#007ACC" },
      { label: "Git", Icon: SiGit, brand: true, color: "#F05032" },
      { label: "GitHub", Icon: SiGithub, brand: true, color: "#F5EFE6" },
      { label: "OpenCode", src: "/icons/opencode.svg", brand: true },
      { label: "Node.js", Icon: SiNodedotjs, brand: true, color: "#339933" },
      { label: "Vercel", Icon: SiVercel, brand: true, color: "#F5EFE6" },
    ],
  },
  {
    id: "iot",
    title: { id: "IoT & Hardware", en: "IoT & Hardware" },
    tiles: [
      { label: "Arduino", Icon: SiArduino, brand: true, color: "#00979D" },
      { label: "ESP32", Icon: SiEspressif, brand: true, color: "#E7352C" },
    ],
  },
];

function Stack() {
  const { lang } = useLang();
  const t = dict[lang];
  const openingRef = useRef<HTMLElement>(null);
  const flatRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: openingProgress } = useScroll({
    target: openingRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: flatProgress } = useScroll({
    target: flatRef,
    offset: ["start end", "end start"],
  });
  const openingGridY = useTransform(openingProgress, [0, 1], [22, -22]);
  const openingTitleY = useTransform(openingProgress, [0, 1], [14, -14]);
  const stackInView = useInView(openingRef, { amount: 0.35, margin: "0px 0px -12% 0px" });
  const flatX = useTransform(flatProgress, [0, 1], [-12, 12]);
  const flatXRev = useTransform(flatProgress, [0, 1], [10, -10]);
  return (
    <section id="stack" className="relative bg-transparent overflow-x-clip">
      {/* Opening — full 100dvh text-only EPIC — enter+exit 1 blok */}
      <section
        ref={openingRef}
        className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-[5vw] py-[12vh]"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 select-none font-display text-[22vw] font-black leading-none tracking-[0.02em] watermark will-change-transform max-sm:text-[30vw]"
          style={{ y: openingTitleY, opacity: 0.11 } as unknown as Record<string, unknown>}
        >
          {t.watermarks.stack}
        </motion.div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[1]"
          style={
            {
              y: openingGridY,
              backgroundImage:
                "linear-gradient(to right, rgba(224,122,95,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(224,122,95,0.04) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            } as unknown as Record<string, unknown>
          }
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-[10%] top-[18%] h-[420px] w-[420px] bg-terracotta/10 blur-[60px] will-change-transform max-sm:hidden"
          style={{ y: openingTitleY } as unknown as Record<string, unknown>}
        />
        <div className="relative mx-auto max-w-[1120px] text-center">
          <motion.div
            style={{ y: openingTitleY } as unknown as Record<string, unknown>}
            className="will-change-transform"
          >
            <Eyebrow index="" label={t.stackEyebrow} />
            <SplitReveal
              key={t.stackTitle}
              play={stackInView}
              text={t.stackTitle}
              className="mx-auto max-w-4xl font-display text-[clamp(1.9rem,8.4vw,6.75rem)] font-extrabold leading-[0.95] tracking-[0.01em]"
            />
            <motion.p
              initial={{ opacity: 0, y: 10 } as unknown as Record<string, unknown>}
              animate={
                stackInView
                  ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                  : ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
              }
              transition={{ duration: 0.6, ease: EASE, delay: stackInView ? 0.55 : 0.22 }}
              className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed sm:text-base"
              style={{ color: WARM.muted }}
            >
              {(t as unknown as { stackSubtitle: string }).stackSubtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>
      {/* Flat — tanpa kartu, icon nempel langsung di bg-cream — fade horizontal + parallax */}
      <div ref={flatRef} className="relative px-[5vw] pb-[18vh]">
        <div className="relative mx-auto max-w-[1120px] space-y-12">
          {stackGallery.map((g, gi) => (
            <motion.div
              key={g.id}
              className="space-y-4 will-change-transform"
              style={{ x: gi % 2 === 0 ? flatX : flatXRev } as unknown as Record<string, unknown>}
            >
              <div className="flex items-baseline justify-between gap-3 border-b border-border/10 pb-3">
                <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">
                  {g.title[lang]}
                </span>
                <span className="shrink-0 font-mono text-[11px] tracking-widest text-muted">
                  {g.tiles.length} items
                </span>
              </div>
              <div
                className={`grid gap-5 ${g.tiles.length === 1 ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" : g.tiles.length <= 3 ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5" : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7"}`}
              >
                {g.tiles.map((tile, ti) => (
                  <motion.div
                    key={tile.label}
                    initial={{ opacity: 0, x: -12 } as unknown as Record<string, unknown>}
                    whileInView={{ opacity: 1, x: 0 } as unknown as Record<string, unknown>}
                    viewport={{ amount: 0.3, margin: "0px 0px -8% 0px" }}
                    transition={{ duration: 0.55, delay: ti * 0.06, ease: EASE }}
                    whileHover={{ y: -2 }}
                    className="flex flex-col items-center gap-2.5 text-center will-change-transform"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center">
                      {tile.src ? (
                        <img
                          src={tile.src}
                          alt=""
                          aria-hidden
                          width={36}
                          height={36}
                          className="h-9 w-9 object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : tile.Icon ? (
                        <tile.Icon
                          size={32}
                          style={
                            tile.color ? ({ color: tile.color } as React.CSSProperties) : undefined
                          }
                        />
                      ) : null}
                    </span>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] leading-tight text-ink">
                      {tile.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. Featured projects — Bento Featured ---------- */

const CATEGORY_META = {
  penelitian: {
    label: { id: "Penelitian", en: "Research" } as const,
    Icon: BarChart3,
    cls: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  iot: {
    label: { id: "IoT · Hardware", en: "IoT · Hardware" } as const,
    Icon: Cpu,
    cls: "border-[#C4713C]/30 bg-[#C4713C]/10 text-[#E8A07A]",
  },
  data: {
    label: { id: "Data Engineering", en: "Data Engineering" } as const,
    Icon: Database,
    cls: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  },
  web: {
    label: { id: "Aplikasi Web", en: "Web App" } as const,
    Icon: Layers,
    cls: "border-[#8FA89B]/30 bg-[#8FA89B]/15 text-[#8FA89B]",
  },
} as const;

function ProjectCard({
  p,
  idx,
  onOpen,
  compact,
  interactive = true,
}: {
  p: (typeof projects)[number];
  idx: number;
  onOpen: (pp: (typeof projects)[number]) => void;
  compact?: boolean;
  interactive?: boolean;
}) {
  void compact;
  const { lang } = useLang();
  const cat = (p as { category?: keyof typeof CATEGORY_META }).category
    ? CATEGORY_META[(p as { category: keyof typeof CATEGORY_META }).category]
    : null;
  const isPenelitian = cat !== null && (p as { category?: string }).category === "penelitian";
  const isDone = p.status === "RESEARCH DONE";
  const isLive = p.status === "LIVE NOW";
  // Penelitian selesai = hijau (tidak mungkin deploy), selain itu: LIVE hijau, DONE oranye, konsep netral
  const isDeployed = isLive || (isPenelitian && isDone);
  const isDoneNotDeployed = isDone && !isPenelitian;
  const borderColor = isDeployed ? "#22c55e" : isDoneNotDeployed ? "#f59e0b" : undefined;
  const catLabel = cat ? cat.label[lang] : null;
  const CatIcon = cat?.Icon;
  return (
    <motion.article
      role={interactive ? "button" : undefined}
      aria-hidden={interactive ? undefined : true}
      tabIndex={interactive ? 0 : -1}
      onClick={() => {
        if (interactive) onOpen(p);
      }}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(p);
        }
      }}
      initial={{ opacity: 0, y: 18 } as unknown as Record<string, unknown>}
      whileInView={{ opacity: 1, y: 0 } as unknown as Record<string, unknown>}
      viewport={{ amount: 0.22, margin: "0px 0px -12% 0px" }}
      transition={
        { duration: 0.62, ease: EASE, delay: idx * 0.08 } as unknown as Record<string, unknown>
      }
      whileHover={{ y: -4 } as unknown as Record<string, unknown>}
      whileTap={{ scale: 0.98 } as unknown as Record<string, unknown>}
      className={
        "warm-card relative flex h-full cursor-pointer flex-col overflow-hidden pb-5 will-change-transform p-5 md:min-h-[410px] md:p-6 " +
        (isDeployed ? "border-green-500/40" : isDoneNotDeployed ? "border-amber-500/35" : "")
      }
      style={{ borderColor } as React.CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-deep font-mono text-[11px] font-bold text-muted">
          {p.no}
        </span>
        {cat && CatIcon && catLabel ? (
          <span
            className={
              "inline-flex max-w-[56%] items-center gap-1.5 self-start rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest leading-none " +
              cat.cls
            }
            title={catLabel}
          >
            <CatIcon size={11} className="shrink-0" />
            <span className="truncate">{catLabel}</span>
          </span>
        ) : (
          <span className="warm-tag max-w-[56%] truncate font-mono text-[10px]">{p.status}</span>
        )}
      </div>
      <div className="min-w-0 flex flex-col">
        <p
          className="mt-2 mb-2 font-mono text-[11px] uppercase tracking-[0.18em]"
          style={{
            color: isDeployed ? "#22c55e" : isDoneNotDeployed ? "#f59e0b" : WARM.terracotta,
          }}
        >
          {p.status === "RESEARCH DONE" && !isPenelitian
            ? lang === "id"
              ? "SELESAI \u00b7 BELUM DEPLOY"
              : "DONE \u00b7 NOT DEPLOYED"
            : p.status === "RESEARCH DONE" && isPenelitian
              ? lang === "id"
                ? "SELESAI"
                : "COMPLETED"
              : p.status === "LIVE NOW"
                ? lang === "id"
                  ? "SELESAI"
                  : "COMPLETED"
                : p.status === "IN PROGRESS"
                  ? lang === "id"
                    ? "DALAM PENGERJAAN"
                    : "IN PROGRESS"
                  : p.status === "CONCEPT STAGE"
                    ? lang === "id"
                      ? "KONSEP"
                      : "CONCEPT"
                    : p.status}
        </p>
        <h3
          data-text={p.title}
          className="line-clamp-2 min-h-[2.3em] font-sans text-[1.25rem] font-semibold uppercase leading-[1.15] tracking-[0.05em] text-ink md:text-[1.38rem]"
        >
          {p.title}
        </h3>
        <p className="mt-2 text-[13px] leading-[1.6]" style={{ color: WARM.muted }}>
          {typeof p.desc === "string" ? p.desc : (p.desc as { id: string; en: string })[lang]}
        </p>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/10 pt-4">
        <div className="flex flex-1 flex-wrap gap-1.5 pr-2">
          {p.stack.map((s) => (
            <Tag
              key={s}
              tone={p.tone === "lime" ? "yellow" : p.tone === "coral" ? "pink" : "violet"}
            >
              {s}
            </Tag>
          ))}
        </div>
        <span
          className={
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border md:h-10 md:w-10 " +
            (isDeployed
              ? "border-green-500/30 bg-transparent text-green-500 hover:bg-green-500 hover:text-white hover:border-green-500"
              : isDoneNotDeployed
                ? "border-amber-500/30 bg-transparent text-amber-500 hover:bg-amber-500 hover:text-[#1A1816] hover:border-amber-500"
                : "border-terracotta/25 bg-transparent text-terracotta hover:bg-terracotta hover:text-white hover:border-terracotta")
          }
        >
          <ArrowUpRight size={16} />
        </span>
      </div>
    </motion.article>
  );
}
function ProjectStickyCard(p: {
  p: (typeof projects)[number];
  idx: number;
  progress: MotionValue<number>;
  onOpen: (pp: (typeof projects)[number]) => void;
}) {
  return <ProjectCard p={p.p} idx={p.idx} onOpen={p.onOpen} />;
}

/* ---------- 3. Featured projects — warm-tagd builds ---------- */
type ProjectFolder = "research" | "iot" | "webapp";
const projectMeta: Record<string, { folder: ProjectFolder; Icon: typeof BarChart3 }> = {
  "01": { folder: "research", Icon: BarChart3 },
  "02": { folder: "iot", Icon: Cpu },
  "03": { folder: "webapp", Icon: Database },
  "04": { folder: "webapp", Icon: Database },
};
const projects = [
  {
    no: "01",
    title: "Digital Twin Platform",
    kind: "Spatial Modeling · Research",
    category: "penelitian" as const,
    desc: {
      id: "Riset pemodelan spasial & Digital Twin untuk lahan pertanian 800m² memakai Kriging & Random Forest.",
      en: "Spatial modeling & Digital Twin research for 800m2 agricultural plot using Kriging & Random Forest.",
    } as const,
    concept: {
      id: "Pengembangan kerangka Digital Twin untuk pertanian cerdas yang mengintegrasikan interpolasi spasial Ordinary Kriging dan Random Forest untuk rekomendasi komoditas. Permasalahan utama adalah keterbatasan infrastruktur sensor IoT di wilayah rural. Pendekatan dilakukan melalui pengumpulan 24 titik sampel lapangan di Kabupaten Tasikmalaya (parameter nutrisi tanah dan mikroklimat) dengan augmentasi Monte Carlo menjadi 144 sampel. Validasi LOOCV mencatat RMSE 0.48 untuk pH tanah dan 0.56 untuk suhu udara, unggul dibandingkan IDW dan Spline; evaluasi 80:20 awal 89,66% terkoreksi menjadi 58,33% (Macro F1 0,48) setelah protokol LOOCV. Analisis kepentingan fitur mengidentifikasi pH dan nitrogen sebagai determinan utama. Luaran berupa representasi digital lahan sebagai sistem pendukung keputusan untuk meminimalkan risiko kerugian dan mengoptimalkan keberlanjutan ekonomi.",
      en: "Development of a Digital Twin framework for smart farming integrating Ordinary Kriging spatial interpolation and Random Forest for commodity recommendations. The core challenge is limited IoT sensor infrastructure in rural areas. Approach: 24 field samples in Tasikmalaya Regency (soil nutrients and microclimate) augmented via Monte Carlo to 144. LOOCV recorded RMSE 0.48 for soil pH and 0.56 for air temperature, outperforming IDW and Spline; initial 80:20 accuracy of 89.66% corrected to 58.33% (Macro F1 0.48) under LOOCV. Feature importance identified pH and nitrogen as primary determinants. Output is an accurate digital land representation as a decision support system to minimize loss risk and optimize economic sustainability.",
    } as const,
    stack: ["Kriging", "Random Forest", "GeoPandas", "Python"],
    status: "RESEARCH DONE",
    statusTone: "lime" as const,
    tone: "violet" as const,
    href: "/articles/optimizing-agricultural-economic-sustainability.pdf",
  },
  {
    no: "02",
    title: "IoT Smart Feeder",
    kind: "IoT · Hardware Prototype",
    category: "iot" as const,
    desc: {
      id: "Sistem pakan otomatis berbasis ESP32 dengan motor servo dan penjadwalan jarak jauh untuk rutinitas pakan.",
      en: "ESP32-based automated feeding system with servo motors and remote scheduling for pet feeding routines.",
    } as const,
    concept: {
      id: "Sistem pemberian pakan otomatis untuk tiga kucing semi-indoor dengan risiko konsumsi oleh kucing liar dan batasan anggaran ≤ Rp150.000. Prinsip utama: penyaluran pakan hanya atas konfirmasi pemilik. Solusi mengandalkan ESP32-CAM (OV2640) sebagai pengendali tunggal yang terintegrasi dengan Blynk (V0 pemberian manual, V1 jadwal, V3 durasi servo SG90). Tiga mode operasi: terjadwal (nonaktif secara default; 07.00/17.00), konfirmasi (notifikasi push → persetujuan pemilik → aktuasi servo), dan manual. MVP mencakup F1–F5 serta live view MJPEG; RFID dan sensor level ditunda karena keterbatasan kalung dan anggaran. Estimasi biaya ±Rp117.000 dengan arsitektur Blynk Cloud sebagai penghubung.",
      en: "Automated feeding system for three semi-indoor cats with stray-animal risk and ≤ IDR 150k budget. Core principle: dispensing only upon owner confirmation. Solution uses ESP32-CAM (OV2640) as single controller integrated with Blynk (V0 manual feed, V1 schedule, V3 servo duration SG90). Three modes: scheduled (off by default; 07:00/17:00), confirmation-based (push notification → owner approval → servo actuation), and manual. MVP covers F1–F5 plus MJPEG live view; RFID and level sensors deferred due to collar and budget constraints. Estimated cost ±IDR 117k with Blynk Cloud as bridge.",
    } as const,
    stack: ["ESP32", "Servo Motors", "MQTT", "Sensors"],
    status: "CONCEPT STAGE",
    statusTone: "violet" as const,
    tone: "violet" as const,
  },
  {
    no: "03",
    title: "BPS PDF Publication ETL Pipeline",
    kind: "Data Engineering · ETL",
    category: "data" as const,
    desc: {
      id: "Pipeline ETL otomatis yang mem-parsing PDF publikasi BPS tidak terstruktur menjadi database relasional PostgreSQL.",
      en: "Automated text-parsing pipeline converting unstructured BPS publication PDFs to relational PostgreSQL database.",
    } as const,
    concept: {
      id: "Transformasi publikasi Kabupaten Dalam Angka (PDF ratusan halaman, ribuan tabel) menjadi basis data relasional dinamis untuk pencarian indikator instan dan analisis deret waktu multi-tahun. Permasalahan: pencarian manual tidak efisien dan komparasi lintas tahun terbatas. Pendekatan: ekstraksi cerdas berbasis pdfplumber dan pypdf untuk nomor tabel, judul publikasi, satuan, serta header multi-level yang disinkronkan ke MySQL/SQLite/PostgreSQL melalui layanan FastAPI dengan antarmuka SPA Vanilla dan Bootstrap 5. Fitur utama meliputi dashboard eksekutif interaktif, kontrol akses berbasis peran dengan PBKDF2-HMAC-SHA256 dan lockout 5 menit, mesin deret waktu dengan Chart.js, editor sel langsung, serta deteksi dan resolusi anomali struktur kolom.",
      en: "Transformation of Kabupaten Dalam Angka publications (hundred-page PDFs, thousands of tables) into a dynamic relational database for instant indicator search and multi-year time-series analysis. Problem: inefficient manual retrieval and limited YoY comparison. Approach: intelligent extraction via pdfplumber/pypdf for table numbers, titles, units, and multi-level headers synced to MySQL/SQLite/PostgreSQL through FastAPI with Vanilla SPA + Bootstrap 5. Key features: interactive executive dashboard, RBAC with PBKDF2-HMAC-SHA256 and 5-minute lockout, time-series engine with Chart.js, live cell editor, and structural anomaly detection and resolution.",
    } as const,
    stack: ["Python", "ETL", "PostgreSQL", "Pandas"],
    status: "RESEARCH DONE",
    statusTone: "violet" as const,
    tone: "violet" as const,
  },
  {
    no: "04",
    title: "Kulinara — Kuliner Nusantara",
    kind: "Pengembangan Web · Concept",
    category: "web" as const,
    desc: {
      id: "Aplikasi konsep untuk eksplorasi kuliner Nusantara, pelacakan nutrisi terstruktur, dan estimasi anggaran memasak.",
      en: "Concept app for Indonesian culinary exploration, structured nutrition tracking, and cooking budget estimation.",
    } as const,
    concept: {
      id: "Platform kurasi kuliner Nusantara untuk katalog dan promosi UMKM dengan eksplorasi resep, pelacakan nutrisi terstruktur, dan estimasi anggaran memasak. Rancangan awal berbasis Laravel dengan katalog terstruktur, pencarian, dan ulasan sebagai fondasi pengembangan. Catatan: README repositori saat ini masih berupa boilerplate framework; detail konsep akan diperbarui setelah konfirmasi ruang lingkup lebih lanjut.",
      en: "Curation platform for Indonesian culinary heritage for SME catalog and promotion, featuring recipe exploration, structured nutrition tracking, and cooking budget estimation. Initial design based on Laravel with structured catalog, search, and reviews as foundation. Note: repository README currently contains only framework boilerplate; concept details will be updated upon scope confirmation.",
    } as const,
    stack: ["Concept", "Nutrition API", "Tailwind", "PostgreSQL"],
    status: "CONCEPT STAGE",
    statusTone: "violet" as const,
    tone: "violet" as const,
  },
  {
    no: "05",
    title: "Smart Stock — Inventaris UMKM",
    kind: "Aplikasi Web · Inventory System",
    category: "web" as const,
    desc: {
      id: "Aplikasi inventaris UMKM: stok masuk/keluar, konversi satuan eceran–grosir, stok minimum, dan riwayat mutasi dengan row lock transaksional.",
      en: "SME inventory app: stock in/out, retail–wholesale unit conversion, minimum stock alerts, and transactional movement history with row locking.",
    } as const,
    concept: {
      id: "Sistem manajemen inventaris cerdas untuk UMKM dengan pemantauan stok real-time, notifikasi stok minimum, dan riwayat mutasi transaksional. Arsitektur Docker Compose (Next.js 14 App Router :3000, Laravel 11 php-fpm :8000, PostgreSQL 16) dengan model data 7 tabel (USERS, CATEGORIES, SUPPLIERS, UNITS, PRODUCTS, PRODUCT_UNITS, STOCK_MOVEMENTS) yang mendukung konversi satuan eceran–grosir melalui conversion_factor. Mekanisme mutasi menerapkan SELECT ... FOR UPDATE (row lock), perhitungan qty_base di server, validasi stok kurang (422 STOK_KURANG), adjustment absolut qty_after, guard CHECK stock_qty ≥ 0, dan retry deadlock hingga 3×. Alur peran owner/admin/staff serta roadmap 6 fase terdokumentasi pada diagram Notion.",
      en: "Smart inventory management system for SMEs with real-time stock monitoring, low-stock alerts, and transactional movement history. Docker Compose architecture (Next.js 14 App Router :3000, Laravel 11 php-fpm :8000, PostgreSQL 16) with 7-table data model (USERS, CATEGORIES, SUPPLIERS, UNITS, PRODUCTS, PRODUCT_UNITS, STOCK_MOVEMENTS) supporting retail–wholesale conversion via conversion_factor. Mutation enforces SELECT ... FOR UPDATE (row lock), server-computed qty_base, insufficient stock validation (422 STOK_KURANG), absolute qty_after adjustment, CHECK stock_qty ≥ 0 guard, and deadlock retry up to 3×. Role flows (owner/admin/staff) and 6-phase roadmap documented in Notion diagrams.",
    } as const,
    stack: ["Laravel 11", "Next.js 14", "PostgreSQL", "Docker"],
    status: "CONCEPT STAGE",
    statusTone: "violet" as const,
    tone: "violet" as const,
  },
];

function ProjectsOpening() {
  const { lang } = useLang();
  const t = dict[lang];
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const gridY = useTransform(scrollYProgress, [0, 1], [22, -22]);
  const titleY = useTransform(scrollYProgress, [0, 1], [14, -16]);
  const inView = useInView(ref, { amount: 0.35, margin: "0px 0px -12% 0px" });
  return (
    <section
      ref={ref}
      className="relative flex min-h-[62dvh] items-center justify-center overflow-visible bg-transparent px-[5vw] pb-2 pt-6 md:min-h-[100dvh] md:pb-[7vh] md:pt-[13vh]"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 select-none font-display text-[22vw] font-black leading-none tracking-[0.02em] watermark max-sm:text-[30vw]"
        style={{ y: titleY, opacity: 0.11 } as unknown as Record<string, unknown>}
      >
        {t.watermarks.karya}
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-[10%] -bottom-[8%] h-[640px] w-[900px] bg-sage/10 blur-[90px] max-sm:hidden"
        style={{ y: titleY } as unknown as Record<string, unknown>}
      />
      <div className="relative mx-auto w-[min(1120px,90vw)] text-center">
        <motion.div
          style={{ y: titleY } as unknown as Record<string, unknown>}
          className="will-change-transform"
        >
          <Eyebrow index="" label={t.projectsEyebrow} />
          <SplitReveal
            key={t.projectsTitle}
            play={inView}
            text={t.projectsTitle}
            className="mx-auto font-display text-[clamp(1.9rem,8.4vw,6.75rem)] font-extrabold leading-[0.95] tracking-[0.01em]"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 } as unknown as Record<string, unknown>}
            animate={
              inView
                ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                : ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
            }
            transition={{ duration: 0.6, ease: EASE, delay: inView ? 0.55 : 0.22 }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed sm:text-base"
            style={{ color: WARM.muted }}
          >
            {(t as unknown as { projectsSubtitle: string }).projectsSubtitle}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/* tata letak coverflow — satu sumber rumus, dipakai render React & paint imperatif (fast-scroll) */
function coverLayout(offset: number) {
  const abs = Math.abs(offset);
  const isCenter = abs < 0.5;
  return {
    abs,
    isCenter,
    x: offset * 198,
    z: -Math.min(abs, 3) * 96,
    scale: isCenter ? 1 : Math.max(0.82, 1 - abs * 0.068),
    rotY: -offset * 10,
  };
}

function Projects() {
  const { lang } = useLang();
  const t = dict[lang];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollerInView = useInView(scrollerRef, { amount: 0.3 });
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const [active, setActive] = useState<(typeof projects)[number] | null>(null);
  const [docHref, setDocHref] = useState<string | null>(null);
  const [centerIdx, setCenterIdx] = useState(0);
  // --- infinite loop: 3 copies biar kiri/kanan tidak kosong, auto-preview bergantian
  const LOOP_N = projects.length;
  const LOOP_COPIES = 3;
  const loopProjects = Array.from({ length: LOOP_N * LOOP_COPIES }, (_, i) => projects[i % LOOP_N]);
  // HP: tanpa klon — loop/infinite-jump cuma untuk coverflow desktop (kalau di HP bikin lompat/ngebut)
  const isMobile = useIsMobile();
  const scrollerProjects = isMobile ? projects : loopProjects;
  const autoPauseRef = useRef(false);
  const isHoverRef = useRef(false);
  // coverflow desktop (md+) — index 0..N-1, FEATURED di tengah
  const [coverIdx, setCoverIdx] = useState(0);
  const coverAutoPauseRef = useRef(false);
  const coverHoverRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const wheelLock = useRef(0);
  const coverDragRef = useRef({ active: false, startX: 0, moved: false });
  const coverInViewRef = useRef(false);
  // fast scroll entry — 2 detik sangat cepat→medium→lambat, digambar langsung ke DOM (tanpa re-render)
  const [coverPhase, setCoverPhase] = useState<"fast" | "reveal">("reveal");
  const coverEls = useRef<(HTMLDivElement | null)[]>([]);
  const FAST_TOTAL = 2000;
  const FAST_DIST = LOOP_N * 12; // kelipatan utuh LOOP_N → handoff ke fase reveal tidak pernah lompat
  // paint langsung: transform/opacity/zIndex tanpa setState, biar fast-scroll tidak re-render 60×/detik
  const paintCover = (f: number) => {
    const els = coverEls.current;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      let off = i - f;
      while (off > LOOP_N / 2) off -= LOOP_N;
      while (off < -LOOP_N / 2) off += LOOP_N;
      const L = coverLayout(off);
      el.style.transform = `translate3d(calc(-50% + ${L.x}px), -50%, ${L.z}px) rotateY(${L.rotY}deg) scale(${L.scale})`;
      el.style.opacity = L.abs < 2.6 ? "1" : "0";
      el.style.zIndex = String(L.isCenter ? 40 : 30 - Math.floor(L.abs));
    }
  };
  const coverIdxRef = useRef(coverIdx);
  useEffect(() => {
    coverIdxRef.current = coverIdx;
  }, [coverIdx]);
  // carousel: center-zoom — outer pitch gap-4 rata, inner yang di-scale; center hitung via offsetLeft (anti-scale drift)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    let adjusting = false;
    const getCardWidth = () => {
      const probe = el.querySelector<HTMLElement>("[data-karya-pos]");
      return probe ? probe.offsetWidth : 330;
    };
    const applyPadding = () => {
      const cw = getCardWidth();
      const pad = Math.max(16, (el.clientWidth - cw) / 2);
      el.style.scrollPaddingInline = `${pad}px`;
      el.style.paddingInline = `${pad}px`;
      return pad;
    };
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (adjusting) return;
        const centerX = el.scrollLeft + el.clientWidth / 2;
        const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-karya-pos]"));
        if (!cards.length) return;
        let best = 0;
        let bestDist = Infinity;
        cards.forEach((card, i) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          const dist = Math.abs(cardCenter - centerX);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        });
        // infinite jump: kalau best di klon luar, lompat senyap ke klon tengah yang sama (seamless)
        // HP tidak punya klon — jangan pernah jump, cukup update center
        if (!isMobile && (best < LOOP_N || best >= LOOP_N * 2)) {
          const targetPos = best < LOOP_N ? best + LOOP_N : best - LOOP_N;
          const target = cards[targetPos];
          if (target) {
            adjusting = true;
            const prevBehavior = el.style.scrollBehavior;
            el.style.scrollBehavior = "auto";
            const targetLeft = target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2;
            el.scrollLeft = targetLeft;
            setCenterIdx(targetPos);
            requestAnimationFrame(() => {
              el.style.scrollBehavior = prevBehavior;
              adjusting = false;
            });
            return;
          }
        }
        setCenterIdx((prev) => (prev === best ? prev : best));
      });
    };
    const init = () => {
      const pad = applyPadding();
      void pad;
      // bawa klon tengah (offset N) ke tengah biar kiri tidak kosong & centerIdx konsisten
      const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-karya-pos]"));
      const firstMiddle = cards[isMobile ? 0 : LOOP_N];
      if (firstMiddle) {
        const target = firstMiddle.offsetLeft - (el.clientWidth - firstMiddle.offsetWidth) / 2;
        el.scrollLeft = Math.max(0, target);
      }
      update();
    };
    // tunggu layout 12 kartu siap
    requestAnimationFrame(() => requestAnimationFrame(init));
    el.addEventListener("scroll", update, { passive: true });
    const onResize = () => {
      applyPadding();
      update();
    };
    window.addEventListener("resize", onResize);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            applyPadding();
            update();
          })
        : null;
    if (ro) ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [isMobile]);
  // auto-preview mobile horizontal: saat idle, geser halus ke kartu berikutnya (pause saat hover/drag/modal)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // HP: swipe manual saja — tanpa autoplay supaya geser tidak terasa "ngebut"
    if (isMobile) return;
    // autoplay hanya saat section terlihat — jangan geser kartu di luar layar
    if (!scrollerInView) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let timer: number | undefined;
    const prefersReduced = () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (prefersReduced()) {
          schedule();
          return;
        }
        if (document.hidden) {
          schedule();
          return;
        }
        if (autoPauseRef.current || isHoverRef.current || drag.current.active || active) {
          schedule();
          return;
        }
        if (!scrollerInView) {
          schedule();
          return;
        }
        // desktop coverflow punya autoplay sendiri; jangan autoplay scroller yang hidden di md+
        if (typeof window !== "undefined" && window.innerWidth >= 768) {
          schedule();
          return;
        }
        const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-karya-pos]"));
        if (!cards.length) {
          schedule();
          return;
        }
        const centerX = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        cards.forEach((c, i) => {
          const cc = c.offsetLeft + c.offsetWidth / 2;
          const d = Math.abs(cc - centerX);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        let next = best + 1;
        // biar tetap di tengah copy, wrap via modulo
        if (next >= cards.length) next = LOOP_N;
        const target = cards[next];
        if (!target) {
          schedule();
          return;
        }
        const targetLeft = target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2;
        el.scrollTo({ left: targetLeft, behavior: "smooth" });
        schedule();
      }, 6000) as unknown as number;
    };
    schedule();
    const onVis = () => {
      if (!document.hidden) schedule();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active, scrollerInView, isMobile]);
  // auto-preview coverflow desktop — gantian 3800ms, pause hover/modal
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (document.hidden) {
          schedule();
          return;
        }
        if (
          coverAutoPauseRef.current ||
          coverHoverRef.current ||
          active ||
          !coverInViewRef.current
        ) {
          schedule();
          return;
        }
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          schedule();
          return;
        }
        setCoverIdx((v) => (v + 1) % LOOP_N);
        schedule();
      }, 3800) as unknown as number;
    };
    schedule();
    const onVis = () => {
      if (!document.hidden) schedule();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active]);
  useEffect(() => {
    if (!active) return;
    const y = lenisInstance?.scroll ?? window.scrollY;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    const sb = window.innerWidth - document.documentElement.clientWidth;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPad = document.body.style.paddingRight;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (sb > 0) document.body.style.paddingRight = `${sb}px`;
    lenisInstance?.stop();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.paddingRight = prevBodyPad;
      document.documentElement.style.overflow = prevHtmlOverflow;
      // restore scroll pos — tanpa ini Chrome HP jump ke 0 terlihat "restart ke opening"
      if (lenisInstance) {
        lenisInstance.start();
        lenisInstance.scrollTo(y, { immediate: true });
      } else {
        window.scrollTo(0, y);
      }
      requestAnimationFrame(() => lenisInstance?.resize());
    };
  }, [active]);
  // Hover biasa → vertikal Lenis. Shift+hover → horizontal di karya
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheelCapture = (ev: WheelEvent) => {
      if (!ev.shiftKey) return;
      if (el.scrollWidth <= el.clientWidth + 1) return;
      const rect = el.getBoundingClientRect();
      const over =
        ev.clientX >= rect.left &&
        ev.clientX <= rect.right &&
        ev.clientY >= rect.top &&
        ev.clientY <= rect.bottom;
      if (!over && !el.contains(ev.target as Node)) return;
      if (Math.abs(ev.deltaY) < 0.5 && Math.abs(ev.deltaX) < 0.5) return;
      ev.preventDefault();
      try {
        (ev as unknown as { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
      } catch {}
      ev.stopPropagation();
      const raw = ev.deltaY !== 0 ? ev.deltaY : ev.deltaX;
      const scale = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? el.clientWidth : 1;
      el.scrollBy({ left: raw * scale, behavior: "auto" });
    };
    el.addEventListener("wheel", onWheelCapture, { passive: false });
    return () => el.removeEventListener("wheel", onWheelCapture as unknown as EventListener);
  }, []);
  const handleCta = () => {
    setActive(null);
    setTimeout(() => scrollToId("contact"), 120);
  };
  const pauseCover = () => {
    coverAutoPauseRef.current = true;
    window.setTimeout(() => {
      coverAutoPauseRef.current = false;
    }, 2600);
  };
  const goCover = (dir: 1 | -1) => {
    setCoverIdx((v) => (v + dir + LOOP_N) % LOOP_N);
    pauseCover();
  };
  const goCoverTo = (i: number) => {
    setCoverIdx(((i % LOOP_N) + LOOP_N) % LOOP_N);
    pauseCover();
  };
  // Shift+wheel di coverflow → geser kartu, tanpa Shift biarin vertikal
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      if (!ev.shiftKey) return;
      const rect = el.getBoundingClientRect();
      if (
        !(
          (ev.clientX >= rect.left &&
            ev.clientX <= rect.right &&
            ev.clientY >= rect.top &&
            ev.clientY <= rect.bottom) ||
          el.contains(ev.target as Node)
        )
      )
        return;
      if (Math.abs(ev.deltaY) < 0.5 && Math.abs(ev.deltaX) < 0.5) return;
      ev.preventDefault();
      try {
        (ev as unknown as { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
      } catch {}
      ev.stopPropagation();
      const now = performance.now();
      if (now - wheelLock.current < 280) return;
      wheelLock.current = now;
      setCoverIdx((v) => (v + ((ev.deltaY || ev.deltaX) > 0 ? 1 : -1) + LOOP_N) % LOOP_N);
      coverAutoPauseRef.current = true;
      window.setTimeout(() => {
        coverAutoPauseRef.current = false;
      }, 2600);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  // fast-scroll entry — ringan transform only, stepping coverIdx ~85ms total ~420ms
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let timers: number[] = [];
    const clearTimers = () => {
      timers.forEach((t) => window.cancelAnimationFrame(t));
      timers = [];
    };
    const isReduce = () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let settle: number | undefined;
    const runFast = () => {
      if (isReduce()) {
        setCoverPhase("reveal");
        return;
      }
      setCoverPhase("fast");
      coverAutoPauseRef.current = true;
      const DIST = FAST_DIST;
      const start = coverIdxRef.current;
      const startTime = performance.now();
      const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / FAST_TOTAL, 1);
        const eased = easeOutCubic(t);
        const cur = start + eased * DIST;
        paintCover(cur);
        if (t < 1) {
          const id = requestAnimationFrame(tick) as unknown as number;
          timers[0] = id;
        } else {
          setCoverIdx((start + DIST) % LOOP_N);
          settle = window.setTimeout(() => {
            setCoverPhase("reveal");
            coverAutoPauseRef.current = false;
          }, 140) as unknown as number;
        }
      };
      const id = requestAnimationFrame(tick) as unknown as number;
      timers[0] = id;
      return;
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        coverInViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          clearTimers();
          window.clearTimeout(settle);
          runFast();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimers();
      window.clearTimeout(settle);
      timers.forEach((t) => window.cancelAnimationFrame(t));
    };
  }, []);

  return (
    <div id="projects" className="relative bg-transparent">
      {/* Opening — full 100dvh EPIC — keep */}
      <ProjectsOpening />
      {/* Kartu — baris horizontal scroll — container margin biar tidak mepet viewport */}
      <section className="relative pb-6 pt-4 md:pb-[12vh] md:pt-8" aria-label={t.projectsTitle}>
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-[2.5vw]">
          <div
            ref={scrollerRef}
            role="region"
            aria-label="Karya"
            tabIndex={0}
            className="karya-scroll flex cursor-grab select-none gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory py-4 pb-4 active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta/60 md:hidden md:gap-4 md:py-6 md:pb-5"
            style={
              {
                touchAction: "pan-x pan-y",
                overscrollBehaviorX: "contain",
                scrollBehavior: "auto",
              } as React.CSSProperties
            }
            onPointerEnter={() => {
              isHoverRef.current = true;
            }}
            onPointerLeave={() => {
              isHoverRef.current = false;
            }}
            onFocusCapture={() => {
              isHoverRef.current = true;
            }}
            onBlurCapture={() => {
              isHoverRef.current = false;
            }}
            onPointerDown={(e) => {
              autoPauseRef.current = true;
              // touch: serahkan ke native scroll + snap (drag custom hanya untuk mouse)
              if (e.pointerType !== "mouse") return;
              // biarkan click di kartu tetap jalan — drag cuma saat gerak horizontal cukup
              const el = scrollerRef.current;
              if (!el) return;
              if (e.button !== 0) return;
              drag.current = {
                active: true,
                startX: e.clientX,
                startLeft: el.scrollLeft,
                moved: false,
              };
              // jangan setPointerCapture di sini — biar click asli tidak tertahan; snap dimatikan hanya saat mulai drag
            }}
            onPointerMove={(e) => {
              if (!drag.current.active) return;
              const el = scrollerRef.current;
              if (!el) return;
              const dx = e.clientX - drag.current.startX;
              if (Math.abs(dx) < 6) return;
              // baru drag — tahan agar tidak jadi click, matikan snap
              if (!drag.current.moved) {
                drag.current.moved = true;
                el.style.scrollSnapType = "none";
                el.style.scrollBehavior = "auto";
              }
              el.scrollLeft = drag.current.startLeft - dx;
              e.preventDefault();
            }}
            onPointerUp={() => {
              const el = scrollerRef.current;
              if (el) {
                el.style.scrollSnapType = "";
                el.style.scrollBehavior = "";
              }
              // reset moved agak lambat biar onClick kartu bisa cek drag.moved
              const wasMoved = drag.current.moved;
              drag.current.active = false;
              if (wasMoved)
                setTimeout(() => {
                  drag.current.moved = false;
                }, 180);
              else drag.current.moved = false;
              setTimeout(
                () => {
                  autoPauseRef.current = false;
                },
                e.pointerType === "mouse" ? 1800 : 6000,
              );
            }}
            onPointerCancel={() => {
              const el = scrollerRef.current;
              if (el) {
                el.style.scrollSnapType = "";
                el.style.scrollBehavior = "";
              }
              drag.current.active = false;
              drag.current.moved = false;
              setTimeout(() => {
                autoPauseRef.current = false;
              }, 1800);
            }}
            onClickCapture={(e) => {
              if (drag.current.moved) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            {scrollerProjects.map((proj, idx) => {
              const isCenter = idx === centerIdx;
              const dist = Math.abs(idx - centerIdx);
              const scale = isCenter ? 1.025 : dist === 1 ? 0.985 : 0.96;
              const opacity = isCenter ? 1 : dist === 1 ? 0.96 : 0.88;
              const orig = idx % LOOP_N;
              // desktop: hanya salinan tengah yang interaktif — klon loop disembunyikan dari fokus & screen reader
              // HP: tidak ada klon, semua kartu interaktif
              const isClone = !isMobile && (idx < LOOP_N || idx >= LOOP_N * 2);
              return (
                <div
                  key={`${proj.title}-${idx}`}
                  data-karya-pos=""
                  data-karya-card=""
                  aria-hidden={isClone ? true : undefined}
                  className="flex min-w-[78vw] max-w-[78vw] shrink-0 snap-center [scroll-snap-stop:always] sm:min-w-[300px] sm:max-w-[330px] md:min-w-[320px] md:max-w-[340px]"
                  style={{ transition: "opacity 280ms ease" } as React.CSSProperties}
                >
                  <div
                    className="flex h-[400px] w-full transition-[transform] duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform sm:h-[420px] md:h-auto md:min-h-[410px]"
                    style={
                      {
                        transform: `scale(${scale})`,
                        opacity,
                        transformOrigin: "center center",
                      } as React.CSSProperties
                    }
                  >
                    <ProjectCard
                      p={proj}
                      idx={orig}
                      interactive={!isClone}
                      onOpen={(p) => {
                        if (drag.current.moved) return;
                        setActive(p);
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {/* paddingInline sudah dari JS (clientWidth-card)/2, spacer tidak perlu lagi untuk center — keep tipis buat overscroll breathing */}
            <div aria-hidden className="shrink-0 w-2" />
          </div>

          {/* Petunjuk geser mobile */}
          <div className="md:hidden mt-4 flex items-center gap-2 justify-center font-mono text-[11px] font-bold uppercase tracking-widest text-terracotta">
            <span className="text-xs">←</span>
            {lang === "id" ? "Geser kartu" : "Swipe cards"}
            <span className="text-xs">→</span>
          </div>

          {/* Coverflow stacked arc — desktop md+ : FEATURED di depan, samping tumpuk ke belakang */}
          <div className="relative hidden md:block">
            <div
              ref={stageRef}
              role="region"
              aria-label="Karya"
              tabIndex={0}
              onPointerEnter={() => {
                coverHoverRef.current = true;
              }}
              onPointerLeave={() => {
                coverHoverRef.current = false;
              }}
              onFocusCapture={() => {
                coverHoverRef.current = true;
              }}
              onBlurCapture={() => {
                coverHoverRef.current = false;
              }}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                coverHoverRef.current = true;
                coverAutoPauseRef.current = true;
                coverDragRef.current = { active: true, startX: e.clientX, moved: false };
              }}
              onPointerMove={(e) => {
                const d = coverDragRef.current;
                if (!d.active) return;
                const dx = e.clientX - d.startX;
                if (Math.abs(dx) < 8) return;
                if (!d.moved) d.moved = true;
              }}
              onPointerUp={(e) => {
                const d = coverDragRef.current;
                const wasMoved = d.moved;
                const dx = e.clientX - d.startX;
                d.active = false;
                if (!wasMoved) {
                  window.setTimeout(() => {
                    coverAutoPauseRef.current = false;
                  }, 2600);
                  return;
                }
                if (Math.abs(dx) >= 46) {
                  goCover(dx < 0 ? 1 : -1);
                  window.setTimeout(() => {
                    coverDragRef.current.moved = false;
                  }, 320);
                  return;
                }
                // gerak kecil < threshold → anggap klik, jangan blok modal
                coverDragRef.current.moved = false;
                window.setTimeout(() => {
                  coverAutoPauseRef.current = false;
                }, 1200);
              }}
              onPointerCancel={() => {
                coverDragRef.current.active = false;
                coverDragRef.current.moved = false;
                window.setTimeout(() => {
                  coverAutoPauseRef.current = false;
                }, 1200);
              }}
              onClickCapture={(e) => {
                if (coverDragRef.current.moved) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  goCover(-1);
                }
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  goCover(1);
                }
              }}
              className={
                "relative mx-auto flex h-[520px] w-full max-w-[1320px] select-none items-center justify-center outline-none focus:outline-none focus-visible:outline-none " +
                (coverDragRef.current.active ? "cursor-grabbing" : "cursor-grab")
              }
              style={
                {
                  touchAction: "pan-y",
                  perspective: "1500px",
                  perspectiveOrigin: "50% 45%",
                  transformStyle: "preserve-3d",
                } as React.CSSProperties
              }
            >
              {projects.map((proj, i) => {
                let offset = i - coverIdx;
                // wrap untuk kontinuitas tanpa lompat
                while (offset > LOOP_N / 2) offset -= LOOP_N;
                while (offset < -LOOP_N / 2) offset += LOOP_N;
                const { abs, isCenter, x, z, scale, rotY } = coverLayout(offset);
                const visible = abs <= 2;
                const blur = abs === 0 ? 0 : abs === 1 ? 1.4 : 4;
                // fast: view tetap 5 kartu, tidak kedip — digambar imperatif via paintCover
                const fast = coverPhase === "fast";
                return (
                  <div
                    key={proj.title}
                    ref={(el) => {
                      coverEls.current[i] = el;
                    }}
                    role="button"
                    tabIndex={fast ? -1 : visible ? 0 : -1}
                    aria-label={isCenter ? `Buka ${proj.title}` : `Bawa ${proj.title} ke tengah`}
                    title={isCenter ? `Buka ${proj.title}` : `Klik untuk bawa ke tengah`}
                    onClick={() => {
                      if (coverDragRef.current.moved) return;
                      if (!isCenter) goCoverTo(i);
                      else setActive(proj);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (coverDragRef.current.moved) return;
                        if (!isCenter) goCoverTo(i);
                        else setActive(proj);
                      }
                    }}
                    className={
                      "absolute left-1/2 top-1/2 w-[368px] will-change-transform outline-none focus:outline-none focus-visible:outline-none " +
                      (isCenter ? "cursor-pointer" : "cursor-pointer hover:brightness-[1.06]")
                    }
                    style={
                      {
                        transform: `translate3d(calc(-50% + ${x}px), -50%, ${z}px) rotateY(${rotY}deg) scale(${scale})`,
                        opacity: visible ? 1 : 0,
                        zIndex: isCenter ? 40 : 30 - Math.floor(abs),
                        filter: fast ? "none" : blur ? `blur(${blur}px)` : "none",
                        pointerEvents: fast ? "none" : visible ? "auto" : "none",
                        transition: fast
                          ? "none"
                          : "transform 520ms cubic-bezier(0.16,1,0.3,1), opacity 520ms cubic-bezier(0.16,1,0.3,1), filter 680ms cubic-bezier(0.16,1,0.3,1)",
                      } as React.CSSProperties
                    }
                  >
                    <div
                      className={isCenter ? "" : "pointer-events-none"}
                      onClickCapture={(e) => {
                        if (!isCenter) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    >
                      <ProjectCard
                        p={proj}
                        idx={i}
                        onOpen={() => {
                          if (coverDragRef.current.moved) return;
                          if (isCenter) setActive(proj);
                          else goCoverTo(i);
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* kontrol — prev / dots / next */}
            <div className="mt-1 flex items-center justify-center gap-4 pb-2">
              <button
                type="button"
                onClick={() => goCover(-1)}
                aria-label="Karya sebelumnya"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-surface text-ink transition-colors hover:border-terracotta hover:text-terracotta"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2">
                {projects.map((proj, i) => {
                  const on = i === coverIdx;
                  return (
                    <button
                      key={proj.no}
                      type="button"
                      onClick={() => goCoverTo(i)}
                      aria-label={`Karya ${proj.no}`}
                      aria-current={on}
                      className="flex h-6 items-center px-0.5"
                    >
                      <span
                        className={
                          "block h-1.5 rounded-full transition-all duration-300 " +
                          (on ? "w-7 bg-terracotta" : "w-1.5 bg-border hover:bg-muted/70")
                        }
                      />
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => goCover(1)}
                aria-label="Karya berikutnya"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-surface text-ink transition-colors hover:border-terracotta hover:text-terracotta"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {active && (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={t.projectModal.title}
                className="fixed inset-0 z-[100] flex min-h-[100dvh] items-start justify-center overflow-hidden p-3 sm:items-center sm:p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActive(null)}
              >
                <div
                  aria-hidden
                  className="fixed inset-0 bg-[#0f0e0d]/70 backdrop-blur-[2px] supports-[backdrop-filter]:bg-[#0f0e0d]/60 max-sm:backdrop-blur-none max-sm:bg-[#0f0e0d]/80"
                />
                <motion.div
                  initial={{ y: 16, scale: 0.98, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ y: 8, scale: 0.98, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 24 }}
                  onClick={(e) => e.stopPropagation()}
                  className="warm-card relative my-auto flex w-full max-w-[520px] max-h-[85dvh] flex-col overflow-hidden bg-surface text-left max-sm:max-h-[90dvh] md:max-h-[88dvh]"
                >
                  <button
                    onClick={() => setActive(null)}
                    aria-label={t.projectModal.close}
                    className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-[10px] border border-border/25 bg-cream text-ink shadow-[0_6px_18px_rgba(0,0,0,0.45)] hover:border-terracotta hover:text-terracotta"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-6 pb-7 md:p-7">
                    <p
                      className="font-mono text-xs uppercase tracking-[0.2em]"
                      style={{ color: WARM.terracotta }}
                    >
                      {active.kind}
                      {(() => {
                        const c = (active as { category?: keyof typeof CATEGORY_META }).category;
                        if (!c) return null;
                        const m = CATEGORY_META[c];
                        const I = m.Icon;
                        return (
                          <span
                            className={
                              "ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 align-middle text-[10px] font-bold tracking-widest " +
                              m.cls
                            }
                          >
                            <I size={10} />
                            {m.label[lang]}
                          </span>
                        );
                      })()}
                    </p>
                    <h3 className="mt-2 pr-8 font-display text-2xl font-normal uppercase leading-tight tracking-[0.14em] text-ink">
                      {(active as { href?: string }).href
                        ? (t.projectModal as { articleTitle: string }).articleTitle
                        : t.projectModal.title}
                    </h3>
                    <p className="mt-2 inline-block bg-terracotta px-2.5 py-1.5 font-mono text-xs font-black uppercase leading-none tracking-[0.22em] text-white">
                      {active.title}
                    </p>
                    <p className="mt-3 text-justify text-sm font-medium leading-relaxed text-ink max-md:text-left max-md:[hyphens:none]">
                      {(active as { href?: string }).href
                        ? (t.projectModal as { articleBody: string }).articleBody
                        : active.status === "IN PROGRESS"
                          ? (t.projectModal as { inProgressBody: string }).inProgressBody
                          : active.status === "CONCEPT STAGE"
                            ? (t.projectModal as { conceptBody: string }).conceptBody
                            : t.projectModal.body}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {(() => {
                        const href = (active as { href?: string }).href;
                        const hasArticle = typeof href === "string" && href.length > 0;
                        if (hasArticle) {
                          return (
                            <>
                              <motion.button
                                onClick={() => {
                                  const h = href!;
                                  const isCoarse =
                                    typeof window !== "undefined" &&
                                    (window.matchMedia("(pointer: coarse)").matches ||
                                      window.innerWidth <= 768);
                                  if (isCoarse) {
                                    window.open(h, "_blank", "noopener,noreferrer");
                                    return;
                                  }
                                  setActive(null);
                                  setTimeout(() => setDocHref(h), 180);
                                }}
                                whileHover={{ y: -1, scale: 1.01 }}
                                whileTap={{ scale: 0.98, y: 1 }}
                                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                                className="warm-btn primary sm text-white"
                              >
                                {(t.projectModal as { readArticle: string }).readArticle}{" "}
                                <ArrowUpRight size={14} />
                              </motion.button>
                              <motion.button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(href!);
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = href!.split("/").pop() || "artikel.pdf";
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    setTimeout(() => URL.revokeObjectURL(url), 1200);
                                  } catch {
                                    window.open(href!, "_blank", "noopener,noreferrer");
                                  }
                                }}
                                whileHover={{ y: -1, scale: 1.01 }}
                                whileTap={{ scale: 0.98, y: 1 }}
                                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                                className="warm-btn ghost sm"
                              >
                                {(t.projectModal as { download: string }).download}{" "}
                                <Download size={14} />
                              </motion.button>
                              <motion.button
                                onClick={handleCta}
                                whileHover={{ y: -1, scale: 1.01 }}
                                whileTap={{ scale: 0.98, y: 1 }}
                                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                                className="warm-btn ghost sm !border-terracotta/30 !text-terracotta hover:!bg-ink/10"
                              >
                                {(t.projectModal as { articleCta: string }).articleCta}{" "}
                                <ArrowUpRight size={14} />
                              </motion.button>
                              <motion.button
                                onClick={() => setActive(null)}
                                whileHover={{ y: -1, scale: 1.01 }}
                                whileTap={{ scale: 0.98, y: 1 }}
                                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                                className="warm-btn ghost sm"
                              >
                                {t.projectModal.close}
                              </motion.button>
                            </>
                          );
                        }
                        return (
                          <>
                            <motion.button
                              onClick={handleCta}
                              whileHover={{ y: -1, scale: 1.01 }}
                              whileTap={{ scale: 0.98, y: 1 }}
                              transition={{ type: "spring", stiffness: 420, damping: 18 }}
                              className="warm-btn primary sm text-white"
                            >
                              {t.projectModal.cta} <ArrowUpRight size={14} />
                            </motion.button>
                            <motion.button
                              onClick={() => setActive(null)}
                              whileHover={{ y: -1, scale: 1.01 }}
                              whileTap={{ scale: 0.98, y: 1 }}
                              transition={{ type: "spring", stiffness: 420, damping: 18 }}
                              className="warm-btn ghost sm"
                            >
                              {t.projectModal.close}
                            </motion.button>
                          </>
                        );
                      })()}
                    </div>
                    {(() => {
                      const c = (active as { concept?: { id: string; en: string } }).concept;
                      if (!c) return null;
                      const text = lang === "en" ? c.en : c.id;
                      const isInitial =
                        !!(active as { href?: string }).href || active.status === "RESEARCH DONE";
                      const label = isInitial
                        ? (t.projectModal as { conceptInitialLabel: string }).conceptInitialLabel
                        : (t.projectModal as { conceptLabel: string }).conceptLabel;
                      return (
                        <div className="mt-6 flex flex-col border-t border-border/10 pt-4">
                          <p className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                            {label}
                          </p>
                          <div className="mt-2 pr-1">
                            <p className="text-justify text-sm leading-relaxed text-ink/90 max-md:text-left max-md:[hyphens:none]">
                              {text}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
      {docHref && (
        <CertificateViewer
          href={docHref}
          open={!!docHref}
          onClose={() => setDocHref(null)}
          kind="article"
        />
      )}
    </div>
  );
}

/* ---------- 4. Experience — real profile ---------- */
const experience = [
  {
    icon: GraduationCap,
    year: { id: "2023 — Sekarang", en: "2023 — Present" } as const,
    period: { id: "Akademik", en: "Academic" } as const,
    role: { id: "Mahasiswa Sistem Informasi", en: "Information Systems Student" } as const,
    org: { id: "Universitas Siliwangi", en: "Siliwangi University" } as const,
    points: {
      id: [
        "Fokus utama pada Data Engineering, Data Science, dan Data Analytics.",
        "Tertarik pada riset yang memanfaatkan pemodelan untuk menerjemahkan kompleksitas menjadi solusi nyata.",
      ],
      en: [
        "Core focus on Data Engineering, Data Science, and Data Analytics.",
        "Passionate about research that leverages modeling to translate complexity into real-world solutions.",
      ],
    } as const,
    tone: "coral" as const,
  },
  {
    icon: BarChart3,
    year: "2026",
    period: { id: "MSIB Program", en: "MSIB Program" } as const,
    role: {
      id: "Junior Data Science — VINIX7",
      en: "Junior Data Science — VINIX7",
    } as const,
    org: {
      id: "PT Vinix Seven Aurum | Kampus Merdeka",
      en: "PT Vinix Seven Aurum | Kampus Merdeka",
    } as const,
    points: {
      id: [
        "Mengevaluasi, menguji, dan melakukan fine-tuning berbagai model Machine Learning dengan Python.",
        "Melakukan Exploratory Data Analysis (EDA) dan data wrangling untuk menyiapkan dataset yang bersih.",
        "Berkolaborasi dalam alur kerja data science nyata dan analisis performa model.",
      ],
      en: [
        "Evaluated, tested, and fine-tuned various Machine Learning models using Python.",
        "Conducted Exploratory Data Analysis (EDA) and data wrangling to prepare clean datasets.",
        "Collaborated on real-world data science workflows and model performance analysis.",
      ],
    } as const,
    tone: "lime" as const,
    certificateHref: "/certificates/msib-vinix7.pdf",
  },
  {
    icon: Database,
    year: "2026",
    period: { id: "Kerja Praktik", en: "Internship" } as const,
    role: {
      id: "Kerja Praktik — Data Engineering & Operasi",
      en: "Practical Work — Data Engineering & Operations",
    } as const,
    org: {
      id: "Badan Pusat Statistik (BPS) Kabupaten Tasikmalaya",
      en: "Badan Pusat Statistik (BPS) Kabupaten Tasikmalaya",
    } as const,
    points: {
      id: [
        "Membangun pipeline ETL otomatis Python & SQL untuk mem-parsing dan menstandarisasi PDF publikasi BPS yang tidak terstruktur.",
        "Mengelola penyimpanan relasional di PostgreSQL untuk mengoptimalkan akses data dan pelaporan statistik.",
        "Bertugas sebagai Panitia Pelatihan Sensus Ekonomi 2026, mengelola pipeline data enumerator dari profil hingga penyaluran honor.",
      ],
      en: [
        "Developed automated Python & SQL ETL pipelines to parse and standardize unstructured BPS publication PDFs.",
        "Managed relational storage on PostgreSQL to optimize data accessibility and statistical reporting.",
        "Served as Economic Census 2026 Training Committee, managing enumerator data pipelines from personal profiles to honor payment disbursements.",
      ],
    } as const,
    tone: "violet" as const,
    certificateHref: "/certificates/kp-bps-tasikmalaya.pdf",
  },
];

function ExpRow({
  e,
  isLeft,
  dotPos,
  smooth,
  onJump,
  onOpenCert,
}: {
  e: (typeof experience)[number];
  isLeft: boolean;
  dotPos: number;
  smooth: MotionValue<number>;
  onJump: () => void;
  onOpenCert?: (href: string) => void;
}) {
  const Icon = e.icon;
  const { lang } = useLang();
  const low = useIsLowEnd();
  const t = dict[lang];
  const period = (e.period as { id: string; en: string })[lang] ?? (e.period as unknown as string);
  const role = (e.role as { id: string; en: string })[lang] ?? (e.role as unknown as string);
  const points = (
    Array.isArray(e.points) ? e.points : (e.points as { id: string[]; en: string[] })[lang]
  ) as string[];
  const yearRaw =
    (e as { year?: string }).year ??
    ((e as { year?: { id: string; en: string } }).year as unknown as string);
  const year =
    typeof yearRaw === "string"
      ? yearRaw
      : ((yearRaw as unknown as { id: string; en: string })[lang] ?? "");
  const orgRaw = (e as { org?: string | { id: string; en: string } }).org;
  const org =
    typeof orgRaw === "string"
      ? orgRaw
      : orgRaw
        ? (orgRaw as { id: string; en: string })[lang]
        : "";
  // low-end pakai IntersectionObserver, desktop pakai MotionValue
  const ioRef = useRef<HTMLDivElement>(null);
  const [lowActive, setLowActive] = useState(false);
  useEffect(() => {
    if (!low) return;
    const el = ioRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setLowActive(entry.isIntersecting), {
      rootMargin: "-28% 0px -58% 0px",
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [low]);
  const cc = "320ms cubic-bezier(0.22,1,0.36,1)" as const;
  // desktop still buttery
  const glow = useTransform(smooth, [dotPos - 0.16, dotPos - 0.015], [0, 1], { clamp: true });
  const dotScale = useTransform(glow, [0, 1], [1, 1.14]);
  const dotBg = useTransform(glow, [0, 1], [
    "rgba(255,251,245,0)",
    "rgba(224,122,95,0.08)",
  ] as unknown as string[]);
  const dotColor = useTransform(glow, [0, 1], ["#78716C", "#E07A5F"] as unknown as string[]);
  const haloOpacity = useTransform(glow, [0, 1], [0, 0.75]);
  const cardBorder = useTransform(glow, [0, 1], [
    "rgba(231,229,228,1)",
    "rgba(224,122,95,1)",
  ] as unknown as string[]);
  const bulletBg = useTransform(glow, [0, 1], [
    "rgba(120,113,108,0.25)",
    "rgba(224,122,95,1)",
  ] as unknown as string[]);
  const iconColor = useTransform(glow, [0, 1], ["#78716C", "#E07A5F"] as unknown as string[]);
  const dotShadow = useTransform(
    glow,
    [0, 1],
    [
      "drop-shadow(0 0 0 rgba(247,255,60,0))",
      "drop-shadow(0 0 10px rgba(224,122,95,0.12)) drop-shadow(0 0 22px rgba(224,122,95,0.12))",
    ],
  );
  const cardShadow = useTransform(
    glow,
    [0, 1],
    [
      "0 8px 24px rgba(28,25,23,0.06)",
      "0 8px 24px rgba(28,25,23,0.06), 0 0 20px rgba(224,122,95,0.08)",
    ],
  );
  const [open, setOpen] = useState(false);
  if (low) {
    const dotStyleLow: React.CSSProperties = {
      color: lowActive ? "#E07A5F" : "#78716C",
      backgroundColor: lowActive ? "rgba(224,122,95,0.08)" : "rgba(255,251,245,0)",
      filter: lowActive
        ? "drop-shadow(0 0 10px rgba(224,122,95,0.12)) drop-shadow(0 0 22px rgba(224,122,95,0.12))"
        : "drop-shadow(0 0 0 rgba(247,255,60,0))",
      transform: lowActive ? "scale(1.14)" : "scale(1)",
      transition: `color ${cc}, background-color ${cc}, filter ${cc}, transform ${cc}`,
    };
    const cardStyleLow: React.CSSProperties = {
      borderColor: lowActive ? "#E07A5F" : "#E7E5E4",
      boxShadow: lowActive
        ? "0 8px 24px rgba(28,25,23,0.06), 0 0 20px rgba(224,122,95,0.08)"
        : "0 8px 24px rgba(28,25,23,0.06)",
      transition: `border-color ${cc}, box-shadow ${cc}`,
    };
    const iconStyleLow: React.CSSProperties = {
      color: lowActive ? "#E07A5F" : "#78716C",
      transition: `color ${cc}`,
    };
    return (
      <div
        ref={ioRef}
        className={`relative flex w-full items-center ${isLeft ? "md:justify-start" : "md:justify-end"} justify-end`}
      >
        <span
          data-dot
          aria-hidden
          className="absolute left-[14px] top-8 z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[3px] bg-transparent md:left-1/2 md:top-1/2"
          style={dotStyleLow}
        >
          <span
            className="pointer-events-none absolute -inset-3 rounded-md bg-terracotta/20 blur-[8px]"
            style={{ opacity: lowActive ? 0.75 : 0, transition: `opacity ${cc}` }}
          />
          <ChipPixel size={26} />
        </span>
        {year ? (
          <span
            className={`pointer-events-none hidden md:block absolute top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold tracking-[0.16em] text-muted ${isLeft ? "left-[calc(50%+28px)]" : "right-[calc(50%+28px)] text-right"}`}
          >
            {year}
          </span>
        ) : null}
        <article
          onClick={onJump}
          className={`warm-card relative z-[2] w-[calc(100%-56px)] shrink-0 cursor-pointer p-5 md:w-[440px] md:min-w-[440px] md:max-w-[440px] md:p-6 ${isLeft ? "md:mr-auto md:ml-0" : "md:ml-auto md:mr-0"}`}
          style={cardStyleLow}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone={e.tone}>{period}</Tag>
                {year ? (
                  <span className="inline-flex md:hidden items-center rounded-full border border-border bg-cream-deep px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-muted">
                    {year}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-4 font-sans text-xl font-semibold uppercase tracking-[0.06em] md:text-2xl">
                {role}
              </h3>
              <p className="mt-1 text-sm text-muted">{org}</p>
            </div>
            <span className="shrink-0" style={iconStyleLow}>
              <Icon size={24} />
            </span>
          </div>
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              setOpen((v) => !v);
            }}
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-terracotta hover:text-[#d46a52]"
          >
            {open
              ? (t.experience as { hideDetail: string }).hideDetail
              : (t.experience as { showDetail: string }).showDetail}
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: EASE }}
                className="overflow-hidden"
              >
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {points.map((p) => (
                    <li key={p} className="flex gap-3 text-sm leading-relaxed text-muted">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: lowActive
                            ? "rgba(224,122,95,1)"
                            : "rgba(120,113,108,0.25)",
                          transition: `background-color ${cc}`,
                        }}
                      />
                      {p}
                    </li>
                  ))}
                </ul>
                {(e as { certificateHref?: string }).certificateHref && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onOpenCert?.((e as { certificateHref: string }).certificateHref);
                      }}
                      className="warm-btn primary xs"
                    >
                      {(t.experience as { viewCert: string }).viewCert} <ArrowUpRight size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={async (ev) => {
                        ev.stopPropagation();
                        const href = (e as { certificateHref: string }).certificateHref;
                        try {
                          const res = await fetch(href);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = href.split("/").pop() || "sertifikat.pdf";
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                        } catch {
                          window.open(href, "_blank", "noopener,noreferrer");
                        }
                      }}
                      className="warm-btn ghost xs"
                    >
                      {(t.experience as { download: string }).download} <Download size={12} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </article>
      </div>
    );
  }
  const dotStyle = {
    scale: dotScale,
    backgroundColor: dotBg,
    color: dotColor,
    filter: dotShadow,
  } as unknown as Record<string, unknown>;
  const cardStyle = { borderColor: cardBorder, boxShadow: cardShadow } as unknown as Record<
    string,
    unknown
  >;
  const haloStyle = { opacity: haloOpacity } as unknown as Record<string, unknown>;
  const iconStyle = { color: iconColor } as unknown as Record<string, unknown>;
  const bulletStyle = { backgroundColor: bulletBg } as unknown as Record<string, unknown>;
  return (
    <div
      className={`relative flex w-full items-center justify-end ${isLeft ? "md:justify-start" : "md:justify-end"}`}
    >
      <motion.button
        data-dot
        onClick={onJump}
        aria-label={`${period} — ${role}`}
        style={dotStyle}
        className="absolute left-[14px] top-8 z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[3px] border-0 bg-transparent md:left-1/2 md:top-1/2"
      >
        <motion.span
          style={haloStyle}
          className="pointer-events-none absolute -inset-3 rounded-md bg-terracotta/20 blur-[8px]"
        />
        <ChipPixel size={26} />
      </motion.button>
      {year ? (
        <span
          className={`pointer-events-none hidden md:block absolute top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold tracking-[0.16em] text-muted ${isLeft ? "left-[calc(50%+28px)]" : "right-[calc(50%+28px)] text-right"}`}
        >
          {year}
        </span>
      ) : null}
      <motion.article
        initial={{ opacity: 0, y: 16 } as unknown as Record<string, unknown>}
        whileInView={{ opacity: 1, y: 0 } as unknown as Record<string, unknown>}
        viewport={{ amount: 0.3, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 0.55, ease: EASE }}
        onClick={onJump}
        whileHover={{ y: -3, scale: 1.01 } as unknown as Record<string, unknown>}
        whileTap={{ scale: 0.98 }}
        style={cardStyle}
        className={`warm-card relative z-[2] w-[calc(100%-56px)] shrink-0 cursor-pointer p-5 md:w-[440px] md:min-w-[440px] md:max-w-[440px] md:p-6 ${isLeft ? "md:mr-auto md:ml-0" : "md:ml-auto md:mr-0"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone={e.tone}>{period}</Tag>
              {year ? (
                <span className="inline-flex md:hidden items-center rounded-full border border-border bg-cream-deep px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-muted">
                  {year}
                </span>
              ) : null}
            </div>
            <h3 className="mt-4 font-sans text-xl font-semibold uppercase tracking-[0.06em] md:text-2xl">
              {role}
            </h3>
            <p className="mt-1 text-sm text-muted">{org}</p>
          </div>
          <motion.span style={iconStyle} className="shrink-0">
            <Icon size={24} />
          </motion.span>
        </div>
        <button
          type="button"
          onClick={(ev) => {
            ev.stopPropagation();
            setOpen((v) => !v);
          }}
          className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-terracotta hover:text-[#d46a52]"
        >
          {open
            ? (t.experience as { hideDetail: string }).hideDetail
            : (t.experience as { showDetail: string }).showDetail}
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: EASE }}
              className="overflow-hidden"
            >
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {points.map((p) => (
                  <li key={p} className="flex gap-3 text-sm leading-relaxed text-muted">
                    <motion.span
                      style={bulletStyle}
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    />
                    {p}
                  </li>
                ))}
              </ul>
              {(e as { certificateHref?: string }).certificateHref && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      const href = (e as { certificateHref: string }).certificateHref;
                      const isCoarse =
                        typeof window !== "undefined" &&
                        (window.matchMedia("(pointer: coarse)").matches ||
                          window.innerWidth <= 768);
                      if (isCoarse) {
                        window.open(href, "_blank", "noopener,noreferrer");
                        return;
                      }
                      onOpenCert?.(href);
                    }}
                    className="warm-btn primary xs"
                  >
                    {(t.experience as { viewCert: string }).viewCert} <ArrowUpRight size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={async (ev) => {
                      ev.stopPropagation();
                      const href = (e as { certificateHref: string }).certificateHref;
                      try {
                        const res = await fetch(href);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = href.split("/").pop() || "sertifikat.pdf";
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      } catch {
                        window.open(href, "_blank", "noopener,noreferrer");
                      }
                    }}
                    className="warm-btn ghost xs"
                  >
                    {(t.experience as { download: string }).download} <Download size={12} />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    </div>
  );
}

function PdfBlobViewer({
  href,
  title,
  failed,
  onFailed,
}: {
  href: string;
  title: string;
  failed: boolean;
  onFailed: () => void;
}) {
  const { lang } = useLang();
  const viewer = (
    dict[lang] as unknown as { viewer: { loading: string; blocked: string; openPdf: string } }
  ).viewer;
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    setLoading(true);
    setBlobUrl(null);
    fetch(href)
      .then((r) => {
        if (!r.ok) throw new Error(`fetch ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        onFailed();
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [href, onFailed]);
  if (loading) {
    return (
      <div className="flex min-h-[62dvh] flex-1 items-center justify-center border border-border bg-white px-4 font-mono text-xs text-muted sm:min-h-[52vh]">
        {viewer.loading}
      </div>
    );
  }
  if (failed || !blobUrl) {
    return (
      <div className="flex min-h-[62dvh] flex-1 flex-col items-center justify-center gap-3 border border-border bg-cream p-6 text-center sm:min-h-[52vh]">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-cream-deep text-terracotta">
          <FileText size={22} />
        </span>
        <p className="font-mono text-xs leading-relaxed text-muted">{viewer.blocked}</p>
        <a href={href} target="_blank" rel="noreferrer" className="warm-btn primary xs">
          {viewer.openPdf}
        </a>
      </div>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <iframe
        src={blobUrl}
        title={title}
        className="h-[62dvh] w-full flex-1 border border-border bg-white sm:h-full sm:min-h-[52vh]"
      />
    </div>
  );
}

function CertificateViewer({
  href,
  open,
  onClose,
  kind = "certificate",
}: {
  href: string | null;
  open: boolean;
  onClose: () => void;
  kind?: "certificate" | "article";
}) {
  const { lang } = useLang();
  const t = dict[lang];
  const viewer = (
    t as unknown as {
      viewer: {
        certificate: string;
        article: string;
        openInNewTab: string;
        hintFailed: string;
        hintMobile: string;
        loading: string;
        blocked: string;
        openPdf: string;
      };
    }
  ).viewer;
  const title = href
    ? (href.split("/").pop()?.replace(".pdf", "") ??
      (kind === "article"
        ? viewer.article.replace(" — KYRONIX", "")
        : viewer.certificate.replace(" — KYRONIX", "")))
    : "";
  const headerEyebrow = kind === "article" ? viewer.article : viewer.certificate;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [href, open]);
  useEffect(() => {
    if (!open) return;
    const y = lenisInstance?.scroll ?? window.scrollY;
    const prev = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    lenisInstance?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = prevHtml;
      window.removeEventListener("keydown", onKey);
      if (lenisInstance) {
        lenisInstance.start();
        lenisInstance.scrollTo(y, { immediate: true });
      } else {
        window.scrollTo(0, y);
      }
      requestAnimationFrame(() => lenisInstance?.resize());
    };
  }, [open]);
  const doDownload = async () => {
    if (!href) return;
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error("fetch pdf failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = href.split("/").pop() || "document.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
    } catch {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };
  return typeof document !== "undefined"
    ? createPortal(
        <AnimatePresence>
          {open && href && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-3 sm:p-4 md:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            >
              <div
                aria-hidden
                className="fixed inset-0 bg-[#0f0e0d]/75 backdrop-blur-[3px] supports-[backdrop-filter]:bg-[#0f0e0d]/65 max-sm:backdrop-blur-none max-sm:bg-[#0f0e0d]/85"
              />
              <motion.div
                initial={{ y: 16, scale: 0.98, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 8, scale: 0.98, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
                onClick={(e) => e.stopPropagation()}
                className="relative flex h-[min(92dvh,920px)] max-h-[92dvh] w-[min(96vw,1240px)] max-w-[1240px] flex-col overflow-hidden border border-border bg-surface shadow-[0_8px_32px_rgba(28,25,23,0.06)] md:shadow-[10px_10px_0_#E7E5E4]"
              >
                {/* header branded — bukan toolbar chrome */}
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-cream px-3 py-2.5 sm:px-4 sm:py-3">
                  <div className="min-w-0 flex items-center gap-2.5">
                    <img
                      src="/kyronix-k.webp"
                      alt="KYRONIX K"
                      width={28}
                      height={28}
                      className="hidden h-7 w-7 shrink-0 object-contain sm:inline-flex"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta sm:text-xs">
                        {headerEyebrow}
                      </p>
                      <p className="truncate font-mono text-[11px] font-bold uppercase tracking-widest text-ink sm:text-xs">
                        {title}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {kind === "article" && (
                      <button onClick={doDownload} className="warm-btn primary xs">
                        <Download size={14} />
                        {(t.projectModal as { download: string }).download}
                      </button>
                    )}
                    <a href={href} target="_blank" rel="noreferrer" className="warm-btn primary xs">
                      {viewer.openInNewTab}
                    </a>
                    <button
                      onClick={onClose}
                      aria-label={t.projectModal.close}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-border bg-transparent text-ink hover:border-terracotta hover:text-terracotta sm:h-9 sm:w-9"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                {/* pdf — Chrome HP fix: fetch blob → iframe blob:, object sering blok di Chrome Android */}
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#141414] p-2 sm:p-3">
                  <PdfBlobViewer
                    href={href}
                    title={title}
                    failed={failed}
                    onFailed={() => setFailed(true)}
                  />
                  <div className="flex shrink-0 items-center justify-center border-t border-border/20 pt-2 font-mono text-[11px] text-muted">
                    <span className="max-sm:text-xs">
                      {failed ? viewer.hintFailed : viewer.hintMobile}
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )
    : null;
}

function ExperienceOpening() {
  const { lang } = useLang();
  const t = dict[lang];
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const gridY = useTransform(scrollYProgress, [0, 1], [22, -22]);
  const titleY = useTransform(scrollYProgress, [0, 1], [14, -16]);
  const inView = useInView(ref, { amount: 0.35, margin: "0px 0px -12% 0px" });
  return (
    <section
      ref={ref}
      className="relative flex min-h-[56dvh] items-center justify-center overflow-visible px-[5vw] py-[6vh] md:min-h-[62dvh] md:py-[7vh]"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-[10%] -top-[8%] h-[640px] w-[900px] bg-terracotta/10 blur-[90px] max-sm:hidden"
        style={{ y: titleY } as unknown as Record<string, unknown>}
      />
      <div className="relative mx-auto max-w-[1120px] text-center">
        <motion.div
          style={{ y: titleY } as unknown as Record<string, unknown>}
          className="will-change-transform"
        >
          <Eyebrow index="" label={t.experience.eyebrow} />
          <SplitReveal
            key={t.experience.title}
            play={inView}
            text={t.experience.title}
            className="mx-auto max-w-4xl font-display text-[clamp(1.9rem,8.4vw,6.75rem)] font-extrabold leading-[0.95] tracking-[0.01em]"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 } as unknown as Record<string, unknown>}
            animate={
              inView
                ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                : ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
            }
            transition={{ duration: 0.6, ease: EASE, delay: inView ? 0.55 : 0.22 }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed sm:text-base"
            style={{ color: WARM.muted }}
          >
            {(t.experience as unknown as { subtitle: string }).subtitle}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

function Experience() {
  const { lang } = useLang();
  const t = dict[lang];
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dots, setDots] = useState<number[]>([0.22, 0.5, 0.78]);
  const [certHref, setCertHref] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 78%", "end 52%"] });
  // tuned lighter: slightly softer spring → fewer per-frame ticks, still buttery
  const smooth = useSpring(scrollYProgress, { stiffness: 165, damping: 34, mass: 0.45 });
  const pipe = useTransform(smooth, [0, 1], [0, 1]);
  const expOpacity = useTransform(smooth, [0, 1], [1, 0.92]);
  const ghostY = useTransform(smooth, [0, 1], [18, -18]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const trackRect = track.getBoundingClientRect();
      const h = track.offsetHeight || 1;
      const els = Array.from(track.querySelectorAll<HTMLElement>("[data-dot]"));
      if (els.length !== experience.length) return;
      const ys = els.map((el) => {
        const r = el.getBoundingClientRect();
        return (r.top - trackRect.top + r.height / 2) / h;
      });
      setDots(ys);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    // re-measure after fonts/layout settle
    const t = setTimeout(measure, 400);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, []);

  const jumpTo = (i: number) => {
    const el = itemRefs.current[i];
    if (!el) return;
    if (lenisInstance)
      lenisInstance.scrollTo(el, {
        offset: -140,
        duration: 1.1,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      });
    else el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div id="experience" className="relative bg-transparent overflow-x-clip">
      {/* Opening — full 100dvh EPIC */}
      <ExperienceOpening />
      {/* Timeline — cards-only */}
      <section
        ref={trackRef}
        className="relative px-[5vw] pb-[10vh] pt-3 md:pb-[10vh] overflow-x-clip"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 select-none font-display text-[22vw] font-black leading-none tracking-[0.02em] watermark will-change-transform max-sm:text-[30vw]"
          style={{ y: ghostY, opacity: 0.11 } as unknown as Record<string, unknown>}
        >
          {t.watermarks.jejak}
        </motion.div>
        <motion.div
          style={{ opacity: expOpacity } as unknown as Record<string, unknown>}
          className="mx-auto max-w-[1120px] will-change-transform"
        >
          <div className="relative">
            <div
              className="pointer-events-none absolute bottom-0 left-[14px] top-3 w-[2px] -translate-x-1/2 bg-border md:left-1/2"
              aria-hidden
            />
            {/* warm pipe — 100% desktop (no mobile split) */}
            <motion.div
              className="pointer-events-none absolute left-[14px] top-3 w-[18px] origin-top -translate-x-1/2 bg-terracotta/18 blur-[8px] md:left-1/2"
              style={{ scaleY: pipe, height: "100%" } as unknown as Record<string, unknown>}
              aria-hidden
            />
            <motion.div
              className="pointer-events-none absolute left-[14px] top-3 w-[5px] origin-top -translate-x-1/2 bg-terracotta md:left-1/2"
              style={
                {
                  scaleY: pipe,
                  height: "100%",
                  boxShadow:
                    "0 0 12px rgba(224,122,95,0.35), 0 0 26px rgba(224,122,95,0.18), 0 0 42px rgba(224,122,95,0.08)",
                } as unknown as Record<string, unknown>
              }
              aria-hidden
            />
            <div className="flex flex-col gap-8 md:gap-10">
              {experience.map((e, i) => (
                <div
                  key={(e.role as unknown as { id: string }).id ?? i}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                >
                  <ExpRow
                    e={e}
                    isLeft={i % 2 === 0}
                    dotPos={dots[i] ?? (i + 1) / (experience.length + 1)}
                    smooth={smooth}
                    onJump={() => jumpTo(i)}
                    onOpenCert={setCertHref}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        <CertificateViewer href={certHref} open={!!certHref} onClose={() => setCertHref(null)} />
      </section>
    </div>
  );
}

/* Via PCB: annular ring + lubang gelap di tengah */
function PcbVia({ x, y, r = 3.3 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#141211" stroke="currentColor" strokeWidth={1.35} />
      <circle cx={x} cy={y} r={r * 0.34} fill="currentColor" opacity={0.5} />
    </g>
  );
}

/* PCB mini "hidup" di dalam kartu — topologinya mengikuti makna tiap kata:
   01 UNDERSTAND = fan-in (banyak sumber → satu titik, ada test point probe)
   02 ASSEMBLE   = backplane + modul dicolok + konektor jantan/betina hampir menyatu
   03 RUN        = rel power → driver → fan-out + LED status */
function LabPcbLive({ variant }: { variant: 0 | 1 | 2 }) {
  const pourId = `lab-pour-${variant}`;
  // geser tiap jalur bundle sejajar; sudut tetap 45° karena dx = dy di semua belokan
  const route = (pts: readonly (readonly [number, number])[], dy: number) =>
    "M " + pts.map(([x, y]) => `${x} ${y + dy}`).join(" L ");
  const trace = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.15,
    strokeLinejoin: "miter",
    strokeLinecap: "square",
  } as const;
  const power = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.6,
    strokeLinejoin: "miter",
    strokeLinecap: "square",
    opacity: 0.7,
  } as const;
  const pulse = {
    fill: "none",
    stroke: "#E8A07A",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "lab-pcb-flow",
  } as const;
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 130"
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none h-full w-full text-terracotta/[0.34]"
    >
      <defs>
        <pattern id={pourId} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="0.8" fill="currentColor" opacity={0.42} />
        </pattern>
      </defs>

      {variant === 0 && (
        <>
          <rect x="210" y="6" width="104" height="34" fill={`url(#${pourId})`} stroke="none" />
          <g {...trace}>
            {/* fan-in: 5 jalur dari banyak arah menyatu ke satu titik */}
            <path d="M2 16 H32 L86 70" />
            <path d="M2 38 H54 L86 70" />
            <path d="M2 70 H86" />
            <path d="M2 96 H60 L86 70" />
            <path d="M2 118 H38 L86 70" />
            {/* test point: probe osiloskop di atas titik temu */}
            <path d="M86 70 V44" />
            <circle cx="86" cy="38" r="5.4" />
            <circle cx="86" cy="38" r="2.5" opacity="0.65" />
            {/* blok SCAN + die grid (peta sistem) */}
            <path d="M86 70 H108" />
            <rect x="108" y="44" width="76" height="52" />
            <path d="M108 54 H98 M108 86 H98" />
            <rect x="116" y="54" width="12" height="12" opacity="0.7" />
            <rect x="134" y="54" width="12" height="12" opacity="0.7" />
            <rect x="152" y="54" width="12" height="12" opacity="0.7" />
            <rect x="116" y="74" width="12" height="12" opacity="0.7" />
            <rect x="134" y="74" width="12" height="12" opacity="0.7" />
            <rect x="152" y="74" width="12" height="12" opacity="0.7" />
            {/* keluaran */}
            <path d="M184 70 H214 L234 50 H300" />
            <path d="M214 70 V104 H250" />
            {/* keepout pour */}
            <rect x="210" y="6" width="104" height="34" opacity="0.5" />
          </g>
          <path {...power} d="M0 6 H60 L80 26 H196" />
          <PcbVia x={86} y={70} r={4.2} />
          <PcbVia x={300} y={50} r={3} />
          <PcbVia x={250} y={104} r={3} />
          <PcbVia x={196} y={26} r={3} />
          <g fill="#E8A07A" stroke="none" opacity="0.45">
            <circle cx="122" cy="30" r="1.8" />
            <circle cx="272" cy="118" r="1.6" />
            <circle cx="62" cy="112" r="1.6" />
          </g>
          <path d="M2 16 H32 L86 70" {...pulse} />
          <path d="M2 38 H54 L86 70" {...pulse} style={{ animationDelay: "-1.2s" }} />
          <path d="M2 118 H38 L86 70" {...pulse} style={{ animationDelay: "-2.4s" }} />
        </>
      )}

      {variant === 1 && (
        <>
          <rect x="272" y="6" width="42" height="34" fill={`url(#${pourId})`} stroke="none" />
          <rect x="6" y="98" width="64" height="26" fill={`url(#${pourId})`} stroke="none" />
          <g {...trace}>
            {/* backplane: dua rail horizontal */}
            <path d="M0 74 H318" strokeWidth="2.2" />
            <path d="M0 86 H318" strokeWidth="2.8" opacity="0.75" />
            {/* tiga modul yang dicolok ke rail */}
            <rect x="86" y="40" width="48" height="30" />
            <rect x="150" y="36" width="48" height="34" />
            <rect x="214" y="44" width="48" height="26" />
            {[96, 110, 124, 160, 174, 188, 224, 238, 252].map((x) => (
              <rect key={x} x={x} y="70" width="5" height="5" opacity="0.8" />
            ))}
            {/* konektor betina + jantan yang hampir menyatu (momen "merakit") */}
            <rect x="10" y="46" width="30" height="38" />
            <path d="M18 52 V78 M26 52 V78 M34 52 V78" />
            <rect x="46" y="50" width="26" height="40" />
            <path d="M46 58 H41 M46 70 H41 M46 82 H41" />
            <path d="M26 84 V86" />
            <path d="M72 70 H86" />
            {/* fan-out modul ke tepi atas */}
            <path d="M110 40 V22 L94 6" />
            <path d="M174 36 V26 L190 10 H300" />
            <path d="M238 44 V30 L254 14 H300" />
            {/* keepout pour */}
            <rect x="272" y="6" width="42" height="34" opacity="0.5" />
            <rect x="6" y="98" width="64" height="26" opacity="0.5" />
          </g>
          <PcbVia x={110} y={22} r={3} />
          <PcbVia x={174} y={26} r={3} />
          <PcbVia x={238} y={30} r={3} />
          <PcbVia x={300} y={12} r={3} />
          {/* kilatan saat konektor "mengunci" */}
          <circle cx="43" cy="70" r="3.2" fill="#E8A07A" stroke="none" className="lab-pcb-flash" />
          <g fill="#E8A07A" stroke="none" opacity="0.45">
            <circle cx="62" cy="112" r="1.6" />
            <circle cx="196" cy="66" r="1.8" />
            <circle cx="288" cy="26" r="1.6" />
          </g>
          <path d="M0 86 H318" {...pulse} />
          <path d="M318 74 H0" {...pulse} style={{ animationDelay: "-1.8s" }} />
        </>
      )}

      {variant === 2 && (
        <>
          <rect x="6" y="98" width="72" height="26" fill={`url(#${pourId})`} stroke="none" />
          <rect x="196" y="6" width="118" height="10" fill={`url(#${pourId})`} stroke="none" />
          <g {...trace}>
            {/* masuk + blok keluaran */}
            <path d="M2 44 H18 M2 80 H18" />
            <rect x="18" y="30" width="74" height="64" />
            <path d="M92 40 H100 M92 84 H100" />
            {/* fan-out atas (4 jalur) */}
            {[0, 1, 2, 3].map((i) => (
              <path
                key={`u${i}`}
                d={route(
                  [
                    [92, 46],
                    [148, 46],
                    [168, 26],
                    [318, 26],
                  ],
                  i * 8,
                )}
              />
            ))}
            {/* fan-out bawah (3 jalur) */}
            {[0, 1, 2].map((i) => (
              <path
                key={`d${i}`}
                d={route(
                  [
                    [92, 84],
                    [150, 84],
                    [170, 104],
                    [318, 104],
                  ],
                  -i * 8,
                )}
              />
            ))}
            {/* LED status di jalur keluaran */}
            <path d="M318 66 H295" />
            <circle cx="292" cy="66" r="7" opacity="0.35" />
            <circle cx="292" cy="66" r="3.6" />
            {/* keepout pour */}
            <rect x="6" y="98" width="72" height="26" opacity="0.5" />
            <rect x="196" y="6" width="118" height="10" opacity="0.5" />
          </g>
          <circle cx="292" cy="66" r="1.8" fill="#E8A07A" stroke="none" className="lab-pcb-blink" />
          <path {...power} d="M92 100 H128 L148 120 H318" />
          <PcbVia x={148} y={46} r={3} />
          <PcbVia x={148} y={62} r={3} />
          <PcbVia x={150} y={84} r={3} />
          <PcbVia x={100} y={46} r={3} />
          <g fill="#E8A07A" stroke="none" opacity="0.45">
            <circle cx="60" cy="22" r="1.8" />
            <circle cx="228" cy="66" r="2" />
            <circle cx="132" cy="14" r="1.6" />
          </g>
          <path
            d={route(
              [
                [92, 46],
                [148, 46],
                [168, 26],
                [318, 26],
              ],
              0,
            )}
            {...pulse}
          />
          <path
            d={route(
              [
                [92, 84],
                [150, 84],
                [170, 104],
                [318, 104],
              ],
              0,
            )}
            {...pulse}
            style={{ animationDelay: "-1.8s" }}
          />
        </>
      )}
    </svg>
  );
}

/* ---------- 5. How I Work — Systems over Syntax (Warm) ---------- */
function Lab() {
  const { lang } = useLang();
  const t = dict[lang];
  const isMobile = useIsMobile();
  const steps = t.labSteps;
  const openingRef = useRef<HTMLElement>(null);
  const { scrollYProgress: openingProgress } = useScroll({
    target: openingRef,
    offset: ["start end", "end start"],
  });
  const labGridY = useTransform(openingProgress, [0, 1], [22, -22]);
  const labTitleY = useTransform(openingProgress, [0, 1], [14, -14]);
  const labInView = useInView(openingRef, { amount: 0.35, margin: "0px 0px -12% 0px" });
  // Parallax 3 tahap — masuk: HILANG → RENGGANG → POSISI · keluar: POSISI → RENGGANG → HILANG
  const labStepsRef = useRef<HTMLElement>(null);
  const { scrollYProgress: labStepsProgress } = useScroll({
    target: labStepsRef,
    offset: ["start end", "end start"],
  });
  const reduceLabMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const labParallaxOff = reduceLabMotion || isMobile;
  // 1 = renggang (baris lebar) · 0 = fix (bentuk V) — plateau di tengah biar enak dibaca
  // FIX sengaja dimajukan ke 0.24: V harus sudah utuh + kabel nyambung SEBELUM panggung
  // mencapai titik tengah layar (progress ±0.43-0.48), jadi momen "paling enak dilihat" = sirkuit penuh
  const labSpreadRaw = useTransform(labStepsProgress, [0.05, 0.24, 0.86, 1], [1, 0, 0, 1]);
  const labSpread = useTransform(labSpreadRaw, (s) => (labParallaxOff ? 0 : s));
  // kartu: hilang di tepi timeline, penuh saat renggang & fix
  const labCardFadeRaw = useTransform(labStepsProgress, [0.04, 0.22, 0.9, 1], [0, 1, 1, 0]);
  const labCardFade = useTransform(labCardFadeRaw, (v) => (labParallaxOff ? 1 : v));
  const labStepsGridY = useTransform(labStepsProgress, [0, 1], [-38, 38]);
  // PCB "ditarik": 1 = kabel tersembunyi · 0 = kabel penuh.
  // Baru mulai setelah kartu BENAR-BENAR fix di V (0.24), lalu A dulu → B (bertahap),
  // dan SUDAH penuh di 0.40 — sebelum V duduk di tengah layar.
  // Keluar: B ditarik balik dulu, lalu A.
  const labCableARaw = useTransform(labStepsProgress, [0.26, 0.33, 0.78, 0.86], [1, 0, 0, 1]);
  const labCableBRaw = useTransform(labStepsProgress, [0.34, 0.4, 0.7, 0.78], [1, 0, 0, 1]);
  const labCableA = useTransform(labCableARaw, (v) => (labParallaxOff ? 0 : v));
  const labCableB = useTransform(labCableBRaw, (v) => (labParallaxOff ? 0 : v));
  // trigger animasi bertahap kartu 01 → 02 → 03
  const labCanvasRef = useRef<HTMLDivElement>(null);
  const labPlay = useInView(labCanvasRef, { amount: 0.25, once: true });
  const labStepsMeta = [
    { code: "SYS-01 // INPUT" },
    { code: "SYS-02 // PROCESS" },
    { code: "SYS-03 // OUTPUT" },
  ] as const;
  // PCB — static V: 01 & 03 naik, 02 tengah-bawah; jalur derive dari positions (tidak draggable)
  const STAGE_W = 1360;
  const STAGE_H = 545;
  const V_POS = {
    "card-1": { x: 18, y: 14 },
    "card-2": { x: 480, y: 125 },
    "card-3": { x: 942, y: 14 },
  } as const;
  const vCard = 400;
  // panggung V di-scale turun kalau layar desktop tidak cukup lebar (biar kartu tidak kepotong)
  const [stageScale, setStageScale] = useState(1);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isMobile) return;
    const el = stageWrapRef.current;
    if (!el) return;
    const update = () => setStageScale(Math.min(1, el.clientWidth / STAGE_W));
    update();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => update()) : undefined;
    ro?.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [isMobile]);
  const vC1 = V_POS["card-1"];
  const vC2 = V_POS["card-2"];
  const vC3 = V_POS["card-3"];
  // arah "renggang": 01 & 03 melebar ke samping + turun, 02 naik — V terbuka jadi baris lebar
  const SPREAD = {
    "card-1": { x: -108, y: 66 },
    "card-2": { x: 0, y: -30 },
    "card-3": { x: 108, y: 66 },
  } as const;
  const card1X = useTransform(labSpread, (s) => vC1.x + s * SPREAD["card-1"].x);
  const card1Y = useTransform(labSpread, (s) => vC1.y + s * SPREAD["card-1"].y);
  const card2X = useTransform(labSpread, (s) => vC2.x + s * SPREAD["card-2"].x);
  const card2Y = useTransform(labSpread, (s) => vC2.y + s * SPREAD["card-2"].y);
  const card3X = useTransform(labSpread, (s) => vC3.x + s * SPREAD["card-3"].x);
  const card3Y = useTransform(labSpread, (s) => vC3.y + s * SPREAD["card-3"].y);
  const cardXY = [
    { x: card1X, y: card1Y },
    { x: card2X, y: card2Y },
    { x: card3X, y: card3Y },
  ];
  // geometri kabel dihitung dari posisi kartu yang sedang di-offset (bukan V statis),
  // jadi ujung jalur selalu nempel di port walau kartu sedang renggang
  const tracesAt = (s: number) => {
    const o1 = { x: vC1.x + s * SPREAD["card-1"].x, y: vC1.y + s * SPREAD["card-1"].y };
    const o2 = { x: vC2.x + s * SPREAD["card-2"].x, y: vC2.y + s * SPREAD["card-2"].y };
    const o3 = { x: vC3.x + s * SPREAD["card-3"].x, y: vC3.y + s * SPREAD["card-3"].y };
    const p1Out = { x: o1.x + vCard, y: o1.y + vCard / 2 };
    const p2In = { x: o2.x, y: o2.y + vCard / 2 };
    const p2Out = { x: o2.x + vCard, y: o2.y + vCard / 2 };
    const p3In = { x: o3.x, y: o3.y + vCard / 2 };
    const m1 = (p1Out.x + p2In.x) / 2;
    const m2 = (p2Out.x + p3In.x) / 2;
    return {
      d1: `M ${p1Out.x} ${p1Out.y} L ${m1 - 20} ${p1Out.y} L ${m1 + 20} ${p2In.y} L ${p2In.x} ${p2In.y}`,
      d2: `M ${p2Out.x} ${p2Out.y} L ${m2 - 20} ${p2Out.y} L ${m2 + 20} ${p3In.y} L ${p3In.x} ${p3In.y}`,
    };
  };
  const basePath1 = useRef<SVGPathElement>(null);
  const basePath2 = useRef<SVGPathElement>(null);
  const pulsePath1 = useRef<SVGPathElement>(null);
  const pulsePath2 = useRef<SVGPathElement>(null);
  const syncTraces = (s: number) => {
    const { d1, d2 } = tracesAt(s);
    basePath1.current?.setAttribute("d", d1);
    pulsePath1.current?.setAttribute("d", d1);
    basePath2.current?.setAttribute("d", d2);
    pulsePath2.current?.setAttribute("d", d2);
  };
  // dashoffset + opacity kabel ditulis langsung ke DOM (SVG biasa tidak bisa baca MotionValue),
  // pulse baru menyala setelah garis dasarnya selesai ditarik
  const syncCable = (path: SVGPathElement | null, pulse: SVGPathElement | null, v: number) => {
    path?.style.setProperty("stroke-dashoffset", String(v));
    pulse?.style.setProperty("opacity", String(1 - Math.min(1, v / 0.2)));
  };
  useMotionValueEvent(labCableA, "change", (v) =>
    syncCable(basePath1.current, pulsePath1.current, v),
  );
  useMotionValueEvent(labCableB, "change", (v) =>
    syncCable(basePath2.current, pulsePath2.current, v),
  );
  useMotionValueEvent(labSpread, "change", syncTraces);
  useEffect(() => {
    syncTraces(labSpread.get());
    syncCable(basePath1.current, pulsePath1.current, labCableA.get());
    syncCable(basePath2.current, pulsePath2.current, labCableB.get());
  }, []);
  const traceNow = tracesAt(labSpread.get());
  return (
    <div id="lab" className="relative bg-transparent overflow-x-clip">
      {/* Opening — full 100dvh EPIC — enter+exit 1 blok */}
      <section
        ref={openingRef}
        className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 sm:px-[5vw] py-[12vh] max-md:min-h-[76dvh] max-md:py-[8vh]"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[80%] -translate-x-1/2 -translate-y-1/2 select-none font-display text-[22vw] font-black leading-none tracking-[0.02em] watermark will-change-transform max-sm:top-[84%] max-sm:text-[30vw]"
          style={{ y: labTitleY, opacity: 0.11 } as unknown as Record<string, unknown>}
        >
          {t.watermarks.cara}
        </motion.div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[1]"
          style={
            {
              y: labGridY,
              backgroundImage:
                "linear-gradient(to right, rgba(224,122,95,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(224,122,95,0.04) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            } as unknown as Record<string, unknown>
          }
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-[10%] top-[16%] h-[420px] w-[520px] bg-sage/10 blur-[60px] max-sm:hidden"
          style={{ y: labTitleY } as unknown as Record<string, unknown>}
        />
        <div className="relative mx-auto w-full max-w-[1120px] min-w-0 text-center">
          <motion.div
            style={{ y: labTitleY } as unknown as Record<string, unknown>}
            className="will-change-transform"
          >
            <div className="flex justify-center">
              <Eyebrow index="" label={t.labEyebrow} />
            </div>
            <SplitReveal
              key={t.labTitle}
              play={labInView}
              text={t.labTitle}
              className="mx-auto max-w-3xl font-display text-[clamp(1.9rem,8.4vw,6.75rem)] font-extrabold leading-[0.95] tracking-[0.01em] text-ink"
            />
            <motion.p
              initial={{ opacity: 0, y: 10 } as unknown as Record<string, unknown>}
              animate={
                labInView
                  ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                  : ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>)
              }
              transition={{ duration: 0.6, ease: EASE, delay: labInView ? 0.55 : 0.22 }}
              className="mx-auto mt-6 max-w-2xl leading-relaxed"
              style={{ color: WARM.muted }}
            >
              {t.labDesc}
            </motion.p>
          </motion.div>
        </div>
      </section>
      {/* Steps — V: 01 & 03 naik, 02 turun; parallax renggang → fix → renggang + PCB */}
      <section
        ref={labStepsRef}
        className="relative overflow-x-clip px-4 sm:px-[5vw] pb-[10vh] pt-0 max-md:pb-[6vh] max-md:pt-2"
      >
        <div
          ref={labCanvasRef}
          className="relative mx-auto w-full overflow-visible max-md:min-h-0"
          style={isMobile ? undefined : { height: Math.round(STAGE_H * stageScale) }}
        >
          {/* pengukur lebar (tidak ikut di-scale) */}
          <div
            ref={stageWrapRef}
            className="absolute inset-x-0 top-0 max-md:static"
            style={isMobile ? undefined : { height: STAGE_H }}
          >
            <div
              className="relative max-md:w-full"
              style={
                isMobile
                  ? undefined
                  : {
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      width: STAGE_W,
                      height: STAGE_H,
                      marginLeft: -STAGE_W / 2,
                      transform: `scale(${stageScale})`,
                      transformOrigin: "top center",
                    }
              }
            >
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.06] max-md:hidden"
                style={
                  {
                    y: labParallaxOff ? 0 : labStepsGridY,
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(245,239,230,0.9) 1px, transparent 0)`,
                    backgroundSize: "24px 24px",
                  } as unknown as Record<string, unknown>
                }
              />
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden md:block"
                aria-hidden
              >
                <defs>
                  <linearGradient id="traceGradV" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#C4713C" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#C4713C" />
                  </linearGradient>
                  <filter id="glowV" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  ref={basePath1}
                  d={traceNow.d1}
                  pathLength={1}
                  fill="none"
                  stroke="#3A3632"
                  strokeWidth="3"
                  strokeOpacity="0.55"
                  className="lab-trace"
                />
                <path
                  ref={basePath2}
                  d={traceNow.d2}
                  pathLength={1}
                  fill="none"
                  stroke="#3A3632"
                  strokeWidth="3"
                  strokeOpacity="0.55"
                  className="lab-trace"
                />
                <path
                  ref={pulsePath1}
                  d={traceNow.d1}
                  fill="none"
                  stroke="url(#traceGradV)"
                  strokeWidth="3"
                  filter="url(#glowV)"
                  strokeDasharray="40 120"
                  className={`lab-trace-pulse ${labPlay ? "is-in" : ""}`}
                />
                <path
                  ref={pulsePath2}
                  d={traceNow.d2}
                  fill="none"
                  stroke="url(#traceGradV)"
                  strokeWidth="3"
                  filter="url(#glowV)"
                  strokeDasharray="40 120"
                  className={`lab-trace-pulse ${labPlay ? "is-in" : ""}`}
                />
              </svg>
              {/* Desktop V abs — 01 & 03 naik, 02 turun; Mobile stack sejajar */}
              {steps.map((step, idx) => {
                const cmds =
                  lang === "en"
                    ? ([
                        "> understand --analyze",
                        "> assemble --orchestrate",
                        "> run --deploy",
                      ] as const)
                    : ([
                        "> pahami --analyze",
                        "> rakit --orchestrate",
                        "> jalankan --deploy",
                      ] as const);
                const meta = labStepsMeta[idx]!;
                return (
                  // OUTER: pemegang posisi V — bebas dari `position:relative` & `transform` milik .warm-card
                  <motion.div
                    key={step.title}
                    style={
                      {
                        // mobile: kartu ditumpuk statis — nolkan offset V supaya 02 & 03 tidak terdorong ke kanan
                        x: isMobile ? 0 : cardXY[idx]!.x,
                        y: isMobile ? 0 : cardXY[idx]!.y,
                        opacity: labCardFade,
                        "--lab-card": `${vCard}px`,
                      } as unknown as Record<string, unknown>
                    }
                    className="absolute top-0 left-0 z-10 will-change-transform max-md:static max-md:mx-auto max-md:mb-4 max-md:w-full max-md:max-w-[340px] md:w-[var(--lab-card)]"
                  >
                    {/* port PCB — nempel di tepi kartu, otomatis ikut gerak bareng kartu.
                    dirender SEBELUM glow/kartu (z-0) supaya separuh lingkarannya tertutup kartu */}
                    {idx < 2 && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute right-0 top-1/2 z-0 hidden -translate-y-1/2 translate-x-1/2 md:block"
                      >
                        <span className="flex h-[12px] w-[12px] items-center justify-center rounded-full border-2 border-terracotta bg-[#1A1816]">
                          <span
                            className="lab-via-ring block h-[5px] w-[5px] rounded-full bg-terracotta"
                            style={{ animationDelay: `${0.5 + idx * 0.28}s` }}
                          />
                        </span>
                      </span>
                    )}
                    {idx > 0 && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute left-0 top-1/2 z-0 hidden -translate-y-1/2 -translate-x-1/2 md:block"
                      >
                        <span className="flex h-[12px] w-[12px] items-center justify-center rounded-full border-2 border-terracotta bg-[#1A1816]">
                          <span
                            className="lab-via-ring block h-[5px] w-[5px] rounded-full bg-terracotta"
                            style={{ animationDelay: `${0.64 + idx * 0.28}s` }}
                          />
                        </span>
                      </span>
                    )}
                    {/* GLOW: pembawa box-shadow terracotta (di luar .warm-card biar tidak tabrak hover) */}
                    <div
                      className={`lab-card-glow ${labPlay ? "is-in" : ""}`}
                      style={{ animationDelay: `${idx * 0.28}s, ${1.5 + idx * 0.55}s` }}
                    >
                      {/* RISE: naik + clip reveal */}
                      <div
                        className={`lab-card-wrap ${labPlay ? "is-in" : ""}`}
                        style={{ animationDelay: `${idx * 0.28}s` }}
                      >
                        {(() => {
                          const raw = step.title.toUpperCase();
                          const map: Record<string, [string, string]> = {
                            UNDERSTAND: ["UNDER", "STAND"],
                            ASSEMBLE: ["ASSEM", "BLE"],
                            RUN: ["RUN", ""],
                            PAHAMI: ["PAHA", "MI"],
                            RAKIT: ["RA", "KIT"],
                            JALANKAN: ["JALAN", "KAN"],
                          };
                          const split = map[raw] ?? (() => {
                            const mid = Math.ceil(raw.length / 2);
                            return [raw.slice(0, mid), raw.slice(mid)] as [string, string];
                          })();
                          const renderOutline = (word: string) =>
                            word.split("").map((ch, ci) => {
                              if (ch === "A") {
                                return (
                                  <span key={ci} className="relative inline-block">
                                    <span className="text-transparent [-webkit-text-stroke:1.4px_#F5EFE6]">A</span>
                                    <span aria-hidden className="pointer-events-none absolute left-[8%] right-[8%] top-[52%] h-[1.6px] -translate-y-1/2 bg-[#F5EFE6]">
                                      <span className="absolute right-0 top-1/2 h-[7px] w-[7px] -translate-y-1/2 translate-x-[1px] border-r-[1.6px] border-t-[1.6px] border-[#F5EFE6] rotate-45" />
                                    </span>
                                  </span>
                                );
                              }
                              return (
                                <span key={ci} className="text-transparent [-webkit-text-stroke:1.4px_#F5EFE6]">
                                  {ch}
                                </span>
                              );
                            });
                          return (
                            <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#12100F] p-7 md:min-h-[420px] md:aspect-square md:p-8">
                              {/* glow top-right orange */}
                              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-[280px] w-[280px] rounded-full bg-[#C4713C]/20 blur-[60px]" />
                              {/* glow bottom-left subtle */}
                              <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 h-[220px] w-[220px] rounded-full bg-[#F5EFE6]/[0.06] blur-[50px]" />
                              <div className="relative flex items-start justify-between font-mono text-[10px] tracking-[0.2em] text-white/35">
                                <span>{meta.code}</span>
                                <span className="text-white/40">0{idx + 1}</span>
                              </div>
                              <div className="relative mt-7">
                                <h3 className="font-display font-black leading-[0.85] tracking-[-0.03em] text-[clamp(3.05rem,9vw,4.35rem)]">
                                  <span className="block text-[#F5EFE6]">{split[0]}</span>
                                  {split[1] ? (
                                    <span className="block mt-1 flex flex-wrap">{renderOutline(split[1])}</span>
                                  ) : null}
                                </h3>
                              </div>
                              <p className="relative mt-auto pt-10 text-[14px] leading-[1.6] text-white/55 [overflow-wrap:anywhere]">
                                {step.desc}
                              </p>
                              <div className="relative mt-4 flex justify-end">
                                <span className="font-display font-black text-[18px] tracking-[0.02em] text-[#D6B87A]">0{idx + 1}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- 6. Contact / footer (Retro) ---------- */
function Contact() {
  const { lang } = useLang();
  const low = useIsLowEnd();
  const t = dict[lang] as (typeof dict)["id"] & {
    contactForm: {
      name: string;
      email: string;
      subject: string;
      phone: string;
      message: string;
      send: string;
      sending: string;
      success: string;
      error: string;
      namePh: string;
      emailPh: string;
      subjectPh: string;
      phonePh: string;
      messagePh: string;
    };
  };
  const email = "supyansauri47@gmail.com";
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    const fallbackCopy = () => {
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      ta.style.pointerEvents = "none";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      ta.remove();
      return ok;
    };
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else if (!fallbackCopy()) throw new Error("no clipboard");
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      if (fallbackCopy()) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    }
  };
  const [f, setF] = useState({
    name: "",
    email: "",
    subject: "",
    phone: "",
    message: "",
    _gotcha: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [showCvModal, setShowCvModal] = useState(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  // load turnstile once if key exists
  useEffect(() => {
    if (!siteKey) return;
    if (document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) return;
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }, [siteKey]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f._gotcha) {
      setStatus("success");
      setMsg(t.contactForm.success);
      setFieldErrors({});
      return;
    }
    const errors: typeof fieldErrors = {};
    const nameTrim = f.name.trim();
    const emailTrim = f.email.trim();
    const msgTrim = f.message.trim();
    if (!nameTrim) errors.name = lang === "id" ? "Nama wajib diisi." : "Name is required.";
    else if (nameTrim.length < 2) errors.name = lang === "id" ? "Nama minimal 2 huruf." : "Name must be at least 2 characters.";
    if (!emailTrim) errors.email = lang === "id" ? "Email wajib diisi." : "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) errors.email = lang === "id" ? "Email tidak valid." : "Invalid email.";
    if (!msgTrim) errors.message = lang === "id" ? "Pesan wajib diisi." : "Message is required.";
    else if (msgTrim.length < 10) errors.message = lang === "id" ? "Pesan minimal 10 karakter." : "Message must be at least 10 characters.";
    if (Object.keys(errors).length) {
      setStatus("error");
      setMsg(Object.values(errors)[0] ?? "");
      setFieldErrors(errors);
      return;
    }
    setStatus("loading");
    setMsg("");
    setFieldErrors({});
    let turnstileToken = "";
    try {
      const w = window as unknown as { turnstile?: { getResponse: (id?: string) => string } };
      turnstileToken =
        w.turnstile?.getResponse() ??
        document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ??
        "";
    } catch {}
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, turnstileToken }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) throw new Error(j.error || "Gagal");
      setStatus("success");
      setMsg(t.contactForm.success);
      setF({ name: "", email: "", subject: "", phone: "", message: "", _gotcha: "" });
      try {
        (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
      } catch {}
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : t.contactForm.error);
    }
  };

  return (
    <footer
      id="contact"
      className="relative flex min-h-[100dvh] flex-col justify-between overflow-hidden bg-transparent px-[5vw] pb-4 max-lg:min-h-0 max-lg:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:py-[4vh]"
    >
      <div aria-hidden className="hidden pointer-events-none absolute inset-0 opacity-[0.4]" />
      {/* grain mengganti orb duplikat Hero biar fase beda */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(245,239,230,0.9) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 select-none font-display text-[22vw] font-black leading-none tracking-[0.02em] watermark max-sm:text-[24vw]"
        style={{ opacity: 0.11 } as unknown as React.CSSProperties}
      >
        {t.watermarks.kontak}
      </div>
      <div className="relative mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center">
        <div className="text-center">
          <Eyebrow index="" label={t.contactEyebrow} />
          <SplitReveal
            key={t.contactTitle}
            text={t.contactTitle}
            className="font-display text-[clamp(2.2rem,7vw,5.2rem)] leading-[0.95] tracking-[0.02em] text-ink max-lg:text-[clamp(2.6rem,8.5vw,6.75rem)] font-extrabold"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.4, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
            className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed lg:mt-4 lg:text-[16px]"
            style={{ color: WARM.muted }}
          >
            {t.contactDesc}
          </motion.p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-[1.35fr_0.65fr] md:items-start lg:mt-7 lg:gap-7">
          <motion.form
            onSubmit={onSubmit}
            noValidate
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.24 }}
            className="w-full text-left"
          >
            <div className="warm-card p-4 lg:p-5">
              {/* honeypot — hidden dari user, bot isi = block */}
              <input
                type="text"
                name="_gotcha"
                value={f._gotcha}
                onChange={(e) => setF({ ...f, _gotcha: e.target.value })}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="hidden"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span
                    className="font-mono text-[11px] uppercase tracking-widest"
                    style={{ color: WARM.muted }}
                  >
                    {t.contactForm.name} *
                  </span>
                  <input
                    value={f.name}
                    onChange={(e) => { setF({ ...f, name: e.target.value }); if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined })); }}
                    required
                    aria-invalid={!!fieldErrors.name}
                    className={`w-full rounded-xl border bg-cream px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 ${fieldErrors.name ? "border-terracotta focus:border-terracotta focus:ring-terracotta/30" : "border-border focus:border-terracotta focus:ring-terracotta/20"}`}
                  />
                  {fieldErrors.name ? <span className="font-mono text-[11px] text-terracotta">{fieldErrors.name}</span> : null}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span
                    className="font-mono text-[11px] uppercase tracking-widest"
                    style={{ color: WARM.muted }}
                  >
                    {t.contactForm.email} *
                  </span>
                  <input
                    type="email"
                    value={f.email}
                    onChange={(e) => { setF({ ...f, email: e.target.value }); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined })); }}
                    required
                    aria-invalid={!!fieldErrors.email}
                    className={`w-full rounded-xl border bg-cream px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 ${fieldErrors.email ? "border-terracotta focus:border-terracotta focus:ring-terracotta/30" : "border-border focus:border-terracotta focus:ring-terracotta/20"}`}
                  />
                  {fieldErrors.email ? <span className="font-mono text-[11px] text-terracotta">{fieldErrors.email}</span> : null}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span
                    className="font-mono text-[11px] uppercase tracking-widest"
                    style={{ color: WARM.muted }}
                  >
                    {t.contactForm.subject}
                  </span>
                  <input
                    value={f.subject}
                    onChange={(e) => setF({ ...f, subject: e.target.value })}
                    className="w-full rounded-xl border border-border bg-cream px-3.5 py-2.5 text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span
                    className="font-mono text-[11px] uppercase tracking-widest"
                    style={{ color: WARM.muted }}
                  >
                    {t.contactForm.phone}
                  </span>
                  <input
                    value={f.phone}
                    onChange={(e) => setF({ ...f, phone: e.target.value })}
                    inputMode="tel"
                    className="w-full rounded-xl border border-border bg-cream px-3.5 py-2.5 text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
                  />
                </label>
              </div>
              <label className="mt-2.5 flex flex-col gap-1.5">
                <span
                  className="font-mono text-[11px] uppercase tracking-widest"
                  style={{ color: WARM.muted }}
                >
                  {t.contactForm.message} *
                </span>
                <textarea
                  value={f.message}
                  onChange={(e) => { setF({ ...f, message: e.target.value }); if (fieldErrors.message) setFieldErrors((p) => ({ ...p, message: undefined })); }}
                  required
                  rows={3}
                  aria-invalid={!!fieldErrors.message}
                  className={`min-h-[88px] w-full resize-y rounded-xl border bg-cream px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 max-lg:min-h-[100px] ${fieldErrors.message ? "border-terracotta focus:border-terracotta focus:ring-terracotta/30" : "border-border focus:border-terracotta focus:ring-terracotta/20"}`}
                />
                {fieldErrors.message ? <span className="font-mono text-[11px] text-terracotta">{fieldErrors.message}</span> : null}
              </label>

              {siteKey ? (
                <div className="mt-4 flex justify-start">
                  <div className="cf-turnstile" data-sitekey={siteKey} data-theme="dark" />
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="warm-btn primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? t.contactForm.sending : t.contactForm.send}{" "}
                  <Mail size={16} />
                </button>
                {status !== "idle" ? (
                  <span
                    role="status"
                    aria-live="polite"
                    className={`font-mono text-xs ${status === "success" ? "text-green-600" : status === "error" ? "text-terracotta" : "text-muted"}`}
                  >
                    {status === "success" ? msg : status === "error" ? msg : ""}
                  </span>
                ) : null}
              </div>
            </div>
          </motion.form>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.26 }}
            className="flex flex-col gap-3 md:sticky md:top-28"
          >
            <a href={`mailto:${email}`} className="warm-btn ghost w-full justify-center">
              <svg
                aria-hidden
                viewBox="0 -31.5 256 256"
                className="h-4 w-4 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M58.1818182,192.049515 L58.1818182,93.1404244 L27.5066233,65.0770089 L0,49.5040608 L0,174.59497 C0,184.253152 7.82545455,192.049515 17.4545455,192.049515 L58.1818182,192.049515 Z"
                  fill="#4285F4"
                />
                <path
                  d="M197.818182,192.049515 L238.545455,192.049515 C248.203636,192.049515 256,184.224061 256,174.59497 L256,49.5040608 L224.844415,67.3422767 L197.818182,93.1404244 L197.818182,192.049515 Z"
                  fill="#34A853"
                />
                <polygon
                  fill="#EA4335"
                  points="58.1818182 93.1404244 54.0077618 54.4932827 58.1818182 17.5040608 128 69.8676972 197.818182 17.5040608 202.487488 52.4960089 197.818182 93.1404244 128 145.504061"
                />
                <path
                  d="M197.818182,17.5040608 L197.818182,93.1404244 L256,49.5040608 L256,26.2313335 C256,4.64587897 231.36,-7.65957557 214.109091,5.28587897 L197.818182,17.5040608 Z"
                  fill="#FBBC04"
                />
                <path
                  d="M0,49.5040608 L26.7588051,69.5731646 L58.1818182,93.1404244 L58.1818182,17.5040608 L41.8909091,5.28587897 C24.6109091,-7.65957557 0,4.64587897 0,26.2313335 L0,49.5040608 Z"
                  fill="#C5221F"
                />
              </svg>{" "}
              {lang === "id" ? "Email Saya" : "Email Me"}
            </a>
            <button
              type="button"
              onClick={copyEmail}
              aria-live="polite"
              className="warm-btn ghost w-full justify-center gap-2"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? (lang === "id" ? "Tersalin!" : "Copied!") : email}
            </button>
            <button type="button" onClick={() => setShowCvModal(true)} className="warm-btn ghost w-full justify-center">
              {t.downloadCv} <Download size={16} />
            </button>
            <a
              href="https://github.com/supyan1403"
              target="_blank"
              rel="noreferrer"
              className="warm-btn primary w-full justify-center"
            >
              <SiGithub size={16} /> GitHub ↗
            </a>
          </motion.div>
        </div>
        <div
          className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-border/10 pt-4 font-mono text-xs uppercase tracking-widest max-lg:mt-10 max-lg:pt-6"
          style={{ color: WARM.muted }}
        >
          <p>© 2025 Supyan Sauri</p>
          <p>KYRONIX</p>
          <button
            onClick={() => scrollToId("top")}
            className="text-terracotta hover:text-ink transition-colors cursor-pointer font-mono text-xs uppercase tracking-widest"
          >
            {t.backToTop}
          </button>
        </div>
      </div>
      {showCvModal ? (
        <div role="dialog" aria-modal="true" onClick={() => setShowCvModal(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-cream p-6 shadow-2xl">
            <h3 className="font-display text-lg font-extrabold tracking-[0.02em] text-ink">{lang === "id" ? "CV Belum Tersedia" : "CV Not Yet Available"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{lang === "id" ? "CV belum diunggah. Silakan hubungi saya via email untuk permintaan CV." : "CV is not yet uploaded. Please contact me via email to request a CV."}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowCvModal(false)} className="warm-btn ghost">{lang === "id" ? "Tutup" : "Close"}</button>
              <a href="mailto:supyansauri47@gmail.com" className="warm-btn primary">Email Me</a>
            </div>
          </div>
        </div>
      ) : null}
    </footer>
  );
}

function App() {
  // selalu mulai dari Opening (K Page) — tidak ada pengecualian, dari URL mana pun
  const [phase, setPhase] = useState<"intro" | "k" | "ready">("k");
  const [lang, setLang] = useState<Lang>("en");
  useLenis(true);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // boot: matikan scroll restoration, buang hash, paksa posisi 0 (native + lenis)
  useLayoutEffect(() => {
    try {
      if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    } catch {}
    try {
      if (window.location.hash || window.location.pathname !== "/") {
        window.history.replaceState(null, "", "/" + window.location.search);
      }
    } catch {}
    window.scrollTo(0, 0);
    lenisInstance?.scrollTo(0, { immediate: true, force: true });
    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      lenisInstance?.scrollTo(0, { immediate: true, force: true });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // halaman dikembalikan dari bfcache (Back dari situs lain / tab di-restore)
  // → putar Opening lagi dari awal, bukan melanjutkan posisi terakhir
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      window.scrollTo(0, 0);
      lenisInstance?.scrollTo(0, { immediate: true, force: true });
      try {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch {}
      setPhase("k");
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  const bands = dict[lang].bands;
  const ready = phase === "ready";
  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      <main className="crt relative bg-cream overflow-x-clip">
        {/* canvas C: 1 lembar Grid 32px kontinu Hero → Contact */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[1]"
          style={
            {
              backgroundImage:
                "linear-gradient(to right, rgba(224,122,95,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(224,122,95,0.04) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            } as React.CSSProperties
          }
        />
        {phase === "intro" && <Intro onDone={() => window.setTimeout(() => setPhase("k"), 720)} />}
        {phase === "k" && (
          <KPage
            onDone={() => {
              // Opening selesai → selalu mendarat di Hero (paling atas), URL bersih
              window.scrollTo(0, 0);
              lenisInstance?.scrollTo(0, { immediate: true, force: true });
              try {
                window.history.replaceState(
                  null,
                  "",
                  window.location.pathname + window.location.search,
                );
              } catch {}
              setPhase("ready");
            }}
          />
        )}
        <GlowCursor />
        <Nav ready={ready} />
        <Hero ready={ready} />
        <KineticBand text={bands.behindKyronix} />
        <Profile />
        <Activity />
        <KineticBand text={bands.capabilities} />
        <Stack />
        <KineticBand text={bands.selectedWork} reverse />
        <Projects />
        <KineticBand text={bands.experience} />
        <Experience />
        <KineticBand text={bands.howIBuild} />
        <Lab />
        <KineticBand text={bands.letsBuild} />
        <Contact />
      </main>
    </LangCtx.Provider>
  );
}

export default App;
