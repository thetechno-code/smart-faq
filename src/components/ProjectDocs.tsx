/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, FileText, Settings, ShieldAlert, CheckSquare, Layers, Eye } from "lucide-react";

interface DocSection {
  id: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

export default function ProjectDocs() {
  const [activeDoc, setActiveDoc] = useState<string>("brd");

  const docs: Record<string, DocSection> = {
    brd: {
      id: "brd",
      title: "1. Business Requirement Document (BRD)",
      icon: BookOpen,
      content: (
        <div className="space-y-6 text-slate-300">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">1. Pendahuluan & Latar Belakang</h3>
            <p className="leading-relaxed">
              Dalam operasional IT perusahaan enterprise modern, stabilitas sistem aplikasi merupakan prioritas utama. Ketika insiden error terjadi pada sistem produksi (misalnya core banking, payment gateway, authentication server), helpdesk tingkat 1 dan pengguna operasional seringkali mengalami kesulitan mendeteksi penyebab teknis secara cepat. Proses pencarian solusi dalam wiki internal kerap memakan waktu berjam-jam, mengorbankan SLA (Service Level Agreement). 
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">2. Deskripsi Produk</h3>
            <p className="leading-relaxed">
              <strong>Smart FAQ Error Assistant</strong> adalah platform asisten penanganan error berbasis kecerdasan buatan. Sistem ini menggabungkan teknologi OCR (Optical Character Recognition) untuk mengekstrak teks error dari tangkapan layar (screenshot), sistem exact match untuk penemuan solusi instan dari database SQLite, serta algoritma Semantic Search berbasis Sentence Transformer Vector Embedding untuk mendeteksi kesamaan solusi meskipun struktur kalimat berbeda.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">3. Pemangku Kepentingan (Stakeholders)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>User Operasional/Customer:</strong> Mengunggah screenshot kendala untuk memperoleh panduan solusi instan mandiri (self-service).</li>
              <li><strong>Helpdesk / IT Support:</strong> Mempercepat investigasi log error dan penanganan masalah tingkat pertama (First Response).</li>
              <li><strong>Sysadmin / IT Manager:</strong> Memantau kestabilan platform via dashboard analitik cluster tren insiden error secara proaktif.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">4. Aturan Bisnis & Kriteria Keberhasilan</h3>
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
              <p>📌 <strong>Aturan Bisnis:</strong> Penanganan error harus memprioritaskan pencarian Exact Match pada kode error spesifik. Jika gagal, pencarian fallback otomatis ke semantic search dengan ambang similarity score {">"} 40%.</p>
              <p>📌 <strong>SLA & Keberhasilan:</strong> OCR mendeteksi teks di bawah 5 detik, serta semantic score clustering membagi kategori secara otomatis.</p>
            </div>
          </div>
        </div>
      )
    },
    fsd: {
      id: "fsd",
      title: "2. Functional Specification Document (FSD)",
      icon: FileText,
      content: (
        <div className="space-y-6 text-slate-300">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Spesifikasi Kebutuhan Fungsional (FR)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-3 border border-slate-800">Kode FR</th>
                    <th className="p-3 border border-slate-800">Fitur/Fungsi</th>
                    <th className="p-3 border border-slate-800">Detail Implementasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-3 font-semibold text-blue-400">FR-01</td>
                    <td className="p-3">Upload Screenshot</td>
                    <td className="p-3">Mendukung format gambar JPEG/PNG maksimal ukuran file 5 MB.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-blue-400">FR-02</td>
                    <td className="p-3">OCR Processing</td>
                    <td className="p-3">Melakukan ekstraksi teks visual dari screenshot menggunakan model vision OCR terintegrasi secara asinkron.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-blue-400">FR-03</td>
                    <td className="p-3">Parser Regex / Extract</td>
                    <td className="p-3">Memisahkan teks hasil OCR ke dalam atribut <i>Layanan</i>, <i>Kode Error</i>, dan <i>Deskripsi Error</i>.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-blue-400">FR-04</td>
                    <td className="p-3">Exact Match Search</td>
                    <td className="p-3">Mencari kecocokan langsung pada database SQL/SQLite sesuai kode error & layanan.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-blue-400">FR-05</td>
                    <td className="p-3">Semantic Search fallback</td>
                    <td className="p-3">Membangkitkan vector embedding query menggunakan AI dan menjalankan perbandingan cosine similarity terhadap Knowledge Base jika match eksak gagal.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-blue-400">FR-09</td>
                    <td className="p-3">Knowledge Base CRUD</td>
                    <td className="p-3">Manajemen penyimpanan Solusi, Penyebab, dan FAQ oleh role Helpdesk/Admin.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-blue-400">FR-11</td>
                    <td className="p-3">Analytics Dashboard</td>
                    <td className="p-3">Visualisasi grafik volume error harian, kegagalan paling sering, dan efisiensi penyelesaian (SLA).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-blue-400">FR-12</td>
                    <td className="p-3">Error Clustering</td>
                    <td className="p-3">Engine clustering semantik untuk memetakan gugus kelompok error serupa (K-means).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    },
    tdd: {
      id: "tdd",
      title: "3. Technical Design Document (TDD)",
      icon: Layers,
      content: (
        <div className="space-y-6 text-slate-300">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Arsitektur Backend & AI Pipeline</h3>
            <p className="leading-relaxed mb-4">
              Sistem dibangun menggunakan perpaduan modular <strong>Node.js Express</strong> dan <strong>Google Gemini API Platform</strong>. Arsitektur data mengadopsi struktur tabel relasional yang direpresentasikan menggunakan serialisasi file database json persisten untuk performa IO yang kencang di lingkungan container serverless.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs border border-slate-800 space-y-2">
              <p className="text-emerald-400">// Skema Algoritma Cosine Similarity</p>
              <p className="text-slate-400">
                Similarity = (A · B) / (||A|| * ||B||) <br />
                A = Vector Query (all-MiniLM-L6-v2 / gemini-embedding-2-preview) <br />
                B = Vector FAQ (stored in SQL Database/Memory JSON)
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Keamanan & RBAC Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-900 rounded border border-slate-800">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono">User</span>
                <p className="text-xs text-slate-400 mt-2">Mencari solusi error, melakukan capture OCR, dan melihat riwayat pribadinya sendiri saja.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded border border-slate-800">
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">Helpdesk</span>
                <p className="text-xs text-slate-400 mt-2">Seluruh akses User + hak melihat visualisasi analitik penuh, ekspor logs, mengimpor FAQ massal via Excel/CSV.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded border border-slate-800">
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono">Admin</span>
                <p className="text-xs text-slate-400 mt-2">Seluruh akses Helpdesk + CRUD Knowledge Base, rotasi kunci API (jika ada), manipulasi users & hak akses.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    manual: {
      id: "manual",
      title: "4. User Manual (Panduan Pengguna)",
      icon: Eye,
      content: (
        <div className="space-y-6 text-slate-300">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm mt-1">1</div>
              <div>
                <h4 className="text-white font-medium">Melakukan Deteksi Error Otomatis</h4>
                <p className="text-sm text-slate-400">Masuk ke modul "Unggah Screenshot", drag-and-drop file gambar error berukuran max 5MB. Klik "Proses OCR". Sistem akan membedah parameter error secara instan.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm mt-1">2</div>
              <div>
                <h4 className="text-white font-medium">Melakukan Pencarian FAQ Semantik</h4>
                <p className="text-sm text-slate-400">Ketik kata kunci atau pesan error pada input pencarian. Jika kode error eksak tidak terdeteksi, AI secara pintar memetakan kata bermiripan secara semantik.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm mt-1">3</div>
              <div>
                <h4 className="text-white font-medium">Manajemen FAQs oleh Operator Support</h4>
                <p className="text-sm text-slate-400">Akes modul "Kelola Knowledge Base" (khusus Admin & Helpdesk) untuk melakukan entry update perbaikan sistem atau mengunggah CSV template FAQ baru.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    deploy: {
      id: "deploy",
      title: "5. Deployment Guide",
      icon: Settings,
      content: (
        <div className="space-y-6 text-slate-300">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Prasyarat Lingkungan (Environment Prerequisites)</h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Node.js versi 18 atau lebih baru</li>
              <li>NPM / PNPM package manager</li>
              <li>Valid Google Gemini API Key (disetting di .env)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Langkah Instalasi Mandiri</h3>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs border border-slate-800 space-y-2">
              <p className="text-slate-400"># 1. Clone repository & install depedencies</p>
              <p className="text-blue-400">npm install</p>
              <p className="text-slate-400"># 2. Atur kredensial kunci API di file .env</p>
              <p className="text-emerald-400">GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"</p>
              <p className="text-slate-400"># 3. Jalankan server lokal development full-stack</p>
              <p className="text-blue-400">npm run dev</p>
            </div>
          </div>
        </div>
      )
    },
    testing: {
      id: "testing",
      title: "6. Testing & UAT Scenario",
      icon: CheckSquare,
      content: (
        <div className="space-y-6 text-slate-300">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Skenario Pengujian Mutu (Quality Assurance)</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 rounded border border-slate-800">
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">UAT-01: Upload & OCR</span>
                <p className="text-sm text-white font-medium mt-1">Menguji Ekstraksi Screenshot Error</p>
                <p className="text-xs text-slate-400 mt-1">Langkah: Mengunggah gambar error core banking CBA-5001. Hasil diharapkan: Sistem berhasil melakukan translasi visual text dan mengisi form Layanan & Kode Error secara otomatis kurang dari 5 detik.</p>
              </div>
              <div className="p-4 bg-slate-900 rounded border border-slate-800">
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">UAT-02: Semantic Match Fallback</span>
                <p className="text-sm text-white font-medium mt-1">Pecarian Menggunakan Sinofim Semantik</p>
                <p className="text-xs text-slate-400 mt-1">Langkah: Mengetik "sistem surat gagal terkirim melampaui waktu tunggu" ke form. Hasil diharapkan: Muncul FAQ dari kode CNS-3004 (SMTP Timeout) dengan score kesamaan semantik di atas 60% meskipun format query berbeda dengan deskripsi asli.</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full font-sans">
      {/* Scrollable Document Selector Left */}
      <div className="lg:col-span-4 space-y-2 h-[calc(100vh-140px)] overflow-y-auto pr-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-3">Enterprise Documents</h2>
        {Object.values(docs).map((doc) => {
          const Icon = doc.icon;
          const isActive = activeDoc === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-lg text-left transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium text-sm">{doc.title}</span>
            </button>
          );
        })}

        <div className="p-4 bg-slate-900/40 rounded-lg border border-slate-800/60 mt-6 text-xs text-slate-500">
          <p className="font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            Metodologi SDLC
          </p>
          <p>Dokumentasi ini disusun menggunakan standar rekayasa perangkat lunak enterprise dengan framework Agile Scrum dan metodologi inkremental.</p>
        </div>
      </div>

      {/* Structured Document Content Reader Right */}
      <div className="lg:col-span-8 bg-slate-900/65 rounded-xl border border-slate-850 p-6 lg:p-8 h-[calc(100vh-140px)] overflow-y-auto">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-800">
          {(() => {
            const ActiveIcon = docs[activeDoc].icon;
            return <ActiveIcon className="w-8 h-8 text-indigo-400" />;
          })()}
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{docs[activeDoc].title}</h2>
        </div>

        <div className="prose prose-invert max-w-none">
          {docs[activeDoc].content}
        </div>
      </div>
    </div>
  );
}
