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
      <rect x={6.5} y={6.5} width={11} height={11} rx={0.9} />
      <rect x={9.7} y={9.7} width={4.6} height={4.6} rx={0.4} />
      <path d="M9 6.5V4.2M12 6.5V3.6M15 6.5V4.2" />
      <path d="M9 17.5V19.8M12 17.5V20.4M15 17.5V19.8" />
      <path d="M6.5 9H4.2M6.5 12H3.6M6.5 15H4.2" />
      <path d="M17.5 9H19.8M17.5 12H20.4M17.5 15H19.8" />
    </svg>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;
let lenisInstance: Lenis | null = null;

type Lang = "id" | "en";
const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "id", setLang: () => {} });
const useLang = () => useContext(LangCtx);

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenisInstance)
    lenisInstance.scrollTo(el, {
      offset: 0,
      duration: 2.4,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
  else el.scrollIntoView({ behavior: "smooth" });
}

/* ---------- Smooth scroll (Lenis) ---------- */
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.25, wheelMultiplier: 0.9, smoothWheel: true });
    lenisInstance = lenis;
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
    };
  }, []);
}

/* ---------- Micro-interactions ---------- */
function GlowCursor() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 140, damping: 22, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 140, damping: 22, mass: 0.4 });
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX - 200);
      y.set(e.clientY - 200);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[5] hidden h-[400px] w-[400px] rounded-full md:block"
      style={{
        x: sx,
        y: sy,
        background:
          "radial-gradient(circle, rgba(247,255,60,0.12), rgba(232,17,45,0.08) 40%, transparent 70%)",
      }}
    />
  );
}

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
  variant?: "primary" | "ghost" | "lime";
  external?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 30, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 280, damping: 30, mass: 0.35 });
  const styles = {
    primary:
      "border-2 border-snow bg-coral text-snow shadow-[4px_4px_0_#e9e3d8] hover:brightness-[1.03]",
    lime: "border-2 border-snow bg-lime text-obsidian shadow-[4px_4px_0_#e8112d] hover:brightness-[0.97]",
    ghost:
      "border-2 border-snow/70 bg-transparent text-snow shadow-[4px_4px_0_rgba(232,17,45,0.4)] hover:border-snow hover:bg-white/[0.06]",
  }[variant];
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
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      style={{ x: sx, y: sy }}
      className={`inline-flex w-auto justify-center items-center gap-2 self-center rounded-full px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-[filter,background-color,border-color] duration-200 sm:w-auto sm:px-7 sm:py-3.5 sm:text-sm sm:tracking-wider ${styles}`}
    >
      {children}
    </motion.a>
  );
}

/* ---------- Text reveal: split-word mask up ---------- */
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
            variants={{ hidden: { y: "115%" }, show: { y: 0 } }}
            transition={{ duration: 1, ease: EASE }}
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
      className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-silver"
    >
      <span className="text-lime">{index}</span>
      <ChipPixel size={14} className="text-lime/60" />
      {label}
    </motion.p>
  );
}

function Tag({ children, tone = "lime" }: { children: ReactNode; tone?: "lime" | "violet" | "coral" }) {
  const t = {
    lime: "bg-lime/10 text-lime border-lime/30",
    violet: "bg-violet/15 text-[#e9e3d8] border-violet/40",
    coral: "bg-coral/15 text-coral border-coral/40",
  }[tone];
  return (
    <span
      className={`inline-block rounded-md border px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider ${t}`}
    >
      {children}
    </span>
  );
}

