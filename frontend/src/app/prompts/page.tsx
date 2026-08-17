'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Copy, Check, BookOpen, Layers, Flame } from 'lucide-react'
import { toast } from 'sonner'

interface MasterPrompt {
    id: string
    channel: string
    title: string
    description: string
    insights: string[]
    promptText: string
}

const MASTER_PROMPTS: MasterPrompt[] = [
    {
        id: 'suara_filsuf_deep',
        channel: 'Suara Filsuf 🧠',
        title: 'Kontemplasi Filsafat High-CTR & Retensi Tinggi',
        description: 'Master prompt berbasis data 357 video Suara Filsuf (Kamis/Minggu 17:00 WIB, Tokoh Sejarah + Paradoks).',
        insights: [
            'Gunakan Tokoh Sejarah/Filsuf (Imam Ghazali, Bung Karno, Ibnu Sina) sebagai otoritas.',
            'Judul emosional (Lelah/Hampa/Cemas) mendatangkan views 4x lipat baseline.',
            'Dilarang mencantumkan nama narasumber acara di judul.',
        ],
        promptText: `Kamu adalah asisten eksekutif untuk channel Suara Filsuf.
Tugasmu merancang paket konten filosofi populer dengan pendekatan kontemplatif dan reflektif.

ATURAN FORMULA JUDUL:
1. Pikirkan emosi audiens (Lelah, Hampa, Cemas, Perfeksionis).
2. Hubungkan dengan ajaran tokoh filsuf/sejarah besar (Imam Ghazali, Stoikisme, Ibnu Sina).
3. Buat judul paradoks dengan curiosity gap tanpa clickbait murah.

STRUKTUR HOOK DETIK 0-10:
- Pattern Interrupt: Buka langsung dengan pertanyaan paradoks yang memecah keyakinan umum.
- Tanpa sapaan formal.
- Fokus pada luka batin manusia modern.`
    },
    {
        id: 'nalar_senyap_healing',
        channel: 'Nalar Senyap 🌿',
        title: 'Psikologi Healing & Relationship Insights',
        description: 'Master prompt berdasarkan analisis 179 video Nalar Senyap (Dominasi Shorts & Topik Relasi).',
        insights: [
            'Topik Asmara/Pernikahan/Luka Relasi menduduki Top 5 views terbanyak.',
            'Gunakan jeda elipsis (...) & kalimat validasi di awal.',
            'Sisi Kiri thumbnail wajib kosong untuk foto narasumber Photoshop.',
        ],
        promptText: `Kamu adalah asisten eksekutif untuk channel Nalar Senyap.
Tugasmu merancang naskah & strategi konten psikologi populer, healing, dan kesehatan mental.

GAYA BAHASA & PENDEKATAN:
1. Validasi emosi penonton terlebih dahulu ("Wajar jika kamu merasa lelah...").
2. Gunakan nada bicara hangat, personal (panggil 'kamu'), seolah bicara empat mata.
3. Fokus pada dinamika hubungan, overthinking, attachment style, dan penyembuhan luka batin.

THUMBNAIL FORMAT:
- Teks Kanan (Right). Sisi Kiri (Left) KOSONG TOTAL untuk foto narasumber.`
    },
    {
        id: 'tutur_kyai_hikmah',
        channel: 'Tutur Kyai 🕊️',
        title: 'Hikmah Islami & Kedamaian Hati',
        description: 'Master prompt berbasis nilai spiritual Islami, santun, dan menyejukkan hati.',
        insights: [
            'Fokus pada penyejuk jiwa, akhlak, dan tazkiyatun nufs.',
            'Gunakan kutipan hikmah ulama dengan bahasa yang memeluk.',
            'Pendekatan tanpa menghakimi atau terkesan mengkafirkan.',
        ],
        promptText: `Kamu adalah asisten eksekutif untuk channel Tutur Kyai.
Tugasmu merancang narasi hikmah Islami, keindahan ibadah, dan penyejuk jiwa.

ATURAN UTAMA:
1. Sampaikan nasehat agama dengan penuh kasih dan kesantunan (khas pesantren/kyai).
2. Hindari perdebatan fiqih keras; utamakan kedamaian batin dan tazkiyatun nufs.
3. Hook pembuka menyentuh ruang ketenangan batin penonton.`
    }
]

export default function PromptsPage() {
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        toast.success('Master Prompt berhasil disalin!')
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
            {/* Header */}
            <div className="space-y-2 border-b border-slate-800 pb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
                    <Sparkles className="size-3.5" />
                    Master Prompt Studio — Suara AI
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                    Kumpulan Master Prompt & Insight Analytics Channel
                </h1>
                <p className="text-sm text-slate-400 max-w-3xl">
                    Instruksi AI yang dioptimasi langsung dari data YouTube Studio real (Suara Filsuf, Nalar Senyap, Tutur Kyai). Gunakan prompt ini untuk memandu pembuatan naskah, hook, dan konsep thumbnail.
                </p>
            </div>

            {/* Grid Prompt Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {MASTER_PROMPTS.map((item) => (
                    <Card key={item.id} className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                        <CardHeader className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-sky-400 border border-slate-700">
                                    {item.channel}
                                </span>
                                <Flame className="size-4 text-amber-400" />
                            </div>
                            <CardTitle className="text-base font-bold text-white leading-snug">
                                {item.title}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400 leading-relaxed">
                                {item.description}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Insight Badges */}
                            <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                                    <BookOpen className="size-3 text-sky-400" /> Data Analytics Key Insights
                                </span>
                                <ul className="space-y-1.5">
                                    {item.insights.map((ins, i) => (
                                        <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
                                            <span className="text-sky-400 shrink-0">•</span>
                                            <span>{ins}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Prompt Text Preview */}
                            <div className="space-y-1.5">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                                    <Layers className="size-3 text-indigo-400" /> Naskah Master Prompt
                                </span>
                                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                                    {item.promptText}
                                </pre>
                            </div>

                            {/* Copy Button */}
                            <Button
                                onClick={() => handleCopy(item.id, item.promptText)}
                                className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold gap-2 transition-colors"
                                size="sm"
                            >
                                {copiedId === item.id ? (
                                    <>
                                        <Check className="size-4 text-emerald-300" /> Tersalin!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-4" /> Salin Master Prompt
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
