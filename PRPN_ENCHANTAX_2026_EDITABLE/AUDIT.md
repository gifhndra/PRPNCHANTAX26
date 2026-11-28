# AUDIT TAHAP 0 — PRPN × ENCHANTAX 2026 (INFINITAX)

Dokumen ini merupakan hasil audit menyeluruh terhadap arsitektur teknis, logika JavaScript, aset, ikon emoji, dan struktur halaman sebelum redesain antarmuka dimulai. Seluruh elemen berlabel **BEKU** dilarang diubah perilakunya, dihapus ID/kelasnya, atau dirusak relasi DOM-nya pada setiap tahap redesain.

---

## 1. DAFTAR FUNGSI JS, ID, DAN KELAS KRITIS (STATUS: BEKU)

Semua fungsi dan elemen di bawah ini menjalankan alur krusial: verifikasi tim ke Google Sheets / Google Apps Script, alur pengumpulan karya peserta, hitung mundur (countdown), registrasi/pendaftaran, dan pengumuman pemenang (cinematic & modal).

### A. Verifikasi Tim Peserta
> Menghubungkan peserta dengan database panitia untuk validasi tim dan membuka akses narahubung Liaison Officer (LO) resmi.

- **File JS**: `js/gate.js`, `js/konfirmasi.js`, `js/app.js`
- **Fungsi BEKU**:
  - `gCheck(email, tim, silent)`: Mengirim permintaan validasi tim ke API Apps Script.
  - `gApply()`: Mengaplikasikan badge status verifikasi pada tampilan pengumpulan dan menampilkan kontak LO.
  - `gMatch(text, filter)`: Logika pencocokan string identitas tim.
  - `gAnyMatch(item, query)`: Pencarian multi-kriteria pada entri tim.
  - `gLO(branch)`: Mengambil profil dan narahubung LO resmi untuk cabang terkait.
  - `gLOHtml(branch)`: Render elemen kontak WhatsApp dan nama LO peserta.
  - `gDetail()`: Menampilkan modal dialog detail data tim terverifikasi.
  - `openGate(email, tim)`: Membuka formulir pintu gerbang verifikasi tim.
  - `openVerify()`: Handler tombol navigasi verifikasi peserta di header.
  - `kKey()`, `kMap()`, `kCall()`, `kLoad()`, `kRoster()`, `kAskLogin()`, `kView()`, `kDraw()`, `kRows()`, `kSave()`: Handler autentikasi dan sinkronisasi konfirmasi berkas tim panitia.
- **ID Elemen DOM BEKU**:
  - `#bv`: Tombol pemicu "Verifikasi" di header navbar.
  - `#gate`: Kontainer dialog verifikasi tim.
  - `#ge`: Input field alamat email peserta.
  - `#gt`: Input field nama tim.
  - `#gb`: Tombol aksi "Verifikasi Tim".
  - `#gx`: Tombol batal / logout identitas verifikasi tim.
  - `#gm`: Kontainer pesan status verifikasi (sukses / gagal / memuat).
  - `#subs`: Kontainer kartu pengumpulan yang merespons status verifikasi.
  - `#km`, `#kmb`: Modal pop-up tabel konfirmasi data panitia.
  - `#kf`, `#kkb`, `#kr`, `#kk2`, `#kfl`, `#kfs`, `#kfq`, `#kt`, `#kc`: Elemen internal kontrol konfirmasi panitia.
- **Kelas & Data Atribut BEKU**:
  - Kelas: `.sub-c`, `.verified-badge`, `.lo-box`, `.lo-contact`, `.scr`
  - Atribut: `data-bn`, `data-bid`, `data-r`, `data-f`, `data-save`

---

### B. Pengumpulan Karya
> Menampilkan formulir dan validasi tautan pengumpulan karya esai, policy brief, infografis, dan LCC.

