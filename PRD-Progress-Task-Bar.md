# PRD: Progress Task Bar

## 1. Ringkasan

**Nama fitur:** Progress Task Bar  
**Produk:** Activity Log Usaha XYZ  
**Status dokumen:** Draft  
**Platform:** Web responsif

Progress Task Bar membantu pengguna melihat kemajuan proyek secara cepat melalui timeline mingguan dan daftar milestone. Status pada timeline harus selaras dengan status milestone di tabel agar pengguna dapat memahami progres tanpa menghitungnya secara manual.

## 2. Latar Belakang

Desain referensi menampilkan aktivitas proyek selama empat minggu, sebuah timeline horizontal, dan tabel milestone dengan status **Completed**, **In Progress**, dan **Not Started**. Pengguna memerlukan ringkasan visual yang menjelaskan seberapa jauh proyek berjalan, milestone mana yang aktif, dan pekerjaan apa yang belum dimulai.

## 3. Tujuan

- Menampilkan progres keseluruhan proyek secara mudah dipahami.
- Memperlihatkan status milestone dan ringkasan progres per minggu.
- Menjaga informasi timeline dan tabel tetap konsisten.
- Memudahkan pengguna menemukan pekerjaan yang selesai, sedang berjalan, dan belum dimulai.

## 4. Bukan Tujuan

- Membuat, menghapus, atau mengedit milestone.
- Mengatur anggota tim, dependensi, anggaran, atau jadwal proyek.
- Menghitung persentase berdasarkan estimasi waktu atau bobot khusus.
- Mengirim notifikasi atau menyediakan fitur kolaborasi.

## 5. Pengguna dan Kebutuhan

**Pengguna utama:** pemilik usaha atau anggota tim yang memantau progres proyek.

Sebagai pengguna, saya ingin:

- melihat ringkasan progres tanpa membaca seluruh tabel;
- mengetahui status dan urutan pekerjaan per minggu;
- memilih minggu atau milestone pada timeline untuk menemukan detail terkait;
- tetap dapat membaca progres pada layar ponsel.

## 6. Ruang Lingkup dan Perilaku

### 6.1 Ringkasan progres

- Tampilkan persentase progres proyek dan jumlah milestone selesai, misalnya **3 dari 12 milestone selesai (25%)**.
- Rumus progres: `jumlah milestone Completed / jumlah seluruh milestone × 100`, dibulatkan ke bilangan bulat terdekat.
- Milestone **In Progress** tidak dihitung sebagai selesai. Status ini tetap ditampilkan secara terpisah.
- Jika belum ada milestone, tampilkan progres **0%** dan pesan bahwa belum ada milestone.
- Jika data milestone gagal dimuat, tampilkan pesan error yang jelas; jangan menampilkan progres seolah-olah valid.

### 6.2 Timeline mingguan

- Tampilkan minggu sesuai urutan kronologis, misalnya **Week 1** sampai **Week 4**.
- Setiap minggu menjadi penanda ringkasan; tampilannya merefleksikan status milestone dalam minggu tersebut.
- Garis progres menunjukkan kemajuan kumulatif berdasarkan milestone **Completed** dalam urutan timeline.
- Milestone yang sedang **In Progress** memiliki penanda aktif yang berbeda dari milestone selesai dan belum dimulai.
- Milestone **Not Started** tidak menambah panjang garis progres.
- Memilih penanda minggu atau milestone menyorot baris terkait pada tabel. Jika tabel berada di luar area tampilan, gulirkan ke baris tersebut.
- Timeline dan tabel harus menggunakan sumber data yang sama. Perubahan data harus tercermin pada keduanya.

### 6.3 Tabel milestone

Kolom:

| Kolom | Isi |
|---|---|
| Week | Minggu pelaksanaan |
| Milestone | Nama pekerjaan |
| Description | Penjelasan pekerjaan |
| Status | Completed, In Progress, atau Not Started |

- Urutkan baris berdasarkan minggu, lalu urutan milestone yang diberikan oleh data.
- Gunakan label teks selain warna untuk mengidentifikasi status.
- Tampilkan jumlah milestone per status pada ringkasan atau filter bila kontrol tersebut tersedia.

### 6.4 Status

