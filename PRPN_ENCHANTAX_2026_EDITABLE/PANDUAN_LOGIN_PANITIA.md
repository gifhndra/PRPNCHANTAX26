# Login Panitia: Akun Google + Password Pribadi

Masuk dashboard panitia sekarang butuh DUA hal yang harus cocok sebagai satu pasangan:
1. Akun Google panitia (diverifikasi ke Google oleh server)
2. Password pribadi yang dibuat khusus untuk akun Google itu

Akun Google benar tapi password milik panitia lain / typo / tertukar = DITOLAK.
Pesan error sengaja dibuat sama (tidak membocorkan mana yang salah). 5x gagal = akun dikunci 15 menit.

## Pasang (sekali saja)

### 1. Buat Client ID Google (gratis, ±5 menit)
1. Buka https://console.cloud.google.com > buat project (mis. "PRPN Enchantax").
2. APIs & Services > OAuth consent screen > External > isi nama aplikasi + email > Save.
   (Boleh tetap mode "Testing", lalu tambahkan email semua panitia di "Test users".)
3. APIs & Services > Credentials > Create credentials > OAuth client ID > Application type: **Web application**.
4. **Authorized JavaScript origins**: isi domain websitemu, mis. `https://namadomainmu.com`
   (tambahkan juga `http://localhost` bila ingin tes lokal). Jangan isi Redirect URI.
5. Create > salin **Client ID** (berakhiran `.apps.googleusercontent.com`).

### 2. Pasang Client ID di dua tempat (harus sama persis)
- `js/konfirmasi.js` > `GOOGLE_CLIENT_ID:"..."`
- `apps-script/Code.gs` > `const GOOGLE_CLIENT_ID = '...'`

### 3. Daftarkan panitia di Apps Script
1. Ganti seluruh isi Apps Script dengan `apps-script/Code.gs` yang baru.
2. Isi `PANITIA_BARU` (email akun Google, nama, password unik per orang, min. 8 karakter).
3. Pilih fungsi `simpanPanitia` > Run (izinkan akses saat diminta, termasuk "koneksi ke layanan eksternal").
4. **Hapus password dari kode** setelah dijalankan (yang tersimpan hanya hash + salt, di Script Properties, tidak tampil di Google Sheet).
5. Deploy > Manage deployments > pensil > Version: **New version** > Deploy. (URL /exec tetap sama.)
6. Bagikan password ke masing-masing panitia lewat jalur pribadi.

### Kelola panitia
- Lihat daftar: jalankan `daftarPanitia`
- Ganti password: isi ulang email yang sama di `PANITIA_BARU` lalu `simpanPanitia`
- Nonaktifkan / aktifkan / hapus: isi `EMAIL_TARGET`, lalu jalankan `nonaktifkanPanitia` / `aktifkanPanitia` / `hapusPanitia` (akses langsung hilang walau sesi masih berjalan)

## Perubahan keamanan
- Kunci rahasia bersama (`SECRET`) dihapus. Baca data peserta, simpan konfirmasi, dan terbitkan konten sekarang wajib sesi hasil login di atas.
- Kolom "Dikonfirmasi Oleh" terisi otomatis dari nama akun yang login (tidak bisa diketik/dipalsukan).
- Kode akses bersama lama (hash di app.js) dihapus.
- Sesi berlaku 6 jam; tombol Keluar mencabut sesi di server.
