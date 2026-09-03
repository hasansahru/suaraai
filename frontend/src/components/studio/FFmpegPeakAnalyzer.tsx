"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Activity,
  Zap,
  Sparkles,
  Search,
  BarChart2
} from "lucide-react";

export interface PeakSegment {
  rank: number;
  start_time: string;
  end_time: string;
  start_sec: number;
  end_sec: number;
  peak_time: string;
  peak_sec: number;
  max_volume_db: number;
  mean_volume_db: number;
  energy_score: number;
  suggested_hook: string;
}

export interface FFmpegPeakAnalyzerProps {
  apiBase: string;
  onApplySegment?: (startTime: string, endTime: string, hook: string) => void;
}

export function FFmpegPeakAnalyzer({ apiBase, onApplySegment }: FFmpegPeakAnalyzerProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [clipDuration, setClipDuration] = useState(60);
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!youtubeUrl.trim()) {
      toast.warning("Masukkan URL YouTube terlebih dahulu.");
      return;
    }

    setLoading(true);
    setAnalysisResult(null);
    const toastId = toast.loading("FFmpeg sedang memindai volume & audio stream...");

    try {
      const res = await fetch(`${apiBase}/api/ffmpeg/peak-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtube_url: youtubeUrl.trim(),
          clip_duration: clipDuration,
          top_k: topK
        })
      });

      const data = await res.json().catch(() => ({ detail: `HTTP ${res.status} ${res.statusText}` }));
      if (res.ok && data.status === "success") {
        setAnalysisResult(data.data);
        toast.success(`Berhasil! Ditemukan ${data.data.peak_segments?.length || 0} segmen puncak viral.`, { id: toastId });
      } else {
        toast.error(data.detail || "Gagal memproses analisis FFmpeg peak time.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Gagal terhubung ke backend audio analyzer: ${err?.message || err}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="surface-elevated border-border/80">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30">
              <Activity className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                FFmpeg Peak Time Analyzer
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-mono">
                  Audio RMS & Peak Waveform
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Pindai lonjakan desibel (dB) dan energi vokal pembicara untuk menemukan titik emas hook Shorts/TikTok.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-7">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                URL YouTube Sumber
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="pl-9 h-11 bg-background/80"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Target Durasi Klip
              </label>
              <select
                value={clipDuration}
                onChange={(e) => setClipDuration(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg border border-input bg-background/80 text-sm font-medium focus:ring-1 focus:ring-primary outline-none"
              >
                <option value={30}>30 Detik (Shorts Cepat)</option>
                <option value={45}>45 Detik (Shorts Hook)</option>
                <option value={60}>60 Detik (Standard Viral)</option>
                <option value={75}>75 Detik (Deep Hook)</option>
                <option value={90}>90 Detik (Full Story)</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Pindai...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="size-4" />
                    Analisis
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results View */}
      {analysisResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="surface p-4 border-border/80">
              <div className="text-xs text-muted-foreground font-mono mb-1">Total Durasi</div>
              <div className="text-lg font-bold font-mono text-foreground">
                {Math.floor(analysisResult.duration_sec / 60)}m {Math.floor(analysisResult.duration_sec % 60)}s
              </div>
            </Card>
            <Card className="surface p-4 border-border/80">
              <div className="text-xs text-muted-foreground font-mono mb-1">Max Audio Volume</div>
              <div className="text-lg font-bold font-mono text-amber-500">
                {analysisResult.stats?.max_volume_db ? `${analysisResult.stats.max_volume_db.toFixed(1)} dB` : "-"}
              </div>
            </Card>
            <Card className="surface p-4 border-border/80">
              <div className="text-xs text-muted-foreground font-mono mb-1">Mean Energy Level</div>
              <div className="text-lg font-bold font-mono text-sky-400">
                {analysisResult.stats?.mean_volume_db ? `${analysisResult.stats.mean_volume_db.toFixed(1)} dB` : "-"}
              </div>
            </Card>
            <Card className="surface p-4 border-border/80">
              <div className="text-xs text-muted-foreground font-mono mb-1">Deteksi Segmen</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {analysisResult.peak_segments?.length || 0} Klip Puncak
              </div>
            </Card>
          </div>

          <Card className="surface-elevated border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart2 className="size-4 text-amber-500" />
                  Rekomendasi Klip Audio Puncak (Paling Potensial Viral)
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  Urutan Berdasarkan Energi Vokal
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysisResult.peak_segments?.map((seg: PeakSegment, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 font-mono font-black flex items-center justify-center shrink-0">
                      #{seg.rank || idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-foreground">
                          {seg.start_time} - {seg.end_time}
                        </span>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          Puncak: {seg.peak_time}
                        </Badge>
                        <Badge className="bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-[10px] border border-sky-500/30">
                          Energi {seg.energy_score ? `${(seg.energy_score * 100).toFixed(0)}%` : "Tinggi"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        &ldquo;{seg.suggested_hook || `Lonjakan volume di ${seg.peak_time} (${seg.max_volume_db?.toFixed(1)} dB)`}&rdquo;
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {onApplySegment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplySegment(seg.start_time, seg.end_time, seg.suggested_hook || "")}
                        className="text-xs font-semibold h-8 border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Sparkles className="size-3.5 mr-1.5" />
                        Gunakan untuk Analisis
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

