# DOKUMENTASI TEKNIS SISTEM
## Smart FAQ Error Assistant (Updated with Local Offline Python OCR Engine)

Dokumen ini berisi kumpulan file panduan enterprise terpadu yang mencakup BRD, FSD, TDD, Panduan Pengguna (User Manual), Panduan Deploy, serta Skenario Pengujian Mutu (UAT) untuk sistem Smart FAQ Error Assistant.

---

## 1. Business Requirement Document (BRD)

### 1.1 Latar Belakang & Pendahuluan
Operasional IT perusahaan enterprise masa kini menuntut durasi waktu henti (downtime) seminimal mungkin. Ketika gangguan error terjadi pada platform (misalnya, core banking, API gateway, pembayaran, perpajakan), tim Helpdesk tingkat 1 dan operasional sering kesulitan melacak dokumentasi pemecahan masalah (wiki) karena keterbatasan keyword pencarian serta format log yang rumit. Proses diagnosis manual yang memakan waktu berjam-jam ini berdampak negatif pada Service Level Agreement (SLA) perusahaan.

### 1.2 Deskripsi Produk & Solusi
**Smart FAQ Error Assistant** hadir sebagai asisten digital penanganan error instan secara offline/lokal. Dengan mengunggah screenshot layar error, sistem mengekstrak parameter-parameter gangguan secara otomatis menggunakan implementasi kecerdasan buatan berbasis Python, mencarikan solusi eksak (exact match) dari database lokal, atau mencarikan solusi semantik (semantic search) paling relevan melalui text alignment and cosine similarity index.

### 1.3 Pemangku Kepentingan (Stakeholders)
*   **User Operasional / Customer:** Mengunggah screenshot kendala untuk memperoleh panduan solusi instan mandiri (self-service).
*   **Helpdesk / IT Support:** Memasukkan data FAQ baru, mempercepat investigasi log error, dan memantau antrean laporan.
*   **Sysadmin / IT Manager:** Memantau tren frekuensi kegagalan terpusat, performa SLA sistem, serta visualisasi kluster error.

### 1.4 Kriteria Keberhasilan & SLA Bisnis
*   Proses OCR deteksi gambar hingga ekstraksi terstruktur diselesaikan dalam waktu kurang dari 3 detik secara lokal.
*   Pencarian solusi mengutamakan pencocokan langsung kode error. Jika gagal, otomatis melakukan pencocokan semantik (Similarity Score > 40%) agar user terhindar dari kebuntuan informasi.

---

## 2. Functional Specification Document (FSD)

### 2.1 Kebutuhan Fungsional Utama (FR)

Sistem dirancang dengan spesifikasi fungsional berikut tanpa membebani antarmuka dengan label kode mentah fungsional:

| Kebutuhan Fungsional (Fungsi) | Detail Implementasi Sistem |
| :--- | :--- |
| **Upload Gambar Error** | Pengguna dapat mengunggah tangkapan layar (screenshot) berformat JPG atau PNG dengan batas ukuran unggah hingga 5 MB. |
| **Proses OCR Sistem** | Sistem mengirimkan file gambar sebagai string Base64 ke program backend. Backend secara offline mengekstrak pesan teks visual melalui sandboxed python script. |
| **Parser Atribut Otomatis** | Ekstraktor memisahkan teks hasil deteksi ke dalam entitas spesifik seperti: Layanan sistem, Kode Error Terdeteksi, Deskripsi Error, dan saran tindakan cepat. |
| **Pencarian Solusi Eksak** | Sistem melakukan lookup langsung ke basis data lokal berdasarkan kode error dan nama layanan untuk menghasilkan solusi instan 100% akurat. |
| **Semantic Search Fallback** | Jika kode error eksak tidak terdaftar langsung, sistem menghitung kedekatan semantik (cosine similarity score) terhadap data FAQ lain yang tersimpan. |
| **Manajemen Knowledge Base** | Operator (Role Helpdesk & Admin) dapat melakukan penambahan data (Create), pembaruan data (Update), dan penghapusan data (Delete) solusi error. |
| **FAQ Bulk Import** | Support dapat mempercepat populasi basis pengetahuan dengan mengimpor ratusan record FAQ secara massal menggunakan template Excel atau file CSV. |
| **Analytics Dashboard** | Visualisasi grafis riwayat frekuensi keparahan error, pembagian kegagalan per layanan aplikasi, serta pelacakan penyelesaian SLA operasional. |
| **K-Means Semantic Clustering** | Mesin analitik mengelompokkan pesan-pesan error yang berserakan menjadi gugusan kluster topik untuk memudahkan penanganan preventif sistemik. |

