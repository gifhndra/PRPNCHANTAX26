# Catatan perubahan — Cinematic Grand Reveal

Zip ini HANYA berisi file yang berubah/baru. Ekstrak lalu timpa ke folder PRPN_ENCHANTAX_2026_EDITABLE
(css/style.css, loader, dan aset lama TIDAK diubah).

## File
| File | Status | Isi |
|---|---|---|
| index.html | diganti | section #juara memakai wadah #crx-home; memuat css/reveal.css & js/reveal.js |
| js/app.js | diganti | papers 3D + Grand Reveal lama dibuang, diganti PRPNReveal.init(...); kategori LCC ditambahkan ke WIN & LB |
| js/reveal.js | BARU | Scene 1-5 (AnnouncementIntro, MysteryReveal, GrandReveal, WinnerCategory/WinnerCard/WinnerPodium, AnnouncementClosing) |
| css/reveal.css | BARU | seluruh styling reveal |
| assets/cinematic/*.png | BARU (15 file) | aset dekoratif, sudah dibersihkan dari sisa potongan sprite |

## Loading animation
Tidak diubah. Kode yang ada sudah memenuhi spesifikasi: logo digambar -> bintang terpasang -> medal
searah jarum jam 20 dtk/putaran, house ring berlawanan 30 dtk/putaran, wrapper transform terpisah.

## Mengisi data juara
Panel Panitia -> tab Podium (sekarang ada tab LCC). Centang "Hasil sudah disahkan".
Nama placeholder ("Nama Juara 1", dst.) tidak pernah ditampilkan di reveal.


# Catatan perubahan — Dashboard Konten Web
- index.html: bagian #materi diganti wadah #deal (tanpa tumpukan kartu); memuat css/cms.css & js/cms.js
- js/app.js: data bawaan baru (gen, branches, contacts, materi, links), SUBEV() menggantikan EV[1],
  stack kartu lama dihapus, tab admin "Konten Web", pemuatan data/content.json
- js/cms.js (BARU), css/cms.css (BARU), data/content.json (BARU)

# Catatan perubahan — Dashboard Konfirmasi Pendaftar
- Dihapus: tab panitia "Pendaftaran" dan "Karya" (beserta import CSV, template, riwayat, dan semua kodenya di js/app.js)
- Baru: tab "Konfirmasi Pendaftar" -> js/konfirmasi.js, css/konfirmasi.css
- Baru: apps-script/Code.gs (backend Google Sheet; tempel ke Apps Script lalu deploy versi baru)

# Catatan perubahan — Gerbang Pengumpulan Karya
- index.html: kartu "Hanya tim yang sudah terdaftar..." diganti form email ketua + nama tim (#gate)
- js/gate.js (BARU): cek ke Apps Script (aksi "check"); kartu cabang terbuka hanya untuk tim berstatus Verified
- js/cms.js: kartu pengumpulan diberi data-bid / data-bn
- apps-script/Code.gs: tambah aksi publik "check" (tempel ulang + deploy versi baru)

# Perbaikan — pendaftar tidak muncul di dashboard
- Code.gs: baca tab "Form_Responses" (atau tab mirip "Form Responses"), bukan sekadar tab pertama; respons memuat nama tab
- konfirmasi.js: data selalu dimuat ulang tiap tab dibuka; menampilkan "Sumber data: tab ..."

# Perubahan — hanya tab lcc, cfp, infografis
- Code.gs: membaca HANYA tab lcc / cfp / infografis (tab lain diabaikan); jenis lomba = nama tab; log mencatat tab
- konfirmasi.js: filter "Semua Lomba" = LCC / Call for Paper / Infografis; simpan ke tab & baris yang tepat
- gate.js: kartu yang terbuka mengikuti tab tempat tim terdaftar

# Perbaikan — gerbang tidak menemukan tim
- Code.gs: kolom "Nama Tim" salah terbaca sebagai "Timestamp"; diperbaiki. Ditambah penanda VERSION=5
- gate.js: bila script di server bukan versi 5, tampil pesan jelas (bukan "tidak ditemukan")
