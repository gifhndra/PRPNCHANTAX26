/**
 * BACKEND DASHBOARD KONFIRMASI PENDAFTAR — PRPN x ENCHANTAX 2026
 * VERSION 9
 *
 * Login panitia: Google Identity Token + password dashboard pribadi.
 * Sesi admin disimpan di CacheService selama 6 jam.
 *
 * Deployment:
 * Execute as: Me
 * Who has access: Anyone
 *
 * PENTING:
 * 1. Isi GOOGLE_CLIENT_ID dengan OAuth Web Client ID yang sama dengan frontend.
 * 2. Daftarkan password panitia melalui fungsi setPanitiaPassword_()
 *    yang dijalankan MANUAL dari editor Apps Script. Password tidak disimpan
 *    mentah; yang disimpan hanya salt dan hash di Script Properties.
 * 3. Jangan letakkan password atau daftar password di GitHub/frontend.
 */

const SPREADSHEET_ID = '1NPAU1kzwaTL8H_7C7cp2x3yMU5a3zyiOaUyjoT-Hf78';
const GOOGLE_CLIENT_ID = '913127893846-8fhrpro22ftv8caft6iu38rq2ru3lq3v.apps.googleusercontent.com';

const TABS = [
  { name: 'cerdas cermat',  label: 'LCC',            kode: 'lcc' },
  { name: 'call for paper', label: 'Call for Paper', kode: 'cfp' },
  { name: 'creative',       label: 'Infografis',     kode: 'infografis' }
];

const CONF_HEADERS = [
  'Status Konfirmasi',
  'Keterangan Konfirmasi',
  'Dikonfirmasi Oleh',
  'Waktu Konfirmasi'
];

const LOG_SHEET = 'Riwayat Konfirmasi';
const STATUSES = ['', 'Verified', 'Improvement', 'Rejected'];
const MIN_NOTE = 10;
const VERSION = 9;

const CONTENT_SHEET = 'WebsiteContent';
const CONTENT_HEAD = ['key', 'part', 'data', 'updated'];
const CHUNK = 40000;
const BLOCKED_KEYS = ['certs', 'roster', 'participants'];

const SESSION_TTL = 21600; // 6 jam
const SESSION_PREFIX = 'PRPN_SESSION_';
const ADMIN_PROPERTY = 'PANITIA_JSON';

/* ============================================================
 * ROUTER
 * ============================================================ */

function doGet(e) {
  const p = (e && e.parameter) || {};

  // Endpoint publik untuk gerbang pengumpulan karya.
  if (p.action === 'check') return out_(check_(p.email, p.tim));

  // Endpoint publik untuk membaca konten website.
  if (p.action === 'content') return out_(getContent_());

  return out_({
    ok: true,
    v: VERSION,
    info: 'API Konfirmasi Pendaftar aktif'
  });
}

function doPost(e) {
  let b;

  try {
    b = JSON.parse(e.postData.contents || '{}');
  } catch (err) {
    return out_({ ok: false, error: 'Format permintaan tidak valid' });
  }

  const action = String(b.action || '');

  // Login tidak memerlukan sesi; identitas Google dan password diperiksa di sini.
  if (action === 'login') return out_(login_(b));

  if (action === 'whoami') return out_(whoami_(b.token));

  if (action === 'logout') return out_(logout_(b.token));

  // Semua aksi admin selain login wajib mempunyai token sesi valid.
  const session = getSession_(b.token);
  if (!session) {
    return out_({
      ok: false,
      error: 'Sesi panitia tidak valid atau sudah berakhir. Silakan login kembali.'
    });
  }

  if (action === 'list') return out_(list_());

  if (action === 'confirm') return out_(confirm_(b, session));

  if (action === 'saveContent') return out_(saveContent_(b));

  return out_({ ok: false, error: 'Aksi tidak dikenal' });
}

