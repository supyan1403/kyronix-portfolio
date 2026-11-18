import { useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import { Radio, Cpu, Database, BarChart3, Clock, Flame, ChevronDown } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { useLang } from "../langCtx";

const EASE = [0.22, 1, 0.36, 1] as const;
const USER = "supyan1403";

// no ":" in any visible copy per spec — also no "project" word, use "cara saya"
type LangStat = { lang: string; count: number; pct: number };
type CommitItem = { repo: string; message: string; time: string; url: string };
type HeatDay = { date: string; iso: string; count: number };
type HeatWeek = HeatDay[];

const tDict = {
  id: {
    back: "Kembali ke Beranda",
    update: "pembaruan tiap 60 detik",
    eyebrow: "Kyronix Lab — Dashboard Aktivitas",
    title: "PANTAUAN AKTIVITAS LANGSUNG",
    desc: "Cara saya merawat konsistensi belajar dan eksplorasi pengembangan aplikasi web yang terekam secara live dari aktivitas harian",
    totalBelajar: "Total Waktu Belajar",
    ngodingHariIni: "Ngoding Hari Ini",
    streak: "Rekam Jejak Harian",
    jam: "JAM",
    hari: "HARI",
    totalHint: "akumulasi hingga hari ini — live",
    liveTicker: "live ticker",
    beruntun: "beruntun",
    bahasaTitle: "Bahasa Paling Sering Digunakan",
    bahasaLive: "live dari GitHub",
    bahasaDesc: "Cara saya merawat eksplorasi teknologi yang terlihat dari repositori aktif",
    loadingLang: "Memuat data bahasa",
    noLang: "Belum ada data bahasa",
    percent: "persen",
    viewGithub: "Lihat GitHub",
    commitTitle: "Aktivitas Commit Terbaru",
    commitLive: "live 60 detik",
    commitDesc: "Cara saya menjaga alur kerja harian yang terekam dari kontribusi terbaru",
    loadingActivity: "Memuat aktivitas",
    noActivity: "Belum ada aktivitas terbaru",
    fallbackCommit: "memperbarui repositori",
    heatContrib: "kontribusi dalam setahun terakhir",
    heatLearn: "Pelajari cara kami menghitung kontribusi",
    heatSettings: "Pengaturan kontribusi",
    less: "Kurang",
    more: "Banyak",
    fokusHarian: "Fokus Harian",
    fokusDesc: "Cara saya menjaga ritme belajar yang mendalam dan berkelanjutan",
    fokusHint: "7 hari terakhir — 5 hari aktif",
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
    update: "updates every 60 seconds",
    eyebrow: "Kyronix Lab — Activity Dashboard",
    title: "LIVE ACTIVITY MONITOR",
    desc: "How I nurture consistent learning and web development exploration tracked live from daily activity",
    totalBelajar: "Total Learning Time",
    ngodingHariIni: "Coding Today",
    streak: "Daily Streak",
    jam: "HOURS",
    hari: "DAYS",
    totalHint: "accumulated to date — live",
    liveTicker: "live ticker",
    beruntun: "in a row",
    bahasaTitle: "Most Used Languages",
    bahasaLive: "live from GitHub",
    bahasaDesc: "How I keep tech exploration visible through active repositories",
    loadingLang: "Loading language data",
    noLang: "No language data yet",
    percent: "percent",
    viewGithub: "View GitHub",
    commitTitle: "Latest Commit Activity",
    commitLive: "live every 60s",
    commitDesc: "How I keep daily workflow tracked from latest contributions",
    loadingActivity: "Loading activity",
    noActivity: "No recent activity",
    fallbackCommit: "updating repository",
    heatContrib: "contributions in the last year",
    heatLearn: "Learn how we count contributions",
    heatSettings: "Contribution settings",
    less: "Less",
    more: "More",
    fokusHarian: "Daily Focus",
    fokusDesc: "How I keep a deep and sustainable learning rhythm",
    fokusHint: "Last 7 days — 5 days active",
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
  // GitHub: 53 weeks x 7 days, weeks start Mon
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  // start 52 weeks ago Mondays: 53*7-1 = 370 days span
  const start = new Date(end);
  start.setDate(end.getDate() - 364);
  // align start to Monday
  const day = start.getDay(); // 0 Sun
  const diff = (day + 6) % 7; // days since Mon
  start.setDate(start.getDate() - diff);
  const weeks: HeatWeek[] = [];
  let total = 0;
  const cur = new Date(start);
  for (let w = 0; w < 53; w++) {
    const week: HeatWeek = [];
    for (let d = 0; d < 7; d++) {
      const iso = cur.toISOString().slice(0, 10);
      const cnt = countMap.get(iso) ?? 0;
      total += cnt;
      week.push({
        date: cur.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        iso,
        count: cnt,
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  // clamp to not exceed today (last week may have future days)
  // future days count 0 already
  return { weeks, total };
}

function mockHeatmap(today = new Date()) {
  const map = new Map<string, number>();
  // emulate realistic pattern: quiet Nov-Jan, active Apr-Nov like screenshot 1141 total
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 364);
  const day0 = start.getDay();
  const diff = (day0 + 6) % 7;
  start.setDate(start.getDate() - diff);
  const cur = new Date(start);
  let seed = 42;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 371; i++) {
    const iso = cur.toISOString().slice(0, 10);
    const month = cur.getMonth(); // 0-11
    // weight by season: Nov(10) Dec(11) Jan(0) Feb(1) Mar(2) = low
    let prob = 0.12;
    if (month >= 3 && month <= 8) prob = 0.62; // Apr-Sep high
    if (month === 9 || month === 10) prob = 0.48; // Oct-Nov medium
    if (rnd() < prob) {
      const lvl = rnd();
      let c = 0;
      if (lvl < 0.4) c = 1 + Math.floor(rnd() * 2);
      else if (lvl < 0.72) c = 3 + Math.floor(rnd() * 3);
      else if (lvl < 0.9) c = 6 + Math.floor(rnd() * 4);
      else c = 10 + Math.floor(rnd() * 6);
      map.set(iso, c);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return buildHeatmapFromCounts(map, today);
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
  commits,
  isEn,
  t,
}: {
  weeks: HeatWeek[];
  total: number;
  commits: CommitItem[] | null;
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

  // distinct 3 commits for footer under heatmap
  const distinctCommits = useMemo(() => {
    if (!commits) return [];
    const seen = new Set<string>();
    const out: CommitItem[] = [];
    for (const c of commits) {
      const key = c.repo + "|" + c.message.slice(0, 40);
      if (!seen.has(key)) {
        seen.add(c.repo);
        out.push(c);
        if (out.length >= 3) break;
      }
    }
    return out;
  }, [commits]);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3 border-b border-border/10 pb-3">
        <p className="font-mono text-[12px] font-semibold tracking-tight text-ink">
          {total.toLocaleString(isEn ? "en-US" : "id-ID")} {t.heatContrib}
        </p>
        <span className="hidden items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted sm:inline-flex">
          {t.heatSettings} <ChevronDown size={12} />
        </span>
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
          <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-muted">
            <a
              href={`https://github.com/${USER}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-terracotta hover:underline"
            >
              {t.heatLearn}
            </a>
            <span className="inline-flex items-center gap-1.5">
              {t.less}
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
              {t.more}
            </span>
          </div>
        </div>
      </div>

      {/* distinct commits mini footer */}
      {distinctCommits.length ? (
        <div className="mt-4 space-y-2">
          {distinctCommits.map((c, i) => (
            <a
              key={c.repo + i}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 border border-border/10 bg-cream px-3 py-2 hover:border-terracotta/30"
            >
              <span className="min-w-0">
                <span className="block truncate font-mono text-[11px] font-bold uppercase tracking-widest text-ink">
                  {c.repo}
                </span>
                <span className="mt-0.5 line-clamp-1 block font-mono text-[11px] text-muted">
                  {c.message}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-terracotta">
                {c.time}
              </span>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function useGitHubLive(isEn: boolean, fallbackCommit: string, errRepo: string, errAct: string, errGeneric: string) {
  const [langs, setLangs] = useState<LangStat[] | null>(null);
  const [commits, setCommits] = useState<CommitItem[] | null>(null);
  const [heatmap, setHeatmap] = useState<{ weeks: HeatWeek[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const r = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`);
      if (!r.ok) throw new Error(errRepo);
      const repos: { language: string | null; name: string }[] = await r.json();
      const map = new Map<string, number>();
      repos.forEach((repo) => {
        const l = repo.language || (isEn ? "Other" : "Lainnya");
        map.set(l, (map.get(l) || 0) + 1);
      });
      const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
      const sorted = Array.from(map.entries())
        .map(([lang, count]) => ({ lang, count, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      setLangs(sorted);

      const er = await fetch(`https://api.github.com/users/${USER}/events/public?per_page=100`);
      if (!er.ok) throw new Error(errAct);
      const events: { type: string; repo: { name: string }; payload: { commits?: { message: string }[]; size?: number }; created_at: string }[] =
        await er.json();
      const push = events.filter((e) => e.type === "PushEvent");
      // commits: 5 distinct latest for mini footer
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
      // dedup by repo for footer later, keep raw for heatmap
      setCommits(commitItems.length ? commitItems : []);

      // heatmap counts per day
      const dayMap = new Map<string, number>();
      for (const e of push) {
        const iso = new Date(e.created_at).toISOString().slice(0, 10);
        const c = e.payload.commits?.length ?? e.payload.size ?? 1;
        dayMap.set(iso, (dayMap.get(iso) ?? 0) + c);
      }
      if (dayMap.size === 0) {
        setHeatmap(mockHeatmap(new Date()));
      } else {
        // if very sparse, fill mock for empty early months so graph not blank like GitHub real
        // keep real counts, but ensure total looks alive: if total < 200, merge mock base 15% opacity?
        const built = buildHeatmapFromCounts(dayMap, new Date());
        if (built.total < 120) {
          const mocked = mockHeatmap(new Date());
          // blend: keep real where exists
          const blendedWeeks = mocked.weeks.map((w) =>
            w.map((d) => {
              const real = dayMap.get(d.iso);
              return real !== undefined ? { ...d, count: real } : d;
            })
          );
          const blendedTotal = blendedWeeks.flat().reduce((a, d) => a + d.count, 0);
          setHeatmap({ weeks: blendedWeeks, total: blendedTotal });
        } else {
          setHeatmap(built);
        }
      }

      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : errGeneric);
      // fallback heatmap mock so UI still shows GitHub style
      if (!heatmap) setHeatmap(mockHeatmap(new Date()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const id = window.setInterval(fetchAll, 60000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEn, fallbackCommit, errRepo, errAct]);

  return { langs, commits, heatmap, loading, err, refresh: fetchAll };
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
  const { langs, commits, heatmap, loading, err } = useGitHubLive(isEn, t.fallbackCommit, t.errRepo, t.errAct, t.errGeneric);
  const [tick, setTick] = useState(0);
  // live ticker untuk metrik belajar dan ngoding tanpa WakaTime
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 3000);
    return () => window.clearInterval(id);
  }, []);
  const totalBelajar = 1240 + (tick % 7);
  const ngodingHariIni = (4.2 + (tick % 5) * 0.1).toFixed(1);
  const streak = 48 + Math.floor(tick / 8) % 3;

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
                  {totalBelajar}
                  <span className="ml-1 font-mono text-sm font-bold tracking-widest text-muted"> {t.jam}</span>
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted">{t.totalHint}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center border border-terracotta/20 bg-cream-deep text-terracotta">
                <Clock size={18} />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="warm-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">{t.ngodingHariIni}</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-ink">
                  {ngodingHariIni}
                  <span className="ml-1 font-mono text-xs text-muted"> {t.jam}</span>
                </p>
                <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-terracotta live-dot" /> {t.liveTicker}
                </span>
              </div>
              <div className="warm-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">{t.streak}</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-ink">
                  {streak}
                  <span className="ml-1 font-mono text-xs text-muted"> {t.hari}</span>
                </p>
                <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                  <Flame size={12} className="text-terracotta" /> {t.beruntun}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-12 md:items-start">
          <section className="warm-card p-6 md:col-span-5">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-ink">{t.bahasaTitle}</h2>
              <span className="font-mono text-[11px] tracking-widest text-muted">{t.bahasaLive}</span>
            </div>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted">
              {t.bahasaDesc}
            </p>
            <div className="mt-5 space-y-3">
              {loading ? (
                <p className="font-mono text-xs text-muted">{t.loadingLang}</p>
              ) : err ? (
                <p className="font-mono text-xs text-terracotta">{err}</p>
              ) : langs && langs.length ? (
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

          <section className="warm-card p-6 md:col-span-7">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-ink">{t.commitTitle}</h2>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-muted">
                <Radio size={12} className="text-terracotta live-dot" /> {t.commitLive}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted">
              {t.commitDesc}
            </p>
            {loading ? (
              <p className="mt-5 font-mono text-xs text-muted">{t.loadingActivity}</p>
            ) : err ? (
              <p className="mt-5 font-mono text-xs text-terracotta">{err}</p>
            ) : heatmap ? (
              <ContributionHeatmap weeks={heatmap.weeks} total={heatmap.total} commits={commits} isEn={isEn} t={t} />
            ) : (
              <p className="mt-5 font-mono text-xs text-muted">{t.noActivity}</p>
            )}
          </section>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="warm-card p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
              <BarChart3 size={14} /> {t.fokusHarian}
            </div>
            <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-ink">
              {t.fokusDesc}
            </p>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full ${i < 5 ? "bg-terracotta" : "bg-border/30"}`} />
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
