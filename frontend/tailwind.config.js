/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        pop: {
          // Nilai asli ada di CSS variable (lihat src/index.css) supaya warna bisa diganti admin
          // dari Pengaturan > Tampilan tanpa build ulang.
          pink: "rgb(var(--pop-pink) / <alpha-value>)",     // warna utama (tombol) — default merah Weneva
          purple: "rgb(var(--pop-purple) / <alpha-value>)", // warna sekunder (latar) — default biru Weneva
          dark: "rgb(var(--pop-dark) / <alpha-value>)",     // warna tinta (teks gelap, modal)
          flash: "#FFE3DC",
          "flash-ink": "#8A2A18",
          paper: "#FFFDF9",
          teal: "#1FA997",
          coral: "#FF5D73",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        display: ['"Bricolage Grotesque Variable"', '"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        pop: "1px 5px 6.3px 1px rgba(0,0,0,0.27)",
      },
    },
  },
  plugins: [],
}