function out_(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
 * AUTENTIKASI PANITIA
 * ============================================================ */

/**
 * Jalankan fungsi ini MANUAL dari editor Apps Script untuk mendaftarkan
 * atau mengganti password satu panitia.
 *
 * Contoh pemakaian sementara:
 * function setupKinan() {
 *   setPanitiaPassword_('4111240063_kinan@pknstan.ac.id', 'Kinan', 'PASSWORD_BARU');
 * }
 *
 * Setelah dijalankan, hapus wrapper setupKinan() dari project.
 * Password mentah tidak disimpan; hanya salt dan hash yang disimpan.
 */
function setPanitiaPassword_(email, name, password) {
  email = String(email || '').toLowerCase().trim();
  name = String(name || '').trim();
  password = String(password || '');

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('Format email panitia tidak valid.');
  }
  if (!name) throw new Error('Nama panitia wajib diisi.');
  if (password.length < 12) {
    throw new Error('Password dashboard minimal 12 karakter.');
  }

  const props = PropertiesService.getScriptProperties();
  let admins = {};

  try {
    admins = JSON.parse(props.getProperty(ADMIN_PROPERTY) || '{}');
  } catch (err) {
    throw new Error('PANITIA_JSON rusak. Periksa Script Properties.');
  }

  const salt = Utilities.getUuid() + Utilities.getUuid();
  admins[email] = {
    name: name,
    salt: salt,
    hash: sha256_(salt + ':' + password)
  };

  props.setProperty(ADMIN_PROPERTY, JSON.stringify(admins));
  return 'Password dashboard berhasil disetel untuk ' + email;
}

/** Verifikasi Google ID token dan password dashboard. */
function login_(b) {
  const idToken = String(b.idToken || '');
  const password = String(b.password || '');

  if (!idToken || !password) {
    return { ok: false, error: 'Akun Google dan password wajib diisi.' };
  }
  if (idToken.length > 10000 || password.length > 200) {
    return { ok: false, error: 'Permintaan tidak valid.' };
  }

  // Batas percobaan login per project per menit.
  const cache = CacheService.getScriptCache();
  const minuteKey = 'PRPN_LOGIN_' + Math.floor(Date.now() / 60000);
  const attempts = Number(cache.get(minuteKey) || 0) + 1;
  cache.put(minuteKey, String(attempts), 90);

  if (attempts > 20) {
    return { ok: false, error: 'Terlalu banyak percobaan login. Coba lagi sebentar.' };
  }

  let google;
  try {
    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' +
      encodeURIComponent(idToken);
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

    if (response.getResponseCode() !== 200) {
      return { ok: false, error: 'Verifikasi akun Google gagal.' };
    }
    google = JSON.parse(response.getContentText());
  } catch (err) {
    return { ok: false, error: 'Tidak dapat memverifikasi akun Google.' };
  }

  const email = String(google.email || '').toLowerCase().trim();
  const issuer = String(google.iss || '');
  const audience = String(google.aud || '');
  const expires = Number(google.exp || 0);

  if (
    audience !== GOOGLE_CLIENT_ID ||
    !['accounts.google.com', 'https://accounts.google.com'].includes(issuer) ||
    String(google.email_verified) !== 'true' ||
    !expires ||
    expires * 1000 <= Date.now() ||
    !email
  ) {
    return { ok: false, error: 'Identitas Google tidak valid.' };
  }

  let admins;
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(ADMIN_PROPERTY);
    if (!raw) return { ok: false, error: 'Daftar panitia belum dikonfigurasi.' };
    admins = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: 'Konfigurasi panitia tidak valid.' };
  }

  const admin = admins[email];
  if (!admin || !admin.salt || !admin.hash) {
    return { ok: false, error: 'Akun Google tidak terdaftar sebagai panitia.' };
  }

  const digest = sha256_(String(admin.salt) + ':' + password);
  if (!constantTimeEqual_(digest, String(admin.hash))) {
    return { ok: false, error: 'Password pribadi salah.' };
  }

  const token = Utilities.getUuid() + Utilities.getUuid();
  const session = {
    email: email,
    name: String(admin.name || ''),
    created: Date.now()
  };

  CacheService.getScriptCache().put(
    SESSION_PREFIX + token,
    JSON.stringify(session),
    SESSION_TTL
  );

  return {
    ok: true,
    token: token,
    email: email,
    name: session.name,
    expiresIn: SESSION_TTL
  };
}