| Status | Makna | Tampilan progres |
|---|---|---|
| Completed | Pekerjaan sudah selesai | Penanda selesai; dihitung ke persentase progres |
| In Progress | Pekerjaan sedang dikerjakan | Penanda aktif; tidak dihitung sebagai milestone selesai |
| Not Started | Pekerjaan belum dimulai | Penanda belum dimulai |

Untuk ringkasan per minggu:

- **Completed:** semua milestone pada minggu tersebut selesai.
- **In Progress:** setidaknya satu milestone sedang berjalan, atau ada milestone selesai dan masih ada milestone yang belum selesai.
- **Not Started:** belum ada milestone yang selesai atau sedang berjalan.

## 7. Data yang Dibutuhkan

Setiap milestone harus menyediakan:

- `id`: ID unik;
- `week`: nomor minggu;
- `name`: nama milestone;
- `description`: deskripsi;
- `status`: `completed`, `in_progress`, atau `not_started`;
- `order`: posisi milestone dalam minggu.

Validasi minimum:

- `id` unik dan `week` berupa angka positif;
- `name` dan `status` wajib tersedia;
- status di luar nilai yang didukung harus ditangani sebagai data tidak valid, bukan diam-diam dianggap selesai;
- proyek tanpa milestone menampilkan empty state.

## 8. Kriteria Penerimaan

1. Dengan 12 milestone dan 3 berstatus **Completed**, ringkasan menampilkan **25%** dan **3 dari 12 selesai**.
2. Milestone **In Progress** ditandai aktif tetapi tidak menaikkan persentase selesai.
3. Minggu yang semua milestone-nya selesai ditampilkan sebagai selesai; minggu yang punya pekerjaan aktif ditampilkan sebagai aktif; minggu tanpa progres ditampilkan sebagai belum dimulai.
4. Memilih penanda pada timeline menyorot milestone atau minggu yang benar pada tabel.
5. Mengubah status milestone pada sumber data memperbarui ringkasan, timeline, dan tabel secara konsisten.
6. Pada data kosong, pengguna melihat progres 0% dan pesan bahwa belum ada milestone.
7. Pada kegagalan pemuatan data, pengguna melihat pesan error dan kontrol coba lagi bila pemuatan ulang didukung.
8. Informasi status tetap bisa dipahami tanpa membedakan warna saja.
9. Pada layar kecil, pengguna tetap dapat mengakses seluruh kolom tabel dan timeline tanpa konten terpotong; tabel boleh digulir horizontal.

## 9. Kebutuhan Nonfungsional

- **Responsif:** layout bekerja pada desktop, tablet, dan ponsel.
- **Aksesibilitas:** elemen interaktif dapat digunakan dengan keyboard; fokus terlihat; status dan progres tersedia dalam teks yang dapat dibaca teknologi bantu.
- **Kontras:** teks, status, dan indikator memenuhi kontras yang memadai terhadap latar.
- **Kinerja:** ringkasan dan tampilan progres diperbarui tanpa jeda yang terasa untuk jumlah milestone proyek yang wajar.

## 10. Asumsi dan Pertanyaan Terbuka

- Status milestone tersedia dari sumber data aplikasi; dokumen ini tidak menetapkan backend atau mekanisme penyimpanan.
- Progres dihitung berdasarkan jumlah milestone yang selesai, bukan bobot atau durasi.
- Tampilan awal bersifat pemantauan; kemampuan untuk mengubah status milestone dari halaman ini belum termasuk ruang lingkup.
- Perlu dikonfirmasi apakah penanda timeline merepresentasikan setiap milestone, setiap minggu, atau keduanya. Rekomendasi: penanda minggu sebagai ringkasan dan penanda milestone sebagai detail yang dapat dipilih.
- Perlu dikonfirmasi apakah istilah status di UI akan tetap berbahasa Inggris seperti desain referensi atau diterjemahkan ke Bahasa Indonesia.

## 11. Indikator Keberhasilan

- Pengguna dapat menyebutkan persentase progres dan jumlah milestone selesai hanya dari ringkasan.
- Tidak ada perbedaan status antara timeline dan tabel untuk milestone yang sama.
- Pengguna dapat menemukan milestone tertentu melalui timeline pada desktop maupun ponsel.