- **File JS**: `js/app.js`, `js/gate.js`, `js/cms.js`
- **Fungsi BEKU**:
  - `buildSubs()`: Render daftar cabang pengumpulan karya sesuai data cabang aktif.
  - `openSub(id)`: Membuka panduan dan modal pengumpulan berkas spesifik.
  - `doSub(e)`: Validasi dan pengiriman berkas/tautan pengumpulan karya.
  - `admS(id)`: Pengelolaan pengumpulan berkas di dashboard admin.
  - `doWork()`, `doLink()`: Handler tautan pengumpulan dokumen ke Google Form/Drive.
- **ID Elemen DOM BEKU**:
  - `#pg-kumpul`: Kontainer halaman pengumpulan karya.
  - `#subs`: Kontainer pembungkus daftar kartu pengumpulan cabang lomba.
  - `#subd`: Kontainer rincian petunjuk pengumpulan karya.
  - `#ws`, `#wp`, `#wp2`, `#sb`, `#so`, `#sw`, `#se`, `#ct`, `#ck`, `#sc`, `#cg`, `#cn`, `#cc`, `#lo`: Elemen form input karya, status unggah, dan konfirmasi nama tim.
- **Kelas & Data Atribut BEKU**:
  - Kelas: `.sub-c`, `.sub-btn`, `.sub-meta`, `.cat`, `.roll`
  - Atribut: `data-link`, `data-link-type`, `data-bid`, `data-bn`, `data-role="submit"`

---

### C. Hitung Mundur (Countdown)
> Menghitung mundur batas waktu tahap pendaftaran atau pengumpulan sesuai cabang timeline yang aktif.

- **File JS**: `js/app.js`
- **Fungsi BEKU**:
  - `buildCd()`: Inisialisasi tanggal target countdown dari konfigurasi event/timeline.
  - `setCd(end, title)`: Menyetel waktu akhir dan teks judul hitung mundur.
  - `tick()`: Timer interval 1 detik untuk memperbarui angka hitung mundur.
  - `pad(n)`: Format string dua digit angka waktu.
- **ID Elemen DOM BEKU**:
  - `#jadwal`: Section pembungkus timeline dan hitung mundur.
  - `#cdT`: Judul countdown ("Berakhir dalam...").
  - `#cdBar`: Bilah visual kemajuan sisa waktu (progress bar).
  - `#cdTxt`: Teks format sisa waktu.
  - `#wib`: Penanda zona waktu resmi Indonesia Barat (WIB).
  - `#cdd`: Kontainer digit HARI.
  - `#cdh`: Kontainer digit JAM.
  - `#cdm`: Kontainer digit MENIT.
  - `#cds`: Kontainer digit DETIK.
- **Kelas & Data Atribut BEKU**:
  - Kelas: `.flip`, `.unit`, `.fl`, `.book-count`, `.book-mini-tag`, `.book-count-title`
  - Atribut: `data-tl` (identifikasi cabang lomba: `lcc`, `infografis`, `esai`)

---

### D. Pendaftaran
> Menampilkan daftar cabang lomba, panduan (handbook), formulir pendaftaran peserta, dan integrasi Google Form.

- **File JS**: `js/app.js`, `js/cms.js`
- **Fungsi BEKU**:
  - `buildCats()` / `buildAbout()`: Render kartu informasi cabang pendaftaran.
  - `pickCat(k)`: Handler pemilihan kartu cabang lomba.
  - `regForm(k)`: Membuka alur pendaftaran peserta pada cabang yang dipilih.
  - `doReg(e)`: Handler submit formulir pendaftaran.
  - `applyLinks()`: Menyuntikkan link pendaftaran, twibbon, dan poster dari konfigurasi CMS.
