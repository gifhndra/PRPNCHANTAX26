1. Rencana Redesain Tahap 1: Halaman Pembuka (#hero) & Intro Maskot (Infinitax 2026).
2. Pindahkan aset langit (#hero sky) yang tidak dipakai ke _archive/sky/, bersihkan markup langit.
3. Buat sprite SVG monokrom (motif kelopak, panah, gelombang) di assets/icons/icons.svg untuk dock & hero.
4. Perbarui ikon #dock dengan sprite SVG baru tanpa mengubah data-p dan handler navigasi.
5. Bangun struktur 5 adegan di dalam #hero dengan state machine JS murni (CSS transform/opacity).
6. Adegan 1: Latar marun-hitam, tirai merah & bingkai emas, rakitan 6 potongan logo WebP (<=2.5s), judul & maskot.
7. Adegan 2: Transisi turun/fade logo, jalan hutan siluet marun & pohon daun merah (maks 4 layer SVG parallax).
8. Adegan 3: Dialog maskot bergantian (5 teks) memakai gelembung amplop kerajaan & placeholder nama.
9. Adegan 4: Dua kartu poster sayembara (PRPN & Enchantax) berbingkai emas + 3 panel slide statis.
10. Adegan 5: Gagak siluet mengantar gulungan titah undangan + tombol emas "Masuk ke kerajaan".
11. Pasang tombol "Lewati intro" (#ldk) tetap terlihat di setiap adegan, memicu openSite() ke Portal.
12. Hubungkan tombol "Masuk ke kerajaan" dan klik logo ke fungsi openSite() lama (mempertahankan alur BEKU).
13. Terapkan responsivitas mobile-first 390px, fix landscape phone (<520px), dan prefers-reduced-motion.
14. Verifikasi browser (Puppeteer): konsol 0 error, flow klik adegan 1-5, skip intro, dan fungsi portal utuh.
15. Ambil tangkapan layar 390px dan 1440px tiap adegan, susun laporan akhir komprehensif.
