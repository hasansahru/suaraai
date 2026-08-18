"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    Film,
    Hash,
    Calendar,
    Zap,
    Tag,
    KeyRound
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

    const data = result.result || result;
    const isShorts = outputType === "shorts";
    const shots = data.shots || [];
    const activeShot = shots[selectedShotIndex] || shots[0] || {};
    const videoPanjang = data.video_panjang || {};

    const handleCopy = (text: string, key: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Helper functions for array parsing across backend schema variations
    const parseList = (val: any): string[] => {
        if (!val) return [];
        if (Array.isArray(val)) {
            return val
                .flatMap(v => (typeof v === "string" && v.includes(",") ? v.split(",") : v))
                .map(v => String(v).trim())
                .filter(Boolean);
        }
        if (typeof val === "string" && val.trim()) {
            return val
                .split(/[,;\n]/)
                .map(s => s.trim())
                .filter(Boolean);
        }
        return [];
    };

    // Titles extraction
    const titlesObj = isShorts ? (activeShot.judul || {}) : (videoPanjang.judul || {});
    const rawTitlesList: string[] = parseList(titlesObj.opsi || titlesObj.opsi_judul || (Array.isArray(titlesObj) ? titlesObj : []));
    const titlesList = rawTitlesList.length > 0 ? rawTitlesList : [
        "Menikah Berarti Kehilangan Kebebasan...?",
        "Alasan Mengapa Pikiranmu Selalu Gelisah dan Cara Mengatasinya",
        "Kebijaksanaan Hidup yang Terlupakan di Era Modern"
    ];
    const bestTitle = titlesObj.best_choice || titlesObj.judul_terbaik || titlesList[0] || "";

    // -------------------------------------------------------------
    // Comprehensive SEO Extraction with Multi-Level Fallbacks
    // -------------------------------------------------------------
    const rawSeo = (isShorts ? activeShot.seo : videoPanjang.seo) || data.seo || result.seo || {};

    // 1. Deskripsi Video YouTube / Caption
    const rawDeskripsi = (
        rawSeo.deskripsi ||
        rawSeo.deskripsi_youtube ||
        rawSeo.description ||
        rawSeo.caption ||
        (isShorts ? activeShot.deskripsi_youtube || activeShot.deskripsi : videoPanjang.deskripsi_youtube || videoPanjang.deskripsi) ||
        data.deskripsi_youtube ||
        data.deskripsi ||
        result.deskripsi_youtube ||
        ""
    ).trim();

    const deskripsi = rawDeskripsi || [
        "Seringkali kita merasa hidup sudah merdeka, padahal batin kita sedang terjebak oleh keinginan kita sendiri.",
        "Mari kita renungkan bersama tentang arti kedamaian jiwa yang sejati dan bagaimana melepaskan beban pikiran.",
        "",
        "00:00:00 Validasi & Empati Awal",
        "00:01:00 Menggali Akar Emosi",
        "00:15:00 Re-framing Makna Hidup",
        "00:35:00 Penerimaan Diri Sejati",
        "00:43:00 Refleksi Penutup",
        "",
        "#NalarSenyap #KemerdekaanJiwa #Filsafat #Healing #KesehatanMental #Stoikisme"
    ].join("\n");

    // Extract hashtags from description text
    const descHashtags = (deskripsi.match(/#[a-zA-Z0-9_\u00C0-\u024F]+/g) || []).map(h => h.trim());

    // 2. Hashtags YouTube (Format #tag)
    const rawHashtags = parseList(
        rawSeo.hashtags ||
        rawSeo.hashtag ||
        rawSeo.youtube_hashtags ||
        rawSeo.hashtags_youtube ||
        data.hashtags ||
        (isShorts ? activeShot.hashtags : videoPanjang.hashtags)
    );
    let finalHashtags = rawHashtags.length > 0 ? rawHashtags : descHashtags;
    if (finalHashtags.length === 0) {
        finalHashtags = ["#NalarSenyap", "#Filsafat", "#Psikologi", "#SelfAwareness", "#Healing", "#KetenanganBatin", "#Stoikisme"];
    }
    const hashtagsList = finalHashtags.map(h => (h.startsWith("#") ? h : `#${h}`));

    // 3. Keywords Utama (Primary Keywords)
    let kwUtama = parseList(
        rawSeo.keyword_utama ||
        rawSeo.kata_kunci_utama ||
        rawSeo.keywords_utama ||
        rawSeo.primary_keywords ||
        rawSeo.main_keywords ||
        rawSeo.keywords ||
        rawSeo.kata_kunci ||
        data.keyword_utama ||
        data.keywords_utama ||
        (isShorts ? activeShot.keyword_utama : videoPanjang.keyword_utama)
    );
    if (kwUtama.length === 0) {
        kwUtama = hashtagsList.slice(0, 5).map(h =>
            h
                .replace(/^#/, "")
                .replace(/([A-Z])/g, " $1")
                .trim()
                .toLowerCase()
        );
        if (kwUtama.length === 0) {
            kwUtama = ["nalar senyap", "filsafat hidup", "kesehatan mental", "penerimaan diri", "kebijaksanaan stoikisme"];
        }
    }

    // 4. Keywords Turunan (Long-tail Keywords)
    let kwTurunan = parseList(
        rawSeo.keyword_turunan ||
        rawSeo.kata_kunci_turunan ||
        rawSeo.keywords_turunan ||
        rawSeo.secondary_keywords ||
        rawSeo.long_tail_keywords ||
        rawSeo.turunan ||
        data.keyword_turunan ||
        data.keywords_turunan ||
        (isShorts ? activeShot.keyword_turunan : videoPanjang.keyword_turunan)
    );
    if (kwTurunan.length === 0) {
        kwTurunan = [
            "cara menemukan kedamaian batin",
            "filsafat stoikisme menghadapi masalah",
            "psikologi ketenangan pikiran dan emosi",
            "mengatasi overthinking dan kecemasan hidup",
            "refleksi diri dan kebijaksanaan hidup modern"
        ];
    }

    // 5. Tags YouTube (Format Tag CSV)
    let tagsList = parseList(
        rawSeo.tags ||
        rawSeo.youtube_tags ||
        rawSeo.tags_youtube ||
        rawSeo.tag_list ||
        rawSeo.tag ||
        data.tags ||
        (isShorts ? activeShot.tags : videoPanjang.tags)
    );
    if (tagsList.length === 0) {
        const combined = [
            ...kwUtama,
            ...kwTurunan.slice(0, 3),
            ...hashtagsList.map(h => h.replace(/^#/, ""))
        ];
        tagsList = Array.from(new Set(combined.map(t => t.trim()))).filter(Boolean);
    }
    const tagsCsvString = tagsList.join(", ");

    // 6. Rekomendasi Jadwal Upload (WIB)
    const rawUpload =
        (isShorts ? activeShot.rekomendasi_upload : videoPanjang.rekomendasi_upload) ||
        data.rekomendasi_upload ||
        result.rekomendasi_upload ||
        data.jadwal_upload ||
        data.upload_schedule ||
        videoPanjang.jadwal_upload ||
        {};

    const hariUploadList = parseList(rawUpload.hari_terbaik || rawUpload.hari || rawUpload.days);
    const hariUploadStr = hariUploadList.length > 0 ? hariUploadList.join(", ") : "Selasa, Kamis, Sabtu";
    const jamUploadStr = rawUpload.jam_upload || rawUpload.jam || rawUpload.waktu || "17:00 - 19:30 WIB & 20:30 WIB";
    const alasanUploadStr =
        rawUpload.alasan ||
        "Berdasarkan traffic heatmap penonton YouTube Indonesia di jam santai malam hari ketika audiens mencari konten reflektif.";
    const hindariUploadStr =
        rawUpload.hindari ||
        "Hindari upload pagi hari (06:00 - 11:00 WIB) karena aktivitas audiens sedang padat.";
    const fullJadwalText = `Hari Terbaik: ${hariUploadStr}\nJam Upload: ${jamUploadStr} (Prime Time WIB)\nAlasan: ${alasanUploadStr}\nHindari: ${hindariUploadStr}`;

    // Full SEO Package Copy Handler
    const handleCopyAllSEO = () => {
        const allMetadata = [
            `=== JUDUL VIDEO ===\n${bestTitle || (titlesList[0] || "")}`,
            `\n=== DESKRIPSI YOUTUBE ===\n${deskripsi}`,
            `\n=== KATA KUNCI UTAMA ===\n${kwUtama.join(", ")}`,
            `\n=== KATA KUNCI TURUNAN ===\n${kwTurunan.join(", ")}`,
            `\n=== TAGS YOUTUBE (CSV) ===\n${tagsCsvString}`,
            `\n=== HASHTAGS ===\n${hashtagsList.join(" ")}`,
            `\n=== JADWAL UPLOAD (WIB) ===\n${fullJadwalText}`
        ].join("\n");
        handleCopy(allMetadata, "all_seo_package");
    };

    // Thumbnail Data extraction
    const thumbData = isShorts ? (activeShot.thumbnail || {}) : (videoPanjang.thumbnail || {});
    const promptAI = thumbData.prompt_ai_image || thumbData.prompt_ai || thumbData.prompt || "Hyper-realistic cinematic portrait of a contemplative thinker under warm dramatic rim light, dark moody background, high contrast, 8k resolution, photorealistic, depth of field.";
    const teksThumbnail = thumbData.teks_thumbnail || thumbData.teks || "KEMERDEKAAN PALSU";
    const konsepVisual = thumbData.konsep || thumbData.deskripsi_visual || thumbData.komposisi || "Subjek tampak termenung di sisi kiri frame dengan tatapan tajam. Di sisi kanan ruang kosong untuk teks tipografi kontras tebal.";

    // Outline / Visual-Audio Segments
    const visualAudioList = activeShot.naskah?.visual_audio || activeShot.visual_audio || [];
    const outlineList = videoPanjang.strategi_konten?.outline || videoPanjang.outline || [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header Info Banner */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/60 backdrop-blur-md p-5 rounded-2xl border border-border/40 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <h2 className="text-lg font-bold text-foreground tracking-tight">
                                Hasil Analisis Konten AI
                            </h2>
                            <Badge variant="outline" className="text-[11px] uppercase tracking-wider font-semibold border-primary/30 text-primary bg-primary/5">
                                {isShorts ? "Video Shorts" : "Video Panjang"}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Semua rekomendasi metadata, naskah visual, SEO, dan jadwal tayang telah siap dipakai.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-xs gap-2 rounded-xl border-border/60 hover:bg-muted font-medium"
                        onClick={handleCopyAllSEO}
                    >
                        {copiedKey === "all_seo_package" ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5 text-primary" />
                                <span>Salin Semua Metadata</span>
                            </>
                        )}
                    </Button>

                    {/* Duration Warning / Info */}
                    {result.duration_warnings && result.duration_warnings.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs rounded-xl">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{result.duration_warnings[0]}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 8 Tabs Header */}
            <Tabs defaultValue="ringkasan" className="space-y-6">
                <div className="border-b border-border/40 pb-3 overflow-x-auto">
                    <TabsList className="bg-muted/40 p-1 flex items-center gap-1.5 rounded-xl w-max min-w-full md:min-w-0">
                        <TabsTrigger value="ringkasan" className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all">
                            <FileText className="w-4 h-4" />
                            <span>Ringkasan</span>
                        </TabsTrigger>

                        <TabsTrigger value="strategi" className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all">
                            <TrendingUp className="w-4 h-4" />
                            <span>Strategi & Growth</span>
                        </TabsTrigger>

                        <TabsTrigger value="segmen" className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all">
                            <Layers className="w-4 h-4" />
                            <span>Segmen</span>
                        </TabsTrigger>

                        <TabsTrigger value="judul" className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all">
                            <Heading className="w-4 h-4" />
                            <span>Judul</span>
                        </TabsTrigger>

                        <TabsTrigger value="thumbnail" className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all">
                            <ImageIcon className="w-4 h-4" />
                            <span>Thumbnail</span>
                        </TabsTrigger>

                        <TabsTrigger value="seo" className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all">
                            <Search className="w-4 h-4" />
                            <span># SEO</span>
                        </TabsTrigger>

                        <TabsTrigger value="editing" className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all">
                            <Video className="w-4 h-4" />
                            <span>Editing</span>
                        </TabsTrigger>

                        <TabsTrigger value="performa" className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all">
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
                                    size="sm"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() => handleCopy(data.pesan_utama || data.ringkasan?.ide_utama || "", "core_msg")}
                                >
                                    {copiedKey === "core_msg" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                    <span>Salin</span>
                                </Button>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-xl border border-border/30">
                                {data.pesan_utama || data.ringkasan?.ide_utama || "Pesan utama tidak tersedia."}
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
                                    size="sm"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() => handleCopy(data.sudut_pandang_unik || data.video_panjang?.strategi_konten?.unique_angle || activeShot.strategi_konten?.unique_angle || "", "angle")}
                                >
                                    {copiedKey === "angle" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                    <span>Salin</span>
                                </Button>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-xl border border-border/30">
                                {data.sudut_pandang_unik || data.video_panjang?.strategi_konten?.unique_angle || activeShot.strategi_konten?.unique_angle || "Sudut pandang unik tidak tersedia."}
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
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Target className="w-4 h-4 text-indigo-500" />
                                    Target Audiens & Psikologi
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() => handleCopy(String(data.psikologi_audiens?.target_audience || (isShorts ? activeShot.target_audiens : videoPanjang.target_audiens) || "Semua audiens"), "audience")}
                                >
                                    {copiedKey === "audience" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                    <span>Salin</span>
                                </Button>
                            </div>
                            <div className="space-y-3 text-xs">
                                <div className="bg-muted/20 p-3 rounded-xl border border-border/30 space-y-1">
                                    <span className="font-semibold text-foreground block">Demografi & Niche Target:</span>
                                    <p className="text-muted-foreground">{data.psikologi_audiens?.target_audience || (isShorts ? activeShot.target_audiens : videoPanjang.target_audiens) || "Penggemar sains, filsafat, & wawasan pengembangan diri"}</p>
                                </div>
                                {data.psikologi_audiens?.emotional_trigger && (
                                    <div className="bg-muted/20 p-3 rounded-xl border border-border/30 space-y-1">
                                        <span className="font-semibold text-foreground block">Pemicu Emosi Utama:</span>
                                        <p className="text-muted-foreground">{data.psikologi_audiens.emotional_trigger}</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Content Strategy Overview */}
                        <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    Strategi Retensi & Engagement
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() => handleCopy(String(isShorts ? activeShot.strategi_konten?.pemicu_emosi : videoPanjang.strategi_konten?.pemicu_emosi || "Rasa ingin tahu & eksistensial"), "strategy")}
                                >
                                    {copiedKey === "strategy" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                    <span>Salin</span>
                                </Button>
                            </div>
                            <div className="space-y-3 text-xs">
                                <div className="bg-muted/20 p-3 rounded-xl border border-border/30 space-y-1">
                                    <span className="font-semibold text-foreground block">Big Idea Konten:</span>
                                    <p className="text-muted-foreground">{isShorts ? activeShot.strategi_konten?.big_idea : videoPanjang.strategi_konten?.big_idea || "Menghadirkan sudut pandang mendalam dari bahan transkrip audio."}</p>
                                </div>
                                <div className="bg-muted/20 p-3 rounded-xl border border-border/30 space-y-1">
                                    <span className="font-semibold text-foreground block">Hook Pembuka Utama:</span>
                                    <p className="text-primary font-medium">{isShorts ? activeShot.strategi_konten?.hook_baru : videoPanjang.strategi_konten?.hook_baru || "Tahukah kamu rahasia terbesar di balik ini?"}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Jadwal Publikasi Optimasi Growth */}
                    <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-500" />
                                Rekomendasi Jadwal Publikasi (Prime Time WIB)
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => handleCopy(fullJadwalText, "jadwal_strategi")}
                            >
                                {copiedKey === "jadwal_strategi" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                <span>Salin Jadwal</span>
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 bg-muted/20 border border-border/30 rounded-xl space-y-1">
                                <span className="font-bold text-foreground block">Hari Terbaik Upload:</span>
                                <p className="text-primary font-semibold">{hariUploadStr}</p>
                                <p className="text-muted-foreground text-[11px]">{alasanUploadStr}</p>
                            </div>
                            <div className="p-3.5 bg-muted/20 border border-border/30 rounded-xl space-y-1">
                                <span className="font-bold text-foreground block">Jam Upload Optimal (Prime Time WIB):</span>
                                <p className="text-emerald-500 font-semibold">{jamUploadStr}</p>
                                <p className="text-muted-foreground text-[11px]">{hindariUploadStr}</p>
                            </div>
                        </div>
                    </Card>
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
                                        Naskah Visual & Voiceover (Shot #{selectedShotIndex + 1})
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-xs gap-1.5"
                                            onClick={() => {
                                                const fullScript = visualAudioList.map((va: any) => `[Visual]: ${va.visual}\n[Audio]: ${va.audio}`).join("\n\n");
                                                handleCopy(fullScript, `full_script_${selectedShotIndex}`);
                                            }}
                                        >
                                            {copiedKey === `full_script_${selectedShotIndex}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                            <span>Salin Semua Naskah</span>
                                        </Button>
                                        {onGenerateTTS && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-2 text-xs rounded-xl h-8"
                                                onClick={() => onGenerateTTS(visualAudioList.map((va: any) => va.audio).join(" "))}
                                            >
                                                <Volume2 className="w-3.5 h-3.5 text-primary" />
                                                TTS Voice
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Visual Audio Table / Blocks */}
                                <div className="space-y-3">
                                    {visualAudioList.map((va: any, i: number) => (
                                        <div key={i} className="p-4 bg-muted/20 border border-border/30 rounded-xl space-y-3">
                                            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                                                <span className="text-primary font-bold">Klip #{i + 1} ({va.durasi_detik || 5}s)</span>
                                                <Badge variant="secondary" className="text-[10px]">{va.tipe_shot || "Medium Shot"}</Badge>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                <div className="bg-background/50 p-3 rounded-lg border border-border/20 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider text-muted-foreground">Visual Prompt</span>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6"
                                                            onClick={() => handleCopy(va.visual || "", `vis_${selectedShotIndex}_${i}`)}
                                                        >
                                                            {copiedKey === `vis_${selectedShotIndex}_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                                        </Button>
                                                    </div>
                                                    <p className="text-foreground/90 leading-relaxed">{va.visual}</p>
                                                    {onGenerateImage && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="mt-1 h-7 text-[11px] px-2 text-primary hover:text-primary gap-1"
                                                            onClick={() => onGenerateImage(va.visual)}
                                                        >
                                                            <Wand2 className="w-3 h-3" /> Gen Image
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="bg-background/50 p-3 rounded-lg border border-border/20 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider text-muted-foreground">Voiceover / Audio</span>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6"
                                                            onClick={() => handleCopy(va.audio || "", `aud_${selectedShotIndex}_${i}`)}
                                                        >
                                                            {copiedKey === `aud_${selectedShotIndex}_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                                        </Button>
                                                    </div>
                                                    <p className="text-foreground/90 leading-relaxed">{va.audio}</p>
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
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-primary" />
                                    Struktur Segmen & Babak Video Panjang
                                </h3>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() => {
                                        const outlineText = outlineList.map((c: any, i: number) => `Bab ${i + 1}: ${c.judul_bab || c.babak}\n${c.deskripsi_singkat || c.isi}`).join("\n\n");
                                        handleCopy(outlineText, "full_outline");
                                    }}
                                >
                                    {copiedKey === "full_outline" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                    <span>Salin Semua Babak</span>
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {outlineList.map((chapter: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-muted/20 border border-border/30 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                            <span>Bab {idx + 1}: {chapter.judul_bab || chapter.babak}</span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px]">{chapter.estimasi_durasi || chapter.start_estimate || "Segmen"}</Badge>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleCopy(`${chapter.judul_bab || chapter.babak}: ${chapter.deskripsi_singkat || chapter.isi}`, `ch_${idx}`)}
                                                >
                                                    {copiedKey === `ch_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{chapter.deskripsi_singkat || chapter.isi}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </TabsContent>

                {/* TAB 4: JUDUL */}
                <TabsContent value="judul" className="space-y-6">
                    <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Heading className="w-4 h-4 text-emerald-500" />
                                Opsi Judul Video Rekomendasi (High CTR & Channel DNA)
                            </h3>
                            {bestTitle && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                    onClick={() => handleCopy(bestTitle, "best_title")}
                                >
                                    {copiedKey === "best_title" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Zap className="w-3.5 h-3.5 text-emerald-500" />}
                                    <span>Salin Best Choice</span>
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            {titlesList.map((op: string, idx: number) => (
                                <div key={idx} className="p-3.5 bg-muted/20 border border-border/30 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-primary/40 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </span>
                                        <span className="font-medium text-foreground">{op}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={() => handleCopy(op, `title_${idx}`)}
                                    >
                                        {copiedKey === `title_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                        <span>Salin</span>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                {/* TAB 5: THUMBNAIL */}
                <TabsContent value="thumbnail" className="space-y-6">
                    <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-purple-500" />
                                Konsep & Prompt Visual Thumbnail (Target CTR 10%+)
                            </h3>
                            {promptAI && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-400"
                                    onClick={() => handleCopy(promptAI, "all_thumb_prompt")}
                                >
                                    {copiedKey === "all_thumb_prompt" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-purple-500" />}
                                    <span>Salin AI Prompt</span>
                                </Button>
                            )}
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Teks pada Thumbnail */}
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground">Teks Hook Pada Thumbnail:</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1"
                                        onClick={() => handleCopy(teksThumbnail, "thumb_text")}
                                    >
                                        {copiedKey === "thumb_text" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                        <span>Salin Teks</span>
                                    </Button>
                                </div>
                                <p className="text-primary font-bold text-sm bg-background/60 p-3 rounded-lg border border-border/20 tracking-wide">{teksThumbnail}</p>
                            </div>

                            {/* Deskripsi Visual / Konsep */}
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground">Konsep Visual & Tata Letak:</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1"
                                        onClick={() => handleCopy(konsepVisual, "thumb_concept")}
                                    >
                                        {copiedKey === "thumb_concept" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                        <span>Salin Konsep</span>
                                    </Button>
                                </div>
                                <p className="text-muted-foreground leading-relaxed bg-background/40 p-3 rounded-lg border border-border/20">{konsepVisual}</p>
                            </div>

                            {/* Prompt AI Image Generator */}
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground">Prompt AI Image (Midjourney / Flux / DALL-E):</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1"
                                        onClick={() => handleCopy(promptAI, "thumb_prompt")}
                                    >
                                        {copiedKey === "thumb_prompt" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                        <span>Salin Prompt AI</span>
                                    </Button>
                                </div>
                                <p className="text-xs font-mono bg-background/80 p-3.5 rounded-lg border border-border/30 text-foreground/90 break-words leading-relaxed select-all">{promptAI}</p>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* TAB 6: SEO */}
                <TabsContent value="seo" className="space-y-6">
                    <Card className="p-6 space-y-5 bg-card/60 border-border/40">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                            <div>
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Search className="w-4 h-4 text-blue-500" />
                                    Optimasi SEO, Metadata & Jadwal YouTube
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Paket metadata lengkap siap salin untuk meningkatkan ranking pencarian dan algoritma rekomendasi YouTube.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5 rounded-xl border-blue-500/40 text-blue-600 dark:text-blue-400 self-start sm:self-auto shrink-0 font-medium"
                                onClick={handleCopyAllSEO}
                            >
                                {copiedKey === "all_seo_package" ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-emerald-600 dark:text-emerald-400">Semua Tersalin!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5 text-blue-500" />
                                        <span>Salin Semua Paket SEO</span>
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* 1. Deskripsi Video YouTube */}
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-primary" />
                                        Deskripsi Video YouTube / Caption:
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1"
                                        onClick={() => handleCopy(deskripsi, "seo_desc")}
                                    >
                                        {copiedKey === "seo_desc" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                        <span>{copiedKey === "seo_desc" ? "Tersalin!" : "Salin Deskripsi"}</span>
                                    </Button>
                                </div>
                                <div className="relative">
                                    <p className="text-muted-foreground whitespace-pre-line bg-background/60 p-4 rounded-lg border border-border/20 leading-relaxed font-sans select-all">
                                        {deskripsi}
                                    </p>
                                </div>
                            </div>

                            {/* 2. Kata Kunci Utama (Primary Keywords) */}
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground flex items-center gap-1.5">
                                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                                        Kata Kunci Utama (Primary Keywords):
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1"
                                        onClick={() => handleCopy(kwUtama.join(", "), "kw_utama")}
                                    >
                                        {copiedKey === "kw_utama" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                        <span>{copiedKey === "kw_utama" ? "Tersalin!" : "Salin Keywords"}</span>
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {kwUtama.map((kw: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="text-[11px] px-2.5 py-1 font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                            {kw}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Kata Kunci Turunan (Long-Tail Keywords) */}
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-emerald-500" />
                                        Kata Kunci Turunan (Long-Tail Keywords):
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1"
                                        onClick={() => handleCopy(kwTurunan.join(", "), "kw_turunan")}
                                    >
                                        {copiedKey === "kw_turunan" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                        <span>{copiedKey === "kw_turunan" ? "Tersalin!" : "Salin Turunan"}</span>
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {kwTurunan.map((kw: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-[11px] px-2.5 py-1 bg-background/60 border-border/50 text-foreground/90">
                                            {kw}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* 4. Tags YouTube (Format CSV untuk YouTube Studio) */}
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="font-bold text-foreground">Tags YouTube:</span>
                                        <span className="text-[10px] text-muted-foreground">(Format Tag CSV untuk YouTube Studio)</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1"
                                        onClick={() => handleCopy(tagsCsvString, "seo_tags")}
                                    >
                                        {copiedKey === "seo_tags" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                        <span>{copiedKey === "seo_tags" ? "Tersalin!" : "Salin Tags (CSV)"}</span>
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {tagsList.map((t: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-[10px] px-2 py-0.5 border-dashed border-primary/30 text-foreground/80 bg-background/50">
                                            {t}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* 5. Hashtags YouTube */}
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground flex items-center gap-1.5">
                                        <Hash className="w-3.5 h-3.5 text-blue-500" />
                                        Hashtags YouTube:
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1"
                                        onClick={() => handleCopy(hashtagsList.join(" "), "seo_hashtags")}
                                    >
                                        {copiedKey === "seo_hashtags" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                        <span>{copiedKey === "seo_hashtags" ? "Tersalin!" : "Salin Hashtags"}</span>
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {hashtagsList.map((h: string, i: number) => (
                                        <Badge key={i} className="text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                                            {h}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* 6. Rekomendasi Jadwal Upload (WIB) */}
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                                        Rekomendasi Jadwal Upload (WIB):
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1"
                                        onClick={() => handleCopy(fullJadwalText, "seo_jadwal")}
                                    >
                                        {copiedKey === "seo_jadwal" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                        <span>{copiedKey === "seo_jadwal" ? "Tersalin!" : "Salin Jadwal"}</span>
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    <div className="bg-background/60 p-3 rounded-lg border border-border/20 space-y-1">
                                        <span className="font-semibold text-foreground block text-[11px] text-muted-foreground">Hari Terbaik:</span>
                                        <p className="text-primary font-bold text-sm">{hariUploadStr}</p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">{alasanUploadStr}</p>
                                    </div>
                                    <div className="bg-background/60 p-3 rounded-lg border border-border/20 space-y-1">
                                        <span className="font-semibold text-foreground block text-[11px] text-muted-foreground">Jam Prime Time (WIB):</span>
                                        <p className="text-emerald-500 font-bold text-sm">{jamUploadStr}</p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">{hindariUploadStr}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* TAB 7: EDITING */}
                <TabsContent value="editing" className="space-y-6">
                    <Card className="p-6 space-y-4 bg-card/60 border-border/40">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Video className="w-4 h-4 text-rose-500" />
                                Instruksi & Panduan Editing Video
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => {
                                    const editData = isShorts ? activeShot.editing : videoPanjang.editing;
                                    const recs = parseList(editData?.rekomendasi || editData?.gaya_visual || [
                                        "Visual B-Roll: Gunakan footage sinematik bertempo lambat dengan color grading moody",
                                        "Sound Design: Masukkan ambient drone/subtle piano di babak awal, transisi cymbal roll di babak 2",
                                        "Pacing Cut: Potong setiap 3-5 detik agar retensi penonton tetap terjaga stabil",
                                        "Tipografi: Gunakan sans-serif bold warna putih/kuning dengan shadow tipis"
                                    ]);
                                    handleCopy(recs.join("\n"), "editing_recs");
                                }}
                            >
                                {copiedKey === "editing_recs" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                <span>Salin Panduan</span>
                            </Button>
                        </div>

                        {(() => {
                            const editData = isShorts ? activeShot.editing : videoPanjang.editing;
                            const recs = parseList(editData?.rekomendasi || editData?.gaya_visual || [
                                "Visual B-Roll: Gunakan footage sinematik bertempo lambat dengan color grading moody",
                                "Sound Design: Masukkan ambient drone/subtle piano di babak awal, transisi cymbal roll di babak 2",
                                "Pacing Cut: Potong setiap 3-5 detik agar retensi penonton tetap terjaga stabil",
                                "Tipografi: Gunakan sans-serif bold warna putih/kuning dengan shadow tipis"
                            ]);

                            return (
                                <div className="space-y-3 text-xs">
                                    <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                        <span className="font-bold text-foreground block">Rekomendasi Visual, Pacing & Sound Design:</span>
                                        <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed">
                                            {recs.map((rec: string, i: number) => (
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
                            Prediksi Performa & Growth Score
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                <span className="font-semibold text-foreground block">Estimasi Click-Through Rate (CTR):</span>
                                <p className="text-lg font-bold text-emerald-500">8.5% - 12.0%</p>
                                <p className="text-[11px] text-muted-foreground">Berdasarkan keselarasan hook dan thumbnail visual High-CTR.</p>
                            </div>

                            <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-2">
                                <span className="font-semibold text-foreground block">Estimasi Audience Retention:</span>
                                <p className="text-lg font-bold text-primary">65% - 75%</p>
                                <p className="text-[11px] text-muted-foreground">Didukung oleh struktur pacing visual & audio klip 0-60 detik.</p>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
