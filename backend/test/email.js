// Uji: email tautan foto (SMTP palsu lokal), booth tanpa penjaga diblokir saat QRIS belum siap, dan rahasia SMTP tidak bocor ke layar tamu.
//   node test/email.js
const os = require("os"), fs = require("fs"), path = require("path"), net = require("net"), assert = require("assert"), { spawn } = require("child_process");
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), "booth-")); process.env.POPSNAP_DATA = DATA;

(async () => {
  // SMTP palsu: menyimpan setiap pesan yang diterima
  const mails = [];
  const smtp = net.createServer((sock) => {
    let buf = "", inData = false, cur = { rcpt: [], body: "" };
    sock.write("220 fake ESMTP\r\n");
    sock.on("data", (d) => {
      buf += d.toString("utf8");
      for (;;) {
        if (inData) {
          const i = buf.indexOf("\r\n.\r\n"); if (i < 0) return;
          cur.body = buf.slice(0, i); buf = buf.slice(i + 5); inData = false; mails.push(cur); cur = { rcpt: [], body: "" };
          sock.write("250 OK queued\r\n"); continue;
        }
        const j = buf.indexOf("\r\n"); if (j < 0) return;
        const line = buf.slice(0, j); buf = buf.slice(j + 2);
        if (/^EHLO/i.test(line)) sock.write("250-fake\r\n250 8BITMIME\r\n");
        else if (/^HELO/i.test(line)) sock.write("250 fake\r\n");
        else if (/^MAIL FROM/i.test(line)) sock.write("250 OK\r\n");
        else if (/^RCPT TO/i.test(line)) { cur.rcpt.push(line.replace(/^RCPT TO:\s*<?|>?\s*$/gi, "")); sock.write("250 OK\r\n"); }
        else if (/^DATA/i.test(line)) { inData = true; sock.write("354 go\r\n"); }
        else if (/^QUIT/i.test(line)) { sock.write("221 bye\r\n"); sock.end(); return; }
        else sock.write("250 OK\r\n");
      }
    });
  }).listen(0);

  const settings = require("../settings"), db = require("../db");
  settings.update({ email: { enabled: true, host: "127.0.0.1", port: smtp.address().port, secure: false, user: "", pass: "RAHASIA-SMTP-123", from: "POPSNAP <foto@contoh.id>", subject: "Foto dari {event}" } });
  db.close?.();
  const PORT = 4900 + Math.floor(Math.random() * 90), B = `http://127.0.0.1:${PORT}`;
  const srv = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], { env: { ...process.env, PORT: String(PORT), POPSNAP_DATA: DATA }, stdio: ["ignore", "pipe", "pipe"] });
  let log = ""; srv.stdout.on("data", (d) => (log += d)); srv.stderr.on("data", (d) => (log += d));
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/api/health"); break; } catch { await new Promise((r) => setTimeout(r, 250)); } }
  const done = (code) => { srv.kill(); smtp.close(); process.exit(code); };
  const post = (p, body) => fetch(B + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  try {
    // 1) layar tamu hanya tahu email aktif + teks; host / user / sandi tidak ikut
    const pub = await (await fetch(B + "/api/settings/public")).json();
    assert(pub.email && pub.email.enabled === true, "email harus aktif di pengaturan publik: " + JSON.stringify(pub.email));
    assert(!JSON.stringify(pub).includes("RAHASIA-SMTP-123") && !("host" in pub.email) && !("pass" in pub.email), "rahasia SMTP bocor ke layar tamu");

    // 2) validasi
    assert((await post("/api/share/email", { sessionId: "S1", email: "bukan-email", url: "https://galeri.contoh.id/s/ABC" })).status === 400);
    assert((await post("/api/share/email", { sessionId: "S1", email: "a@b.id", url: "javascript:alert(1)" })).status === 400);

    // 3) kirim: email diterima SMTP berisi tautan, penerima huruf kecil
    const ok = await post("/api/share/email", { sessionId: "S1", email: "  Budi@Contoh.ID ", url: "https://galeri.contoh.id/s/K7M2QX4P9B" });
    assert(ok.status === 200, "kirim gagal: " + (await ok.text()) + log.slice(-300));
    for (let i = 0; i < 40 && !mails.length; i++) await new Promise((x) => setTimeout(x, 250));
    assert(mails.length === 1, "SMTP harus menerima 1 email. log=" + log.slice(-400));
    assert(mails[0].rcpt.includes("budi@contoh.id"), JSON.stringify(mails[0].rcpt));
    assert(mails[0].body.includes("https://galeri.contoh.id/s/K7M2QX4P9B"), "tautan galeri harus ada di email");
    assert(/Subject: Foto dari POPSNAP/i.test(mails[0].body), "subjek harus memakai nama event");

    // 4) satu email per sesi: permintaan ulang tidak mengirim lagi
    assert((await post("/api/share/email", { sessionId: "S1", email: "budi@contoh.id", url: "https://galeri.contoh.id/s/K7M2QX4P9B" })).status === 200);
    await new Promise((x) => setTimeout(x, 800));
    assert(mails.length === 1, "tidak boleh kirim dua kali untuk sesi yang sama");

    // 5) booth tanpa penjaga: mode QRIS tanpa konfigurasi => Start diblokir, TIDAK jatuh ke voucher gratis
    const ready = await (await fetch(B + "/api/kiosk/ready")).json();
    assert(ready.payBlocked === true && ready.notice, "QRIS belum siap harus memblokir: " + JSON.stringify(ready));
    assert(pub.payment.mode === "qris" && pub.payment.methods.length === 0, "tidak boleh ada metode cadangan: " + JSON.stringify(pub.payment));
    console.log("ok  email: tautan terkirim ke penerima yang benar, satu per sesi, validasi, rahasia SMTP tidak bocor; QRIS belum siap = booth diblokir");
    done(0);
  } catch (e) { console.error("GAGAL:", e.message); done(1); }
})();
