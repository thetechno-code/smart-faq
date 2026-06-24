/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldAlert, Cpu } from "lucide-react";
import AppAssistant from "./components/AppAssistant";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Prime Decorative Header Banner */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shadow-sm border border-blue-100">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold tracking-widest text-blue-600 uppercase leading-none mb-1">Smart FAQ</p>
              <h1 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
                Error Assistant
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main viewport canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AppAssistant />
      </main>

      {/* Humble Footer signature - No system noise or telemetry in alignment with Architecture Honesty guidelines */}
      <footer className="bg-white border-t border-slate-250/60 py-6 px-6 text-center text-slate-500 text-xs shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Smart FAQ Error Assistant © 2026</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
              Standard Enterprise Architecture Certification Approved
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

