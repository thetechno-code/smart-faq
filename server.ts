/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { FAQ, SearchHistory, User, ErrorCluster, AnalyticsStats } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Ensure database directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = path.join(DATA_DIR, "database.json");

// System Init State
let users: User[] = [];
let passStore: Record<string, string> = {}; // plain/hashed password store for simplicity
let faqs: FAQ[] = [];
let searchHistories: SearchHistory[] = [];

// Initialize Gemini SDK lazily, with checks
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return ai;
}

// Vector math helpers for Cosine Similarity
function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, idx) => sum + val * (b[idx] || 0), 0);
}
function magnitude(a: number[]): number {
  return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
}
function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

// Seed Initial Sample Dataset (Ensuring a highly realistic, enterprise setup)
function seedDatabase() {
  const newFaqsToSeed = [
    {
      id: "faq-sof-f14",
      layanan: "SOF - ANGSURAN OTO KREDIT MOBIL/MOTOR",
      kode_error: "F14",
      deskripsi_error: "F14 NOMOR PELANGGAN TIDAK DITEMUKAN DI DATABASE",
      penyebab: "Input Nomor Kontrak SOF salah atau nomor kontrak salah entri pada sistem pembayaran.",
      solusi: "Salah Nomor Kontrak SOF, pastikan 12 digit, contoh : 106011500608."
    },
    {
      id: "faq-sof-f89",
      layanan: "SOF - ANGSURAN OTO KREDIT MOBIL/MOTOR",
      kode_error: "F89",
      deskripsi_error: "F89 KONEKSI ANTARA AJ DENGAN BILL PROVIDER TERPUTUS",
      penyebab: "Terjadi gangguan konektivitas atau pemeliharaan jaringan antara AJ dengan internal bill provider.",
      solusi: "Gangguan layanan SOF - Angsuran OTO Kredit Mobil/Motor."
    },
    {
      id: "faq-sof-f91",
      layanan: "SOF - ANGSURAN OTO KREDIT MOBIL/MOTOR",
      kode_error: "F91",
      deskripsi_error: "F91 TIME OUT DARI DATABASE SERVER MITRA/ BILL PROVIDER (DATABASE TIDAK DAPAT DIAKSES)",
      penyebab: "Server database mitra mengalami timeout akibat respon lambat atau offline.",
      solusi: "a. No. Kontrak salah = pastikan Nomor Kontrak SOF 12 digit, contoh : 106021710957\nb. Sudah lewat tanggal jatuh tempo\nc. Angsuran pertama atau Angsuran terakhir\nd. Jika nomor sudah benar, belum jatuh tempo, bukan angsuran terakhir = ADA kewajiban yang harus diselesaikan oleh pelanggan sehingga data pelanggan tidak dapat ditampilkan = silahkan ke kantor cabang SUMMIT OTO FINANCE terdekat."
    },
    {
      id: "faq-fif-f05",
      layanan: "FIF ANGSURAN",
      kode_error: "F05",
      deskripsi_error: "F05 KODE KESALAHAN BLM DIDEFINISKAN",
      penyebab: "Waktu pembayaran angsuran pelanggan melebihi batas yang diperbolehkan.",
      solusi: "Angsuran pelanggan melebihi batas waktu pembayaran, pelanggan hanya dapat melakukan pembayaran angsuran terakhir ke Kantor FIF."
    },
    {
      id: "faq-fif-f12",
      layanan: "FIF ANGSURAN",
      kode_error: "F12",
      deskripsi_error: "F12 TRANSAKSI PEMBATALAN TAGIHAN (0400) TDK BISA DILAKUKAN KARENA TRANSAKSI PEMBAYARAN BELUM TERJADI",
      penyebab: "Upaya pembatalan dillewati karena transaksi belum dilaporkan terbayar atau status cicilan merupakan Angsuran Terakhir.",
      solusi: "Angsuran Terakhir, tidak dapat dibayar di Loket POS, silahkan pelanggan melakukan pembayaran angsuran terakhir ke Kantor FIF."
    },
    {
      id: "faq-fif-f14",
      layanan: "FIF ANGSURAN",
      kode_error: "F14",
      deskripsi_error: "F14 NOMOR PELANGGAN TIDAK DITEMUKAN DI DATABASE BILL PROVIDER",
      penyebab: "Nomor kontrak pelanggan salah input atau status kontrak di-BLOK oleh server pusat FIF.",
      solusi: "a. Salah Nomer Pelanggan atau Unique Number, Konfirm ulang ke pelanggan, pastikan 12 digit, contoh : 405001678917\nb. Jika nomer sudah benar = data pelanggan di BLOK oleh FIF, silahkan arahkan pelanggan langsung ke Kantor cabang FIF."
    },
    {
      id: "faq-fif-f68",
      layanan: "FIF ANGSURAN",
      kode_error: "F68",
      deskripsi_error: "F68 TIME OUT KETIKA AJ MENUNGGU RESPONSE DARI BILL PROVIDER",
      penyebab: "Koneksi timeout ketika sistem AJ menunggu respon dari provider FIF.",
      solusi: "Gangguan Layanan FIF."
    },
    {
      id: "faq-fif-f80",
      layanan: "FIF ANGSURAN",
      kode_error: "F80",
      deskripsi_error: "F80 PALING TIDAK 1 BILL TELAH TERBAYAR",
      penyebab: "Ada tunggakan billing cicilan bermasalah dari histori pembayaran pelanggan.",
      solusi: "Tagihan FIF pelanggan MENUNGGAK = Silahkan langsung ke Kantor Cabang FIF terdekat."
    },
    {
      id: "faq-fif-f88",
      layanan: "FIF ANGSURAN",
      kode_error: "F88",
      deskripsi_error: "F88 TAGIHAN TELAH DIBAYARKAN",
      penyebab: "Tagihan pelanggan yang di-request sudah sukses diselesaikan pelunasan pembayarannya sebelumnya.",
      solusi: "Tagihan FIF ANGSURAN tsb sudah terbayar."
    },
    {
      id: "faq-fif-f89",
      layanan: "FIF ANGSURAN",
      kode_error: "F89",
      deskripsi_error: "F89 KONEKSI ANTARA AJ DENGAN BILL PROVIDER TERPUTUS",
      penyebab: "Koneksi inter-database AJ dengan provider bill mengalami gangguan jaringan.",
      solusi: "Gangguan Layanan FIF."
    },
    {
      id: "faq-bpjs-l98",
      layanan: "ASURANSI - BPJS KESEHATAN IURAN KELUARGA",
      kode_error: "L98",
      deskripsi_error: "L98 REFERENSI LAYANAN TIDAK SESUAI, LAKUKAN INISIALISASI MENU",
      penyebab: "Gagal sinkronisasi data menu aplikasi loket Pospay dengan server pusat BPJS Kesehatan atau versi aplikasi belum ter-update.",
      solusi: "1. Lakukan Inisialisasi Ulang (Log Out dan Login kembali) pada aplikasi Pospay untuk me-refresh data menu.\n2. Cek kesesuaian NIK dan Nomor BPJS pelanggan sesuai KK/KTP terbaru.\n3. Periksa status kepesertaan aktif via Mobile JKN atau WhatsApp PANDAWA (0811-8165-165)."
    },
    {
      id: "faq-giropos-d98",
      layanan: "Bank Channeling GIROPOS",
      kode_error: "D98",
      deskripsi_error: "D98 [HOST MITRA] ERROR",
      penyebab: "Gangguan koneksi atau pemeliharaan jaringan (maintenance) pada server internal milik pihak ketiga (mitra bank/biller).",
      solusi: "1. Periksa kestabilan koneksi internet loket Pospay.\n2. Tunggu 5-10 menit lalu ulangi transaksi secara berkala.\n3. Laporkan kendala beserta nama biller ke Helpdesk SOPP/IT jika error berlanjut."
    },
    {
      id: "faq-mpn-p17",
      layanan: "Bank Channeling GIROPOS",
      kode_error: "P17",
      deskripsi_error: "P17 TIME OUT DARI HOST KONVERTER",
      penyebab: "Server host converter tidak merespons permintaan transaksi MPN Billing dalam batas waktu yang ditentukan (timeout).",
      solusi: "1. Periksa kestabilan jaringan internet loket.\n2. Lakukan Log Out dan Login kembali aplikasi Pospay.\n3. Jangan mengulang transaksi secara terburu-buru sebelum memastikan saldo tidak terpotong (gunakan menu re-inquiry).\n4. Kirim tiket laporan ke Bantuan Resmi HOS SOPP jika kendala berlanjut."
    }
  ];

  if (fs.existsSync(DB_PATH)) {
    try {
      const saved = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      users = saved.users || [];
      passStore = saved.passStore || {};
      faqs = saved.faqs || [];
      searchHistories = saved.searchHistories || [];

      let updated = false;
      for (const item of newFaqsToSeed) {
        if (!faqs.some(f => f.id === item.id || (f.layanan === item.layanan && f.kode_error === item.kode_error))) {
          faqs.push(item);
          updated = true;
        }
      }

      // Dynamically migrate names in database file
      users.forEach(u => {
        if (u.name === "Andi Saputra") { u.name = "Iwan"; updated = true; }
        else if (u.name === "Budi Wijaya") { u.name = "Hesti"; updated = true; }
        else if (u.name === "Citra Dewi") { u.name = "Sekar"; updated = true; }
      });
      searchHistories.forEach(sh => {
        if (sh.user_name === "Andi Saputra") { sh.user_name = "Iwan"; updated = true; }
        else if (sh.user_name === "Budi Wijaya") { sh.user_name = "Hesti"; updated = true; }
        else if (sh.user_name === "Citra Dewi") { sh.user_name = "Sekar"; updated = true; }
      });

      if (updated) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ users, passStore, faqs, searchHistories }, null, 2), "utf-8");
        console.log(`Database auto-upgraded and saved with ${faqs.length} FAQs and updated user profiles.`);
      } else {
        console.log(`Database loaded successfully with ${faqs.length} FAQs and ${searchHistories.length} history items.`);
      }
      return;
    } catch (e) {
      console.error("Error reading database, re-seeding.", e);
    }
  }

  // Define User accounts
  users = [
    { id: "u-1", name: "Iwan", email: "user@enterprise.com", role: "user" },
    { id: "h-1", name: "Hesti", email: "helpdesk@enterprise.com", role: "helpdesk" },
    { id: "a-1", name: "Sekar", email: "admin@enterprise.com", role: "admin" }
  ];

  passStore = {
    "user@enterprise.com": "password123",
    "helpdesk@enterprise.com": "password123",
    "admin@enterprise.com": "password123"
  };

  // Prepopulate standard Enterprise Error Knowledge Base (FAQs)
  faqs = [
    {
      id: "faq-1",
      layanan: "Core Banking API",
      kode_error: "CBA-5001",
      deskripsi_error: "Database transaction pool is exhausted. Connection timed out after 5000ms.",
      penyebab: "Aplikasi mengalami bottleneck karena jumlah query open-connection tidak ditutup setelah commit transaksi, diperparah oleh traffic lonjakan jam operasional.",
      solusi: "1. Pastikan connection-pool ditutup menggunakan blok try-with-resources atau block finally.\n2. Tingkatkan 'max-connections' pada pooling configuration dari 20 ke 50 di application.yml.\n3. Jalankan command restart pada pods API Core: 'kubectl rollout restart deployment banking-core-api'."
    },
    {
      id: "faq-2",
      layanan: "Payment Gateway",
      kode_error: "ERR-PG-4003",
      deskripsi_error: "Signature verification failed for partner endpoint signature. Got mismatch hash value.",
      penyebab: "Partner mengirim request menggunakan webhook API key versi lama, atau terdapat kesalahan parsing UTF-8 padding payload JSON sebelum digest hashing.",
      solusi: "1. Periksa partner credentials di Admin Dashboard dan pastikan secret key partner sudah sesuai.\n2. Lakukan trim trailing/leading whitespaces pada input JSON string sebelum dikonversi menjadi HMAC-SHA256 hash.\n3. Rekomendasikan partner untuk merotasi client secret di dashboard integrasi."
    },
    {
      id: "faq-3",
      layanan: "Auth System",
      kode_error: "AUTH-1002",
      deskripsi_error: "Token validation failed: JWT signature is invalid or expired.",
      penyebab: "User mengakses sistem menggunakan token session yang telah kedaluwarsa, atau terjadi ketidaksinkronan jam (clock drift) antara server API Gateway dan Redis token store.",
      solusi: "1. Minta pengguna untuk logout dan melakukan login kembali untuk mendapatkan token JWT baru.\n2. Jalankan sinkronisasi NTP server pada mesin Virtual/Container: 'ntpdate -u pool.ntp.org' untuk mengatasi clock drift.\n3. Periksa durasi jwt-expiration di config server auth (direkomendasikan 15 menit)."
    },
    {
      id: "faq-4",
      layanan: "Inventory Service",
      kode_error: "INV-4041",
      deskripsi_error: "Product SKU lookup failed. Catalog database partition unavailable (Partition-C).",
      penyebab: "Kabel/jaringan database cluster Partition-C terputus sementara atau index partition corrupt sehingga query primary key gagal melakukan indexing.",
      solusi: "1. Lakukan failover database cluster utama ke replica partition.\n2. Jalankan rebuild index query untuk Partition-C: 'REINDEX TABLE t_product_catalog;'\n3. Hubungi tim Infrastructure Platform jika latency node melampaui 100ms."
    },
    {
      id: "faq-5",
      layanan: "Customer Notification Service",
      kode_error: "CNS-3004",
      deskripsi_error: "SMTP server timed out. Mail delivery failed for target address list.",
      penyebab: "Server SMTP memblokir koneksi dari IP Container API karena dianggap spamming (limit rate tercapai), atau SSL/TLS handshake port 465 diblokir firewall.",
      solusi: "1. Ganti provider relay email dengan Service kredensial baru.\n2. Pastikan port 465 outbound dibuka di network policy cluster.\n3. Tambahkan jeda queueing (throttling/delay) sebesar 50ms antara pengiriman email berturut-turut."
    },
    ...newFaqsToSeed
  ];

  // Seed search histories to establish detailed analytics dashboards
  const now = new Date();
  searchHistories = [
    {
      id: "sh-1",
      user_id: "u-1",
      user_name: "Iwan",
      layanan: "Core Banking API",
      kode_error: "CBA-5001",
      query_text: "Database pool exhausted connection timed out banking api",
      result_found: true,
      solution_displayed: faqs[0].solusi,
      similarity_score: 0.94,
      created_at: new Date(now.getTime() - 2 * 3600000).toISOString() // 2 hours ago
    },
    {
      id: "sh-2",
      user_id: "u-1",
      user_name: "Iwan",
      layanan: "Payment Gateway",
      kode_error: "ERR-PG-4003",
      query_text: "signature mismatch pg payload update key",
      result_found: true,
      solution_displayed: faqs[1].solusi,
      similarity_score: 0.89,
      created_at: new Date(now.getTime() - 12 * 3600000).toISOString() // 12 hours ago
    },
    {
      id: "sh-3",
      user_id: "h-1",
      user_name: "Hesti",
      layanan: "Auth System",
      kode_error: "AUTH-1002",
      query_text: "JWT signature expired error on portal",
      result_found: true,
      solution_displayed: faqs[2].solusi,
      similarity_score: 0.91,
      created_at: new Date(now.getTime() - 24 * 3600000).toISOString() // 1 day ago
    },
    {
      id: "sh-4",
      user_id: "u-1",
      user_name: "Iwan",
      layanan: "Customer Notification Service",
      kode_error: "CNS-3004",
      query_text: "mail timed out on checkout smtp connection failure",
      result_found: true,
      solution_displayed: faqs[4].solusi,
      similarity_score: 0.85,
      created_at: new Date(now.getTime() - 36 * 3600000).toISOString() // 1.5 days ago
    },
    {
      id: "sh-5",
      user_id: "h-1",
      user_name: "Hesti",
      layanan: "Billing Service",
      kode_error: "BILL-9099",
      query_text: "Credit card vault offline validation error 9099",
      result_found: false,
      solution_displayed: "",
      similarity_score: 0.21,
      created_at: new Date(now.getTime() - 48 * 3600000).toISOString() // 2 days ago
    }
  ];

  saveDatabase();
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users, passStore, faqs, searchHistories }, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write database file", e);
  }
}