- **ID Elemen DOM BEKU**:
  - `#pg-daftar`: Kontainer halaman pendaftaran.
  - `#reg`: Section pilihan cabang pendaftaran.
  - `#track`: Kontainer visual alur jalur pendaftaran.
  - `#vb`, `#vn`, `#vr`, `#qr`, `#rs`, `#rn`, `#re`, `#rp`, `#ri`, `#rc`, `#rt`, `#rd`, `#re2`, `#wb`, `#wk`, `#rr`, `#rcp`, `#wl`, `#wf`: Form registrasi peserta, pratinjau QR Code, dan tombol aksi.
- **Kelas & Data Atribut BEKU**:
  - Kelas: `.cat`, `.cat-c`, `.reg-btn`, `.tab-b`, `.tabs`
  - Atribut: `data-t`, `data-p="daftar"`, `data-c`, `data-k`, `data-link`

---

### E. Pengumuman Juara
> Menampilkan pengumuman pemenang melalui panggung cinematic reveal beranimasi dan daftar hasil lengkap seluruh cabang lomba.

- **File JS**: `js/hasil.js`, `js/reveal.js`, `js/app.js`
- **Fungsi BEKU**:
  - `PRPNHasil.open(cat)` / `openHasil()`: Membuka modal daftar pemenang lengkap.
  - `PRPNHasil.close()` / `closeHasil()`: Menutup modal hasil juara.
  - `buildHasil(cat)`: Render podium dan tabel pemenang berdasarkan kategori.
  - `entry()`, `col()`, `paint()`: Render kartu pemenang dan skor.
  - `PRPNReveal.unveil(cat)` / `triggerReveal()`: Memulai sequence panggung animasi pengumuman juara.
  - `AnnouncementIntro()`, `MysteryReveal()`, `GrandReveal()`, `WinnerCard()`, `WinnerPodium()`, `WinnerCategory()`, `AnnouncementClosing()`: Komponen panggung pengumuman.
  - `runShow()`, `loopOn()`, `loopOff()`, `resetStage()`: Kontrol alur animasi panggung reveal.
  - `Dust`, `burst()`, `step()`, `tick()`: Partikel kembang api dan taburan emas perayaan.
- **ID Elemen DOM BEKU**:
  - `#pg-umum`: Halaman pengumuman pemenang.
  - `#juara`: Section pengumuman juara.
  - `#grAll`: Tombol pemicu "Hasil lengkap" (`#grAll`).
  - `#rev`: Kontainer root panggung animasi sinematik reveal.
  - `#has`: Kontainer modal hasil lengkap.
  - `#has-body`: Kontainer isi daftar pemenang.
- **Kelas & Data Atribut BEKU**:
  - Kelas: `.hl-tabs`, `.hl-tag`, `.hl-stage`, `.hl-scroll`, `.hl-act`, `.gh`, `.podium`, `.winner-card`
  - Atribut: `data-p="umum"`, `data-a`, `data-k`, `data-tl`

---

## 2. DAFTAR SELURUH ASET DI ASSETS/ DAN STATUS PENGGANTIAN

Berikut inventaris lengkap seluruh aset statis pada direktori `assets/`. Aset berlatar belakang langit (langit cerah, awan, ring biru/emas langit, matahari, serpihan bintang) ditandai sebagai **Akan diganti** untuk disesuaikan dengan tema dongeng kerajaan vintage (marun-hitam dan emas) pada tahap desain berikutnya.

