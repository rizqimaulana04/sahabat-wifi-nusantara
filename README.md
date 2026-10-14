# Sahabat Wifi Nusantara

**Internet cepat. Harga bersahabat.**

Website layanan internet fiber Sahabat Wifi Nusantara untuk Jabodetabek dan sekitarnya. Menampilkan informasi paket, konsultasi pemasangan melalui WhatsApp, dan pengujian koneksi internet dalam antarmuka responsif dengan tema hologram biru dan cyan.

Proyek menggunakan HTML, CSS, dan JavaScript tanpa framework, proses build, atau database. File website dapat langsung dipasang pada hosting statis maupun cPanel.

## Fitur

- **Informasi paket internet** — pilihan kecepatan, harga bulanan, dan rekomendasi penggunaan.
- **Konsultasi WhatsApp** — pesan pendaftaran otomatis menyertakan paket yang dipilih.
- **Speed Test** — estimasi unduh, unggah, latensi HTTP, dan jitter dengan meter berjarum serta grafik sampel pengukuran.
- **Pertanyaan area layanan** — mengarahkan pertanyaan lokasi ke tim melalui WhatsApp.
- **Promo berdasarkan tanggal** — menyembunyikan penawaran setelah periode promo berakhir.
- **Navigasi responsif** — menu mobile, FAQ interaktif, dan footer dengan identitas merek.
- **Aksesibilitas** — struktur HTML semantik, navigasi keyboard, label formulir, indikator fokus, dan dukungan preferensi pengurangan animasi.

## Teknologi

| Komponen | Teknologi |
| --- | --- |
| Struktur halaman | HTML5 |
| Tampilan dan responsivitas | CSS3, Grid, Flexbox, media queries |
| Interaksi | JavaScript native |
| Ilustrasi dan grafik | SVG |
| Pengukuran koneksi | Fetch API dan endpoint Cloudflare |
| Server pengembangan lokal | Node.js, tanpa dependensi tambahan |

## Struktur proyek

```text
.
├── README.md
├── preview.cjs
└── dist/
    ├── index.html
    ├── styles.css
    ├── hologram.css
    ├── config.js
    ├── app.js
    ├── speed-test.js
    └── assets/
        ├── logo-dark.png
        ├── brand-icon.png
        ├── brosur.png
        └── ...
```

| File | Fungsi |
| --- | --- |
| `index.html` | Struktur halaman, konten, metadata, dan tautan navigasi |
| `styles.css` | Tata letak dasar dan komponen responsif |
| `hologram.css` | Tema visual, tipografi, dan tampilan Speed Test |
| `config.js` | Nomor WhatsApp, paket, harga, dan periode promo |
| `app.js` | Navigasi, kartu paket, promo, serta formulir area |
| `speed-test.js` | Pengukuran jaringan, grafik, pembatalan, dan penanganan kegagalan |
| `preview.cjs` | Server HTTP untuk pengembangan lokal |

## Menjalankan secara lokal

Untuk melihat halaman dasar, buka `dist/index.html` melalui browser. Untuk menguji interaksi dan Speed Test, gunakan server HTTP lokal.

Dengan Node.js terpasang, jalankan perintah berikut dari direktori proyek:

```bash
node preview.cjs
```