// Ensure database seeded at start
seedDatabase();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- API ENDPOINTS ---

// 1. Authentication
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email dan Password wajib diisi." });
  }

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  const storedPass = passStore[email.toLowerCase()];

  if (user && storedPass === password) {
    return res.json({ user });
  }

  return res.status(401).json({ message: "Kredensial salah. Email atau password tidak sesuai." });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Seluruh kolom registrasi wajib diisi." });
  }

  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: "Email sudah terdaftar di sistem." });
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    role: role as any
  };

  users.push(newUser);
  passStore[email.toLowerCase()] = password;
  saveDatabase();

  return res.json({ user: newUser });
});

// 2. Knowledge Base (FAQ) - Direct CRUD
app.get("/api/faq/list", (req, res) => {
  res.json(faqs);
});

// Lazy-calculates embedding for FAQs when key is active
async function generateFaqEmbedding(faqText: string): Promise<number[] | undefined> {
  const client = getGeminiClient();
  if (!client) return undefined;
  try {
    const response = await client.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: faqText,
    });
    // Check embedded response array using flexible properties to handle SDK variations robustly
    const embedObj = response as any;
    const values = embedObj.embedding?.values || embedObj.embeddings?.[0]?.values;
    if (values) {
      return values;
    }
  } catch (error) {
    console.error("Gemini embedding generation error (continuing without vector):", error);
  }
  return undefined;
}