| File Path | Ukuran (Bytes) | Ukuran (KB) | Kategori & Status |
|---|---:|---:|---|
| `assets/ASSET-MANIFEST.json` | 2175 | 2.1 KB | Tetap (Aset non-langit) |
| `assets/book/book-bookmark.svg` | 450 | 0.4 KB | Aset visual buku timeline SVG |
| `assets/book/book-cover.svg` | 1521 | 1.5 KB | Aset visual buku timeline SVG |
| `assets/book/book-edge.svg` | 514 | 0.5 KB | Aset visual buku timeline SVG |
| `assets/book/book-ornament.svg` | 901 | 0.9 KB | Aset visual buku timeline SVG |
| `assets/book/book-page.svg` | 741 | 0.7 KB | Aset visual buku timeline SVG |
| `assets/book/book-spine.svg` | 552 | 0.5 KB | Aset visual buku timeline SVG |
| `assets/book/README.txt` | 283 | 0.3 KB | Aset visual buku timeline SVG |
| `assets/brand/bawah.png` | 29795 | 29.1 KB | Aset brand logo (diproses di Tahap 0) |
| `assets/brand/kelopak kanan.png` | 310480 | 303.2 KB | Aset brand logo (diproses di Tahap 0) |
| `assets/brand/kelopak kiri.png` | 230738 | 225.3 KB | Aset brand logo (diproses di Tahap 0) |
| `assets/brand/kelopak tengah.png` | 166541 | 162.6 KB | Aset brand logo (diproses di Tahap 0) |
| `assets/brand/panah.png` | 124223 | 121.3 KB | Aset brand logo (diproses di Tahap 0) |
| `assets/brand/pondasi.png` | 108033 | 105.5 KB | Aset brand logo (diproses di Tahap 0) |
| `assets/cinematic/01_cinematic_winner_portal.png` | 727134 | 710.1 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/cinematic/02_ornamental_house_wreath_hd.webp` | 1118710 | 1092.5 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/cinematic/02_ornamental_house_wreath.png` | 246022 | 240.3 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/cinematic/02_ornamental_pagoda_frame_hd.webp` | 501974 | 490.2 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/cinematic/03_golden_laurel_crown.png` | 174848 | 170.8 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/cinematic/04_cloud_cluster_left.png` | 93161 | 91.0 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/cinematic/05_three_level_winner_podium.png` | 135821 | 132.6 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/cinematic/06_navy_gold_title_plaque.png` | 93719 | 91.5 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/cinematic/07_red_gold_reveal_banner.png` | 67995 | 66.4 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/cinematic/08_cream_gold_info_plaque.png` | 73248 | 71.5 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/cinematic/09_golden_light_beam.png` | 64117 | 62.6 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/cinematic/10_golden_sparkles_and_glow.png` | 47392 | 46.3 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/cinematic/11_golden_orbit_ribbon.png` | 183963 | 179.7 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/cinematic/12_royal_red_curtain.png` | 137652 | 134.4 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/cinematic/13_four_point_star.png` | 33146 | 32.4 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/cinematic/14_cloud_cluster_right.png` | 89091 | 87.0 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/cinematic/15_golden_glitter_strand.png` | 69399 | 67.8 KB | Aset panggung cinematic pengumuman (evaluasi tahap berikutnya) |
| `assets/images/asset-01.png` | 222911 | 217.7 KB | Karakter maskot & logo dasar |
| `assets/images/asset-02.png` | 219776 | 214.6 KB | Karakter maskot & logo dasar |
| `assets/images/asset-03.png` | 211501 | 206.5 KB | Karakter maskot & logo dasar |
| `assets/images/asset-04.png` | 278564 | 272.0 KB | Karakter maskot & logo dasar |
| `assets/images/asset-05.png` | 252108 | 246.2 KB | Karakter maskot & logo dasar |
| `assets/images/asset-06.png` | 269545 | 263.2 KB | Karakter maskot & logo dasar |
| `assets/images/asset-07.png` | 233373 | 227.9 KB | Karakter maskot & logo dasar |
| `assets/images/asset-08.png` | 222398 | 217.2 KB | Karakter maskot & logo dasar |
| `assets/images/asset-09.png` | 211088 | 206.1 KB | Karakter maskot & logo dasar |
| `assets/images/asset-10.png` | 303515 | 296.4 KB | Karakter maskot & logo dasar |
| `assets/images/asset-11.png` | 298860 | 291.9 KB | Karakter maskot & logo dasar |
| `assets/images/asset-12.png` | 367187 | 358.6 KB | Karakter maskot & logo dasar |
| `assets/images/asset-13.png` | 522486 | 510.2 KB | Karakter maskot & logo dasar |
| `assets/images/asset-14.png` | 537276 | 524.7 KB | Karakter maskot & logo dasar |
| `assets/images/asset-15.png` | 128667 | 125.7 KB | Karakter maskot & logo dasar |
| `assets/images/asset-16.webp` | 320902 | 313.4 KB | Karakter maskot & logo dasar |
| `assets/images/asset-17.webp` | 105856 | 103.4 KB | Karakter maskot & logo dasar |
| `assets/images/asset-18.svg` | 1213 | 1.2 KB | Karakter maskot & logo dasar |
| `assets/images/asset-19.svg` | 422 | 0.4 KB | Karakter maskot & logo dasar |
| `assets/images/asset-20.svg` | 613 | 0.6 KB | Karakter maskot & logo dasar |
| `assets/images/asset-21.svg` | 435 | 0.4 KB | Karakter maskot & logo dasar |
| `assets/images/asset-22.svg` | 1294 | 1.3 KB | Karakter maskot & logo dasar |
| `assets/images/asset-23.svg` | 494 | 0.5 KB | Karakter maskot & logo dasar |
| `assets/images/asset-24.svg` | 725 | 0.7 KB | Karakter maskot & logo dasar |
| `assets/sky/cloud-a.webp` | 20386 | 19.9 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/cloud-b.webp` | 14876 | 14.5 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/cloud-c.webp` | 10870 | 10.6 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/cloud-d.webp` | 7470 | 7.3 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/cloud-e.webp` | 4876 | 4.8 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/cloud-f.webp` | 5436 | 5.3 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/cloud-g.webp` | 2378 | 2.3 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/cloud-h.webp` | 3830 | 3.7 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/cloud-i.webp` | 12286 | 12.0 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/cloud-j.webp` | 15896 | 15.5 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/glow-1.webp` | 1610 | 1.6 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/glow-2.webp` | 1010 | 1.0 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/glow-3.webp` | 2244 | 2.2 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/glow-4.webp` | 2856 | 2.8 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/glow-5.webp` | 5598 | 5.5 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/ribbon-a.webp` | 13738 | 13.4 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/ribbon-b.webp` | 24412 | 23.8 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/ribbon-c.webp` | 17658 | 17.2 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/ring-blue.webp` | 10720 | 10.5 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/ring-gold.webp` | 15020 | 14.7 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/sky-bg.webp` | 97456 | 95.2 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/sp-1.webp` | 1366 | 1.3 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/sp-2.webp` | 1366 | 1.3 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/sp-3.webp` | 2358 | 2.3 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/sp-4.webp` | 1148 | 1.1 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/sp-5.webp` | 1020 | 1.0 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/sp-6.webp` | 3358 | 3.3 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/sp-blue.webp` | 7110 | 6.9 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/sp-cluster.webp` | 10576 | 10.3 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/star-cl.webp` | 9514 | 9.3 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/star-l.webp` | 5922 | 5.8 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/star-m.webp` | 3882 | 3.8 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/star-n.webp` | 3206 | 3.1 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/star-o.webp` | 3718 | 3.6 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/star-p.webp` | 4342 | 4.2 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/star-q.webp` | 3476 | 3.4 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/star-s1.webp` | 2006 | 2.0 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/star-s2.webp` | 2328 | 2.3 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/star-s3.webp` | 1830 | 1.8 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |
| `assets/sky/sun.webp` | 15310 | 15.0 KB | ⚠️ **Akan diganti** (Tema langit: awan, matahari, bintang, ring, glow, sparkle) |


