import React, { useCallback, useEffect, useState } from "react";
import { Btn, Card, Notice, Toggle } from "./ui";
import { Row } from "./settings/controls";
import { inputCls } from "./editorKit";
import { getRemoteConfig, saveRemoteConfig, testRemote } from "../services/remoteService";

const ago = (iso) => { if (!iso) return "belum pernah"; const s = Math.max(0, Math.round((Date.now() - new Date(iso)) / 1000)); return s < 60 ? `${s} dtk lalu` : s < 3600 ? `${Math.floor(s / 60)} mnt lalu` : `${Math.floor(s / 3600)} jam lalu`; };

/**
 * Kontrol jarak jauh (Remote) — bagian dari KONEKSI PLATFORM (Pembayaran > Platform).
 * Memakai alamat + token booth yang sama dengan sinkron transaksi dan galeri: tidak ada alamat/token kedua yang harus disalin.
 * Alamat / token khusus (server remote lain) tersedia di "Lanjutan".
 */
export default function RemoteCard() {
  const [cfg, setCfg] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => getRemoteConfig().then((c) => { setCfg(c); return c; }).catch((e) => setMsg({ tone: "error", text: e.message })), []);
  useEffect(() => { load().then((c) => { if (c) { setEnabled(c.enabled); setUrl(c.viaPlatform ? "" : c.url); } }); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  async function save(extra = {}) {
    setBusy(true); setMsg(null);
    try { const c = await saveRemoteConfig({ enabled, url, ...(token ? { token } : {}), ...extra }); setCfg(c); setToken(""); setMsg({ tone: "ok", text: "Tersimpan." }); }
    catch (e) { setMsg({ tone: "error", text: e.message }); }
    setBusy(false);
  }
  async function test() {
    setBusy(true); setMsg(null);
    try { const r = await testRemote({ ...(url ? { url } : {}), ...(token ? { token } : {}) }); setMsg({ tone: "ok", text: `Terhubung ke platform${r.name ? ` sebagai “${r.name}”` : ""}.` }); }
    catch (e) { setMsg({ tone: "error", text: e.message }); }
    setBusy(false);
  }

  const st = cfg?.status;
  const ready = !!(cfg?.url && cfg?.tokenSet);
  return (
    <Card title="REMOTE (KONTROL JARAK JAUH)" hint="Pantau dan kendalikan booth ini dari web platform (kunci / buka booth, batalkan sesi, ubah pengaturan aman, baca log). Booth menyambung KELUAR, jadi tidak perlu membuka port di jaringan lokasi.">
      {!ready && !cfg?.enabled && <div className="mb-3"><Notice tone="info">Isi dulu koneksi platform: alamat + token booth di kartu “Platform” di atas. Remote memakai koneksi yang sama.</Notice></div>}
      <Row label="Aktifkan" hint={cfg?.viaPlatform ? `Memakai koneksi platform${cfg?.url ? ` (${cfg.url.replace(/^https?:\/\//, "")})` : ""}.` : "Memakai alamat / token khusus (Lanjutan)."}>
        <Toggle checked={enabled} onChange={(v) => { setEnabled(v); }} label="Izinkan platform memantau & mengendalikan booth ini" />
      </Row>
      <div className="flex flex-wrap gap-2 pt-2 pl-0 sm:pl-[226px]">
        <Btn variant="primary" onClick={() => save()} disabled={busy}>Simpan</Btn>
        <Btn onClick={test} disabled={busy || !ready}>Tes koneksi</Btn>
      </div>
      {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      {cfg && !cfg.secure && <div className="mt-3"><Notice tone="warn">Alamat ini tidak memakai https:// dan berada di luar jaringan lokal, jadi remote tidak akan menyala. Gunakan alamat https://.</Notice></div>}

      <div className="mt-4">
        {!cfg?.enabled ? <Notice tone="info">Remote belum diaktifkan.</Notice> : st?.connected
          ? <Notice tone="ok">Terhubung{st.boothName ? ` sebagai “${st.boothName}”` : ""}. Kabar terakhir ke platform: {ago(st.lastOkAt)}.</Notice>
          : <Notice tone="warn">Belum terhubung{st?.lastError ? `: ${st.lastError}` : ""}. Booth tetap berjalan normal dan akan mencoba lagi otomatis.</Notice>}
        <p className="text-[12px] text-[#6B7684] mt-3">Layar kiosk: {st?.frontendAlive ? "terhubung" : "belum terbuka / tidak terhubung"}.{cfg?.lock?.on ? " Booth sedang DIKUNCI dari platform." : ""}</p>
        <p className="text-[12px] text-[#6B7684] mt-2">Tidak bisa diubah dari jarak jauh: kunci pembayaran (Midtrans/DOKU), PIN, token, sandi email, folder penyimpanan, template. Semua perubahan dari remote tercatat di menu Log.</p>
      </div>

      <details className="mt-3">
        <summary className="text-[12px] text-[#6B7684] cursor-pointer">Lanjutan: arahkan ke server remote lain</summary>
        <div className="mt-2">
          <Row label="Alamat khusus" hint="Kosongkan untuk memakai koneksi platform."><input className={`${inputCls} w-full max-w-md`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></Row>
          <Row label="Token khusus" hint={cfg?.viaPlatform ? "Kosong = memakai token booth dari platform." : `Token khusus tersimpan (…${cfg?.tokenTail || ""}).`}>
            <input type="password" autoComplete="off" className={`${inputCls} w-full max-w-md`} value={token} onChange={(e) => setToken(e.target.value)} placeholder="••••••••" />
          </Row>
          {cfg && !cfg.viaPlatform && <div className="pl-0 sm:pl-[226px] pt-1"><Btn onClick={() => { setUrl(""); setToken(""); save({ url: "", clearToken: true }); }} disabled={busy}>Kembali ke koneksi platform</Btn></div>}
        </div>
      </details>
    </Card>
  );
}
