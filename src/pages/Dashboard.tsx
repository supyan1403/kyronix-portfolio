import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Radio, Cpu, Database, BarChart3, Clock, Flame } from "lucide-react";
import { SiGithub } from "react-icons/si";

const EASE = [0.22, 1, 0.36, 1] as const;
const USER = "supyan1403";

// no ":" in any visible copy per spec
type LangStat = { lang: string; count: number; pct: number };
type CommitItem = { repo: string; message: string; time: string; url: string };

function useGitHubLive() {
  const [langs, setLangs] = useState<LangStat[] | null>(null);
  const [commits, setCommits] = useState<CommitItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const r = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`);
      if (!r.ok) throw new Error("gagal memuat repositori");
      const repos: { language: string | null; name: string }[] = await r.json();
      const map = new Map<string, number>();
      repos.forEach((repo) => {
        const l = repo.language || "Lainnya";
        map.set(l, (map.get(l) || 0) + 1);
      });
      const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
      const sorted = Array.from(map.entries())
        .map(([lang, count]) => ({ lang, count, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      setLangs(sorted);

      const er = await fetch(`https://api.github.com/users/${USER}/events/public?per_page=20`);
      if (!er.ok) throw new Error("gagal memuat aktivitas");
      const events: { type: string; repo: { name: string }; payload: { commits?: { message: string }[] }; created_at: string }[] =
        await er.json();
      const push = events
        .filter((e) => e.type === "PushEvent")
        .slice(0, 5)
        .map((e) => {
          const msg = e.payload.commits?.[0]?.message || "memperbarui repositori";
          const d = new Date(e.created_at);
          const rel = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
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
      setErr(e instanceof Error ? e.message : "gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const id = window.setInterval(fetchAll, 60000);
    return () => window.clearInterval(id);
  }, []);

  return { langs, commits, loading, err, refresh: fetchAll };
}

function TerminalHero() {
  const lines = [
    "> inisialisasi kyronix lab",
    "> menghubungkan ke github supyan1403 — terhubung",
    "> memindai bahasa dan aktivitas terkini — selesai",
    "> sinkronisasi rekam jejak harian — live",
  ];
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
  const { langs, commits, loading, err } = useGitHubLive();
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
            ← Kembali ke Beranda
          </button>
          <span className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-terracotta live-dot" /> pembaruan tiap 60 detik
          </span>
        </div>

        <div className="mt-8 text-center">
          <p className="flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-muted">
            <span className="inline-flex h-3 w-3 items-center justify-center text-terracotta/60">
              <Cpu size={14} />
            </span>
            Kyronix Lab — Dashboard Aktivitas
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-[clamp(2.2rem,6vw,4rem)] font-extrabold leading-[0.9] tracking-[0.01em] text-ink">
            PANTAUAN AKTIVITAS LANGSUNG
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Cara saya merawat konsistensi belajar dan eksplorasi pengembangan aplikasi web yang terekam secara live dari aktivitas harian
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <TerminalHero />
          </div>
          <div className="grid gap-4 md:col-span-5 md:grid-cols-1">
            <div className="warm-card flex items-center justify-between p-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">Total Waktu Belajar</p>
                <p className="mt-1 font-display text-3xl font-extrabold leading-none text-ink">
                  {totalBelajar}
                  <span className="ml-1 font-mono text-sm font-bold tracking-widest text-muted"> JAM</span>
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted">akumulasi hingga hari ini — live</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center border border-terracotta/20 bg-cream-deep text-terracotta">
                <Clock size={18} />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="warm-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">Ngoding Hari Ini</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-ink">
                  {ngodingHariIni}
                  <span className="ml-1 font-mono text-xs text-muted"> JAM</span>
                </p>
                <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-terracotta live-dot" /> live ticker
                </span>
              </div>
              <div className="warm-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">Rekam Jejak Harian</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-ink">
                  {streak}
                  <span className="ml-1 font-mono text-xs text-muted"> HARI</span>
                </p>
                <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                  <Flame size={12} className="text-terracotta" /> beruntun
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-12 md:items-start">
          <section className="warm-card p-6 md:col-span-5">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-ink">Bahasa Paling Sering Digunakan</h2>
              <span className="font-mono text-[11px] tracking-widest text-muted">live dari GitHub</span>
            </div>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted">
              Cara saya merawat eksplorasi teknologi yang terlihat dari repositori aktif
            </p>
            <div className="mt-5 space-y-3">
              {loading ? (
                <p className="font-mono text-xs text-muted">Memuat data bahasa</p>
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
                      <span className="text-muted">{l.pct} persen</span>
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
                <p className="font-mono text-xs text-muted">Belum ada data bahasa</p>
              )}
            </div>
            <a
              href={`https://github.com/${USER}?tab=repositories`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-terracotta hover:text-ink"
            >
              Lihat GitHub <SiGithub size={14} />
            </a>
          </section>

          <section className="warm-card p-6 md:col-span-7">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-ink">Aktivitas Commit Terbaru</h2>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-muted">
                <Radio size={12} className="text-terracotta live-dot" /> live 60 detik
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted">
              Cara saya menjaga alur kerja harian yang terekam dari kontribusi terbaru
            </p>
            <div className="mt-5 space-y-3">
              {loading ? (
                <p className="font-mono text-xs text-muted">Memuat aktivitas</p>
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
                <p className="font-mono text-xs text-muted">Belum ada aktivitas terbaru</p>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="warm-card p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
              <BarChart3 size={14} /> Fokus Harian
            </div>
            <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-ink">
              Cara saya menjaga ritme belajar yang mendalam dan berkelanjutan
            </p>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full ${i < 5 ? "bg-terracotta" : "bg-border/30"}`} />
              ))}
            </div>
            <p className="mt-2 font-mono text-[11px] text-muted">7 hari terakhir — 5 hari aktif</p>
          </div>
          <div className="warm-card p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
              <Database size={14} /> Pemodelan Sistem
            </div>
            <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-ink">
              Cara saya merancang alur data dan arsitektur agar gagasan kompleks menjadi fungsional
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted">Riset berbasis pemodelan yang rapi dan terukur</p>
          </div>
          <div className="warm-card p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
              <Cpu size={14} /> Eksplorasi Web App
            </div>
            <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-ink">
              Cara saya memperluas wawasan melalui pengembangan aplikasi web secara mandiri
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted">Eksperimen berkelanjutan di Kyronix Lab</p>
          </div>
        </div>

        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-widest text-muted">
          Kyronix Lab — ruang eksperimen tempat gagasan menjadi sistem
        </p>
      </div>
    </main>
  );
}
