"use client";

import React from "react";
import {
  LayoutDashboard,
  Activity,
  History,
  Users,
  FileText,
  Settings,
  Sparkles,
  Plus,
  Sliders,
  ChevronRight,
} from "lucide-react";

export interface SidebarNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onNewAnalysis: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  historyCount: number;
  onClose?: () => void;
}

const navItemBase =
  "w-full justify-start h-11 rounded-xl font-medium text-sm transition-all border border-transparent flex items-center px-3.5";
const navItemIdle =
  "text-slate-400 hover:text-white hover:bg-white/[0.04] hover:border-white/10";
const navItemActiveSky =
  "bg-sky-500/10 text-sky-300 border-sky-400/30 shadow-inner";
const navItemActiveAmber =
  "bg-amber-500/10 text-amber-300 border-amber-400/30 shadow-inner";

export function SidebarNav({
  activeTab,
  onSelectTab,
  onNewAnalysis,
  onOpenHistory,
  onOpenSettings,
  historyCount,
}: SidebarNavProps) {
  return (
    <div className="flex flex-col h-full text-slate-100">
      {/* Brand Header — pure dark glass */}
      <div className="h-[68px] flex items-center px-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 ring-1 ring-white/15">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-base tracking-tight text-white">SuaraAI</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-semibold">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Next-Gen Video Intelligence</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <button
          onClick={onNewAnalysis}
          className="w-full justify-start h-11 rounded-xl mb-3 text-sm bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white font-semibold active:scale-[0.98] transition-all flex items-center px-3.5 shadow-lg shadow-sky-500/20"
        >
          <Plus className="size-4 mr-2.5 stroke-[2.5]" />
          Analisis Baru
        </button>

        <button
          onClick={() => onSelectTab("dashboard")}
          className={`${navItemBase} ${activeTab === "dashboard" ? navItemActiveSky : navItemIdle}`}
        >
          <LayoutDashboard className="size-4 mr-3" /> Dashboard Studio
        </button>

        <button
          onClick={() => onSelectTab("ffmpeg")}
          className={`${navItemBase} ${activeTab === "ffmpeg" ? navItemActiveAmber : navItemIdle}`}
        >
          <Activity className="size-4 mr-3 text-amber-400" /> FFmpeg Peak Time
        </button>

        <button
          onClick={() => onSelectTab("channel")}
          className={`${navItemBase} ${activeTab === "channel" ? navItemActiveSky : navItemIdle}`}
        >
          <Users className="size-4 mr-3" /> Channel & DNA
        </button>

        <button
          onClick={() => onSelectTab("manual")}
          className={`${navItemBase} ${activeTab === "manual" ? navItemActiveSky : navItemIdle}`}
        >
          <FileText className="size-4 mr-3" /> Transkrip Manual
        </button>

        <button
          onClick={() => onSelectTab("input")}
          className={`${navItemBase} ${activeTab === "input" ? navItemActiveSky : navItemIdle}`}
        >
          <Sliders className="size-4 mr-3" /> Panel Input
        </button>

        <div className="pt-5 pb-2 border-t border-white/10 mt-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 px-3 mb-2">
            Penyimpanan & AI
          </div>

          <button
            onClick={onOpenHistory}
            className={`${navItemBase} ${navItemIdle} flex justify-between`}
          >
            <span className="flex items-center">
              <History className="size-4 mr-3" /> Riwayat Analisis
            </span>
            {historyCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-sky-500/20 text-sky-300 font-semibold">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className={`${navItemBase} ${navItemIdle}`}
          >
            <Settings className="size-4 mr-3" /> Konfigurasi AI
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-white/10 text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
        <ChevronRight className="size-3 text-sky-400" />
        v3.2 Online
      </div>
    </div>
  );
}
