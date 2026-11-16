import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Lenis from "lenis";
import type { MotionValue } from "motion/react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
  AnimatePresence,
} from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Cpu,
  Database,
  Download,
  GraduationCap,
  Mail,
  Radio,
  Wrench,
  X,
} from "lucide-react";

/* ---------- Utility: Warm Dark palette tokens ---------- */
const WARM = {
  cream: "#1A1816",
  creamDeep: "#252220",
  surface: "#252220",
  ink: "#F5EFE6",
  muted: "#A8A298",
  border: "#3A3632",
  terracotta: "#E07A5F",
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
function ChipPixel({ size = 24, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
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
let lenisInstance: Lenis | null = null;

function useIsMobile() {
  const [v, setV] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return window.matchMedia("(max-width: 768px)").matches || window.matchMedia("(pointer: coarse)").matches; } catch { return false; }
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
    } catch { return false; }
  });
  useEffect(() => {
    try {
      const dm = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
      const cores = navigator.hardwareConcurrency ?? 8;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const low = (typeof dm === "number" ? dm <= 4 : false) || cores <= 4;
      setV(coarse && low);
    } catch { setV(false); }
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

type Lang = "id" | "en";
const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "id", setLang: () => {} });
const useLang = () => useContext(LangCtx);

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenisInstance)
    lenisInstance.scrollTo(el, {
      offset: 0,
      duration: 2.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
  else el.scrollIntoView({ behavior: "smooth" });
}

/* ---------- Smooth scroll (Lenis) — adaptive 60fps: low-end lighter, keep smoothTouch ---------- */
function useLenis() {
  useEffect(() => {
    const isCoarse = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 768px)").matches;
    const dm = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency ?? 8;
    const isLow = isCoarse && ((typeof dm === "number" ? dm <= 4 : false) || cores <= 4);
    const lenis = new Lenis({
      duration: isLow ? 0.85 : isCoarse ? 0.9 : 1.25,
      wheelMultiplier: isCoarse ? 0.92 : 0.9,
      smoothWheel: true,
      smoothTouch: true,
      touchMultiplier: isLow ? 1.0 : isCoarse ? 1.2 : 1.6,
      gestureOrientation: "vertical",
      easing: (t: number) => 1 - Math.pow(1 - t, isLow ? 2.4 : 2.8),
    });
    lenisInstance = lenis;
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      // low-end throttle: cap ~80hz work, keep smooth but fewer ticks
      if (!isLow || t - last >= 12) {
        lenis.raf(t);
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
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
      className={`inline-flex w-auto justify-center items-center gap-2 self-center border px-6 py-3 font-mono text-[11px] font-black uppercase tracking-[0.14em] sm:px-7 sm:py-3.5 sm:text-sm cursor-pointer ${variant === "primary" ? `border-ink bg-terracotta text-white shadow-[0_4px_16px_rgba(28,25,23,0.08)]` : `border-border bg-surface text-ink shadow-[0_4px_16px_rgba(28,25,23,0.08)]`}`}
    >
      {children}
    </motion.a>
  );
}

/* ---------- Text reveal: split-word mask up (adaptive: no blur on low-end) ---------- */
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
  return (
    <MotionTag
      className={className}
      initial="hidden"
      {...(play === undefined
        ? { whileInView: "show", viewport: { once: true, amount: 0.6 } }
        : { animate: play ? "show" : "hidden" })}
      transition={{ staggerChildren: 0.07, delayChildren: delay }}
    >
      {words.map((w, i) => (
        <span className="mask-line mr-[0.25em]" key={i}>
          <motion.span
            className="inline-block"
            variants={
              low
                ? ({ hidden: { y: "14px", opacity: 0 }, show: { y: 0, opacity: 1 } } as unknown as Record<string, unknown>)
                : ({ hidden: { y: "115%", opacity: 0, filter: "blur(6px)" }, show: { y: 0, opacity: 1, filter: "blur(0px)" } } as unknown as Record<string, unknown>)
            }
            transition={{ duration: 0.9, ease: EASE }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

function Eyebrow({ index, label }: { index: string; label: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: EASE }}
      className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em]"
      style={{ color: WARM.muted }}
    >
      <span style={{ color: WARM.terracotta }}>{index}</span>
      <ChipPixel size={14} className="text-terracotta/60" />
      {label}
    </motion.p>
  );
}

function Tag({ children, tone = "yellow" }: { children: ReactNode; tone?: "yellow" | "pink" | "violet" | "silver" }) {
  const t = {
    yellow: "warm-tag yellow",
    pink: "warm-tag",
    violet: "warm-tag",
    silver: "warm-tag silver",
  }[tone];
  return (
    <span className={`inline-block rounded-none border px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider ${t}`}>
      {children}
    </span>
  );
}

/* ---------- Kinetic band — tanpa BG solid 3× selang-seling (adaptive: scroll-linked desktop, CSS marquee low-end) ---------- */
function KineticBand({ text, accent, reverse }: { text: string; accent?: string; reverse?: boolean }) {
  const low = useIsLowEnd();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], reverse ? ["-50%", "0%"] : ["0%", "-50%"]);
  // low-end: no 5× scroll listeners — pure CSS marquee (same look selang-seling via reverse direction)
  if (low) {
    return (
      <div className="overflow-hidden bg-transparent py-7 md:py-9" aria-hidden>
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
    <div ref={ref} className="overflow-hidden bg-transparent py-7 md:py-9" aria-hidden>
      <motion.div
        className="kinetic flex w-max items-center gap-12 whitespace-nowrap px-[4vw] font-display text-[clamp(2.2rem,5.8vw,4.4rem)] font-extrabold uppercase tracking-[0.06em] text-ink md:gap-16"
        style={{ x }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
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
    document.documentElement.style.overflow = "";
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
      return () => { clearTimeout(t); document.documentElement.style.overflow = ""; };
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
    const t = setTimeout(() => {
      setLineIdx((i) => i + 1);
      setCharIdx(0);
    }, lineIdx % 2 === 0 ? 220 : 380);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, done]);

  // ESC / click to skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        document.documentElement.style.overflow = "";
        setLeaving(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!leaving && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-cream px-6"
          exit={{ clipPath: "inset(0 0 100% 0)", y: "-3%", filter: "blur(8px)", scale: 1.02 }}
          transition={{ duration: 1.05, ease: EASE }}
          onClick={() => {
            document.documentElement.style.overflow = "";
            setLeaving(true);
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(-45deg, transparent 0 14px, rgba(232,17,45,0.5) 14px 16px)" }} />
          <p className="absolute left-6 top-6 font-mono text-xs uppercase tracking-[0.3em] text-muted">
            FRAME 001 / BOOTING — SUPYAN SAURI
          </p>
          <div className="relative w-[min(560px,92vw)] border border-border bg-surface p-5 shadow-[0_8px_32px_rgba(28,25,23,0.06)] md:p-7">
            <div className="absolute -right-2 -top-2 bg-terracotta px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink">BOOTING</div>
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
                    <span className={isPrompt ? "mr-2 text-terracotta" : "mr-2 text-terracotta"}>{ln.prompt}</span>
                    <span>{visible}</span>
                    {isActive && <span className="ml-[2px] inline-block h-[1.15em] w-[8px] translate-y-[3px] bg-terracotta animate-pulse" />}
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
            <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
              <span className={`h-2 w-2 rounded-full ${done ? "bg-terracotta live-dot" : "bg-[#fbbf24] animate-pulse"}`} />
              {done ? <span className="text-terracotta">ready</span> : <span>typing...</span>}
              <span>• click or ESC to skip</span>
            </div>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">SYSTEMS OVER SYNTAX</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Nav ---------- */
const links = [
  { id: "stack", label: { id: "Stack", en: "Stack" } },
  { id: "projects", label: { id: "Proyek", en: "Projects" } },
  { id: "experience", label: { id: "Pengalaman", en: "Experience" } },
  { id: "lab", label: { id: "Cara Kerja", en: "How I Build" } },
  { id: "contact", label: { id: "Kontak", en: "Contact" } },
];

function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex rounded-full border border-white/15 bg-surface p-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.14em] transition-all ${lang === l ? "bg-terracotta font-sans text-white shadow-sm" : "bg-white/[0.08] font-mono text-ink hover:bg-white/15"}`}
        >
          {l === "id" ? "ID" : "EN"}
        </button>
      ))}
    </div>
  );
}

function Nav({ ready }: { ready: boolean }) {
  const { lang } = useLang();
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const dots = [
    { id: "top", label: "SUPYAN SAURI", active: true },
    ...links.map((l) => ({ id: l.id, label: l.label[lang], active: false })),
  ];
  // last dot (contact) highlight as hire
  return (
    <>
      {/* desktop: vertical right-6 center — pixel square dots */}
      <nav
        aria-label="Section navigation"
        className="fixed right-6 top-1/2 z-[90] hidden -translate-y-1/2 flex-col items-center gap-5 opacity-[0.25] transition-opacity duration-300 hover:opacity-100 md:flex"
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
        <motion.div
          className="pointer-events-none absolute left-1/2 top-0 w-px origin-top -translate-x-1/2 bg-terracotta"
          style={{ scaleY: bar, height: "100%" }}
        />
        {dots.map((d, i) => {
          const isActive = i === 0 || i === dots.length - 1;
          return (
            <button
              key={d.id}
              onClick={() => scrollToId(d.id)}
              aria-label={d.label}
              className="group relative flex items-center justify-center"
            >
              <span
                className={`relative block border bg-cream transition-colors ${
                  isActive
                    ? `h-3 w-3 rounded-full border-terracotta bg-terracotta group-hover:bg-terracotta group-hover:border-terracotta`
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
        className="fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 opacity-[0.4] transition-opacity hover:opacity-100 active:opacity-100 md:hidden"
      >
        <div className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-border" />
        <motion.div
          className="pointer-events-none absolute inset-x-3 top-1/2 h-px origin-left -translate-y-1/2 bg-terracotta"
          style={{ scaleX: bar }}
        />
        {dots.map((d, i) => {
          const isActive = i === 0 || i === dots.length - 1;
          return (
            <button
              key={d.id}
              onClick={() => scrollToId(d.id)}
              aria-label={d.label}
              className="relative flex h-7 w-7 items-center justify-center"
            >
              <span
                className={`relative block border bg-cream transition-colors ${
                  isActive
                    ? `h-3.5 w-3.5 rounded-full border-terracotta bg-terracotta active:bg-terracotta active:border-terracotta`
                    : `h-3 w-3 rounded-full border-border/40 active:border-terracotta active:bg-terracotta`
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* lang switch — always visible, napas dari pinggir */}
      <div className="fixed right-4 top-3 z-[90] flex md:right-6 md:top-4">
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
function Hero3D({ ready, mx, my }: { ready: boolean; mx: MotionValue<number>; my: MotionValue<number> }) {
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
      <motion.div className="relative h-[360px] w-[360px]" style={{ transformStyle: "preserve-3d", rotateX: rx, rotateY: ry } as unknown as Record<string, unknown>}>
        {/* shadow ground */}
        <div className="absolute left-1/2 top-[68%] h-[120px] w-[220px] -translate-x-1/2 rounded-[50%] bg-black/60 blur-[18px]" />
        {/* cube 1 - lime bottom */}
        <motion.div className="absolute left-[18%] top-[38%] h-[160px] w-[160px] rounded-[20px] border border-border bg-surface shadow-[0_8px_24px_rgba(28,25,23,0.08)]" style={{ transformStyle: "preserve-3d", z: z1 } as unknown as Record<string, unknown>}>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(5,5,5,0.12)_1.2px,transparent_1.6px)] [background-size:7px_7px]" />
          <span className="absolute right-2 top-2 font-mono text-[10px] font-bold tracking-[0.14em] text-muted/70">01</span>
          <span className="absolute bottom-2 left-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">STACK</span>
          <span className="absolute inset-0 hidden hidden hidden border border-border bg-surface" style={{ transform: "translateZ(-18px)" } as React.CSSProperties} />
          <span className="absolute left-0 top-0 h-[18px] w-full -translate-y-full bg-terracotta border border-border" style={{ transform: "rotateX(90deg) translateZ(0)", transformOrigin: "bottom" } as React.CSSProperties} />
        </motion.div>
        {/* cube 2 - coral mid */}
        <motion.div className="absolute left-[42%] top-[22%] h-[150px] w-[150px] rounded-[20px] border border-border bg-surface shadow-[0_8px_24px_rgba(28,25,23,0.08)]" style={{ transformStyle: "preserve-3d", z: z2 } as unknown as Record<string, unknown>}>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.18)_1.2px,transparent_1.6px)] [background-size:7px_7px]" />
          <span className="absolute right-2 top-2 font-mono text-[10px] font-bold tracking-[0.14em] text-ink/80">02</span>
          <span className="absolute bottom-2 left-2 font-display text-[18px] leading-none tracking-wide text-ink">LAB</span>
          <span className="absolute inset-0 hidden hidden hidden border border-border bg-surface" style={{ transform: "translateZ(-16px)" } as React.CSSProperties} />
          <span className="absolute left-0 top-0 h-[18px] w-full -translate-y-full bg-terracotta border border-border" style={{ transform: "rotateX(90deg) translateZ(0)", transformOrigin: "bottom" } as React.CSSProperties} />
        </motion.div>
        {/* cube 3 - snow top small */}
        <div className="absolute left-[58%] top-[12%] h-[92px] w-[92px] rounded-[20px] border border-border bg-surface shadow-[0_8px_24px_rgba(28,25,23,0.08)]" style={{ transform: "translateZ(48px) rotateX(14deg) rotateY(-18deg)" } as React.CSSProperties}>
          <span className="absolute inset-0 bg-[radial-gradient(rgba(5,5,5,0.1)_1.1px,transparent_1.5px)] [background-size:6px_6px]" />
          <span className="absolute bottom-1.5 left-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted">DATA</span>
          <span className="absolute left-0 top-0 h-[12px] w-full -translate-y-full bg-cream-deep border border-border" style={{ transform: "rotateX(90deg) translateZ(0)", transformOrigin: "bottom" } as React.CSSProperties} />
        </div>
        {/* floating dots */}
        <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute right-[8%] top-[54%] h-2 w-2 rounded-full bg-terracotta border border-border" />
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="absolute left-[12%] top-[18%] h-2 w-2 rounded-full bg-terracotta border border-border" />
      </motion.div>
    </motion.div>
  );
}



/* ---------- Holographic Core — Procedural A refined (gap clean, pure circle) ---------- */
function HoloCore({ ready, mx, my }: { ready: boolean; mx: MotionValue<number>; my: MotionValue<number> }) {
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
        style={{ transformStyle: "preserve-3d", rotateX: rx, rotateY: ry, rotateZ: rz } as unknown as Record<string, unknown>}
      >
        {/* soft ground shadow */}
        <div className="absolute left-1/2 top-[72%] h-[48px] w-[90px] -translate-x-1/2 rounded-[50%] bg-black/35 blur-[10px]" />
        {/* ring 1 — outer 1.5px */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[124px] w-[124px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-terracotta/28 lg:h-[132px] lg:w-[132px]"
          style={{ transform: "translate(-50%,-50%) rotateX(74deg)", boxShadow: "0 0 12px rgba(247,255,60,0.16), inset 0 0 10px rgba(224,122,95,0.08)" } as React.CSSProperties}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[106px] w-[106px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-violet/28 lg:h-[114px] lg:w-[114px]"
          style={{ transform: "translate(-50%,-50%) rotateY(68deg) rotateX(12deg)", boxShadow: "0 0 10px rgba(232,17,45,0.16), inset 0 0 8px rgba(232,17,45,0.08)" } as React.CSSProperties}
        />
        {/* ring 2 — dashed thinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border/14 lg:h-[100px] lg:w-[100px]"
          style={{ transform: "translate(-50%,-50%) rotateX(58deg) rotateZ(20deg)" } as React.CSSProperties}
        />
        {/* core — pure circle 62px, no square border */}
        <div className="absolute left-1/2 top-1/2 h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-[radial-gradient(circle_at_35%_30%,#E07A5F_0%,#E7E5E4_42%,#2a0a14_72%,#0a1628_100%)] shadow-[0_0_14px_rgba(232,17,45,0.35),0_0_22px_rgba(124,58,237,0.22)] lg:h-[62px] lg:w-[62px]" style={{ transform: "translate(-50%,-50%) translateZ(14px)" } as React.CSSProperties}>
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
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[160px] w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-lime/10 to-transparent blur-[0.5px]" style={{ transform: "translate(-50%,-50%) translateZ(-18px)" } as React.CSSProperties} />
      </motion.div>
    </motion.div>
  );
}

/* ---------- i18n — ID / EN ---------- */
const dict = {
  id: {
    nav: {
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
    },
    stackEyebrow: "Perangkat Kerja",
    stackTitle: "PERANGKAT YANG SAYA PAKAI.",
    stackDesc: "Kumpulan teknologi yang saya gunakan untuk membangun sistem data, aplikasi web, dan riset — dari perancangan hingga deployment.",
    projectsEyebrow: "Dari Ide Jadi Nyata",
    projectsTitle: "DARI IDE JADI NYATA.",
    experience: {
      eyebrow: "Pengalaman",
      title: "PERJALANAN SAYA SEJAUH INI.",
      hint: "Klik dot / kartu untuk lompat",
      viewCert: "Lihat Sertifikat",
      download: "Unduh",
      showDetail: "Lihat Detail ↓",
      hideDetail: "Tutup ↑",
    },
    labEyebrow: "Cara Kerja",
    labTitle: "CARA SAYA BEKERJA.",
    labDesc: "Alur kerja saya sederhana: memahami kebutuhan, membangun solusinya, dan memastikan hasilnya bisa dipakai.",
    labSteps: [
      { n: "01", title: "Rancang", desc: "Memetakan kebutuhan dan merancang alurnya sebelum mulai membangun.", tags: ["ARSITEKTUR SISTEM", "ALUR SISTEM"] },
      { n: "02", title: "Bangun", desc: "Membangun sistem dengan otomasi dan tooling yang membantu pekerjaan jadi lebih cepat dan rapi.", tags: ["OTOMASI PYTHON", "ROUTER API"] },
      { n: "03", title: "Kirim", desc: "Mengelola data, melakukan deployment, dan memastikan semuanya siap digunakan.", tags: ["PIPELINE ETL", "POSTGRESQL", "KYRONIX.MY.ID"] },
    ],
    contactEyebrow: "Kontak",
    contactTitle: "HUBUNGI SAYA",
    contactDesc: "Terbuka untuk kolaborasi di bidang data engineering dan riset.",
    backToTop: "Kembali ke atas ↑",
    downloadCv: "Unduh CV",
    bands: {
      capabilities: "KAPABILITAS",
      selectedWork: "DARI IDE JADI NYATA",
      experience: "PENGALAMAN",
      howIBuild: "CARA KERJA",
      letsBuild: "HUBUNGI SAYA",
    },
    projectModal: {
      title: "Belum Tersedia",
      body: "Belum di-deploy. Tautan demo akan aktif setelah rilis.",
      articleTitle: "Artikel Riset Tersedia",
      articleBody: "Ini adalah riset, bukan demo web. Dokumen lengkap tersedia sebagai PDF — baca langsung atau unduh untuk offline.",
      cta: "Hubungi saya untuk preview",
      articleCta: "Hubungi saya untuk diskusi",
      readArticle: "Baca Artikel",
      download: "Unduh PDF",
      close: "Tutup",
    },
  },
  en: {
    nav: {
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
    },
    stackEyebrow: "My Toolkit",
    stackTitle: "MY TOOLKIT.",
    stackDesc: "The technologies I use to build data systems, web apps, and research — from design to deployment.",
    projectsEyebrow: "From Idea To Real",
    projectsTitle: "FROM IDEA TO REAL.",
    experience: {
      eyebrow: "Experience",
      title: "MY JOURNEY SO FAR.",
      hint: "Click dot / card to jump",
      viewCert: "View Certificate",
      download: "Download",
      showDetail: "View Detail ↓",
      hideDetail: "Hide ↑",
    },
    labEyebrow: "How I Work",
    labTitle: "HOW I WORK.",
    labDesc: "My workflow is simple: understand the need, build the solution, and make sure it works in practice.",
    labSteps: [
      { n: "01", title: "Plan", desc: "Mapping needs and designing the flow before building.", tags: ["SYSTEM ARCHITECTURE", "SYSTEM FLOWS"] },
      { n: "02", title: "Build", desc: "Building the system with automation and tooling that keeps things fast and tidy.", tags: ["PYTHON AUTOMATION", "API ROUTERS"] },
      { n: "03", title: "Ship", desc: "Handling data, deploying, and making sure everything is ready to use.", tags: ["ETL PIPELINES", "POSTGRESQL", "KYRONIX.MY.ID"] },
    ],
    contactEyebrow: "Contact",
    contactTitle: "GET IN TOUCH",
    contactDesc: "Open to collaboration in data engineering and research.",
    backToTop: "Back to top ↑",
    downloadCv: "Download CV",
    bands: {
      capabilities: "CAPABILITIES",
      selectedWork: "SELECTED WORK",
      experience: "EXPERIENCE",
      howIBuild: "HOW I WORK",
      letsBuild: "GET IN TOUCH",
    },
    projectModal: {
      title: "Project Not Yet Available",
      body: "This project isn't deployed yet. The live link will be available after release.",
      articleTitle: "Research Article Available",
      articleBody: "This is a research project, not a web demo. The full paper is available as PDF — read inline or download for offline.",
      cta: "Contact me for a preview",
      articleCta: "Contact me to discuss",
      readArticle: "Read Article",
      download: "Download PDF",
      close: "Close",
    },
  },
} as const;

/* ---------- 1. Hero — Warm Dark Center + epic KYRONIX (ringan di HP, magnet di desktop) ---------- */
function Hero({ ready }: { ready: boolean }) {
  const { lang } = useLang();
  const t2 = dict[lang];
  const ref = useRef<HTMLElement>(null);
  const low = useIsLowEnd();
  const isMobile = useIsMobile();
  const light = isMobile;
  const FULL = "KYRONIX";
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!ready) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(FULL);
      return;
    }
    let idx = 0;
    let tm: number | undefined;
    const tick = () => {
      if (idx <= FULL.length) {
        setTyped(FULL.slice(0, idx));
        idx += 1;
        if (idx <= FULL.length) tm = window.setTimeout(tick, idx === 0 ? 420 : 145 + Math.random() * 55) as unknown as number;
      }
    };
    tm = window.setTimeout(tick, 380) as unknown as number;
    return () => clearTimeout(tm);
  }, [ready]);
  const done = typed.length === FULL.length;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, light ? -28 : -90]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, light ? 0.99 : 0.97]);
  const halftoneY = useTransform(scrollYProgress, [0, 1], [0, light ? -12 : -40]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, light ? -16 : -60]);
  return (
    <section id="top" ref={ref} className="relative flex min-h-[100dvh] flex-col justify-center overflow-x-clip bg-cream pt-24 sm:pt-28">
      {/* samain opening: bg-cream flat + diagonal stripes 0.07 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(-45deg, transparent 0 14px, rgba(232,17,45,0.5) 14px 16px)" }} />
      {/* watermark random banyak — tiled behind KYRONIX, static 0 JS */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
        <span className="absolute left-[2%] top-[11%] rotate-[-8deg] font-display text-[clamp(1.7rem,3.6vw,2.8rem)] font-[800] tracking-[0.14em] text-ink/[0.04]">KYRONIX</span>
        <span className="absolute left-[28%] top-[9%] rotate-[-8deg] font-display text-[clamp(0.7rem,1.2vw,0.95rem)] font-[700] tracking-[0.18em] text-ink/[0.035]">SYSTEMS OVER SYNTAX</span>
        <span className="absolute right-[4%] top-[13%] rotate-[-8deg] font-display text-[clamp(1.5rem,3vw,2.4rem)] font-[800] tracking-[0.14em] text-ink/[0.035]">KYRONIX</span>
        <span className="absolute left-[-1%] top-[28%] rotate-[-8deg] font-display text-[clamp(0.7rem,1.2vw,0.95rem)] font-[700] tracking-[0.18em] text-ink/[0.03]">SYSTEMS OVER SYNTAX</span>
        <span className="absolute left-[26%] top-[31%] rotate-[-8deg] font-display text-[clamp(1.6rem,3.2vw,2.5rem)] font-[800] tracking-[0.14em] text-ink/[0.045]">KYRONIX</span>
        <span className="absolute right-[6%] top-[30%] rotate-[-8deg] font-mono text-[clamp(0.65rem,1vw,0.85rem)] tracking-[0.16em] text-ink/[0.032]">01 — 08 // CORE</span>
        <span className="absolute left-[5%] top-[52%] rotate-[-8deg] font-display text-[clamp(0.7rem,1.2vw,0.95rem)] font-[700] tracking-[0.18em] text-ink/[0.03]">SYSTEMS OVER SYNTAX</span>
        <span className="absolute left-[36%] top-[54%] rotate-[-8deg] font-display text-[clamp(1.7rem,3.6vw,2.8rem)] font-[800] tracking-[0.14em] text-ink/[0.03]">KYRONIX</span>
        <span className="absolute right-[-1%] top-[50%] rotate-[-8deg] font-display text-[clamp(1.4rem,2.8vw,2.2rem)] font-[800] tracking-[0.14em] text-ink/[0.035]">KYRONIX</span>
        <span className="absolute left-[3%] top-[70%] rotate-[-8deg] font-display text-[clamp(1.5rem,3vw,2.4rem)] font-[800] tracking-[0.14em] text-ink/[0.04]">KYRONIX</span>
        <span className="absolute left-[30%] top-[73%] rotate-[-8deg] font-mono text-[clamp(0.65rem,1vw,0.85rem)] tracking-[0.16em] text-ink/[0.03]">SYSTEMS OVER SYNTAX</span>
        <span className="absolute right-[5%] top-[74%] rotate-[-8deg] font-display text-[clamp(0.7rem,1.2vw,0.95rem)] font-[700] tracking-[0.18em] text-ink/[0.035]">SYSTEMS OVER SYNTAX</span>
        <span className="absolute left-[14%] top-[88%] rotate-[-8deg] font-display text-[clamp(0.9rem,1.6vw,1.2rem)] font-[800] tracking-[0.16em] text-ink/[0.032]">KYRONIX</span>
        <span className="absolute right-[12%] top-[87%] rotate-[-8deg] font-display text-[clamp(1.4rem,2.8vw,2.2rem)] font-[800] tracking-[0.14em] text-ink/[0.03]">KYRONIX</span>
      </div>
      {/* corner brackets blueprint */}
      <div aria-hidden className="pointer-events-none absolute left-[24px] top-[88px] h-[22px] w-[22px] border-l-[1.5px] border-t-[1.5px] border-terracotta/20 max-sm:left-[16px] max-sm:top-[84px] max-sm:h-[18px] max-sm:w-[18px]" />
      <div aria-hidden className="pointer-events-none absolute right-[24px] top-[88px] h-[22px] w-[22px] border-r-[1.5px] border-t-[1.5px] border-terracotta/20 max-sm:right-[16px] max-sm:top-[84px] max-sm:h-[18px] max-sm:w-[18px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-[24px] left-[24px] h-[22px] w-[22px] border-b-[1.5px] border-l-[1.5px] border-terracotta/20 max-sm:bottom-[16px] max-sm:left-[16px] max-sm:h-[18px] max-sm:w-[18px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-[24px] right-[24px] h-[22px] w-[22px] border-b-[1.5px] border-r-[1.5px] border-terracotta/20 max-sm:bottom-[16px] max-sm:right-[16px] max-sm:h-[18px] max-sm:w-[18px]" />
      <motion.div className="relative z-20 mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-center justify-center gap-7 px-[6vw] pb-16 pt-6 text-center sm:gap-8 sm:px-[5vw] md:px-[4vw]" style={light ? ({ opacity: heroOpacity } as unknown as Record<string, unknown>) : ({ y: heroY, opacity: heroOpacity, scale: heroScale } as unknown as Record<string, unknown>)} initial={light ? ({ opacity: 0 } as unknown as Record<string, unknown>) : low ? ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>) : ({ opacity: 0, filter: "blur(10px)" } as unknown as Record<string, unknown>)} animate={light ? ({ opacity: 1 } as unknown as Record<string, unknown>) : low ? (ready ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>) : ({} as unknown as Record<string, unknown>)) : (ready ? ({ opacity: 1, filter: "blur(0px)" } as unknown as Record<string, unknown>) : ({} as unknown as Record<string, unknown>))} transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}>
        <motion.p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted shadow-sm" initial={{ opacity: 0, y: 8 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.35 }}>
          <span className="h-2 w-2 rounded-full bg-terracotta live-dot" />
          {t2.hero.hi}
        </motion.p>
        {/* KYRONIX — magnet desktop, ringan HP (tanpa blur/shine berat) */}
        <h1 aria-label={FULL} className="relative inline-flex select-none flex-wrap justify-center font-display text-[clamp(3.8rem,11vw,8.5rem)] font-[800] leading-[0.86] tracking-[0.07em] text-ink">
          <span className="sr-only">{FULL}</span>
          <span aria-hidden className="inline-flex">
            {FULL.split("").map((ch, i) => {
              const visible = i < typed.length;
              const isLast = i === FULL.length - 1;
              return (
                <motion.span
                  key={i}
                  initial={
                    light
                      ? ({ opacity: 0, y: 8 } as unknown as Record<string, unknown>)
                      : low
                        ? ({ opacity: 0, y: 14 } as unknown as Record<string, unknown>)
                        : ({ opacity: 0, y: 28, filter: "blur(10px)", scale: 0.92 } as unknown as Record<string, unknown>)
                  }
                  animate={
                    visible
                      ? light
                        ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                        : low
                          ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>)
                          : ({ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 } as unknown as Record<string, unknown>)
                      : light
                        ? ({ opacity: 0, y: 8 } as unknown as Record<string, unknown>)
                        : low
                          ? ({ opacity: 0, y: 14 } as unknown as Record<string, unknown>)
                          : ({ opacity: 0, y: 28, filter: "blur(10px)", scale: 0.92 } as unknown as Record<string, unknown>)
                  }
                  transition={{ duration: light ? 0.42 : 0.62, ease: [0.16, 1, 0.3, 1], delay: 0.04 + i * (light ? 0.035 : 0.06) }}
                  className={light ? "inline-block" : "inline-block will-change-transform"}
                  style={{
                    textShadow: visible && !light ? "0 1px 0 rgba(245,239,230,0.08), 0 2px 0 #2e2b28, 0 4px 12px rgba(0,0,0,0.22), 0 12px 32px rgba(224,122,95,0.20), 0 0 36px rgba(224,122,95,0.08)" : undefined,
                  }}
                >
                  {ch}
                  {isLast && done && !light && (
                    <motion.span
                      aria-hidden
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35, duration: 0.6 }}
                      className="pointer-events-none absolute -inset-x-3 -top-2 bottom-0 -z-10 bg-gradient-to-r from-transparent via-terracotta/12 to-transparent blur-[14px]"
                    />
                  )}
                </motion.span>
              );
            })}
          </span>
          {/* shine sweep — desktop only (HP tanpa biar enteng) */}
          {done && !light && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <motion.span
                className="absolute inset-y-0 w-[35%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-12deg]"
                initial={{ x: "-120%" }}
                animate={{ x: "320%" }}
                transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
              />
            </motion.span>
          )}
        </h1>
        <motion.p className="max-w-[24ch] text-balance font-sans text-[clamp(1.1rem,2.6vw,1.45rem)] leading-relaxed tracking-[0.08em] text-muted sm:max-w-none" initial={light ? ({ opacity: 0, y: 8 } as unknown as Record<string, unknown>) : low ? ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>) : ({ opacity: 0, y: 12, filter: "blur(6px)" } as unknown as Record<string, unknown>)} animate={ready ? (light ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>) : low ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>) : ({ opacity: 1, y: 0, filter: "blur(0px)" } as unknown as Record<string, unknown>)) : ({} as unknown as Record<string, unknown>)} transition={{ duration: 0.8, delay: 0.72 }}>
          {t2.hero.tagline.replace(" INFRA.", "")}<span className="font-semibold tracking-[0.08em] text-ink"> INFRA.</span>
        </motion.p>
        <motion.div initial={light ? ({ opacity: 0, y: 8 } as unknown as Record<string, unknown>) : low ? ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>) : ({ opacity: 0, y: 12, filter: "blur(6px)" } as unknown as Record<string, unknown>)} animate={ready ? (light ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>) : low ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>) : ({ opacity: 1, y: 0, filter: "blur(0px)" } as unknown as Record<string, unknown>)) : ({} as unknown as Record<string, unknown>)} transition={{ duration: 0.8, ease: EASE, delay: 0.92 }} className="flex w-auto flex-wrap items-center justify-center gap-3 pt-2">
          <Magnetic href="#contact" variant="primary" onClick={() => scrollToId("contact")}>{t2.hero.ctaPrimary} <ArrowDownRight size={18} /></Magnetic>
          <Magnetic href="#projects" variant="ghost" onClick={() => scrollToId("projects")}>{t2.hero.ctaSecondary} <ArrowDownRight size={18} /></Magnetic>
        </motion.div>
        <motion.button aria-label="Scroll" onClick={() => scrollToId("stack")} initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ delay: 1.25, duration: 0.6 }} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted hover:text-ink md:flex">
          <span>Scroll</span><span className="h-7 w-px bg-border"><motion.i className="block h-3 w-px bg-terracotta" animate={{ y: [0, 14, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} /></span>
        </motion.button>
      </motion.div>
    </section>
  );
}

/* ---------- 2. Tech stack — MY SYSTEM TOOLKIT (Vibe Coder) ---------- */
const stack = [
  {
    icon: Database,
    title: "Data & System Flow",
    tone: "lime" as const,
    items: [
      "SYSTEM ARCHITECTURE",
      "DRAW.IO DIAGRAMS",
      "OPENCODE CLI",
      "PYTHON DATA & ETL",
      "POSTGRESQL / SQL",
      "ETL PIPELINES",
      "PANDAS",
      "DETECTION SYSTEMS",
    ],
  },
  {
    icon: Wrench,
    title: "Dev & Web Workflow",
    tone: "violet" as const,
    items: [
      "OPENCODE CLI",
      "PYTHON AUTOMATION",
      "REACT LEARNING STAGE",
      "TAILWIND CSS",
      "API ROUTERS",
      "GIT / GITHUB",
      "VS CODE",
      "FIGMA",
    ],
  },
  {
    icon: Cpu,
    title: "IoT & Hardware — Learning & Exploring",
    tone: "coral" as const,
    items: ["BEGINNER EXPLORATION", "ESP32", "SENSORS & ACTUATORS", "MQTT", "TELEMETRY DATA", "HARDWARE PROTOTYPING"],
  },
];

function Stack() {
  const { lang } = useLang();
  const t = dict[lang];
  const low = useIsLowEnd();
  return (
    <section id="stack" className="relative px-[5vw] py-[18vh] bg-cream">
      <div className="relative mx-auto max-w-[1120px]">
        <Eyebrow index="01" label={t.stackEyebrow} />
        <SplitReveal
          key={t.stackTitle}
          text={t.stackTitle}
          className="max-w-4xl font-display text-[clamp(2.4rem,6.2vw,4.75rem)] font-extrabold leading-[1.1] tracking-[0.02em]"
        />
        <motion.p
          initial={low ? ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>) : ({ opacity: 0, y: 10, filter: "blur(6px)" } as unknown as Record<string, unknown>)}
          whileInView={low ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>) : ({ opacity: 1, y: 0, filter: "blur(0px)" } as unknown as Record<string, unknown>)}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
          className="mt-4 max-w-2xl text-lg leading-relaxed"
          style={{ color: WARM.muted }}
        >
          {t.stackDesc}
        </motion.p>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {stack.map((group, i) => {
            const Icon = group.icon;
            const accentColor = group.tone === "lime" ? WARM.terracotta : group.tone === "coral" ? WARM.terracotta : WARM.sage;
            return (
              <motion.article
                key={group.title}
                initial={low ? ({ opacity: 0, y: 14 } as unknown as Record<string, unknown>) : ({ opacity: 0, y: 18, filter: "blur(6px)" } as unknown as Record<string, unknown>)}
                whileInView={low ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>) : ({ opacity: 1, y: 0, filter: "blur(0px)" } as unknown as Record<string, unknown>)}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.65, ease: EASE, delay: i * 0.09 }}
                whileHover={{ y: -4 }}
                className="warm-card p-7"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-cream">
                    <Icon size={18} style={{ color: accentColor }} />
                  </span>
                  <span className="font-mono text-xs tracking-widest text-muted">0{i + 1}</span>
                </div>
                <h3 className="mb-3 font-sans text-lg font-semibold uppercase leading-tight tracking-[0.06em] text-ink">{group.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="warm-tag">{item}</span>
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. Featured projects — warm-tagd builds ---------- */
const projects = [
  {
    no: "01",
    title: "Digital Twin Platform",
    kind: "Spatial Modeling · Research — 800m² Plot",
    desc: { id: "Riset pemodelan spasial & Digital Twin untuk lahan pertanian 800m² memakai Kriging & Random Forest.", en: "Spatial modeling & Digital Twin research for 800m2 agricultural plot using Kriging & Random Forest." } as const,
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
    desc: { id: "Sistem pakan otomatis berbasis ESP32 dengan motor servo dan penjadwalan jarak jauh untuk rutinitas pakan.", en: "ESP32-based automated feeding system with servo motors and remote scheduling for pet feeding routines." } as const,
    stack: ["ESP32", "Servo Motors", "MQTT", "Sensors"],
    status: "IN PROGRESS",
    statusTone: "coral" as const,
    tone: "coral" as const,
  },
  {
    no: "03",
    title: "BPS PDF Publication ETL Pipeline",
    kind: "Data Engineering · ETL",
    desc: { id: "Pipeline ETL otomatis yang mem-parsing PDF publikasi BPS tidak terstruktur menjadi database relasional PostgreSQL.", en: "Automated text-parsing pipeline converting unstructured BPS publication PDFs to relational PostgreSQL database." } as const,
    stack: ["Python", "ETL", "PostgreSQL", "Pandas"],
    status: "LIVE NOW",
    statusTone: "lime" as const,
    tone: "lime" as const,
  },
  {
    no: "04",
    title: "Kulinara — Kuliner Nusantara",
    kind: "Web App · Concept",
    desc: { id: "Aplikasi konsep untuk eksplorasi kuliner Nusantara, pelacakan nutrisi terstruktur, dan estimasi anggaran memasak.", en: "Concept app for Indonesian culinary exploration, structured nutrition tracking, and cooking budget estimation." } as const,
    stack: ["Concept", "Nutrition API", "Tailwind", "PostgreSQL"],
    status: "CONCEPT STAGE",
    statusTone: "violet" as const,
    tone: "violet" as const,
  },
];

function Projects() {
  const { lang } = useLang();
  const t = dict[lang];
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState(0);
  const [active, setActive] = useState<(typeof projects)[number] | null>(null);
  const [docHref, setDocHref] = useState<string | null>(null);
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) setMaxX(Math.max(trackRef.current.scrollWidth - window.innerWidth, 0));
    };
    measure();
    let t: number | undefined;
    const onResize = () => { window.clearTimeout(t); t = window.setTimeout(measure, 150) as unknown as number; };
    window.addEventListener("resize", onResize, { passive: true } as AddEventListenerOptions);
    return () => { window.removeEventListener("resize", onResize); window.clearTimeout(t); };
  }, []);
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
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
      lenisInstance?.start();
    };
  }, [active]);
  const handleOpen = (p: (typeof projects)[number]) => {
    setActive(p);
  };
  const handleCta = () => { setActive(null); setTimeout(() => scrollToId("contact"), 120); };
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -maxX]);

  return (
    <section id="projects" ref={ref} className="relative h-[260vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="orb right-[-10%] top-[20%] h-[420px] w-[420px] bg-terracotta/10" />
        <div className="mx-auto mb-10 w-[min(1120px,90vw)] pt-16">
          <Eyebrow index="02" label={t.projectsEyebrow} />
          <div className="flex items-end justify-between gap-6">
            <SplitReveal
              key={t.projectsTitle}
              text={t.projectsTitle}
              className="font-display text-[clamp(2.3rem,5.2vw,4.25rem)] font-extrabold leading-[1.08] tracking-[0.02em]"
            />
          </div>
        </div>
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex w-max gap-4 py-4 pl-[5vw] pr-[5vw] md:gap-6 md:pl-[max(5vw,calc((100vw-1120px)/2))] md:pr-[10vw]"
        >
          {projects.map((p, idx) => (
            <motion.article
              key={p.no}
              role="button"
              tabIndex={0}
              onClick={() => handleOpen(p)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpen(p); } }}
              whileHover={{ y: -4, scale: 1.005 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className={`warm-card mx-auto flex shrink-0 cursor-pointer flex-col overflow-hidden pb-6 md:mx-0 ${
                idx === 0
                  ? "min-h-[500px] w-[calc(100vw-32px)] max-w-[580px] p-6 md:w-[580px] md:p-7"
                  : "min-h-[480px] w-[calc(100vw-40px)] max-w-[540px] p-5 md:w-[540px] md:p-7"
              }`}
            >
              
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cream-deep font-mono text-[11px] font-bold text-muted">{p.no}</span>
                  <span className={`inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider sm:shrink-0 ${"warm-tag"}`}>
                    {(p as { livePulse?: boolean }).livePulse && <Radio size={12} className="live-dot shrink-0" />}
                    <span className="break-words">{p.status}</span>
                  </span>
                </div>
              <div className="min-w-0 flex-1">
                <p className="mt-4 mb-3 font-mono text-xs uppercase tracking-[0.2em]" style={{ color: WARM.terracotta }}>{p.kind}</p>
                <h3 data-text={p.title} className="font-sans text-[2rem] font-semibold uppercase leading-[1.1] tracking-[0.06em] text-ink md:text-4xl">{p.title}</h3>
                <p className="leading-relaxed" style={{ color: WARM.muted }}>{(typeof p.desc === "string" ? p.desc : (p.desc as { id: string; en: string })[lang])}</p>
              </div>
              <div className="mt-6 flex items-end justify-between gap-3 border-t border-border/10 pt-4">
                <div className="flex flex-1 flex-wrap gap-2 pr-2">
                  {p.stack.map((s) => (
                    <Tag key={s} tone={p.tone === "lime" ? "yellow" : p.tone === "coral" ? "pink" : "violet"}>{s}</Tag>
                  ))}
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border/30 bg-transparent text-terracotta hover:bg-ink hover:text-white md:h-12 md:w-12">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </motion.article>
          ))}
        </motion.div>
        <div className="mx-auto mt-10 h-px w-[min(1120px,90vw)] bg-border">
          <motion.div className="h-full origin-left bg-terracotta" style={{ scaleX: scrollYProgress }} />
        </div>
      </div>
      <AnimatePresence>
        {active && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.projectModal.title}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <div className="absolute inset-0 bg-[#0f0e0d]/70 backdrop-blur-[2px] supports-[backdrop-filter]:bg-[#0f0e0d]/60 max-sm:backdrop-blur-none max-sm:bg-[#0f0e0d]/80" />
            <motion.div
              initial={{ y: 16, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 8, scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="warm-card relative w-full max-w-[520px] max-h-[85vh] overflow-auto bg-surface p-6 text-left md:p-7"
            >
              <button
                onClick={() => setActive(null)}
                aria-label={t.projectModal.close}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-border/25 bg-cream text-ink hover:border-terracotta hover:text-terracotta"
              >
                <X size={16} />
              </button>
              <p className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: WARM.terracotta }}>{active.kind}</p>
              <h3 className="mt-2 pr-8 font-display text-2xl font-normal uppercase leading-tight tracking-[0.14em] text-ink">
                {((active as { href?: string }).href ? (t.projectModal as { articleTitle: string }).articleTitle : t.projectModal.title)}
              </h3>
              <p
                className="mt-2 inline-block bg-terracotta px-2.5 py-1.5 font-mono text-xs font-black uppercase leading-none tracking-[0.22em] text-white"
              >
                {active.title}
              </p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-ink">{((active as { href?: string }).href ? (t.projectModal as { articleBody: string }).articleBody : t.projectModal.body)}</p>
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
                            setActive(null);
                            setDocHref(h);
                          }}
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.97, y: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 18 }}
                          className="inline-flex cursor-pointer items-center gap-2 bg-terracotta px-5 py-3 font-mono text-xs font-black uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(28,25,23,0.08)] hover:bg-[#d46a52] hover:shadow-[0_4px_16px_rgba(28,25,23,0.12)]"
                        >
                          {(t.projectModal as { readArticle: string }).readArticle} <ArrowUpRight size={14} />
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
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.97, y: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 18 }}
                          className="inline-flex cursor-pointer items-center gap-2 border border-border bg-transparent px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-ink hover:border-white/30 hover:bg-white/5"
                        >
                          {(t.projectModal as { download: string }).download} <Download size={14} />
                        </motion.button>
                        <motion.button
                          onClick={handleCta}
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.97, y: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 18 }}
                          className="inline-flex cursor-pointer items-center gap-2 border border-terracotta/30 bg-transparent px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-terracotta hover:bg-ink/10"
                        >
                          {(t.projectModal as { articleCta: string }).articleCta} <ArrowUpRight size={14} />
                        </motion.button>
                        <motion.button
                          onClick={() => setActive(null)}
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.97, y: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 18 }}
                          className="inline-flex cursor-pointer items-center gap-2 border border-border bg-transparent px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-ink hover:border-white/30"
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
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.97, y: 0 }}
                        transition={{ type: "spring", stiffness: 420, damping: 18 }}
                        className="inline-flex cursor-pointer items-center gap-2 bg-terracotta px-5 py-3 font-mono text-xs font-black uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(28,25,23,0.08)] hover:bg-[#d46a52] hover:shadow-[0_4px_16px_rgba(28,25,23,0.12)]"
                      >
                        {t.projectModal.cta} <ArrowUpRight size={14} />
                      </motion.button>
                      <motion.button
                        onClick={() => setActive(null)}
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.97, y: 0 }}
                        transition={{ type: "spring", stiffness: 420, damping: 18 }}
                        className="inline-flex cursor-pointer items-center gap-2 border border-border bg-transparent px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-ink hover:border-white/30"
                      >
                        {t.projectModal.close}
                      </motion.button>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {docHref && <CertificateViewer href={docHref} open={!!docHref} onClose={() => setDocHref(null)} kind="article" />}
    </section>
  );
}

/* ---------- 4. Experience — real profile ---------- */
const experience = [
  {
    icon: BarChart3,
    period: { id: "MSIB Program", en: "MSIB Program" } as const,
    role: { id: "Junior Data Science — VINIX7", en: "Junior Data Science — VINIX7" } as const,
    org: "PT Vinix Seven Aurum | Kampus Merdeka",
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
    period: { id: "Kerja Praktik", en: "Internship" } as const,
    role: { id: "Kerja Praktik — Data Engineering & Operasi", en: "Practical Work — Data Engineering & Operations" } as const,
    org: "Badan Pusat Statistik (BPS) Kabupaten Tasikmalaya",
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
  {
    icon: GraduationCap,
    period: { id: "Akademik", en: "Academic" } as const,
    role: { id: "Mahasiswa Sistem Informasi", en: "Information Systems Student" } as const,
    org: "Universitas Siliwangi",
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
  const points = (Array.isArray(e.points) ? e.points : (e.points as { id: string[]; en: string[] })[lang]) as string[];
  // adaptive: desktop scroll-linked MotionValue (8 transforms), low-end CSS transition via IntersectionObserver
  const ioRef = useRef<HTMLDivElement>(null);
  const [lowActive, setLowActive] = useState(false);
  useEffect(() => {
    if (!low) return;
    const el = ioRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setLowActive(entry.isIntersecting), { rootMargin: "-28% 0px -58% 0px", threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [low]);
  const cc = "320ms cubic-bezier(0.22,1,0.36,1)" as const;
  // desktop still buttery
  const glow = useTransform(smooth, [dotPos - 0.16, dotPos - 0.015], [0, 1], { clamp: true });
  const dotScale = useTransform(glow, [0, 1], [1, 1.14]);
  const dotBg = useTransform(glow, [0, 1], ["rgba(255,251,245,0)", "rgba(224,122,95,0.08)"] as unknown as string[]);
  const dotColor = useTransform(glow, [0, 1], ["#78716C", "#E07A5F"] as unknown as string[]);
  const haloOpacity = useTransform(glow, [0, 1], [0, 0.75]);
  const cardBorder = useTransform(glow, [0, 1], ["rgba(231,229,228,1)", "rgba(224,122,95,1)"] as unknown as string[]);
  const bulletBg = useTransform(glow, [0, 1], ["rgba(120,113,108,0.25)", "rgba(224,122,95,1)"] as unknown as string[]);
  const iconColor = useTransform(glow, [0, 1], ["#78716C", "#E07A5F"] as unknown as string[]);
  const dotShadow = useTransform(glow, [0, 1], [
    "drop-shadow(0 0 0 rgba(247,255,60,0))",
    "drop-shadow(0 0 10px rgba(224,122,95,0.12)) drop-shadow(0 0 22px rgba(224,122,95,0.12))",
  ]);
  const cardShadow = useTransform(glow, [0, 1], ["0 8px 24px rgba(28,25,23,0.06)", "0 8px 24px rgba(28,25,23,0.06), 0 0 20px rgba(224,122,95,0.08)"]);
  const [open, setOpen] = useState(false);
  if (low) {
    const dotStyleLow: React.CSSProperties = {
      color: lowActive ? "#E07A5F" : "#78716C",
      backgroundColor: lowActive ? "rgba(224,122,95,0.08)" : "rgba(255,251,245,0)",
      filter: lowActive ? "drop-shadow(0 0 10px rgba(224,122,95,0.12)) drop-shadow(0 0 22px rgba(224,122,95,0.12))" : "drop-shadow(0 0 0 rgba(247,255,60,0))",
      transform: lowActive ? "scale(1.14)" : "scale(1)",
      transition: `color ${cc}, background-color ${cc}, filter ${cc}, transform ${cc}`,
    };
    const cardStyleLow: React.CSSProperties = {
      borderColor: lowActive ? "#E07A5F" : "#E7E5E4",
      boxShadow: lowActive ? "0 8px 24px rgba(28,25,23,0.06), 0 0 20px rgba(224,122,95,0.08)" : "0 8px 24px rgba(28,25,23,0.06)",
      transition: `border-color ${cc}, box-shadow ${cc}`,
    };
    const iconStyleLow: React.CSSProperties = { color: lowActive ? "#E07A5F" : "#78716C", transition: `color ${cc}` };
    return (
      <div ref={ioRef} className={`relative flex w-full ${isLeft ? "md:justify-start" : "md:justify-end"} justify-end`}>
        <span data-dot aria-hidden className="absolute left-[14px] top-8 z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[3px] bg-transparent md:left-1/2 md:top-1/2" style={dotStyleLow}>
          <span className="pointer-events-none absolute -inset-3 rounded-md bg-terracotta/20 blur-[8px]" style={{ opacity: lowActive ? 0.75 : 0, transition: `opacity ${cc}` }} />
          <ChipPixel size={26} />
        </span>
        <article onClick={onJump} className={`warm-card relative z-[2] w-[calc(100%-56px)] shrink-0 cursor-pointer p-7 md:w-[520px] md:min-w-[520px] md:max-w-[520px] md:p-9 ${isLeft ? "md:mr-auto md:ml-0" : "md:ml-auto md:mr-0"}`} style={cardStyleLow}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Tag tone={e.tone}>{period}</Tag>
              <h3 className="mt-5 font-sans text-2xl font-semibold uppercase tracking-[0.06em] md:text-3xl">{role}</h3>
              <p className="mt-1 text-muted">{e.org}</p>
            </div>
            <span className="shrink-0" style={iconStyleLow}><Icon size={30} /></span>
          </div>
          <div className="hidden sm:block">
            <ul className="mt-6 space-y-2 border-t border-border pt-6">
              {points.map((p) => (
                <li key={p} className="flex gap-3 leading-relaxed text-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: lowActive ? "rgba(224,122,95,1)" : "rgba(120,113,108,0.25)", transition: `background-color ${cc}` }} />
                  {p}
                </li>
              ))}
            </ul>
            {(e as { certificateHref?: string }).certificateHref && (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
                <button type="button" onClick={(ev) => { ev.stopPropagation(); onOpenCert?.((e as { certificateHref: string }).certificateHref); }} className="inline-flex items-center gap-2 bg-terracotta px-4 py-2 font-mono text-xs font-black uppercase tracking-widest text-white hover:bg-[#d46a52]">{(t.experience as { viewCert: string }).viewCert} <ArrowUpRight size={12} /></button>
                <button type="button" onClick={async (ev) => { ev.stopPropagation(); const href = (e as { certificateHref: string }).certificateHref; try { const res = await fetch(href); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = href.split("/").pop() || "sertifikat.pdf"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch { window.open(href, "_blank", "noopener,noreferrer"); } }} className="inline-flex items-center gap-2 border border-border/20 bg-transparent px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink hover:border-border/30 hover:bg-surface/5">{(t.experience as { download: string }).download} <Download size={12} /></button>
              </div>
            )}
          </div>
          <div className="sm:hidden">
            {open ? (
              <div className="overflow-hidden">
                <ul className="mt-6 space-y-2 border-t border-border pt-6">
                  {points.map((p) => (<li key={p} className="flex gap-3 leading-relaxed text-muted"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: lowActive ? "rgba(224,122,95,1)" : "rgba(120,113,108,0.25)", transition: `background-color ${cc}` }} />{p}</li>))}
                </ul>
                {(e as { certificateHref?: string }).certificateHref && (<div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4"><button type="button" onClick={(ev) => { ev.stopPropagation(); onOpenCert?.((e as { certificateHref: string }).certificateHref); }} className="inline-flex cursor-pointer items-center gap-2 bg-terracotta px-4 py-2 font-mono text-xs font-black uppercase tracking-widest text-white">{(t.experience as { viewCert: string }).viewCert} <ArrowUpRight size={12} /></button><button type="button" onClick={async (ev) => { ev.stopPropagation(); const href = (e as { certificateHref: string }).certificateHref; try { const res = await fetch(href); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = href.split("/").pop() || "sertifikat.pdf"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch { window.open(href, "_blank", "noopener,noreferrer"); } }} className="inline-flex items-center gap-2 border border-border/20 bg-transparent px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink">{(t.experience as { download: string }).download} <Download size={12} /></button></div>)}
              </div>
            ) : (<p className="mt-4 line-clamp-2 border-t border-border pt-4 text-sm leading-relaxed text-muted/80">{points[0]}</p>)}
            <button type="button" onClick={(ev) => { ev.stopPropagation(); setOpen((v) => !v); }} className={`mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 border px-4 py-2.5 font-mono text-xs font-black uppercase tracking-widest ${open ? "border-border/20 bg-transparent text-ink" : "border-terracotta bg-terracotta text-white hover:bg-[#d46a52]"}`}>{open ? (t.experience as { hideDetail: string }).hideDetail : (t.experience as { showDetail: string }).showDetail}</button>
          </div>
        </article>
      </div>
    );
  }
  const dotStyle = { scale: dotScale, backgroundColor: dotBg, color: dotColor, filter: dotShadow } as unknown as Record<string, unknown>;
  const cardStyle = { borderColor: cardBorder, boxShadow: cardShadow } as unknown as Record<string, unknown>;
  const haloStyle = { opacity: haloOpacity } as unknown as Record<string, unknown>;
  const iconStyle = { color: iconColor } as unknown as Record<string, unknown>;
  const bulletStyle = { backgroundColor: bulletBg } as unknown as Record<string, unknown>;
  return (
    <div className={`relative flex w-full ${isLeft ? "md:justify-start" : "md:justify-end"} justify-end`}>
      <motion.button
        data-dot
        onClick={onJump}
        aria-label={`${period} — ${role}`}
        style={dotStyle}
        className="absolute left-[14px] top-8 z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[3px] border-0 bg-transparent md:left-1/2 md:top-1/2"
      >
        <motion.span style={haloStyle} className="pointer-events-none absolute -inset-3 rounded-md bg-terracotta/20 blur-[8px]" />
        <ChipPixel size={26} />
      </motion.button>
      <motion.article
        initial={{ opacity: 0, y: 16 } as unknown as Record<string, unknown>}
        whileInView={{ opacity: 1, y: 0 } as unknown as Record<string, unknown>}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease: EASE }}
        onClick={onJump}
        whileHover={{ y: -3, scale: 1.01 } as unknown as Record<string, unknown>}
        whileTap={{ scale: 0.98 }}
        style={cardStyle}
        className={`warm-card relative z-[2] w-[calc(100%-56px)] shrink-0 cursor-pointer p-7 md:w-[520px] md:min-w-[520px] md:max-w-[520px] md:p-9 ${isLeft ? "md:mr-auto md:ml-0" : "md:ml-auto md:mr-0"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Tag tone={e.tone}>{period}</Tag>
            <h3 className="mt-5 font-sans text-2xl font-semibold uppercase tracking-[0.06em] md:text-3xl">{role}</h3>
            <p className="mt-1 text-muted">{e.org}</p>
          </div>
          <motion.span style={iconStyle} className="shrink-0">
            <Icon size={30} />
          </motion.span>
        </div>
        {/* Desktop: always expanded — viewer B replaces _blank tab */}
        <div className="hidden sm:block">
          <ul className="mt-6 space-y-2 border-t border-border pt-6">
            {points.map((p) => (
              <li key={p} className="flex gap-3 leading-relaxed text-muted">
                <motion.span style={bulletStyle} className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                {p}
              </li>
            ))}
          </ul>
          {(e as { certificateHref?: string }).certificateHref && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onOpenCert?.((e as { certificateHref: string }).certificateHref);
                }}
                className="inline-flex items-center gap-2 bg-terracotta px-4 py-2 font-mono text-xs font-black uppercase tracking-widest text-white hover:bg-[#d46a52]"
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
                className="inline-flex items-center gap-2 border border-border/20 bg-transparent px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink hover:border-border/30 hover:bg-surface/5"
              >
                {(t.experience as { download: string }).download} <Download size={12} />
              </button>
            </div>
          )}
        </div>
        {/* Mobile: collapsed preview + brutalist toggle — expand animates height auto */}
        <div className="sm:hidden">
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: EASE }}
                className="overflow-hidden"
              >
                <ul className="mt-6 space-y-2 border-t border-border pt-6">
                  {points.map((p) => (
                    <li key={p} className="flex gap-3 leading-relaxed text-muted">
                      <motion.span style={{ backgroundColor: bulletBg } as unknown as Record<string, unknown>} className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
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
                      className="inline-flex cursor-pointer items-center gap-2 border-terracotta bg-terracotta px-4 py-2 font-mono text-xs font-black uppercase tracking-widest text-white hover:bg-[#d46a52]"
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
                                      className="inline-flex items-center gap-2 border border-border/20 bg-transparent px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink hover:border-border/30 hover:bg-surface/5"
                    >
                      {(t.experience as { download: string }).download} <Download size={12} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {!open && (
            <p className="mt-4 line-clamp-2 border-t border-border pt-4 text-sm leading-relaxed text-muted/80">{points[0]}</p>
          )}
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              setOpen((v) => !v);
            }}
            className={`mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 border px-4 py-2.5 font-mono text-xs font-black uppercase tracking-widest transition-colors ${open ? "border-border/20 bg-transparent text-ink hover:border-border/30" : "border-terracotta bg-terracotta text-white hover:bg-[#d46a52]"}`}
          >
            {open ? (t.experience as { hideDetail: string }).hideDetail : (t.experience as { showDetail: string }).showDetail}
          </button>
        </div>
      </motion.article>
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
  const title = href ? href.split("/").pop()?.replace(".pdf", "") ?? (kind === "article" ? "Artikel" : "Sertifikat") : "";
  const headerEyebrow = kind === "article" ? "Artikel — KYRONIX" : "Sertifikat — KYRONIX";
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenisInstance?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      lenisInstance?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  const doDownload = async () => {
    if (!href) return;
    try {
      const res = await fetch(href);
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
  return (
    <AnimatePresence>
      {open && href && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-[#0f0e0d]/75 backdrop-blur-[3px] supports-[backdrop-filter]:bg-[#0f0e0d]/65 max-sm:backdrop-blur-none max-sm:bg-[#0f0e0d]/85" />
          <motion.div
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 8, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-[min(90vh,920px)] max-h-[90vh] w-[min(96vw,1240px)] max-w-[1240px] flex-col overflow-hidden border border-border bg-surface shadow-[0_8px_32px_rgba(28,25,23,0.06)] md:shadow-[10px_10px_0_#E7E5E4]"
          >
            {/* header branded — bukan toolbar chrome */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-cream px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="min-w-0 flex items-center gap-2.5">
                <span className="hidden h-7 w-7 items-center justify-center bg-terracotta text-[11px] font-black text-white sm:inline-flex">K</span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta sm:text-xs">{headerEyebrow}</p>
                  <p className="truncate font-mono text-[11px] font-bold uppercase tracking-widest text-ink sm:text-xs">{title}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {kind === "article" && (
                  <button
                    onClick={doDownload}
                    className="inline-flex cursor-pointer items-center gap-1.5 bg-terracotta px-3 py-2 font-mono text-xs font-black uppercase tracking-widest text-white hover:bg-[#d46a52] sm:px-4 sm:gap-2"
                  >
                    <Download size={14} />
                    {(t.projectModal as { download: string }).download}
                  </button>
                )}
                <button
                  onClick={onClose}
                  aria-label={t.projectModal.close}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center border border-border bg-transparent text-ink hover:border-terracotta hover:text-terracotta sm:h-9 sm:w-9"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* pdf — FitH + object fallback jika Chrome viewer diblok; XFO SAMEORIGIN + CSP object-src 'self' */}
            <div className="flex flex-1 flex-col items-center justify-center overflow-auto bg-[#141414] p-2 sm:p-3">
              <object
                data={`${href}#view=FitH&toolbar=0&navpanes=0&statusbar=0`}
                type="application/pdf"
                className="h-full w-full min-h-[52vh] border border-border bg-white"
                aria-label={title}
              >
                <iframe
                  src={`${href}#view=FitH&toolbar=0&navpanes=0&statusbar=0`}
                  title={title}
                  className="h-full w-full min-h-[52vh] border-0 bg-white"
                  loading="lazy"
                  allow="fullscreen"
                />
              </object>
              <div className="mt-2 flex w-full items-center justify-between gap-2 border-t border-border/20 pt-2 font-mono text-[11px] text-muted">
                <span>Gagal load viewer? Pakai tombol Unduh PDF di atas.</span>
                <a href={href} target="_blank" rel="noreferrer" className="border border-terracotta bg-terracotta px-3 py-1.5 font-bold uppercase tracking-widest text-white hover:bg-[#d46a52]">Buka Tab Baru</a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
    if (lenisInstance) lenisInstance.scrollTo(el, { offset: -140, duration: 1.1, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
    else el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section id="experience" className="relative px-[5vw] py-[10vh] md:py-[14vh] bg-cream">
      <div className="mx-auto max-w-[1120px]">
        <Eyebrow index="03" label={t.experience.eyebrow} />
        <SplitReveal
          key={t.experience.title}
          text={t.experience.title}
          className="max-w-4xl font-display text-[clamp(2.4rem,6.2vw,4.75rem)] font-extrabold leading-[1.08] tracking-[0.02em]"
        />
        <div ref={trackRef} className="relative mt-10">
          <div className="pointer-events-none absolute bottom-0 left-[14px] top-3 w-[2px] -translate-x-1/2 bg-border md:left-1/2" aria-hidden />
          {/* warm pipe — 100% desktop (no mobile split) */}
          <motion.div
            className="pointer-events-none absolute left-[14px] top-3 w-[18px] origin-top -translate-x-1/2 bg-terracotta/18 blur-[8px] md:left-1/2"
            style={{ scaleY: pipe, height: "100%" } as unknown as Record<string, unknown>}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute left-[14px] top-3 w-[5px] origin-top -translate-x-1/2 bg-terracotta md:left-1/2"
            style={{ scaleY: pipe, height: "100%", boxShadow: "0 0 12px rgba(224,122,95,0.35), 0 0 26px rgba(224,122,95,0.18), 0 0 42px rgba(224,122,95,0.08)" } as unknown as Record<string, unknown>}
            aria-hidden
          />
          <div className="flex flex-col gap-12 md:gap-16">
            {experience.map((e, i) => (
              <div key={(e.role as unknown as { id: string }).id ?? i} ref={(el) => { itemRefs.current[i] = el; }}>
                <ExpRow e={e} isLeft={i % 2 === 0} dotPos={dots[i] ?? (i + 1) / (experience.length + 1)} smooth={smooth} onJump={() => jumpTo(i)} onOpenCert={setCertHref} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <CertificateViewer href={certHref} open={!!certHref} onClose={() => setCertHref(null)} />
    </section>
  );
}


/* ---------- 5. How I Build — Systems over Syntax (Warm) ---------- */
function Lab() {
  const { lang } = useLang();
  const low = useIsLowEnd();
  const t = dict[lang];
  const steps = t.labSteps.map((s, i) => ({
    ...s,
    icon: ([Wrench, Cpu, Database] as const)[i]!,
    tone: (["violet", "yellow", "pink"] as const)[i]!,
  }));
  return (
    <section id="lab" className="relative overflow-x-clip px-4 sm:px-[5vw] py-[14vh] bg-cream">
      <div aria-hidden className="hidden pointer-events-none absolute inset-0 opacity-[0.5]" />
      <div aria-hidden className="pointer-events-none absolute left-[10%] top-[10%] h-[380px] w-[380px] rounded-none bg-terracotta/8 blur-[60px] max-sm:hidden" />
      <div aria-hidden className="pointer-events-none absolute right-[-5%] bottom-[0%] h-[420px] w-[420px] rounded-none bg-sage/10 blur-[60px] max-sm:hidden" />
      <div className="relative mx-auto w-full max-w-[1120px] min-w-0">
        <Eyebrow index="04" label={t.labEyebrow} />
        <SplitReveal
          key={t.labTitle}
          text={t.labTitle}
          className="max-w-3xl font-display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[1.08] tracking-[0.02em] text-ink"
        />
        <motion.p
          initial={low ? ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>) : ({ opacity: 0, y: 10, filter: "blur(6px)" } as unknown as Record<string, unknown>)}
          whileInView={low ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>) : ({ opacity: 1, y: 0, filter: "blur(0px)" } as unknown as Record<string, unknown>)}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
          className="mt-4 max-w-2xl leading-relaxed"
          style={{ color: WARM.muted }}
        >
          {t.labDesc}
        </motion.p>
        <div className="mt-10 grid w-full min-w-0 gap-4 sm:gap-6 md:grid-cols-3 md:items-start">
          {steps.map((step, idx) => (
            <motion.article
              key={step.n}
              initial={low ? ({ opacity: 0, y: 14 } as unknown as Record<string, unknown>) : ({ opacity: 0, y: 16, filter: "blur(6px)" } as unknown as Record<string, unknown>)}
              whileInView={low ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>) : ({ opacity: 1, y: 0, filter: "blur(0px)" } as unknown as Record<string, unknown>)}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.12 + idx * 0.1 }}
              whileHover={{ y: -4 }}
              className={`warm-card flex w-full min-w-0 flex-col overflow-hidden break-words ${idx === 1 ? "p-5 sm:p-7 md:p-9 md:-translate-y-4" : "p-5 sm:p-7 md:p-8"}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-terracotta bg-terracotta font-mono text-sm font-black text-white">
                  {step.n}
                </span>
                <step.icon size={18} className="shrink-0" style={{ color: WARM.muted }} />
              </div>
              <h3 className="mt-5 w-full break-words font-sans text-[clamp(1.4rem,6vw,1.7rem)] font-semibold uppercase leading-none tracking-[0.06em] text-ink [overflow-wrap:anywhere]">{step.title}</h3>
              <p className="mt-3 w-full break-words text-sm leading-relaxed [overflow-wrap:anywhere]" style={{ color: WARM.muted }}>{step.desc}</p>
              <div className="mt-6 flex min-w-0 flex-wrap gap-2 [overflow-wrap:anywhere]">
                {step.tags.map((tag) => (
                  <Tag key={tag} tone={step.tone === "yellow" ? "yellow" : step.tone === "pink" ? "pink" : "violet"}>
                    {tag}
                  </Tag>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. Contact / footer (Retro) ---------- */
function Contact() {
  const { lang } = useLang();
  const low = useIsLowEnd();
  const t = dict[lang];
  const socials = [
    { label: "GitHub", href: "https://github.com/supyan1403" },
    { label: "Email", href: "mailto:supyansauri47@gmail.com" },
  ];
  return (
    <footer id="contact" className="relative overflow-hidden px-[5vw] pb-10 pt-[16vh] bg-cream">
      <div aria-hidden className="hidden pointer-events-none absolute inset-0 opacity-[0.4]" />
      <div className="absolute left-[-5%] top-[10%] h-[460px] w-[460px] rounded-none bg-terracotta/8 blur-[60px]" />
      <div className="absolute right-[-5%] top-[20%] h-[460px] w-[460px] rounded-none bg-violet/12 blur-[60px]" />
      <div className="relative mx-auto max-w-[1120px] text-center">
        <Eyebrow index="05" label={t.contactEyebrow} />
        <SplitReveal
          key={t.contactTitle}
          text={t.contactTitle}
          className="font-display text-[clamp(2.6rem,8.5vw,6.75rem)] font-extrabold leading-[1.08] tracking-[0.02em] text-ink"
        />
        <motion.p
          initial={low ? ({ opacity: 0, y: 10 } as unknown as Record<string, unknown>) : ({ opacity: 0, y: 10, filter: "blur(6px)" } as unknown as Record<string, unknown>)}
          whileInView={low ? ({ opacity: 1, y: 0 } as unknown as Record<string, unknown>) : ({ opacity: 1, y: 0, filter: "blur(0px)" } as unknown as Record<string, unknown>)}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
          className="mx-auto mt-8 max-w-lg text-lg"
          style={{ color: WARM.muted }}
        >
          {t.contactDesc}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.22 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Magnetic href="/cv.pdf" variant="primary">
            {t.downloadCv} <Download size={16} />
          </Magnetic>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.28 }}
          className="mt-16 flex flex-wrap justify-center gap-3"
        >
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="warm-btn secondary"
              style={{ boxShadow: `0 4px 16px rgba(28,25,23,0.08)` } as React.CSSProperties}
            >
              {s.label} ↗
            </a>
          ))}
        </motion.div>
        <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-border/10 pt-6 font-mono text-xs uppercase tracking-widest" style={{ color: WARM.muted }}>
          <p>© 2025 Supyan Sauri</p>
          <p>KYRONIX</p>
          <button onClick={() => scrollToId("top")} className="text-terracotta hover:text-ink transition-colors cursor-pointer font-mono text-xs uppercase tracking-widest">
            {t.backToTop}
          </button>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const [lang, setLang] = useState<Lang>("id");
  useLenis();
  const bands = dict[lang].bands;
  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      <main className="crt relative bg-cream">
      <Intro onDone={() => setReady(true)} />
      <GlowCursor />
      <Nav ready={ready} />
      <Hero ready={ready} />
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[200px] bg-gradient-to-b from-cream/40 via-cream-deep/10 to-transparent"
        />
        <div className="relative">
          <KineticBand text={bands.capabilities} />
        </div>
        <Stack />
      </div>
      <KineticBand text={bands.selectedWork} reverse />
      <Projects />
      <KineticBand text={bands.experience} />
      <Experience />
      <KineticBand text={bands.howIBuild} reverse />
      <Lab />
      <KineticBand text={bands.letsBuild} />
      <Contact />
    </main>
    </LangCtx.Provider>
  );
}

export default App;
