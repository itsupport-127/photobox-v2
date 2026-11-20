import useBoothReady from "../hooks/useBoothReady";
import React, { useEffect } from "react";
import { useKiosk } from "../hooks/useKiosk";
import LiveView from "../components/LiveView";
import useCamera from "../hooks/useCamera";
import WelcomeDecor from "../components/WelcomeDecor";
import logo from "../assets/logo-popsnap.png";
import useShape from "../hooks/useShape";

const MODES = [
  { id: "photo", label: "START", path: "M3 7h4l2-3h6l2 3h4v13H3z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { id: "gif", label: "GIF", path: "M8 4h12v12H8z M4 8v12h12" },
  { id: "boomerang", label: "BOOMERANG", path: "M4 12a8 8 0 0 1 14-5l2 2 M20 4v5h-5 M20 12a8 8 0 0 1-14 5l-2-2 M4 20v-5h5" },
  { id: "video", label: "VIDEO", path: "M3 6h12v12H3z M15 10l6-3v10l-6-3" },
];
const Icon = ({ path, size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {path.split(" M").map((d, i) => <path key={i} d={(i ? "M" : "") + d} />)}
  </svg>
);

/**
 * Tahap 1: Welcome / layar Start.
 * - Tombol mode (Foto / GIF / Boomerang / Video) sesuai yang diaktifkan di Admin > Umum > Mode Booth.
 * - Status kamera; tombol mode baru aktif kalau kamera siap.
 * - Klik Start otomatis masuk layar penuh (seperti F11). Ikon gembok -> PIN -> keluar layar penuh & buka menu admin.
 * - Tombol keyboard: Spasi / S / PageUp / PageDown / F13 = mulai (kalau diaktifkan).
 */
import useStorage from "../hooks/useStorage";

export default function WelcomeScreen({ dispatch, settings, camera, singleTemplate }) {
  const kiosk = useKiosk();
  const d = settings?.display;
  const ss = d?.startScreen;
  const modes = settings?.general?.modes;
  const title = settings?.event?.name || "POPSNAP";
  const subtitle = settings?.event?.subtitle ?? "";
  const storage = useStorage();
  const diskFull = storage.level === "critical"; // ruang disk habis: tidak menerima sesi baru
  const camReady = camera.status === "ready";
  const booth = useBoothReady(!!settings?.printing?.enabled); // QRIS / internet / printer
  const ready = camReady && !diskFull && !booth.blocked; // tombol mulai aktif
  const enabled = MODES.filter((m) => m.id === "photo" || modes?.[m.id]?.enabled);
  const showLabels = modes?.showLabels !== false;
  const liveBg = settings?.camera?.liveView?.displayOnStart && settings?.camera?.mode !== "dslr";

  function start(mode = "photo") {
    if (!ready) return;
    if (d?.autoFullscreen) kiosk.enterFullscreen();
    dispatch({ type: "START", payload: { mode, template: mode === "photo" ? singleTemplate ?? null : null } });
  }

  // Pemicu keyboard (pemicu mouse/sentuh = tombol). Hanya untuk mode foto/pertama agar jelas.
  useEffect(() => {
    if (!ss?.triggerKeys) return;
    const keys = ["Space", "KeyS", "PageUp", "PageDown", "F13"];
    const onKey = (e) => {
      if (!keys.includes(e.code) && !keys.includes(e.key)) return;
      e.preventDefault();
      start("photo");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ss?.triggerKeys, ready, d?.autoFullscreen, singleTemplate]);

  const bgSize = { cover: "cover", contain: "contain", fill: "100% 100%", center: "auto" }[ss?.stretch ?? "cover"];
  const customBg = ss?.image ? `url(${ss.image}) center/${bgSize} no-repeat` : null; // gambar latar unggahan admin menggantikan dekorasi bawaan

  const badge = {
    ready: { dot: "bg-emerald-400", text: "Kamera siap" },
    checking: { dot: "bg-amber-300 animate-pulse", text: "Mencari kamera..." },
    notready: { dot: "bg-red-500", text: "Kamera belum siap" },
    denied: { dot: "bg-red-500", text: "Izin kamera ditolak" },
  }[camera.status];

  const extraModes = enabled.filter((m) => m.id !== "photo");

  const shape = useShape(); // portrait: kanvas 1080x1800, square: 1200x1200, landscape: 1728x1117
  const P = (l, p, q = l) => (shape === "portrait" ? p : shape === "square" ? q : l);
  const U = (n) => `calc(var(--u) * ${n})`; // 1 = 1px pada kanvas desain (landscape 1728x1117 / portrait 1080x1800)
  const W = P(1728, 1080, 1200);
  const logoW = P(300, 420, 320), logoTop = P(120, 390, 110), logoH = logoW * 0.624; // logo monogram rasio 508:317
  const wordTop = logoTop + logoH + P(34, 44, 34);
  const headTop = wordTop + P(120, 150, 112), headW = P(1180, 1000, 1000);
  const ctaW = P(440, 580, 540), ctaH = P(104, 132, 124), ctaTop = P(800, 1190, 860);
  const msgTop = ctaTop + ctaH + P(34, 44, 34), modesTop = msgTop + P(80, 110, 90);
  const headline = subtitle?.trim() || "Abadikan momenmu";
  const tagline = subtitle?.trim() ? "" : "Sentuh tombol di bawah untuk memulai";

  return (
    <div className="kiosk-screen strip-screen h-full w-full overflow-hidden" data-shape={shape} style={customBg ? { background: customBg } : undefined}>
      {!customBg && <WelcomeDecor />}
      {liveBg && <StartLiveView />}

      {/* Chip kamera + tombol layar penuh. Bergeser kalau gembok diletakkan di pojok kiri-atas. */}
      <div className={`absolute z-20 top-3 sm:top-5 flex items-center gap-2 ${d?.lock?.position === "top-left" ? "left-16 sm:left-20" : "left-3 sm:left-5"}`}>
        <div className="flex items-center gap-2 bg-white/[0.06] border border-white/15 backdrop-blur px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold" role="status">
          <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
          {badge.text}
        </div>
        {!kiosk.fullscreen && (
          <button data-kiosk-control onClick={kiosk.enterFullscreen} aria-label="Layar penuh" title="Layar penuh (F11)" className="w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center">
            <Icon size={16} path="M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5" />
          </button>
        )}
      </div>

      <div className="strip-stage">
        {/* Tata letak "Elegan": satu poros tengah. Logo -> nama -> judul serif -> satu tombol. Banyak ruang kosong, tanpa dekorasi ramai. */}
        <img src={logo} alt={title} draggable={false} className="select-none" style={{ left: U((W - logoW) / 2), top: U(logoTop), width: U(logoW), height: "auto", filter: "drop-shadow(0 12px 28px rgba(0,0,0,.45))" }} />
        <p className="eyebrow text-center" style={{ left: 0, width: "100%", top: U(wordTop), fontSize: U(P(26, 30, 26)), margin: 0 }}>{title}</p>
        <div style={{ left: U(W / 2 - 36), top: U(wordTop + P(62, 70, 62)), width: U(72), height: U(2), background: "var(--red)", opacity: 0.9 }} />
        <h1 className="display-hero text-center" style={{ left: U((W - headW) / 2), width: U(headW), top: U(headTop), fontSize: U(P(92, 98, 88)), margin: 0 }}>{headline}</h1>
        {tagline && <p className="text-center" style={{ left: U((W - headW) / 2), width: U(headW), top: U(headTop + P(140, 150, 140)), fontSize: U(P(30, 36, 30)), margin: 0, color: "rgba(246,241,234,.66)", fontWeight: 500, letterSpacing: ".01em" }}>{tagline}</p>}

        <button onClick={() => start("photo")} disabled={!ready} aria-label="Mulai" className="start-cta"
          style={{ left: U((W - ctaW) / 2), top: U(ctaTop), width: U(ctaW), height: U(ctaH), fontSize: U(P(46, 58, 52)) }}>
          <span>Mulai</span>
          <svg width={`calc(var(--u) * ${P(40, 50, 46)})`} height={`calc(var(--u) * ${P(40, 50, 46)})`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>

        {diskFull && (
          <p className="text-center font-semibold text-[#FFB4A6]" style={{ left: U(60), width: U(P(1728, 1080, 1200) - 120), top: U(extraModes.length ? modesTop + P(40, 60, 50) : msgTop), fontSize: U(P(30, 40, 36)), margin: 0 }}>Booth sedang tidak dapat digunakan. Silakan hubungi CS.</p>
        )}

        {extraModes.length > 0 && (
          <div className="flex items-center justify-center" style={{ left: 0, width: "100%", top: U(modesTop - P(80, 110, 90) + P(50, 70, 56)), gap: U(P(18, 24, 24)) }}>
            {extraModes.map((m) => (
              <button key={m.id} onClick={() => start(m.id)} disabled={!ready} aria-label={m.label} className="strip-btn flex items-center disabled:opacity-50 disabled:pointer-events-none" style={{ height: U(P(68, 96, 84)), padding: `0 ${U(P(30, 42, 36))}`, gap: U(10), fontSize: U(P(28, 38, 34)), }}>
                <Icon path={m.path} size={`calc(var(--u) * 32)`} />
                {showLabels && <span>{m.label}</span>}
              </button>
            ))}
          </div>
        )}

        {camReady && booth.blocked && (
          <div className="flex flex-col items-center" style={{ left: 0, width: "100%", top: U(msgTop) }}>
            <p className="bg-black/40 rounded-xl text-center" style={{ fontSize: U(P(22, 32, 28)), padding: `${U(8)} ${U(20)}`, maxWidth: U(P(700, 900, 800)) }}>{booth.reason}</p>
          </div>
        )}

        {!camReady && camera.status !== "checking" && (
          <div className="flex flex-col items-center" style={{ left: 0, width: "100%", top: U(msgTop), gap: U(P(10, 16, 14)) }}>
            <p className="bg-black/40 rounded-xl text-center" style={{ fontSize: U(P(22, 32, 28)), padding: `${U(8)} ${U(20)}`, maxWidth: U(P(700, 900, 800)) }}>{camera.detail}</p>
            <button onClick={camera.retry} className="strip-btn strip-btn--next" style={{ height: U(P(52, 76, 64)), padding: `0 ${U(P(28, 40, 34))}`, fontSize: U(P(22, 32, 28)) }}>Coba lagi</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Live view kamera sebagai latar layar Start (Admin > Kamera > "Tampilkan di layar Start"). */
function StartLiveView() {
  const camera = useCamera("landscape");
  return <div className="absolute inset-0 opacity-70"><LiveView camera={camera} fill crop /></div>;
}