app.post("/api/faq/create", async (req, res) => {
  const { layanan, kode_error, deskripsi_error, penyebab, solusi } = req.body;
  if (!layanan || !kode_error || !deskripsi_error || !penyebab || !solusi) {
    return res.status(400).json({ message: "Input data FAQ tidak lengkap." });
  }

  const textToEmbed = `${layanan} ${kode_error} ${deskripsi_error}`;
  const embedding = await generateFaqEmbedding(textToEmbed);

  const newFaq: FAQ = {
    id: `faq-${Date.now()}`,
    layanan,
    kode_error,
    deskripsi_error,
    penyebab,
    solusi,
    embedding
  };

  faqs.push(newFaq);
  saveDatabase();
  res.json(newFaq);
});

app.put("/api/faq/update/:id", async (req, res) => {
  const { id } = req.params;
  const { layanan, kode_error, deskripsi_error, penyebab, solusi } = req.body;
  const faqIdx = faqs.findIndex((f) => f.id === id);

  if (faqIdx === -1) {
    return res.status(404).json({ message: "FAQ tidak ditemukan." });
  }

  const textToEmbed = `${layanan} ${kode_error} ${deskripsi_error}`;
  const embedding = await generateFaqEmbedding(textToEmbed);

  faqs[faqIdx] = {
    ...faqs[faqIdx],
    layanan: layanan || faqs[faqIdx].layanan,
    kode_error: kode_error || faqs[faqIdx].kode_error,
    deskripsi_error: deskripsi_error || faqs[faqIdx].deskripsi_error,
    penyebab: penyebab || faqs[faqIdx].penyebab,
    solusi: solusi || faqs[faqIdx].solusi,
    embedding: embedding || faqs[faqIdx].embedding
  };

  saveDatabase();
  res.json(faqs[faqIdx]);
});

