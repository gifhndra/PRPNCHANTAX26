/**
 * BACKEND DASHBOARD KONFIRMASI PENDAFTAR — PRPN x ENCHANTAX 2026
 * Tempel di Apps Script (script.google.com) pada proyek yang melayani URL /exec,
 * lalu: Deploy > Manage deployments > (ikon pensil) > Version: New version > Deploy.
 * URL /exec tetap sama. Pengaturan deployment: Execute as "Me", Who has access "Anyone".
 *
 * Sumber data = tab hasil integrasi Tally -> Google Sheets (bukan lagi tab Google Form lama):
 *   "Creative" (Infografis), "Call for Paper" (CFP), "Cerdas Cermat" (LCC).
 * Tab lain (Pengumpulan Karya, WebsiteContent, Riwayat Konfirmasi, tab Google Form lama) tidak dibaca untuk konfirmasi.
 * Jenis lomba ditentukan oleh nama tab.
 *
 *  - login   : (publik) masuk panitia = akun Google + password pribadi -> token sesi
 *  - list    : (token) kirim data ketiga tab ke dashboard
 *  - confirm : (token) tulis Status / Keterangan / Dikonfirmasi Oleh / Waktu Konfirmasi ke baris peserta + catat di "Riwayat Konfirmasi"
 *  - check   : (publik) cek apakah email ketua + nama tim berstatus Verified, untuk membuka kunci pengumpulan karya
 * Kolom konfirmasi dibuat otomatis di sebelah kanan tiap tab bila belum ada.
 */
const SPREADSHEET_ID = '1NPAU1kzwaTL8H_7C7cp2x3yMU5a3zyiOaUyjoT-Hf78';
/* ---------- LOGIN PANITIA (Akun Google + password pribadi) ----------
 * Client ID dari Google Cloud Console (OAuth client type "Web application"), lihat PANDUAN_LOGIN_PANITIA.md.
 * Harus SAMA dengan KONF.GOOGLE_CLIENT_ID di js/konfirmasi.js. */
const GOOGLE_CLIENT_ID = '913127893846-8fhrpro22ftv8caft6iu38rq2ru3lq3v.apps.googleusercontent.com';
const SESSION_TTL   = 21600;  // detik; sesi panitia berlaku 6 jam (batas maksimum CacheService)
const MAX_FAIL      = 5;      // gagal login berturut-turut sebelum akun dikunci sementara
const LOCK_SECONDS  = 900;    // lama kunci (15 menit)
const HASH_ROUNDS   = 3000;
// tab -> jenis lomba (nama tab tidak peka huruf besar/kecil)
// 'kode' (lcc / cfp / infografis) dipakai website untuk membuka kartu pengumpulan karya, jangan diubah.
const TABS = [
  { name: 'cerdas cermat',  label: 'LCC',            kode: 'lcc' },
  { name: 'call for paper', label: 'Call for Paper', kode: 'cfp' },
  { name: 'creative',       label: 'Infografis',     kode: 'infografis' }
];
const CONF_HEADERS = ['Status Konfirmasi', 'Keterangan Konfirmasi', 'Dikonfirmasi Oleh', 'Waktu Konfirmasi'];
const LOG_SHEET    = 'Riwayat Konfirmasi';
const STATUSES     = ['', 'Verified', 'Improvement', 'Rejected'];
const MIN_NOTE     = 10;
const VERSION      = 8; // penanda versi script (dipakai website untuk mendeteksi script yang belum diperbarui)

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'check') return out_(check_(p.email, p.tim));
  if (p.action === 'content') return out_(getContent_());   // publik: isi website yang diatur panitia
  return out_({ ok: true, v: VERSION, info: 'API Konfirmasi Pendaftar aktif' });
}

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'Format permintaan tidak valid' }); }
  if (b.action === 'login')  return out_(login_(b));
  if (b.action === 'logout') return out_(logout_(b));
  // semua aksi di bawah ini WAJIB sesi panitia yang sah (hasil login Google + password)
  const ses = session_(b.token);
  if (!ses) return out_({ ok: false, code: 'SESSION', error: 'Sesi panitia berakhir. Silakan masuk lagi.' });
  if (b.action === 'whoami')      return out_({ ok: true, v: VERSION, email: ses.email, name: ses.name });
  if (b.action === 'list')        return out_(list_());
  if (b.action === 'confirm')     { b.by = ses.name; return out_(confirm_(b)); }   // nama pengonfirmasi = akun yang login, bukan ketikan
  if (b.action === 'saveContent') return out_(saveContent_(b));
  return out_({ ok: false, error: 'Aksi tidak dikenal' });
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function norm_(v) { return String(v == null ? '' : v).toLowerCase().replace(/\s+/g, ' ').trim(); }
function safe_(v) { v = String(v == null ? '' : v); return /^[=+\-@]/.test(v) ? "'" + v : v; }