---

## 3. Technical Design Document (TDD)

### 3.1 Arsitektur Backend & Pipeline Deteksi OCR Lokal
Sistem tidak lagi menggunakan API cloud eksternal atau dependensi internet untuk melakukan deteksi OCR. Seluruh proses pengenalan visual dilakukan menggunakan program Python lokal sandboxed:

1.  **Node.js Express Backend Middleware:** Menerima string Base64 gambar dari Browser Client di route `/api/ocr`.
2.  **Subprocess Spawning:** Node.js menggunakan fungsi `spawn` dari modul bawaan `child_process` untuk menjalankan script sandboxed `/ocr_processor.py` secara asinkron.
3.  **Standard I/O Communication:** Payload Base64 didorong ke `stdin` proses Python, mengisolasi pembatasan data dari parameter URL.
4.  **Local Hybrid Ocr Engine (`ocr_processor.py`):**
    *   **Signature Hash Matcher:** Script membandingkan string Base64 terhadap hash representasi template standar (misalnya: preset error GIROPOS, FIF, CBA, PG) untuk pencocokan berkinerja tinggi instan.
    *   **Pre-proses Pengolahan Citra:** Untuk menjaga tingkat akurasi tinggi pada teks digital (anti-aliased digital fonts), sistem melakukan konversi citra ke Grayscale dan pembesaran ukuran (upscaling) 2x menggunakan interpolasi kubik (`cv2.INTER_CUBIC` dari OpenCV).
    *   **Tesseract OCR Integration:** Mengekstrak string teks visual secara offline secara lokal menggunakan Tesseract binary (`C:\Program Files\Tesseract-OCR\tesseract.exe`).
    *   **Algoritma Pencarian Solusi Hibrida (Database Search Algorithm):**
        1.  *Pencocokan Kode Eksak via Tokenizer (Exact Code Match):* Teks hasil ekstraksi dipecah menjadi token kata. Sistem mencocokkan setiap token terhadap kolom `kode_error` basis data secara case-insensitive. Jika ditemukan (misalnya: `L98`, `D98`, `P17`), data FAQ bersangkutan langsung dipilih dengan nilai confidence 1.0.
        2.  *Pencocokan Deskripsi Parsial (Substring Check):* Jika pencocokan kode nihil, sistem membandingkan kesesuaian substring dari deskripsi error di basis data dengan teks OCR yang sudah dibersihkan. Jika saling beririsan, data FAQ dipilih dengan confidence 0.95.
        3.  *TF-IDF dan Cosine Similarity (Vector Space Search):* Jika metode 1 & 2 nihil, sistem memproses teks OCR dan basis data FAQ menjadi representasi matriks TF-IDF (`TfidfVectorizer` dari scikit-learn) dan menghitung sudut kemiripan kosinus (`cosine_similarity`). FAQ dengan kesamaan tertinggi dan melampaui batas ambang batas >= 0.15 dipilih sebagai solusi.
        4.  *Jaccard Similarity Fallback:* Sebagai perlindungan cadangan apabila pustaka ML eksternal terhambat, kesamaan dihitung menggunakan pembagian jumlah irisan token (Intersection over Union) dengan ambang batas >= 0.1.
5.  **Output Parsing:** Hasil dikembalikan ke konsol output (`stdout`) dalam format string JSON terkompresi yang kemudian di-parse oleh Express untuk dipetakan ke database.

### 3.2 Keamanan & Role-Based Access Control (RBAC)
Sistem membatasi hak akses operasional berdasarkan tipe akun:
*   **User:** Akses pencarian solusi, penanganan unggah gambar, melihat histori laporan pribadi.
*   **Helpdesk:** Semua hak peran User + hak akses visualisasi analitik penuh, ekspor logs data riwayat pencarian, dan impor FAQ massal (CSV/Excel).
*   **Administrator:** Semua hak peran Helpdesk + hak pengelolaan penuh basis pengetahuan FAQ (Create, Read, Update, Delete) serta manajemen user audit.

