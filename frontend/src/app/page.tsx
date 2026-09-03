"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnalysisResultPanel } from "@/components/AnalysisResultPanel";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  Clapperboard,
  Settings,
  Play,
  Brain,
  Sparkles,
  FileText,
  Sliders,
  Key,
  Loader2,
  Sun,
  Moon,
  Search as SearchIcon,
  History,
  Trash2,
  LayoutDashboard,
  Users,
  Smartphone,
  MonitorPlay,
  Link2,
  Plus,
  Activity,
  Zap,
  BarChart2
} from "lucide-react";
import { FFmpegPeakAnalyzer } from "@/components/studio/FFmpegPeakAnalyzer";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT_PROVIDERS = [
  { id: "gemini", label: "Google Gemini", mode: "openai_compatible", default_base_url: "https://generativelanguage.googleapis.com/v1beta/openai" },
  { id: "nine_router", label: "9Router (Free)", mode: "openai_compatible", default_base_url: "https://ai.sahru.my.id/v1" }
];

const DEFAULT_CHANNELS = [
  { id: "suara_filsuf", name: "Suara Filsuf", emoji: "🧠", description: "Filosofi populer, reflektif, tenang, dan dalam." },
  { id: "nalar_senyap", name: "Nalar Senyap", emoji: "🌿", description: "Psikologi, healing, dan kontemplasi diri yang hangat." },
  { id: "tutur_kyai", name: "Tutur Kyai", emoji: "🕊️", description: "Hikmah Islami, akhlak, dan nilai spiritual yang santun." }
];

const DEFAULT_DURATIONS = [
  { id: "30s", label: "30 detik", min_seconds: 30, max_seconds: 30, type: "shorts" },
  { id: "45s", label: "45 detik", min_seconds: 45, max_seconds: 45, type: "shorts" },
  { id: "60s", label: "60 detik", min_seconds: 60, max_seconds: 60, type: "shorts" },
  { id: "75s", label: "75 detik", min_seconds: 75, max_seconds: 75, type: "shorts" },
  { id: "90s", label: "90 detik", min_seconds: 90, max_seconds: 90, type: "shorts" },
  { id: "5-15m", label: "5–15 menit", min_seconds: 300, max_seconds: 900, type: "long" },
  { id: "15-30m", label: "15–30 menit", min_seconds: 900, max_seconds: 1800, type: "long" },
  { id: "30-60m", label: "30–60 menit", min_seconds: 1800, max_seconds: 3600, type: "long" },
  { id: "1-2j", label: "1–2 jam", min_seconds: 3600, max_seconds: 7200, type: "long" },
  { id: "2-4j", label: "2–4 jam", min_seconds: 7200, max_seconds: 14400, type: "long" },
];

const DEFAULT_MODELS: Record<string, string[]> = {
  anthropic: ["claude-3-5-sonnet-latest", "claude-3-5-sonnet-20241022", "claude-3-opus-latest"],
  openai: ["gpt-4o", "gpt-4o-mini", "o1-mini"],
  gemini: ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro"],
  custom: [],
  nine_router: [
    "Combo-Maut",
    "Google",
    "ComToken"
  ]
};

const FALLBACK_API_BASE = "https://suarafilsuf-suaraai-backend.hf.space";

function resolveApiBase(): string {
  if (typeof window === "undefined") return FALLBACK_API_BASE;
  const hostname = window.location.hostname;
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // Jika ada backend lokal di port 7860/8000 gunakan env, fallback ke cloud HF Space
    return FALLBACK_API_BASE;
  }
  // Di domain production Vercel / custom domain, direct ke HF Space backend
  return FALLBACK_API_BASE;
}

const API_BASE = resolveApiBase();

