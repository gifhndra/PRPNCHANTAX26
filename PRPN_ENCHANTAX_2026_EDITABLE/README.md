# PRPN x ENCHANTAX 2026 — Editable Website

## Struktur folder
- `index.html` — struktur halaman dan konten HTML.
- `css/style.css` — seluruh styling, warna, layout, animasi, dan responsive rules.
- `js/app.js` — interaksi, konfigurasi, data, dan logika website.
- `assets/images/` — gambar yang sebelumnya tertanam (base64) di dalam HTML/JavaScript.
- `assets/vectors/` — tempat menyimpan aset SVG tambahan yang ingin dikelola terpisah.

## Cara membuka di VS Code
1. Ekstrak ZIP ini ke satu folder.
2. Buka VS Code → **File → Open Folder** → pilih folder `PRPN_ENCHANTAX_2026_EDITABLE`.
3. Buka `index.html`.
4. Jalankan dengan ekstensi **Live Server** (klik kanan `index.html` → Open with Live Server).

## Bagian yang biasa diedit
- Ubah teks/urutan bagian halaman: `index.html`.
- Ubah warna, font, ukuran, jarak, tampilan mobile, dan animasi: `css/style.css`.
- Ubah tautan pendaftaran, handbook, twibbon, poster, kontak, dan perilaku tombol: cari bagian `const LINKS` di `js/app.js`.
- Ubah data konten dan pengaturan portal: cari konstanta/data di `js/app.js`.
- Gambar maskot/logo yang sudah diekstrak: `assets/images/`.

## Catatan
- Semua aset gambar tertanam yang ditemukan telah diekstrak dan referensinya di JavaScript diubah menjadi path relatif.
- QR Code library dan Google Fonts masih dimuat dari CDN/internet, jadi fitur terkait memerlukan koneksi internet.
- Jangan memindahkan `index.html`, folder `css`, `js`, atau `assets` secara terpisah; pertahankan struktur folder agar path tetap valid.
- File sumber asli tidak diubah.


## Dashboard Panitia: Konten Web (BARU)
Buka website → tombol **🔒 Panitia** → masuk dengan kata sandi → tab **🛠️ Konten Web**.
Semua bagian publik kini diatur dari sini tanpa mengedit kode:

| Sub-tab | Yang bisa diatur |
|---|---|
| 🏠 Umum | nama header, judul, tagline, footer, dan kotak "Tentang" (logo + judul; klik untuk membuka deskripsi & label — tambah/hapus/urutkan/sembunyikan, ganti logo) |
| 📅 Timeline | tambah/hapus/urut tahap, tanggal mulai & akhir, deskripsi, persyaratan tahap, tombol tujuan, tahap pengumpulan karya |
| 🏁 Cabang | tambah/hapus cabang, nama, ikon, deskripsi, tampil/sembunyikan, tautan formulir daftar & kumpul |
| 📎 Dokumen & Syarat | dokumen/persyaratan pendaftaran (tambah/kurangi) + tautan file |
| ⚖️ Penilaian | indikator & bobot per cabang (menampilkan total bobot) |
| 👩‍⚖️ Dewan Juri | nama, jabatan, institusi, pengalaman, **foto** (unggah atau URL) |
| 🤝 Mitra | kelompok (Sponsor/Media Partner/dst.), nama, **logo**, tautan |
| ❓ FAQ | pertanyaan & jawaban |
| ☎️ Narahubung | kartu kontak; isi nomor WA (08…/62…) atau @instagram → otomatis jadi tautan |
| 📚 Materi | materi pendukung + tautan file; tampil sebagai kartu yang langsung terlihat semua |
| 🔗 Akses Cepat | kartu Handbook/Twibbon/Poster dst. (logo + judul; klik buka, klik lagi tutup): tambah/hapus/urutkan, logo, judul, deskripsi, label & tautan tombol |
| 💾 Cadangan | unduh / impor `content.json`, reset perubahan lokal |

### Cara data tersimpan
1. **Database aktif** (saat di-host di Claude/artifact): perubahan langsung tampil untuk semua pengunjung.
2. **Tanpa database** (VS Code / hosting biasa): perubahan tersimpan di browser panitia. Untuk menerbitkan:
   tab **💾 Cadangan → Unduh content.json**, simpan ke `data/content.json`, lalu unggah ulang situs.
   (File ini tidak memuat kata sandi panitia.) `data/content.json` kosong `{}` = pakai isi bawaan.
3. Foto juri/logo diperkecil otomatis dan disimpan di dalam data (tidak butuh server file).

## File baru
- `js/cms.js` — renderer dinamis + editor Konten Web
- `css/cms.css` — gaya editor + animasi kartu materi
- `data/content.json` — konten terbit (opsional)


## Tayang langsung di domain sendiri (tanpa unduh content.json)
Konten Web disimpan ke tab **WebsiteContent** di Google Sheet lewat Apps Script yang sama dengan dashboard konfirmasi.
1. Tempel `apps-script/Code.gs` terbaru (versi 6) ke Apps Script, ganti `SECRET`, lalu **Deploy > Manage deployments > Edit > New version > Deploy** (URL /exec tetap).
2. Di website: Panitia > Konten Web > **💾 Cadangan** > isi kunci (sama dengan SECRET) > **Simpan kunci & uji koneksi**.
3. Klik **🚀 Terbitkan semua konten sekarang** sekali untuk mengirim isi yang ada. Setelah itu tiap **Simpan & terapkan** langsung tayang untuk semua pengunjung.
Pengunjung membaca konten publik dari Sheet; hanya yang memegang kunci yang bisa menulis. Hash kata sandi panitia tidak ikut dikirim. `data/content.json` tetap bisa dipakai sebagai cadangan.


## Logo ikon pengganti emoji (BARU)
Emoji ikon kini bisa diganti logo unggahan dari **Panitia → Konten Web** (kolom *Logo ikon*: unggah / tempel URL / Hapus). Kosong = emoji bawaan tetap dipakai.
| Bagian | Menu dashboard |
|---|---|
| Titik timeline + judul detail tahap | 📅 Timeline |
| Kartu "Pilih Cabang Lombamu" + kartu pengumpulan | 🏁 Cabang |
| Kartu Narahubung | ☎️ Narahubung |
| Kartu Materi Pendukung | 📚 Materi |
| Menu bawah (Portal / Pendaftaran / Pengumpulan / Pengumuman) | 🏠 Umum → "Ikon menu navigasi bawah" |
Gambar diperkecil otomatis (maks 256 px). Disarankan PNG/WebP/SVG transparan, rasio persegi.
File yang berubah: `js/app.js` (helper `ico()`), `js/cms.js`, `css/cms.css`.
