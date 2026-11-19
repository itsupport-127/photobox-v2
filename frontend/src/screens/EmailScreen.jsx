import React, { useState } from "react";
import appConfig from "../config/appConfig";
import useCountdown from "../hooks/useCountdown";
import useShape from "../hooks/useShape";
import SesiDecor from "../components/SesiDecor";
import OnScreenKeyboard from "../components/OnScreenKeyboard";

const U = (n) => `calc(var(--u) * ${n})`;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@.]{2,}$/;

/**
 * Input email (opsional) — tampil SETELAH pembayaran, SEBELUM layar pengingat / sesi foto.
 * Tautan unduh foto dikirim ke email ini begitu hasil siap (layar hasil memanggil /api/share/email).
 * Waktu habis atau tombol "Lewati" = tanpa email (tamu tetap bisa memakai QR).
 */
export default function EmailScreen({ dispatch }) {
  const shape = useShape();
  const c = appConfig.settings?.email ?? {};
  const [value, setValue] = useState("");
  const done = (email) => dispatch({ type: "EMAIL_DONE", payload: { email } });
  const { remaining } = useCountdown(c.seconds || 60, () => done(null), true);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0"), ss = String(remaining % 60).padStart(2, "0");

  const email = value.trim().toLowerCase();
  const valid = EMAIL_RE.test(email);

  const CW = shape === "portrait" ? 1080 : shape === "square" ? 1200 : 1728;
  const CH = shape === "portrait" ? 1800 : shape === "square" ? 1200 : 1117;
  const pw = Math.min(CW - 80, 1040), x0 = (CW - pw) / 2;
  const kbW = 970, kbH = 5 * 58 + 4 * 10;
  const ph = 138 + 120 + 36 + kbH + 40 + 78 + 56;
  const y0 = CH / 2 - ph / 2 - 20;
  const trayTop = y0 + 138, kbTop = trayTop + 120 + 36, btnTop = kbTop + kbH + 40;
  const bw = 380, gap = 24;

  return (
    <div className="kiosk-screen strip-screen h-full w-full overflow-hidden" data-shape={shape}>
      <div className="absolute inset-0"><SesiDecor /></div>
      <div className="strip-stage">
        <div className="pay-timer" role="timer" style={{ left: U(CW / 2 - 95), top: U(y0 - 100), width: U(190), height: U(54), fontSize: U(32) }}>{mm}.{ss}</div>

        <div className="strip-panel" style={{ left: U(x0), top: U(y0), width: U(pw), height: U(ph), borderRadius: U(57) }} />
        <div className="pay-title" style={{ left: U(x0 + 104), top: U(y0 + 43), width: U(pw - 207), height: U(67), fontSize: U(36) }}>{c.askText || "Masukkan email untuk menerima foto kamu"}</div>

        <div className="strip-tray" style={{ left: U(x0 + 52), top: U(trayTop), width: U(pw - 104), height: U(120), borderRadius: U(60), display: "flex", alignItems: "center", justifyContent: "center", padding: `0 ${U(40)}`, boxSizing: "border-box", overflow: "hidden" }}>
          <span style={{ fontSize: U(value.length > 28 ? 36 : 46), fontWeight: 800, color: value ? "#000" : "#8A94A1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
            {value || "nama@email.com"}
          </span>
        </div>

        <div style={{ position: "absolute", left: U(CW / 2 - kbW / 2), top: U(kbTop), width: U(kbW) }}>
          <OnScreenKeyboard value={value} onChange={setValue} maxLength={80} email scaled keyW={88} keyH={58} keyGap={10} keyFs={28} keyR={14} />
        </div>

        <button type="button" className="strip-btn" onClick={() => done(null)}
          style={{ left: U(CW / 2 - bw - gap / 2), top: U(btnTop), width: U(bw), height: U(78), fontSize: U(36), padding: 0, background: "#FFEAC5", color: "#3A2E00" }}>Lewati</button>
        <button type="button" className="strip-btn" disabled={!valid} onClick={() => valid && done(email)}
          style={{ left: U(CW / 2 + gap / 2), top: U(btnTop), width: U(bw), height: U(78), fontSize: U(36), padding: 0, opacity: valid ? 1 : 0.45 }}>Lanjut</button>

        <div style={{ position: "absolute", left: U(x0 + 52), top: U(btnTop + 78 + 14), width: U(pw - 104), textAlign: "center", fontSize: U(22), color: "#55606E" }}>
          Email hanya dipakai untuk mengirim tautan foto, lalu dihapus otomatis setelah 48 jam.
        </div>
      </div>
    </div>
  );
}
