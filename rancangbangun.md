# RANCANG BANGUN SISTEM
## Smart FAQ Error Assistant (Updated with Offline Python OCR System)

Dokumen ini menjelaskan struktur arsitektur, diagram aliran, dan spesifikasi rancang bangun perangkat lunak Smart FAQ Error Assistant.

---

### 1. Diagram Arsitektur Sistem (System Architecture Diagram)

Arsitektur platform ini bersifat end-to-end full-stack, dibangun dengan efisiensi tinggi serta mengisolasi deteksi OCR secara lokal di sisi server menggunakan Python sandbox:

```
[ Browser Client ]  ───►  [ Express Backend Server ]  ───► [ Python OCR Processor (Sandbox) ]
 (React + Vite SPA)        (Node.js - Port 3000)            (python3 subprocess - Offline)
                                   │
                                   ▼
                          [ /data/database.json ]
                         (Local JSON Database Store)
```

**Alur Aliran Data (Data Flows):**
1. **Upload File Gambar:** Pengguna mengklik atau melakukan drag-and-drop file tangkapan layar (screenshot) berformat PNG/JPG ke area dropzone pada antarmuka React SPA.
2. **Kirim Payload:** Gambar diubah menjadi representasi string Base64 dan diposting ke endpoint backend `/api/ocr` secara asinkron.
3. **Python Local Sandboxed OCR Execution:** Backend Express memicu interpreter `python3` untuk menjalankan script asisten `/ocr_processor.py` sebagai subprocess aman.
   - String Base64 dialirkan langsung melalui `stdin`.
   - Script Python menerjemahkan Base64 menjadi raw bytes lalu memicu utilitas lokalisasi Tesseract OCR atau parser model tanda tangan (Signature Hash Matcher) secara offline tanpa bergantung pada API eksternal atau koneksi internet.
4. **Structured JSON Output:** Python memproses parameter visual (Layanan, Kode Error, Deskripsi, Saran Cepat, dan Confidence Score) dan melontarkan hasil terstruktur berbentuk JSON ke `stdout`.
5. **Exact & Semantic Database Matching:** Dari parameter yang diekstrak, backend melakukan pencarian exact match atau visual fallback semantic match menggunakan representasi data master FAQ di `/data/database.json`.
6. **Logging History:** Hasil transaksi analisis dicatat secara otomatis ke dalam riwayat audit pencarian di dalam database persisten.

---

### 2. Diagram Hubungan Entitas (Entity Relationship Diagram - ERD)

Data dimodelkan secara relasional dan disimpan menggunakan mesin serialisasi JSON terstruktur yang persisten:

#### A. Tabel `users`
Represents detail kredensial dan hak operasional pengguna sistem.
- **id** `TEXT (PRIMARY KEY)` - ID unik pengguna.
- **name** `VARCHAR(100)` - Nama lengkap pengguna.
- **email** `VARCHAR(100) (UNIQUE)` - Alamat surat elektronik berlisensi unik.
- **password** `VARCHAR(255)` - Kata sandi terenkripsi.
- **role** `ENUM('user', 'helpdesk', 'admin')` - Peran otorisasi fungsional.

#### B. Tabel `faq`
Master data solusi dan basis pengetahuan insiden error.
- **id** `TEXT (PRIMARY KEY)` - ID unik artikel basis pengetahuan.
- **layanan** `VARCHAR(50)` - Kategori segmen aplikasi atau layanan terinfeksi.
- **kode_error** `VARCHAR(30)` - Parameter kode error spesifik (misal: 004, F14, CBA-5001).
- **deskripsi_error** `TEXT` - Pesan penjelasan error sistem.
- **penyebab** `TEXT` - Skenario akar penyebab insiden.
- **solusi** `TEXT` - Langkah instruksi penyelesaian masalah.
- **embedding** `VECTOR(1536)` - Matriks representasi vector embedding dari teks untuk kalkulasi kedekatan semantik.

