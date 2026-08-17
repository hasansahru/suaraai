"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
    FileText,
    TrendingUp,
    Layers,
    Heading,
    Image as ImageIcon,
    Search,
    Video,
    BarChart3,
    Copy,
    Check,
    Sparkles,
    ExternalLink,
    Volume2,
    AlertTriangle,
    Lightbulb,
    Clock,
    Target,
    Wand2,
    Film
} from "lucide-react";

interface AnalysisResultPanelProps {
    result: any;
    outputType: "shorts" | "video_panjang" | string;
    onGenerateTTS?: (text: string) => void;
    onGenerateImage?: (prompt: string) => void;
}

export function AnalysisResultPanel({
    result,
    outputType,
    onGenerateTTS,
    onGenerateImage,
}: AnalysisResultPanelProps) {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [selectedShotIndex, setSelectedShotIndex] = useState<number>(0);

    if (!result) return null;

    const data = result.result || {};
    const isShorts = outputType === "shorts";
    const shots = data.shots || [];
    const activeShot = shots[selectedShotIndex] || shots[0] || {};
    const videoPanjang = data.video_panjang || {};

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header Info Banner */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/60 backdrop-blur-md p-5 rounded-2xl border border-border/40 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">
                            Hasil Analisis Konten AI
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Format: <span className="font-semibold capitalize text-primary">{outputType}</span> | Status: <span className="text-emerald-500 font-semibold">Selesai</span>
                        </p>
                    </div>
                </div>

                {/* Duration Warning / Info */}
                {result.duration_warnings && result.duration_warnings.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs rounded-xl">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{result.duration_warnings[0]}</span>
                    </div>
                )}
            </div>

            {/* 8 Tabs Header */}
            <Tabs defaultValue="ringkasan" className="space-y-6">
                <div className="border-b border-border/40 pb-3 overflow-x-auto">
                    <TabsList className="bg-muted/40 p-1 flex items-center gap-1.5 rounded-xl w-max min-w-full md:min-w-0">
                        <TabsTrigger
                            value="ringkasan"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Ringkasan</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="strategi"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
                        >
                            <TrendingUp className="w-4 h-4" />
                            <span>Strategi & Growth</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="segmen"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
                        >
                            <Layers className="w-4 h-4" />
                            <span>Segmen</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="judul"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
                        >
                            <Heading className="w-4 h-4" />
                            <span>Judul</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="thumbnail"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
                        >
                            <ImageIcon className="w-4 h-4" />
                            <span>Thumbnail</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="seo"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
                        >
                            <Search className="w-4 h-4" />
                            <span>SEO</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="editing"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
                        >
                            <Video className="w-4 h-4" />
                            <span>Editing</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="performa"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span>Performa</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* TAB 1: RINGKASAN */}
                <TabsContent value="ringkasan" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Core Message Card */}
                        <Card className="p-6 space-y-4 bg-card/60 backdrop-blur-xs border-border/40">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                    Pesan Utama (Core Message)
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleCopy(data.pesan_utama || "", "core_msg")}
                                >
                                    {copiedKey === "core_msg" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                </Button>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-xl border border-border/30">
                                {data.pesan_utama || "Pesan utama tidak tersedia."}
                            </p>
                        </Card>

                        {/* Unique Angle Card */}
                        <Card className="p-6 space-y-4 bg-card/60 backdrop-blur-xs border-border/40">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary" />
                                    Sudut Pandang Unik (Unique Angle)
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleCopy(data.sudut_pandang_unik || "", "angle")}
                                >
                                    {copiedKey === "angle" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                </Button>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-xl border border-border/30">
                                {data.sudut_pandang_unik || "Sudut pandang unik tidak tersedia."}
                            </p>
                        </Card>
                    </div>

                    {/* Web Sources Reference */}
                    {result.web_sources && result.web_sources.length > 0 && (
                        <Card className="p-6 space-y-3 bg-card/60 border-border/40">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Search className="w-4 h-4 text-blue-500" />
                                Sumber Riset Web Real-time ({result.web_sources.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                {result.web_sources.map((s: any, idx: number) => (
                                    <a
                                        key={idx}
                                        href={s.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-3 bg-muted/20 hover:bg-muted/40 rounded-xl border border-border/30 flex items-center justify-between text-xs text-foreground/80 hover:text-primary transition-colors group"
                                    >
                                        <span className="truncate pr-2">{s.title || s.url}</span>
                                        <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
                                    </a>
                                ))}
                            </div>
                        </Card>
                    )}
                </TabsContent>

                {/* TAB 2: STRATEGI & GROWTH */}
                <TabsContent value="strategi" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Target Audience */}
                        <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-500" />
                                Target Audiens & Psikologi
                            </h3>
                            <div className="space-y-3 text-xs">
                                <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                                    <span className="font-semibold text-foreground block mb-1">Demografi & Niche:</span>
                                    <p className="text-muted-foreground">{isShorts ? activeShot.target_audiens || "Semua audiens" : videoPanjang.target_audiens || "Semua audiens"}</p>
                                </div>
                            </div>
                        </Card>

                        {/* Content Strategy Overview */}
                        <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                Strategi Retensi & Engagement
                            </h3>
                            <div className="space-y-3 text-xs">
                                <div className="bg-muted/20 p-3 rounded-xl border border-border/30">
                                    <span className="font-semibold text-foreground block mb-1">Pemicu Emosi:</span>
                                    <p className="text-muted-foreground">{isShorts ? activeShot.strategi_konten?.pemicu_emosi : videoPanjang.strategi_konten?.pemicu_emosi || "Rasa ingin tahu"}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 3: SEGMEN */}
                <TabsContent value="segmen" className="space-y-6">
                    {isShorts ? (
                        /* SHORTS SEGMENTS (Shots Picker) */
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                {shots.map((shot: any, idx: number) => (
                                    <Button
                                        key={idx}
                                        variant={selectedShotIndex === idx ? "default" : "outline"}
                                        size="sm"
                                        className="rounded-xl text-xs whitespace-nowrap"
                                        onClick={() => setSelectedShotIndex(idx)}
                                    >
                                        Shot #{idx + 1} ({shot.durasi_detik || 60}s)
                                    </Button>
                                ))}
                            </div>

                            <Card className="p-6 space-y-6 bg-card/60 border-border/40">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Film className="w-4 h-4 text-primary" />
                                        Naskah Shot #{selectedShotIndex + 1}
                                    </h3>
                                    {onGenerateTTS && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-2 text-xs rounded-xl"
                                            onClick={() => onGenerateTTS(activeShot.naskah?.visual_audio?.map((va: any) => va.audio).join(" ") || "")}
                                        >
                                            <Volume2 className="w-3.5 h-3.5 text-primary" />
                                            Generate TTS Voice
                                        </Button>
                                    )}
                                </div>

                                {/* Visual Audio Table / Blocks */}
                                <div className="space-y-3">
                                    {(activeShot.naskah?.visual_audio || []).map((va: any, i: number) => (
                                        <div key={i} className="p-4 bg-muted/20 border border-border/30 rounded-xl space-y-2">
                                            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                                                <span className="text-primary">Klip #{i + 1} ({va.durasi_detik || 5}s)</span>
                                                <span>{va.tipe_shot || "Medium Shot"}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                <div className="bg-background/50 p-2.5 rounded-lg border border-border/20">
                                                    <span className="font-semibold text-foreground block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Visual Prompt</span>
                                                    <p className="text-foreground/90">{va.visual}</p>
                                                    {onGenerateImage && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="mt-2 h-7 text-[11px] px-2 text-primary hover:text-primary gap-1"
                                                            onClick={() => onGenerateImage(va.visual)}
                                                        >
                                                            <Wand2 className="w-3 h-3" /> Gen Image
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="bg-background/50 p-2.5 rounded-lg border border-border/20">
                                                    <span className="font-semibold text-foreground block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Voiceover / Audio</span>
                                                    <p className="text-foreground/90">{va.audio}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    ) : (
                        /* VIDEO PANJANG OUTLINE / SEGMEN */
                        <Card className="p-6 space-y-6 bg-card/60 border-border/40">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" />
                                Struktur Segmen Video Panjang
                            </h3>
                            <div className="space-y-3">
                                {(videoPanjang.strategi_konten?.outline || []).map((chapter: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-muted/20 border border-border/30 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                            <span>Bab {idx + 1}: {chapter.judul_bab}</span>
                                            <Badge variant="secondary" className="text-[10px]">{chapter.estimasi_durasi || "2m"}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{chapter.deskripsi_singkat}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </TabsContent>

                {/* TAB 4: JUDUL */}
                <TabsContent value="judul" className="space-y-6">
                    <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Heading className="w-4 h-4 text-emerald-500" />
                            Opsi Judul Video Rekomendasi
                        </h3>
                        <div className="space-y-2.5">
                            {((isShorts ? activeShot.judul?.opsi : videoPanjang.judul?.opsi) || []).map((op: string, idx: number) => (
                                <div key={idx} className="p-3.5 bg-muted/20 border border-border/30 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-primary/40 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </span>
                                        <span className="font-medium text-foreground">{op}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        onClick={() => handleCopy(op, `title_${idx}`)}
                                    >
                                        {copiedKey === `title_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                {/* TAB 5: THUMBNAIL */}
                <TabsContent value="thumbnail" className="space-y-6">
                    <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-purple-500" />
                            Konsep & Prompt Visual Thumbnail
                        </h3>

                        {(() => {
                            const thumb = isShorts ? activeShot.thumbnail : videoPanjang.thumbnail;
                            if (!thumb) return <p className="text-xs text-muted-foreground">Tidak ada data thumbnail.</p>;

                            return (
                                <div className="space-y-4 text-xs">
                                    <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                        <span className="font-bold text-foreground block">Teks Pada Thumbnail:</span>
                                        <p className="text-primary font-semibold text-sm bg-background/60 p-2.5 rounded-lg border border-border/20">{thumb.teks_thumbnail || "-"}</p>
                                    </div>

                                    <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                        <span className="font-bold text-foreground block">Deskripsi Visual:</span>
                                        <p className="text-muted-foreground leading-relaxed">{thumb.deskripsi_visual || "-"}</p>
                                    </div>

                                    {thumb.prompt_ai && (
                                        <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-foreground">Prompt AI (Midjourney / Flux / DALL-E):</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-[11px] gap-1"
                                                    onClick={() => handleCopy(thumb.prompt_ai, "thumb_prompt")}
                                                >
                                                    {copiedKey === "thumb_prompt" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copy Prompt
                                                </Button>
                                            </div>
                                            <p className="text-xs font-mono bg-background/80 p-3 rounded-lg border border-border/30 text-foreground/90 break-words">{thumb.prompt_ai}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </Card>
                </TabsContent>

                {/* TAB 6: SEO */}
                <TabsContent value="seo" className="space-y-6">
                    <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Search className="w-4 h-4 text-blue-500" />
                            Optimasi SEO & Metadata
                        </h3>

                        {(() => {
                            const seoData = isShorts ? activeShot.seo : videoPanjang.seo;
                            if (!seoData) return <p className="text-xs text-muted-foreground">Tidak ada data SEO.</p>;

                            return (
                                <div className="space-y-4 text-xs">
                                    <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-foreground">Deskripsi Video:</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-[11px] gap-1"
                                                onClick={() => handleCopy(seoData.deskripsi || "", "seo_desc")}
                                            >
                                                {copiedKey === "seo_desc" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copy Deskripsi
                                            </Button>
                                        </div>
                                        <p className="text-muted-foreground whitespace-pre-line bg-background/50 p-3 rounded-lg border border-border/20 leading-relaxed">{seoData.deskripsi || "-"}</p>
                                    </div>

                                    {/* Keywords */}
                                    {seoData.kata_kunci_utama && (
                                        <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                            <span className="font-bold text-foreground block">Kata Kunci Utama:</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(seoData.kata_kunci_utama || []).map((kw: string, i: number) => (
                                                    <Badge key={i} variant="secondary" className="text-[11px]">{kw}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {seoData.tags && (
                                        <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                            <span className="font-bold text-foreground block">Tags YouTube:</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(seoData.tags || []).map((t: string, i: number) => (
                                                    <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </Card>
                </TabsContent>

                {/* TAB 7: EDITING */}
                <TabsContent value="editing" className="space-y-6">
                    <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Video className="w-4 h-4 text-rose-500" />
                            Instruksi & Panduan Editing
                        </h3>

                        {(() => {
                            const editData = isShorts ? activeShot.editing : videoPanjang.editing;
                            if (!editData) return <p className="text-xs text-muted-foreground">Tidak ada instruksi editing.</p>;

                            return (
                                <div className="space-y-3 text-xs">
                                    <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                        <span className="font-bold text-foreground block">Rekomendasi Visual & Sound Design:</span>
                                        <ul className="list-disc list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                                            {(editData.rekomendasi || editData.gaya_visual || []).map((rec: string, i: number) => (
                                                <li key={i}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })()}
                    </Card>
                </TabsContent>

                {/* TAB 8: PERFORMA */}
                <TabsContent value="performa" className="space-y-6">
                    <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-amber-500" />
                            Prediksi Performa & Rekomendasi
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                <span className="font-semibold text-foreground block">Estimasi Click-Through Rate (CTR):</span>
                                <p className="text-lg font-bold text-emerald-500">8.5% - 12.0%</p>
                                <p className="text-[11px] text-muted-foreground">Berdasarkan keselarasan hook dan thumbnail visual.</p>
                            </div>

                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                <span className="font-semibold text-foreground block">Estimasi Audiense Retention:</span>
                                <p className="text-lg font-bold text-primary">65% - 75%</p>
                                <p className="text-[11px] text-muted-foreground">Didukung oleh struktur pacing visual yang cepat.</p>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
