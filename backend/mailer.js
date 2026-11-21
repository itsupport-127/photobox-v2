// ==========================================================
// mailer — kirim tautan unduh foto ke email tamu (SMTP lewat nodemailer).
//
// Alur: layar booth mengirim { sessionId, email, url } ke POST /api/share/email -> disimpan di tabel share_emails
// -> dikirim di latar belakang (maks. 3 percobaan). Kegagalan email TIDAK pernah menghentikan sesi / layar hasil:
// tamu tetap punya QR. Email dihapus bersama sesi saat masa simpan habis (server.js: cleanupExpiredSessions).
//
// Agar tidak masuk spam: pakai SMTP dari layanan email transaksional dengan domain pengirim sendiri
// (SPF + DKIM aktif) dan isi "Dari" memakai domain itu. Email berisi satu tautan saja, tanpa lampiran.
// ==========================================================
const nodemailer = require("nodemailer");
const settingsStore = require("./settings");
const db = require("./db");

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@.]{2,}$/;
const RETRY_MS = [0, 30 * 1000, 3 * 60 * 1000]; // 3 percobaan
const HOURLY_LIMIT = 120;                          // batas kirim per jam (pengaman bila endpoint disalahgunakan)

function normalizeEmail(v) {
  const e = String(v || "").trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}
const safeUrl = (u) => { try { const x = new URL(String(u)); return /^https?:$/.test(x.protocol) && String(u).length <= 600 ? x.toString() : null; } catch { return null; } };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let tx = null, txSig = "";
function transporter(cfg) {
  const sig = [cfg.host, cfg.port, cfg.secure, cfg.user, cfg.pass].join("|");
  if (tx && sig === txSig) return tx;
  tx = nodemailer.createTransport({
    host: cfg.host, port: cfg.port, secure: !!cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
  });
  txSig = sig;
  return tx;
}

function ready(cfg = settingsStore.load().email) { return !!(cfg.enabled && cfg.host && cfg.from); }

function buildMessage(cfg, eventName, url) {
  const subject = String(cfg.subject || "").replace(/\{event\}/g, eventName || "WENEVA");
  const text = `${cfg.intro}\n\nUnduh foto kamu: ${url}\n\n${eventName || "WENEVA"}`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#F4F7FA;font-family:Arial,Helvetica,sans-serif;color:#181B23">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px">
<h2 style="margin:0 0 12px;font-size:20px">${esc(eventName || "WENEVA")}</h2>
<p style="margin:0 0 20px;line-height:1.5;font-size:15px">${esc(cfg.intro)}</p>
<p style="margin:0 0 20px"><a href="${esc(url)}" style="display:inline-block;background:#E02843;color:#fff;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:10px">Unduh Foto</a></p>
<p style="margin:0;font-size:12px;color:#6B7684;word-break:break-all">Jika tombol tidak berfungsi, salin tautan ini:<br>${esc(url)}</p>
</div></body></html>`;
  return { subject, text, html };
}

async function sendRaw(to, url) {
  const st = settingsStore.load();
  const cfg = st.email;
  if (!ready(cfg)) throw new Error("Email belum diaktifkan / belum lengkap di Pengaturan.");
  const msg = buildMessage(cfg, st.event?.name, url);
  await transporter(cfg).sendMail({ from: cfg.from, to, subject: msg.subject, text: msg.text, html: msg.html });
}

/** Kirim email percobaan dari halaman admin. */
async function sendTest(to) {
  const e = normalizeEmail(to);
  if (!e) throw new Error("Alamat email tidak valid.");
  await sendRaw(e, "https://example.com/tes-weneva");
}

let sentThisHour = [];
function underLimit() {
  const t = Date.now() - 3600 * 1000;
  sentThisHour = sentThisHour.filter((x) => x > t);
  return sentThisHour.length < HOURLY_LIMIT;
}

async function attempt(sessionId, n) {
  const row = db.prepare("SELECT * FROM share_emails WHERE session_id = ?").get(sessionId);
  if (!row || row.status === "sent") return; // sesi sudah dihapus / sudah terkirim
  try {
    if (!underLimit()) throw new Error("Batas kirim per jam tercapai.");
    await sendRaw(row.email, row.url);
    sentThisHour.push(Date.now());
    db.prepare("UPDATE share_emails SET status = 'sent', attempts = ?, error = NULL, sent_at = datetime('now') WHERE session_id = ?").run(n + 1, sessionId);
  } catch (err) {
    const last = n + 1 >= RETRY_MS.length;
    db.prepare("UPDATE share_emails SET status = ?, attempts = ?, error = ? WHERE session_id = ?").run(last ? "failed" : "queued", n + 1, String(err.message || err).slice(0, 300), sessionId);
    console.warn(`[email] gagal kirim (percobaan ${n + 1}): ${err.message || err}`);
    if (!last) setTimeout(() => attempt(sessionId, n + 1).catch(() => {}), RETRY_MS[n + 1]).unref?.();
  }
}

/** Simpan permintaan lalu kirim di latar belakang. Satu email per sesi. Mengembalikan { ok, error? }. */
function queue({ sessionId, email, url }) {
  if (!ready()) return { ok: false, error: "disabled" };
  const e = normalizeEmail(email), u = safeUrl(url);
  if (!e) return { ok: false, error: "invalid_email" };
  if (!u) return { ok: false, error: "invalid_url" };
  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 80) return { ok: false, error: "invalid_session" };
  const exist = db.prepare("SELECT status FROM share_emails WHERE session_id = ?").get(sessionId);
  if (exist) return { ok: true, duplicate: true };
  db.prepare("INSERT INTO share_emails (session_id, email, url) VALUES (?, ?, ?)").run(sessionId, e, u);
  attempt(sessionId, 0).catch(() => {});
  return { ok: true };
}

/** Dipanggil saat backend menyala: lanjutkan email yang tertunda (maks. 2 jam terakhir). */
function resumePending() {
  try {
    const rows = db.prepare("SELECT session_id FROM share_emails WHERE status = 'queued' AND created_at > datetime('now','-2 hours')").all();
    rows.forEach((r, i) => setTimeout(() => attempt(r.session_id, 1).catch(() => {}), 5000 + i * 1500).unref?.());
  } catch { /* tabel belum siap */ }
}

/** Hapus alamat email milik sesi yang sudah dihapus / lewat masa simpan. */
function purge(retentionDays) {
  try {
    db.prepare("DELETE FROM share_emails WHERE session_id NOT IN (SELECT id FROM sessions)").run();
    db.prepare("DELETE FROM share_emails WHERE created_at < datetime('now', ?)").run(`-${Math.max(1, Math.round(retentionDays * 24))} hours`);
  } catch (err) { console.warn("[email] purge gagal:", err.message); }
}

module.exports = { normalizeEmail, ready, queue, sendTest, resumePending, purge };
