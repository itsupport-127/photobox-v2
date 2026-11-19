import { useEffect, useState } from "react";
import { printerProblem } from "../services/printService";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

/**
 * Booth tanpa penjaga: jangan terima pembayaran kalau hasilnya tidak bisa diberikan.
 * Diperiksa tiap 10 detik di layar Start. Mengembalikan { blocked, reason }.
 *  - QRIS / internet tidak siap  (dari backend: /api/kiosk/ready)
 *  - printer offline / kertas habis (hanya di aplikasi desktop dan bila cetak aktif)
 * Gagal memeriksa (backend tak terjangkau sesaat) TIDAK memblokir: status kamera & disk sudah punya pemeriksaan sendiri.
 */
export default function useBoothReady(printingEnabled) {
  const [state, setState] = useState({ blocked: false, reason: null });
  useEffect(() => {
    let dead = false;
    async function check() {
      let reason = null;
      try {
        const r = await fetch(`${API_BASE}/api/kiosk/ready`).then((x) => x.json());
        if (r?.payBlocked) reason = r.notice || "Pembayaran sementara tidak tersedia.";
      } catch { /* abaikan */ }
      if (!reason && printingEnabled) {
        try { const m = await printerProblem(); if (m) reason = m.replace(/ Silakan hubungi CS.*$/, "") + " Booth sementara tidak bisa dipakai."; } catch { /* abaikan */ }
      }
      if (!dead) setState({ blocked: !!reason, reason });
    }
    check();
    const t = setInterval(check, 10000);
    return () => { dead = true; clearInterval(t); };
  }, [printingEnabled]);
  return state;
}