/* ambil sheet untuk satu entri TABS (cocok nama tanpa peduli huruf besar/kecil) */
function tabSheet_(ss, t) {
  return ss.getSheets().filter(function (s) { return norm_(s.getName()) === t.name; })[0] || null;
}

/* pastikan 4 kolom konfirmasi ada; kembalikan header + indeks kolom (0-based) */
function ensureCols_(sh) {
  const last = Math.max(sh.getLastColumn(), 1);
  const head = sh.getRange(1, 1, 1, last).getValues()[0].map(String);
  const idx = {};
  CONF_HEADERS.forEach(function (h) {
    let i = head.findIndex(function (x) { return x.trim().toLowerCase() === h.toLowerCase(); });
    if (i < 0) { sh.getRange(1, head.length + 1).setValue(h).setFontWeight('bold'); head.push(h); i = head.length - 1; }
    idx[h] = i;
  });
  return { head: head, idx: idx };
}

function list_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = [], missing = [];
  TABS.forEach(function (t) {
    const sh = tabSheet_(ss, t);
    if (!sh) { missing.push(t.name); return; }
    const m = ensureCols_(sh);
    const n = sh.getLastRow(), rows = [];
    if (n > 1) {
      sh.getRange(2, 1, n - 1, m.head.length).getDisplayValues().forEach(function (c, i) {
        const has = c.some(function (v, j) { return CONF_HEADERS.indexOf(m.head[j]) < 0 && String(v).trim() !== ''; });
        if (has) rows.push({ r: i + 2, c: c });
      });
    }
    sheets.push({ name: t.name, label: t.label, kode: t.kode, headers: m.head, rows: rows });
  });
  return { ok: true, sheets: sheets, missing: missing };
}

function confirm_(b) {
  const t = TABS.filter(function (x) { return x.name === norm_(b.sheet); })[0];
  if (!t) return { ok: false, error: 'Tab tidak dikenal' };
  const status = String(b.status || '');
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '';
  if (STATUSES.indexOf(label) < 0) return { ok: false, error: 'Status tidak valid' };
  const by = String(b.by || '').trim(), note = String(b.note || '').trim();
  if (!by) return { ok: false, error: 'Nama pengonfirmasi wajib diisi' };
  if ((label === 'Improvement' || label === 'Rejected') && note.length < MIN_NOTE)
    return { ok: false, error: 'Keterangan wajib diisi (minimal ' + MIN_NOTE + ' karakter)' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = tabSheet_(ss, t);
    if (!sh) return { ok: false, error: 'Tab "' + t.name + '" tidak ditemukan' };
    const m = ensureCols_(sh);
    const row = Number(b.row);
    if (!(row >= 2 && row <= sh.getLastRow())) return { ok: false, error: 'Baris tidak ditemukan. Muat ulang data.' };
    const width = m.head.length;
    const cur = sh.getRange(row, 1, 1, width).getDisplayValues()[0];
    // cegah menimpa baris yang salah bila sheet berubah (baris dihapus/diurutkan)
    if (cur.slice(0, 4).join('|') !== String(b.sig)) return { ok: false, error: 'Data di sheet sudah berubah. Muat ulang lalu coba lagi.' };

    const oldStatus = String(cur[m.idx['Status Konfirmasi']] || '');
    const when = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    sh.getRange(row, m.idx['Status Konfirmasi'] + 1).setValue(label);
    sh.getRange(row, m.idx['Keterangan Konfirmasi'] + 1).setValue(safe_(note));
    sh.getRange(row, m.idx['Dikonfirmasi Oleh'] + 1).setValue(safe_(by));
    sh.getRange(row, m.idx['Waktu Konfirmasi'] + 1).setValue(when);

    let log = ss.getSheetByName(LOG_SHEET);
    if (!log) {
      log = ss.insertSheet(LOG_SHEET);
      log.appendRow(['Waktu', 'Jenis lomba', 'Tab', 'Baris', 'Identitas (4 kolom pertama)', 'Status lama', 'Status baru', 'Keterangan', 'Oleh']);
      log.getRange(1, 1, 1, 9).setFontWeight('bold');
    }
    log.appendRow([when, t.label, t.name, row, safe_(cur.slice(0, 4).join(' | ')), oldStatus || 'Registered', label || 'Registered', safe_(note), safe_(by)]);

    SpreadsheetApp.flush();
    return { ok: true, cells: sh.getRange(row, 1, 1, width).getDisplayValues()[0] };
  } finally {
    lock.releaseLock();
  }
}

