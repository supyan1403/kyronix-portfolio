type Body = {
  name?: string;
  email?: string;
  subject?: string;
  phone?: string;
  message?: string;
  _gotcha?: string;
  turnstileToken?: string;
};

type VercelRequest = { method?: string; body?: Body; headers: Record<string, string | string[] | undefined> };
type VercelResponse = { status: (n: number) => VercelResponse; json: (o: unknown) => void; setHeader: (k: string, v: string) => void };

const RATE = new Map<string, { n: number; t: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 5;

function rateOk(ip: string): boolean {
  const now = Date.now();
  const v = RATE.get(ip);
  if (!v || now - v.t > WINDOW_MS) { RATE.set(ip, { n: 1, t: now }); return true; }
  if (v.n >= LIMIT) return false;
  v.n++; return true;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = (req.body ?? {}) as Body;

  // honeypot — bot ngisi _gotcha langsung 200 ok palsu biar gak tau ke-block
  if (body._gotcha && String(body._gotcha).trim() !== "") {
    return res.status(200).json({ ok: true });
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    "unknown";
  if (!rateOk(ip)) return res.status(429).json({ ok: false, error: "Terlalu sering. Coba lagi nanti." });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const message = String(body.message ?? "").trim();
  const turnstileToken = String(body.turnstileToken ?? "").trim();

  if (!name || name.length < 2) return res.status(400).json({ ok: false, error: "Nama minimal 2 huruf." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: "Email tidak valid." });
  if (!message || message.length < 10) return res.status(400).json({ ok: false, error: "Pesan minimal 10 karakter." });
  if (subject.length > 120) return res.status(400).json({ ok: false, error: "Subjek terlalu panjang." });
  if (phone.length > 30) return res.status(400).json({ ok: false, error: "No HP terlalu panjang." });

  // Turnstile verify — kalau env belum diisi, skip (biar dev gak mental)
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (secret && turnstileToken) {
    try {
      const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(turnstileToken)}&remoteip=${encodeURIComponent(ip)}`,
      });
      const data = (await verify.json()) as { success?: boolean };
      if (!data.success) return res.status(400).json({ ok: false, error: "Verifikasi anti-bot gagal. Refresh halaman." });
    } catch {
      return res.status(500).json({ ok: false, error: "Gagal verifikasi anti-bot." });
    }
  } else if (secret && !turnstileToken) {
    return res.status(400).json({ ok: false, error: "Verifikasi anti-bot wajib." });
  }

  const to = process.env.CONTACT_TO || "supyansauri47@gmail.com";
  const from = process.env.CONTACT_FROM || "KYRONIX <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: "Server belum dikonfigurasi (RESEND_API_KEY)." });

  const subjectLine = subject ? `[KYRONIX] ${subject}` : `[KYRONIX] Pesan dari ${name}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#1A1816">
      <h2 style="margin:0 0 12px">Pesan baru dari kyronix.my.id</h2>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Nama</td><td><b>${esc(name)}</b></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        ${phone ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">HP</td><td>${esc(phone)}</td></tr>` : ""}
        ${subject ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Subjek</td><td>${esc(subject)}</td></tr>` : ""}
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280">IP</td><td style="color:#9ca3af;font-size:12px">${esc(ip)}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
      <pre style="white-space:pre-wrap;word-break:break-word;background:#F5EFE6;border:1px solid #3A3632;border-radius:12px;padding:16px;margin:0">${esc(message)}</pre>
      <p style="color:#9ca3af;font-size:12px;margin:12px 0 0">Balas langsung via Reply — replyTo sudah di-set ke ${esc(email)}.</p>
    </div>
  `;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: subjectLine,
        html,
      }),
    });
    if (!r.ok) {
      const txt = await r.text();
      console.error("resend error", r.status, txt);
      return res.status(502).json({ ok: false, error: "Gagal kirim email. Coba lagi." });
    }
  } catch (e) {
    console.error(e);
    return res.status(502).json({ ok: false, error: "Gagal kirim email. Coba lagi." });
  }

  return res.status(200).json({ ok: true });
}
