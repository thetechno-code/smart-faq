/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Layers, Database, Shield, Workflow, Smartphone, RefreshCw } from "lucide-react";

interface DiagramSection {
  id: string;
  name: string;
  description: string;
  component: React.ReactNode;
}

export default function SystemDiagrams() {
  const [activeTab, setActiveTab] = useState<string>("architecture");

  const diagrams: Record<string, DiagramSection> = {
    architecture: {
      id: "architecture",
      name: "1. System Architecture Diagram",
      description: "Visualisasi struktur platform end-to-end fullstack antara Browser Client, Node Express middleware, dan Google Gemini AI.",
      component: (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-slate-900/60 rounded-lg">
            {/* User Layer */}
            <div className="text-center p-3 bg-indigo-600/20 rounded-md border border-indigo-500 w-full md:w-44 shadow-lg shadow-indigo-500/10">
              <Smartphone className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
              <div className="font-semibold text-xs text-white">Browser Client</div>
              <div className="text-[10px] text-slate-400">React + Vite SPA</div>
            </div>

            <div className="text-slate-600 font-mono text-lg animate-pulse">────►</div>

            {/* Application Server Layer */}
            <div className="text-center p-3 bg-blue-600/20 rounded-md border border-blue-500 w-full md:w-52 shadow-lg shadow-blue-500/10">
              <Layers className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <div className="font-semibold text-xs text-white">Express Backend (Port 3000)</div>
              <div className="text-[10px] text-slate-400">MVC Architecture & SQLite-alike JSON Store</div>
            </div>

            <div className="text-slate-600 font-mono text-lg animate-pulse">◄───►</div>

            {/* AI Integrations */}
            <div className="text-center p-3 bg-emerald-600/20 rounded-md border border-emerald-500 w-full md:w-48 shadow-lg shadow-emerald-500/10">
              <RefreshCw className="w-6 h-6 text-emerald-400 mx-auto mb-1 animate-spin" />
              <div className="font-semibold text-xs text-white">Google GenAI SDK</div>
              <div className="text-[10px] text-slate-400">OCR & Vector Embeddings</div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-lg space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alur Integrasi Layanan (Data Flows):</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              1. <strong>Screenshot Upload:</strong> User mengunggah error log screenshot berformat Base64 dari Client SPA.<br />
              2. <strong>Gemini OCR:</strong> Server mengarahkan payload ke model <code>gemini-2.5-flash</code> untuk ekstraksi teks error.<br />
              3. <strong>Vektor Embedding:</strong> Kueri teks dicarikan kecocokan semantiknya menggunakan cosine similarity di atas payload vector <code>gemini-embedding-2-preview</code>.<br />
              4. <strong>Database Query:</strong> Riwayat pencarian serta cluster logs disimpan secara teratur di <code>/data/database.json</code>.
            </p>
          </div>
        </div>
      )
    },
    erd: {
      id: "erd",
      name: "2. Entity Relationship Diagram (ERD)",
      description: "Skema relasional data antara entitas Pengguna, Artikel Knowledge Base, dan Pencatatan Log Analitik.",
      component: (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Table Users */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-md">
              <div className="bg-indigo-900/40 p-2 text-xs font-semibold text-indigo-300 border-b border-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Table: users
              </div>
              <div className="p-3 space-y-1.5 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between"><span className="text-indigo-400 font-bold">🔑 id</span> <span>TEXT (PK)</span></div>
                <div className="flex justify-between"><span>name</span> <span>VARCHAR(100)</span></div>
                <div className="flex justify-between"><span>email</span> <span>VARCHAR(100) (UQ)</span></div>
                <div className="flex justify-between"><span>password</span> <span>VARCHAR(255)</span></div>
                <div className="flex justify-between"><span>role</span> <span>ENUM('user', 'helpdesk', 'admin')</span></div>
              </div>
            </div>

            {/* Table FAQ */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-md">
              <div className="bg-blue-900/40 p-2 text-xs font-semibold text-blue-300 border-b border-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Table: faq
              </div>
              <div className="p-3 space-y-1.5 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between"><span className="text-blue-400 font-bold">🔑 id</span> <span>TEXT (PK)</span></div>
                <div className="flex justify-between"><span>layanan</span> <span>VARCHAR(50)</span></div>
                <div className="flex justify-between"><span>kode_error</span> <span>VARCHAR(30)</span></div>
                <div className="flex justify-between"><span>deskripsi_error</span> <span>TEXT</span></div>
                <div className="flex justify-between"><span>penyebab</span> <span>TEXT</span></div>
                <div className="flex justify-between"><span>solusi</span> <span>TEXT</span></div>
                <div className="flex justify-between"><span className="text-emerald-400">embedding</span> <span>VECTOR(1536)</span></div>
              </div>
            </div>

            {/* Table Search History */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-md">
              <div className="bg-emerald-900/40 p-2 text-xs font-semibold text-emerald-300 border-b border-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5" /> Table: search_history
              </div>
              <div className="p-3 space-y-1.5 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between"><span className="text-emerald-400 font-bold">🔑 id</span> <span>TEXT (PK)</span></div>
                <div className="flex justify-between"><span className="text-indigo-400">👤 user_id</span> <span>TEXT (FK -{">"} users.id)</span></div>
                <div className="flex justify-between"><span>layanan</span> <span>VARCHAR(50)</span></div>
                <div className="flex justify-between"><span>kode_error</span> <span>VARCHAR(30)</span></div>
                <div className="flex justify-between"><span>query_text</span> <span>TEXT</span></div>
                <div className="flex justify-between"><span>result_found</span> <span>BOOLEAN</span></div>
                <div className="flex justify-between"><span>similarity_score</span> <span>FLOAT</span></div>
                <div className="flex justify-between"><span>created_at</span> <span>TIMESTAMP</span></div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-lg space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Keterangan Hubungan Relasi:</h4>
            <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-indigo-500 pl-3">
              - <strong>Satu Pengguna (User)</strong> dapat memiliki <strong>Banyak Riwayat Pencarian (search_history)</strong> (Hubungan 1-to-many relasional, ditandai oleh kecocokan foreign key <i>user_id</i>).<br />
              - <strong>Table faq</strong> berdiri mandiri sebagai master knowledge base yang diindeks oleh index vector embedding untuk mempercepat pencarian semantic search.
            </p>
          </div>
        </div>
      )
    },
    usecase: {
      id: "usecase",
      name: "3. Use Case Diagram",
      description: "Interaksi peran hak akses pengguna (User, Helpdesk, Administrator) terhadap use-case didalam portal sistem.",
      component: (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row items-stretch gap-6">
            {/* Actors Panel */}
            <div className="md:w-1/3 bg-slate-900 rounded-lg p-4 space-y-4 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aktor & Peran</h4>
              <div className="space-y-3">
                <div className="p-2 bg-indigo-950/40 rounded border border-indigo-900 text-xs">
                  <div className="font-semibold text-indigo-400">👤 User Operasional</div>
                  <div className="text-[10px] text-slate-400 mt-1">Mengunggah screenshot error, melihat deteksi OCR, mencari FAQ solusi.</div>
                </div>
                <div className="p-2 bg-blue-950/40 rounded border border-blue-900 text-xs">
                  <div className="font-semibold text-blue-400">💻 Helpdesk Support</div>
                  <div className="text-[10px] text-slate-400 mt-1">Memantau dashboard analitik, melihat history penuh, mengimpor FAQ massal CSV/Excel.</div>
                </div>
                <div className="p-2 bg-red-950/40 rounded border border-red-900 text-xs">
                  <div className="font-semibold text-red-400">🛡️ Administrator</div>
                  <div className="text-[10px] text-slate-400 mt-1">Mengelola penuh KB FAQ CRUD, review log audit sistem, update cluster errors.</div>
                </div>
              </div>
            </div>

            {/* System Boundary */}
            <div className="md:w-2/3 bg-slate-900/60 rounded-lg p-4 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Sistem Pendukung Smart FAQ Error</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                  <span>[UC-01] Melakukan Login Akun</span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">Semua Aktor</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                  <span>[UC-02] Unggah Screenshot Error</span>
                  <span className="text-[9px] bg-indigo-900/40 text-indigo-400 px-1 rounded">User, Helpdesk</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                  <span>[UC-03] Mengakses Deteksi OCR</span>
                  <span className="text-[9px] bg-indigo-900/40 text-indigo-400 px-1 rounded">User, Helpdesk</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                  <span>[UC-04] Cari Solusi (Exact/Semantic)</span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">Semua Aktor</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                  <span>[UC-05] Visualisasi Analytics Dashboard</span>
                  <span className="text-[9px] bg-blue-900/40 text-blue-400 px-1 rounded">Helpdesk, Admin</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                  <span>[UC-06] Impor FAQ CSV/Excel</span>
                  <span className="text-[9px] bg-blue-900/40 text-blue-400 px-1 rounded">Helpdesk, Admin</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between flex-1 col-span-1 sm:col-span-2">
                  <span>[UC-07] Kelola CRUD Database FAQ Knowledge Base</span>
                  <span className="text-[9px] bg-red-900/40 text-red-400 px-1 rounded">Administrator</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    activity: {
      id: "activity",
      name: "4. Activity Diagram (OCR & Search Pipeline)",
      description: "Diagram aliran aktivitas yang terjadi, mulai dari pengunggahan gambar error, regex parsing, searching, hingga fallback semantic-match.",
      component: (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
          <div className="flex flex-col items-center space-y-3 max-w-lg mx-auto py-2 font-mono text-[11px]">
            <div className="px-3 py-1 bg-indigo-600 text-white rounded-full">● Mulai Aktivitas</div>
            <div className="text-slate-600 font-bold">│</div>
            <div className="px-3 py-1.5 bg-slate-900 rounded border border-slate-800 text-slate-300 text-center w-full">User Unggah File Gambar Screenshot Error</div>
            <div className="text-slate-600 font-bold">│</div>
            <div className="px-3 py-1.5 bg-slate-900 rounded border border-slate-800 text-slate-300 text-center w-full">Sistem Megirim Gambar ke Gemini Flash OCR Endpoint</div>
            <div className="text-slate-600 font-bold">│</div>
            <div className="px-3 py-2 bg-indigo-950/60 rounded border border-indigo-900 text-white text-center w-full">
              <strong>Evaluasi OCR:</strong> Ekstrak Atribut Layanan, Kode Error, dan Deskripsi
            </div>
            <div className="text-slate-600 font-bold">│</div>
            <div className="px-3 py-2 bg-slate-900 rounded border border-slate-800 text-slate-300 text-center w-full">
              Cari Atribut ke Database Menggunakan <strong>Exact Match SQL Query</strong>
            </div>
            <div className="text-slate-600 font-bold">│</div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800 text-center w-full space-y-1.5">
              <span className="font-bold text-yellow-500">❖ Apakah Data Ditemukan?</span>
              <div className="flex justify-around mt-1">
                <span className="text-emerald-400">[Ya, Exact Found]</span>
                <span className="text-red-400">[Tidak, Gagal]</span>
              </div>
            </div>
            <div className="flex justify-between w-full gap-4">
              <div className="w-1/2 p-2 bg-emerald-950/40 rounded border border-emerald-900 text-slate-300 text-center">
                Maju ke Tampilan Solusi Utama (Score = 1.0)
              </div>
              <div className="w-1/2 p-2 bg-indigo-950/40 rounded border border-indigo-900 text-slate-300 text-center">
                Memulai <strong>Semantic Search</strong> via Cosine Similarity Embedding Vector
              </div>
            </div>
            <div className="text-slate-600 font-bold">│</div>
            <div className="px-3 py-1.5 bg-slate-900 rounded border border-slate-800 text-slate-300 text-center w-full">Catat Hasil Pencarian ke Table search_history</div>
            <div className="text-slate-600 font-bold">│</div>
            <div className="px-3 py-1 bg-red-600 text-white rounded-full">■ Selesai</div>
          </div>
        </div>
      )
    },
    sequence: {
      id: "sequence",
      name: "5. Sequence Diagram",
      description: "Diagram urutan pesan asinkronus antara Aktor, Antarmuka Klien, API Server Express, dan External AI Platform.",
      component: (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
          <div className="bg-slate-900 overflow-x-auto p-4 rounded-lg font-mono text-xs text-slate-300 space-y-3">
            <p className="text-indigo-400 font-bold">// SEQUENCE FLOW DI PORTAL SMART FAQ</p>
            <div className="text-[11px] space-y-1 divide-y divide-slate-800/40">
              <p className="py-1">User ────────── Unggah Screenshot Error ─────────► Klien SPA (Sistem)</p>
              <p className="py-1">Klien SPA ───── POST /api/ocr (asinkronus Base64) ─────► API Express Server</p>
              <p className="py-1">API Server ──── Mengirim payload frame gambar ────────► Gemini Flash OCR API</p>
              <p className="py-1">Gemini OK ◄─── Mengembalikan Atribut JSON terstruktur ◄─── OCR Sukses</p>
              <p className="py-1">API Server ──── SELECT * FROM faq WHERE code = extracted ─► Database (JSONDB)</p>
              <p className="py-1">API Server ◄─── Hasil record (Exact atau Vektor Embeddings) ◄─ Database OK</p>
              <p className="py-1">API Server ──── Menyimpan query logging history ─────────► Database Log</p>
              <p className="py-1">Klien SPA ◄──── Kembalikan hasil detail (Penyebab & Solusi) ◄─ API Express Server</p>
              <p className="py-1">User ◄───────── Membaca Solusi Perbaikan Sistem ───────── Klien SPA (Render)</p>
            </div>
          </div>
        </div>
      )
    },
    classdiagram: {
      id: "classdiagram",
      name: "6. Class Diagram",
      description: "Struktur blueprint dan rancang bangun kelas-kelas controller yang mengatur jalannya perangkat lunak.",
      component: (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Class AuthController */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden text-xs">
              <div className="bg-indigo-950/60 p-2 font-bold text-slate-300 border-b border-slate-800">
                class AuthController
              </div>
              <div className="p-3 space-y-2 text-slate-400">
                <div>
                  <span className="text-indigo-400 font-semibold font-mono">Attributes:</span>
                  <ul className="list-disc pl-4 text-[10px] space-y-0.5">
                    <li>users : Array&lt;User&gt;</li>
                    <li>passStore : Map&lt;String, String&gt;</li>
                  </ul>
                </div>
                <div className="border-t border-slate-800/40 pt-1.5">
                  <span className="text-emerald-400 font-semibold font-mono">Methods:</span>
                  <ul className="list-disc pl-4 text-[10px] space-y-0.5">
                    <li>+ login(email, password) : JSONResponse</li>
                    <li>+ register(name, email, password, role) : JSONResponse</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Class FAQController */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden text-xs">
              <div className="bg-blue-950/60 p-2 font-bold text-slate-300 border-b border-slate-800">
                class FAQController
              </div>
              <div className="p-3 space-y-2 text-slate-400">
                <div>
                  <span className="text-blue-400 font-semibold font-mono">Attributes:</span>
                  <ul className="list-disc pl-4 text-[10px] space-y-0.5">
                    <li>faqs : Array&lt;FAQ&gt;</li>
                    <li>embeddingClient : GoogleGenAI</li>
                  </ul>
                </div>
                <div className="border-t border-slate-800/40 pt-1.5">
                  <span className="text-emerald-400 font-semibold font-mono">Methods:</span>
                  <ul className="list-disc pl-4 text-[10px] space-y-0.5">
                    <li>+ listAll() : Array&lt;FAQ&gt;</li>
                    <li>+ createFAQ(layanan, code, desc, desc_cause, solution) : FAQ</li>
                    <li>+ updateFAQ(id, data) : FAQ</li>
                    <li>+ deleteFAQ(id) : Boolean</li>
                    <li>+ importFromCSV(items) : JSONStatus</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Class SearchAndOCREngine */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden text-xs md:col-span-2">
              <div className="bg-emerald-950/60 p-2 font-bold text-slate-300 border-b border-slate-800">
                class SearchAndOCREngine
              </div>
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400">
                <div>
                  <span className="text-emerald-400 font-semibold font-mono">Attributes:</span>
                  <ul className="list-disc pl-4 text-[10px] space-y-0.5">
                    <li>geminiVisionModel : String = "gemini-2.5-flash"</li>
                    <li>historyLogs : Array&lt;SearchHistory&gt;</li>
                  </ul>
                </div>
                <div>
                  <span className="text-emerald-400 font-semibold font-mono">Methods:</span>
                  <ul className="list-disc pl-4 text-[10px] space-y-0.5">
                    <li>+ executeOCR(base64Image) : OCRResult</li>
                    <li>+ performExactMatchSearch(layanan, code) : FAQ</li>
                    <li>+ performSemanticSearch(queryText) : Array&lt;SearchResult&gt;</li>
                    <li>+ calculateCosineSimilarity(vecA, vecB) : Float</li>
                    <li>+ clusterErrorLogsAndSuggestPreventive() : Array&lt;ErrorCluster&gt;</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab select capsules */}
      <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-800/60">
        {Object.values(diagrams).map((diag) => (
          <button
            key={diag.id}
            onClick={() => setActiveTab(diag.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === diag.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800"
            }`}
          >
            {diag.name.split(". ")[1]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white tracking-tight">{diagrams[activeTab].name}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{diagrams[activeTab].description}</p>
      </div>

      <div>
        {diagrams[activeTab].component}
      </div>
    </div>
  );
}