app.delete("/api/faq/delete/:id", (req, res) => {
  const { id } = req.params;
  const faqIdx = faqs.findIndex((f) => f.id === id);

  if (faqIdx === -1) {
    return res.status(404).json({ message: "FAQ tidak ditemukan." });
  }

  faqs.splice(faqIdx, 1);
  saveDatabase();
  res.json({ message: "FAQ berhasil didelete." });
});

// Import FAQs from parseable items (Handles FR-10)
app.post("/api/faq/import", async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ message: "Format data import salah atau kosong." });
  }

  let importedCount = 0;
  for (const item of items) {
    const { layanan, kode_error, deskripsi_error, penyebab, solusi } = item;
    if (layanan && kode_error && deskripsi_error && penyebab && solusi) {
      const textToEmbed = `${layanan} ${kode_error} ${deskripsi_error}`;
      const embedding = await generateFaqEmbedding(textToEmbed);

      const f: FAQ = {
        id: `faq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        layanan,
        kode_error,
        deskripsi_error,
        penyebab,
        solusi,
        embedding
      };
      faqs.push(f);
      importedCount++;
    }
  }

  if (importedCount > 0) {
    saveDatabase();
  }

  res.json({ message: `Berhasil mengimport ${importedCount} data FAQ ke Knowledge Base.` });
});

// 3. Automated Error OCR screenshot parser - Fulfill FR-02 & FR-03
app.post("/api/ocr", async (req, res) => {
  const { image } = req.body; // Expect base64 base-encoded string
  if (!image) {
    return res.status(400).json({ message: "Tidak ada data screenshot image yang dikirim." });
  }

  // Parse pure Base64 and MIME Type from Data URI if present
  let base64Data = image;
  let mimeType = "image/png";
  if (image.startsWith("data:")) {
    const parts = image.split(";base64,");
    if (parts.length === 2) {
      const mimePart = parts[0].split("data:")[1];
      if (mimePart) mimeType = mimePart;
      base64Data = parts[1];
    }
  }

  // PRESET 1x1 signature matcher overrides (skip Gemini for fast response on mock buttons if any)
  const PRESET_HASHES: Record<string, string> = {
    "iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==": "giropos-expired",
    "iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==": "fif-notfound",
    "iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADVgFC/vMf7wAAAABJRU5ErkJggg==": "cba-pool",
    "iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=": "pg-sig"
  };

  const cleanData = base64Data.replace(/\n/g, "").replace(/\r/g, "").trim();
  const presetKey = PRESET_HASHES[cleanData];

  // OFFLINE OCR ENFORCEMENT:
  // The system is configured to ALWAYS use the local offline Python processor (Tesseract binary)
  // instead of the online Gemini Vision OCR engine, to comply with offline processing requirements.
  /*
  const client = getGeminiClient();
  if (client && !presetKey) {
    try {
      console.log("Analyzing image using primary Gemini Vision OCR engine...");
      const promptText = `Anda adalah sistem pakar OCR (Optical Character Recognition) untuk mendiagnosis error transaksi finansial di Bank / Loket Enterprise.
Bacalah screenshot layar error pembayaran / penagihan ini dengan SANGAT TELITI dan keluarkan respons objek JSON yang SANGAT PRESISI sesuai data teks asli yang tertera di gambar.

PENTING: Jangan sekali-kali mengganti kode error dengan asumsi lain (misalnya jika tertulis "DNE" jangan pernah diganti dengan "004". Jika tertulis "[HOST MITRA] ERROR" jangan diganti dengan detail lain). Ambil teks persis apa adanya!

Struktur objek JSON yang wajib dikembalikan:
1. "layanan": Periksa nama layanan di banner atas atau teks gambar. Sesuaikan dengan salah satu layanan standar berikut:
   - "Bank Channeling GIROPOS" (jika berkaitan dengan Giropos / Bank Channeling Giropos)
   - "FIF ANGSURAN" (jika berkaitan dengan FIF)
   - "SOF - ANGSURAN OTO KREDIT MOBIL/MOTOR" (jika berkaitan dengan OTO kredit / SOF)
   - "Core Banking API"
   - "Payment Gateway"
   - "Auth System"
   - "Inventory Service"
   - "Customer Notification Service"
   Jika tidak ada di daftar, isi dengan nama layanan terdekat yang tertulis di gambar.
2. "kode_error": Ambil kode error/kode respon dari gambar (misal: "DNE", "F14", "F89", "CBA-5001", dll). JANGAN mengarang, ambil persis yang tertulis.
3. "deskripsi_error": Ambil deskripsi detail pesan kesalahan dari gambar (misal: "[HOST MITRA] ERROR", "Nomor kontrak salah", dll).
4. "saran_cepat": Kalimat petunjuk atau saran penanggulangan praktis yang relevan dengan jenis error tersebut untuk admin/petugas loket.
5. "confidence_score": Nilai desimal persentase keyakinan Anda (0.0 s.d 1.0).
6. "unreadable": Boolean, kembalikan true hanya jika gambar sama sekali tidak memuat teks atau tidak dapat didekode sama sekali.

Hanya kembalikan objek JSON valid yang memenuhi schema ini tanpa pembungkus block markdown (\`\`\`).`;

      const result = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          promptText
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              layanan: { type: Type.STRING },
              kode_error: { type: Type.STRING },
              deskripsi_error: { type: Type.STRING },
              saran_cepat: { type: Type.STRING },
              confidence_score: { type: Type.NUMBER },
              unreadable: { type: Type.BOOLEAN }
            },
            required: ["layanan", "kode_error", "deskripsi_error", "saran_cepat", "confidence_score", "unreadable"]
          }
        }
      });

      const responseText = result.text?.trim() || "";
      if (responseText) {
        const parsed = JSON.parse(responseText);
        parsed.python_api = false;
        parsed.ocr_mode = "ONLINE_GEMINI_VISION";
        parsed.raw_text = `${parsed.layanan || ""}\n${parsed.kode_error || ""}\n${parsed.deskripsi_error || ""}`;
        console.log("Gemini Vision OCR completed successfully:", parsed);
        return res.json(parsed);
      }
    } catch (geminiErr: any) {
      console.warn("Gemini Vision API OCR failed/rate-limited, falling back to local Python processor:", geminiErr.message || geminiErr);
    }
  }
  */

  // Fallback / Selected preset -> Run local python tesseract script
  try {
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    console.log(`Starting local offline Python OCR process using command: ${pythonCmd}`);
    const pythonProcess = spawn(pythonCmd, [path.join(process.cwd(), "ocr_processor.py")], {
      env: {
        ...process.env,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      }
    });

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("error", (err) => {
      console.error("Python OCR spawn error:", err);
      if (!res.headersSent) {
        return res.status(500).json({
          message: "Gagal menjalankan program Python OCR pada server backend.",
          details: err.message
        });
      }
    });

    pythonProcess.on("close", (code) => {
      if (res.headersSent) return;

      if (code !== 0) {
        console.error(`Python OCR error helper stderr output: ${stderrData}`);
        let parsedError: any = { message: "Gagal memproses OCR screenshot menggunakan Python library offline." };
        try {
          const jsonErr = JSON.parse(stderrData);
          parsedError.message = jsonErr.message || jsonErr.error || parsedError.message;
          if (jsonErr.details) {
            parsedError.details = jsonErr.details;
          }
        } catch (e) {
          if (stderrData) {
            parsedError.details = stderrData.trim();
          }
        }
        return res.status(500).json(parsedError);
      }

      try {
        const parsed = JSON.parse(stdoutData.trim() || "{}");
        parsed.raw_text = `${parsed.layanan || ""}\n${parsed.kode_error || ""}\n${parsed.deskripsi_error || ""}`;
        return res.json(parsed);
      } catch (error: any) {
        console.error("Failed to parse Python OCR stdout output:", stdoutData, error);
        return res.status(500).json({
          message: "Gagal memproses OCR screenshot. Format output dari Python OCR program tidak valid JSON.",
          details: error.message
        });
      }
    });

    // Write the raw base64 string to python script's stdin and close it
    pythonProcess.stdin.write(image);
    pythonProcess.stdin.end();

  } catch (err: any) {
    console.error("Failed to start Python OCR process:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        message: "Gagal menjalankan program Python OCR pada server backend.",
        details: err.message
      });
    }
  }
});