---

## 4. User Manual (Panduan Pengguna)

### 4.1 Cara Melakukan Analisis Unggah Gambar Error
1.  Buka tab utama penanganan aplikasi.
2.  Seret file gambar kesalahan (screenshot) Anda langsung ke dalam area bertuliskan **"RETAK ATAU SERET FILE screenshot DISINI"** atau klik area tersebut untuk memilih file dari komputer Anda.
3.  Tekan button **"Proses Deteksi OCR"**.
4.  Tunggu sejenak sementara Python sandboxed OCR mengekstrak rincian atribut.
5.  Hasil ekstraksi parameter (Layanan, Kode Error, Pesan Error) akan ditampilkan secara detail lengkap dengan saran penanganan cepat.
6.  Sistem secara otomatis mencari FAQ yang paling cocok di bagian bawah, baik berupa Exact Match (Pencocokan Presisi) maupun Semantic Match (Kemiripan Makna).

### 4.2 Cara Mengelola FAQ (Knowledge Base)
1.  Pastikan Anda masuk (Login) menggunakan kredensial akun dengan role minimal "Admin" atau "Helpdesk" untuk mengunci panel aman.
2.  Akses bagian **"Knowledge Base Management"** di halaman bawah portal.
3.  Gunakan tombol **"Create FAQ"** untuk memicu modal dialog pembuatan artikel masalah secara manual. Isikan Layanan, Kode Error, rincian Deskripsi, penyebab logis, beserta Solusi praktisnya secara lengkap.
4.  Bila ingin mengimpor banyak artikel sekaligus secara cepat, klik tombol **"FAQ Import"**, unggah file Excel/CSV sesuai skema kolom template yang disediakan, lalu tekan simpan.

---

## 5. Deployment Guide (Panduan Instalasi & Deployment)

### 5.1 Prasyarat Perangkat Keras & Lunak
*   Node.js versi 18+ terpasang di sistem operasi.
*   Python versi 3 terpasang lengkap dengan modul standar.
*   (Opsional untuk gambar kustom di luar template) Mesin OCR lokal `tesseract-ocr` terinstall pada system environment host.

### 5.2 Langkah Instalasi Mandiri
1.  Unduh basis kode aplikasi.
2.  Jalankan instalasi dependensi runtime Node.js:
    ```bash
    npm install
    ```
3.  Pastikan dependensi dev server disiapkan. Salin file `.env.example` ke `.env`.
4.  Jalankan server pengembangan lokal:
    ```bash
    npm run dev
    ```
    *Aplikasi akan berjalan dan dapat diakses secara lokal melalui browser pada port 3000.*

---

## 6. Testing & UAT Scenario (Skenario Pengujian Unit)

Skenario pengujian kualitas menjamin kestabilan pemrosesan parameter:

### UAT-01: Verifikasi Deteksi OCR Sandbox Python (Offline)
*   **Tujuan:** Memvalidasi akurasi ekstraksi visual screenshot tanpa internet.
*   **Langkah:** Unggah screenshot sistem Bank Channeling GIROPOS yang menampilkan error kadaluarsa. Klik Proses OCR.
*   **Ekspektasi Keberhasilan:** Python Sandbox mengembalikan data terstruktur berupa JSON dengan Layanan: `Bank Channeling GIROPOS`, Kode Error: `004`, dan Deskripsi Error: `EXPIRED VIRTUAL ACCOUNT`.

### UAT-02: Verifikasi Fallback Pencarian Semantik (Cosine Similarity)
*   **Tujuan:** Menguji keampuhan mesin pencari saat kueri pengguna tidak sama persis dengan database.
*   **Langkah:** Ketik kueri pencarian kustom: `"sistem transaksi bank kelebihan kuota antrean"`
*   **Ekspektasi Keberhasilan:** Sistem mendeteksi tidak ada kode eksak, lalu secara cerdas menampilkan artikel error `CBA-5001 (Database transaction pool is exhausted)` sebagai kecocokan semantik berskor tinggi (misal: >60% Score) di antarmuka.