function sha256_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  );

  return bytes.map(function (b) {
    const n = (b + 256) % 256;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function constantTimeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function getSession_(token) {
  token = String(token || '');
  if (!token || token.length > 200) return null;

  const raw = CacheService.getScriptCache().get(SESSION_PREFIX + token);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function whoami_(token) {
  const session = getSession_(token);
  if (!session) {
    return { ok: false, error: 'Sesi tidak valid atau sudah berakhir.' };
  }

  return {
    ok: true,
    email: session.email,
    name: session.name
  };
}

function logout_(token) {
  token = String(token || '');
  if (token && token.length <= 200) {
    CacheService.getScriptCache().remove(SESSION_PREFIX + token);
  }
  return { ok: true };
}

/* ============================================================
 * UTILITAS DATA DAN SHEET
 * ============================================================ */

function norm_(v) {
  return String(v == null ? '' : v).toLowerCase().replace(/\s+/g, ' ').trim();
}

function safe_(v) {
  v = String(v == null ? '' : v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function tabSheet_(ss, t) {
  return ss.getSheets().filter(function (s) {
    return norm_(s.getName()) === t.name;
  })[0] || null;
}

function ensureCols_(sh) {
  const last = Math.max(sh.getLastColumn(), 1);
  const head = sh.getRange(1, 1, 1, last).getValues()[0].map(String);
  const idx = {};

  CONF_HEADERS.forEach(function (h) {
    let i = head.findIndex(function (x) {
      return x.trim().toLowerCase() === h.toLowerCase();
    });

    if (i < 0) {
      sh.getRange(1, head.length + 1).setValue(h).setFontWeight('bold');
      head.push(h);
      i = head.length - 1;
    }
    idx[h] = i;
  });

  return { head: head, idx: idx };
}

/* ============================================================
 * LIST PENDAFTAR — hanya dipanggil setelah sesi admin valid
 * ============================================================ */

function list_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = [];
  const missing = [];

  TABS.forEach(function (t) {
    const sh = tabSheet_(ss, t);
    if (!sh) {
      missing.push(t.name);
      return;
    }

    const m = ensureCols_(sh);
    const n = sh.getLastRow();
    const rows = [];

    if (n > 1) {
      sh.getRange(2, 1, n - 1, m.head.length)
        .getDisplayValues()
        .forEach(function (c, i) {
          const has = c.some(function (v, j) {
            return CONF_HEADERS.indexOf(m.head[j]) < 0 &&
              String(v).trim() !== '';
          });
          if (has) rows.push({ r: i + 2, c: c });
        });
    }

    sheets.push({
      name: t.name,
      label: t.label,
      kode: t.kode,
      headers: m.head,
      rows: rows
    });
  });

  return { ok: true, sheets: sheets, missing: missing };
}

/* ============================================================
 * SIMPAN KONFIRMASI — nama pengonfirmasi dipaksa dari sesi server
 * ============================================================ */

function confirm_(b, session) {
  const t = TABS.filter(function (x) {
    return x.name === norm_(b.sheet);
  })[0];

  if (!t) return { ok: false, error: 'Tab tidak dikenal' };

  const status = String(b.status || '');
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : '';

  if (STATUSES.indexOf(label) < 0) {
    return { ok: false, error: 'Status tidak valid' };
  }

  // Jangan percaya nama pengonfirmasi dari browser.
  const by = String(session.name || '').trim();
  const note = String(b.note || '').trim();

  if (!by) return { ok: false, error: 'Nama panitia pada sesi tidak valid.' };

  if (
    (label === 'Improvement' || label === 'Rejected') &&
    note.length < MIN_NOTE
  ) {
    return {
      ok: false,
      error: 'Keterangan wajib diisi (minimal ' + MIN_NOTE + ' karakter)'
    };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = tabSheet_(ss, t);
    if (!sh) return { ok: false, error: 'Tab "' + t.name + '" tidak ditemukan' };

    const m = ensureCols_(sh);
    const row = Number(b.row);

    if (!(row >= 2 && row <= sh.getLastRow())) {
      return { ok: false, error: 'Baris tidak ditemukan. Muat ulang data.' };
    }

    const width = m.head.length;
    const cur = sh.getRange(row, 1, 1, width).getDisplayValues()[0];

    // Cegah menimpa baris yang salah jika sheet berubah.
    if (cur.slice(0, 4).join('|') !== String(b.sig)) {
      return {
        ok: false,
        error: 'Data di sheet sudah berubah. Muat ulang lalu coba lagi.'
      };
    }

    const oldStatus = String(cur[m.idx['Status Konfirmasi']] || '');
    const when = Utilities.formatDate(
      new Date(),
      'Asia/Jakarta',
      'dd/MM/yyyy HH:mm:ss'
    );

    sh.getRange(row, m.idx['Status Konfirmasi'] + 1).setValue(label);
    sh.getRange(row, m.idx['Keterangan Konfirmasi'] + 1).setValue(safe_(note));
    sh.getRange(row, m.idx['Dikonfirmasi Oleh'] + 1).setValue(safe_(by));
    sh.getRange(row, m.idx['Waktu Konfirmasi'] + 1).setValue(when);

    let log = ss.getSheetByName(LOG_SHEET);
    if (!log) {
      log = ss.insertSheet(LOG_SHEET);
      log.appendRow([
        'Waktu', 'Jenis lomba', 'Tab', 'Baris',
        'Identitas (4 kolom pertama)', 'Status lama',
        'Status baru', 'Keterangan', 'Oleh'
      ]);
      log.getRange(1, 1, 1, 9).setFontWeight('bold');
    }

    log.appendRow([
      when,
      t.label,
      t.name,
      row,
      safe_(cur.slice(0, 4).join(' | ')),
      oldStatus || 'Registered',
      label || 'Registered',
      safe_(note),
      safe_(by)
    ]);

    SpreadsheetApp.flush();

    return {
      ok: true,
      cells: sh.getRange(row, 1, 1, width).getDisplayValues()[0]
    };
  } finally {
    lock.releaseLock();
  }
}

/* ============================================================
 * GERBANG PENGUMPULAN KARYA — publik
 * ============================================================ */

function check_(email, tim) {
  email = norm_(email);
  tim = norm_(tim);

  if (!email || !tim || email.length > 200 || tim.length > 200) {
    return { ok: false, error: 'Isi email ketua dan nama tim' };
  }

  // Maksimal 60 pemeriksaan per menit per project.
  const cache = CacheService.getScriptCache();
  const k = 'chk' + Math.floor(Date.now() / 60000);
  const n = Number(cache.get(k) || 0) + 1;

  if (n > 60) {
    return {
      ok: false,
      v: VERSION,
      error: 'Terlalu banyak percobaan. Coba lagi 1 menit lagi.'
    };
  }
  cache.put(k, String(n), 90);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let found = false;
  let info = null; // detail baris terakhir yang cocok tetapi belum Verified

  for (let a = 0; a < TABS.length; a++) {
    const t = TABS[a];
    const sh = tabSheet_(ss, t);
    if (!sh || sh.getLastRow() < 2) continue;

    const m = ensureCols_(sh);
    const find = function (re, not) {
      return m.head.findIndex(function (h) {
        h = h.toLowerCase();
        return re.test(h) && !(not && not.test(h));
      });
    };

    let iE = find(/e-?mail/, /anggota|(^|[^a-z])(2|3|ii|iii)([^a-z]|$)/);
    const iEk = find(/ketua.*e-?mail|e-?mail.*ketua/);
    if (iEk >= 0) iE = iEk;

    const iT = find(
      /(^|[^a-z])tim([^a-z]|$)/,
      /anggota|ketua|nomor|hp|email|e-mail/
    );

    if (iE < 0 || iT < 0) continue;

    const iS = m.idx['Status Konfirmasi'];
    const iK = m.idx['Keterangan Konfirmasi'];
    const vals = sh.getRange(
      2, 1, sh.getLastRow() - 1, m.head.length
    ).getDisplayValues();

    for (let i = 0; i < vals.length; i++) {
      const r = vals[i];

      if (norm_(r[iE]) === email && norm_(r[iT]) === tim) {
        found = true;

        if (norm_(r[iS]) === 'verified') {
          return {
            ok: true,
            v: VERSION,
            found: true,
            verified: true,
            tim: r[iT],
            cabang: t.label,
            kode: t.kode
          };
        }

        // Simpan status & keterangan panitia agar bisa ditampilkan ke peserta.
        info = {
          tim: r[iT],
          cabang: t.label,
          kode: t.kode,
          status: String(r[iS] || '').trim() || 'Registered',
          keterangan: String(r[iK] || '').trim()
        };
      }
    }
  }

  const res = { ok: true, v: VERSION, found: found, verified: false };
  if (info) {
    res.tim = info.tim;
    res.cabang = info.cabang;
    res.kode = info.kode;
    res.status = info.status;
    res.keterangan = info.keterangan;
  }
  return res;
}

/* ============================================================
 * KONTEN WEBSITE — baca publik, simpan wajib sesi admin
 * ============================================================ */

function contentSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(CONTENT_SHEET);

  if (!sh) {
    sh = ss.insertSheet(CONTENT_SHEET);
    sh.getRange(1, 1, 1, 4).setValues([CONTENT_HEAD]);
  }

  return sh;
}

function getContent_() {
  const sh = contentSheet_();
  const n = sh.getLastRow();
  const by = {};
  const out = {};

  if (n > 1) {
    sh.getRange(2, 1, n - 1, 3).getValues().forEach(function (r) {
      if (!r[0]) return;
      (by[r[0]] = by[r[0]] || []).push([Number(r[1]), String(r[2])]);
    });

    Object.keys(by).forEach(function (k) {
      try {
        out[k] = JSON.parse(
          by[k]
            .sort(function (a, b) { return a[0] - b[0]; })
            .map(function (x) { return x[1]; })
            .join('')
        );
      } catch (e) {
        // Abaikan key yang datanya tidak dapat diparse.
      }
    });
  }

  return { ok: true, v: VERSION, content: out };
}

function saveContent_(b) {
  const items = b.items || {};
  const keys = Object.keys(items);

  for (let i = 0; i < keys.length; i++) {
    if (
      !/^[a-zA-Z0-9_]{1,40}$/.test(keys[i]) ||
      BLOCKED_KEYS.indexOf(keys[i]) >= 0
    ) {
      return { ok: false, error: 'Nama data tidak diizinkan: ' + keys[i] };
    }

    try {
      JSON.parse(String(items[keys[i]]));
    } catch (e) {
      return { ok: false, error: 'Data ' + keys[i] + ' bukan JSON yang valid' };
    }
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(25000);

  try {
    const sh = contentSheet_();
    const n = sh.getLastRow();
    let rows = n > 1
      ? sh.getRange(2, 1, n - 1, 4).getValues()
      : [];

    rows = rows.filter(function (r) {
      return keys.indexOf(String(r[0])) < 0;
    });

    const now = new Date();

    keys.forEach(function (k) {
      const j = String(items[k]);
      for (let i = 0, p = 0; i < j.length; i += CHUNK, p++) {
        rows.push([k, p, j.substr(i, CHUNK), now]);
      }
    });

    sh.clearContents();
    sh.getRange(1, 1, 1, 4).setValues([CONTENT_HEAD]);

    if (rows.length) {
      sh.getRange(2, 3, rows.length, 1).setNumberFormat('@');
      sh.getRange(2, 1, rows.length, 4).setValues(rows);
    }

    return { ok: true, saved: keys };
  } finally {
    lock.releaseLock();
  }
}

/* ============================================================
 * PEMERIKSAAN KONFIGURASI
 * ============================================================ */

/** Jalankan manual dari editor untuk melihat email panitia yang sudah terdaftar. */
function cekDaftarPanitia_() {
  const raw = PropertiesService.getScriptProperties().getProperty(ADMIN_PROPERTY);
  if (!raw) {
    Logger.log('Belum ada panitia terdaftar.');
    return;
  }

  const admins = JSON.parse(raw);
  Logger.log(Object.keys(admins).join('\n'));
}