#### C. Tabel `search_history`
Audit logs pencarian error helpdesk dan operasional secara riil.
- **id** `TEXT (PRIMARY KEY)` - ID riwayat transaksi.
- **user_id** `TEXT (FOREIGN KEY -> users.id)` - Relasi ke pengguna pengunggah.
- **layanan** `VARCHAR(50)` - Layanan yang terdeteksi.
- **kode_error** `VARCHAR(30)` - Kode error yang dideteksi.
- **query_text** `TEXT` - Kueri teks analisis penemu solusi.
- **result_found** `BOOLEAN` - Flag penanda keberhasilan pencarian solusi.
- **similarity_score** `FLOAT` - Skor kesamaan fungsional.
- **created_at** `TIMESTAMP` - Waktu pencatatan.

---

### 3. Diagram Kasus Penggunaan (Use Case Diagram)

Sistem memetakan batas-batas use case penanganan insiden berdasarkan peran pengguna (RBAC):

```
       👤 USER OPERASIONAL           💻 HELPDESK SUPPORT           🛡️ ADMINISTRATOR
      ─────────────────────         ─────────────────────         ───────────────────
       - Melakukan Login             - Semua Akses User            - Semua Akses Helpdesk
       - Unggah Screenshot           - Analisis Dashboard          - CRUD KB FAQ Database
       - Cari Solusi (Exact/Sem)     - FAQ Bulk Import (CSV)       - Managing Users Info
```

---

### 4. Diagram Aktivitas (Activity Diagram - OCR & Search)

Aliran jalannya operasi ketika gambar screenshot error diunggah:

```
[ Mulai ] ──► [ User Upload Gambar Screenshot ] ──► [ Jalankan python3 Process Sandbox ]
                                                                   │
                                                                   ▼
[ Tampilan Solusi Utama ] ◄── [ Ya (Exact Found) ] ◄── [ Apakah Data Ditemukan di DB? ]
          ▲                                                        │
          │                                                        ▼ Tidak
[ Render di Antarmuka ] ◄─────── [ Jalankan Fallback Semantic Search (Cosine Similarity) ]
                                                                   │
                                                                   ▼
                                              [ Catat Logs ke search_history ] ──► [ Selesai ]
```

---

### 5. Diagram Urutan Kejadian (Sequence Diagram)

Visualisasi alur komunikasi antar objek dan komponen pendukung penanganan error secara offline:

```
User               Klien (SPA)            Server (Express)         Python Subprocess         Database
 │                      │                        │                         │                    │
 ├─ Upload Screenshot ─►│                        │                         │                    │
 │                      ├─────── POST /api/ocr ─►│                         │                    │
 │                      │                        ├────── spawn subprocess ►│                    │
 │                      │                        │  (stdin base64 payload) │                    │
 │                      │                        │                         ├── Processing OCR ──┤
 │                      │                        │◄────── stdout (JSON) ───┤  & Signature Match │
 │                      │                        ├─────────────── Query Match Error ───────────►│
 │                      │                        │◄────────────── Return Exact/Semantic ────────┤
 │                      │◄─── Send JSON Result ──┤                                              │
 │◄── Render Solution ──┤                        │                                              │
```

---

### 6. Diagram Kelas (Class Diagram)

Struktur blueprint dan pengontrol perangkat lunak utama:

*   **class AuthController**: Mengendalikan pendaftaran akun (`register`), otentikasi sesi (`login`), dan otorisasi menu berdasarkan role.
*   **class FAQController**: Mengendalikan penyimpanan data, kueri pencarian, dan impor FAQ massal (`importFromCSV`) dari template audit.
*   **class SearchAndOCREngine**: Mengintegrasikan model penanganan deteksi gambar error via Python (`executeOCR`), pencarian teks semantik (`performSemanticSearch`), dan visualisasi klasterisasi error (`clusterErrorLogsAndSuggestPreventive`).