/* ---------- Kinetic oversized title band ---------- */
function KineticBand({ text, accent, reverse }: { text: string; accent?: string; reverse?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], reverse ? ["-45%", "5%"] : ["10%", "-50%"]);
  return (
    <div ref={ref} className="overflow-hidden bg-transparent py-6" aria-hidden>
      <motion.div className="kinetic w-max" style={{ x }}>
        {text} <b>{accent ?? "//"}</b> {text}
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
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-obsidian px-6"
          exit={{ clipPath: "inset(0 0 100% 0)", y: "-3%", filter: "blur(8px)", scale: 1.02 }}
          transition={{ duration: 1.05, ease: EASE }}
          onClick={() => {
            document.documentElement.style.overflow = "";
            setLeaving(true);
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(-45deg, transparent 0 14px, rgba(232,17,45,0.5) 14px 16px)" }} />
          <p className="absolute left-6 top-6 font-mono text-xs uppercase tracking-[0.3em] text-silver">
            FRAME 001 / BOOTING — SUPYAN SAURI
          </p>
          <div className="relative w-[min(560px,92vw)] border-[3px] border-snow bg-[#0a0a0a] p-5 shadow-[8px_8px_0_#e8112d] md:p-7">
            <div className="absolute -right-2 -top-2 bg-coral px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-snow">BOOTING</div>
            <div className="mb-3 flex gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-coral" />
              <i className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
              <i className="h-2.5 w-2.5 rounded-full bg-lime" />
            </div>
            <div className="space-y-1.5 font-mono text-sm leading-6">
              {LINES.slice(0, lineIdx + 1).map((ln, i) => {
                const isActive = i === lineIdx && !done;
                const visible = i < lineIdx ? ln.text : isActive ? ln.text.slice(0, charIdx) : "";
                const isPrompt = ln.prompt === "$";
                return (
                  <p key={i} className={isPrompt ? "text-silver" : "text-snow"}>
                    <span className={isPrompt ? "mr-2 text-lime" : "mr-2 text-coral"}>{ln.prompt}</span>
                    <span>{visible}</span>
                    {isActive && <span className="ml-[2px] inline-block h-[1.15em] w-[8px] translate-y-[3px] bg-lime animate-pulse" />}
                  </p>
                );
              })}
              {done && (
                <p className="text-silver">
                  <span className="mr-2 text-lime">$</span>
                  <span className="inline-block h-[1.15em] w-[8px] translate-y-[3px] bg-lime animate-pulse" />
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
              <span className={`h-2 w-2 rounded-full ${done ? "bg-lime live-dot" : "bg-[#fbbf24] animate-pulse"}`} />
              {done ? <span className="text-lime">ready</span> : <span>typing...</span>}
              <span>• click or ESC to skip</span>
            </div>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-silver">SYSTEMS OVER SYNTAX</p>
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
    <div className="inline-flex overflow-hidden rounded-full border-2 border-snow/30 bg-obsidian p-1 opacity-[0.35] transition-opacity duration-300 hover:opacity-100">
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest transition-colors ${lang === l ? "bg-lime text-obsidian" : "text-silver hover:text-snow"}`}
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
    { id: "top", label: "SUPYAN SAURI", coral: true },
    ...links.map((l) => ({ id: l.id, label: l.label[lang], coral: false })),
  ];
  // last dot (contact) highlight as hire
  return (
    <>
      {/* desktop: vertical right-6 center */}
      <nav
        aria-label="Section navigation"
        className="fixed right-6 top-1/2 z-[90] hidden -translate-y-1/2 flex-col items-center gap-5 opacity-[0.18] transition-opacity duration-300 hover:opacity-100 md:flex"
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
        <motion.div
          className="pointer-events-none absolute left-1/2 top-0 w-px origin-top -translate-x-1/2 bg-coral"
          style={{ scaleY: bar, height: "100%" }}
        />
        {dots.map((d, i) => {
          const isFirst = i === 0;
          const isLast = i === dots.length - 1;
          return (
            <button
              key={d.id}
              onClick={() => scrollToId(d.id)}
              aria-label={d.label}
              className="group relative flex items-center justify-center"
            >
              <span
                className={`relative block rounded-full border bg-obsidian transition-colors ${
                  isFirst || isLast
                    ? "h-3 w-3 border-coral bg-coral group-hover:bg-lime group-hover:border-lime"
                    : "h-2.5 w-2.5 border-snow/40 group-hover:border-lime group-hover:bg-lime"
                }`}
              />
              <span className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 whitespace-nowrap border border-white/10 bg-obsidian px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-snow opacity-0 transition-opacity group-hover:opacity-100 md:block">
                {d.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* mobile: horizontal bottom center — opacity only, tanpa background */}
      <nav
        aria-label="Section navigation"
        className="fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 opacity-[0.35] transition-opacity hover:opacity-100 active:opacity-100 md:hidden"
      >
        <div className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <motion.div
          className="pointer-events-none absolute inset-x-3 top-1/2 h-px origin-left -translate-y-1/2 bg-coral"
          style={{ scaleX: bar }}
        />
        {dots.map((d, i) => {
          const isFirst = i === 0;
          const isLast = i === dots.length - 1;
          return (
            <button
              key={d.id}
              onClick={() => scrollToId(d.id)}
              aria-label={d.label}
              className="relative flex h-7 w-7 items-center justify-center"
            >
              <span
                className={`relative block rounded-full border bg-obsidian transition-colors ${
                  isFirst || isLast
                    ? "h-3.5 w-3.5 border-coral bg-coral active:bg-lime active:border-lime"
                    : "h-3 w-3 border-snow/40 active:border-lime active:bg-lime"
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
        <motion.div className="absolute left-[18%] top-[38%] h-[160px] w-[160px] border-[3px] border-obsidian bg-lime shadow-[8px_8px_0_#e9e3d8]" style={{ transformStyle: "preserve-3d", z: z1 } as unknown as Record<string, unknown>}>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(5,5,5,0.12)_1.2px,transparent_1.6px)] [background-size:7px_7px]" />
          <span className="absolute right-2 top-2 font-mono text-[10px] font-bold tracking-[0.14em] text-obsidian/70">01</span>
          <span className="absolute bottom-2 left-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-obsidian">STACK</span>
          <span className="absolute inset-0 translate-x-[10px] translate-y-[-10px] -z-10 border-[3px] border-obsidian bg-coral" style={{ transform: "translateZ(-18px)" } as React.CSSProperties} />
          <span className="absolute left-0 top-0 h-[18px] w-full -translate-y-full bg-[#f0f043] border-[3px] border-obsidian" style={{ transform: "rotateX(90deg) translateZ(0)", transformOrigin: "bottom" } as React.CSSProperties} />
        </motion.div>
        {/* cube 2 - coral mid */}
        <motion.div className="absolute left-[42%] top-[22%] h-[150px] w-[150px] border-[3px] border-obsidian bg-coral shadow-[8px_8px_0_#e9e3d8]" style={{ transformStyle: "preserve-3d", z: z2 } as unknown as Record<string, unknown>}>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.18)_1.2px,transparent_1.6px)] [background-size:7px_7px]" />
          <span className="absolute right-2 top-2 font-mono text-[10px] font-bold tracking-[0.14em] text-snow/80">02</span>
          <span className="absolute bottom-2 left-2 font-display text-[18px] leading-none tracking-wide text-snow">LAB</span>
          <span className="absolute inset-0 translate-x-[10px] translate-y-[-10px] -z-10 border-[3px] border-obsidian bg-snow" style={{ transform: "translateZ(-16px)" } as React.CSSProperties} />
          <span className="absolute left-0 top-0 h-[18px] w-full -translate-y-full bg-[#ff4d62] border-[3px] border-obsidian" style={{ transform: "rotateX(90deg) translateZ(0)", transformOrigin: "bottom" } as React.CSSProperties} />
        </motion.div>
        {/* cube 3 - snow top small */}
        <div className="absolute left-[58%] top-[12%] h-[92px] w-[92px] border-[3px] border-obsidian bg-snow shadow-[6px_6px_0_var(--hit-red)]" style={{ transform: "translateZ(48px) rotateX(14deg) rotateY(-18deg)" } as React.CSSProperties}>
          <span className="absolute inset-0 bg-[radial-gradient(rgba(5,5,5,0.1)_1.1px,transparent_1.5px)] [background-size:6px_6px]" />
          <span className="absolute bottom-1.5 left-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-obsidian">DATA</span>
          <span className="absolute left-0 top-0 h-[12px] w-full -translate-y-full bg-[#efe9dd] border-[3px] border-obsidian" style={{ transform: "rotateX(90deg) translateZ(0)", transformOrigin: "bottom" } as React.CSSProperties} />
        </div>
        {/* floating dots */}
        <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute right-[8%] top-[54%] h-2 w-2 rounded-full bg-lime border border-obsidian" />
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="absolute left-[12%] top-[18%] h-2 w-2 rounded-full bg-coral border border-obsidian" />
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
          className="absolute left-1/2 top-1/2 h-[124px] w-[124px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-lime/28 lg:h-[132px] lg:w-[132px]"
          style={{ transform: "translate(-50%,-50%) rotateX(74deg)", boxShadow: "0 0 12px rgba(247,255,60,0.16), inset 0 0 10px rgba(247,255,60,0.08)" } as React.CSSProperties}
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
          className="absolute left-1/2 top-1/2 h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-snow/14 lg:h-[100px] lg:w-[100px]"
          style={{ transform: "translate(-50%,-50%) rotateX(58deg) rotateZ(20deg)" } as React.CSSProperties}
        />
        {/* core — pure circle 62px, no square border */}
        <div className="absolute left-1/2 top-1/2 h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-[radial-gradient(circle_at_35%_30%,#f7ff3c_0%,#e8112d_42%,#2a0a14_72%,#050505_100%)] shadow-[0_0_14px_rgba(232,17,45,0.35),0_0_22px_rgba(124,58,237,0.22)] lg:h-[62px] lg:w-[62px]" style={{ transform: "translate(-50%,-50%) translateZ(14px)" } as React.CSSProperties}>
          <span className="absolute inset-[14%] rounded-full border border-white/15 bg-white/8 blur-[1px]" />
          <span className="absolute left-[22%] top-[18%] h-[10px] w-[10px] rounded-full bg-white/80 blur-[0.5px]" />
        </div>
        {/* orbiting dots smaller */}
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[124px] w-[124px] -translate-x-1/2 -translate-y-1/2 lg:h-[132px] lg:w-[132px]"
          style={{ transform: "translate(-50%,-50%) rotateX(74deg)" } as React.CSSProperties}
        >
          <i className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-obsidian bg-lime shadow-[0_0_6px_#f7ff3c]" />
        </motion.span>
        <motion.span
          animate={{ rotate: -360 }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[106px] w-[106px] -translate-x-1/2 -translate-y-1/2 lg:h-[114px] lg:w-[114px]"
          style={{ transform: "translate(-50%,-50%) rotateY(68deg)" } as React.CSSProperties}
        >
          <i className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-obsidian bg-coral shadow-[0_0_6px_#e8112d]" />
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
      ctaSecondary: "Lihat Karya Terpilih",
      tagline: "DARI IDE KE INFRA.",
    },
    stackEyebrow: "Perangkat Kerja",
    stackTitle: "PERANGKAT YANG SAYA PAKAI.",
    stackDesc: "Kumpulan teknologi yang saya gunakan untuk membangun sistem data, aplikasi web, dan riset — dari perancangan hingga deployment.",
    projectsEyebrow: "Karya Terpilih",
    projectsTitle: "KARYA TERPILIH.",
    experience: {
      eyebrow: "Pengalaman",
      title: "PERJALANAN SAYA SEJAUH INI.",
      hint: "Klik dot / kartu untuk lompat",
      viewCert: "Lihat Sertifikat",
      download: "Unduh",
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
      selectedWork: "KARYA TERPILIH",
      experience: "PENGALAMAN",
      howIBuild: "CARA KERJA",
      letsBuild: "HUBUNGI SAYA",
    },
    projectModal: {
      title: "Proyek Belum Tersedia",
      body: "Proyek ini belum di-deploy. Tautan demo akan aktif setelah rilis.",
      articleTitle: "Artikel Riset Tersedia",
      articleBody: "Ini adalah proyek riset, bukan demo web. Dokumen lengkap tersedia sebagai PDF — baca langsung atau unduh untuk offline.",
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
      ctaSecondary: "View Selected Work",
      tagline: "FROM IDEA TO INFRA.",
    },
    stackEyebrow: "My Toolkit",
    stackTitle: "MY TOOLKIT.",
    stackDesc: "The technologies I use to build data systems, web apps, and research — from design to deployment.",
    projectsEyebrow: "Selected Work",
    projectsTitle: "SELECTED WORK.",
    experience: {
      eyebrow: "Experience",
      title: "MY JOURNEY SO FAR.",
      hint: "Click dot / card to jump",
      viewCert: "View Certificate",
      download: "Download",
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

/* ---------- 1. Hero — KYRONIX Transcend Full-Bleed ---------- */
function Hero({ ready }: { ready: boolean }) {
  const { lang } = useLang();
  const t = dict[lang];
  const ref = useRef<HTMLElement>(null);
  // parallax dimatikan — sebelumnya bgY 12% / orbY 22% / hiY -16% / headY -10% / subY -14% bikin renggang & Lenis jank
  const kyRef = useRef<HTMLHeadingElement>(null);
  const kyX = useMotionValue(-9999);
  const kyY = useMotionValue(-9999);
  // direct follow tanpa spring = offset hilang; radius 240px gampar lega
  const kyMask = useMotionTemplate`radial-gradient(180px circle at ${kyX}px ${kyY}px, black 42%, transparent 68%)`;
  const kyClip = useMotionTemplate`circle(180px at ${kyX}px ${kyY}px)`;
  const [kyInteractive, setKyInteractive] = useState(false);
  useEffect(() => {
    if (!ready) {
      setKyInteractive(false);
      return;
    }
    const id = window.setTimeout(() => setKyInteractive(true), 1900);
    return () => window.clearTimeout(id);
  }, [ready]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-x-clip bg-[#4a0000] pt-20 sm:pt-24"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[8] bg-coral mix-blend-screen"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: [0, 0.32, 0, 0.45, 0] } : {}}
        transition={{ duration: 1.5, delay: 0.45, times: [0, 0.03, 0.2, 0.55, 1] }}
      />
      {/* brutalist hard red base — di bawah grid/glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#4a0000]" />
      <div aria-hidden className="hero-vignette pointer-events-none absolute inset-0" />
      <div className="absolute inset-0">
        <div className="grid-bg absolute inset-[-10%] opacity-[0.10]" />
        <div className="hero-epic-glow pointer-events-none absolute inset-0 opacity-[0.32]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[52%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/20 blur-[42px]"
      />



      {/* FOREGROUND CONTENT — center, typing entrance + variatif scroll kepinggir */}
      <motion.div
        className="relative z-20 mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center gap-4 px-[6vw] pb-12 pt-2 text-center sm:gap-6 sm:px-[5vw] sm:pb-8 md:px-[4vw]"
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={ready ? { opacity: 1, filter: "blur(0px)" } : {}}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.32 }}
      >
        <motion.p
          className="font-mono text-[13px] uppercase tracking-[0.28em] text-snow/70 sm:text-xs sm:tracking-[0.32em]"
          initial="hidden"
          animate={ready ? "show" : "hidden"}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.032, delayChildren: 0.58 } } }}
          aria-label={t.hero.hi}
        >
          {t.hero.hi.split("").map((ch, i) => {
            const isSlash = t.hero.hi.startsWith("/") && i === 0;
            const nameStart = t.hero.hi.indexOf("Supyan");
            const isName = nameStart >= 0 ? i >= nameStart : false;
            return (
              <motion.span
                key={i}
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                transition={{ duration: 0.12 }}
                className={isSlash ? "text-coral" : isName ? "text-snow" : ""}
              >
                {ch === " " ? "\u00A0" : ch}
              </motion.span>
            );
          })}
          <motion.span
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            transition={{ duration: 0.2, delay: 0.08 }}
            className="ml-1 inline-block h-[1.05em] w-[7px] -translate-y-px bg-lime align-middle"
            style={{ animation: ready ? "blink 1.1s steps(1) infinite 1.25s" : undefined } as React.CSSProperties}
          />
        </motion.p>

        <div className="flex w-full flex-col items-center justify-center gap-3 text-center sm:gap-4">
          <div className="flex w-full max-w-none flex-col items-center sm:max-w-[720px]">
            {/* KYRONIX — typing entrance + tracking + coral 3D spotlight */}
            <motion.h1
              ref={kyRef}
              data-text="KYRONIX"
              className="kyronix-glitch relative grid place-items-center overflow-visible font-display text-[clamp(4.2rem,16vw,12rem)] font-black leading-none tracking-[0.06em] sm:text-[clamp(5.2rem,14vw,12rem)] sm:tracking-[0.14em]"
              style={{ textShadow: "none", filter: "none", lineHeight: 1, pointerEvents: kyInteractive ? "auto" : "none" } as unknown as React.CSSProperties}
              onMouseMove={(e) => {
                if (!kyInteractive) return;
                const r = kyRef.current?.getBoundingClientRect();
                if (!r) return;
                kyX.set(e.clientX - r.left);
                kyY.set(e.clientY - r.top);
              }}
              onMouseLeave={() => {
                kyX.set(-9999);
                kyY.set(-9999);
              }}
              onTouchMove={(e) => {
                if (!kyInteractive) return;
                const r = kyRef.current?.getBoundingClientRect();
                if (!r) return;
                kyX.set(e.touches[0].clientX - r.left);
                kyY.set(e.touches[0].clientY - r.top);
              }}
              onTouchEnd={() => {
                kyX.set(-9999);
                kyY.set(-9999);
              }}
              initial="hidden"
              animate={ready ? "show" : "hidden"}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.70 } } }}
            >
              <motion.span
                className="ky-base inline-flex justify-center text-snow"
                style={{ textShadow: "none", gridArea: "1/1", lineHeight: 1, display: "inline-flex", alignItems: "center" } as React.CSSProperties}
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.70 } } }}
              >
                {"KYRONIX".split("").map((c, i) => (
                  <motion.span
                    key={`base-${i}`}
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                    transition={{ duration: 0.08, ease: "linear" }}
                    className="inline-block"
                  >
                    {c}
                  </motion.span>
                ))}
              </motion.span>
              <motion.span
                aria-hidden
                className="pointer-events-none inline-flex justify-center overflow-hidden"
                style={
                  {
                    gridArea: "1/1",
                    lineHeight: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    WebkitMaskImage: kyMask,
                    maskImage: kyMask,
                    clipPath: kyClip,
                    color: "#2a0a0a",
                    textShadow: "none",
                    transform: "translate(6px, 6px)",
                    opacity: 0.98,
                  } as unknown as React.CSSProperties
                }
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.70 } } }}
              >
                {"KYRONIX".split("").map((c, i) => (
                  <motion.span
                    key={`side-${i}`}
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                    transition={{ duration: 0.08, ease: "linear" }}
                    className="inline-block"
                    style={{ color: "#2a0a0a" } as React.CSSProperties}
                  >
                    {c}
                  </motion.span>
                ))}
              </motion.span>
              <motion.span
                aria-hidden
                className="pointer-events-none inline-flex justify-center overflow-hidden"
                style={
                  {
                    gridArea: "1/1",
                    lineHeight: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    WebkitMaskImage: kyMask,
                    maskImage: kyMask,
                    clipPath: kyClip,
                    backgroundImage:
                      "linear-gradient(180deg, #f7ff3c 0%, #f7ff3c 28%, #d4d800 42%, #9ea000 62%, #3a3a00 82%, #1a1a00 100%), radial-gradient(ellipse 380px 200px at 50% 18%, rgba(255,255,255,0.72) 0%, transparent 44%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                    filter: "contrast(1.08) saturate(1.08) brightness(1.04)",
                    textShadow: "none",
                  } as unknown as React.CSSProperties
                }
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.70 } } }}
              >
                {"KYRONIX".split("").map((c, i) => (
                  <motion.span
                    key={`fill-${i}`}
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                    transition={{ duration: 0.08, ease: "linear" }}
                    className="inline-block"
                  >
                    {c}
                  </motion.span>
                ))}
              </motion.span>
            </motion.h1>
            <motion.h2
              className="mt-2 flex flex-wrap justify-center px-2 font-display text-[clamp(1.45rem,5.2vw,2.85rem)] font-black leading-[1.05] tracking-[0.10em] text-snow sm:mt-3 sm:px-0 sm:text-[clamp(1.7rem,4vw,2.85rem)] sm:leading-[0.92] sm:tracking-[0.22em]"
              initial="hidden"
              animate={ready ? "show" : "hidden"}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.048, delayChildren: 1.1 } } }}
            >
              {t.hero.tagline.split("").map((c, j) => {
                const isInfra = j >= t.hero.tagline.indexOf("INFRA.");
                return isInfra ? null : (
                  <motion.span
                    key={j}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.28 }}
                    className="inline-block"
                  >
                    {c === " " ? "\u00A0" : c}
                  </motion.span>
                );
              })}
              <motion.span
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.28 }}
                className="inline-block text-lime"
              >
                INFRA.
              </motion.span>
            </motion.h2>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: EASE, delay: 1.05 }}
          className="flex w-auto flex-col items-center gap-2.5 pt-6 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4 sm:pt-8"
        >
          <Magnetic href="#contact" variant="lime" onClick={() => scrollToId("contact")}>
            {t.hero.ctaPrimary} <ArrowDownRight size={18} />
          </Magnetic>
          <Magnetic href="#projects" variant="ghost" onClick={() => scrollToId("projects")}>
            {t.hero.ctaSecondary} <ArrowDownRight size={18} />
          </Magnetic>
        </motion.div>
        <motion.button
          aria-label="Scroll"
          onClick={() => scrollToId("stack")}
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white/70 md:flex"
        >
          <span>Scroll</span>
          <span className="h-7 w-px bg-white/20">
            <motion.i className="block h-3 w-px bg-lime" animate={{ y: [0, 14, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
          </span>
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
  return (
    <section id="stack" className="relative px-[5vw] py-[18vh]">
      {/* gradient now handled by wrapper di App — no local bleed */}
      <div className="relative mx-auto max-w-[1120px]">
        <Eyebrow index="01" label={t.stackEyebrow} />
        <SplitReveal
          key={t.stackTitle}
          text={t.stackTitle}
          className="max-w-4xl font-display text-[clamp(2.4rem,6.2vw,4.75rem)] font-extrabold leading-[1.1] tracking-[0.02em]"
        />
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-silver">
          {t.stackDesc}
        </p>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {stack.map((group, i) => {
            const Icon = group.icon;
            const toneIcon =
              group.tone === "lime"
                ? "text-lime"
                : group.tone === "coral"
                  ? "text-coral"
                  : "text-[#ffb3c0]";
            const accent =
              group.tone === "lime" ? "#f7ff3c" : group.tone === "coral" ? "#e8112d" : "#e8112d";
            return (
              <motion.article
                key={group.title}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.9, ease: EASE, delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                className="glass cursor-pointer p-7"
                style={{ borderLeft: `4px solid ${accent}` } as React.CSSProperties}
              >
                <div className="mb-8 flex items-center justify-between">
                  <Icon className={toneIcon} size={28} />
                  <span className="font-mono text-xs text-silver">0{i + 1}</span>
                </div>
                <h3 className="mb-6 font-display text-2xl font-bold leading-tight tracking-tight">{group.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <Tag key={item} tone={group.tone}>
                      {item}
                    </Tag>
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

/* ---------- 3. Featured projects — status-badged builds ---------- */
const projects = [
  {
    no: "01",
    title: "Digital Twin Platform",
    kind: "Spatial Modeling · Research — 800m² Plot",
    desc: { id: "Riset pemodelan spasial & Digital Twin untuk lahan pertanian 800m² memakai Kriging & Random Forest.", en: "Spatial modeling & Digital Twin research for 800m2 agricultural plot using Kriging & Random Forest." } as const,
    stack: ["Kriging", "Random Forest", "GeoPandas", "Python"],
    status: "READY / RESEARCH COMPLETED",
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
    status: "IN DEVELOPMENT / HARDWARE PROTOTYPE",
    statusTone: "coral" as const,
    tone: "coral" as const,
  },
  {
    no: "03",
    title: "BPS PDF Publication ETL Pipeline",
    kind: "Data Engineering · ETL",
    desc: { id: "Pipeline ETL otomatis yang mem-parsing PDF publikasi BPS tidak terstruktur menjadi database relasional PostgreSQL.", en: "Automated text-parsing pipeline converting unstructured BPS publication PDFs to relational PostgreSQL database." } as const,
    stack: ["Python", "ETL", "PostgreSQL", "Pandas"],
    status: "READY / DEPLOYED",
    statusTone: "lime" as const,
    tone: "lime" as const,
  },
  {
    no: "04",
    title: "Kulinara — Kuliner Nusantara",
    kind: "Web App · Concept",
    desc: { id: "Aplikasi konsep untuk eksplorasi kuliner Nusantara, pelacakan nutrisi terstruktur, dan estimasi anggaran memasak.", en: "Concept app for Indonesian culinary exploration, structured nutrition tracking, and cooking budget estimation." } as const,
    stack: ["Concept", "Nutrition API", "Tailwind", "PostgreSQL"],
    status: "PLANNING / CONCEPT STAGE",
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
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) setMaxX(Math.max(trackRef.current.scrollWidth - window.innerWidth, 0));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
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
        <div className="orb right-[-10%] top-[20%] h-[420px] w-[420px] bg-violet/25" />
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
              className={`glass arcade mx-auto flex shrink-0 cursor-pointer flex-col overflow-hidden pb-6 md:mx-0 ${
                idx === 0
                  ? "min-h-[500px] w-[calc(100vw-32px)] max-w-[580px] p-6 md:w-[580px] md:p-7 md:shadow-[8px_8px_0_var(--hit-red)]"
                  : "min-h-[480px] w-[calc(100vw-40px)] max-w-[540px] p-5 md:w-[540px] md:p-7"
              }`}
            >
              <span className="scanlines" />
              <div className="min-w-0 flex-1">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-display shrink-0 text-5xl font-extrabold leading-none text-snow/45">{p.no}</span>
                  <span
                    className={`max-w-full inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider sm:shrink-0 sm:px-3 sm:py-1.5 sm:text-[11px] ${
                      p.statusTone === "lime"
                        ? "bg-lime/15 text-lime border border-lime/30"
                        : p.statusTone === "coral"
                          ? "bg-coral/15 text-coral border border-coral/30"
                          : "bg-violet/15 text-[#ffb3c0] border border-violet/30"
                    }`}
                  >
                    {(p as { livePulse?: boolean }).livePulse && <Radio size={12} className="live-dot shrink-0 rounded-full" />}
                    <span className="break-words">{p.status}</span>
                  </span>
                </div>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-lime">{p.kind}</p>
                <h3 data-text={p.title} className="glitch mb-3 text-balance font-display text-[2rem] leading-[1.1] tracking-wide md:text-4xl">{p.title}</h3>
                <p className="leading-relaxed text-silver">{(typeof p.desc === "string" ? p.desc : (p.desc as { id: string; en: string })[lang])}</p>
              </div>
              <div className="mt-6 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
                <div className="flex flex-1 flex-wrap gap-2 pr-2">
                  {p.stack.map((s) => (
                    <Tag key={s} tone={p.tone}>
                      {s}
                    </Tag>
                  ))}
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/20 bg-transparent text-lime transition-colors hover:bg-lime hover:text-obsidian md:h-12 md:w-12">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </motion.article>
          ))}
        </motion.div>
        <div className="mx-auto mt-10 h-px w-[min(1120px,90vw)] bg-white/10">
          <motion.div className="h-full origin-left bg-coral" style={{ scaleX: scrollYProgress }} />
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
            <div className="absolute inset-0 bg-obsidian/85 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 16, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 8, scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="glass arcade relative w-full max-w-[520px] bg-[#0a0a0a] p-6 text-left md:p-7"
            >
              <button
                onClick={() => setActive(null)}
                aria-label={t.projectModal.close}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-white/25 bg-obsidian text-snow hover:border-lime hover:text-lime"
              >
                <X size={16} />
              </button>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-lime">{active.kind}</p>
              <h3 className="mt-2 pr-8 font-display text-2xl font-normal uppercase leading-tight tracking-[0.14em] text-snow">
                {((active as { href?: string }).href ? (t.projectModal as { articleTitle: string }).articleTitle : t.projectModal.title)}
              </h3>
              <p
                className="mt-2 inline-block bg-lime px-2.5 py-1.5 font-mono text-xs font-black uppercase leading-none tracking-[0.22em] text-obsidian"
              >
                {active.title}
              </p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-snow">{((active as { href?: string }).href ? (t.projectModal as { articleBody: string }).articleBody : t.projectModal.body)}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {(() => {
                  const href = (active as { href?: string }).href;
                  const hasArticle = typeof href === "string" && href.length > 0;
                  if (hasArticle) {
                    return (
                      <>
                        <motion.button
                          onClick={() => window.open(href!, "_blank", "noopener,noreferrer")}
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.97, y: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 18 }}
                          className="inline-flex items-center gap-2 bg-lime px-5 py-3 font-mono text-xs font-black uppercase tracking-widest text-obsidian shadow-[3px_3px_0_#e8112d] hover:bg-[#eef64d] hover:shadow-[4px_4px_0_#e8112d]"
                        >
                          {(t.projectModal as { readArticle: string }).readArticle} <ArrowUpRight size={14} />
                        </motion.button>
                        <motion.a
                          href={href}
                          download
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.97, y: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 18 }}
                          className="inline-flex items-center gap-2 border border-white/20 bg-transparent px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-snow hover:border-white/30 hover:bg-white/5"
                        >
                          {(t.projectModal as { download: string }).download} <Download size={14} />
                        </motion.a>
                        <motion.button
                          onClick={handleCta}
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.97, y: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 18 }}
                          className="inline-flex items-center gap-2 border border-lime/30 bg-transparent px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-lime hover:bg-lime/10"
                        >
                          {(t.projectModal as { articleCta: string }).articleCta} <ArrowUpRight size={14} />
                        </motion.button>
                        <motion.button
                          onClick={() => setActive(null)}
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.97, y: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 18 }}
                          className="inline-flex items-center gap-2 border border-white/15 bg-transparent px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-snow hover:border-white/30"
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
                        className="inline-flex items-center gap-2 bg-lime px-5 py-3 font-mono text-xs font-black uppercase tracking-widest text-obsidian shadow-[3px_3px_0_#e8112d] hover:bg-[#eef64d] hover:shadow-[4px_4px_0_#e8112d]"
                      >
                        {t.projectModal.cta} <ArrowUpRight size={14} />
                      </motion.button>
                      <motion.button
                        onClick={() => setActive(null)}
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.97, y: 0 }}
                        transition={{ type: "spring", stiffness: 420, damping: 18 }}
                        className="inline-flex items-center gap-2 border border-white/15 bg-transparent px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-snow hover:border-white/30"
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
}: {
  e: (typeof experience)[number];
  isLeft: boolean;
  dotPos: number;
  smooth: MotionValue<number>;
  onJump: () => void;
}) {
  const Icon = e.icon;
  const { lang } = useLang();
  const t = dict[lang];
  const period = (e.period as { id: string; en: string })[lang] ?? (e.period as unknown as string);
  const role = (e.role as { id: string; en: string })[lang] ?? (e.role as unknown as string);
  const points = (Array.isArray(e.points) ? e.points : (e.points as { id: string[]; en: string[] })[lang]) as string[];
  // latch: chip nyala kuning saat pipa sampai dan TETAP nyala setelah lewat (tidak fade-out)
  const glow = useTransform(smooth, [dotPos - 0.07, dotPos - 0.012], [0, 1], { clamp: true });
  const dotScale = useTransform(glow, [0, 1], [1, 1.18]);
  const dotBg = useTransform(glow, [0, 1], ["rgba(5,5,5,0)", "rgba(247,255,60,0.08)"] as unknown as string[]);
  const dotColor = useTransform(glow, [0, 1], ["#5a5a52", "#f7ff3c"] as unknown as string[]);
  const haloOpacity = useTransform(glow, [0, 1], [0, 0.85]);
  const cardBorder = useTransform(glow, [0, 1], ["rgba(233,227,216,1)", "rgba(247,255,60,1)"] as unknown as string[]);
  const bulletBg = useTransform(glow, [0, 1], ["rgba(255,255,255,0.3)", "rgba(247,255,60,1)"] as unknown as string[]);
  const iconColor = useTransform(glow, [0, 1], ["#a8a29e", "#f7ff3c"] as unknown as string[]);
  const dotShadow = useTransform(glow, [0, 0.5, 1], [
    "drop-shadow(0 0 0 rgba(247,255,60,0))",
    "drop-shadow(0 0 10px rgba(247,255,60,0.55)) drop-shadow(0 0 18px rgba(247,255,60,0.28))",
    "drop-shadow(0 0 12px rgba(247,255,60,0.9)) drop-shadow(0 0 26px rgba(247,255,60,0.5)) drop-shadow(0 0 38px rgba(247,255,60,0.22))",
  ]);
  const cardShadow = useTransform(glow, [0, 1], ["8px 8px 0 #e8112d, 0 0 0 rgba(247,255,60,0), 0 0 0 rgba(247,255,60,0)", "8px 8px 0 #e8112d, 0 0 18px rgba(247,255,60,0.28), 0 0 36px rgba(247,255,60,0.14)"]);
  return (
    <div className={`relative flex w-full ${isLeft ? "md:justify-start" : "md:justify-end"} justify-end`}>
      <motion.button
        data-dot
        onClick={onJump}
        aria-label={`${period} — ${role}`}
        style={{ scale: dotScale, backgroundColor: dotBg, color: dotColor, filter: dotShadow } as unknown as Record<string, unknown>}
        className="absolute left-[14px] top-8 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[3px] border-0 bg-transparent md:left-1/2 md:top-1/2"
      >
        <motion.span style={{ opacity: haloOpacity } as unknown as Record<string, unknown>} className="pointer-events-none absolute -inset-3 rounded-md bg-lime/20 blur-[8px]" />
        <ChipPixel size={26} />
      </motion.button>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease: EASE }}
        onClick={onJump}
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        style={{ borderColor: cardBorder, boxShadow: cardShadow } as unknown as Record<string, unknown>}
        className={`glass relative w-[calc(100%-40px)] shrink-0 cursor-pointer p-7 md:w-[520px] md:min-w-[520px] md:max-w-[520px] md:p-9 ${isLeft ? "md:mr-auto md:ml-0" : "md:ml-auto md:mr-0"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Tag tone={e.tone}>{period}</Tag>
            <h3 className="mt-5 font-display text-2xl tracking-wide md:text-3xl">{role}</h3>
            <p className="mt-1 text-silver">{e.org}</p>
          </div>
          <motion.span style={{ color: iconColor } as unknown as Record<string, unknown>} className="shrink-0">
            <Icon size={30} />
          </motion.span>
        </div>
        <ul className="mt-6 space-y-2 border-t border-white/10 pt-6">
          {points.map((p) => (
            <li key={p} className="flex gap-3 leading-relaxed text-silver">
              <motion.span style={{ backgroundColor: bulletBg } as unknown as Record<string, unknown>} className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
              {p}
            </li>
          ))}
        </ul>
        {(e as { certificateHref?: string }).certificateHref && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <a
              href={(e as { certificateHref: string }).certificateHref}
              target="_blank"
              rel="noreferrer"
              onClick={(ev) => ev.stopPropagation()}
              className="inline-flex items-center gap-2 bg-lime px-4 py-2 font-mono text-xs font-black uppercase tracking-widest text-obsidian hover:bg-[#eef64d]"
            >
              {(t.experience as { viewCert: string }).viewCert} <ArrowUpRight size={12} />
            </a>
            <a
              href={(e as { certificateHref: string }).certificateHref}
              download
              onClick={(ev) => ev.stopPropagation()}
              className="inline-flex items-center gap-2 border border-white/20 bg-transparent px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-snow hover:border-white/30 hover:bg-white/5"
            >
              {(t.experience as { download: string }).download} <Download size={12} />
            </a>
          </div>
        )}
      </motion.article>
    </div>
  );
}

function Experience() {
  const { lang } = useLang();
  const t = dict[lang];
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dots, setDots] = useState<number[]>([0.22, 0.5, 0.78]);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 78%", "end 52%"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 32, mass: 0.4 });
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
    <section id="experience" className="relative px-[5vw] py-[10vh] md:py-[14vh]">
      <div className="mx-auto max-w-[1120px]">
        <Eyebrow index="03" label={t.experience.eyebrow} />
        <SplitReveal
          key={t.experience.title}
          text={t.experience.title}
          className="max-w-4xl font-display text-[clamp(2.4rem,6.2vw,4.75rem)] font-extrabold leading-[1.08] tracking-[0.02em]"
        />
        <div ref={trackRef} className="relative mt-10">
          <div className="pointer-events-none absolute bottom-0 left-[14px] top-3 w-[2px] -translate-x-1/2 bg-white/12 md:left-1/2" aria-hidden />
          {/* neon pipa: core 5px + bloom lebar di belakang */}
          <motion.div
            className="pointer-events-none absolute left-[14px] top-3 w-[18px] origin-top -translate-x-1/2 bg-lime/22 blur-[8px] md:left-1/2"
            style={{ scaleY: pipe, height: "100%" } as unknown as Record<string, unknown>}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute left-[14px] top-3 w-[5px] origin-top -translate-x-1/2 bg-lime md:left-1/2"
            style={{ scaleY: pipe, height: "100%", boxShadow: "0 0 12px rgba(247,255,60,0.95), 0 0 26px rgba(247,255,60,0.5), 0 0 42px rgba(247,255,60,0.2)" } as unknown as Record<string, unknown>}
            aria-hidden
          />
          <div className="flex flex-col gap-12 md:gap-16">
            {experience.map((e, i) => (
              <div key={(e.role as unknown as { id: string }).id ?? i} ref={(el) => { itemRefs.current[i] = el; }}>
                <ExpRow e={e} isLeft={i % 2 === 0} dotPos={dots[i] ?? (i + 1) / (experience.length + 1)} smooth={smooth} onJump={() => jumpTo(i)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


/* ---------- 5. How I Build — Systems over Syntax ---------- */
function Lab() {
  const { lang } = useLang();
  const t = dict[lang];
  const steps = t.labSteps.map((s, i) => ({
    ...s,
    icon: ([Wrench, Cpu, Database] as const)[i]!,
    tone: (["violet", "lime", "coral"] as const)[i]!,
  }));
  return (
    <section id="lab" className="relative overflow-hidden px-[5vw] py-[14vh]">
      <div className="orb left-[10%] top-[10%] h-[380px] w-[380px] bg-lime/15" />
      <div className="orb right-[5%] bottom-[0%] h-[420px] w-[420px] bg-violet/30" />
      <div className="relative mx-auto max-w-[1120px]">
        <Eyebrow index="04" label={t.labEyebrow} />
        <SplitReveal
          key={t.labTitle}
          text={t.labTitle}
          className="max-w-3xl font-display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[1.08] tracking-[0.02em]"
        />
        <p className="mt-4 max-w-2xl leading-relaxed text-silver">
          {t.labDesc}
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3 md:items-start">
          {steps.map((step, idx) => (
            <article
              key={step.n}
              className={`glass flex flex-col ${idx === 1 ? "p-8 md:p-9 md:-translate-y-4 md:shadow-[10px_10px_0_var(--hit-red)]" : "p-7 md:p-8"}`}
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center border-2 border-obsidian text-sm font-black ${step.tone === "lime" ? "bg-lime text-obsidian" : step.tone === "coral" ? "bg-coral text-white" : "bg-violet text-white"}`}>
                  {step.n}
                </span>
                <step.icon size={18} className="text-silver" />
              </div>
              <h3 className="mt-5 font-display text-[1.7rem] font-black uppercase leading-none tracking-[0.08em] text-snow" style={{ textShadow: "2px 3px 0 rgba(232,17,45,0.55)" } as React.CSSProperties}>{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-silver">{step.desc}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {step.tags.map((t) => (
                  <Tag key={t} tone={step.tone}>
                    {t}
                  </Tag>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. Contact / footer ---------- */
function Contact() {
  const { lang } = useLang();
  const t = dict[lang];
  const socials = [
    { label: "GitHub", href: "https://github.com/supyan1403" },
    { label: "Email", href: "mailto:supyansauri47@gmail.com" },
  ];
  return (
    <footer id="contact" className="relative overflow-hidden px-[5vw] pb-10 pt-[16vh]">
      <div className="orb left-[-5%] top-[10%] h-[460px] w-[460px] bg-lime/20" />
      <div className="orb right-[-5%] top-[20%] h-[460px] w-[460px] bg-violet/30" />
      <div className="relative mx-auto max-w-[1120px] text-center">
        <Eyebrow index="05" label={t.contactEyebrow} />
        <SplitReveal
          key={t.contactTitle}
          text={t.contactTitle}
          className="font-display text-[clamp(2.6rem,8.5vw,6.75rem)] font-extrabold leading-[1.08] tracking-[0.02em]"
        />
        <p className="mx-auto mt-8 max-w-lg text-lg text-silver">
          {t.contactDesc}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Magnetic href="/cv.pdf" variant="ghost">
            {t.downloadCv} <Download size={16} />
          </Magnetic>
        </div>
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="glass px-6 py-3 font-mono text-xs uppercase tracking-widest text-snow transition-transform hover:-translate-y-1"
            >
              {s.label} ↗
            </a>
          ))}
        </div>
        <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 font-mono text-xs uppercase tracking-widest text-silver">
          <p>© 2025 Supyan Sauri</p>
          <p>KYRONIX</p>
          <button onClick={() => scrollToId("top")} className="hover:text-lime">
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
      <main className="crt relative bg-obsidian">
      <Intro onDone={() => setReady(true)} />
      <GlowCursor />
      <Nav ready={ready} />
      <Hero ready={ready} />
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-gradient-to-b from-[#4a0000]/40 via-[#4a0000]/12 to-transparent"
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
