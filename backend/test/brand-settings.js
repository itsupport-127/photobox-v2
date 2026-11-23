// Uji: pengaturan merek (logo & nama aplikasi) - bawaan WENEVA, validasi, kembali ke bawaan, ikut ke layar booth.
process.env.WENEVA_DATA = require("fs").mkdtempSync(require("os").tmpdir() + "/brand-");
const assert = require("assert");
const settings = require("../settings");

const b0 = settings.load().display.brand;
assert.deepStrictEqual(b0, { logo: "", name: "WENEVA" }, "bawaan: logo kosong, nama WENEVA");
console.log("ok  bawaan merek = WENEVA tanpa logo kustom");

settings.update({ display: { brand: { logo: "/uploads/logo-studio.png", name: "  Studio Emma  " } } });
let b = settings.load().display.brand;
assert.strictEqual(b.logo, "/uploads/logo-studio.png"); assert.strictEqual(b.name, "Studio Emma");
assert.strictEqual(settings.forKiosk().display.brand.logo, "/uploads/logo-studio.png", "layar booth menerima logo");
console.log("ok  logo & nama tersimpan (nama dirapikan) dan sampai ke layar booth");

settings.update({ display: { brand: { logo: "http://evil.example/x.png" } } });
assert.strictEqual(settings.load().display.brand.logo, "/uploads/logo-studio.png", "alamat luar ditolak, nilai lama bertahan");
settings.update({ display: { brand: { logo: "/uploads/../../etc/passwd" } } });
assert.strictEqual(settings.load().display.brand.logo, "/uploads/logo-studio.png", "path traversal ditolak");
settings.update({ display: { brand: { name: "x".repeat(200) } } });
assert.strictEqual(settings.load().display.brand.name.length, 40, "nama dibatasi 40 huruf");
console.log("ok  logo dari luar / path berbahaya ditolak, nama dibatasi");

settings.update({ display: { startScreen: { stretch: "contain" } } });
b = settings.load().display.brand;
assert.strictEqual(b.logo, "/uploads/logo-studio.png", "mengubah pengaturan lain tidak mereset merek");

settings.update({ display: { brand: { logo: "", name: "   " } } });
b = settings.load().display.brand;
assert.deepStrictEqual(b, { logo: "", name: "WENEVA" }, "kosong = kembali ke WENEVA");
console.log("ok  kosong = kembali ke logo & nama WENEVA");
process.exit(0);