---

## 3. DAFTAR EMOJI YANG DIGUNAKAN SEBAGAI IKON

Ditemukan emoji yang saat ini digunakan sebagai ikon antarmuka di HTML maupun JavaScript. Berdasarkan aturan desain, emoji-emoji ini dilarang digunakan di tampilan akhir dan akan diganti secara bertahap dengan ikon SVG mandiri bertema motif kerajaan / logo (kelopak, panah, gelombang).

| Emoji | Sumber Muncul | Rencana Pengganti |
|:---:|---|---|
| ☎ | `js/cms.js, js/gate.js` | SVG monokrom / ornamen motif logo |
| ☝ | `index.html, js/cms.js` | SVG monokrom / ornamen motif logo |
| ⚖ | `js/app.js, js/cms.js` | SVG monokrom / ornamen motif logo |
| ⚙ | `js/app.js` | SVG monokrom / ornamen motif logo |
| ⚠ | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 🇩 | `js/app.js` | SVG monokrom / ornamen motif logo |
| 🇮 | `js/app.js` | SVG monokrom / ornamen motif logo |
| ✅ | `js/app.js, js/auth.js, js/cms.js, js/gate.js, js/konfirmasi.js, js/reveal.js` | SVG monokrom / ornamen motif logo |
| ✈ | `js/app.js, js/cms.js` | SVG monokrom / ornamen motif logo |
| ✍ | `js/app.js` | SVG monokrom / ornamen motif logo |
| ✓ | `js/app.js, js/cms.js` | SVG monokrom / ornamen motif logo |
| ✕ | `js/app.js, js/cms.js, js/hasil.js, js/reveal.js` | SVG monokrom / ornamen motif logo |
| ✦ | `index.html` | SVG monokrom / ornamen motif logo |
| ✨ | `index.html, js/app.js` | SVG monokrom / ornamen motif logo |
| ❌ | `js/app.js, js/cms.js` | SVG monokrom / ornamen motif logo |
| ❓ | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 🌐 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 🎓 | `js/app.js` | SVG monokrom / ornamen motif logo |
| 🎨 | `index.html, js/app.js, js/cms.js` | SVG monokrom / ornamen motif logo |
| 🏁 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 🏅 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 🏆 | `index.html, js/app.js, js/cms.js, js/hasil.js, js/reveal.js` | SVG monokrom / ornamen motif logo |
| 🏛 | `index.html, js/cms.js` | SVG monokrom / ornamen motif logo |
| 🏠 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 👋 | `index.html, js/app.js, js/auth.js` | SVG monokrom / ornamen motif logo |
| 👤 | `js/cms.js, js/konfirmasi.js` | SVG monokrom / ornamen motif logo |
| 👩 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 💪 | `js/app.js` | SVG monokrom / ornamen motif logo |
| 💬 | `index.html, js/app.js, js/cms.js, js/gate.js` | SVG monokrom / ornamen motif logo |
| 💾 | `js/cms.js, js/konfirmasi.js` | SVG monokrom / ornamen motif logo |
| 📄 | `js/app.js, js/cms.js, js/konfirmasi.js` | SVG monokrom / ornamen motif logo |
| 📅 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 📊 | `index.html, js/app.js` | SVG monokrom / ornamen motif logo |
| 📋 | `index.html, js/app.js, js/gate.js` | SVG monokrom / ornamen motif logo |
| 📌 | `js/cms.js, js/gate.js` | SVG monokrom / ornamen motif logo |
| 📎 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 📑 | `index.html, js/app.js` | SVG monokrom / ornamen motif logo |
| 📚 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 📝 | `index.html, js/app.js, js/cms.js, js/gate.js` | SVG monokrom / ornamen motif logo |
| 📞 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 📤 | `index.html, js/app.js, js/cms.js` | SVG monokrom / ornamen motif logo |
| 📭 | `js/app.js, js/konfirmasi.js` | SVG monokrom / ornamen motif logo |
| 📰 | `js/app.js` | SVG monokrom / ornamen motif logo |
| 📸 | `index.html, js/app.js` | SVG monokrom / ornamen motif logo |
| 🔁 | `js/app.js` | SVG monokrom / ornamen motif logo |
| 🔄 | `index.html, js/konfirmasi.js` | SVG monokrom / ornamen motif logo |
| 🔌 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 🔒 | `index.html, js/auth.js, js/konfirmasi.js` | SVG monokrom / ornamen motif logo |
| 🔓 | `index.html, js/gate.js` | SVG monokrom / ornamen motif logo |
| 🔔 | `js/app.js` | SVG monokrom / ornamen motif logo |
| 🔗 | `js/app.js, js/cms.js` | SVG monokrom / ornamen motif logo |
| 🔥 | `js/app.js` | SVG monokrom / ornamen motif logo |
| 🖼 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 🗂 | `js/app.js` | SVG monokrom / ornamen motif logo |
| 🤝 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 🥇 | `js/app.js` | SVG monokrom / ornamen motif logo |
| 🥈 | `js/app.js` | SVG monokrom / ornamen motif logo |
| 🥉 | `js/app.js` | SVG monokrom / ornamen motif logo |
| 🧠 | `index.html, js/app.js, js/cms.js` | SVG monokrom / ornamen motif logo |
| 🚀 | `js/cms.js` | SVG monokrom / ornamen motif logo |
| 🚪 | `js/konfirmasi.js` | SVG monokrom / ornamen motif logo |
| 🛠 | `js/app.js, js/cms.js` | SVG monokrom / ornamen motif logo |


