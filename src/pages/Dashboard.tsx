import { useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import { Cpu, Database, BarChart3, Clock, Flame } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { useLang } from "../langCtx";

const EASE = [0.22, 1, 0.36, 1] as const;
const USER = "supyan1403";

function ghHeaders(): HeadersInit {
  const tok = (import.meta.env.VITE_GITHUB_TOKEN as string | undefined)?.trim();
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

const FALLBACK_LANGS: LangStat[] = [
  { lang: "TypeScript", count: 38, pct: 38 },
  { lang: "JavaScript", count: 24, pct: 24 },
  { lang: "CSS", count: 14, pct: 14 },
  { lang: "HTML", count: 12, pct: 12 },
  { lang: "Python", count: 7, pct: 7 },
  { lang: "Lainnya", count: 5, pct: 5 },
];
const LANGS_CACHE_KEY = "kyronix:langs:v1";
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
type HeatDay = { date: string; iso: string; count: number };
type HeatWeek = HeatDay[];

const tDict = {
  id: {
    back: "Kembali ke Beranda",
    update: "diperbarui dari GitHub",
    eyebrow: "Kyronix Lab — Dashboard Aktivitas",
    title: "PANTAUAN AKTIVITAS LANGSUNG",
    desc: "Cara saya merawat konsistensi belajar dan eksplorasi pengembangan aplikasi web yang terekam dari aktivitas harian",
    totalBelajar: "Total Kontribusi",
    ngodingHariIni: "Belajar Hari Ini",
    streak: "Rekam Jejak Harian",
    jam: "KONTRIBUSI",
    hari: "HARI",
    totalHint: "sesuai GitHub — 1 tahun terakhir",
    liveTicker: "hari ini",
    todayEmpty: "istirahat hari ini",
    todayActive: "ada aktivitas hari ini",
    beruntun: "beruntun",
    bahasaTitle: "Bahasa Paling Sering Digunakan",
    loadingLang: "Memuat data bahasa",
    noLang: "Belum ada data bahasa",
    percent: "persen",
    viewGithub: "Lihat GitHub",
    commitTitle: "Aktivitas Terbaru",
    loadingActivity: "Memuat aktivitas",
    noActivity: "Belum ada aktivitas terbaru",
    fallbackCommit: "memperbarui repositori",
    heatContrib: "kontribusi dalam setahun terakhir",
    less: "Kurang",
    more: "Banyak",
    fokusHarian: "Fokus Harian",
    fokusDesc: "Cara saya menjaga ritme belajar yang mendalam dan berkelanjutan",
    fokusHint: "7 hari terakhir — aktivitas real dari heatmap",
    pemodelan: "Pemodelan Sistem",
    pemodelanDesc: "Cara saya merancang alur data dan arsitektur agar gagasan kompleks menjadi fungsional",
    pemodelanHint: "Riset berbasis pemodelan yang rapi dan terukur",
    eksplorasi: "Pengembangan Web",
    eksplorasiDesc: "Cara saya memperluas wawasan melalui pengembangan web secara mandiri",
    eksplorasiHint: "Eksperimen berkelanjutan di Kyronix Lab",
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
    ngodingHariIni: "Learning Today",
    streak: "Daily Streak",
    jam: "CONTRIBUTIONS",
    hari: "DAYS",
    totalHint: "matching GitHub — last year",
    liveTicker: "today",
    todayEmpty: "rest today",
    todayActive: "active today",
    beruntun: "in a row",
    bahasaTitle: "Most Used Languages",
    loadingLang: "Loading language data",
    noLang: "No language data yet",
    percent: "percent",
    viewGithub: "View GitHub",
    commitTitle: "Recent Activity",
    loadingActivity: "Loading activity",
    noActivity: "No recent activity",
    fallbackCommit: "updating repository",
    heatContrib: "contributions in the last year",
    less: "Less",
    more: "More",
    fokusHarian: "Daily Focus",
    fokusDesc: "How I keep a deep and sustainable learning rhythm",
    fokusHint: "Last 7 days — real activity from heatmap",
    pemodelan: "System Modeling",
    pemodelanDesc: "How I design data flows and architecture so complex ideas become functional",
    pemodelanHint: "Research grounded in clean and measurable modeling",
    eksplorasi: "Web Development",
    eksplorasiDesc: "How I expand horizons through independent web development",
    eksplorasiHint: "Continuous experiments at Kyronix Lab",
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

function buildHeatmapFromCounts(countMap: Map<string, number>, today = new Date()) {
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
      const iso = cur.toISOString().slice(0, 10);
      const cnt = countMap.get(iso) ?? 0;
      if (cur >= startExact && cur <= end) total += cnt;
      week.push({
        date: cur.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        iso,
        count: cnt,
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

function levelMeta(count: number) {
  if (count === 0) return { bg: "#2A2826", border: "rgba(58,54,50,0.45)" };
  if (count <= 2) return { bg: "#5A2E18", border: "rgba(90,46,24,1)" };
  if (count <= 5) return { bg: "#8A3E1A", border: "rgba(138,62,26,1)" };
  if (count <= 9) return { bg: "#C4713C", border: "rgba(196,113,60,1)" };
  return { bg: "#E07A5F", border: "rgba(224,122,95,1)" };
}

function ContributionHeatmap({
  weeks,
  total,
  isEn,
  t,
}: {
  weeks: HeatWeek[];
  total: number;
  isEn: boolean;
  t: (typeof tDict)["id"];
}) {
  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((w, idx) => {
      const d = new Date(w[0].iso);
      const m = d.getMonth();
      if (m !== lastMonth) {
        // only show if there are at least 3 weeks distance or first
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

  return (
    <div className="mt-4">
      <div className="border-b border-border/10 pb-3">
        <p className="font-mono text-[12px] font-semibold tracking-tight text-ink">
          {total.toLocaleString(isEn ? "en-US" : "id-ID")} {t.heatContrib}
        </p>
      </div>

      <div className="mt-3 overflow-x-auto hide-scrollbar border border-border/10 bg-cream-deep/40 p-3">
        <div className="min-w-[760px]">
          {/* month row */}
          <div className="flex gap-[3px] pl-[28px] font-mono text-[10px] leading-none text-muted">
            {weeks.map((_, idx) => {
              const lbl = monthLabels.find((m) => m.col === idx);
              return (
                <span key={idx} className="w-[11px] shrink-0 text-left">
                  {lbl ? lbl.label : ""}
                </span>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-[3px]">
            <div className="flex w-[28px] shrink-0 flex-col gap-[3px] font-mono text-[10px] leading-[11px] text-muted">
              <span className="h-[11px]">Mon</span>
              <span className="h-[11px]"></span>
              <span className="h-[11px]">Wed</span>
              <span className="h-[11px]"></span>
              <span className="h-[11px]">Fri</span>
              <span className="h-[11px]"></span>
              <span className="h-[11px]"></span>
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    const { bg, border } = levelMeta(day.count);
                    const tip = `${day.iso} • ${day.count} ${isEn ? "contributions" : "kontribusi"}`;
                    return (
                      <span
                        key={day.iso}
                        title={tip}
                        aria-label={tip}
                        className="h-[11px] w-[11px] shrink-0 rounded-[2px] border transition-colors hover:border-terracotta/80"
                        style={{ background: bg, borderColor: border } as React.CSSProperties}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[10px] text-muted">
              <span>{t.less}</span>
              <span className="inline-flex gap-[3px]">
                {[0, 1, 3, 6, 11].map((c) => {
                  const { bg, border } = levelMeta(c);
                  return (
                    <i
                      key={c}
                      className="h-[10px] w-[10px] rounded-[2px] border"
                      style={{ background: bg, borderColor: border } as React.CSSProperties}
                    />
                  );
                })}
              </span>
              <span>{t.more}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

function useGitHubLive(isEn: boolean, fallbackCommit: string, errRepo: string, errAct: string, errGeneric: string) {
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
      try {
        const gr = await fetch(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`);
        if (!gr.ok) throw new Error("gh");
        const gj: { contributions: { date: string; count: number }[] } = await gr.json();
        const cMap = new Map<string, number>();
        gj.contributions.forEach((c) => cMap.set(c.date, c.count));
        setHeatmap(buildHeatmapFromCounts(cMap, new Date()));
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
        // tanpa token: jangan 30x languages_url (bikin 403 + lambat) — pakai field language dari /repos
        const hasTok = !!((import.meta.env.VITE_GITHUB_TOKEN as string | undefined)?.trim());
        let sorted: LangStat[];
        if (!hasTok) {
          const c = new Map<string, number>();
          repos.forEach((repo) => {
            const l = repo.language || (isEn ? "Other" : "Lainnya");
            if (l) c.set(l, (c.get(l) || 0) + 1);
          });
          const t = Array.from(c.values()).reduce((a, b) => a + b, 0) || 1;
          sorted = Array.from(c.entries())
            .map(([lang, count]) => ({ lang, count, pct: Math.round((count / t) * 100) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
        } else {
          const slice = repos.slice(0, 12);
          const langMaps = await Promise.all(
            slice.map(async (repo) => {
              try {
                const lr = await fetchWithTimeout(repo.languages_url, { headers: ghHeaders() }, 3500);
                if (!lr.ok) return {} as Record<string, number>;
                return (await lr.json()) as Record<string, number>;
              } catch {
                return {} as Record<string, number>;
              }
            })
          );
          const bytes = new Map<string, number>();
          langMaps.forEach((m) => {
            Object.entries(m).forEach(([k, v]) => bytes.set(k, (bytes.get(k) || 0) + v));
          });
          if (bytes.size) {
            const sum = Array.from(bytes.values()).reduce((a, b) => a + b, 0) || 1;
            sorted = Array.from(bytes.entries())
              .map(([lang, count]) => ({ lang, count, pct: Math.round((count / sum) * 100) }))
              .sort((a, b) => b.pct - a.pct)
              .slice(0, 6);
          } else {
            const c = new Map<string, number>();
            repos.forEach((repo) => {
              const l = repo.language || (isEn ? "Other" : "Lainnya");
              if (l) c.set(l, (c.get(l) || 0) + 1);
            });
            const t = Array.from(c.values()).reduce((a, b) => a + b, 0) || 1;
            sorted = Array.from(c.entries())
              .map(([lang, count]) => ({ lang, count, pct: Math.round((count / t) * 100) }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 6);
          }
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
            const iso = new Date(e.created_at).toISOString().slice(0, 10);
            const c = e.payload.commits?.length ?? e.payload.size ?? 1;
            dayMap.set(iso, (dayMap.get(iso) ?? 0) + c);
          }
          return buildHeatmapFromCounts(dayMap, new Date());
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
    fetchAll();
    const id = window.setInterval(fetchAll, 60000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEn, fallbackCommit, errRepo, errAct]);

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

export default function Dashboard({ onBack }: { onBack?: () => void }) {
  const { lang, setLang } = useLang();
  const isEn = lang === "en";
  const t = tDict[lang];
  const { langs, commits, heatmap, loading, err, langErr } = useGitHubLive(isEn, t.fallbackCommit, t.errRepo, t.errAct, t.errGeneric);

  // B — real dari heatmap: total = heatmap.total, hari ini = count today, streak = beruntun mundur
  const todayId = new Date().toISOString().slice(0, 10);
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
      const iso = cur.toISOString().slice(0, 10);
      const c = map.get(iso) ?? 0;
      if (c > 0) s++;
      else if (s > 0) break;
      // kalau hari ini 0 tetap lanjut cek kemarin (streak tidak reset di hari 0 kalau kemarin ada)
      // tapi berhenti kalau sudah ada streak dan ketemu 0
      if (s === 0 && i > 0 && (map.get(iso) ?? 0) === 0) {
        // cek mundur tanpa batas: skip 0 di awal hanya 1 hari
      }
      cur.setDate(cur.getDate() - 1);
      if (s > 0 && (map.get(cur.toISOString().slice(0, 10)) ?? 0) === 0) break;
    }
    // hitung ulang yang benar: beruntun mundur dari today (kalau today 0, mulai dari yesterday)
    let streak2 = 0;
    const c2 = new Date();
    c2.setHours(0, 0, 0, 0);
    // kalau today 0, mulai dari yesterday
    if ((map.get(c2.toISOString().slice(0, 10)) ?? 0) === 0) c2.setDate(c2.getDate() - 1);
    for (let i = 0; i < 400; i++) {
      const iso = c2.toISOString().slice(0, 10);
      if ((map.get(iso) ?? 0) > 0) {
        streak2++;
        c2.setDate(c2.getDate() - 1);
      } else break;
    }
    return streak2;
  }, [heatmap]);
  const fokusDots = useMemo(() => {
    if (!heatmap) return Array(7).fill(false);
    const flat = heatmap.weeks.flat();
    const map = new Map(flat.map((d) => [d.iso, d.count] as const));
    const out: boolean[] = [];
    const cur = new Date();
    cur.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(cur);
      d.setDate(cur.getDate() - i);
      out.push((map.get(d.toISOString().slice(0, 10)) ?? 0) > 0);
    }
    return out;
  }, [heatmap]);

  const handleBack = () => {
    if (onBack) onBack();
    else {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo(0, 0);
    }
  };

  return (
    <main className="relative min-h-[100dvh] overflow-x-clip bg-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[1]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(224,122,95,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(224,122,95,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        } as React.CSSProperties}
      />
      <div aria-hidden className="pointer-events-none absolute -right-[12%] top-[10%] h-[520px] w-[520px] bg-terracotta/10 blur-[80px]" />
      <div aria-hidden className="pointer-events-none absolute -left-[10%] bottom-[6%] h-[420px] w-[420px] bg-sage/10 blur-[70px]" />

      <div className="relative mx-auto max-w-[1120px] px-[5vw] pb-10 pt-8">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 border border-border bg-surface px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink hover:border-terracotta hover:text-terracotta"
          >
            ← {t.back}
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-terracotta live-dot" /> {t.update}
            </span>
            <div className="flex items-center gap-1 border border-border/10 bg-surface p-1">
              <button onClick={() => setLang("id")} className={`px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest ${!isEn ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>ID</button>
              <button onClick={() => setLang("en")} className={`px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest ${isEn ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>EN</button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-muted">
            <span className="inline-flex h-3 w-3 items-center justify-center text-terracotta/60">
              <Cpu size={14} />
            </span>
            {t.eyebrow}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-[clamp(2.2rem,6vw,4rem)] font-extrabold leading-[0.9] tracking-[0.01em] text-ink">
            {t.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            {t.desc}
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <TerminalHero lines={[...t.terminalLines]} />
          </div>
          <div className="grid gap-4 md:col-span-5 md:grid-cols-1">
            <div className="warm-card flex items-center justify-between p-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">{t.totalBelajar}</p>
                <p className="mt-1 font-display text-3xl font-extrabold leading-none text-ink">
                  {totalReal.toLocaleString(isEn ? "en-US" : "id-ID")}
                  <span className="ml-1 font-mono text-sm font-bold tracking-widest text-muted"> {t.jam}</span>
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted">{t.totalHint}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center border border-terracotta/20 bg-cream-deep text-terracotta">
                <Clock size={18} />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`warm-card p-5 ${todayCount === 0 ? "opacity-90" : ""}`}>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">{t.ngodingHariIni}</p>
                <p className={`mt-2 font-display text-2xl font-extrabold ${todayCount === 0 ? "text-muted" : "text-ink"}`}>
                  {todayCount}
                  <span className="ml-1 font-mono text-xs text-muted"> {t.jam}</span>
                </p>
                <span className={`mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest ${todayCount === 0 ? "text-muted" : "text-terracotta"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${todayCount === 0 ? "bg-border" : "bg-terracotta live-dot"}`} /> {todayCount === 0 ? t.todayEmpty : t.todayActive}
                </span>
              </div>
              <div className="warm-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">{t.streak}</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-ink">
                  {streakReal}
                  <span className="ml-1 font-mono text-xs text-muted"> {t.hari}</span>
                </p>
                <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                  <Flame size={12} className="text-terracotta" /> {t.beruntun}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-12">
          <section className="warm-card p-6 md:col-span-5">
            <h2 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-ink">{t.bahasaTitle}</h2>
            <div className="mt-5 space-y-3">
              {langs && langs.length ? (
                langs.map((l, i) => (
                  <motion.div
                    key={l.lang}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ amount: 0.3 }}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.06 }}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest">
                      <span className="font-semibold text-ink">{l.lang}</span>
                      <span className="text-muted">{l.pct} {t.percent}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-deep">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${l.pct}%` }}
                        viewport={{ amount: 0.3 }}
                        transition={{ duration: 0.9, ease: EASE, delay: 0.2 + i * 0.06 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#B85E2E] to-[#E07A5F]"
                      />
                    </div>
                  </motion.div>
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
          </section>
        </div>

        <section className="mt-6 warm-card p-6">
          <h2 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-ink">{t.commitTitle}</h2>
          {heatmap ? (
            <ContributionHeatmap weeks={heatmap.weeks} total={heatmap.total} isEn={isEn} t={t} />
          ) : (
            <p className="mt-5 font-mono text-xs text-muted">{t.loadingActivity}</p>
          )}
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="warm-card p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
              <BarChart3 size={14} /> {t.fokusHarian}
            </div>
            <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-ink">
              {t.fokusDesc}
            </p>
            <div className="mt-3 flex gap-1.5">
              {fokusDots.map((active, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full ${active ? "bg-terracotta" : "bg-border/30"}`} />
              ))}
            </div>
            <p className="mt-2 font-mono text-[11px] text-muted">{t.fokusHint}</p>
          </div>
          <div className="warm-card p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
              <Database size={14} /> {t.pemodelan}
            </div>
            <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-ink">
              {t.pemodelanDesc}
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted">{t.pemodelanHint}</p>
          </div>
          <div className="warm-card p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
              <Cpu size={14} /> {t.eksplorasi}
            </div>
            <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-ink">
              {t.eksplorasiDesc}
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted">{t.eksplorasiHint}</p>
          </div>
        </div>

        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-widest text-muted">
          {t.footer}
        </p>
      </div>
    </main>
  );
}