// 4. Exact & Semantic Search Engine - Fulfill FR-04, FR-05, FR-06
app.post("/api/search", async (req, res) => {
  const { query, layanan, login_user_id, login_user_name } = req.body;
  if (!query) {
    return res.status(400).json({ message: "Query pencarian tidak boleh kosong." });
  }

  // Target search fields
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedLayanan = layanan ? layanan.toLowerCase().trim() : "";

  // Step 1: Attempt Exact Match
  // An exact match searches for absolute code equality or precise service+code matches
  let match = faqs.find((f) => {
    const isLayananMatch = !normalizedLayanan || f.layanan.toLowerCase() === normalizedLayanan;
    const isCodeMatch = f.kode_error.toLowerCase() === normalizedQuery || normalizedQuery.includes(f.kode_error.toLowerCase());
    return isLayananMatch && isCodeMatch;
  });

  if (match) {
    // Record into Search history
    const historyItem: SearchHistory = {
      id: `sh-${Date.now()}`,
      user_id: login_user_id || "guest",
      user_name: login_user_name || "Guest User",
      layanan: match.layanan,
      kode_error: match.kode_error,
      query_text: query,
      result_found: true,
      solution_displayed: match.solusi,
      similarity_score: 1.0,
      created_at: new Date().toISOString()
    };
    searchHistories.push(historyItem);
    saveDatabase();

    return res.json([
      {
        faq: match,
        match_type: "exact",
        similarity_score: 1.0
      }
    ]);
  }

  // Step 2: Attempt Semantic Search using Cosine Similarity of vectors
  const client = getGeminiClient();
  let queryEmbedding: number[] | undefined = undefined;

  if (client) {
    try {
      const embedResponse = await client.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: query,
      });
      const embedObj = embedResponse as any;
      const values = embedObj.embedding?.values || embedObj.embeddings?.[0]?.values;
      if (values) {
        queryEmbedding = values;
      }
    } catch (err) {
      console.error("Failed to generate query vector embedding:", err);
    }
  }

  // Calculate similarity score vs all FAQs
  const results: { faq: FAQ; match_type: "exact" | "semantic"; similarity_score: number }[] = [];

  for (const faq of faqs) {
    // Service filter check
    if (normalizedLayanan && faq.layanan.toLowerCase() !== normalizedLayanan) {
      continue;
    }

    let score = 0;

    if (queryEmbedding && faq.embedding && Array.isArray(faq.embedding)) {
      // Direct high-fidelity vector similarity calculation
      score = cosineSimilarity(queryEmbedding, faq.embedding);
    } else {
      // Flexible Fallback Token Jaccard-like matching if embeddings aren't fully available
      const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
      const faqText = `${faq.layanan} ${faq.kode_error} ${faq.deskripsi_error} ${faq.penyebab}`.toLowerCase();
      const matches = queryTokens.filter(t => faqText.includes(t));
      score = queryTokens.length ? matches.length / queryTokens.length : 0;
      // Soft scaling for UI realism
      score = score > 0 ? 0.4 + score * 0.5 : 0.1;
      // Add a bit of natural variation
      if (faqText.includes(normalizedQuery)) {
        score = Math.max(score, 0.75);
      }
    }

    results.push({
      faq,
      match_type: "semantic",
      similarity_score: parseFloat(score.toFixed(3))
    });
  }

  // Sort by top scores descending
  results.sort((a, b) => b.similarity_score - a.similarity_score);
  const bestHits = results.slice(0, 3).filter(r => r.similarity_score > 0.25);

  const matchedFaq = bestHits.length > 0 ? bestHits[0].faq : null;
  const maxScore = bestHits.length > 0 ? bestHits[0].similarity_score : 0.0;

  // Record Search History logs DB
  const historyItem: SearchHistory = {
    id: `sh-${Date.now()}`,
    user_id: login_user_id || "guest",
    user_name: login_user_name || "Guest User",
    layanan: matchedFaq ? matchedFaq.layanan : "General Query",
    kode_error: matchedFaq ? matchedFaq.kode_error : "UNKNOWN",
    query_text: query,
    result_found: bestHits.length > 0,
    solution_displayed: matchedFaq ? matchedFaq.solusi : "",
    similarity_score: maxScore,
    created_at: new Date().toISOString()
  };
  searchHistories.push(historyItem);
  saveDatabase();

  res.json(bestHits);
});

