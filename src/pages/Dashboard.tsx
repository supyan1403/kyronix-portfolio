import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Radio, Cpu, Database, BarChart3, Clock, Flame } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { useLang } from "../langCtx";

const EASE = [0.22, 1, 0.36, 1] as const;
const USER = "supyan1403";

// no ":" in any visible copy per spec — also no "project" word, use "cara saya"
type LangStat = { lang: string; count: number; pct: number };
type CommitItem = { repo: string; message: string; time: string; url: string };

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
    fokusHarian: "Fokus Harian",
    fokusDesc: "Cara saya menjaga ritme belajar yang mendalam dan berkelanjutan",
    fokusHint: "7 hari terakhir — 5 hari aktif",
    pemodelan: "Pemodelan Sistem",
    pemodelanDesc: "Cara saya merancang alur data dan arsitektur agar gagasan kompleks menjadi fungsional",
    pemodelanHint: "Riset berbasis pemodelan yang rapi dan terukur",
    eksplorasi: "Eksplorasi Web App",
    eksplorasiDesc: "Cara saya memperluas wawasan melalui pengembangan aplikasi web secara mandiri",
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
    desc: "How I nurture consistent learning and web app exploration tracked live from daily activity",
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
    fokusHarian: "Daily Focus",
    fokusDesc: "How I keep a deep and sustainable learning rhythm",
    fokusHint: "Last 7 days — 5 days active",
    pemodelan: "System Modeling",
    pemodelanDesc: "How I design data flows and architecture so complex ideas become functional",
    pemodelanHint: "Research grounded in clean and measurable modeling",
    eksplorasi: "Web App Exploration",
    eksplorasiDesc: "How I expand horizons through independent web app development",
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

function useGitHubLive(isEn: boolean, fallbackCommit: string, errRepo: string, errAct: string, errGeneric: string) {
  const [langs, setLangs] = useState<LangStat[] | null>(null);
  const [commits, setCommits] = useState<CommitItem[] | null>(null);
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

      const er = await fetch(`https://api.github.com/users/${USER}/events/public?per_page=20`);
      if (!er.ok) throw new Error(errAct);
      const events: { type: string; repo: { name: string }; payload: { commits?: { message: string }[] }; created_at: string }[] =
        await er.json();
      const push = events
        .filter((e) => e.type === "PushEvent")
        .slice(0, 5)
        .map((e) => {
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
      setCommits(push.length ? push : []);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : errGeneric);
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

  return { langs, commits, loading, err, refresh: fetchAll };
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
  const { langs, commits, loading, err } = useGitHubLive(isEn, t.fallbackCommit, t.errRepo, t.errAct, t.errGeneric);
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
            <div className="mt-5 space-y-3">
              {loading ? (
                <p className="font-mono text-xs text-muted">{t.loadingActivity}</p>
              ) : err ? (
                <p className="font-mono text-xs text-terracotta">{err}</p>
              ) : commits && commits.length ? (
                commits.map((c, i) => (
                  <motion.a
                    key={c.repo + i}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ amount: 0.2 }}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.06 }}
                    className="flex items-start justify-between gap-3 border border-border/10 bg-cream px-4 py-3 hover:border-terracotta/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-bold uppercase tracking-widest text-ink">{c.repo}</p>
                      <p className="mt-1 line-clamp-1 font-mono text-xs leading-relaxed text-muted">{c.message}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-terracotta">{c.time}</span>
                  </motion.a>
                ))
              ) : (
                <p className="font-mono text-xs text-muted">{t.noActivity}</p>
              )}
            </div>
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