/* Gerbang pengumpulan karya (publik). Hanya mengembalikan status Verified + jenis lomba tim yang cocok. */
function check_(email, tim) {
  email = norm_(email); tim = norm_(tim);
  if (!email || !tim || email.length > 200 || tim.length > 200) return { ok: false, error: 'Isi email ketua dan nama tim' };
  // anti tebak-tebakan: maks 60 cek per menit
  const cache = CacheService.getScriptCache(), k = 'chk' + Math.floor(Date.now() / 60000);
  const n = Number(cache.get(k) || 0) + 1;
  if (n > 60) return { ok: false, v: VERSION, error: 'Terlalu banyak percobaan. Coba lagi 1 menit lagi.' };
  cache.put(k, String(n), 90);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let found = false;
  for (let a = 0; a < TABS.length; a++) {
    const t = TABS[a], sh = tabSheet_(ss, t);
    if (!sh || sh.getLastRow() < 2) continue;
    const m = ensureCols_(sh);
    const find = function (re, not) { return m.head.findIndex(function (h) { h = h.toLowerCase(); return re.test(h) && !(not && not.test(h)); }); };
    // Tally: judul kolom = teks pertanyaan. Utamakan "email ketua", lalu email mana pun yang bukan email anggota.
    let iE = find(/e-?mail/, /anggota|(^|[^a-z])(2|3|ii|iii)([^a-z]|$)/);
    const iEk = find(/ketua.*e-?mail|e-?mail.*ketua/); if (iEk >= 0) iE = iEk;
    const iT = find(/(^|[^a-z])tim([^a-z]|$)/, /anggota|ketua|nomor|hp|email|e-mail/);
    if (iE < 0 || iT < 0) continue;
    const iS = m.idx['Status Konfirmasi'];
    const vals = sh.getRange(2, 1, sh.getLastRow() - 1, m.head.length).getDisplayValues();
    for (let i = 0; i < vals.length; i++) {
      const r = vals[i];
      if (norm_(r[iE]) === email && norm_(r[iT]) === tim) {
        found = true;
        if (norm_(r[iS]) === 'verified') return { ok: true, v: VERSION, found: true, verified: true, tim: r[iT], cabang: t.label, kode: t.kode };
      }
    }
  }
  return { ok: true, v: VERSION, found: found, verified: false };
}


/* =====================================================================
 * KONTEN WEBSITE (Dashboard Panitia > Konten Web) — tayang langsung tanpa unggah content.json
 * Disimpan di tab "WebsiteContent" (dibuat otomatis): key | part | data | updated
 * Satu key bisa dipecah beberapa baris (batas 1 sel = 50.000 karakter).
 *  - GET  ?action=content            : publik, mengirim seluruh konten
 *  - POST {action:'saveContent',token} : wajib sesi panitia, menimpa key yang dikirim
 * ===================================================================== */
const CONTENT_SHEET = 'WebsiteContent';
const CONTENT_HEAD  = ['key', 'part', 'data', 'updated'];
const CHUNK = 40000;
const BLOCKED_KEYS = ['certs', 'roster', 'participants'];

function contentSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(CONTENT_SHEET);
  if (!sh) { sh = ss.insertSheet(CONTENT_SHEET); sh.getRange(1, 1, 1, 4).setValues([CONTENT_HEAD]); }
  return sh;
}

function getContent_() {
  const sh = contentSheet_(), n = sh.getLastRow(), by = {}, out = {};
  if (n > 1) {
    sh.getRange(2, 1, n - 1, 3).getValues().forEach(function (r) {
      if (!r[0]) return;
      (by[r[0]] = by[r[0]] || []).push([Number(r[1]), String(r[2])]);
    });
    Object.keys(by).forEach(function (k) {
      try { out[k] = JSON.parse(by[k].sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; }).join('')); } catch (e) {}
    });
  }
  return { ok: true, v: VERSION, content: out };
}

