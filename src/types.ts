/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Authentication and Users ---
export type UserRole = "user" | "helpdesk" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// --- Knowledge Base (FAQ) ---
export interface FAQ {
  id: string;
  layanan: string;          // Service Name (e.g., Core Banking, Payment Gateway)
  kode_error: string;       // Error Code (e.g., ERR-500, DB_TIMEOUT)
  deskripsi_error: string;  // Detailed error description
  penyebab: string;         // Root cause
  solusi: string;           // Actionable solution
  embedding?: number[];     // Vector embedding for semantic search
}

// --- Search and OCR History ---
export interface SearchHistory {
  id: string;
  user_id: string;
  user_name: string;
  layanan: string;
  kode_error: string;
  query_text: string;
  result_found: boolean;
  solution_displayed: string;
  similarity_score: number; // 0.0 to 1.0 (1.0 = exact match)
  created_at: string;
}

// --- REST API Schemas ---
export interface LoginResponse {
  user: User;
  token?: string;
}

export interface OCRResult {
  layanan: string;
  kode_error: string;
  deskripsi_error: string;
  raw_text: string;
}

export interface SearchResult {
  faq: FAQ;
  match_type: "exact" | "semantic";
  similarity_score: number;
}

// --- Clustering Analysis ---
export interface ErrorCluster {
  cluster_id: number;
  label: string;          // Formed cluster category label (e.g., Database Connection Errors)
  count: number;          // Number of events in this cluster
  layanan_distribution: Record<string, number>;
  deskripsi_contoh: string[];
  rekomendasi_preventif: string;
}

// --- Analytics Dashboard Stats ---
export interface AnalyticsStats {
  total_searches: number;
  success_rate: number;   // Percentage of errors resolved (solution found)
  by_layanan: { name: string; count: number }[];
  by_time: { date: string; total: number; resolved: number }[];
  most_frequent_errors: { kode_error: string; layanan: string; count: number }[];
}

// --- Application Navigation Tab ---
export type AppTab = "app" | "docs" | "diagrams";
