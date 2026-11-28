# ATURAN DESAIN (DESIGN RULES) — PRPN × ENCHANTAX 2026 (INFINITAX)

> **PANDUAN MUTLAK:** Dokumen ini wajib dibaca ulang dan ditaati pada **setiap tahap redesain berikutnya**. Setiap penambahan komponen, tata letak, aset visual, dan tipografi harus mengacu pada pedoman di bawah ini tanpa pengecualian.

---

## 1. ARAH VISUAL UTAMA: UNDANGAN KERAJAAN VINTAGE (VINTAGE ROYAL INVITATION)

Konsep visual beralih dari estetika kartun langit cerah (awan/matahari/biru muda) menuju kemewahan **undangan kerajaan dongeng klasik (*royal fantasy invitation*)**:

- **Nuansa Latar**: Latar gelap marun-hitam yang dalam dan tenang (\`#14080a\`), berpadu dengan tekstur kertas perkamen/naskah kuno (\`#f7f1e6\`) dan aksen batu/marmer halus.
- **Aksen Kemewahan**: Garis bingkai emas tipis presisi (*gold leaf hairline borders*), tirai beludru merah bergradasi marun, pilar aristokratis, dan ornamen amplop bersegel lilin (*wax seal*).
- **Filosofi Mewah**: Kemewahan lahir dari **ketenangan, proporsi ruang kosong (*negative space*), dan detail mikro yang presisi**, bukan dari banyaknya efek visual, kilau berlebihan, atau animasi yang melelahkan mata.

---

## 2. DAFTAR LARANGAN KERAS (ZERO TOLERANCE)

Dilarang keras menerapkan elemen-elemen berikut dalam kode CSS, HTML, maupun aset visual:

1. 🚫 **Gradasi Ungu-Biru, Glow Neon, dan Glassmorphism Generik**
   - Tidak boleh menggunakan latar belakang gradasi ungu-ke-biru neon ala template Web3 / AI generik.
   - Tidak boleh menggunakan efek *frosted glass* / *glassmorphism* tebal (\`backdrop-filter: blur(20px)\`) yang klise dan berat.
2. 🚫 **Emoji sebagai Ikon UI**
   - Dilarang menempatkan emoji (seperti 🧠, 🎨, 📝, 🏆, 🔒, 💬) sebagai ikon resmi di dalam tombol, tab, judul, atau badge.
   - Semua ikon wajib menggunakan **SVG buatan sendiri yang bersumber dari motif logo resmi**: kelopak mahkota, ujung panah kembar, lengkungan bawah, atau gelombang segel.
3. 🚫 **Pemisah Dekoratif "✦✦✦" dan Hiasan Acak Tanpa Fungsi**
   - Hapus semua pemisah bintang empat titik acak (\`✦✦✦\`) atau partikel glitter yang tidak memiliki fungsi struktural.
   - Dekorasi harus fungsional dan terstruktur: berupa bingkai sudut ornamen (*corner filigree*), garis pembatas emas tipis, atau segel penutup.
4. 🚫 **Font Default / Generik (Inter, Roboto, Arial, System Default)**
   - Dilarang menggunakan font standar startup modern seperti Inter, Roboto, Helvetica, Arial, atau sans-serif generik.
   - **Font Resmi**:
     - Judul & Elemen Kerajaan: **Cormorant Garamond** (serif aristokratis).
     - Teks Tubuh, Keterangan, & Kontrol UI: **Hanken Grotesk** (grotesk hangat, elegan, dan sangat mudah dibaca).
5. 🚫 **Tiga Kartu Sama Besar yang Simetris di Setiap Section**
   - Hindari layout monoton berupa 3 kartu kotak berjejer simetris yang membosankan di setiap bagian halaman.
   - Gunakan hierarki asimetris, kartu vertikal bertingkat, format lembaran buku/surat titah, atau ornamen berfokus pada satu sorotan utama.
6. 🚫 **Copywriting Generik Berbahasa Asing Klise**
   - Dilarang menggunakan slogan klise seperti *"Unleash"*, *"Elevate"*, *"Revolutionize"*, *"Next-gen Experience"*.
   - Gunakan narasi berwibawa, anggun, santun, dan memikat yang mencerminkan prestise Pekan Raya Perpajakan Nasional dan inovasi masa depan.
7. 🚫 **Bayangan Tebal Kasar dan Sudut Membulat Besar (*Oversized Border-Radius*)**
   - Tidak ada sudut membulat balon (\`border-radius: 24px\` atau \`32px\` pada kartu konten).
   - Gunakan radius tegas dan halus (\`0px\` s.d. \`10px\`) menyerupai kartu pos tebal, sertifikat, atau amplop kerajaan.
   - Bayangan harus lembut dengan nada gelap marun, bukan bayangan hitam tebal kotor (\`rgba(0,0,0,0.8)\`).
8. 🚫 **Hitam Murni (#000000) dan Putih Murni (#ffffff)**
   - Wajib menggunakan token `--color-bg-base` (\`#14080a\`) untuk latar tergelap dan `--color-paper-cream` (\`#f7f1e6\`) atau `--color-text-primary` (\`#f5eedf\`) untuk elemen terang.

---

## 3. BATASAN TEKNIS & STANDAR PERFORMA

Setiap kode visual baru harus mematuhi batasan teknis berikut untuk menjamin kelancaran pada perangkat seluler kelas menengah (target dasar: lebar layar **390px**):

1. **Efisiensi Animasi GPU**:
   - Animasi hanya diperbolehkan mengubah properti **\`transform\`** dan **\`opacity\`**.
   - Hindari animasi pada \`width\`, \`height\`, \`top\`, \`left\`, \`margin\`, \`padding\`, atau \`filter\` secara berulang yang memicu reflow/repaint berat.
2. **Batas Lapisan Parallax**:
   - Parallax maksimal **4 lapis** per adegan (misal: latar belakang, bingkai pilar kiri-kanan, konten teks, dan elemen aksen mengambang).
3. **Bebas Video Latar**:
   - Dilarang menyematkan video autoplay di latar belakang. Semua atmosfer dibangun dengan komposisi WebP ringan, SVG vektor, dan gradasi CSS efisien.
4. **Pemuatan Aset (Lazy Loading)**:
   - Semua gambar dan ornamen yang berada di luar layar pembuka pertama (*below the fold*) wajib menggunakan atribut \`loading="lazy"\` dan \`decoding="async"\`.
5. **Aksesibilitas & Prefers-Reduced-Motion**:
   - Wajib menyertakan media query \`@media (prefers-reduced-motion: reduce)\` yang menonaktifkan gerakan berulang, animasi goyang, dan transisi lambat bagi pengguna dengan preferensi vestibular.
6. **Responsivitas Ponsel 390px**:
   - Seluruh teks, kartu, tombol, dan bingkai harus proporsional, nyaman disentuh (*touch target* minimal 44x44px), dan tidak mengalami overflow horizontal pada lebar layar 390px.

---

## 4. INTEGRITAS LOGIKA & STATUS BEKU (KODE TIDAK BOLEH DIRUSAK)

Tahap redesain antarmuka dilarang keras mengganggu logika sistem:
- **Folder Terlarang**: \`apps-script/\` dan \`data/\` tidak boleh diubah atau dihapus.
- **Fitur Beku Wajib Berfungsi**:
  1. Verifikasi Tim Peserta (\`#gate\`, \`#ge\`, \`#gt\`, \`#gb\`, \`#bv\`, \`#subs\`).
  2. Alur Pengumpulan Berkas Karya & Tautan Drive/Form.
  3. Hitung Mundur Waktu (Countdown Timeline & Event).
  4. Pendaftaran Cabang Lomba (\`#reg\`, \`#track\`).
  5. Pengumuman Juara (\`#juara\`, \`#grAll\`, \`#rev\`, modal hasil).
- **Aturan File Lama**: File yang tidak dipakai dipindahkan ke direktori \`_archive/\`, bukan dihapus langsung.

---

## 5. DAFTAR TOKEN CSS RESMI (\`css/tokens.css\`)

| Variabel CSS | Nilai Hex / Formula | Deskripsi |
|---|---|---|
| \`--color-maroon\` | \`#731215\` | Marun resmi logo (dominan) |
| \`--color-red\` | \`#a71823\` | Merah aksen logo |
| \`--color-gold-dark\` | \`#be6f24\` | Emas gelap / perunggu |
| \`--color-gold-light\` | \`#e29a3f\` | Emas terang / champagne |
| \`--color-bg-base\` | \`#14080a\` | Latar gelap marun-hitam utama |
| \`--color-bg-surface\` | \`#1e0d10\` | Permukaan kartu / panel |
| \`--color-paper-cream\` | \`#f7f1e6\` | Krem kertas naskah vintage |
| \`--color-text-primary\` | \`#f5eedf\` | Teks krem gading utama |
| \`--color-border-gold\` | \`rgba(226, 154, 63, 0.36)\` | Garis bingkai emas foil |
| \`--font-title\` | \`'Cormorant Garamond', Georgia, serif\` | Font judul kerajaan |
| \`--font-body\` / \`--font-ui\` | \`'Hanken Grotesk', sans-serif\` | Font teks tubuh & tombol UI |
