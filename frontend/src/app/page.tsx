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
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_BASE;
  }
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
          provider_id: provider === "nine_router" ? "custom" : provider,
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

      {/* === SIDEBAR (DESKTOP) WITH APPLE FROSTED GLASS === */}
      <aside className="hidden lg:flex w-[256px] border-r border-white/20 dark:border-white/10 apple-glass flex-col shrink-0 min-h-[100dvh] sticky top-0 z-40">
        {/* Logo Header */}
        <div className="h-[72px] flex items-center px-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-9 grid place-items-center bg-primary text-primary-foreground rounded-lg shrink-0">
              <Clapperboard className="size-4" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-muted-foreground font-medium mb-0.5">Creator Studio</div>
              <h1 className="text-sm font-extrabold tracking-tight leading-none text-foreground">
                SuaraAI <span className="text-primary">Studio</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto custom-scrollbar">
          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("dashboard"); setUseManual(false); inputSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className="w-full justify-start h-10 rounded-lg mb-5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold active:scale-[0.98]"
          >
            <Plus className="size-4 mr-3 stroke-[2.5]" />
            Analisis Baru
          </Button>

          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("dashboard"); inputSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className={`nav-item w-full justify-start h-10 rounded-r-lg rounded-l-sm font-medium ${activeMenu === "dashboard" ? "nav-item-active" : ""}`}
          >
            <LayoutDashboard className="size-4 mr-3" /> Dashboard
          </Button>

          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("ffmpeg"); }}
            className={`nav-item w-full justify-start h-10 rounded-r-lg rounded-l-sm font-medium ${activeMenu === "ffmpeg" ? "nav-item-active" : ""}`}
          >
            <Activity className="size-4 mr-3 text-amber-500" /> FFmpeg Peak Time
          </Button>

          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("history"); setIsHistoryOpen(true); }}
            className={`nav-item w-full justify-start h-10 rounded-r-lg rounded-l-sm font-medium ${activeMenu === "history" ? "nav-item-active" : ""}`}
          >
            <History className="size-4 mr-3" /> Riwayat Analisis
          </Button>

          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("channel"); channelSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className={`nav-item w-full justify-start h-10 rounded-r-lg rounded-l-sm font-medium ${activeMenu === "channel" ? "nav-item-active" : ""}`}
          >
            <Users className="size-4 mr-3" /> Channel & Target
          </Button>

          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("manual"); setUseManual(true); inputSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className={`nav-item w-full justify-start h-10 rounded-r-lg rounded-l-sm font-medium ${activeMenu === "manual" ? "nav-item-active" : ""}`}
          >
            <FileText className="size-4 mr-3" /> Template Manual
          </Button>

          <div className="pt-6 pb-2">
            <div className="text-xs font-semibold text-foreground px-3 mb-2 pt-5">Konfigurasi</div>
            <Button
              variant="ghost"
              onClick={() => { setActiveMenu("settings"); setIsSettingsOpen(true); }}
              className={`nav-item w-full justify-start h-10 rounded-r-lg rounded-l-sm font-medium ${activeMenu === "settings" ? "nav-item-active" : ""}`}
            >
              <Settings className="size-4 mr-3" /> Pengaturan AI
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setActiveMenu("token"); setIsSettingsOpen(true); toast.info("Buka tab Konfigurasi AI & Model untuk mengatur API Key."); }}
              className={`nav-item w-full justify-start h-10 rounded-r-lg rounded-l-sm font-medium ${activeMenu === "token" ? "nav-item-active" : ""}`}
            >
              <Key className="size-4 mr-3" /> Token & API Key
            </Button>
          </div>
        </nav>

        {/* Footer Pro Tip */}
        <div className="p-3 border-t border-border">
          <div className="surface p-3 space-y-1 text-xs">
            <div className="font-mono text-[10px] text-muted-foreground uppercase">System Baseline</div>
            <div className="font-semibold">Studio Engine v3.0</div>
          </div>
        </div>
      </aside>

      {/* === MAIN CONTENT AREA === */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto relative z-10 pb-24 lg:pb-8">
        {/* Sticky Header */}
        <header className="h-14 flex items-center justify-between lg:justify-end px-4 lg:px-6 sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="size-7 grid place-items-center bg-primary text-primary-foreground rounded">
              <Clapperboard className="size-3.5" />
            </div>
            <h1 className="text-xs font-bold tracking-tight text-foreground">SuaraAI Studio</h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="size-8 rounded-md border-border bg-card text-muted-foreground hover:text-foreground active:scale-[0.98]"
            >
              {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-500" />}
            </Button>

            <Button
              onClick={() => setIsHistoryOpen(true)}
              variant="outline"
              size="icon"
              className="size-8 rounded-md border-border bg-card text-muted-foreground hover:text-foreground active:scale-[0.98]"
            >
              <History className="size-4 text-blue-500" />
            </Button>

            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 surface text-xs font-mono">
              <span className="size-2 rounded-full bg-emerald-500 status-dot text-emerald-500"></span>
              <span className="text-[11px] text-emerald-400 font-semibold">FastAPI Connected</span>
            </div>
          </div>
        </header>

        {/* Mobile Liquid Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 surface rounded-none border-t border-x-0 p-2 flex items-center justify-around lg:hidden bg-background">
          <button
            onClick={() => { setActiveMenu("dashboard"); setUseManual(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all duration-200 ${activeMenu === "dashboard" && !useManual ? "text-blue-500" : "text-muted-foreground"}`}
          >
            <LayoutDashboard className="size-5" />
            Dash
          </button>

          <button
            onClick={() => { setActiveMenu("channel"); channelSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all duration-200 ${activeMenu === "channel" ? "text-blue-500" : "text-muted-foreground"}`}
          >
            <Users className="size-5" />
            Channel
          </button>

          <button
            onClick={() => { setActiveMenu("dashboard"); setUseManual(false); inputSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className="flex flex-col items-center justify-center size-12 -mt-6 bg-gradient-to-tr from-blue-600 to-sky-400 text-white rounded-2xl shadow-xl shadow-blue-500/40 active:scale-90 transition-all border border-white/40"
          >
            <Plus className="size-6 stroke-[2.5]" />
          </button>

          <button
            onClick={() => { setActiveMenu("history"); setIsHistoryOpen(true); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all duration-200 ${activeMenu === "history" ? "text-blue-500" : "text-muted-foreground"}`}
          >
            <History className="size-5" />
            Riwayat
          </button>

          <button
            onClick={() => { setActiveMenu("settings"); setIsSettingsOpen(true); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all duration-200 ${activeMenu === "settings" ? "text-blue-500" : "text-muted-foreground"}`}
          >
            <Settings className="size-5" />
            Setting
          </button>
        </nav>

        {/* Workspace Main Container: Asymmetric 2-Column Studio Workspace */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
          {activeMenu === "ffmpeg" ? (
            <div className="space-y-4">
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
            <div className="flex flex-col lg:flex-row gap-5 items-start">

            {/* Left Column: Control Deck (Fixed width on desktop) */}
            <div className="w-full lg:w-[320px] xl:w-[350px] shrink-0 flex flex-col gap-4">

              {/* Target Channel DNA Card */}
              <div className="surface p-4 space-y-3" ref={channelSectionRef}>
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Users className="size-3.5 text-primary" /> Target Channel DNA
                  </h3>
                </div>

                <div className="flex flex-col gap-2">
                  {DEFAULT_CHANNELS.map((ch) => {
                    const isSelected = channelDna === ch.id;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setChannelDna(ch.id)}
                        className={`p-3 rounded-md border text-left flex items-center justify-between transition-colors ${isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-accent"
                          }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className={`text-xs font-bold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {ch.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {ch.description}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-primary text-primary-foreground font-semibold shrink-0">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Analytics Panel */}
                <div className="pt-2 border-t border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Analytics CSV</label>
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
                      <div className="surface p-2 rounded-md">
                        <div className="text-xs font-mono font-bold text-foreground">{analyticsSummary.total_videos_analyzed ?? "-"}</div>
                        <div className="text-[9px] font-mono text-muted-foreground uppercase">Video</div>
                      </div>
                      <div className="surface p-2 rounded-md">
                        <div className="text-xs font-mono font-bold text-emerald-400">{analyticsSummary.avg_ctr_pct != null ? `${Number(analyticsSummary.avg_ctr_pct).toFixed(1)}%` : "-"}</div>
                        <div className="text-[9px] font-mono text-muted-foreground uppercase">Avg CTR</div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-1.5 p-2.5 border border-dashed border-border rounded-md cursor-pointer hover:bg-accent transition-colors">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={(e) => { if (e.target.files?.[0]) { setAnalyticsFile(e.target.files[0]); handleUploadAnalytics(e.target.files[0]); } }}
                      />
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <Plus className="size-3.5 text-primary" /> Upload CSV
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Format & Duration Control Card */}
              <div className="surface p-4 space-y-3" ref={formatSectionRef}>
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sliders className="size-3.5 text-primary" /> Output Spec
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground block">Format Video</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setOutputType("shorts")}
                        className={`p-2.5 rounded-md border text-left flex flex-col gap-0.5 transition-colors ${outputType === "shorts"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-accent"
                          }`}
                      >
                        <div className="flex items-center gap-1 text-xs font-bold">
                          <Smartphone className="size-3 text-primary" /> Shorts
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground">30 - 90s</span>
                      </button>

                      <button
                        onClick={() => setOutputType("video_panjang")}
                        className={`p-2.5 rounded-md border text-left flex flex-col gap-0.5 transition-colors ${outputType === "video_panjang"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-accent"
                          }`}
                      >
                        <div className="flex items-center gap-1 text-xs font-bold">
                          <MonitorPlay className="size-3 text-primary" /> Long Form
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground">5 - 60m+</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground block">Target Durasi</label>
                    <div className="flex flex-wrap gap-1">
                      {DEFAULT_DURATIONS.filter(d => d.type === (outputType === "shorts" ? "shorts" : "long")).map(d => {
                        const isSelected = duration === d.id;
                        return (
                          <button
                            key={d.id}
                            onClick={() => setDuration(d.id)}
                            className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-colors ${isSelected
                              ? "border-primary bg-primary text-primary-foreground font-semibold"
                              : "border-border bg-card text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {outputType === "shorts" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">Jumlah Shot</label>
                      <div className="flex flex-wrap gap-1">
                        {[3, 5, 7, 10, 12].map(n => (
                          <button
                            key={n}
                            onClick={() => setShotCount(n)}
                            className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-colors ${shotCount === n
                              ? "border-primary bg-primary text-primary-foreground font-semibold"
                              : "border-border bg-card text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            {n} shot
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Provider Quick Badge */}
              <div className="surface p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <Brain className="size-3.5 text-primary" />
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-bold text-foreground uppercase">{provider}</span>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-[10px] font-mono text-primary hover:underline"
                >
                  Configure
                </button>
              </div>

            </div>

            {/* Right Column: Main Execution Workspace */}
            <div className="flex-1 min-w-0 flex flex-col gap-4 w-full">

              {/* Execution Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-primary/15 via-background to-card border border-primary/20 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-mono font-bold uppercase tracking-wider">
                      Studio Deck v3
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                    YouTube Content Intelligence
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    Generate naskah video, hook 60 detik, visual prompt shot-by-shot, dan paket SEO YouTube berorientasi CTR tinggi.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-card/80 p-1.5 rounded-2xl border border-border shrink-0 shadow-inner">
                  <button
                    onClick={() => setUseManual(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!useManual
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    YouTube URL
                  </button>
                  <button
                    onClick={() => setUseManual(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${useManual
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    Transkrip
                  </button>
                </div>
              </div>

              {/* Input Form Area */}
              <div className="surface p-5 space-y-4" ref={inputSectionRef}>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    {!useManual ? "Target YouTube Link" : "Source Transcript Content"}
                  </label>

                  {!useManual ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="Tempel link YouTube (cth: https://www.youtube.com/watch?v=...)"
                          value={youtubeUrl}
                          onChange={e => setYoutubeUrl(e.target.value)}
                          className="field h-11 pl-10 text-xs sm:text-sm rounded-md w-full"
                        />
                        <Link2 className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                      </div>
                      <Button
                        onClick={handleRunAnalysis}
                        disabled={loading || !youtubeUrl}
                        className="h-11 px-6 rounded-md bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 active:scale-[0.98] shrink-0"
                      >
                        {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
                        Run Analysis
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        placeholder="Tempel teks transkrip percakapan video..."
                        value={manualTranscript}
                        onChange={e => setManualTranscript(e.target.value)}
                        className="field min-h-[120px] max-h-[180px] overflow-y-auto text-xs sm:text-sm rounded-md p-3 resize-none"
                      />
                      <Button
                        onClick={handleRunAnalysis}
                        disabled={loading || !manualTranscript}
                        className="h-10 w-fit px-6 rounded-md bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 active:scale-[0.98]"
                      >
                        {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
                        Run Analysis
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground block">Extra Directives</label>
                    <Textarea
                      placeholder="Instruksi sudut pandang, gaya bahasa, atau penekanan poin..."
                      value={extraNotes}
                      onChange={e => setExtraNotes(e.target.value)}
                      className="field h-[80px] text-xs rounded-md resize-none p-3"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground block">YouTube SEO Suggestions</label>
                    <div className="field rounded-md px-3 flex items-center gap-2 h-10">
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
                      <div className="flex flex-wrap gap-1 pt-1">
                        {keywordSuggestions.map((kw, i) => (
                          <button
                            key={i}
                            onClick={() => toggleKeyword(kw)}
                            className={`text-[10px] px-2 py-0.5 rounded-sm border transition-colors ${selectedKeywords.includes(kw)
                              ? "border-primary bg-primary/15 text-primary font-semibold"
                              : "border-border bg-card text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            {selectedKeywords.includes(kw) ? "✓ " : "+ "}{kw}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Analysis Result Output Deck */}
              {result && (
                <AnalysisResultPanel
                  result={result}
                  outputType={outputType}
                  onGenerateTTS={handleGenerateTTS}
                  onGenerateImage={handleGenerateImage}
                />
              )}

            </div>

          </div>
          )}

          {/* Studio Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="surface p-6 max-w-xs w-full flex flex-col items-center text-center space-y-3">
                <Loader2 className="size-6 text-primary animate-spin" />
                <h3 className="text-sm font-bold text-foreground">Menyusun Strategy Konten</h3>
                <p className="text-xs font-mono text-muted-foreground">
                  {loadingStep || "Memproses transkrip & DNA channel..."}
                </p>
              </div>
            </div>
          )}

        </main>
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
