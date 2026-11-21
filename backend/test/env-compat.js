// Uji: nama variabel lingkungan lama POPSNAP_* tetap dibaca sebagai WENEVA_* (booth lama tidak perlu mengubah .env).
//   node test/env-compat.js
const assert = require("assert"), os = require("os"), fs = require("fs"), path = require("path");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "compat-"));
delete process.env.WENEVA_DATA; process.env.POPSNAP_DATA = dir;          // hanya nama lama
process.env.POPSNAP_ALLOW_LAN = "1"; process.env.WENEVA_ALLOW_LAN = "0"; // nama baru menang bila keduanya ada
require("../envCompat");
assert.strictEqual(process.env.WENEVA_DATA, dir, "POPSNAP_DATA harus terbaca sebagai WENEVA_DATA");
assert.strictEqual(process.env.WENEVA_ALLOW_LAN, "0", "nilai WENEVA_ yang sudah ada tidak boleh ditimpa");
const config = require("../config");
assert(String(config.dataDir).startsWith(dir), "config.dataDir harus mengikuti folder dari nama lama: " + config.dataDir);
console.log("ok  env-compat: POPSNAP_* lama dibaca sebagai WENEVA_*, nilai baru tidak ditimpa, folder data mengikuti");
process.exit(0);
