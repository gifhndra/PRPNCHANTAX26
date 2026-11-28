# Rencana Tahap 2: Perjalanan Hutan (#pg-portal)

## Selektor Global Berisiko di `css/style.css` & `css/cms.css`
1. `section>*:not(.cloud)` (`style.css:96`): memaksa anak langsung `section` berposisi `relative` -> latar hutan SVG/layer harus diletakkan pada `#pg-portal` atau di-override khusus `#pg-portal section > .portal-bg`.
2. `.page`, `.page::before`, `.page::after` (`style.css:709-716`) & `.page section` (`style.css:717-719`): gradien langit pastel + pola pelangi + `!important` padding/background.
3. `.tag`, `.card`, `.btn`, `h1,h2,h3` (`style.css:6-15`): font Fredoka/Nunito, pil kuning, kartu `26px`, radius kapsul.
4. `.abx`, `.abc`, `.abf`, `.abb` (`cms.css:63-82`, `style.css:449-479`): kartu balik putih/biru & gambar perlu `object-fit` + wadah krem perkamen.
5. `#timelineBranches`, `.path`, `.node`, `.runner.mascot-hop:after` (`style.css:272-282, 492-506, 592-673`): tab bulat, simbol `✦`, skala track mobile `<=640px`.
6. `#timelineBook`, `.book-page-paper`, `.book-spine`, `.book-turn-leaf`, `.book-spark`, `.flip` (`style.css:286-435, 507-586, 676-699`): sampul biru bintang (`assets/book/book-cover.svg`), `book-turn-leaf` disembunyikan, kotak hitung mundur berkedip.

## Rencana Singkat Implementasi (Semua CSS Terkunci di `#pg-portal`)
1. Perbaikan Tahap 1: cerahkan `#hero .flying-crow` ke `#8a2a30` + stroke emas `1px`; arsipkan `assets/book/*` ke `_archive/book-legacy/`.
2. Buat `css/portal-stage.css` & `js/portal-stage.js`: latar hutan marun `#14080a` (maks 4 lapis SVG, konsisten gaya hero, konten `<=1100px`), bebas emoji/bintang/awan.
3. Bagian A (`#about`): kartu perkamen `#f7f1e6` berbingkai emas, interaksi ketuk tetap, gambar `object-fit`.
4. Bagian B (`#timelineBranches`): 3 jalan setapak -> 3 gerbang SVG (maks 3 lapis); klik menjalankan `chooseTimelineBranch`, buka gerbang + <=24 partikel kembang api `1.2s`.
5. Bagian C (`#jadwal .path`): cabang pohon marun-emas + papan kayu gantung sesuai jumlah tahap data, pertahankan maskot lari & perbaikan mobile `<=640px`.
6. Bagian D (`#timelineBook`): kitab marun emboss emas jatuh sekali saat masuk layar, ketuk untuk buka; tampil `#det`, hitung mundur serif garis emas, & akses cepat (`kitList`).
7. Bagian E (`#portalMirror`): papan `"Cermin penambah pesona"`, cermin emas + catatan `"klik di sini"`, reveal teks & tombol `"Lewati"` sebelum `#berita`.
8. Verifikasi 4 viewport + 2 judul CMS (`INFINITAX 2026` & `PRPN x ENCHANTAX 2026`), audit screenshot jujur, lalu commit `"tahap 2 perjalanan hutan"`.