---

## 4. STRUKTUR HALAMAN (PAGE & SECTION HIERARCHY)

Sistem antarmuka menggunakan arsitektur **Single Page Application (SPA)** hibrida dengan satu `<main id="app">` yang mengendalikan halaman aktif melalui kelas `.page.active` dan didukung oleh Dock navigasi bawah tetap (`#dock`).

### A. Komponen Global / Pembungkus Luar (Level Atas)
1. `#bar`: Progress bar scroll atas
2. `a.skip`: Tombol aksesibilitas "Lewati ke konten" (`href="#hero"`)
3. `<header class="top">`: Bilah navigasi atas (Brand `PRPN × ENCHANTAX`, link `#berita`, `#info`, `#faq`, tombol `#bv` Verifikasi, tombol `#bx` 🔒 Panitia)
4. `#ban`: Bilah banner pengumuman darurat / running banner
5. `#mod`: Modal dialog umum (`#mb`)
6. `#toast`: Notifikasi melayang toast
7. `#cf`: Canvas efek kembang api / konfeti
8. `#dots`: Navigasi indikator titik section

---

### B. Hero Section (Panggung Pembuka)
- **ID**: `#hero` (`class="in"`)
- **Sub-elemen**:
  - `.sky`: Lapisan animasi langit (awan-awan, pita ribbon, cincin ring, matahari, bintang, partikel glow) — *(Target penggantian tema)*
  - `.hero-in`: Judul selamat datang (`.wel`), Judul utama (`.ttl`), Subjudul tema (`.sub`), Tombol logo bulat berkilau (`#lg`), Petunjuk klik logo (`#hint`)
  - Maskot hero: Maskot pria (`.m.hm.l`, `data-k="b1"`), Maskot wanita (`.m.hm.r`, `data-k="g1"`)
  - Gelembung sapaan: `.greet.gl` ("Halo! Selamat datang 👋"), `.greet.gr` ("Yuk, ikut serunya! ✨")

