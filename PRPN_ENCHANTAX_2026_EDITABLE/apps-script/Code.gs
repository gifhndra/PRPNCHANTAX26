/**
 * BACKEND DASHBOARD KONFIRMASI PENDAFTAR — PRPN x ENCHANTAX 2026
 * Tempel di Apps Script (script.google.com) pada proyek yang melayani URL /exec,
 * lalu: Deploy > Manage deployments > (ikon pensil) > Version: New version > Deploy.
 * URL /exec tetap sama. Pengaturan deployment: Execute as "Me", Who has access "Anyone".
 *
 * Hanya tiga tab jawaban formulir yang dibaca (tab lain seperti karya, WebsiteContent, Registrations diabaikan).
 * Jenis lomba ditentukan oleh nama tab.
 *
 *  - list    : kirim data ketiga tab ke dashboard
 *  - confirm : tulis Status / Keterangan / Dikonfirmasi Oleh / Waktu Konfirmasi ke baris peserta + catat di "Riwayat Konfirmasi"
 *  - check   : (publik) cek apakah email ketua + nama tim berstatus Verified, untuk membuka kunci pengumpulan karya
 * Kolom konfirmasi dibuat otomatis di sebelah kanan tiap tab bila belum ada.
 */
const SPREADSHEET_ID = '1NPAU1kzwaTL8H_7C7cp2x3yMU5a3zyiOaUyjoT-Hf78';
const SECRET         = 'GANTI_DENGAN_KUNCI_RAHASIA_PANJANG'; // WAJIB diganti; sama dengan yang dimasukkan di dashboard
// tab -> jenis lomba (nama tab tidak peka huruf besar/kecil)
const TABS = [
  { name: 'lcc',        label: 'LCC',            kode: 'lcc' },
  { name: 'cfp',        label: 'Call for Paper', kode: 'cfp' },
  { name: 'infografis', label: 'Infografis',     kode: 'infografis' }
];
const CONF_HEADERS = ['Status Konfirmasi', 'Keterangan Konfirmasi', 'Dikonfirmasi Oleh', 'Waktu Konfirmasi'];
const LOG_SHEET    = 'Riwayat Konfirmasi';
const STATUSES     = ['', 'Verified', 'Improvement', 'Rejected'];
const MIN_NOTE     = 10;
const VERSION      = 5; // penanda versi script (dipakai website untuk mendeteksi script yang belum diperbarui)

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'list') {
    if (p.key !== SECRET) return out_({ ok: false, error: 'Kunci akses salah' });
    return out_(list_());
  }
  if (p.action === 'check') return out_(check_(p.email, p.tim));
  return out_({ ok: true, v: VERSION, info: 'API Konfirmasi Pendaftar aktif' });
}

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'Format permintaan tidak valid' }); }
  if (b.key !== SECRET) return out_({ ok: false, error: 'Kunci akses salah' });
  if (b.action === 'confirm') return out_(confirm_(b));
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
    const iE = find(/e-?mail/, /anggota/), iT = find(/(^|[^a-z])tim([^a-z]|$)/, /anggota|ketua|nomor|hp/);
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
