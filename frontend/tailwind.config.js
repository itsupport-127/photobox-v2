/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        pop: {
          // Nilai asli ada di CSS variable (lihat src/index.css) supaya warna bisa diganti admin
          // dari Pengaturan > Tampilan tanpa build ulang.
          pink: "rgb(var(--pop-pink) / <alpha-value>)",     // warna utama (tombol) — default merah PopSnap
          purple: "rgb(var(--pop-purple) / <alpha-value>)", // warna sekunder (latar) — default biru PopSnap
          dark: "rgb(var(--pop-dark) / <alpha-value>)",     // warna tinta (teks gelap, modal)
          flash: "#F6C9A8",
          "flash-ink": "#20150F",
          paper: "#F6F1EA",
          teal: "#1FA997",
          coral: "#FF5D73",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        display: ['"Fraunces Variable"', "Georgia", "serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        pop: "1px 5px 6.3px 1px rgba(0,0,0,0.27)",
      },
    },
  },
  plugins: [],
}
