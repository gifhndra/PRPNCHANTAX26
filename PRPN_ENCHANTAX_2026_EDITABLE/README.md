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
| 🏠 Umum | nama header, judul, tagline, footer, kartu "Tentang" (tambah/hapus tab) |
| 📅 Timeline | tambah/hapus/urut tahap, tanggal mulai & akhir, deskripsi, persyaratan tahap, tombol tujuan, tahap pengumpulan karya |
| 🏁 Cabang | tambah/hapus cabang, nama, ikon, deskripsi, tampil/sembunyikan, tautan formulir daftar & kumpul |
| 📎 Dokumen & Syarat | dokumen/persyaratan pendaftaran (tambah/kurangi) + tautan file |
| ⚖️ Penilaian | indikator & bobot per cabang (menampilkan total bobot) |
| 👩‍⚖️ Dewan Juri | nama, jabatan, institusi, pengalaman, **foto** (unggah atau URL) |
| 🤝 Mitra | kelompok (Sponsor/Media Partner/dst.), nama, **logo**, tautan |
| ❓ FAQ | pertanyaan & jawaban |
| ☎️ Narahubung | kartu kontak; isi nomor WA (08…/62…) atau @instagram → otomatis jadi tautan |
| 📚 Materi | materi pendukung + tautan file; tampil sebagai kartu yang langsung terlihat semua |
| 🔗 Tautan | Handbook, Twibbon, Poster |
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
