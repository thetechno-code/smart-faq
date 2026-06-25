/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Upload, ScreenShare, Search, History, Database, BarChart3, Users, LogOut, Loader2,
  Trash2, Plus, Edit3, Sparkles, AlertCircle, CheckCircle2, Shield, FileSpreadsheet, RefreshCcw, HelpCircle, Radio
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from "recharts";
import { User, FAQ, SearchHistory, AnalyticsStats, ErrorCluster } from "../types";

export default function AppAssistant() {
  // Authentication & RBAC User state
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: "a-1",
    name: "Sekar",
    email: "admin@enterprise.com",
    role: "admin"
  });

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Sub tab states inside the application
  const [appSubTab, setAppSubTab] = useState<"search" | "kb" | "history" | "analytics">("search");

  // State caches
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [histories, setHistories] = useState<SearchHistory[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [clusters, setClusters] = useState<ErrorCluster[]>([]);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ faq: FAQ; match_type: string; similarity_score: number }[]>([]);

  // OCR Upload states
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [ocrOutput, setOcrOutput] = useState<{ layanan: string; kode_error: string; deskripsi_error: string; raw_text: string; saran_cepat?: string } | null>(null);
  const [selectedOfflinePreset, setSelectedOfflinePreset] = useState<string>("giropos-expired");
  const [ocrUnreadable, setOcrUnreadable] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const PRESET_IMAGES: Record<string, string> = {
    "giropos-expired": "data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "fif-notfound": "data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "cba-pool": "data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADVgFC/vMf7wAAAABJRU5ErkJggg==",
    "pg-sig": "data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  };

  // General interactive state managers
  const [isSubmittingFaq, setIsSubmittingFaq] = useState(false);
  const [isClustering, setIsClustering] = useState(false);
  const [activeFaqDetailId, setActiveFaqDetailId] = useState<string | null>(null);

  // CRUD state parameters
  const [isFaqFormOpen, setIsFaqFormOpen] = useState(false);
  const [faqFormMode, setFaqFormMode] = useState<"create" | "update">("create");
  const [faqFormId, setFaqFormId] = useState("");
  const [faqLayanan, setFaqLayanan] = useState("");
  const [faqKodeError, setFaqKodeError] = useState("");
  const [faqDeskripsi, setFaqDeskripsi] = useState("");
  const [faqPenyebab, setFaqPenyebab] = useState("");
  const [faqSolusi, setFaqSolusi] = useState("");

  // Bulk Import state parameters
  const [importCsvText, setImportCsvText] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load backend states
  useEffect(() => {
    fetchFaqs();
    fetchHistory();
    fetchAnalytics();
    triggerClustering();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/faq/list");
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    } catch (e) {
      console.error("Gagal menarik data FAQ", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistories(data);
      }
    } catch (e) {
      console.error("Gagal menarik history", e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics/stats");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error("Gagal menarik analitik", e);
    }
  };

  const triggerClustering = async () => {
    setIsClustering(true);
    try {
      const res = await fetch("/api/analytics/cluster", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setClusters(data);
      }
    } catch (e) {
      console.error("Clustering failed:", e);
    } finally {
      setIsClustering(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setSelectedServiceFilter("");
        setSearchResults([]);
        setSearchQuery("");
      } else {
        const err = await res.json();
        setLoginError(err.message || "Email atau password salah.");
      }
    } catch (err) {
      setLoginError("Terjadi kesalahan koneksi auth.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEmailInput("");
    setPasswordInput("");
  };

  // OCR screenshot file ingestion
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setOcrError("Ukuran file tidak boleh melebihi 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result as string);
        setOcrOutput(null);
        setOcrError("");
        setOcrUnreadable(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setOcrError("Ukuran file tidak boleh melebihi 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result as string);
        setOcrOutput(null);
        setOcrError("");
        setOcrUnreadable(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Execute Python Offline OCR screenshot pipeline
  const processScreenshotOcr = async () => {
    if (!imageFile) return;
    setIsOcrProcessing(true);
    setOcrError("");
    setOcrUnreadable(false);

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageFile })
      });

      if (res.ok) {
        const parsed = await res.json();
        
        if (parsed.unreadable) {
          setOcrOutput(null);
          setOcrUnreadable(true);
          setOcrError("Gambar tidak terbaca oleh OCR. Harap pastikan gambar berisi teks error yang jelas atau gunakan pencarian manual di sebelah kanan.");
          setSearchQuery("");
          setSelectedServiceFilter("");
          
          // Triggers an auto-search with empty query to list general available solutions immediately
          setIsSearching(true);
          try {
            const searchRes = await fetch("/api/search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: "",
                layanan: "",
                login_user_id: currentUser?.id,
                login_user_name: currentUser?.name
              })
            });
            if (searchRes.ok) {
              const data = await searchRes.json();
              setSearchResults(data);
              if (data.length > 0) {
                setActiveFaqDetailId(data[0].faq.id);
              } else {
                setActiveFaqDetailId(null);
              }
              fetchHistory();
              fetchAnalytics();
              triggerClustering();
            }
          } catch (err) {
            console.error("Auto text search failed:", err);
          } finally {
            setIsSearching(false);
          }

          // Auto focus search input
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 150);

          return;
        }

        // Image read successfully!
        setOcrUnreadable(false);
        setOcrOutput(parsed);
        
        const q = parsed.kode_error || parsed.deskripsi_error || "";
        const svc = (parsed.layanan && parsed.layanan !== "General Service") ? parsed.layanan : "";
        
        // Autofill search inputs for reference
        setSearchQuery(q);
        setSelectedServiceFilter(svc);

        // Instantly recommend accurate solution from Database matching
        if (q) {
          setIsSearching(true);
          try {
            const searchRes = await fetch("/api/search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: q,
                layanan: svc,
                login_user_id: currentUser?.id,
                login_user_name: currentUser?.name
              })
            });

            if (searchRes.ok) {
              const data = await searchRes.json();
              setSearchResults(data);
              if (data.length > 0) {
                setActiveFaqDetailId(data[0].faq.id);
              } else {
                setActiveFaqDetailId(null);
              }
              fetchHistory();
              fetchAnalytics();
              triggerClustering();
            }
          } catch (err) {
            console.error("Auto recommendation search failed:", err);
          } finally {
            setIsSearching(false);
          }
        }
      } else {
        const err = await res.json();
        const mainMsg = err.message || "Gagal melakukan scan screenshot.";
        const extraDetails = err.details ? ` (${err.details})` : (err.error ? ` (${err.error})` : "");
        setOcrError(`${mainMsg}${extraDetails}`);
      }
    } catch (e) {
      setOcrError("Gagal menghubungi server backend untuk memproses OCR secara offline.");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Query engine search (Exact + Semantic)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          layanan: selectedServiceFilter,
          login_user_id: currentUser?.id,
          login_user_name: currentUser?.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        if (data.length > 0) {
          setActiveFaqDetailId(data[0].faq.id);
        } else {
          setActiveFaqDetailId(null);
        }
        fetchHistory();
        fetchAnalytics();
        triggerClustering();
      }
    } catch (e) {
      console.error("Pencarian bermasalah", e);
    } finally {
      setIsSearching(false);
    }
  };

  // CREATE/UPDATE FAQ CRUD handles
  const openCreateFaq = () => {
    setFaqFormMode("create");
    setFaqFormId("");
    setFaqLayanan("");
    setFaqKodeError("");
    setFaqDeskripsi("");
    setFaqPenyebab("");
    setFaqSolusi("");
    setIsFaqFormOpen(true);
  };

  const openUpdateFaq = (faq: FAQ) => {
    setFaqFormMode("update");
    setFaqFormId(faq.id);
    setFaqLayanan(faq.layanan);
    setFaqKodeError(faq.kode_error);
    setFaqDeskripsi(faq.deskripsi_error);
    setFaqPenyebab(faq.penyebab);
    setFaqSolusi(faq.solusi);
    setIsFaqFormOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqLayanan || !faqKodeError || !faqDeskripsi || !faqPenyebab || !faqSolusi) return;

    setIsSubmittingFaq(true);
    const bodyPayload = {
      layanan: faqLayanan,
      kode_error: faqKodeError,
      deskripsi_error: faqDeskripsi,
      penyebab: faqPenyebab,
      solusi: faqSolusi
    };

    try {
      let res;
      if (faqFormMode === "create") {
        res = await fetch("/api/faq/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload)
        });
      } else {
        res = await fetch(`/api/faq/update/${faqFormId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload)
        });
      }

      if (res.ok) {
        setIsFaqFormOpen(false);
        fetchFaqs();
        fetchAnalytics();
      }
    } catch (e) {
      console.error("Gagal menyimpan FAQ", e);
    } finally {
      setIsSubmittingFaq(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data FAQ ini dari Knowledge Base?")) {
      try {
        const res = await fetch(`/api/faq/delete/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchFaqs();
          fetchAnalytics();
        }
      } catch (e) {
        console.error("Gagal menghapus FAQ", e);
      }
    }
  };

  // Bulk FAQ Parse & import from spreadsheet text mock (CSV format parser)
  const handleBulkImport = async () => {
    if (!importCsvText.trim()) return;
    setImportMessage("");

    // Simple robust CSV parsing (Comma / semi-colon / pipe parsed rows)
    const rows = importCsvText.split("\n");
    const items: any[] = [];

    rows.forEach((row, idx) => {
      if (idx === 0) return; // Skip headers: Layanan | KodeError | Deskripsi | Penyebab | Solusi
      const cols = row.split("|").map(col => col.trim());
      if (cols.length >= 5) {
        items.push({
          layanan: cols[0],
          kode_error: cols[1],
          deskripsi_error: cols[2],
          penyebab: cols[3],
          solusi: cols[4]
        });
      }
    });

    if (items.length === 0) {
      setImportMessage("Gagal memparsing. Pastikan Anda mengikuti format: Layanan | KodeError | Deskripsi | Penyebab | Solusi");
      return;
    }

    try {
      const res = await fetch("/api/faq/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });

      if (res.ok) {
        const data = await res.json();
        setImportMessage(data.message);
        setImportCsvText("");
        setTimeout(() => {
          setIsImportOpen(false);
          setImportMessage("");
        }, 2000);
        fetchFaqs();
        fetchAnalytics();
      }
    } catch (e) {
      setImportMessage("Terjadi kesalahan memproses import massal.");
    }
  };

  // Pre-configured simulation accounts for easy testing
  const mockUserProfiles = [
    { name: "Iwan", email: "user@enterprise.com", role: "user" },
    { name: "Hesti", email: "helpdesk@enterprise.com", role: "helpdesk" },
    { name: "Sekar", email: "admin@enterprise.com", role: "admin" }
  ];

  const selectMockProfile = (profile: typeof mockUserProfiles[0]) => {
    setEmailInput(profile.email);
    setPasswordInput("password123");
    setLoginError("");
  };

  // Colors for Analytics charts
  const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-soft p-6 font-sans">
        <div className="text-center mb-6">
          <div className="bg-blue-50 text-blue-600 p-3.5 rounded-2xl w-fit mx-auto mb-3 border border-blue-100">
            <Shield className="w-8 h-8" />
          </div>
          <p className="text-[10px] font-extrabold tracking-widest text-blue-600 uppercase mb-1">Smart FAQ Portal</p>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Error Assistant</h2>
          <p className="text-xs text-slate-500 mt-1">Sistem Otomasi Penanganan Error & FAQ Enterprise</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Kantor</label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
              placeholder="nama@perusahaan.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sandi Akses</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
              placeholder="••••••••"
            />
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-150 rounded text-xs text-red-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-lg shadow-soft transition-all uppercase tracking-wider"
          >
            Masuk Layanan
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-3 text-slate-400">Uji Coba Cepat (Simulator Profile)</span></div>
        </div>

        <div className="space-y-2">
          {mockUserProfiles.map((p) => (
            <button
              onClick={() => selectMockProfile(p)}
              key={p.role}
              className={`w-full flex items-center justify-between p-2.5 bg-slate-50 border ${emailInput === p.email ? "border-blue-500 bg-blue-50/60" : "border-slate-200 hover:border-slate-300"} rounded-lg text-left transition-all text-xs`}
            >
              <div>
                <p className="font-semibold text-slate-800">{p.name}</p>
                <p className="text-[10px] text-slate-400">{p.email}</p>
              </div>
              <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                p.role === "admin" ? "bg-red-50 text-red-600 border border-red-100" : p.role === "helpdesk" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-emerald-50 text-emerald-600 border border-emerald-110"
              }`}>
                {p.role}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Mini Profile bar & Internal navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-soft">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            currentUser.role === "admin" 
              ? "bg-red-50 text-red-600 border-red-100" 
              : currentUser.role === "helpdesk" 
                ? "bg-blue-50 text-blue-600 border-blue-100" 
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
          }`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {currentUser.name}
              <span className={`text-[8px] uppercase font-mono font-extrabold px-2 py-0.5 rounded border ${
                currentUser.role === "admin" 
                  ? "bg-red-50 text-red-600 border-red-100" 
                  : currentUser.role === "helpdesk" 
                    ? "bg-blue-50 text-blue-600 border-blue-100" 
                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}>
                {currentUser.role}
              </span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Departemen Operasional IT Enterprise</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setAppSubTab("search")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
              appSubTab === "search" 
                ? "bg-white text-blue-600 border border-slate-200/50 shadow-soft" 
                : "text-slate-500 hover:text-slate-850"
            }`}
          >
            <ScreenShare className="w-3.5 h-3.5" /> Deteksi & Cari
          </button>
          <button
            onClick={() => setAppSubTab("kb")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
              appSubTab === "kb" 
                ? "bg-white text-blue-600 border border-slate-200/50 shadow-soft" 
                : "text-slate-500 hover:text-slate-850"
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Knowledge Base ({faqs.length})
          </button>
          <button
            onClick={() => setAppSubTab("history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
              appSubTab === "history" 
                ? "bg-white text-blue-600 border border-slate-200/50 shadow-soft" 
                : "text-slate-500 hover:text-slate-850"
            }`}
          >
            <History className="w-3.5 h-3.5" /> History Logs
          </button>
          {(currentUser.role === "helpdesk" || currentUser.role === "admin") && (
            <button
              onClick={() => setAppSubTab("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                appSubTab === "analytics" 
                  ? "bg-white text-blue-600 border border-slate-200/50 shadow-soft" 
                  : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics & Cluster
            </button>
          )}
          <button 
            onClick={handleLogout} 
            className="p-1 px-3 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-md transition-all flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </div>

      {/* RENDER       {/* 1. OCR DETECTION & SEMANTIC SEARCH VIEW */}
      {appSubTab === "search" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Screenshot Upload Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-500" /> Upload Gambar
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Max 5MB (PNG/JPG)</p>
            </div>
 
            {/* Droppable Stage Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed ${imageFile ? "border-blue-400/40 bg-blue-50/10" : "border-slate-200 hover:border-slate-300 bg-slate-50/30"} rounded-xl p-6 text-center cursor-pointer transition-all space-y-2`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {imageFile ? (
                <div className="space-y-3">
                  <img src={imageFile} alt="Screenshot input" className="max-h-36 mx-auto rounded-lg border border-slate-200 shadow-soft object-contain" />
                  <p className="text-[10px] text-blue-600 font-bold">Screenshot Termuat. Klik Ganti Gambar.</p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">Drag & Drop Tangkapan Layar Error</p>
                    <p className="text-[10px] text-slate-500 mt-1">Atau click pemicu berkas komputer Anda</p>
                  </div>
                </div>
              )}
            </div>
 
            {ocrError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{ocrError}</span>
              </div>
            )}
 
            {imageFile && (
              <button
                type="button"
                onClick={processScreenshotOcr}
                disabled={isOcrProcessing}
                className="w-full bg-slate-100 hover:bg-blue-650 hover:bg-blue-600 border border-slate-200 hover:border-blue-500 rounded-xl py-2.5 text-xs font-bold text-slate-700 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isOcrProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Proses</span>
                  </>
                )}
               </button>
            )}

            {/* OCR Unreadable State Advice */}
            {ocrUnreadable && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5 text-xs text-amber-900 shadow-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-950">Gambar Tidak Terbaca</h4>
                    <p className="text-[11px] text-amber-850 mt-1 leading-relaxed">
                      Sistem tidak mendeteksi teks error dari gambar ini. Mohon gunakan kolom Pencarian Teks di samping kanan untuk melakukan pencarian solusi (Auto Search dipicu otomatis).
                    </p>
                  </div>
                </div>
              </div>
            )}
            {ocrOutput && (
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 shadow-inner">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span>Preview Hasil OCR</span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.5 rounded font-bold">Parsed Successfully</span>
                  </h4>
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block font-mono uppercase text-[9px] tracking-wide">Pesan Detail:</span>
                      <p className="text-slate-700 leading-relaxed font-mono text-[10px] bg-white p-2.5 rounded-lg border border-slate-200 mt-1">{ocrOutput.deskripsi_error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
 
          {/* Search solution Panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-soft">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Search className="w-4 h-4 text-blue-500" /> Solusi
            </h3>
 
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-850 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm font-medium"
                    placeholder="Masukkan pesan error, kata kunci, atau kode error..."
                  />
                </div>
                <div className="sm:w-48">
                  <select
                    value={selectedServiceFilter}
                    onChange={(e) => setSelectedServiceFilter(e.target.value)}
                    className="w-full h-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none focus:border-blue-500 shadow-sm cursor-pointer font-medium"
                  >
                    <option value="">Semua Layanan</option>
                    <option value="Core Banking API">Core Banking API</option>
                    <option value="Payment Gateway">Payment Gateway</option>
                    <option value="Auth System">Auth System</option>
                    <option value="Inventory Service">Inventory Service</option>
                    <option value="Customer Notification Service">Customer Notification Service</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 px-6 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 shadow-soft"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Cari
                </button>
              </div>
            </form>
 
            {/* Results */}
            <div className="space-y-3">
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Dokumentasi Solusi Tersedia:</h4>
 
                  {/* Left-Right split */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* List entries */}
                    <div className="md:col-span-5 space-y-2">
                      {searchResults.map((result) => {
                        const score = Math.round(result.similarity_score * 100);
                        const isExact = result.match_type === "exact";
                        return (
                          <div
                            key={result.faq.id}
                            onClick={() => setActiveFaqDetailId(result.faq.id)}
                            className={`p-3 rounded-xl border cursor-pointer text-left transition-all shadow-sm ${
                              activeFaqDetailId === result.faq.id
                                ? "bg-blue-50/70 border-blue-300 text-blue-900"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                isExact 
                                  ? "bg-emerald-50 text-emerald-750 border-emerald-100" 
                                  : "bg-blue-50 text-blue-750 border-blue-100"
                              }`}>
                                {isExact ? "Exact Match" : "Semantic Match"}
                              </span>
                              <div className="text-[10px] font-mono text-slate-500 font-semibold">{score}% Score</div>
                            </div>
                            <p className="font-bold text-xs text-slate-900 truncate">{result.faq.kode_error}</p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">{result.faq.layanan}</p>
                          </div>
                        );
                      })}
                    </div>
 
                    {/* Detailed Result Card - Fulfills FR-07 */}
                    <div className="md:col-span-7">
                      {(() => {
                        const activeResult = searchResults.find(r => r.faq.id === activeFaqDetailId);
                        if (!activeResult) return <p className="text-xs text-slate-500 font-medium">Pilih FAQ di sebelah kiri untuk melihat detail solusi.</p>;
                        return (
                          <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs leading-relaxed shadow-soft">
                            <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-2">
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{activeResult.faq.kode_error}</h4>
                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{activeResult.faq.layanan}</span>
                              </div>
                            </div>
 
                            <div className="space-y-3">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Deskripsi Masalah:</span>
                                <p className="text-slate-700 font-mono text-[10px] mt-0.5 p-2.5 bg-white border border-slate-200 rounded-lg">{activeResult.faq.deskripsi_error}</p>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Identifikasi Penyebab (Root Cause):</span>
                                <p className="text-slate-600 mt-0.5 font-medium">{activeResult.faq.penyebab}</p>
                              </div>
                              <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl">
                                <span className="text-[9px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-650" /> Rekomendasi Solusi Perbaikan (Faq Result):
                                </span>
                                <p className="text-emerald-950 font-semibold whitespace-pre-wrap mt-1 tab-space">{activeResult.faq.solusi}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-2">
                  <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-600">Belum ada pencarian atau hasil.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Ketik kata kunci error di kolom pencarian atau unggah error screenshot.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. KNOWLEDGE BASE FAQ MANAGEMENT */}
      {appSubTab === "kb" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-500" /> Knowledge Base Management
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Total Artikel FAQ Tersimpan: <strong>{faqs.length}</strong></p>
            </div>
 
            <div className="flex gap-2">
              {(currentUser.role === "admin" || currentUser.role === "helpdesk") && (
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="bg-slate-50 hover:bg-emerald-650 hover:bg-emerald-650 hover:bg-emerald-600 text-slate-600 hover:text-white border border-slate-200 hover:border-emerald-600 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> FAQ Import
                </button>
              )}
              {currentUser.role === "admin" && (
                <button
                  onClick={openCreateFaq}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all shadow-soft"
                >
                  <Plus className="w-4 h-4" /> Entry FAQ Baru
                </button>
              )}
            </div>
          </div>
 
          {/* FAQ database List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-bold">
                  <th className="p-3">Layanan</th>
                  <th className="p-3">Kode Error</th>
                  <th className="p-3">Penyebab Masalah (Root Cause)</th>
                  <th className="p-3">Rekomendasi Solusi</th>
                  {currentUser.role === "admin" && <th className="p-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-slate-700">
                {faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-bold text-slate-900 tracking-tight">{faq.layanan}</td>
                    <td className="p-3 font-mono font-bold text-rose-600">{faq.kode_error}</td>
                    <td className="p-3 leading-relaxed max-w-xs truncate font-medium">{faq.penyebab}</td>
                    <td className="p-3 leading-relaxed max-w-sm truncate text-emerald-600 font-medium">{faq.solusi}</td>
                    {currentUser.role === "admin" && (
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openUpdateFaq(faq)}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-1.5 rounded-lg transition-all border border-blue-100 shadow-sm"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="bg-red-50 text-red-600 hover:bg-red-650 hover:bg-red-600 hover:text-white p-1.5 rounded-lg transition-all border border-red-100 shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
 
      {/* 3. ENGINE SEARCH HISTORIES LOG */}
      {appSubTab === "history" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-soft">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-500" /> Search History Logs
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Riwayat analisis audit pencarian helpdesk & users secara riil.</p>
          </div>
 
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Operator / User</th>
                  <th className="p-3">Pertanyaan (Query)</th>
                  <th className="p-3">Kode Identifikasi</th>
                  <th className="p-3">Layanan</th>
                  <th className="p-3">Kecocokan (Score)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {histories.map((h) => {
                  const dateStr = new Date(h.created_at).toLocaleString("id-ID");
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors font-mono text-[11px]">
                      <td className="p-3 text-slate-450">{dateStr}</td>
                      <td className="p-3 font-sans font-bold text-slate-900">{h.user_name}</td>
                      <td className="p-3 font-sans truncate max-w-xs text-slate-600 font-medium">{h.query_text}</td>
                      <td className="p-3 text-rose-600 font-bold">{h.kode_error || "UNKNOWN"}</td>
                      <td className="p-3 font-sans text-slate-505 text-slate-500 font-medium">{h.layanan}</td>
                      <td className="p-3 text-blue-600 font-bold">{Math.round(h.similarity_score * 100)}%</td>
                      <td className="p-3 font-sans">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold border ${
                          h.result_found 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-red-50 text-red-600 border-red-100"
                        }`}>
                          {h.result_found ? "Resolved" : "Pending Wiki"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ANALYTICS & KMeans CLUSTERING DASHBOARDS */}
      {appSubTab === "analytics" && (
        <div className="space-y-6">
          {/* Dashboard Stats Panel */}
          {analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1.5 shadow-soft">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sesi Pencarian</span>
                <p className="text-3xl font-extrabold text-slate-950 tracking-tight">{analytics.total_searches}</p>
                <p className="text-[9px] text-slate-400 font-medium">Log queries tersimpan dalam SQLite DB</p>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1.5 shadow-soft">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SLA Resolution Rate</span>
                <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{analytics.success_rate}%</p>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                  <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${analytics.success_rate}%` }}></div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1.5 shadow-soft">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Knowledge Base</span>
                <p className="text-3xl font-extrabold text-blue-600 tracking-tight">{faqs.length}</p>
                <p className="text-[9px] text-slate-400 font-medium font-medium">Artikel solusi terindeks oleh embedding vektor</p>
              </div>
            </div>
          )}

          {/* Recharts Graphical Dashboard */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service Frequency Bar chart */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-soft">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Error Frequency by Services</h4>
                <div className="h-48 text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.by_layanan}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#334155" }} />
                      <Bar dataKey="count" fill="#3b82f6">
                        {analytics.by_layanan.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time progression Line chart */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-soft">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Resolved Resolution progression</h4>
                <div className="h-48 text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.by_time}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#334155" }} />
                      <Line type="monotone" dataKey="total" stroke="#f59e0b" name="Searches Issued" strokeWidth={2} />
                      <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Resolved" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* AI Semantic Clustering Dashboard - Fulfills FR-12 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-500" /> KMeans Semantic Error Clustering
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Analisis pengelompokan gugusan error log menggunakan vector dan classifier.</p>
              </div>

              <button
                onClick={triggerClustering}
                disabled={isClustering}
                className="bg-slate-50 hover:bg-blue-600 border border-slate-200 text-slate-650 hover:text-white py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                {isClustering ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                Run Clustering
              </button>
            </div>

            {isClustering ? (
              <div className="text-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Sedang melatih model KMeans dan memisah gugus cluster log harian...</p>
              </div>
            ) : clusters.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {clusters.map((cluster) => (
                  <div key={cluster.cluster_id} className="bg-slate-50 border border-slate-250/60 p-4 rounded-xl space-y-3 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] uppercase font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-lg font-mono">
                          Cluster ID: #{cluster.cluster_id}
                        </span>
                        <span className="text-xs font-bold text-slate-800 font-mono">{cluster.count} Events Logs</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mb-2 leading-snug">{cluster.label}</h4>

                      {/* Distribution sub list */}
                      <div className="space-y-1 my-3 bg-white p-2.5 rounded-xl border border-slate-200 text-[10px]">
                        <p className="text-[8px] uppercase text-slate-400 tracking-wider font-bold mb-1">Penyebaran Target Layanan:</p>
                        {Object.entries(cluster.layanan_distribution).map(([serviceName, value]) => (
                          <div key={serviceName} className="flex justify-between text-slate-600 font-medium">
                            <span className="truncate max-w-[150px]">{serviceName}</span>
                            <span className="font-bold font-mono text-blue-600">{value}x</span>
                          </div>
                        ))}
                      </div>

                      {/* Example tokens */}
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Sampel Frasa Gejala:</span>
                        <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-500 italic font-medium">
                          {cluster.deskripsi_contoh.map((desc, idx) => (
                            <li key={idx} className="line-clamp-2">{desc}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 mt-3 p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl">
                      <span className="text-[8px] uppercase font-extrabold text-emerald-850 tracking-wider">Aksi Preventif Jangka Panjang:</span>
                      <p className="text-[10px] text-emerald-900 leading-relaxed mt-1 font-semibold">{cluster.rekomendasi_preventif}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-550 text-slate-500 font-medium text-center py-6">Belum ada riwayat aktivitas yang cukup untuk melatih clustering.</p>
            )}
          </div>
        </div>
      )}

      {/* MODALS AND FORM POPUPS */}

      {/* CREATE & EDIT UPDATE FAQ MODAL popup */}
      {isFaqFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-left shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <Database className="w-4 h-4 text-blue-500" /> {faqFormMode === "create" ? "Tambah Entry FAQ Baru" : "Update Solusi FAQ"}
            </h3>

            <form onSubmit={handleSaveFaq} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nama Layanan / Modul</label>
                  <input
                    type="text"
                    required
                    value={faqLayanan}
                    onChange={(e) => setFaqLayanan(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Contoh: Merchant API, Core Transaction"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Kode Teknikal Error</label>
                  <input
                    type="text"
                    required
                    value={faqKodeError}
                    onChange={(e) => setFaqKodeError(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-850 outline-none font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Contoh: CBA-5001, ERR-PG-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Deskripsi Pesan Error Screenshot</label>
                <textarea
                  required
                  rows={2}
                  value={faqDeskripsi}
                  onChange={(e) => setFaqDeskripsi(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none resize-none font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Ketik persis atau tempel teks pesan error visual..."
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Identifikasi Penyebab Utama (Root Cause)</label>
                <textarea
                  required
                  rows={2}
                  value={faqPenyebab}
                  onChange={(e) => setFaqPenyebab(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none resize-none font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Deskripsikan hipotesis penyebab crash / timeout..."
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Instruksi Solusi Penyelesaian (FAQ Result)</label>
                <textarea
                  required
                  rows={4}
                  value={faqSolusi}
                  onChange={(e) => setFaqSolusi(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none resize-none font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Instruksi perbaikan sistem step-by-step..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFaqFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFaq}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold inline-flex items-center gap-1.5 transition-colors shadow-soft"
                >
                  {isSubmittingFaq && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Solusi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPREADSHEET FAQ IMPORT MODAL popup */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 text-left shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel / CSV FAQ Bulk Import
              </h3>
              <button onClick={() => setIsImportOpen(false)} className="text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors">Tutup</button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="text-slate-500 font-medium">Silakan salin data error catalog Anda dari excel/spreadsheet. Gunakan splitter karakter pipe (<code>|</code>) untuk memisahkan kolom data.</p>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] font-mono text-blue-600 font-bold">
                Layanan | Kode Error | Deskripsi Error | Penyebab | Solusi <br />
                API Core | ERR-109 | Connection reset peer | Server crash | restart service <br />
                Payment Gateway | PG-990 | Signature invalid | key outdated | update credentials secret
              </div>

              <textarea
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                rows={6}
                required
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-[10px] text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Layanan | Kode Error | Deskripsi Error | Penyebab | Solusi"
              />

              {importMessage && (
                <div className="p-3 bg-blue-50 border border-blue-150 rounded-xl text-xs text-blue-800 flex items-center gap-1.5 font-sans font-medium">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{importMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-soft"
                >
                  Proses Import Massal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
