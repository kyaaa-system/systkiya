# Dashboard MA 50/100/200 - versi hosting (live Yahoo)

Satu halaman statis (`index.html`) ditambah dua fungsi proxy Vercel (`api/`) yang meneruskan data dari Yahoo Finance.
Hasil backtest, uji validitas, dan log trade tetap tertanam di `index.html` dan **tidak berubah**. Yang live hanya panel harga,
ticker, grafik, serta tabel Sinyal & Posisi.

## Struktur
```
index.html      dashboard (hasil backtest + snapshot harga tertanam + lapisan Yahoo)
api/batch.js    GET /api/batch?range=5d&symbols=BBCA,BBRI,...   -> JSON chart Yahoo per kode (maks. 30 kode)
api/yahoo.js    GET /api/yahoo?url=<URL chart Yahoo>             -> JSON chart Yahoo apa adanya
api/_yahoo.js   helper bersama (bukan endpoint; hanya host Yahoo yang diizinkan)
vercel.json     batas waktu fungsi 30 detik
package.json    menetapkan Node >= 18
```

## Cara kerja di browser
- Dibuka lewat https (Vercel): halaman otomatis memanggil `/api/batch` (riwayat 1 tahun saat pertama, lalu 5 hari tiap 60 detik).
  Bar baru disambung ke snapshot tertanam; bila ada selisih skala harga di tanggal yang tumpang tindih, bar Yahoo disesuaikan dengan rasionya.
  Chip di kanan atas berubah menjadi **LIVE - Yahoo**.
- Tombol **Refresh Yahoo** memaksa pembaruan sekarang. Tombol **Muat ulang data** kembali ke snapshot tertanam dan menghentikan pembaruan otomatis.
- Dibuka langsung dari file (klik dua kali) atau proxy tidak tersedia: tetap berjalan dengan snapshot tertanam, tanpa error.

## Upload ke GitHub
```
git init
git add .
git commit -m "dashboard MA 50/100/200 live Yahoo"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```
(Atau lewat web GitHub: New repository, Add file, Upload files, seret semua isi folder ini termasuk folder `api`.)

## Deploy ke Vercel
1. Buka https://vercel.com/new dan import repo GitHub tadi.
2. Framework Preset: **Other**. Build Command dan Output Directory dikosongkan. Root Directory `./`.
3. Klik **Deploy**. Setiap `git push` ke `main` otomatis deploy ulang.

Cek proxy setelah deploy (harus mengembalikan JSON yang berisi kunci `BBCA`):
```
https://DOMAIN-ANDA.vercel.app/api/batch?range=5d&symbols=BBCA
```

## Uji lokal
```
npm i -g vercel
vercel dev
```

## Catatan
- Yahoo Finance tidak punya API resmi dan kadang membatasi permintaan dari IP server. Fungsi proxy mencoba host cadangan (`query2`). Bila gagal, dashboard memakai snapshot tertanam dan menampilkan statusnya.
- Harga Yahoo disesuaikan split tetapi tidak dividen, sama dengan data backtest.
- **Jangan kumpulkan versi ini ke RISE.** Soal UTS melarang dashboard mengambil data dari luar saat dibuka. Kumpulkan file HTML versi offline (tanpa folder `api`).
