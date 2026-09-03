"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Link2,
  FileText,
  Clock,
  Layers,
  Search,
  Activity,
  ChevronRight,
  Zap,
  Sliders,
  Play
} from "lucide-react";

interface DashboardViewProps {
  youtubeUrl: string;
  setYoutubeUrl: (url: string) => void;
  useManual: boolean;
  setUseManual: (manual: boolean) => void;
  manualTranscript: string;
  setManualTranscript: (text: string) => void;
  channelDna: string;
  setChannelDna: (id: string) => void;
  outputType: string;
  setOutputType: (type: string) => void;
  duration: string;
  setDuration: (dur: string) => void;
  shotCount: number;
  setShotCount: (cnt: number) => void;
  extraNotes: string;
  setExtraNotes: (notes: string) => void;
  keywordQuery: string;
  setKeywordQuery: (q: string) => void;
  keywordSuggestions: string[];
  keywordLoading: boolean;
  selectedKeywords: string[];
  toggleKeyword: (kw: string) => void;
  loading: boolean;
  loadingStep: string;
  onRunAnalysis: () => void;
  onOpenFFmpegPeak: () => void;
}

export function DashboardView({
  youtubeUrl,
  setYoutubeUrl,
  useManual,
  setUseManual,
  manualTranscript,
  setManualTranscript,
  channelDna,
  setChannelDna,
  outputType,
  setOutputType,
  duration,
  setDuration,
  shotCount,
  setShotCount,
  extraNotes,
  setExtraNotes,
  keywordQuery,
  setKeywordQuery,
  keywordSuggestions,
  keywordLoading,
  selectedKeywords,
  toggleKeyword,
  loading,
  loadingStep,
  onRunAnalysis,
  onOpenFFmpegPeak
}: DashboardViewProps) {
  const isShorts = outputType === "shorts";

  return (
    <div className="space-y-6">
      {/* Top Banner Feature: FFmpeg Peak Time */}
      <div className="surface-elevated p-5 rounded-2xl border border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 flex items-center justify-center shrink-0">
            <Activity className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">FFmpeg Audio Peak Analyzer</h3>
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px]">
                Audio RMS Waveform
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Otomatis mendeteksi momen klimaks video berbasis lonjakan volume decibel untuk hook Shorts/TikTok.
            </p>
          </div>
        </div>
        <Button
          onClick={onOpenFFmpegPeak}
          variant="outline"
          className="shrink-0 h-9 font-semibold text-xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
        >
          <Zap className="size-3.5 mr-1.5" />
          Buka Peak Analyzer
        </Button>
      </div>

      {/* Input Studio Card */}
      <Card className="surface-elevated border-border/80 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Input Konten Video
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Pilih sumber analisis video: otomatis dari URL YouTube atau tempel transkrip manual.
              </CardDescription>
            </div>
            <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setUseManual(false)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  !useManual
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                URL YouTube
              </button>
              <button
                type="button"
                onClick={() => setUseManual(true)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  useManual
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Transkrip Manual
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!useManual ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                URL YouTube Target
              </label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="pl-10 h-11 bg-background/80"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Transkrip Teks Manual
              </label>
              <Textarea
                placeholder="Tempel transkrip percakapan atau naskah video di sini..."
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                rows={5}
                className="bg-background/80 resize-y text-xs font-mono"
              />
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Format Output */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Format Konten Output
              </label>
              <select
                value={outputType}
                onChange={(e) => setOutputType(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-input bg-background/80 text-sm font-medium focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="shorts">Shorts / Reels / TikTok (Vertikal)</option>
                <option value="video_panjang">Video YouTube Reguler (Horizontal)</option>
              </select>
            </div>

            {/* Target Durasi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Target Durasi
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-input bg-background/80 text-sm font-medium focus:ring-1 focus:ring-primary outline-none"
              >
                {isShorts ? (
                  <>
                    <option value="30s">30 Detik (Fast Paced)</option>
                    <option value="45s">45 Detik (Hook & Core)</option>
                    <option value="60s">60 Detik (Standard Viral)</option>
                    <option value="75s">75 Detik (Deep Value)</option>
                    <option value="90s">90 Detik (Story / Carousel)</option>
                  </>
                ) : (
                  <>
                    <option value="5-15m">5 - 15 Menit (Eksplorasi Ringkas)</option>
                    <option value="15-30m">15 - 30 Menit (Eksplorasi Mendalam)</option>
                    <option value="30-60m">30 - 60 Menit (Deep Dive Podcast)</option>
                    <option value="1-2j">1 - 2 Jam (Masterclass / Monolog)</option>
                    <option value="2-4j">2 - 4 Jam (Full Audio Documentary)</option>
                  </>
                )}
              </select>
            </div>

            {/* Jumlah Shot atau Variasi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isShorts ? "Jumlah Shot / Scene" : "Kedalaman Riset AI"}
              </label>
              {isShorts ? (
                <select
                  value={shotCount}
                  onChange={(e) => setShotCount(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background/80 text-sm font-medium focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value={3}>3 Shot (Ringkas & Padat)</option>
                  <option value={5}>5 Shot (Standar Dinamis)</option>
                  <option value={7}>7 Shot (Detail & Variatif)</option>
                  <option value={10}>10 Shot (Ultra Dinamis)</option>
                </select>
              ) : (
                <div className="h-11 px-3 rounded-lg border border-input bg-muted/30 flex items-center text-xs font-medium text-muted-foreground">
                  Otomatis Menyesuaikan Pola Transkrip
                </div>
              )}
            </div>
          </div>

          {/* YouTube Suggestions Keywords */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Riset Keyword YouTube Real-Time
              </label>
              {keywordLoading && (
                <span className="text-[11px] font-mono text-primary flex items-center gap-1.5">
                  <span className="size-3 border border-primary border-t-transparent rounded-full animate-spin" />
                  Mencari saran...
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Ketik topik untuk mengambil rekomendasi kata kunci trending YouTube..."
                value={keywordQuery}
                onChange={(e) => setKeywordQuery(e.target.value)}
                className="pl-10 h-10 bg-background/80 text-xs"
              />
            </div>
            {keywordSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {keywordSuggestions.map((kw, i) => {
                  const isSelected = selectedKeywords.includes(kw);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleKeyword(kw)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                          : "bg-muted/40 hover:bg-muted text-foreground border-border/60 font-medium"
                      }`}
                    >
                      {kw}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Extra Notes */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Instruksi Tambahan AI (Opsional)
            </label>
            <Input
              placeholder="Contoh: Fokus pada sudut pandang psikologi, sertakan kutipan Seneca di akhir..."
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              className="h-10 bg-background/80 text-xs"
            />
          </div>

          {/* Action Button */}
          <div className="pt-3">
            <Button
              onClick={onRunAnalysis}
              disabled={loading}
              className="w-full h-12 text-sm font-bold bg-gradient-to-r from-primary via-indigo-600 to-sky-500 hover:opacity-90 text-white shadow-lg shadow-primary/25 rounded-xl active:scale-[0.99] transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2.5">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{loadingStep || "Sedang memproses analisis AI..."}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4" />
                  <span>Mulai Analisis SuaraAI</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