---

### C. Kontainer Utama: `<main id="app">`

#### 1. Halaman Portal (`#pg-portal` — `class="page active"`)
Urutan section di dalam halaman utama:
1. **Section Tentang**: `#about`
   - Tag: `TENTANG`
   - Judul: `Apa itu PRPN x Enchantax?`
   - Kontainer 3 kartu: `#abx` (kartu berbalik PRPN, Enchantax 2.0, Cabang Lomba)
   - Fallback legacy: `#about-legacy` (`#tabs`, `#pane`, `#am`)
2. **Section Jadwal & Timeline**: `#jadwal`
   - Tag: `JADWAL`
   - Judul: `Timeline Lomba`
   - Pemilih cabang timeline: `#timelineBranches` (LCC `data-tl="lcc"`, Creative Competition `data-tl="infografis"`, Call for Paper `data-tl="esai"`)
   - Jalur maskot berlari: `#nodes`, `#lf`, `#run`
   - Buku interaktif timeline: `#timelineBook` (`#bookShell`, `#det`, flip countdown `#cdT`, `#cdd`, `#cdh`, `#cdm`, `#cds`)
3. **Section Berita**: `#berita`
   - Tag: `BERITA`
   - Judul: `Kabar Terbaru`
   - Chip filter kategori berita: `#nchips`
   - Kartu berita unggulan: `#feat`
   - Daftar kartu berita: `#nlist`