function saveContent_(b) {
  const items = b.items || {}, keys = Object.keys(items);
  for (let i = 0; i < keys.length; i++) {
    if (!/^[a-zA-Z0-9_]{1,40}$/.test(keys[i]) || BLOCKED_KEYS.indexOf(keys[i]) >= 0) return { ok: false, error: 'Nama data tidak diizinkan: ' + keys[i] };
    try { JSON.parse(String(items[keys[i]])); } catch (e) { return { ok: false, error: 'Data ' + keys[i] + ' bukan JSON yang valid' }; }
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const sh = contentSheet_(), n = sh.getLastRow();
    let rows = n > 1 ? sh.getRange(2, 1, n - 1, 4).getValues() : [];
    rows = rows.filter(function (r) { return keys.indexOf(String(r[0])) < 0; });
    const now = new Date();
    keys.forEach(function (k) {
      const j = String(items[k]);
      for (let i = 0, p = 0; i < j.length; i += CHUNK, p++) rows.push([k, p, j.substr(i, CHUNK), now]);
    });
    sh.clearContents();
    sh.getRange(1, 1, 1, 4).setValues([CONTENT_HEAD]);
    if (rows.length) {
      sh.getRange(2, 3, rows.length, 1).setNumberFormat('@');   // teks polos: cegah isi sel dibaca sebagai rumus
      sh.getRange(2, 1, rows.length, 4).setValues(rows);
    }
    return { ok: true, saved: keys };
  } finally { lock.releaseLock(); }
}


/* =====================================================================
 * LOGIN PANITIA — 2 faktor yang HARUS cocok sebagai satu pasangan:
 *   (1) akun Google (ID token diverifikasi ke Google, bukan percaya kiriman browser)
 *   (2) password pribadi milik akun Google itu (disimpan sebagai hash + salt, bukan teks asli)
 * Akun benar tapi password milik orang lain / typo / tertukar  => ditolak.
 * Data panitia disimpan di Script Properties (tidak tampil di Google Sheet).
 *  - POST {action:'login', idToken, password} -> {token, name, email}
 *  - Aksi lain (list, confirm, saveContent, whoami) wajib {token}
 * ===================================================================== */
const GENERIC_FAIL = 'Akun Google dan password tidak cocok. Pastikan memakai akun Google panitia yang benar dan password pribadimu sendiri.';

