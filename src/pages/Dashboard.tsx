import { useEffect, useState, useMemo, useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { Cpu, Clock, Flame, Activity } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { useLang } from "../langCtx";

const EASE = [0.22, 1, 0.36, 1] as const;
const USER = "supyan1403";

function ghHeaders(): HeadersInit {
  const tok = (import.meta.env.VITE_GITHUB_TOKEN as string | undefined)?.trim();
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

const FALLBACK_LANGS: LangStat[] = [
  { lang: "JavaScript", count: 2109093, pct: 51 },
  { lang: "PHP", count: 560998, pct: 14 },
  { lang: "Python", count: 529577, pct: 13 },
  { lang: "HTML", count: 384990, pct: 9 },
  { lang: "CSS", count: 267984, pct: 7 },
  { lang: "TypeScript", count: 240845, pct: 6 },
];
const LANG_ICON_SRC: Record<string, string> = {
  javascript: "/icons/javascript.svg",
  typescript: "/icons/typescript.svg",
  python: "/icons/python.svg",
  php: "/icons/php.svg",
  html: "/icons/html.svg",
  css: "/icons/css.svg",
};
function langIconSrc(lang: string): string | null {
  const k = lang.trim().toLowerCase();
  return LANG_ICON_SRC[k] ?? null;
}

const LANGS_CACHE_KEY = "kyronix:langs:v4";
const LANGS_TTL_MS = 60 * 60 * 1000;
function readLangsCache(): LangStat[] | null {
  try {
    const raw = localStorage.getItem(LANGS_CACHE_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw) as { at: number; data: LangStat[] };
    if (!at || !Array.isArray(data)) return null;
    if (Date.now() - at > LANGS_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}
function writeLangsCache(data: LangStat[]) {
  try {
    localStorage.setItem(LANGS_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {}
}
function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 4000): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return fetch(url, { ...init, signal: ac.signal }).finally(() => clearTimeout(t));
}

// no ":" in any visible copy per spec — also no "project" word, use "cara saya"
type LangStat = { lang: string; count: number; pct: number };
type CommitItem = { repo: string; message: string; time: string; url: string };
type GHLevel = "NONE" | "FIRST_QUARTILE" | "SECOND_QUARTILE" | "THIRD_QUARTILE" | "FOURTH_QUARTILE";
type HeatDay = { date: string; iso: string; count: number; level: GHLevel };
type HeatWeek = HeatDay[];

const tDict = {
  id: {
    back: "Kembali ke Beranda",
    update: "diperbarui dari GitHub",
    eyebrow: "Kyronix Lab — Dashboard Aktivitas",
    title: "PANTAUAN AKTIVITAS LANGSUNG",
    desc: "Cara saya merawat konsistensi belajar dan eksplorasi pengembangan aplikasi web yang terekam dari aktivitas harian",
    totalBelajar: "Total Kontribusi",
    ngodingHariIni: "Kontribusi Hari Ini",
    streak: "Rekam Jejak Harian",
    jam: "KONTRIBUSI",
    hari: "HARI",
    totalHint: "sesuai GitHub — 1 tahun terakhir",
    liveTicker: "hari ini",
    todayEmpty: "istirahat hari ini",
    todayActive: "produktif hari ini",
    beruntun: "beruntun",
    bahasaTitle: "Bahasa Paling Sering Digunakan",
    loadingLang: "Memuat data bahasa",
    noLang: "Belum ada data bahasa",
    percent: "%",
    viewGithub: "Lihat GitHub",
    commitTitle: "Aktivitas Terbaru",
    loadingActivity: "Memuat aktivitas",
    noActivity: "Belum ada aktivitas terbaru",
    fallbackCommit: "memperbarui repositori",
    heatContrib: "kontribusi dalam setahun terakhir",
    less: "Kurang",
    more: "Banyak",
    footer: "Kyronix Lab — ruang eksperimen tempat gagasan menjadi sistem",
    terminalLines: [
      "> inisialisasi kyronix lab",
      "> menghubungkan ke github supyan1403 — terhubung",
      "> memindai bahasa dan aktivitas terkini — selesai",
      "> sinkronisasi rekam jejak harian — live",
    ] as string[],
    errRepo: "gagal memuat repositori",
    errAct: "gagal memuat aktivitas",
    errGeneric: "gagal memuat data",
    langLabel: "ID",
  },
  en: {
    back: "Back to Home",
    update: "updated from GitHub",
    eyebrow: "Kyronix Lab — Activity Dashboard",
    title: "LIVE ACTIVITY MONITOR",
    desc: "How I nurture consistent learning and web development exploration tracked live from daily activity",
    totalBelajar: "Total Contributions",
    ngodingHariIni: "Today's Contributions",
    streak: "Daily Streak",
    jam: "CONTRIBUTIONS",
    hari: "DAYS",
    totalHint: "matching GitHub — last year",
    liveTicker: "today",
    todayEmpty: "rest today",
    todayActive: "productive today",
    beruntun: "in a row",
    bahasaTitle: "Most Used Languages",
    loadingLang: "Loading language data",
    noLang: "No language data yet",
    percent: "%",
    viewGithub: "View GitHub",
    commitTitle: "Recent Activity",
    loadingActivity: "Loading activity",
    noActivity: "No recent activity",
    fallbackCommit: "updating repository",
    heatContrib: "contributions in the last year",
    less: "Less",
    more: "More",
    footer: "Kyronix Lab — experimental space where ideas become systems",
    terminalLines: [
      "> initializing kyronix lab",
      "> connecting to github supyan1403 — connected",
      "> scanning languages and recent activity — done",
      "> syncing daily streak — live",
    ] as string[],
    errRepo: "failed to load repositories",
    errAct: "failed to load activity",
    errGeneric: "failed to load data",
    langLabel: "EN",
  },
} as const;

function toLocalISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildHeatmapFromCounts(countMap: Map<string, number>, today = new Date(), levelMap?: Map<string, GHLevel>) {
  // GitHub parity: 53w window ending today, aligned Mon–Sun (same as github.com)
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 364); // 365 days inclusive
  const diff = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - diff);
  const endAligned = new Date(end);
  const eDiff = start.getDay(); // unused, compute Sunday after end
  const toSun = 6 - ((end.getDay() + 6) % 7);
  endAligned.setDate(end.getDate() + toSun);
  void eDiff;
  const weeks: HeatWeek[] = [];
  let total = 0;
  const startExact = new Date(end);
  startExact.setDate(end.getDate() - 364);
  startExact.setHours(0, 0, 0, 0);
  const cur = new Date(start);
  while (cur <= endAligned) {
    const week: HeatWeek = [];
    for (let d = 0; d < 7; d++) {
      const iso = toLocalISO(cur);
      const cnt = countMap.get(iso) ?? 0;
      const lvl = levelMap?.get(iso);
      const level: GHLevel = (lvl as GHLevel) ?? (cnt === 0 ? "NONE" : cnt <= 2 ? "FIRST_QUARTILE" : cnt <= 5 ? "SECOND_QUARTILE" : cnt <= 9 ? "THIRD_QUARTILE" : "FOURTH_QUARTILE");
      if (cur >= startExact && cur <= end) total += cnt;
      week.push({
        date: cur.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        iso,
        count: cnt,
        level,
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return { weeks, total };
}

function mockHeatmap(_today = new Date()) {
  return buildHeatmapFromCounts(new Map(), new Date());
}

function buildHeatmapForYear(countMap: Map<string, number>, year: number, levelMap?: Map<string, GHLevel>) {
  const startExact = new Date(year, 0, 1);
  startExact.setHours(0, 0, 0, 0);
  const endExact = new Date(year, 11, 31);
  endExact.setHours(0, 0, 0, 0);
  const leading = (startExact.getDay() + 6) % 7;
  const trailing = 6 - ((endExact.getDay() + 6) % 7);
  const totalDays = Math.round((endExact.getTime() - startExact.getTime()) / 86400000) + 1;
  const totalCells = leading + totalDays + trailing;
  const weekCount = Math.ceil(totalCells / 7);
  const weeks: HeatWeek[] = [];
  let total = 0;
  for (let wi = 0; wi < weekCount; wi++) {
    const week: HeatWeek = [];
    for (let d = 0; d < 7; d++) {
      const cellIndex = wi * 7 + d;
      const dayOffset = cellIndex - leading;
      if (dayOffset < 0 || dayOffset >= totalDays) {
        week.push({ date: "", iso: "", count: 0, level: "NONE" });
        continue;
      }
      const cur = new Date(startExact);
      cur.setDate(startExact.getDate() + dayOffset);
      const iso = toLocalISO(cur);
      const cnt = countMap.get(iso) ?? 0;
      const lvl = levelMap?.get(iso);
      const level: GHLevel = (lvl as GHLevel) ?? (cnt === 0 ? "NONE" : cnt <= 2 ? "FIRST_QUARTILE" : cnt <= 5 ? "SECOND_QUARTILE" : cnt <= 9 ? "THIRD_QUARTILE" : "FOURTH_QUARTILE");
      total += cnt;
      week.push({
        date: cur.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        iso,
        count: cnt,
        level,
      });
    }
    weeks.push(week);
  }
  return { weeks, total };
}

function levelMetaByCount(count: number) {
  if (count === 0) return { bg: "#252220", border: "rgba(58,54,50,0.35)" };
  if (count <= 2) return { bg: "#5A2E18", border: "rgba(90,46,24,1)" };
  if (count <= 5) return { bg: "#8A3E1A", border: "rgba(138,62,26,1)" };
  if (count <= 9) return { bg: "#C4713C", border: "rgba(196,113,60,1)" };
  return { bg: "#E07A5F", border: "rgba(224,122,95,1)" };
}
function buildHeatmapFromGraphQLCalendar(cal: { totalContributions: number; weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[] }): { weeks: HeatWeek[]; total: number } {
  const weeks: HeatWeek[] = cal.weeks.map((w) =>
    w.contributionDays.map((d) => {
      const dt = new Date(`${d.date}T12:00:00`);
      return {
        date: dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        iso: d.date,
        count: d.contributionCount,
        level: normalizeGHLevel(d.contributionLevel),
      };
    })
  );
  return { weeks, total: cal.totalContributions };
}

function ghLevelToMeta(level: GHLevel) {
  switch (level) {
    case "FOURTH_QUARTILE": return { bg: "#E07A5F", border: "rgba(224,122,95,1)" };
    case "THIRD_QUARTILE": return { bg: "#C4713C", border: "rgba(196,113,60,1)" };
    case "SECOND_QUARTILE": return { bg: "#8A3E1A", border: "rgba(138,62,26,1)" };
    case "FIRST_QUARTILE": return { bg: "#5A2E18", border: "rgba(90,46,24,1)" };
    default: return { bg: "#252220", border: "rgba(58,54,50,0.35)" };
  }
}
function normalizeGHLevel(v: unknown): GHLevel {
  // jogruber: 0..4 angka ; GraphQL: FIRST_QUARTILE..FOURTH_QUARTILE string
  if (typeof v === "number") {
    if (v >= 4) return "FOURTH_QUARTILE";
    if (v === 3) return "THIRD_QUARTILE";
    if (v === 2) return "SECOND_QUARTILE";
    if (v === 1) return "FIRST_QUARTILE";
    return "NONE";
  }
  const u = String(v || "NONE").toUpperCase();
  if (u === "4" || u === "FOURTH_QUARTILE" || u === "FOURTH") return "FOURTH_QUARTILE";
  if (u === "3" || u === "THIRD_QUARTILE" || u === "THIRD") return "THIRD_QUARTILE";
  if (u === "2" || u === "SECOND_QUARTILE" || u === "SECOND") return "SECOND_QUARTILE";
  if (u === "1" || u === "FIRST_QUARTILE" || u === "FIRST") return "FIRST_QUARTILE";
  return "NONE";
}
function levelMeta(count: number) {
  return levelMetaByCount(count);
}
function levelMetaByLevel(level: GHLevel) {
  return ghLevelToMeta(level);
}

function ContributionHeatmap({
  weeks,
  total,
  isEn,
  t,
  yearLabel,
  onYearChange,
  availableYears,
}: {
  weeks: HeatWeek[];
  total: number;
  isEn: boolean;
  t: (typeof tDict)["id"];
  yearLabel?: string;
  onYearChange?: (y: number | "last") => void;
  availableYears?: number[];
}) {
  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    const firstValid = weeks.flat().find((d) => d.iso)?.iso;
    const labelYear = firstValid ? new Date(firstValid).getFullYear() : new Date().getFullYear();
    const targetYear = (() => {
      for (const w of weeks) for (const d of w) if (d.iso) {
        const dt = new Date(d.iso);
        if (dt.getFullYear() === labelYear && dt.getMonth() === 0) return labelYear;
        if (dt.getFullYear() === labelYear + 1 && dt.getMonth() === 0) return labelYear + 1;
      }
      return labelYear;
    })();
    weeks.forEach((w, idx) => {
      const rep = w.find((d) => d.iso && new Date(d.iso).getFullYear() === targetYear) ?? w.find((d) => d.iso) ?? w[0];
      if (!rep?.iso) return;
      const d = new Date(rep.iso);
      if (Number.isNaN(d.getTime())) return;
      const m = d.getMonth();
      if (m !== lastMonth) {
        if (labels.length === 0 || idx - (labels[labels.length - 1]?.col ?? -10) >= 4) {
          labels.push({
            label: d.toLocaleString(isEn ? "en-US" : "id-ID", { month: "short" }),
            col: idx,
          });
          lastMonth = m;
        }
      }
    });
    return labels;
  }, [weeks, isEn]);

  // acak dulu baru nemu titik bener — SETIAP RENDER (ganti tahun + tiap fetch baru)
  const LEVELS = useMemo(() => ["NONE","FIRST_QUARTILE","SECOND_QUARTILE","THIRD_QUARTILE","FOURTH_QUARTILE"] as GHLevel[], []);
  const [phase, setPhase] = useState<"shuffle"|"reveal">("shuffle");
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const lastSigRef = useRef<string>("");
  const sig = useMemo(() => `${yearLabel}|${weeks.length}|${weeks.flat().slice(0,3).map(d=>d.iso).join(",")}|${total}`, [yearLabel, weeks, total]);
  useEffect(() => {
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;
    setPhase("shuffle");
    setShuffleSeed((s) => s + 1);
    const tm = window.setTimeout(() => setPhase("reveal"), 420);
    return () => window.clearTimeout(tm);
  }, [sig]);

  const shuffled = useMemo(() => {
    // random level per cell berbasis seed + index — ringan, tidak bikin object style 350
    return weeks.map((week, wi) =>
      week.map((_, di) => {
        const n = (shuffleSeed * 9301 + wi * 49297 + di * 23311) % 5;
        return LEVELS[n];
      })
    );
  }, [weeks, shuffleSeed, LEVELS]);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3 border-b border-border/10 pb-3">
        <p className="font-mono text-[12px] font-semibold tracking-tight text-ink">
          {total.toLocaleString(isEn ? "en-US" : "id-ID")} {yearLabel ? `${yearLabel === "last" ? t.heatContrib : isEn ? `contributions in ${yearLabel}` : `kontribusi di ${yearLabel}`}` : t.heatContrib}
        </p>
        {onYearChange && availableYears ? (
          <span className="inline-flex gap-1 border border-terracotta/20 bg-transparent p-1">
            <button
              onClick={() => onYearChange("last" as unknown as number)}
              className={`px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${yearLabel === "last" ? "bg-terracotta text-white" : "text-muted hover:text-ink"}`}
            >
              {isEn ? "Last year" : "Setahun"}
            </button>
            {availableYears.map((y) => (
              <button
                key={y}
                onClick={() => onYearChange(y)}
                className={`px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${String(y) === String(yearLabel) ? "bg-terracotta text-white" : "text-muted hover:text-ink"}`}
              >
                {y}
              </button>
            ))}
          </span>
        ) : null}
      </div>

      <div className="mt-3 overflow-hidden border border-border/10 bg-cream-deep/40 p-3" style={{ contentVisibility: "auto", containIntrinsicSize: "320px" } as React.CSSProperties}>
        {/* Opsi A: 1 papan saja (dari 742 -> 371 kotak) — scroll halus di hp & desktop */}
        <div className="overflow-x-auto hide-scrollbar">
          <div className="min-w-[740px]">
            <div className="flex gap-[3px]">
              <span className="w-[28px] shrink-0" />
              <div className="grid flex-1 gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` } as React.CSSProperties}>
                {weeks.map((_, idx) => {
                  const lbl = monthLabels.find((m) => m.col === idx);
                  return (
                    <span key={idx} className="font-mono text-[10px] leading-none text-muted">
                      {lbl ? lbl.label : ""}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="mt-1.5 flex gap-[3px]">
              <div className="flex w-[28px] shrink-0 flex-col gap-[3px] font-mono text-[10px] leading-[11px] text-muted">
                <span className="h-[11px] leading-[11px]">Mon</span>
                <span className="h-[11px] leading-[11px]">Tue</span>
                <span className="h-[11px] leading-[11px]">Wed</span>
                <span className="h-[11px] leading-[11px]">Thu</span>
                <span className="h-[11px] leading-[11px]">Fri</span>
                <span className="h-[11px] leading-[11px]">Sat</span>
                <span className="h-[11px] leading-[11px]">Sun</span>
              </div>
              <div className="grid flex-1 gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` } as React.CSSProperties}>
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day, di) => {
                      if (!day.iso) return <span key={`${wi}-${di}`} className="h-[11px] w-full rounded-[2px] border border-transparent bg-transparent" />;
                      const tip = `${day.iso} • ${day.count} ${isEn ? "contributions" : "kontribusi"}`;
                      const rnd = shuffled[wi]?.[di] ?? "NONE";
                      const show = phase === "shuffle" ? rnd : day.level;
                      const delay = phase === "reveal" ? `${wi * 14 + di * 8}ms` : "0ms";
                      return (
                        <span
                          key={day.iso}
                          title={tip}
                          aria-label={tip}
                          className={`h-[11px] w-full rounded-[2px] border hm-${show} hm-cell`}
                          style={{ transitionDelay: delay } as React.CSSProperties}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[10px] text-muted">
          <span>{t.less}</span>
          <span className="inline-flex gap-[3px]">
            {["NONE","FIRST_QUARTILE","SECOND_QUARTILE","THIRD_QUARTILE","FOURTH_QUARTILE"].map((lv) => (
              <i key={lv} className={`h-[10px] w-[10px] rounded-[2px] border hm-${lv}`} />
            ))}
          </span>
          <span>{t.more}</span>
        </div>
      </div>

    </div>
  );
}

function useGitHubLive(isEn: boolean, fallbackCommit: string, errRepo: string, errAct: string, errGeneric: string, heatmapYear: number | "last", enabled = true) {
  const [langs, setLangs] = useState<LangStat[] | null>(null);
  const [commits, setCommits] = useState<CommitItem[] | null>(null);
  const [heatmap, setHeatmap] = useState<{ weeks: HeatWeek[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [langErr, setLangErr] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    // 1) heatmap 1 tahun wajib sama github — jogruber (tidak kena rate limit api.github.com)
    // 2) events + langs via api.github.com tapi tidak bikin gagal total kalau 403
    const promises: Promise<void>[] = [];

    const heatP = (async () => {
      // coba GraphQL ori (count + level kuartil persis github.com) bila ada token — 100% identik
      const tok = (import.meta.env.VITE_GITHUB_TOKEN as string | undefined)?.trim();
      if (tok) {
        try {
          const from = heatmapYear === "last" ? undefined : `${heatmapYear}-01-01T00:00:00Z`;
          const to = heatmapYear === "last" ? undefined : `${heatmapYear}-12-31T23:59:59Z`;
          const q = heatmapYear === "last"
            ? `query{user(login:"${USER}"){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`
            : `query($from:DateTime!,$to:DateTime!){user(login:"${USER}"){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
          const gr = await fetchWithTimeout("https://api.github.com/graphql", {
            method: "POST",
            headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
            body: JSON.stringify(heatmapYear === "last" ? { query: q } : { query: q, variables: { from, to } }),
          }, 5500);
          if (gr.ok) {
            const j = await gr.json() as { data?: { user?: { contributionsCollection?: { contributionCalendar?: { totalContributions: number; weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[] } } } }; errors?: unknown };
            const cal = j?.data?.user?.contributionsCollection?.contributionCalendar;
            if (cal?.weeks?.length) {
              setHeatmap(buildHeatmapFromGraphQLCalendar(cal));
              return;
            }
          }
        } catch {}
      }
      try {
        const yParam = heatmapYear === "last" ? "last" : String(heatmapYear);
        const gr = await fetch(`https://github-contributions-api.jogruber.de/v4/${USER}?y=${yParam}`);
        if (!gr.ok) throw new Error("gh");
        const gj: { contributions: { date: string; count: number; level?: number | string }[] } = await gr.json();
        const cMap = new Map<string, number>();
        const lMap = new Map<string, GHLevel>();
        gj.contributions.forEach((c) => {
          cMap.set(c.date, c.count);
          const lv = (c as { level?: number | string }).level;
          if (lv !== undefined && lv !== null) lMap.set(c.date, normalizeGHLevel(lv));
        });
        const withLevel = lMap.size > 0;
        setHeatmap(heatmapYear === "last" ? buildHeatmapFromCounts(cMap, new Date(), withLevel ? lMap : undefined) : buildHeatmapForYear(cMap, heatmapYear as number, withLevel ? lMap : undefined));
      } catch {
        // fallback heatmap dari events kalau proxy down — akan diisi di bawah
      }
    })();
    promises.push(heatP);

    const ghP = (async () => {
      // cache-first biar tidak loading lama — kasih fallback statis kalau cache kosong
      const cached = readLangsCache();
      if (cached?.length) {
        setLangs(cached);
        setLangErr(null);
      } else {
        setLangs(FALLBACK_LANGS);
      }
      try {
        const r = await fetchWithTimeout(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`, { headers: ghHeaders() }, 4500);
        if (!r.ok) throw new Error(`${r.status}`);
        const repos: { name: string; languages_url: string; language: string | null }[] = await r.json();
        let sorted: LangStat[];
        // pakai bytes asli biar 25% rata hilang — JS 56% sesuai live: kulinara+project_bps_tasik JS 2.1MB
        // tanpa token tetap pakai languages_url (4 repo ringan, tidak bikin 403), hanya fallback ke count jika gagal
        const langMapsAll = await Promise.all(
          repos.slice(0, 20).map(async (repo) => {
            try {
              const lr = await fetchWithTimeout(repo.languages_url, { headers: ghHeaders() }, 3500);
              if (!lr.ok) return null as unknown as Record<string, number>;
              return (await lr.json()) as Record<string, number>;
            } catch {
              return null as unknown as Record<string, number>;
            }
          })
        );
        const bytes = new Map<string, number>();
        let hasBytes = false;
        langMapsAll.forEach((m) => {
          if (!m || typeof m !== "object") return;
          const ent = Object.entries(m as Record<string, number>);
          if (ent.length) hasBytes = true;
          ent.forEach(([k, v]) => bytes.set(k, (bytes.get(k) || 0) + v));
        });
        if (hasBytes && bytes.size) {
          const sum = Array.from(bytes.values()).reduce((a, b) => a + b, 0) || 1;
          // filter noise <1% (Blade 0.2% / Batchfile 0.2% / Dockerfile 0.1% / Shell 0.3%) + merge Blade->PHP (Laravel)
          const merged = new Map<string, number>();
          for (const [k, v] of bytes.entries()) {
            const key = k === "Blade" ? "PHP" : k;
            merged.set(key, (merged.get(key) || 0) + v);
          }
          const filtered = [...merged.entries()].filter(([, v]) => (v / sum) * 100 >= 1);
          const useEntries = filtered.length >= 4 ? filtered : [...merged.entries()];
          const useSum = useEntries.reduce((a, [, v]) => a + v, 0) || sum;
          sorted = useEntries
            .map(([lang, count]) => ({ lang, count, pct: Math.round((count / useSum) * 100) }))
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 6);
        } else {
          // jangan fallback count repo 1-1 (jadi 25% rata) — pakai bytes fallback jujur
          sorted = [...FALLBACK_LANGS].sort((a, b) => b.pct - a.pct);
        }
        if (sorted.length) {
          const s = sorted.reduce((a, b) => a + b.pct, 0);
          if (s !== 100) sorted[0].pct += 100 - s;
        }
        setLangs(sorted);
        writeLangsCache(sorted);
        setLangErr(null);
      } catch {
        // 403 / timeout — tetap tampil fallback/cache, jangan tampilkan Batas GitHub
        const ok = readLangsCache();
        if (ok?.length) {
          setLangs((prev) => (prev && prev.length ? prev : ok));
        } else {
          setLangs((prev) => (prev && prev.length ? prev : FALLBACK_LANGS));
        }
        setLangErr(null);
      }
    })();
    promises.push(ghP);

    const evP = (async () => {
      try {
        const er = await fetchWithTimeout(`https://api.github.com/users/${USER}/events/public?per_page=100`, { headers: ghHeaders() }, 4500);
        if (!er.ok) throw new Error(`${er.status}`);
        const events: { type: string; repo: { name: string }; payload: { commits?: { message: string }[]; size?: number }; created_at: string }[] =
          await er.json();
        const push = events.filter((e) => e.type === "PushEvent");
        const commitItems: CommitItem[] = push.slice(0, 20).map((e) => {
          const msg = e.payload.commits?.[0]?.message || fallbackCommit;
          const d = new Date(e.created_at);
          const rel = d.toLocaleDateString(isEn ? "en-US" : "id-ID", { day: "2-digit", month: "short", year: "numeric" });
          return {
            repo: e.repo.name.replace(`${USER}/`, ""),
            message: msg.split("\n")[0].slice(0, 72),
            time: rel,
            url: `https://github.com/${e.repo.name}`,
          };
        });
        setCommits(commitItems.length ? commitItems : []);
        setErr(null);
        // kalau heatmap belum keisi dari jogruber, fallback dari events
        setHeatmap((prev) => {
          if (prev && prev.total > 0) return prev;
          const dayMap = new Map<string, number>();
          for (const e of push) {
            const iso = toLocalISO(new Date(e.created_at));
            const c = e.payload.commits?.length ?? e.payload.size ?? 1;
            dayMap.set(iso, (dayMap.get(iso) ?? 0) + c);
          }
          return heatmapYear === "last" ? buildHeatmapFromCounts(dayMap, new Date()) : buildHeatmapForYear(dayMap, heatmapYear as number);
        });
      } catch {
        setErr(null);
      }
    })();
    promises.push(evP);

    await Promise.allSettled(promises);
    setLoading(false);
  };

  useEffect(() => {
    if (!enabled) return;
    fetchAll();
    const id = window.setInterval(fetchAll, 60000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEn, fallbackCommit, errRepo, errAct, heatmapYear, enabled]);

  useEffect(() => {
    // heatmap baru mount — resize lenis pake debounce biar tidak layout thrash tiap kotak shuffle
    let id = 0 as unknown as number;
    const cb = () => { (lenisInstance as unknown as { resize?: () => void })?.resize?.(); };
    if ("requestIdleCallback" in window) id = (window as unknown as { requestIdleCallback: (cb: ()=>void)=>number }).requestIdleCallback(cb);
    else id = window.setTimeout(cb, 160) as unknown as number;
    return () => {
      if ("cancelIdleCallback" in window) (window as unknown as { cancelIdleCallback:(n:number)=>void }).cancelIdleCallback(id as number);
      else window.clearTimeout(id);
    };
  }, [heatmap]);

  return { langs, commits, heatmap, loading, err, langErr, refresh: fetchAll };
}

function TerminalHero({ lines }: { lines: string[] }) {
  return (
    <div className="warm-card overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-border/10 bg-cream-deep px-4 py-3">
        <span className="flex gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-terracotta" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#8FA89B]" />
        </span>
        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">kyronix@lab — zsh</span>
        <span className="ml-auto inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
          <span className="h-2 w-2 rounded-full bg-terracotta live-dot" /> live
        </span>
      </div>
      <div className="space-y-1.5 bg-cream px-4 py-4 font-mono text-[12px] leading-5">
        {lines.map((l, i) => (
          <motion.p
            key={l}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.2 + i * 0.18 }}
            className={i === 0 ? "text-muted" : i === 1 ? "text-ink" : "text-muted"}
          >
            {l}
          </motion.p>
        ))}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.4 }}
          className="pt-1 text-terracotta"
        >
          <span className="mr-2">›</span>
          <span className="inline-block h-[1.1em] w-[8px] translate-y-[2px] bg-terracotta animate-pulse" />
        </motion.p>
      </div>
    </div>
  );
}

export function DashboardEmbed({ lazy }: { lazy?: boolean }) {
  const { lang } = useLang();
  const isEn = lang === "en";
  const t = tDict[lang];
  const [heatmapYear, setHeatmapYear] = useState<number | "last">("last");
  const embedRef = useRef<HTMLDivElement>(null);
  const embedInView = useInView(embedRef as unknown as React.RefObject<Element>, { amount: 0.05 });
  const shouldFetch = !lazy || embedInView;
  const bahasaRef = useRef<HTMLElement>(null);
  const langInView = useInView(bahasaRef as unknown as React.RefObject<Element>, { amount: 0.25 });
  // 1x parallax aja (blur disain lain udah whileInView) — hemat 8 listeners + spring biar 60/120 halus
  const { scrollYProgress: dashProgress } = useScroll({ target: embedRef as unknown as React.RefObject<Element>, offset: ["start end", "end start"] });
  const rawHead = useTransform(dashProgress, [0, 1], [10, -10]);
  const dashHeadY = useSpring(rawHead, { stiffness: 140, damping: 30, mass: 0.3 });
  const { langs, commits, heatmap, loading, err, langErr } = useGitHubLive(isEn, t.fallbackCommit, t.errRepo, t.errAct, t.errGeneric, heatmapYear, shouldFetch);

  // B — real dari heatmap: total = heatmap.total, hari ini = count today, streak = beruntun mundur
  const todayId = toLocalISO(new Date());
  const todayCount = useMemo(() => {
    if (!heatmap) return 0;
    for (const w of heatmap.weeks) for (const d of w) if (d.iso === todayId) return d.count;
    return 0;
  }, [heatmap, todayId]);
  const totalReal = heatmap?.total ?? 0;
  const streakReal = useMemo(() => {
    if (!heatmap) return 0;
    const flat = heatmap.weeks.flat();
    const map = new Map(flat.map((d) => [d.iso, d.count] as const));
    let s = 0;
    const cur = new Date();
    cur.setHours(0, 0, 0, 0);
    for (let i = 0; i < 500; i++) {
      const iso = toLocalISO(cur);
      const c = map.get(iso) ?? 0;
      if (c > 0) s++;
      else if (s > 0) break;
      // kalau hari ini 0 tetap lanjut cek kemarin (streak tidak reset di hari 0 kalau kemarin ada)
      // tapi berhenti kalau sudah ada streak dan ketemu 0
      if (s === 0 && i > 0 && (map.get(iso) ?? 0) === 0) {
        // cek mundur tanpa batas: skip 0 di awal hanya 1 hari
      }
      cur.setDate(cur.getDate() - 1);
      if (s > 0 && (map.get(toLocalISO(cur)) ?? 0) === 0) break;
    }
    // hitung ulang yang benar: beruntun mundur dari today (kalau today 0, mulai dari yesterday)
    let streak2 = 0;
    const c2 = new Date();
    c2.setHours(0, 0, 0, 0);
    // kalau today 0, mulai dari yesterday
    if ((map.get(toLocalISO(c2)) ?? 0) === 0) c2.setDate(c2.getDate() - 1);
    for (let i = 0; i < 400; i++) {
      const iso = toLocalISO(c2);
      if ((map.get(iso) ?? 0) > 0) {
        streak2++;
        c2.setDate(c2.getDate() - 1);
      } else break;
    }
    return streak2;
  }, [heatmap]);
  // handleBack hanya fallback jika onBack tidak ada (dashboard dipakai tanpa App route)

  return (
    <div ref={embedRef} className="relative">

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.35, margin: "0px 0px -10% 0px" }} transition={{ duration: 0.6, ease: EASE }} style={{ y: dashHeadY } as unknown as Record<string, unknown>} className="text-center will-change-transform">
          <p className="flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-muted">
            <span className="inline-flex h-3 w-3 items-center justify-center text-terracotta/60">
              <Cpu size={14} />
            </span>
            {t.eyebrow}
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-[clamp(2.2rem,6vw,4rem)] font-extrabold leading-[0.9] tracking-[0.01em] text-ink">
            {t.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            {t.desc}
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3, margin: "0px 0px -10% 0px" }} transition={{ duration: 0.6, ease: EASE, delay: 0.04 }} className="warm-card flex min-h-[118px] flex-col justify-between p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">{t.totalBelajar}</p>
            <p className="mt-2 font-display text-3xl font-extrabold leading-none text-ink">
              {totalReal.toLocaleString(isEn ? "en-US" : "id-ID")}
              <span className="ml-1 font-mono text-sm font-bold tracking-widest text-muted"> {t.jam}</span>
            </p>
            <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted">
              <Clock size={12} className="text-terracotta" /> {isEn ? (heatmapYear === "last" ? "last year" : String(heatmapYear)) : (heatmapYear === "last" ? "1 tahun terakhir" : String(heatmapYear))}
            </span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3, margin: "0px 0px -10% 0px" }} transition={{ duration: 0.6, ease: EASE, delay: 0.12 }} className={`warm-card flex min-h-[118px] flex-col justify-between p-5 ${todayCount === 0 ? "opacity-90" : ""}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">{t.ngodingHariIni}</p>
            <p className={`mt-2 font-display text-2xl font-extrabold ${todayCount === 0 ? "text-muted" : "text-ink"}`}>
              {todayCount}
              <span className="ml-1 font-mono text-xs text-muted"> {t.jam}</span>
            </p>
            <span className={`mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest ${todayCount === 0 ? "text-muted" : "text-terracotta"}`}>
              <Activity size={12} className={todayCount === 0 ? "text-muted" : "text-terracotta"} /> {todayCount === 0 ? t.todayEmpty : t.todayActive}
            </span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3, margin: "0px 0px -10% 0px" }} transition={{ duration: 0.6, ease: EASE, delay: 0.2 }} className="warm-card flex min-h-[118px] flex-col justify-between p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">{t.streak}</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-ink">
              {streakReal}
              <span className="ml-1 font-mono text-xs text-muted"> {t.hari}</span>
            </p>
            <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted">
              <Flame size={12} className="text-terracotta" /> {t.beruntun}
            </span>
          </motion.div>
        </div>

        <motion.section ref={bahasaRef as unknown as React.RefObject<HTMLElement>} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.2, margin: "0px 0px -10% 0px" }} transition={{ duration: 0.6, ease: EASE, delay: 0.08 }} className="mt-6 warm-card p-6">
            <h2 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-ink">{t.bahasaTitle}</h2>
            <div className="mt-5 space-y-3">
              {langs && langs.length ? (
                langs.map((l, i) => (
                  <div key={l.lang}>
                    <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest">
                      {(() => { const ic = langIconSrc(l.lang); return (
                      <span className="inline-flex items-center gap-2 font-semibold text-ink">
                        {ic ? <img src={ic} alt="" aria-hidden width={16} height={16} className="h-4 w-4 object-contain" loading="lazy" /> : null}
                        {l.lang}
                      </span>
                      );})()}
                      <span className="text-muted">{l.pct}{t.percent}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-deep">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={langInView ? { width: `${l.pct}%` } : { width: 0 }}
                        transition={{ duration: 0.9, ease: EASE, delay: langInView ? 0.08 + i * 0.07 : 0 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#B85E2E] to-[#E07A5F]"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="font-mono text-xs text-muted">{t.noLang}</p>
              )}
            </div>
            <a
              href={`https://github.com/${USER}?tab=repositories`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-terracotta hover:text-ink"
            >
              {t.viewGithub} <SiGithub size={14} />
            </a>
          </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.2, margin: "0px 0px -10% 0px" }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }} className="mt-6 warm-card p-6">
          <h2 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-ink">{t.commitTitle}</h2>
          {heatmap ? (
            <ContributionHeatmap
              weeks={heatmap.weeks}
              total={heatmap.total}
              isEn={isEn}
              t={t}
              yearLabel={String(heatmapYear)}
              onYearChange={setHeatmapYear as (y: number | "last") => void}
              availableYears={[2026, 2025]}
            />
          ) : (
            <p className="mt-5 font-mono text-xs text-muted">{t.loadingActivity}</p>
          )}
        </motion.section>

        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-widest text-muted">
          {t.footer}
        </p>
    </div>
  );
}

export default function Dashboard({ onBack: _onBack }: { onBack?: () => void }) {
  return <DashboardEmbed />;
}
