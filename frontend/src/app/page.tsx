"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnalysisResultPanel } from "@/components/AnalysisResultPanel";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  Clapperboard,
  Settings,
  Play,
  Activity,
  CheckSquare,
  Copy,
  AlertTriangle,
  ShieldAlert,
  Search,
  Brain,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  Flame,
  User,
  Scissors,
  Image as ImageIcon,
  FileText,
  Sliders,
  Key,
  Loader2,
  Lock,
  Compass,
  FileCode2,
  RotateCcw,
  Sun,
  Moon,
  LogOut,
  Search as SearchIcon,
  History,
  Trash2,
  LayoutDashboard,
  Users,
  HelpCircle,
  MonitorPlay,
  Smartphone,
  LayoutList,
  Target,
  MousePointerClick,
  Link2,
  Plus,
  Info,
  PlaySquare
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

// Default options in case API loading fails
const DEFAULT_PROVIDERS = [
  { id: "anthropic", label: "Anthropic Claude", mode: "anthropic" },
  { id: "openai", label: "OpenAI GPT", mode: "openai_compatible", default_base_url: "https://api.openai.com/v1" },
  { id: "gemini", label: "Google Gemini", mode: "openai_compatible", default_base_url: "https://generativelanguage.googleapis.com/v1beta/openai" },
  { id: "custom", label: "Custom OpenAI-Compatible Endpoint", mode: "openai_compatible", default_base_url: "https://ai.sahru.my.id/v1" }
];

const DEFAULT_CHANNELS = [
  { id: "suara_filsuf", name: "Suara Filsuf", emoji: "🧠", description: "Filosofi populer, reflektif, tenang, dan dalam." },
  { id: "nalar_senyap", name: "Nalar Senyap", emoji: "🌿", description: "Psikologi, healing, dan kontemplasi diri yang hangat." },
  { id: "tutur_kyai", name: "Tutur Kyai", emoji: "🕊️", description: "Hikmah Islami, akhlak, dan nilai spiritual yang santun." }
];

// ID harus sama persis dengan duration_setting.json di backend
const DEFAULT_DURATIONS = [
  // Shorts
  { id: "30s", label: "30 detik", min_seconds: 30, max_seconds: 30, type: "shorts" },
  { id: "45s", label: "45 detik", min_seconds: 45, max_seconds: 45, type: "shorts" },
  { id: "60s", label: "60 detik", min_seconds: 60, max_seconds: 60, type: "shorts" },
  { id: "75s", label: "75 detik", min_seconds: 75, max_seconds: 75, type: "shorts" },
  { id: "90s", label: "90 detik", min_seconds: 90, max_seconds: 90, type: "shorts" },
  // Video Panjang — harus cocok persis dengan duration_setting.json
  { id: "5-15m", label: "5–15 menit", min_seconds: 300, max_seconds: 900, type: "long" },
  { id: "15-30m", label: "15–30 menit", min_seconds: 900, max_seconds: 1800, type: "long" },
  { id: "30-60m", label: "30–60 menit", min_seconds: 1800, max_seconds: 3600, type: "long" },
  { id: "1-2j", label: "1–2 jam", min_seconds: 3600, max_seconds: 7200, type: "long" },
  { id: "2-4j", label: "2–4 jam", min_seconds: 7200, max_seconds: 14400, type: "long" },
];

const DEFAULT_MODELS: Record<string, string[]> = {
  anthropic: ["claude-3-5-sonnet-latest", "claude-3-5-sonnet-20241022", "claude-3-opus-latest"],
  openai: ["gpt-4o", "gpt-4o-mini", "o1-mini"],
  gemini: ["gemini-3.5-flash", "gemini-3.1-pro", "gemini-3.1-flash-lite"],
  custom: []
};

// API_BASE dihitung di runtime (client-side) saja, tidak saat SSR,
// agar nilai env variable yang dibake saat build (misalnya localhost) tidak ikut terbawa.
const FALLBACK_API_BASE = "https://suarafilsuf-suaraai-backend.hf.space";

function resolveApiBase(): string {
  if (typeof window === "undefined") return FALLBACK_API_BASE;
  const hostname = window.location.hostname;
  // Jika akses dari localhost / 127.0.0.1, gunakan backend lokal
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_BASE;
  }
  // Untuk semua deploy online (Vercel, dll), selalu ke HF Space
  return FALLBACK_API_BASE;
}

const API_BASE = resolveApiBase();

