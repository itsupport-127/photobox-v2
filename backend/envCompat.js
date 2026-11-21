// Nama variabel lingkungan lama POPSNAP_* tetap dibaca: disalin ke WENEVA_* bila yang baru belum diisi.
// Jadi file .env / skrip lama tidak perlu diubah saat pindah ke nama Weneva. Aman dipanggil berulang.
for (const k of Object.keys(process.env)) {
  if (!k.startsWith("POPSNAP_")) continue;
  const n = "WENEVA_" + k.slice(8);
  if (process.env[n] === undefined) process.env[n] = process.env[k];
}
module.exports = {};
