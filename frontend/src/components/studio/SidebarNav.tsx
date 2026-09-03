"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Activity,
  History,
  Users,
  FileText,
  Settings,
  Sparkles,
  Plus,
  Sliders
} from "lucide-react";

interface SidebarNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onNewAnalysis: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  historyCount: number;
}

export function SidebarNav({
  activeTab,
  onSelectTab,
  onNewAnalysis,
  onOpenHistory,
  onOpenSettings,
  historyCount
}: SidebarNavProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-[72px] flex items-center px-6 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 ring-1 ring-white/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-foreground">SuaraAI</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">Studio</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Next-Gen Video Intelligence</p>
          </div>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto custom-scrollbar">
        <Button
          onClick={onNewAnalysis}
          className="w-full justify-start h-11 rounded-xl mb-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md shadow-primary/20 active:scale-[0.98]"
        >
          <Plus className="size-4 mr-2.5 stroke-[2.5]" />
          Analisis Baru
        </Button>

        <Button
          variant="ghost"
          onClick={() => onSelectTab("dashboard")}
          className={`w-full justify-start h-10 rounded-xl font-semibold transition-all ${
            activeTab === "dashboard"
              ? "bg-primary/15 text-primary border-l-4 border-primary pl-3"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <LayoutDashboard className="size-4 mr-3" /> Dashboard Studio
        </Button>

        <Button
          variant="ghost"
          onClick={() => onSelectTab("ffmpeg")}
          className={`w-full justify-start h-10 rounded-xl font-semibold transition-all ${
            activeTab === "ffmpeg"
              ? "bg-amber-500/15 text-amber-400 border-l-4 border-amber-500 pl-3"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Activity className="size-4 mr-3 text-amber-500" /> FFmpeg Peak Time
        </Button>

        <Button
          variant="ghost"
          onClick={() => onSelectTab("channel")}
          className={`w-full justify-start h-10 rounded-xl font-semibold transition-all ${
            activeTab === "channel"
              ? "bg-primary/15 text-primary border-l-4 border-primary pl-3"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Users className="size-4 mr-3" /> Channel & DNA
        </Button>

        <Button
          variant="ghost"
          onClick={() => onSelectTab("manual")}
          className={`w-full justify-start h-10 rounded-xl font-semibold transition-all ${
            activeTab === "manual"
              ? "bg-primary/15 text-primary border-l-4 border-primary pl-3"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <FileText className="size-4 mr-3" /> Transkrip Manual
        </Button>

        <div className="pt-6 pb-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/80 px-3 mb-2">
            Penyimpanan & AI
          </div>

          <Button
            variant="ghost"
            onClick={onOpenHistory}
            className="w-full justify-between h-10 rounded-xl font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40"
          >
            <span className="flex items-center">
              <History className="size-4 mr-3" /> Riwayat Analisis
            </span>
            {historyCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-primary/20 text-primary font-bold">
                {historyCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={onOpenSettings}
            className="w-full justify-start h-10 rounded-xl font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40"
          >
            <Settings className="size-4 mr-3" /> Konfigurasi AI
          </Button>
        </div>
      </div>
    </div>
  );
}