Kemudian buka [http://127.0.0.1:4173](http://127.0.0.1:4173). Tekan `Ctrl+C` pada terminal untuk menghentikan server.

Tidak perlu menjalankan `npm install`. Server preview digunakan untuk pengembangan lokal; hosting produksi cukup menyajikan file di dalam `dist`.

## Konfigurasi

### Nomor WhatsApp

Ubah `whatsappNumber` pada `dist/config.js`. Gunakan format internasional tanpa tanda tambah, spasi, atau tanda hubung:

```javascript
whatsappNumber: '6285881322321'
```

Sesuaikan juga teks nomor kontak pada footer dan FAQ di `dist/index.html` apabila nomor berubah.

### Paket internet

Kelola nama, kecepatan, harga, rekomendasi perangkat, dan fitur melalui array `packages` pada `dist/config.js`.

| Kecepatan | Harga per bulan |
| --- | ---: |
| 20 Mbps | Rp160.000 |
| 30 Mbps | Rp190.000 |
| 40 Mbps | Rp215.000 |
| 100 Mbps | Rp260.000 |

Informasi paket mengikuti brosur layanan. Konfirmasikan pajak, persyaratan pemasangan, dan ketersediaan jaringan pada alamat pelanggan kepada tim. Rekomendasi jumlah perangkat bukan jaminan performa setiap perangkat secara bersamaan.

### Promo

Atur tanggal berakhir melalui `promo.endsAt` menggunakan format ISO 8601 beserta zona waktu. Konfigurasi saat ini menyembunyikan promo Oktober mulai **1 November 2026, pukul 00.00 WIB**:

```javascript
endsAt: '2026-11-01T00:00:00+07:00'
```

Jika materi penawaran berubah, perbarui teks promo pada `index.html` dan brosur terkait di `assets`.

### Identitas merek dan Instagram

- `assets/logo-dark.png` digunakan pada header dan footer.
- `assets/brand-icon.png` digunakan sebagai ikon tab browser.
- Ikon Instagram pada footer belum terhubung ke profil. Setelah akun ditentukan, ubah elemen `.footer-instagram` menjadi tautan profil yang sesuai.

## Cara kerja Speed Test

Pengujian dimulai hanya ketika pengunjung menekan **MULAI**. Data diunduh dan diunggah melalui endpoint publik Cloudflare; seluruh nilai dan titik grafik berasal dari transfer yang benar-benar dijalankan.

| Metrik | Metode |
| --- | --- |
| Unduh dan unggah | Median throughput dari transfer HTTP satu koneksi dengan ukuran bertahap |
| Latensi HTTP | Median lima waktu respons setelah satu permintaan pemanasan |
| Jitter HTTP | Rata-rata selisih absolut antarsampel latensi |
| Grafik | Sampel throughput setiap transfer yang selesai |

Tes menggunakan hingga sekitar **37 MB** data termasuk perkiraan overhead. Transfer lebih besar dapat dilewati pada koneksi lambat. Batas waktu adalah 15 detik per permintaan dan 60 detik untuk keseluruhan tes. Tombol **Hentikan** membatalkan permintaan aktif; kegagalan ditampilkan sebagai hasil yang belum lengkap.

Hasil merupakan estimasi koneksi pada saat pengujian, bukan pengukuran kapasitas maksimum atau jaminan kecepatan paket. Latensi HTTP berbeda dari ping ICMP. Perangkat, kualitas WiFi, VPN, browser, aktivitas jaringan lain, dan rute server dapat memengaruhi hasil.

Data unggah berupa byte sintetis, bukan file pribadi. Cloudflare menerima IP koneksi pengunjung sebagai bagian dari permintaan jaringan. Website tidak menyimpan hasil pengujian atau data formulir di server. Formulir area membuka pesan WhatsApp untuk ditindaklanjuti tim, bukan melakukan pengecekan cakupan otomatis.

Referensi endpoint: [Cloudflare Speedtest](https://github.com/cloudflare/speedtest).

## Deployment ke cPanel

1. Cadangkan isi website yang sudah ada.
2. Tentukan document root untuk domain tujuan, misalnya `public_html`.
3. Unggah **isi folder `dist`**, sehingga `index.html` berada langsung di document root.
4. Pertahankan struktur folder `assets` dan nama file CSS serta JavaScript.
5. Aktifkan HTTPS dan pastikan DNS domain mengarah ke hosting.
6. Periksa navigasi, logo, tautan WhatsApp, informasi paket, dan Speed Test pada domain tujuan.

File `preview.cjs` dan `README.md` tidak diperlukan pada document root produksi.

## Pemeriksaan dan pemeliharaan

Tampilan telah diperiksa pada lebar layar 320, 390, 768, dan 1440 piksel. Pengukuran jaringan nyata, grafik hasil transfer, pembatalan tes, navigasi mobile, FAQ, dan tautan paket telah diuji pada browser pengembangan.

Setelah melakukan perubahan, periksa kembali tampilan HP dan desktop, tanggal promo, nomor kontak, serta kesesuaian harga. Gunakan HTTPS dan browser modern untuk pengoperasian website.

## Kontak

**Sahabat Wifi Nusantara**  
Area layanan: Jabodetabek dan sekitarnya  
WhatsApp: [0858-8132-2321](https://wa.me/6285881322321)
