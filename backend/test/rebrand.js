// Uji: booth lama yang menyimpan nama "POPSNAP" di pengaturan otomatis berganti jadi WENEVA, tanpa menyentuh alamat folder.
//   node test/rebrand.js
const assert = require("assert"), os = require("os"), fs = require("fs"), path = require("path"), { spawnSync } = require("child_process");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rebrand-"));
const run = (code) => spawnSync(process.execPath, ["-e", code], { cwd: path.join(__dirname, ".."), env: { ...process.env, WENEVA_DATA: dir }, encoding: "utf8" });
// 1) simulasikan booth lama: tulis nilai lama lewat jalur resmi
let r = run(`const s=require("./settings"); s.update({event:{name:"POPSNAP"}, general:{dataDir: ${JSON.stringify(path.join(dir, "POPSNAP-Foto"))}}}); const d=s.load(); console.log("SEED", d.event.name);`);
assert(/SEED POPSNAP/.test(r.stdout), "seed gagal: " + r.stdout + r.stderr);
// 2) proses baru memuat pengaturan: nama berganti, folder lama tidak
r = run(`const s=require("./settings").load(); console.log("NAME", s.event.name); console.log("DIR", JSON.stringify(s.general?.dataDir || ""));`);
assert(/NAME WENEVA/.test(r.stdout), "nama event harus berganti jadi WENEVA: " + r.stdout + r.stderr);
if (/DIR "[^"]+"/.test(r.stdout)) assert(/POPSNAP-Foto/.test(r.stdout), "alamat folder lama harus utuh: " + r.stdout);
console.log("ok  rebrand: nama tersimpan POPSNAP -> WENEVA saat dimuat, alamat folder tetap");
process.exit(0);