4. **Section Informasi Lomba**: `#info`
   - Tag: `INFORMASI`
   - Judul: `Detail & Ketentuan Lomba`
   - Tab navigasi info: `#itabs` (Persyaratan `req`, Kriteria Penilaian `crit`, Dewan Juri `judges`, Sponsor `spons`)
   - Panel isi: `#ipane`, `#judges`, `#spons`

#### 2. Halaman Pendaftaran (`#pg-daftar` — `class="page"`)
1. **Section Pendaftaran**: `#reg`
   - Tag: `PENDAFTARAN`
   - Judul: `Pilih Cabang Lombamu`
   - Kartu-kartu cabang lomba dengan deskripsi, biaya, dan tombol pendaftaran langsung.

#### 3. Halaman Pengumpulan Karya (`#pg-kumpul` — `class="page"`)
1. **Section Pengumpulan**: `#kumpul`
   - Tag: `PENGUMPULAN`
   - Judul: `Unggah Karya Lomba`
   - Kontainer status verifikasi tim (`#subs`), formulir unggah berkas, dan ketentuan orisinalitas.

#### 4. Halaman Pengumuman Juara (`#pg-umum` — `class="page"`)
1. **Section Pengumuman Juara**: `#juara`
   - Tag: `PENGUMUMAN`
   - Judul: `Panggung Juara PRPN x Enchantax 2026`
   - Kartu preview juara dan tombol pemicu hasil lengkap (`#grAll`).

---

### D. Section Bersama (Tampil di Bagian Bawah Seluruh Halaman): `#shared`
1. **Section FAQ**: `#faq`
   - Tag: `FAQ`
   - Judul: `Pertanyaan Umum`
   - Akordion tanya jawab: `#faqs`
2. **Section Kontak / Narahubung**: `#kontak`
   - Tag: `NARAHUBUNG`
   - Judul: `Ada Pertanyaan? Hubungi Kami!`
   - Daftar kontak: Instagram, WhatsApp 1, WhatsApp 2
3. **Bagian Penutup & Footer**:
   - Maskot penutup: `.fin` (`data-c="335,5,110,160"`, `data-c="330,180,115,160"`)
   - Teks hak cipta: `<footer>© 2026 PRPN x Enchantax · Sampai jumpa di lomba!</footer>`

---

### E. Overlay Khusus & Navigasi Dock
1. **Intro Cinematic Loader**: `#ld`
   - Komponen jam mistis SVG (`#ldc`, `#lds`, `#unit`, `#Rwr`, `#Rring`, `#Rmed`)
   - Tombol lewati: `#ldk` ("Lewati intro ›")
2. **Bilah Navigasi Mengambang (Dock)**: `#dock`
   - Kelompok kiri: Tombol Portal (`data-p="portal"`), Tombol Pendaftaran (`data-p="daftar"`)
   - Tombol tengah atas: Logo portal kembali ke atas (`#dkl`, `.lcore`, `.lgold`)
   - Kelompok kanan: Tombol Pengumpulan (`data-p="kumpul"`), Tombol Pengumuman (`data-p="umum"`)
3. **Panggung Reveal Sinematik**: `#rev`
   - Kontainer canvas dinamis untuk animasi reveal juara layar penuh.