export default function Dashboard() {
  const [apiSettings, setApiSettings] = useState<any>(null);

  // States matching parameters
  const [provider, setProvider] = useState("custom");
  const [model, setModel] = useState("");
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Proxy States
  const [proxyMode, setProxyMode] = useState("none");
  const [proxyHttpUrl, setProxyHttpUrl] = useState("");
  const [proxyHttpsUrl, setProxyHttpsUrl] = useState("");
  const [proxyWebshareUser, setProxyWebshareUser] = useState("");
  const [proxyWebsharePass, setProxyWebsharePass] = useState("");

  // Skills States
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [webSearchMaxUses, setWebSearchMaxUses] = useState(5);
  const [enableThinking, setEnableThinking] = useState(false);
  const [thinkingBudget, setThinkingBudget] = useState(4000);
  const [enableCodeExecution, setEnableCodeExecution] = useState(false);

  const isReasoningModel = model.toLowerCase().startsWith("o1") || model.toLowerCase().startsWith("o3") || model.toLowerCase().includes("thinking");
  const showSkillsCard = provider === "anthropic" || isReasoningModel;

  // App Logic States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [imageModel, setImageModel] = useState("dall-e-3");
  const [ttsModel, setTtsModel] = useState("tts-1");
  const [ttsVoice, setTtsVoice] = useState("alloy");

  // History State
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("suara_ai_history");
      if (stored) {
        setHistoryList(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Gagal memuat riwayat:", e);
    }
  }, []);

  // Save to history helper
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

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistoryList([]);
    try {
      localStorage.removeItem("suara_ai_history");
      toast.success("Riwayat analisis berhasil dihapus!");
    } catch (e) {
      console.error("Gagal menghapus riwayat:", e);
    }
  }, []);

  // Delete single history item
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

  // Load history item
  const loadHistoryItem = useCallback((item: any) => {
    setResult(item.result);
    setChannelDna(item.channel_dna);
    setOutputType(item.output_type_id);
    setSelectedShotIndex(0);
    toast.success(`Berhasil memuat analisis: "${item.title}"`);
  }, []);
  const [error, setError] = useState<string | null>(null);

  // Selected Results States
  const [selectedShotIndex, setSelectedShotIndex] = useState(0);

  // Sidebar Active Menu State
  const [activeMenu, setActiveMenu] = useState("dashboard");

  // Refs for scroll-to-section
  const inputSectionRef = React.useRef<HTMLDivElement>(null);
  const channelSectionRef = React.useRef<HTMLDivElement>(null);
  const formatSectionRef = React.useRef<HTMLDivElement>(null);

  // Auth States
  const router = useRouter();
  const [authUser, setAuthUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(true);

  // YouTube Keyword Suggestions States
  const [keywordQuery, setKeywordQuery] = useState("");
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // Handle theme toggling
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

  // Auth check removed

  // YouTube Keyword Suggestions — debounced fetch
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

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.replace("/login");
  };

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  };

  // Check if channel analytics exists on DNA Channel change
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
        toast.success("✅ Analytics berhasil disimpan!", { id: uploadToastId });
      } else {
        toast.error(`❌ Gagal: ${data.detail || "Format tidak didukung"}`, { id: uploadToastId });
      }
    } catch (err) {
      toast.error("❌ Gagal menghubungi backend API.", { id: uploadToastId });
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
        toast.success("🗑️ Data analytics channel berhasil dihapus!");
      } else {
        toast.error("Gagal menghapus data analytics.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke backend API.");
    }
  };

  // Load API Settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          setApiSettings(data);
          // Pre-populate if settings retrieved
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

  // Update models list when provider changes
  useEffect(() => {
    const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
    const pInfo = providers.find((p: any) => p.id === provider);
    const list = pInfo?.models || DEFAULT_MODELS[provider] || [];
    if (list.length > 0) {
      // models di json berbentuk [{id, label}] sedangkan DEFAULT_MODELS berbentuk [string]
      const firstModel = typeof list[0] === 'string' ? list[0] : list[0].id;
      setModel(firstModel);
    } else {
      setModel("");
    }
    // Update base url defaults
    setBaseUrl(pInfo?.default_base_url || "");
  }, [provider, apiSettings]);

  // Update duration based on output type
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
          mode: provider,
          model: model,
          api_key: apiKey,
          base_url: baseUrl || (() => {
            const providers = apiSettings?.ai_provider?.providers || [];
            const pInfo = providers.find((p: any) => p.id === provider);
            return pInfo?.default_base_url || "";
          })(),
          timeout: 30
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ ok: true, message: data.message });
        toast.success("Koneksi API Berhasil!");
      } else {
        setTestResult({ ok: false, message: data.detail });
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
    setError(null);
    setResult(null);
    setLoadingStep("Menghubungi Backend...");

    // Simulated progress steps
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
          Clapperboard_url: useManual ? null : youtubeUrl,
          manual_transcript: useManual ? manualTranscript : null,
          channel_dna: channelDna,
          output_type_id: outputType,
          duration_id: duration,
          shot_count: outputType === "shorts" ? shotCount : null,
          provider_id: provider,
          model: model,
          api_key: apiKey,
          base_url: baseUrl,
          request_timeout: timeout,
          enable_web_search: enableWebSearch,
          web_search_max_uses: webSearchMaxUses,
          enable_thinking: enableThinking,
          thinking_budget_tokens: thinkingBudget,
          enable_code_execution: enableCodeExecution,
          extra_notes: [
            extraNotes,
            selectedKeywords.length > 0
              ? `\n\n[KEYWORD SEO YOUTUBE YANG DIREKOMENDASIKAN]: ${selectedKeywords.join(", ")}`
              : "",
          ]
            .filter(Boolean)
            .join(""),
          proxy_mode: proxyMode,
          proxy_http_url: proxyHttpUrl,
          proxy_https_url: proxyHttpsUrl,
          proxy_webshare_username: proxyWebshareUser,
          proxy_webshare_password: proxyWebsharePass
        })
      });

      clearInterval(interval);
      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setSelectedShotIndex(0);
        addToHistory(data.video_title, channelDna, outputType, data);
        toast.success("Analisis Video Berhasil diselesaikan!");
      } else if (res.status === 401) {
        setError(data.detail || "Unauthorized (401).");
        toast.error("Unauthorized (401).");
      } else {
        setError(data.detail || "Terjadi kesalahan pada backend server.");
        toast.error("Gagal melakukan analisis.");
      }
    } catch (err: any) {
      clearInterval(interval);
      setError("Gagal terhubung ke server backend FastAPI. Pastikan backend sudah dijalankan.");
      toast.error("Kesalahan jaringan / backend mati.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleGenerateTTS = async (textToSpeak: string) => {
    if (!textToSpeak) return;
    setTtsLoading(true);
    setTtsAudioUrl(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          voice: ttsVoice,
          model: ttsModel,
          api_key: apiKey,
          base_url: baseUrl,
          provider_id: provider
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        const audioSrc = `data:${data.mime_type};base64,${data.audio_base64}`;
        setTtsAudioUrl(audioSrc);
        toast.success("Voiceover berhasil dibuat!");
      } else {
        toast.error(data.detail || "Gagal membuat suara.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke backend.");
    } finally {
      setTtsLoading(false);
    }
  };

  const handleGenerateImage = async (imagePrompt: string) => {
    if (!imagePrompt) return;
    setImageLoading(true);
    setImageUrl(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          model: imageModel,
          api_key: apiKey,
          base_url: baseUrl,
          provider_id: provider
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setImageUrl(data.image_url);
        toast.success("Thumbnail berhasil dibuat!");
      } else {
        toast.error(data.detail || "Gagal membuat thumbnail.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke backend.");
    } finally {
      setImageLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Berhasil disalin ke clipboard!");
  };

  // Jangan render dashboard sebelum auth check selesai
  if (!authChecked) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-400 mb-4" />
        <p className="text-sm text-muted-foreground">Memverifikasi sesi...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased overflow-hidden dark:bg-background dark:text-foreground">
      <Toaster position="top-center" theme={theme} richColors />

      {/* === SIDEBAR (LEFT) === */}
      <aside className="w-[280px] bg-white dark:bg-card border-r border-slate-200 dark:border-border flex flex-col shrink-0 h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40">
        {/* Sidebar Header / Logo */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
              <Clapperboard className="size-5" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-blue-500 font-bold mb-0.5">AI Content Engine</div>
              <h1 className="text-sm font-extrabold tracking-tight leading-none text-slate-900 dark:text-slate-100">
                YouTube <span className="text-blue-600 dark:text-blue-400">Content PRO</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("dashboard"); setUseManual(false); inputSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className="w-full justify-start h-11 bg-blue-600 text-white hover:bg-blue-700 hover:text-white rounded-xl mb-4 font-semibold shadow-md shadow-blue-600/20"
          >
            <Plus className="size-4 mr-3" />
            Analisis Baru
          </Button>

          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("dashboard"); inputSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className={`w-full justify-start h-10 rounded-lg font-medium transition-all ${activeMenu === "dashboard" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            <LayoutDashboard className="size-4 mr-3" /> Dashboard
          </Button>

          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("history"); setIsHistoryOpen(true); }}
            className={`w-full justify-start h-10 rounded-lg font-medium transition-all ${activeMenu === "history" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            <History className="size-4 mr-3" /> Riwayat Analisis
          </Button>

          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("channel"); channelSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className={`w-full justify-start h-10 rounded-lg font-medium transition-all ${activeMenu === "channel" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            <Users className="size-4 mr-3" /> Channel & Target
          </Button>

          <Button
            variant="ghost"
            onClick={() => { setActiveMenu("manual"); setUseManual(true); inputSectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className={`w-full justify-start h-10 rounded-lg font-medium transition-all ${activeMenu === "manual" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            <FileText className="size-4 mr-3" /> Template Manual
          </Button>

          <div className="pt-6 pb-2">
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 mb-2">Sistem</div>
            <Button
              variant="ghost"
              onClick={() => { setActiveMenu("settings"); setIsSettingsOpen(true); }}
              className={`w-full justify-start h-10 rounded-lg font-medium transition-all ${activeMenu === "settings" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <Settings className="size-4 mr-3" /> Pengaturan
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setActiveMenu("token"); setIsSettingsOpen(true); toast.info("Buka tab Konfigurasi AI & Model untuk mengatur API Key."); }}
              className={`w-full justify-start h-10 rounded-lg font-medium transition-all ${activeMenu === "token" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <Key className="size-4 mr-3" /> Token & API
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setActiveMenu("help"); toast.info("💡 Tips: Tempel URL YouTube di kolom input, pilih channel & durasi, lalu klik Analisis Sekarang.", { duration: 6000 }); }}
              className={`w-full justify-start h-10 rounded-lg font-medium transition-all ${activeMenu === "help" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <HelpCircle className="size-4 mr-3" /> Bantuan
            </Button>
          </div>
        </nav>

        {/* Sidebar Footer (Pro Tips & User) */}
        <div className="p-4 border-t border-slate-100 dark:border-border/50">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-100 dark:border-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Tips Pro</h4>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Gunakan analisis rutin untuk memahami pola konten dan meningkatkan performa channel Anda.
            </p>
          </div>

          {authUser && (
            <div className="flex items-center gap-3 px-2">
              <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                {authUser.display_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{authUser.display_name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">@{authUser.username}</p>
              </div>
              <Button onClick={handleLogout} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                <LogOut className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* === MAIN CONTENT AREA (RIGHT) === */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
        {/* Header Controls */}
        <header className="h-20 flex items-center justify-end px-8 sticky top-0 z-30 bg-slate-50/80 dark:bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-slate-200 dark:border-border bg-white dark:bg-card text-slate-500 hover:text-blue-600 shadow-sm"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              onClick={() => useRouter().push('/prompts')}
              variant="outline"
              className="h-9 rounded-full border-slate-200 dark:border-border bg-white dark:bg-card text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-blue-600 shadow-sm gap-1.5 px-3"
            >
              <Sparkles className="size-3.5" />
              Master Prompt Studio
            </Button>
            <Button
              onClick={() => setIsHistoryOpen(true)}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-slate-200 dark:border-border bg-white dark:bg-card text-slate-500 hover:text-blue-600 shadow-sm"
            >
              <History className="size-4" />
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-full shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">FastAPI Local Server Active</span>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-8 max-w-[1200px] w-full mx-auto flex flex-col gap-6">

          {/* 1. Welcome Banner */}
          <div className="bg-white dark:bg-card rounded-3xl p-8 border border-slate-200/60 dark:border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              {/* 3D-ish Folder Icon Illustration */}
              <div className="size-24 rounded-3xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/10 flex items-center justify-center shrink-0 border border-blue-100/50 dark:border-blue-800/30 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-400/20 rounded-bl-full filter blur-md"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 bg-sky-300/20 rounded-tr-full filter blur-md"></div>
                <Play className="size-10 text-blue-600 dark:text-blue-400 fill-current relative z-10" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  Selamat datang kembali! 👋
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Apa yang ingin Anda <span className="text-blue-600 dark:text-blue-400">analisis</span> hari ini?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 pt-1">
                  Tempel URL video YouTube untuk mengekstrak insight mendalam dengan AI.<br />
                  Dapatkan analisis konten, ide judul, thumbnail, dan strategi.
                </p>
              </div>
            </div>

            {/* Badges — clickable shortcuts */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="Buka konfigurasi AI"
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="size-3.5 text-blue-500" /> AI Powered
              </button>
              <button
                onClick={() => inputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                title="Pergi ke input analisis"
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all cursor-pointer active:scale-95"
              >
                <Brain className="size-3.5 text-indigo-500" /> Deep Analysis
              </button>
              <button
                onClick={() => channelSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                title="Lihat riset kata kunci SEO"
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all cursor-pointer active:scale-95"
              >
                <Target className="size-3.5 text-emerald-500" /> SEO Optimized
              </button>
              <button
                onClick={() => formatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                title="Pilih format &amp; durasi"
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-700 dark:hover:text-amber-400 transition-all cursor-pointer active:scale-95"
              >
                <MousePointerClick className="size-3.5 text-amber-500" /> CTR Focused
              </button>
            </div>
          </div>

          {/* 2. Main Input Card */}
          <div className="bg-white dark:bg-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-border shadow-sm">
            <div className="space-y-6">
              {/* Input Type Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setUseManual(false)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${!useManual
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  <PlaySquare className="size-4" />
                  YouTube URL
                </button>
                <button
                  onClick={() => setUseManual(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${useManual
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  <FileText className="size-4" />
                  Transkrip Manual
                </button>
              </div>

              {/* Input Row */}
              <div className="space-y-2" ref={inputSectionRef}>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {!useManual ? "URL Video YouTube" : "Transkrip Video"}
                </label>
                {!useManual ? (
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Tempel tautan video YouTube... (e.g. https://www.youtube.com/watch?v=...)"
                        value={youtubeUrl}
                        onChange={e => setYoutubeUrl(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-border h-12 pl-12 text-sm rounded-2xl focus:border-blue-500 focus:ring-blue-500/20 transition-all w-full"
                      />
                      <Link2 className="absolute left-4 top-3.5 size-5 text-slate-400" />
                    </div>
                    <Button
                      onClick={handleRunAnalysis}
                      disabled={loading || !youtubeUrl}
                      className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all shrink-0"
                    >
                      {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
                      Analisis Sekarang
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Textarea
                      placeholder="Salin dan tempel transkrip percakapan video di sini..."
                      value={manualTranscript}
                      onChange={e => setManualTranscript(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-border min-h-[100px] max-h-[160px] overflow-y-auto text-sm rounded-2xl focus:border-blue-500 p-4 resize-none"
                    />
                    <Button
                      onClick={handleRunAnalysis}
                      disabled={loading || !manualTranscript}
                      className="h-12 w-fit px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all"
                    >
                      {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
                      Analisis Sekarang
                    </Button>
                  </div>
                )}
              </div>

              {/* 2 Columns: Notes & Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-border/50">
                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Catatan Khusus Ke AI (Opsional)</label>
                  <Textarea
                    placeholder="e.g. Fokuskan pada aspek stoikisme praktis, Gunakan pembawaan santai namun mendalam, dll."
                    value={extraNotes}
                    onChange={e => setExtraNotes(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-border h-[88px] text-xs rounded-2xl resize-none p-4"
                  />
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Riset Kata Kunci YouTube (Opsional)</label>
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-border rounded-2xl p-3 flex items-center gap-2 h-12 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
                    <SearchIcon className="size-4 text-slate-400 ml-1 shrink-0" />
                    <input
                      type="text"
                      placeholder="Ketik topik, misal: cara mengatasi cemas..."
                      value={keywordQuery}
                      onChange={(e) => setKeywordQuery(e.target.value)}
                      className="bg-transparent border-none text-xs w-full focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                    />
                    {keywordLoading && <Loader2 className="size-4 animate-spin text-slate-400" />}
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-1 pl-1">
                    <Info className="size-3" /> Dapatkan riset kata kunci terkait untuk optimasi SEO
                  </p>

                  {/* Keyword Suggestions */}
                  {keywordSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {keywordSuggestions.map((kw, i) => (
                        <button
                          key={i}
                          onClick={() => toggleKeyword(kw)}
                          className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${selectedKeywords.includes(kw)
                            ? "bg-blue-600 border-blue-600 text-white font-semibold"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-border text-slate-600 dark:text-slate-300 hover:border-blue-300"
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
          </div>

          {/* 3. Bottom Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Target Channel Card */}
            <div className="bg-white dark:bg-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-border shadow-sm flex flex-col h-full" ref={channelSectionRef}>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Users className="size-4 text-slate-500" /> Target Channel & Analytics
              </h3>
              {/* Active Channel Info Banner */}
              {(() => {
                const ch = DEFAULT_CHANNELS.find(c => c.id === channelDna);
                return ch ? (
                  <div className="mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl flex items-center gap-3">
                    <div className="text-2xl">{ch.emoji}</div>
                    <div>
                      <div className="text-xs font-bold text-blue-700 dark:text-blue-400">Channel Aktif: {ch.name}</div>
                      <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70">{ch.description}</div>
                    </div>
                  </div>
                ) : null;
              })()}
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-3">Pilih Channel</label>

              <div className="flex flex-col gap-3 flex-1">
                {DEFAULT_CHANNELS.map((ch) => {
                  const isSelected = channelDna === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setChannelDna(ch.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${isSelected
                        ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 ring-1 ring-blue-500/20"
                        : "bg-white dark:bg-card border-slate-200 dark:border-border hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg shadow-sm border border-slate-800">
                          {ch.emoji}
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${isSelected ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>
                            {ch.name}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 max-w-[200px] truncate">
                            {ch.description}
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full border border-blue-200 dark:border-blue-800/50">
                          Aktif
                        </div>
                      ) : (
                        <div className="size-4 rounded-full border border-slate-300 dark:border-slate-600"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Analytics Panel */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Data Analytics CSV</label>
                  {analyticsExists && (
                    <button
                      onClick={handleDeleteAnalytics}
                      className="text-[10px] text-red-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="size-3" /> Hapus
                    </button>
                  )}
                </div>

                {analyticsExists && analyticsSummary ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-border text-center">
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">{analyticsSummary.total_videos_analyzed ?? "-"}</div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider">Video</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-border text-center">
                        <div className="text-base font-extrabold text-emerald-600 dark:border-emerald-400">{analyticsSummary.avg_ctr_pct != null ? `${Number(analyticsSummary.avg_ctr_pct).toFixed(1)}%` : "-"}</div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider">Avg CTR</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-border text-center">
                        <div className="text-base font-extrabold text-blue-600 dark:border-blue-400">{analyticsSummary.avg_retention_pct != null ? `${Number(analyticsSummary.avg_retention_pct).toFixed(1)}%` : "-"}</div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider">Retensi</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-border text-center">
                        <div className="text-base font-extrabold text-amber-600 dark:border-amber-400">{analyticsSummary.avg_views_per_video != null ? Math.round(analyticsSummary.avg_views_per_video).toLocaleString("id-ID") : "-"}</div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider">Avg Views</div>
                      </div>
                    </div>
                    {analyticsSummary.notes && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 border border-slate-100 dark:border-border leading-relaxed">
                        {analyticsSummary.notes}
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors group">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) { setAnalyticsFile(e.target.files[0]); handleUploadAnalytics(e.target.files[0]); } }}
                    />
                    <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                      <Plus className="size-4 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Upload CSV Analytics</div>
                      <div className="text-[10px] text-slate-400">.csv atau .xlsx dari YouTube Studio</div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Format & Duration Card */}
            <div className="bg-white dark:bg-card rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-border shadow-sm flex flex-col h-full">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Sliders className="size-4 text-slate-500" /> Format Output & Durasi
              </h3>
              <div className="space-y-6 flex-1">
                {/* Format Output */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Format Output</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setOutputType("shorts")}
                      className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border transition-all ${outputType === "shorts"
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "bg-white dark:bg-card border-slate-200 dark:border-border text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                    >
                      <Smartphone className="size-4" />
                      <span className="text-xs font-bold">Shorts / Reels</span>
                      <span className={`text-[9px] ${outputType === "shorts" ? "text-blue-200" : "text-slate-400"}`}>30 - 60 detik</span>
                    </button>

                    <button
                      onClick={() => setOutputType("video_panjang")}
                      className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border transition-all ${outputType === "video_panjang"
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "bg-white dark:bg-card border-slate-200 dark:border-border text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                    >
                      <MonitorPlay className="size-4" />
                      <span className="text-xs font-bold">Video Panjang</span>
                      <span className={`text-[9px] ${outputType === "video_panjang" ? "text-blue-200" : "text-slate-400"}`}>8 - 30 menit</span>
                    </button>

                    <button className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-slate-900/20 text-slate-400 cursor-not-allowed">
                      <LayoutList className="size-4" />
                      <span className="text-xs font-bold">Video Series</span>
                      <span className="text-[9px]">Segera Hadir</span>
                    </button>
                  </div>
                </div>

                {/* Duration Targets */}
                <div className="space-y-3" ref={formatSectionRef}>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Durasi Target</label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_DURATIONS.filter(d => d.type === (outputType === "shorts" ? "shorts" : "long")).map(d => {
                      const isSelected = duration === d.id;
                      return (
                        <button
                          key={d.id}
                          onClick={() => setDuration(d.id)}
                          className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm"
                            : "bg-white dark:bg-card border-slate-200 dark:border-border text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                  {/* Duration Description */}
                  {(() => {
                    const selectedDur = DEFAULT_DURATIONS.find(d => d.id === duration);
                    const durationDescMap: Record<string, string> = {
                      "30s": "Cocok untuk konten singkat & langsung. Algoritma Shorts sangat menyukai video 30 detik penuh.",
                      "45s": "Durasi ideal untuk cerita pendek dengan satu poin utama yang kuat.",
                      "60s": "Batas maksimum Shorts. Cukup waktu untuk 2-3 poin penting + CTA.",
                      "75s": "Video medium pendek — masuk kategori Shorts namun lebih kaya konten.",
                      "90s": "Durasi transisi menuju video reguler. Baik untuk tutorial ringkas.",
                      "5-15m": "Ideal untuk topik tunggal mendalam. Cocok untuk format edukasi & vlog.",
                      "15-30m": "Format podcast video atau deep-dive. Retensi menengah.",
                      "30-60m": "Konten premium & long-form. Cocok untuk wawancara atau kelas online.",
                      "1-2j": "Konten maraton/workshop. Perlu struktur yang sangat baik agar retensi terjaga.",
                      "2-4j": "Live streaming / event panjang. Cocok untuk dokumentasi penuh suatu acara.",
                    };
                    return selectedDur ? (
                      <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-border">
                        <Info className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{selectedDur.label}</span> — {durationDescMap[selectedDur.id] || "Durasi custom yang dipilih."}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Shot Count — only for Shorts */}
                {outputType === "shorts" && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Jumlah Shot Scene</label>
                    <div className="flex flex-wrap gap-2">
                      {[3, 5, 7, 10, 12, 15].map(n => (
                        <button
                          key={n}
                          onClick={() => setShotCount(n)}
                          className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${shotCount === n
                            ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm"
                            : "bg-white dark:bg-card border-slate-200 dark:border-border text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                        >
                          {n} shot
                        </button>
                      ))}
                    </div>
                    <div className="flex items-start gap-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/30">
                      <Info className="size-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                        <span className="font-bold">{shotCount} shot</span> — AI akan menghasilkan {shotCount} scene berbeda untuk video Shorts Anda. Lebih banyak shot = variasi visual lebih kaya.
                      </p>
                    </div>
                  </div>
                )}

                {/* Info Recommendation */}
                <div className="mt-auto pt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl p-3 flex items-start gap-2">
                    <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                      Rekomendasi: {outputType === "shorts" ? "30-60 detik untuk algoritma Shorts agar retensi optimal." : "Durasi 8-10 menit optimal untuk mid-roll ads dan deep dive topic."}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Result Showcase */}
          {result && (
            <AnalysisResultPanel
              result={result}
              outputType={outputType}
              onGenerateTTS={handleGenerateTTS}
              onGenerateImage={handleGenerateImage}
            />
          )}



      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-3xl p-8 shadow-2xl max-w-sm w-full flex flex-col items-center">
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-full border-4 border-slate-100 dark:border-border border-t-blue-500 animate-spin" />
              <Brain className="absolute inset-0 m-auto size-6 text-blue-500 animate-pulse" />
            </div>
            <h3 className="text-base font-extrabold mb-2 text-slate-900 dark:text-white text-center">AI Sedang Bekerja...</h3>
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              {loadingStep || "Proses ini membutuhkan waktu sekitar 30 - 90 detik karena model AI menyusun konten komprehensif."}
            </p>
          </div>
        </div>
      )}
    </main>
      </div >

    {/* Modals */ }
    < Dialog open = { isSettingsOpen } onOpenChange = { setIsSettingsOpen } >
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings className="size-5 text-blue-500" /> Konfigurasi AI & Proxy</DialogTitle>
          <DialogDescription>Atur preferensi API, model reasoning, dan proxy di sini.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="azure-card rounded-2xl p-6 ">
            <div className="flex items-center gap-2 mb-1.5">
              <Settings className="size-5 text-blue-500 drop-shadow-[0_0_8px_rgba(0,120,212,0.5)]" />
              <h2 className="text-base font-bold text-foreground">Konfigurasi AI & Model</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Pilih provider dan sesuaikan credentials Anda.
            </p>
            <div className="space-y-4">
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">AI Provider</label>
                <Select value={provider} onValueChange={(v) => v && setProvider(v)}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground h-9 text-xs text-foreground font-semibold hover:bg-muted transition-colors">
                    <SelectValue placeholder="Pilih Provider">
                      {(() => {
                        const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
                        const p = providers.find((pr: any) => pr.id === provider);
                        return p ? p.label : provider;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground font-semibold text-xs shadow-xl min-w-[260px]">
                    {((apiSettings?.ai_provider?.providers) || DEFAULT_PROVIDERS).map((p: any) => (
                      <SelectItem key={p.id} value={p.id} className="py-2">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Provider Subtext */}
                {(() => {
                  const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
                  const p = providers.find((pr: any) => pr.id === provider);
                  return p ? (
                    <p className="text-[10px] text-muted-foreground leading-normal mt-1 bg-muted/40 p-2 rounded-lg border border-border/40">
                      {p.description || "Provider API."}
                    </p>
                  ) : null;
                })()}
              </div>

              {/* Model Choice */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">Model AI</label>
                {provider === "custom" ? (
                  <Input
                    placeholder="Masukkan model ID custom..."
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="bg-background border-border text-xs h-9.5 focus:border-blue-500/60 transition-colors text-foreground"
                  />
                ) : (
                  <Select value={model} onValueChange={(v) => v && setModel(v)}>
                    <SelectTrigger className="w-full bg-background border-border text-foreground h-9 text-xs text-foreground font-semibold hover:bg-muted transition-colors">
                      <SelectValue placeholder="Pilih Model">
                        {(() => {
                          const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
                          const pInfo = providers.find((p: any) => p.id === provider);
                          const list = pInfo?.models || DEFAULT_MODELS[provider] || [];
                          const m = list.find((x: any) => (typeof x === 'string' ? x : x.id) === model);
                          return m ? (typeof m === 'string' ? m : m.label) : model;
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground font-semibold text-xs shadow-xl min-w-[240px]">
                      {(() => {
                        const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
                        const pInfo = providers.find((p: any) => p.id === provider);
                        const list = pInfo?.models || DEFAULT_MODELS[provider] || [];
                        return list.map((m: any) => {
                          const mId = typeof m === 'string' ? m : m.id;
                          const mLabel = typeof m === 'string' ? m : m.label;
                          return (
                            <SelectItem key={mId} value={mId} className="py-2">
                              {mLabel}
                            </SelectItem>
                          );
                        });
                      })()}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>API Key</span>
                  <span className="text-[10px] text-muted-foreground/80 uppercase flex items-center gap-1 font-normal lowercase">
                    <Lock className="size-2.5" /> env fallback active
                  </span>
                </label>
                <Input
                  type="password"
                  placeholder="Masukkan API Key..."
                  value={apiKey}
                  onChange={e => {
                    setApiKey(e.target.value);
                  }}
                  onBlur={e => {
                    if (e.target.value.trim().length > 10) {
                      toast.success("✓ API Key disimpan di sesi ini.");
                    }
                  }}
                  className="bg-background border-border text-foreground text-xs h-9 focus:border-blue-500/60 transition-colors"
                />
              </div>

              {/* Base URL (only for providers that need it) */}
              {(() => {
                const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
                const pInfo = providers.find((p: any) => p.id === provider);
                const needsBaseUrl = pInfo?.requires_base_url || provider === "custom" || provider === "9router";
                if (!needsBaseUrl) return null;
                return (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">Base URL Endpoint</label>
                    <Input
                      placeholder="e.g. http://localhost:20128/v1"
                      value={baseUrl}
                      onChange={e => setBaseUrl(e.target.value)}
                      className="bg-background border-border text-foreground text-xs h-9 focus:border-blue-500/60 transition-colors"
                    />
                  </div>
                );
              })()}

              {/* Timeout API */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">Timeout API</label>
                  <span className="text-xs text-blue-400 font-semibold">{timeout} detik</span>
                </div>
                <Slider
                  min={30}
                  max={600}
                  step={10}
                  value={[timeout]}
                  onValueChange={(v) => setTimeoutVal(typeof v === "number" ? v : (v as readonly number[])[0])}
                  className="py-1.5 [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-400"
                />
              </div>

              {/* Test Connection Button */}
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  onClick={handleTestConnection}
                  disabled={testLoading}
                  variant="outline"
                  className="border-border hover:bg-accent text-xs font-semibold h-9.5 text-foreground w-full transition-colors"
                >
                  {testLoading ? (
                    <>
                      <Loader2 className="mr-2 size-3 animate-spin" />
                      Menghubungi API...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-1.5 size-3" />
                      Test Koneksi API
                    </>
                  )}
                </Button>
                {testResult && (
                  <div className={`text-[11px] p-2.5 rounded-lg border flex items-start gap-2 ${testResult.ok
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-950/20 border-rose-900/40 text-rose-400"
                    }`}>
                    {testResult.ok ? (
                      <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    )}
                    <div className="leading-relaxed">
                      <strong>{testResult.ok ? "Koneksi OK" : "Koneksi Gagal"}:</strong> {testResult.message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Claude Beta / Reasoning Skills Expander */}
          {showSkillsCard && (
            <div className="azure-card">
              <div className="flex items-center gap-2 mb-1.5">
                <Brain className="size-4 text-teal-400" />
                <h2 className="text-sm font-semibold text-foreground">{provider === "anthropic" ? "Skill Claude Tambahan" : "Fitur Agentic / Reasoning"}</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {provider === "anthropic" ? "Aktifkan kemampuan asinkron ekstra." : "Konfigurasi kemampuan penalaran (reasoning) model."}
              </p>
              <div className="space-y-4">
                {/* Web Search - Only for Anthropic */}
                {provider === "anthropic" && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        id="webSearch"
                        checked={enableWebSearch}
                        onCheckedChange={(val: boolean) => setEnableWebSearch(val)}
                        className="mt-0.5 border-border"
                      />
                      <div className="space-y-1">
                        <label htmlFor="webSearch" className="text-xs font-semibold text-foreground/90 cursor-pointer flex items-center gap-1.5">
                          <Search className="size-3 text-muted-foreground" />
                          <span>Web Search (Riset Online)</span>
                        </label>
                        <p className="text-[10px] text-muted-foreground/80 leading-normal">
                          Mencari tren judul terbaru, riset kata kunci kompetitor, dan data terkini.
                        </p>
                      </div>
                    </div>

                    {enableWebSearch && (
                      <div className="space-y-2 pl-6 pb-2">
                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>Maks. Jumlah Pencarian</span>
                          <span className="text-teal-400">{webSearchMaxUses} Kali</span>
                        </div>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[webSearchMaxUses]}
                          onValueChange={(v) => setWebSearchMaxUses(typeof v === "number" ? v : (v as readonly number[])[0])}
                          className="[&_[role=slider]]:bg-teal-500 [&_[role=slider]]:border-teal-400"
                        />
                      </div>
                    )}

                    <Separator className="bg-card" />
                  </>
                )}

                {/* Extended Thinking - For Anthropic or OpenAI Reasoning models */}
                {(provider === "anthropic" || isReasoningModel) && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        id="thinking"
                        checked={enableThinking}
                        onCheckedChange={(val: boolean) => setEnableThinking(val)}
                        className="mt-0.5 border-border"
                      />
                      <div className="space-y-1">
                        <label htmlFor="thinking" className="text-xs font-semibold text-foreground/90 cursor-pointer flex items-center gap-1.5">
                          <Brain className="size-3 text-muted-foreground" />
                          <span>{provider === "anthropic" ? "Extended Thinking" : "Reasoning Effort (Penalaran)"}</span>
                        </label>
                        <p className="text-[10px] text-muted-foreground/80 leading-normal">
                          {provider === "anthropic"
                            ? "Claude bernalar lebih lambat, mendalam, dan eksplisit (reasoning)."
                            : "Model menggunakan waktu tambahan untuk menganalisis dan bernalar mendalam."}
                        </p>
                      </div>
                    </div>

                    {enableThinking && (
                      <div className="space-y-2 pl-6 pb-2">
                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>{provider === "anthropic" ? "Budget Token Berpikir" : "Reasoning Effort"}</span>
                          <span className="text-teal-400 font-medium">
                            {provider === "anthropic"
                              ? `${thinkingBudget} Token`
                              : thinkingBudget <= 2000
                                ? "Low (Rendah)"
                                : thinkingBudget <= 8000
                                  ? "Medium (Sedang)"
                                  : "High (Tinggi)"}
                          </span>
                        </div>
                        <Slider
                          min={provider === "anthropic" ? 1024 : 1000}
                          max={provider === "anthropic" ? 16000 : 9000}
                          step={provider === "anthropic" ? 1024 : 4000}
                          value={[thinkingBudget]}
                          onValueChange={(v) => setThinkingBudget(typeof v === "number" ? v : (v as readonly number[])[0])}
                          className="[&_[role=slider]]:bg-teal-500 [&_[role=slider]]:border-teal-400"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Code Execution - Only for Anthropic */}
                {provider === "anthropic" && (
                  <>
                    <Separator className="bg-card" />
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        id="codeExec"
                        checked={enableCodeExecution}
                        onCheckedChange={(val: boolean) => setEnableCodeExecution(val)}
                        className="mt-0.5 border-border"
                      />
                      <div className="space-y-1">
                        <label htmlFor="codeExec" className="text-xs font-semibold text-foreground/90 cursor-pointer flex items-center gap-1.5">
                          <FileCode2 className="size-3 text-muted-foreground" />
                          <span>Code Execution (Python Sandbox)</span>
                        </label>
                        <p className="text-[10px] text-muted-foreground/80 leading-normal">
                          Verifikasi hitungan durasi shot secara akurat lewat runtime Python sandbox.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* YouTube Proxy Configuration */}
          <div className="azure-card rounded-2xl p-6 ">
            <div className="flex items-center gap-2 mb-1.5">
              <Compass className="size-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-foreground">Proxy YouTube (Anti-Blocking)</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Mengurangi resiko rate-limit IP saat scraping transkrip.
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Proxy Mode</label>
                <Select value={proxyMode} onValueChange={(v) => v && setProxyMode(v)}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground h-9 text-xs text-foreground font-semibold hover:bg-muted transition-colors">
                    <SelectValue placeholder="Pilih Proxy">
                      {proxyMode === "none" ? "Tidak pakai proxy" : proxyMode === "webshare" ? "Webshare Proxy" : "HTTP/HTTPS Proxy"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground font-semibold text-xs shadow-xl min-w-[200px]">
                    <SelectItem value="none">Tidak pakai proxy</SelectItem>
                    <SelectItem value="webshare">Webshare (rotating residential)</SelectItem>
                    <SelectItem value="generic">Proxy HTTP/HTTPS biasa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {proxyMode === "generic" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">HTTP Proxy URL</label>
                    <Input
                      placeholder="http://proxy-ip:port"
                      value={proxyHttpUrl}
                      onChange={e => setProxyHttpUrl(e.target.value)}
                      className="bg-background border-border text-foreground text-foreground font-semibold text-xs h-9.5 focus:border-blue-500/60 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">HTTPS Proxy URL</label>
                    <Input
                      placeholder="https://proxy-ip:port"
                      value={proxyHttpsUrl}
                      onChange={e => setProxyHttpsUrl(e.target.value)}
                      className="bg-background border-border text-foreground text-foreground font-semibold text-xs h-9.5 focus:border-blue-500/60 transition-colors"
                    />
                  </div>
                </div>
              )}

              {proxyMode === "webshare" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">Username Webshare</label>
                    <Input
                      placeholder="Webshare username"
                      value={proxyWebshareUser}
                      onChange={e => setProxyWebshareUser(e.target.value)}
                      className="bg-background border-border text-foreground font-semibold text-xs h-9.5 focus:border-blue-500/60 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">Password Webshare</label>
                    <Input
                      type="password"
                      placeholder="Webshare password"
                      value={proxyWebsharePass}
                      onChange={e => setProxyWebsharePass(e.target.value)}
                      className="bg-background border-border text-foreground font-semibold text-xs h-9.5 focus:border-blue-500/60 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testLoading}
              className="text-xs h-9 px-4 border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              {testLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
              Tes API Key
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs h-9 px-4"
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  toast.success("Konfigurasi AI berhasil disimpan!");
                  setIsSettingsOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-5 font-semibold shadow-md"
              >
                Simpan Konfigurasi
              </Button>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog >
    <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-card border-l-border/40 p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border/40 bg-background/50">
          <SheetTitle className="flex items-center gap-2 text-blue-400"><History className="size-5" /> Riwayat Analisis</SheetTitle>
          <SheetDescription>Akses cepat ke analisis yang pernah dilakukan.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Riwayat Analisis Card */}
          <div className="azure-card rounded-2xl p-6 ">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-foreground">
                  <History className="size-4 text-blue-400" />
                  <h2 className="text-sm font-semibold font-sans tracking-tight">Riwayat Analisis</h2>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Akses cepat ke analisis sebelumnya.
                </p>
              </div>
              {historyList.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearHistory}
                  title="Hapus Semua Riwayat"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {historyList.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  Belum ada riwayat analisis.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="group flex items-center justify-between p-2.5 rounded-lg border border-border/40 hover:border-blue-500/50 bg-background/50 hover:bg-blue-500/5 cursor-pointer transition-all duration-200"
                    >
                      <div className="space-y-1 pr-2 min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground/90 truncate group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="bg-muted px-1.5 py-0.5 rounded text-zinc-400 font-medium">
                            {item.channel_dna === "suara_filsuf" ? "Suara Filsuf" : item.channel_dna === "nalar_senyap" ? "Nalar Senyap" : "Tutur Kyai"}
                          </span>
                          <span>•</span>
                          <span>{item.timestamp}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
    </div >
  );

}
