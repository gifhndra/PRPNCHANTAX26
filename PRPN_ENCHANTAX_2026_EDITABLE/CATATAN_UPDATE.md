# Update: bingkai pagoda emas menggantikan lingkar terluar (loading animation)
Timpa ke folder proyek (struktur sama):
- index.html : tambah glow emas (radialGradient #gw + circle #wrGlow) di SVG loader
- js/app.js : wreath lama diganti bingkai pagoda baru, penyejajaran, rotasi halus, glow & kilau
- assets/cinematic/02_ornamental_pagoda_frame_hd.webp : bingkai baru (checkerboard bawaan PNG sudah dibersihkan)
Logo tengah, ring rumah, medali, bintang & timeline tidak diubah.
Penyesuaian cepat di js/app.js: FS=1.18 (ukuran bingkai), RK=.9 (kerapatan ring rumah ke medali: kecilkan angka = lebih rapat, naikkan = lebih longgar).
- Celah ring rumah nusantara ↔ medali dihilangkan (RK=.9 di js/app.js); bingkai pagoda disesuaikan.

# Update: dashboard konfirmasi pindah ke tab Tally
- apps-script/Code.gs (VERSION 7): sumber data = tab "Cerdas Cermat" (LCC), "Call for Paper" (CFP), "Creative" (Infografis). Tab Google Form lama (lcc, cfp, infografis, karya) tidak dibaca lagi dan boleh dihapus.
- js/gate.js: cek versi script menjadi >= 7.
- js/konfirmasi.js: kolom "Submitted at" (Tally) dikenali sebagai waktu daftar; teks sumber data diperbarui.