export default function Dashboard() {
  const [apiSettings, setApiSettings] = useState<any>(null);

  const [provider, setProvider] = useState("nine_router");
  const [model, setModel] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://ai.sahru.my.id/v1");
  const [timeout, setTimeoutVal] = useState(180);

  const [channelDna, setChannelDna] = useState("suara_filsuf");
  const [outputType, setOutputType] = useState("shorts");
  const [duration, setDuration] = useState("30s");
  const [shotCount, setShotCount] = useState(5);
  const [extraNotes, setExtraNotes] = useState("");

  const [analyticsFile, setAnalyticsFile] = useState<File | null>(null);
  const [analyticsExists, setAnalyticsExists] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const [historyList, setHistoryList] = useState<any[]>([]);

  // Auto-load 9Router config from localStorage
  useEffect(() => {
    const savedApikey = localStorage.getItem("suara_ai_api_key");
    if (savedApikey) {
      setApiKey(savedApikey);
    }
    const savedModel = localStorage.getItem("suara_ai_model");
    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("suara_ai_history");
      if (stored) setHistoryList(JSON.parse(stored));
    } catch (e) {
      console.error("Gagal memuat riwayat:", e);
    }
  }, []);

  const addToHistory = useCallback((title: string, dna: string, output: string, resData: any) => {
    setHistoryList((prev) => {
      const newItem = {
        id: Date.now().toString(),
        title: title || "Video Tanpa Judul",
        channel_dna: dna,
        output_type_id: output,
        timestamp: new Date().toLocaleString("id-ID"),
        result: resData
      };
      const updated = [newItem, ...prev].slice(0, 15);
      try {
        localStorage.setItem("suara_ai_history", JSON.stringify(updated));
      } catch (e) {
        console.error("Gagal menyimpan riwayat:", e);
      }
      return updated;
    });
  }, []);

  const deleteHistoryItem = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryList((prev) => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem("suara_ai_history", JSON.stringify(updated));
        toast.success("Item riwayat berhasil dihapus!");
      } catch (e) {
        console.error("Gagal menghapus item riwayat:", e);
      }
      return updated;
    });
  }, []);

  const loadHistoryItem = useCallback((item: any) => {
    setResult(item.result);
    setChannelDna(item.channel_dna);
    setOutputType(item.output_type_id);
    toast.success(`Berhasil memuat analisis: "${item.title}"`);
    setIsHistoryOpen(false);
  }, []);

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const inputSectionRef = React.useRef<HTMLDivElement>(null);
  const channelSectionRef = React.useRef<HTMLDivElement>(null);
  const formatSectionRef = React.useRef<HTMLDivElement>(null);

  const [keywordQuery, setKeywordQuery] = useState("");
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const activeTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(activeTheme);
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    if (!keywordQuery.trim()) {
      setKeywordSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setKeywordLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/youtube-suggestions?q=${encodeURIComponent(keywordQuery.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setKeywordSuggestions(data.suggestions || []);
        }
      } catch { }
      setKeywordLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [keywordQuery]);

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  };

  useEffect(() => {
    async function checkAnalytics() {
      try {
        const res = await fetch(`${API_BASE}/api/channels/${channelDna}/analytics`);
        if (res.ok) {
          const data = await res.json();
          setAnalyticsExists(data.exists);
          setAnalyticsSummary(data.exists ? data.summary : null);
        }
      } catch (err) {
        console.error("Gagal memeriksa analytics channel:", err);
      }
    }
    checkAnalytics();
  }, [channelDna]);

  const handleUploadAnalytics = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    const uploadToastId = toast.loading("Memproses data analytics...");
    try {
      const res = await fetch(`${API_BASE}/api/channels/${channelDna}/analytics`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAnalyticsExists(true);
        setAnalyticsSummary(data.summary);
        toast.success("Analytics berhasil disimpan!", { id: uploadToastId });
      } else {
        toast.error(`Gagal: ${data.detail || "Format tidak didukung"}`, { id: uploadToastId });
      }
    } catch (err) {
      toast.error("Gagal menghubungi backend API.", { id: uploadToastId });
    }
  };

  const handleDeleteAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/channels/${channelDna}/analytics`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAnalyticsExists(false);
        setAnalyticsSummary(null);
        setAnalyticsFile(null);
        toast.success("Data analytics channel berhasil dihapus!");
      } else {
        toast.error("Gagal menghapus data analytics.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke backend API.");
    }
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          setApiSettings(data);
          if (data.ai_provider?.providers) {
            const defaultProv = data.ai_provider.default_provider || "anthropic";
            setProvider(defaultProv);
          }
        }
      } catch (err) {
        console.log("Using local default settings due to backend offline:", err);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
    const pInfo = providers.find((p: any) => p.id === provider);
    const list = pInfo?.models || DEFAULT_MODELS[provider] || [];
    if (list.length > 0) {
      const firstModel = typeof list[0] === 'string' ? list[0] : list[0].id;
      setModel(firstModel);
    } else {
      setModel(null);
    }
    // Utamakan default_base_url dari provider local/fallback jika backend/pInfo kosong
    const defaultUrl = pInfo?.default_base_url || DEFAULT_PROVIDERS.find(p => p.id === provider)?.default_base_url || "https://ai.sahru.my.id/v1";
    setBaseUrl(defaultUrl);
  }, [provider, apiSettings]);

  useEffect(() => {
    if (outputType === "shorts") {
      setDuration("30s");
    } else {
      setDuration("5-15m");
    }
  }, [outputType]);

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: (() => {
            const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
            const pInfo = providers.find((p: any) => p.id === provider);
            return pInfo?.mode || (provider === "anthropic" ? "anthropic" : "openai_compatible");
          })(),
          model: model,
          api_key: apiKey,
          base_url: baseUrl || "https://ai.sahru.my.id/v1",
          timeout: 30
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ ok: true, message: data.message });
        toast.success("Koneksi API Berhasil!");
      } else {
        setTestResult({ ok: false, message: typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail) });
        toast.error("Koneksi API Gagal!");
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: "Gagal menghubungkan ke backend lokal." });
      toast.error("Gagal terhubung ke backend FastAPI.");
    } finally {
      setTestLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!useManual && !youtubeUrl) {
      toast.warning("Silakan masukkan URL YouTube terlebih dahulu.");
      return;
    }
    if (useManual && !manualTranscript) {
      toast.warning("Silakan tempel transkrip manual terlebih dahulu.");
      return;
    }

    setLoading(true);
    setResult(null);
    setLoadingStep("Menghubungi Backend...");

    const steps = [
      "Mengambil transkrip & metadata video...",
      "Menyusun system prompt DNA Channel...",
      "Mengirim request ke AI model...",
      "Mem-parsing hasil JSON dari AI...",
      "Memeriksa kesesuaian target durasi..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep]);
        currentStep++;
      }
    }, 4500);

    try {
      const resolvedProvId = provider === "nine_router" ? "custom" : provider;
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          youtube_url: useManual ? null : youtubeUrl,
          manual_transcript: useManual ? manualTranscript : null,
          channel_dna: channelDna,
          output_type_id: outputType,
          duration_id: duration,
          shot_count: outputType === "shorts" ? shotCount : null,
          provider_id: resolvedProvId,
          model: model,
          api_key: apiKey,
          base_url: baseUrl,
          request_timeout: timeout,
          extra_notes: [
            extraNotes,
            selectedKeywords.length > 0
              ? `\n\n[KEYWORD SEO YOUTUBE YANG DIREKOMENDASIKAN]: ${selectedKeywords.join(", ")}`
              : "",
          ].filter(Boolean).join(""),
        })
      });

      clearInterval(interval);
      const data = await res.json();

      if (res.ok) {
        setResult(data);
        addToHistory(data.video_title, channelDna, outputType, data);
        toast.success("Analisis Video Berhasil diselesaikan!");
      } else {
        toast.error(data.detail || "Gagal melakukan analisis.");
      }
    } catch (err: any) {
      clearInterval(interval);
      toast.error("Gagal terhubung ke backend FastAPI.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleGenerateTTS = async (textToSpeak: string) => {
    if (!textToSpeak) return;
    try {
      const res = await fetch(`${API_BASE}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          voice: "alloy",
          model: "tts-1",
          api_key: apiKey,
          base_url: baseUrl,
          provider_id: provider
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        toast.success("Voiceover berhasil dibuat!");
      } else {
        toast.error(data.detail || "Gagal membuat suara.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke backend.");
    }
  };

  const handleGenerateImage = async (imagePrompt: string) => {
    if (!imagePrompt) return;
    try {
      const res = await fetch(`${API_BASE}/api/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          model: "dall-e-3",
          api_key: apiKey,
          base_url: baseUrl,
          provider_id: provider
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        toast.success("Thumbnail berhasil dibuat!");
      } else {
        toast.error(data.detail || "Gagal membuat thumbnail.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke backend.");
    }
  };

  return (
    <div className="apple-liquid-bg flex min-h-[100dvh] text-foreground font-sans antialiased overflow-x-hidden selection:bg-blue-500/25">
      <Toaster position="top-center" theme={theme} richColors />

      {/* === 1. EXPANDABLE ICON DOCK / COMPACT SIDEBAR (KOLOM 1) === */}
      <aside className="hidden xl:flex w-[76px] hover:w-[240px] group transition-all duration-300 ease-in-out border-r border-white/20 dark:border-white/10 apple-glass flex-col shrink-0 min-h-[100dvh] sticky top-0 z-40 overflow-hidden shadow-2xl">
        {/* Logo Header */}
        <div className="h-[68px] flex items-center px-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="size-10 grid place-items-center bg-gradient-to-tr from-blue-600 via-primary to-indigo-500 text-white rounded-xl shrink-0 shadow-md shadow-primary/30">
              <Clapperboard className="size-5" />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
              <div className="text-[10px] font-mono text-primary font-bold tracking-wider uppercase">Studio Deck</div>
              <h1 className="text-sm font-extrabold tracking-tight leading-none text-foreground">
                SuaraAI <span className="text-primary font-black">v3</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("dashboard"); setUseManual(false); }}
            className="w-full justify-start h-11 rounded-xl bg-gradient-to-r from-blue-600 to-primary text-white font-bold shadow-md shadow-blue-500/20 active:scale-[0.98] px-3.5"
            title="Analisis Baru"
          >
            <Plus className="size-5 shrink-0 stroke-[2.5]" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-3 whitespace-nowrap">Analisis Baru</span>
          </Button>

          <div className="pt-2 space-y-1">
            <Button
              variant="ghost"
              onClick={() => { setActiveMenu("dashboard"); }}
              className={`w-full justify-start h-10 rounded-xl px-3.5 font-medium transition-all ${activeMenu === "dashboard" ? "bg-primary/15 text-primary font-bold shadow-inner" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"}`}
              title="Dashboard"
            >
              <LayoutDashboard className="size-4 shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-3 whitespace-nowrap text-xs">Dashboard Hub</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => { setActiveMenu("ffmpeg"); }}
              className={`w-full justify-start h-10 rounded-xl px-3.5 font-medium transition-all ${activeMenu === "ffmpeg" ? "bg-amber-500/15 text-amber-500 font-bold" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"}`}
              title="FFmpeg Peak Analyzer"
            >
              <Activity className="size-4 shrink-0 text-amber-500" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-3 whitespace-nowrap text-xs">FFmpeg Peak Studio</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => setIsHistoryOpen(true)}
              className="w-full justify-start h-10 rounded-xl px-3.5 font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
              title="Riwayat Analisis"
            >
              <History className="size-4 shrink-0 text-blue-400" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-3 whitespace-nowrap text-xs">Riwayat ({historyList.length})</span>
            </Button>
          </div>

          <div className="pt-4 border-t border-border/40 space-y-1">
            <div className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-2 pb-1 transition-opacity">Sistem</div>
            <Button
              variant="ghost"
              onClick={() => setIsSettingsOpen(true)}
              className="w-full justify-start h-10 rounded-xl px-3.5 font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
              title="Pengaturan AI & Model"
            >
              <Settings className="size-4 shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-3 whitespace-nowrap text-xs">AI Providers</span>
            </Button>
          </div>
        </nav>

        {/* User / Theme Footer */}
        <div className="p-3 border-t border-border/60 flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="size-9 rounded-xl border-border/60 bg-card hover:bg-accent shrink-0"
            title="Ganti Tema"
          >
            {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-blue-500" />}
          </Button>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-muted-foreground overflow-hidden whitespace-nowrap pr-2">
            Online v3.2
          </div>
        </div>
      </aside>

      {/* === MOBILE TOP HEADER === */}
      <header className="xl:hidden h-14 flex items-center justify-between px-4 border-b border-border apple-glass sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="size-8 grid place-items-center bg-primary text-white rounded-lg">
            <Clapperboard className="size-4" />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-foreground">
            SuaraAI <span className="text-primary font-black">Studio</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={() => setIsHistoryOpen(true)} className="size-8 rounded-lg">
            <History className="size-4 text-blue-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)} className="size-8 rounded-lg">
            <Settings className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleTheme} className="size-8 rounded-lg">
            {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-blue-500" />}
          </Button>
        </div>
      </header>

      {/* === MAIN 3-COLUMN WORKSPACE CONTAINER === */}
      <div className="flex-1 flex flex-col xl:flex-row min-w-0 min-h-[calc(100dvh)] xl:h-[calc(100dvh)] overflow-x-hidden xl:overflow-hidden">
        {activeMenu === "ffmpeg" ? (
          <div className="flex-1 p-6 overflow-y-auto space-y-4 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                  <Activity className="size-5 text-amber-500" />
                  FFmpeg Peak Time Studio
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deteksi momen audio berenergi tinggi untuk ekstraksi hook video pendek viral.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveMenu("dashboard")}
                className="text-xs"
              >
                Kembali ke Dashboard
              </Button>
            </div>

            <FFmpegPeakAnalyzer
              apiBase={API_BASE}
              onApplySegment={(startTime, endTime, hook) => {
                setExtraNotes((prev) =>
                  `[FFMPEG PEAK SEGMENT]: ${startTime} - ${endTime} (Hook: ${hook})\n${prev}`.trim()
                );
                setActiveMenu("dashboard");
                toast.success(`Segmen ${startTime} - ${endTime} diterapkan ke instruksi analisis!`);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col xl:flex-row min-w-0 h-full overflow-hidden">

            {/* === 2. INTERACTIVE INPUT HUB (KOLOM 2: TENGAH) === */}
            <section className="w-full xl:w-[420px] 2xl:w-[460px] shrink-0 border-r border-border/80 flex flex-col xl:h-full bg-background/50 backdrop-blur-md overflow-y-auto custom-scrollbar p-4 sm:p-5 gap-4">
              
              {/* Channel Selector Pill Carousel */}
              <div className="surface p-4 space-y-2.5 rounded-2xl shadow-sm border border-border/60" ref={channelSectionRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider font-mono">
                    <Users className="size-3.5 text-primary" /> Channel DNA
                  </label>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                    {DEFAULT_CHANNELS.find(c => c.id === channelDna)?.name || channelDna}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_CHANNELS.map((ch) => {
                    const isSelected = channelDna === ch.id;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setChannelDna(ch.id)}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${isSelected
                          ? "border-primary bg-primary/15 shadow-sm scale-[1.02]"
                          : "border-border/60 bg-card hover:bg-accent/70 hover:scale-[1.01]"
                        }`}
                      >
                        <span className="text-xl">{ch.emoji}</span>
                        <span className={`text-[11px] font-bold truncate max-w-full ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {ch.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Analytics Panel */}
                <div className="pt-2 border-t border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-muted-foreground">Analytics CSV</label>
                    {analyticsExists && (
                      <button
                        onClick={handleDeleteAnalytics}
                        className="text-[10px] text-destructive font-mono flex items-center gap-1 hover:underline"
                      >
                        <Trash2 className="size-3" /> Hapus
                      </button>
                    )}
                  </div>

                  {analyticsExists && analyticsSummary ? (
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="surface p-2 rounded-xl border border-border/60">
                        <div className="text-[10px] text-muted-foreground">Avg CTR</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono">
                          {analyticsSummary.avg_ctr_pct ? `${analyticsSummary.avg_ctr_pct}%` : "—"}
                        </div>
                      </div>
                      <div className="surface p-2 rounded-xl border border-border/60">
                        <div className="text-[10px] text-muted-foreground">Avg Retention</div>
                        <div className="text-sm font-bold text-blue-400 font-mono">
                          {analyticsSummary.avg_retention_pct ? `${analyticsSummary.avg_retention_pct}%` : "—"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center p-2.5 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 text-[11px] text-muted-foreground">
                      <span>+ Upload CSV Analytics</span>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadAnalytics(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Format & Output Duration Control */}
              <div className="surface p-4 space-y-3 rounded-2xl shadow-sm border border-border/60" ref={formatSectionRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider font-mono">
                    <Sliders className="size-3.5 text-primary" /> Format & Target
                  </label>
                  <span className="text-[10px] font-mono text-muted-foreground">{outputType === "shorts" ? `${shotCount} Shot` : "Multi-Segment"}</span>
                </div>

                {/* Type Selector (Shorts vs Long) */}
                <div className="grid grid-cols-2 gap-2 bg-card/80 p-1 rounded-xl border border-border/60">
                  <button
                    onClick={() => setOutputType("shorts")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${outputType === "shorts"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Smartphone className="size-3.5" /> Shorts / Reels
                  </button>
                  <button
                    onClick={() => setOutputType("video_panjang")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${outputType === "video_panjang"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MonitorPlay className="size-3.5" /> Long Form
                  </button>
                </div>

                {/* Duration Pills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground block">Target Durasi</span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_DURATIONS.filter(d => d.type === (outputType === "shorts" ? "shorts" : "long")).map(d => {
                      const isSelected = duration === d.id;
                      return (
                        <button
                          key={d.id}
                          onClick={() => setDuration(d.id)}
                          className={`px-3 py-1.5 text-[11px] font-mono rounded-lg border transition-all ${isSelected
                            ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm"
                            : "border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-border"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shot count for shorts */}
                {outputType === "shorts" && (
                  <div className="space-y-1.5 pt-1 border-t border-border/40">
                    <span className="text-[11px] font-medium text-muted-foreground block">Jumlah Shot / Hook Segmen</span>
                    <div className="flex gap-1.5">
                      {[3, 5, 7, 10, 12].map(n => (
                        <button
                          key={n}
                          onClick={() => setShotCount(n)}
                          className={`flex-1 py-1 text-[11px] font-mono rounded-lg border transition-all ${shotCount === n
                            ? "border-primary bg-primary/20 text-primary font-bold"
                            : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Provider Quick Badge */}
              <div className="surface px-3.5 py-2.5 rounded-xl border border-border/60 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Brain className="size-3.5 text-primary" />
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-bold text-foreground">{model || "Combo-Maut"}</span>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-[10px] text-primary hover:underline font-bold"
                >
                  Ubah
                </button>
              </div>

              {/* Primary Input Deck (YouTube URL / Transcript) */}
              <div className="surface p-4 space-y-3.5 rounded-2xl shadow-sm border border-border/60" ref={inputSectionRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider font-mono">
                    <Sparkles className="size-3.5 text-primary" /> Source Input
                  </label>
                  <div className="flex gap-1 bg-card/60 p-0.5 rounded-lg border border-border/50 text-[10px]">
                    <button
                      onClick={() => setUseManual(false)}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${!useManual ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Link
                    </button>
                    <button
                      onClick={() => setUseManual(true)}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${useManual ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Teks
                    </button>
                  </div>
                </div>

                {!useManual ? (
                  <div className="relative">
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      className="field h-11 pl-9 text-xs rounded-xl w-full border-border/70"
                    />
                    <Link2 className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                  </div>
                ) : (
                  <Textarea
                    placeholder="Tempel transkrip naskah sumber atau artikel di sini..."
                    value={manualTranscript}
                    onChange={e => setManualTranscript(e.target.value)}
                    className="field min-h-[110px] text-xs rounded-xl p-3 resize-none border-border/70"
                  />
                )}

                {/* Extra Directives & Prompt Controls */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground block">Instruksi Tambahan (Opsional)</label>
                  <Textarea
                    placeholder="cth: Fokuskan hook pada aspek psikologis; gaya bahasa puitis..."
                    value={extraNotes}
                    onChange={e => setExtraNotes(e.target.value)}
                    className="field h-[68px] text-xs rounded-xl resize-none p-2.5 border-border/70"
                  />
                </div>

                {/* YouTube SEO Search Assist */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground block">Rekomendasi Keyword YouTube</label>
                  <div className="field rounded-xl px-3 flex items-center gap-2 h-9 border-border/70">
                    <SearchIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Ketik topik kata kunci..."
                      value={keywordQuery}
                      onChange={(e) => setKeywordQuery(e.target.value)}
                      className="bg-transparent border-none text-xs w-full focus:outline-none text-foreground placeholder:text-muted-foreground"
                    />
                    {keywordLoading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                  </div>

                  {keywordSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 max-h-[70px] overflow-y-auto custom-scrollbar">
                      {keywordSuggestions.map((kw, i) => (
                        <button
                          key={i}
                          onClick={() => toggleKeyword(kw)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${selectedKeywords.includes(kw)
                            ? "border-primary bg-primary/20 text-primary font-bold"
                            : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {selectedKeywords.includes(kw) ? "✓ " : "+ "}{kw}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Run Button */}
                <Button
                  onClick={handleRunAnalysis}
                  disabled={loading || (!useManual && !youtubeUrl) || (useManual && !manualTranscript)}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-primary to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      <span>{loadingStep || "Sedang Menganalisis..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 mr-2" />
                      <span>Generate Naskah Studio</span>
                    </>
                  )}
                </Button>
              </div>
            </section>

            {/* === 3. DYNAMIC CANVAS / RESULT WORKSPACE (KOLOM 3: KANAN) === */}
            <section className="flex-1 min-w-0 xl:h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 flex flex-col bg-background/30">
              {result ? (
                <div className="max-w-5xl w-full mx-auto space-y-6 animate-in fade-in-50 duration-300">
                  <AnalysisResultPanel
                    result={result}
                    outputType={outputType}
                    onGenerateTTS={handleGenerateTTS}
                    onGenerateImage={handleGenerateImage}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border/60 rounded-3xl min-h-[400px]">
                  <div className="size-16 rounded-3xl bg-primary/10 text-primary grid place-items-center mb-4 shadow-inner border border-primary/20">
                    <Clapperboard className="size-8 stroke-[1.75]" />
                  </div>
                  <h3 className="text-lg font-extrabold text-foreground tracking-tight mb-1">
                    Studio Canvas Siap Digunakan
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mb-6 leading-relaxed">
                    Pilih channel DNA, masukkan link YouTube atau transkrip di panel kontrol sebelah kiri, lalu klik <strong>Generate Naskah Studio</strong> untuk menyusun naskah lengkap, visual shot, dan paket SEO CTR tinggi.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-muted-foreground py-1 px-3">
                      🔥 Auto Hook Shot-by-Shot
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-muted-foreground py-1 px-3">
                      🎯 SEO Package & CTR Tags
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-muted-foreground py-1 px-3">
                      ⚡ 9Router Multi-Model Support
                    </Badge>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px] surface border-border p-0 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 via-background to-slate-50 dark:from-primary/10 dark:via-background dark:to-slate-900/20 p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Settings className="size-5 text-primary" /> AI Provider & Proxy
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pilih provider, model, dan koneksi API untuk analisis konten.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 pt-0 space-y-4">
            {/* Provider Overview Card */}
            <div className="surface p-4 rounded-xl border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="size-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Active Provider</div>
                  <div className="text-xs text-muted-foreground font-mono">{provider.toUpperCase()}</div>
                </div>
              </div>
            </div>

            {/* Provider Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">AI Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${provider === p.id
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card hover:bg-accent/50"
                      }`}
                  >
                    <div className="text-sm font-bold text-foreground">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{p.mode}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">Model AI</label>
              <Select value={model || ""} onValueChange={(v) => v && setModel(v)}>
                <SelectTrigger className="h-11 rounded-xl border-border bg-card">
                  <SelectValue placeholder="Pilih model..." />
                </SelectTrigger>
                <SelectContent className="surface border-border">
                  {provider === "nine_router" && (
                    <>
                      <SelectItem value="Combo-Maut" className="text-xs font-bold text-amber-500">
                        Combo-Maut (Rekomendasi Utama)
                      </SelectItem>
                      <SelectItem value="Google" className="text-xs font-semibold">
                        Google
                      </SelectItem>
                      <SelectItem value="ComToken" className="text-xs font-semibold">
                        ComToken
                      </SelectItem>
                    </>
                  )}
                  {provider !== "nine_router" && DEFAULT_MODELS[provider] && (
                    DEFAULT_MODELS[provider].map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Endpoint & API Key */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">Endpoint API</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="https://..."
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  className="h-11 text-xs rounded-xl border-border"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">API Key</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Masukkan API Key"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="h-11 text-xs rounded-xl border-border pr-10"
                />
              </div>
            </div>

            {/* Test Connection */}
            <div className="pt-2 border-t border-border">
              {testResult && (
                <div className={`p-3 rounded-xl text-xs font-mono border mb-3 ${testResult.ok
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}>
                  <span className="font-bold">{testResult.ok ? '✓ Koneksi Online' : '✗ Koneksi Gagal'}:</span>
                  <span className="ml-2">{testResult.message}</span>
                </div>
              )}
              <Button onClick={handleTestConnection} disabled={testLoading} className="w-full h-11 rounded-xl font-semibold">
                {testLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Tes Koneksi
              </Button>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="h-9 rounded-xl px-4">
                Batal
              </Button>
              <Button onClick={() => { setIsSettingsOpen(false); toast.success("Pengaturan disimpan!"); }} className="h-9 rounded-xl px-6 font-bold bg-primary text-primary-foreground">
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent side="right" className="w-[380px] sm:w-[480px] glass-panel border-l-white/20 p-6 flex flex-col space-y-6">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <History className="size-5 text-blue-500" /> Riwayat Analisis
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Daftar analisis konten yang telah Anda lakukan sebelumnya.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {historyList.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">Belum ada riwayat analisis.</div>
            ) : (
              historyList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className="glass-card-interactive p-3.5 rounded-2xl border border-white/20 flex items-center justify-between text-xs group"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-2">
                    <div className="font-bold text-foreground truncate group-hover:text-blue-500 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {item.timestamp}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteHistoryItem(item.id, e)}
                    className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