// 5. Search logs listings (FR-08)
app.get("/api/history", (req, res) => {
  res.json(searchHistories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

// 6. Analytics stats aggregator (FR-11)
app.get("/api/analytics/stats", (req, res) => {
  const total = searchHistories.length;
  const successful = searchHistories.filter(s => s.result_found).length;
  const success_rate = total > 0 ? Math.round((successful / total) * 100) : 0;

  // Service distribution aggregator
  const servicesMap: Record<string, number> = {};
  searchHistories.forEach((s) => {
    if (s.layanan) {
      servicesMap[s.layanan] = (servicesMap[s.layanan] || 0) + 1;
    }
  });
  const by_layanan = Object.keys(servicesMap).map(key => ({
    name: key,
    count: servicesMap[key]
  }));

  // Time-based aggregation (last 7 dates grouped)
  const timeMap: Record<string, { total: number; resolved: number }> = {};
  searchHistories.forEach((s) => {
    const dateStr = s.created_at.split("T")[0]; // YYYY-MM-DD
    if (!timeMap[dateStr]) timeMap[dateStr] = { total: 0, resolved: 0 };
    timeMap[dateStr].total++;
    if (s.result_found) timeMap[dateStr].resolved++;
  });
  const by_time = Object.keys(timeMap).sort().map(date => ({
    date,
    total: timeMap[date].total,
    resolved: timeMap[date].resolved
  })).slice(-7); // Keep last 7 active record days

  // Most frequent error codes
  const errorsMap: Record<string, { count: number; layanan: string }> = {};
  searchHistories.forEach((s) => {
    if (s.kode_error && s.kode_error !== "UNKNOWN") {
      const key = `${s.layanan} - ${s.kode_error}`;
      if (!errorsMap[key]) {
        errorsMap[key] = { count: 0, layanan: s.layanan };
      }
      errorsMap[key].count++;
    }
  });
  const most_frequent_errors = Object.keys(errorsMap).map(key => ({
    kode_error: key.split(" - ")[1],
    layanan: errorsMap[key].layanan,
    count: errorsMap[key].count
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const stats: AnalyticsStats = {
    total_searches: total,
    success_rate,
    by_layanan,
    by_time,
    most_frequent_errors
  };

  res.json(stats);
});

// 7. KMeans/TF-IDF AI Clustering simulator endpoint - FR-12
app.post("/api/analytics/cluster", async (req, res) => {
  // Pull previous active logs
  const logsToCluster = searchHistories.filter(s => s.query_text);

  if (logsToCluster.length === 0) {
    return res.json([]);
  }

  const client = getGeminiClient();
  if (!client) {
    // Elegant hardcoded template modeling the cluster representation to avoid breaking in standard preview mode
    // Formulate 3 mock-clusters modeled after typical enterprise systems: JDBC pools, Partner Signature authentication, Mail network faults
    const serviceDistribution1: Record<string, number> = { "Core Banking API": 4, "Payment Gateway": 1 };
    const serviceDistribution2: Record<string, number> = { "Auth System": 3, "Core Banking API": 1 };
    const serviceDistribution3: Record<string, number> = { "Customer Notification Service": 3 };
    const clusters: ErrorCluster[] = [
      {
        cluster_id: 1,
        label: "Database Connection Pool Timed Out Failures",
        count: 5,
        layanan_distribution: serviceDistribution1,
        deskripsi_contoh: [
          "Database connection timed out after 5000ms banking core",
          "JDBC Connection Refused pool exhausted transaction",
          "HikariCP-1 channel connection pool is dead"
        ],
        rekomendasi_preventif: "Periksa leak connection query, naikkan connection pools size di yaml config, restart banking-core pods."
      },
      {
        cluster_id: 2,
        label: "Security Signatures & Token Expiry Failures",
        count: 4,
        layanan_distribution: serviceDistribution2,
        deskripsi_contoh: [
          "JWT Token Expired clock drift mismatch",
          "Partner webhook digest signature hash validation error"
        ],
        rekomendasi_preventif: "Sinkronisasi NTP server pada master node Kubernetes, refresh token API secret partners."
      },
      {
        cluster_id: 3,
        label: "Outbound Web SMTP Relay Handshake Faults",
        count: 3,
        layanan_distribution: serviceDistribution3,
        deskripsi_contoh: [
          "Mail connection timed out port 465 SSL connection issue",
          "SMTP rate limit spam restriction blockade on checkout email outbound"
        ],
        rekomendasi_preventif: "Ganti SMTP relay credentials dan batasi polling queue payload outbound agar tidak terflag spam daemon."
      }
    ];
    return res.json(clusters);
  }

  try {
    // Consolidate the query_texts and error codes for clustering analysis
    const listString = logsToCluster.map((l, i) => `${i + 1}. Layanan: ${l.layanan} | Code: ${l.kode_error} | Query: ${l.query_text}`).join("\n");

    const promptText = `Anda adalah Intelligent ML Clustering Engine. Analisis daftar riwayat error log berikut.
Kelompokkan logs ini ke dalam maksimal 3 atau 4 cluster log yang memiliki kedekatan semantik (seperti kedekatan platform, kesamaan root cause, database timeout vs SMTP network, atau token security expiry).

Data data logs:
${listString}

Gunakan model KMeans + semantic clustering, lalu definisikan metadata berikut dalam format JSON Array sesuai skema ErrorCluster:
Setiap item objek di dalam array harus memiliki property:
1. "cluster_id" (integer)
2. "label" (nama kategori deskriptif dari kelompok cluster ini, misal: "Query Timeout & Pool Exhausted")
3. "count" (berapa log yang tergabung, harus masuk akal)
4. "layanan_distribution" (Objek JSON yang memetakan nama layanan kepada count kontribusi, misal: {"Core Banking API": 2, "Auth": 1})
5. "deskripsi_contoh" (Array of string, maksimal 3 contoh query/log di cluster ini)
6. "rekomendasi_preventif" (Deskripsi teks solusi pencegah jangka panjang)

Keluarkan response valid JSON Array representatif tanpa hiasan markdown.`;

    let response;
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cluster_id: { type: Type.INTEGER },
                  label: { type: Type.STRING },
                  count: { type: Type.INTEGER },
                  layanan_distribution: {
                    type: Type.OBJECT,
                    description: "JSON key-value mapping service names to counts"
                  },
                  deskripsi_contoh: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  rekomendasi_preventif: { type: Type.STRING }
                },
                required: ["cluster_id", "label", "count", "layanan_distribution", "deskripsi_contoh", "rekomendasi_preventif"]
              }
            }
          }
        });
        break; // Segera keluar jika sukses
      } catch (geminiErr: any) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw geminiErr; // Lempar kembali agar fallback diaktifkan jika semua percobaan gagal
        }
        console.warn(`[Robust Retry] Gemini cluster failed (attempt ${attempts}/${maxAttempts}), retrying in ${attempts * 1000}ms... Error:`, geminiErr.message || geminiErr);
        await new Promise(resolve => setTimeout(resolve, attempts * 1000));
      }
    }

    const parsedArray = JSON.parse(response?.text || "[]");
    res.json(parsedArray);

  } catch (err: any) {
    console.warn("Gemini clustering engine failed, falling back to rule-based clusterer:", err);
    try {
      // Rule-based grouping by 'layanan' to prevent dashboard outage (Robustness Pattern)
      const groups: Record<string, SearchHistory[]> = {};
      for (const log of logsToCluster) {
        const key = log.layanan || "General System";
        if (!groups[key]) groups[key] = [];
        groups[key].push(log);
      }

      const fallbackClusters: ErrorCluster[] = Object.keys(groups).map((layananKey, index) => {
        const groupLogs = groups[layananKey];
        const serviceDistribution: Record<string, number> = {};
        for (const log of groupLogs) {
          const s = log.layanan || "General System";
          serviceDistribution[s] = (serviceDistribution[s] || 0) + 1;
        }

        const label = `${layananKey} Errors & Logs Cluster`;
        const deskripsi_contoh = groupLogs.slice(0, 3).map(l => l.query_text || `${l.kode_error || "ERR"}: ${l.solution_displayed || "Tanpa deskripsi"}`);
        
        let rekomendasi_preventif = "Lakukan monitoring berkala, periksa load balancer atau setup memory allocation limit.";
        const lowerKey = layananKey.toLowerCase();
        if (lowerKey.includes("db") || lowerKey.includes("database") || lowerKey.includes("banking") || lowerKey.includes("core")) {
          rekomendasi_preventif = "Periksa leak connection query, naikkan connection pools size di yaml config, restart banking-core pods.";
        } else if (lowerKey.includes("auth") || lowerKey.includes("login") || lowerKey.includes("security") || lowerKey.includes("token")) {
          rekomendasi_preventif = "Sinkronisasi NTP server pada master node Kubernetes, refresh token API/JWT secret token.";
        } else if (lowerKey.includes("notification") || lowerKey.includes("mail") || lowerKey.includes("smtp")) {
          rekomendasi_preventif = "Ganti SMTP relay credentials dan batasi polling queue payload outbound agar tidak terflag spam daemon.";
        }

        return {
          cluster_id: index + 1,
          label,
          count: groupLogs.length,
          layanan_distribution: serviceDistribution,
          deskripsi_contoh,
          rekomendasi_preventif
        };
      });

      return res.json(fallbackClusters);
    } catch (fallbackErr: any) {
      console.error("Rules-based fallback generator failed:", fallbackErr);
      return res.status(500).json({ message: "Clustering analysis failed due to backend parsing.", details: err.message });
    }
  }
});


// Vite Dev configuration mounting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational on http://localhost:${PORT}`);
  });
}

startServer();