function sha_(str) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
function hashPw_(salt, pw) {
  let h = salt + '|' + pw;
  for (let i = 0; i < HASH_ROUNDS; i++) h = sha_(h + '|' + salt);
  return h;
}
function safeEq_(a, b) {            // banding waktu-tetap
  a = String(a); b = String(b);
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
function pKey_(email) { return 'panitia:' + norm_(email); }

/* verifikasi ID token Google; kembalikan {email,name} atau null */
function verifyGoogle_(idToken) {
  if (!idToken || String(idToken).length > 4000) return null;
  if (GOOGLE_CLIENT_ID.indexOf('GANTI_') === 0) return { error: 'Client ID Google belum dipasang di Code.gs (GOOGLE_CLIENT_ID).' };
  try {
    const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return null;
    const t = JSON.parse(r.getContentText());
    const iss = String(t.iss || '');
    if (t.aud !== GOOGLE_CLIENT_ID) return null;
    if (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') return null;
    if (String(t.email_verified) !== 'true') return null;
    if (Number(t.exp) * 1000 < Date.now()) return null;
    return { email: norm_(t.email), name: String(t.name || t.email) };
  } catch (e) { return null; }
}

function login_(b) {
  const cache = CacheService.getScriptCache();
  const g = verifyGoogle_(b.idToken);
  if (g && g.error) return { ok: false, error: g.error };
  if (!g) return { ok: false, error: 'Login Google tidak valid atau kedaluwarsa. Pilih akun Google lagi.' };

  const fk = 'fail:' + sha_(g.email), fails = Number(cache.get(fk) || 0);
  if (fails >= MAX_FAIL) return { ok: false, error: 'Terlalu banyak percobaan gagal. Akun ini dikunci sementara, coba lagi sekitar 15 menit.' };

  const pw = String(b.password || '');
  const raw = PropertiesService.getScriptProperties().getProperty(pKey_(g.email));
  let rec = null; try { rec = raw ? JSON.parse(raw) : null; } catch (e) {}
  // selalu hitung hash (juga untuk email tak terdaftar) agar waktu respons sama & tidak membocorkan siapa panitia
  const salt = rec ? rec.salt : 'x';
  const calc = hashPw_(salt, pw.slice(0, 200));
  const good = !!rec && rec.active !== false && pw.length > 0 && safeEq_(calc, rec.hash);
  if (!good) {
    cache.put(fk, String(fails + 1), LOCK_SECONDS);
    return { ok: false, error: GENERIC_FAIL };
  }
  // token Google sekali pakai (cegah dipakai ulang bila bocor)
  const uk = 'used:' + sha_(b.idToken);
  if (cache.get(uk)) return { ok: false, error: 'Login Google sudah dipakai. Pilih akun Google lagi.' };
  cache.put(uk, '1', 3600);
  cache.remove(fk);

  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  cache.put('ses:' + sha_(token), JSON.stringify({ email: g.email, name: rec.name || g.name }), SESSION_TTL);
  return { ok: true, v: VERSION, token: token, email: g.email, name: rec.name || g.name };
}

function session_(token) {
  if (!token || String(token).length < 32 || String(token).length > 200) return null;
  const raw = CacheService.getScriptCache().get('ses:' + sha_(token));
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    // akun yang dinonaktifkan / dihapus langsung kehilangan akses walau sesinya masih ada
    const rr = PropertiesService.getScriptProperties().getProperty(pKey_(s.email));
    if (!rr || JSON.parse(rr).active === false) return null;
    return s;
  } catch (e) { return null; }
}

function logout_(b) {
  if (b.token) CacheService.getScriptCache().remove('ses:' + sha_(b.token));
  return { ok: true };
}

/* ---------------------------------------------------------------------
 * KELOLA DAFTAR PANITIA — jalankan dari editor Apps Script (pilih fungsi > Run).
 * 1) Isi PANITIA_BARU di bawah (email akun Google + nama + password pribadi, min. 8 karakter)
 * 2) Jalankan simpanPanitia()
 * 3) SETELAH itu hapus password dari kode ini (yang tersimpan hanya hash-nya)
 * Ubah password = isi ulang email yang sama lalu jalankan simpanPanitia() lagi.
 * --------------------------------------------------------------------- */
const PANITIA_BARU = [
];

function simpanPanitia() {
  const props = PropertiesService.getScriptProperties(), hasil = [];
  PANITIA_BARU.forEach(function (p) {
    const email = norm_(p.email), pw = String(p.password || '');
    if (!/^\S+@\S+\.\S+$/.test(email)) { hasil.push('GAGAL (email tidak valid): ' + p.email); return; }
    if (pw.length < 8) { hasil.push('GAGAL (password < 8 karakter): ' + email); return; }
    const salt = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    props.setProperty(pKey_(email), JSON.stringify({ name: String(p.nama || email), salt: salt, hash: hashPw_(salt, pw), active: true, at: new Date().toISOString() }));
    hasil.push('OK: ' + email + ' (' + (p.nama || '') + ')');
  });
  Logger.log(hasil.join('\n') + '\n\nPENTING: sekarang hapus password dari PANITIA_BARU di kode ini.');
}

function daftarPanitia() {     // lihat siapa saja yang terdaftar (tanpa password)
  const all = PropertiesService.getScriptProperties().getProperties(), out = [];
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('panitia:') !== 0) return;
    const r = JSON.parse(all[k]);
    out.push(k.slice(8) + ' | ' + r.name + ' | ' + (r.active === false ? 'NONAKTIF' : 'aktif'));
  });
  Logger.log(out.length ? out.join('\n') : 'Belum ada panitia terdaftar.');
}

const EMAIL_TARGET = '';       // isi email lalu jalankan nonaktifkanPanitia() / aktifkanPanitia() / hapusPanitia()
function nonaktifkanPanitia() { setActive_(false); }
function aktifkanPanitia()    { setActive_(true); }
function setActive_(on) {
  const k = pKey_(EMAIL_TARGET), props = PropertiesService.getScriptProperties(), raw = props.getProperty(k);
  if (!raw) return Logger.log('Email tidak ditemukan: ' + EMAIL_TARGET);
  const r = JSON.parse(raw); r.active = on; props.setProperty(k, JSON.stringify(r));
  Logger.log((on ? 'Diaktifkan: ' : 'Dinonaktifkan: ') + EMAIL_TARGET);
}
function hapusPanitia() {
  PropertiesService.getScriptProperties().deleteProperty(pKey_(EMAIL_TARGET));
  Logger.log('Dihapus: ' + EMAIL_TARGET);
}
