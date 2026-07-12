"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Trash2
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  { id: "9router", label: "9Router Proxy", mode: "openai_compatible", default_base_url: "http://localhost:20128/v1" },
  { id: "custom", label: "Custom OpenAI Compatible", mode: "openai_compatible" }
];

const DEFAULT_CHANNELS = [
  { id: "suara_filsuf", name: "Suara Filsuf", emoji: "🧠", description: "Filosofi populer, reflektif, tenang, dan dalam." },
  { id: "nalar_senyap", name: "Nalar Senyap", emoji: "🌿", description: "Psikologi, healing, dan kontemplasi diri yang hangat." },
  { id: "tutur_kyai", name: "Tutur Kyai", emoji: "🕊️", description: "Hikmah Islami, akhlak, dan nilai spiritual yang santun." }
];

// ID harus sama persis dengan duration_setting.json di backend
const DEFAULT_DURATIONS = [
  // Shorts
  { id: "30s",   label: "30 detik",    min_seconds: 30,   max_seconds: 30,   type: "shorts" },
  { id: "45s",   label: "45 detik",    min_seconds: 45,   max_seconds: 45,   type: "shorts" },
  { id: "60s",   label: "60 detik",    min_seconds: 60,   max_seconds: 60,   type: "shorts" },
  { id: "75s",   label: "75 detik",    min_seconds: 75,   max_seconds: 75,   type: "shorts" },
  { id: "90s",   label: "90 detik",    min_seconds: 90,   max_seconds: 90,   type: "shorts" },
  // Video Panjang — harus cocok persis dengan duration_setting.json
  { id: "5-15m",  label: "5–15 menit",  min_seconds: 300,  max_seconds: 900,  type: "long" },
  { id: "15-30m", label: "15–30 menit", min_seconds: 900,  max_seconds: 1800, type: "long" },
  { id: "30-60m", label: "30–60 menit", min_seconds: 1800, max_seconds: 3600, type: "long" },
  { id: "1-2j",   label: "1–2 jam",     min_seconds: 3600, max_seconds: 7200, type: "long" },
  { id: "2-4j",   label: "2–4 jam",     min_seconds: 7200, max_seconds: 14400, type: "long" },
];

const DEFAULT_MODELS: Record<string, string[]> = {
  anthropic: ["claude-3-5-sonnet-latest", "claude-3-5-sonnet-20241022", "claude-3-opus-latest"],
  openai: ["gpt-4o", "gpt-4o-mini", "o1-mini"],
  gemini: ["gemini-2.5-flash", "gemini-2.5-pro"],
  "9router": ["cc/claude-sonnet-4-6", "openai/gpt-4o"],
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
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("claude-3-5-sonnet-latest");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
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
      } catch {}
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Berhasil disalin ke clipboard!");
  };

  // Jangan render dashboard sebelum auth check selesai
  if (!authChecked) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="size-8 animate-spin text-violet-400 mb-4" />
        <p className="text-sm text-muted-foreground">Memverifikasi sesi...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-200">
      <Toaster position="top-center" theme={theme} richColors />
      
      {/* Header Banner */}
      <header className="border-b border-border/85 bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-600/10 border border-violet-500/20 rounded-xl text-violet-400">
              <Clapperboard className="size-5.5 transition-transform hover:scale-110 duration-200" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-violet-400 font-mono font-bold leading-none mb-1">AI Content Engine</div>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2 leading-none">
                <span className="text-foreground">YouTube</span> 
                <span className="text-violet-400 font-medium">Content Intelligence</span> 
                <span className="text-[9px] bg-muted border border-border/80 text-muted-foreground/80 px-2 py-0.5 rounded-full font-mono font-medium tracking-wide">PRO</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-muted-foreground font-medium">FastAPI Local Server Active</span>
            </div>

            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border bg-card text-muted-foreground hover:bg-accent transition-all shrink-0"
            >
              {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-400" />}
            </Button>

            {/* User info & Logout */}
            {authUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-foreground leading-none">{authUser.display_name}</p>
                  <p className="text-[10px] text-muted-foreground">@{authUser.username}</p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                  title="Keluar"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Control Panel (Sidebar Settings) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <Settings className="size-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-foreground">Konfigurasi AI & Model</h2>
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
                    className="bg-background border-border text-xs h-9.5 focus:border-violet-500/60 transition-colors text-foreground"
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
                  className="bg-background border-border text-foreground text-xs h-9 focus:border-violet-500/60 transition-colors"
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
                      className="bg-background border-border text-foreground text-xs h-9 focus:border-violet-500/60 transition-colors"
                    />
                  </div>
                );
              })()}

              {/* Timeout API */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">Timeout API</label>
                  <span className="text-xs text-violet-400 font-semibold">{timeout} detik</span>
                </div>
                <Slider 
                  min={30} 
                  max={600} 
                  step={10} 
                  value={[timeout]} 
                  onValueChange={(v) => setTimeoutVal(typeof v === "number" ? v : (v as readonly number[])[0])} 
                  className="py-1.5 [&_[role=slider]]:bg-violet-500 [&_[role=slider]]:border-violet-400"
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
                  <div className={`text-[11px] p-2.5 rounded-lg border flex items-start gap-2 ${
                    testResult.ok 
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

          {/* 🎭 Target Channel & Analytics */}
          <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="size-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">Target Channel &amp; Analytics</h2>
            </div>
            
            <div className="space-y-4">
              {/* Channel Selector */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] font-mono block">DNA Channel</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {DEFAULT_CHANNELS.map((ch) => {
                    const isSelected = channelDna === ch.id;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setChannelDna(ch.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                          isSelected
                            ? "bg-violet-600/10 border-violet-500/50 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20"
                            : "bg-muted/30 border-border text-muted-foreground hover:border-zinc-500/40 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{ch.emoji}</span>
                          <span className="text-xs font-bold font-sans tracking-tight">{ch.name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/80 leading-normal font-medium">{ch.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Analytics CSV Upload */}
              <div className="space-y-2.5 pt-2.5 border-t border-border/30">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.2em] font-mono block flex items-center gap-1.5">
                  <Activity className="size-3 text-emerald-400" />
                  Analytics Channel
                </label>
                {analyticsExists ? (
                  <div className="space-y-2">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block mb-0.5 text-foreground text-[11px]">Analytics Aktif</strong>
                        <p className="text-[10px] text-emerald-400/90">Data performa real untuk channel ini sudah tersimpan dan otomatis digunakan.</p>
                        {analyticsSummary && (
                          <div className="mt-2 pt-2 border-t border-emerald-500/25 text-[10px] space-y-1 text-muted-foreground font-mono">
                            <div>• Total video: {analyticsSummary.total_videos_analyzed}</div>
                            {analyticsSummary.avg_ctr_pct && <div>• Rata-rata CTR: {analyticsSummary.avg_ctr_pct.toFixed(2)}%</div>}
                            {analyticsSummary.avg_retention_pct && <div>• Rata-rata Retensi: {analyticsSummary.avg_retention_pct.toFixed(2)}%</div>}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={handleDeleteAnalytics}
                      variant="outline"
                      className="border-rose-950/40 text-rose-400 hover:bg-rose-950/20 w-full h-8 text-[10px] font-medium transition-all rounded-xl"
                    >
                      🗑️ Hapus data analytics channel
                    </Button>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-xl p-4 bg-background/20 hover:border-border/60 transition-all">
                    <label htmlFor="analytics-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <FileText className="size-5 text-emerald-400" />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-foreground/90">
                          Upload / perbarui analytics
                        </div>
                        <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                          .csv atau .zip berisi beberapa .csv
                        </div>
                      </div>
                    </label>
                    <input
                      id="analytics-upload"
                      type="file"
                      accept=".csv,.zip"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAnalyticsFile(file);
                          handleUploadAnalytics(file);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Format Output & Durasi */}
          <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="size-4 text-indigo-550" />
              <h2 className="text-sm font-semibold text-foreground">Format Output &amp; Durasi</h2>
            </div>
            
            <div className="space-y-4">
              {/* Output Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] font-mono block">Format Output</label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted border border-border rounded-xl">
                  <button
                    onClick={() => setOutputType("shorts")}
                    className={`py-2 px-3 text-[11px] font-semibold rounded-lg transition-all cursor-pointer active:scale-[0.98] ${
                      outputType === "shorts"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground bg-transparent"
                    }`}
                  >
                    🎬 Shorts / TikTok
                  </button>
                  <button
                    onClick={() => setOutputType("video_panjang")}
                    className={`py-2 px-3 text-[11px] font-semibold rounded-lg transition-all cursor-pointer active:scale-[0.98] ${
                      outputType === "video_panjang"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground bg-transparent"
                    }`}
                  >
                    🎥 Video Panjang
                  </button>
                </div>
              </div>

              {/* Duration Target */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] font-mono block">Durasi Target</label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_DURATIONS.filter(d => d.type === (outputType === "shorts" ? "shorts" : "long")).map(d => {
                    const isSelected = duration === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setDuration(d.id)}
                        className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer active:scale-[0.96] ${
                          isSelected
                            ? "bg-violet-600/10 border-violet-500/50 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/10"
                            : "bg-muted/30 border-border text-muted-foreground hover:border-zinc-500/40 hover:text-foreground"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shot Count (Shorts Only) */}
              {outputType === "shorts" && (
                <div className="space-y-2.5 pt-1.5 border-t border-border/30">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] font-mono block flex items-center justify-between">
                    <span>Jumlah Segmen / Shots</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">{shotCount} Shot</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[3, 4, 5, 6, 7, 8].map(n => {
                      const isSelected = shotCount === n;
                      return (
                        <button
                          key={n}
                          onClick={() => setShotCount(n)}
                          className={`px-3 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer active:scale-[0.96] ${
                            isSelected
                              ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/10"
                              : "bg-muted/30 border-border text-muted-foreground hover:border-zinc-500/40 hover:text-foreground"
                          }`}
                        >
                          {n} Shot
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Claude Beta / Reasoning Skills Expander */}
          {showSkillsCard && (
            <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <Brain className="size-4 text-pink-400" />
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
                          <span className="text-pink-400">{webSearchMaxUses} Kali</span>
                        </div>
                        <Slider 
                          min={1} 
                          max={10} 
                          step={1} 
                          value={[webSearchMaxUses]} 
                          onValueChange={(v) => setWebSearchMaxUses(typeof v === "number" ? v : (v as readonly number[])[0])}
                          className="[&_[role=slider]]:bg-pink-500 [&_[role=slider]]:border-pink-400"
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
                          <span className="text-pink-400 font-medium">
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
                          className="[&_[role=slider]]:bg-pink-500 [&_[role=slider]]:border-pink-400"
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
          <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-200 shadow-sm">
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
                      className="bg-background border-border text-foreground text-foreground font-semibold text-xs h-9.5 focus:border-violet-500/60 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">HTTPS Proxy URL</label>
                    <Input 
                      placeholder="https://proxy-ip:port" 
                      value={proxyHttpsUrl} 
                      onChange={e => setProxyHttpsUrl(e.target.value)} 
                      className="bg-background border-border text-foreground text-foreground font-semibold text-xs h-9.5 focus:border-violet-500/60 transition-colors"
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
                      className="bg-background border-border text-foreground font-semibold text-xs h-9.5 focus:border-violet-500/60 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">Password Webshare</label>
                    <Input 
                      type="password"
                      placeholder="Webshare password" 
                      value={proxyWebsharePass} 
                      onChange={e => setProxyWebsharePass(e.target.value)} 
                      className="bg-background border-border text-foreground font-semibold text-xs h-9.5 focus:border-violet-500/60 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Riwayat Analisis Card */}
          <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-foreground">
                  <History className="size-4 text-violet-400" />
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
                      className="group flex items-center justify-between p-2.5 rounded-lg border border-border/40 hover:border-violet-500/50 bg-background/50 hover:bg-zinc-800/40 cursor-pointer transition-all duration-200"
                    >
                      <div className="space-y-1 pr-2 min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground/90 truncate group-hover:text-violet-400 transition-colors">
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
        </section>

        {/* Right Section (Main App Area) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Input Form */}
          <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-200 shadow-sm relative">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="size-5 text-violet-400" />
              <h2 className="text-base font-bold text-foreground">Analisis Strategi Konten Video Baru</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Masukkan URL video kompetitor/referensi untuk diekstraksi menjadi paket produksi orisinal.
            </p>
            <div className="space-y-4">
              {/* Mode Selector Tab */}
              <div className="flex gap-2 p-1 bg-muted border border-border/40 rounded-lg w-fit">
                <Button 
                  onClick={() => setUseManual(false)} 
                  variant={!useManual ? "default" : "ghost"}
                  className={`text-xs h-8 px-4 rounded-md transition-all active:scale-[0.97] ${
                    !useManual 
                      ? "bg-violet-600 hover:bg-violet-550 text-white font-semibold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Play className="size-3 mr-1.5 fill-current" />
                  YouTube URL
                </Button>
                <Button 
                  onClick={() => setUseManual(true)} 
                  variant={useManual ? "default" : "ghost"}
                  className={`text-xs h-8 px-4 rounded-md transition-all active:scale-[0.97] ${
                    useManual 
                      ? "bg-violet-600 hover:bg-violet-550 text-white font-semibold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="size-3.5 mr-1.5" />
                  Transkrip Manual
                </Button>
              </div>

              {/* YouTube URL input */}
              {!useManual ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">URL Video YouTube</label>
                  <div className="relative">
                    <Input 
                      placeholder="Tempel tautan video YouTube... (e.g. https://www.youtube.com/watch?v=...)" 
                      value={youtubeUrl} 
                      onChange={e => setYoutubeUrl(e.target.value)} 
                      className="bg-muted border border-border/80 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 text-sm h-11 pl-10 text-foreground transition-all rounded-xl"
                    />
                    <Play className="absolute left-3.5 top-3.5 size-4 text-muted-foreground/80 fill-current" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">Transkrip Video</label>
                  <Textarea 
                    placeholder="Salin dan tempel transkrip percakapan video di sini..." 
                    value={manualTranscript} 
                    onChange={e => setManualTranscript(e.target.value)} 
                    className="bg-muted border-border text-sm h-48 max-h-60 overflow-y-auto text-foreground font-sans leading-relaxed resize-y"
                  />
                </div>
              )}

              {/* Extra Notes */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Catatan Khusus Ke AI (Opsional)</span>
                  <span className="text-[10px] text-muted-foreground/80 lowercase">mengarahkan gaya bahasa/topik</span>
                </label>
                <Textarea 
                  placeholder="e.g. 'Fokuskan pada aspek stoikisme praktis', 'Gunakan pembawaan santai namun mendalam', dll." 
                  value={extraNotes} 
                  onChange={e => setExtraNotes(e.target.value)} 
                  className="bg-muted border-border text-xs h-20 max-h-32 overflow-y-auto text-foreground resize-y"
                />
              </div>

              {/* YouTube Keyword Suggestions */}
              <div className="space-y-2 pt-1 border-t border-border">
                <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5">
                  <SearchIcon className="size-3 text-red-400" />
                  <span>Riset Kata Kunci YouTube (Opsional)</span>
                </label>
                <p className="text-[10px] text-muted-foreground/70 -mt-1">
                  Cari kata kunci populer yang sedang dicari di YouTube — hasilnya akan dikirim sebagai referensi SEO ke AI.
                </p>
                <div className="relative">
                  <Input
                    placeholder="Ketik topik, misal: cara mengatasi cemas..."
                    value={keywordQuery}
                    onChange={(e) => setKeywordQuery(e.target.value)}
                    className="bg-muted border-border text-xs h-9 pl-9 text-foreground"
                  />
                  <SearchIcon className="absolute left-3 top-2.5 size-3.5 text-muted-foreground/60" />
                  {keywordLoading && (
                    <Loader2 className="absolute right-3 top-2.5 size-3.5 animate-spin text-muted-foreground/60" />
                  )}
                </div>

                {/* Suggestion Results */}
                {keywordSuggestions.length > 0 && (
                  <div className="bg-muted/50 border border-border rounded-lg p-2.5 space-y-1.5 max-h-48 overflow-y-auto">
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-bold block">
                      Saran dari YouTube ({keywordSuggestions.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {keywordSuggestions.map((kw, i) => (
                        <button
                          key={i}
                          onClick={() => toggleKeyword(kw)}
                          className={`text-[10px] px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                            selectedKeywords.includes(kw)
                              ? "bg-violet-600/20 border-violet-500/40 text-violet-300 font-bold"
                              : "bg-muted border-border text-muted-foreground hover:border-violet-500/30 hover:text-foreground"
                          }`}
                        >
                          {selectedKeywords.includes(kw) ? "✓ " : "+ "}{kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Keywords */}
                {selectedKeywords.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">
                        Keyword Terpilih ({selectedKeywords.length})
                      </span>
                      <button
                        onClick={() => setSelectedKeywords([])}
                        className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        Hapus Semua
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedKeywords.map((kw, i) => (
                        <span
                          key={i}
                          onClick={() => toggleKeyword(kw)}
                          className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-md font-semibold cursor-pointer hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all"
                        >
                          {kw} ✕
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleRunAnalysis}
                disabled={loading}
                className="relative w-full h-12 rounded-xl font-bold text-sm tracking-widest uppercase overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ isolation: 'isolate' }}
              >
                {/* Gradient background */}
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] transition-all duration-500 group-hover:bg-[position:right_center] group-hover:from-violet-500 group-hover:via-indigo-500 group-hover:to-violet-500" />
                {/* Shimmer sweep */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
                {/* Glow */}
                <span className="absolute inset-0 rounded-xl shadow-[0_0_24px_4px_rgba(124,58,237,0.35)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Content */}
                <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                  {loading ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      <span>{loadingStep || "Menganalisis..."}</span>
                    </>
                  ) : (
                    <>
                      <Play className="size-4 fill-current" />
                      JALANKAN ANALISIS ENGINE
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <Card className="bg-card text-card-foreground border-border p-8 shadow-xl flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                <Brain className="absolute inset-0 m-auto size-6 text-violet-400 animate-pulse" />
              </div>
              <h3 className="text-base font-bold mb-2 animate-pulse text-foreground">AI Sedang Bekerja Keras</h3>
              <p className="text-xs text-muted-foreground text-center max-w-sm mb-6 leading-relaxed">
                Proses pipeline 5-modul membutuhkan waktu sekitar 30 - 90 detik karena model AI sedang menyusun paket konten video baru yang komprehensif.
              </p>
              
              {/* Simulated visual feedback step */}
              <div className="w-full max-w-xs space-y-3.5 bg-muted p-4 border border-border rounded-xl">
                <div className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider mb-1">Status Prosedur</div>
                <div className="flex items-center gap-2.5 text-xs text-violet-400 font-medium">
                  <div className="h-4 w-4 bg-violet-600/20 border border-violet-500/40 rounded-full flex items-center justify-center shrink-0">
                    <div className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-ping" />
                  </div>
                  <span>{loadingStep}</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="h-1 bg-card rounded-full overflow-hidden">
                    <div className="h-full bg-violet-600 animate-infinite-loading rounded-full" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Error Alert Box */}
          {error && (
            <Card className="bg-rose-950/20 border-rose-900/40 border p-6 shadow-xl flex items-start gap-4">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <AlertTriangle className="size-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-rose-400">Analisis Gagal Dilakukan</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">{error}</p>
                <div className="pt-2 flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setError(null); handleRunAnalysis(); }}
                    className="border-rose-900/30 text-[11px] text-foreground/90 hover:bg-rose-950/40 hover:text-white"
                  >
                    <RotateCcw className="size-3 mr-1.5" /> Coba Lagi
                  </Button>
                </div>
              </div>
            </Card>
          )}
          {/* Result Showcase */}
          {result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {/* Video Title Header card */}
              <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
                {/* Accent glow line at top */}
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-emerald-500 font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                        HASIL ANALISIS SYSTEM
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-violet-400 font-mono font-bold bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-md">
                        {outputType === "shorts" ? "🎬 YouTube Shorts" : "🎥 Video Panjang"}
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-indigo-400 font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                        {DEFAULT_CHANNELS.find(c => c.id === channelDna)?.name || channelDna}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight leading-tight">
                      {result.video_title}
                    </h2>
                  </div>
                  
                  {result.duration_warnings && result.duration_warnings.length > 0 && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {result.duration_warnings.map((w: string, i: number) => (
                        <span key={i} className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold font-mono">
                          <AlertTriangle className="size-3.5 shrink-0 text-amber-500" /> {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Main Tabs result container */}
              <Tabs defaultValue="ringkasan" className="space-y-6">
                <div className="flex justify-between items-center border-b border-border/40 pb-3">
                  <TabsList className="bg-muted border border-border/60 p-1 w-full md:w-auto h-auto grid grid-cols-3 gap-1 rounded-xl">
                    <TabsTrigger value="ringkasan" className="text-xs py-2 px-4 rounded-lg text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm font-bold transition-all">
                      🔍 Ringkasan Eksekutif
                    </TabsTrigger>
                    <TabsTrigger value="segmen" className="text-xs py-2 px-4 rounded-lg text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm font-bold transition-all">
                      ⚡ Detail Segmen &amp; Strategi
                    </TabsTrigger>
                    <TabsTrigger value="raw_json" className="text-xs py-2 px-4 rounded-lg text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm font-bold transition-all">
                      📄 JSON Metadata
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab: Summary */}
                <TabsContent value="ringkasan">
                  <div className="bg-card border border-border rounded-2xl p-6 hover:border-border/80 transition-all duration-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-foreground">Struktur Video &amp; Target Audiens</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Hasil reverse engineering modul kecerdasan konten AI.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Inti Pesan */}
                      <div className="p-4 rounded-xl bg-background/50 border border-border hover:border-border/80 transition-all space-y-2.5">
                        <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                          Inti Pesan Utama
                        </h4>
                        <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                          {result.result?.ringkasan?.inti_pesan || "Tidak tersedia."}
                        </p>
                      </div>

                      {/* Target Audiens */}
                      <div className="p-4 rounded-xl bg-background/50 border border-border hover:border-border/80 transition-all space-y-2.5">
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          Target Demografis &amp; Minat
                        </h4>
                        <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                          {result.result?.ringkasan?.target_audiens || "Tidak tersedia."}
                        </p>
                      </div>

                      {/* Hook Emosional */}
                      <div className="p-4 rounded-xl bg-background/50 border border-border hover:border-border/80 transition-all space-y-2.5">
                        <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          Hook Emosional &amp; Triger Psikologi
                        </h4>
                        <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                          {result.result?.ringkasan?.hook_emosional || "Tidak tersedia."}
                        </p>
                      </div>

                      {/* Pacing & Ritme */}
                      <div className="p-4 rounded-xl bg-background/50 border border-border hover:border-border/80 transition-all space-y-2.5">
                        <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Rekomendasi Pacing &amp; Ritme
                        </h4>
                        <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                          {result.result?.ringkasan?.pacing_dan_ritme || "Tidak tersedia."}
                        </p>
                      </div>
                      
                    </div>

                    {/* Rekomendasi Upload Terintegrasi */}
                    {channelDna === "suara_filsuf" && (
                      <div className="pt-6 border-t border-border/40 space-y-4">
                        <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                          📅 Jadwal &amp; Waktu Upload Terbaik <span className="text-[9px] text-violet-400/70 font-normal ml-1">({outputType === "shorts" ? "YouTube Shorts" : "Video Panjang"})</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="bg-background/50 rounded-xl p-4 border border-border space-y-2">
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold block">Hari Upload Optimal</span>
                            <div className="flex flex-wrap gap-2">
                              {outputType === "shorts" ? (
                                ["Senin", "Selasa", "Kamis"].map((hari, i) => (
                                  <span key={i} className="bg-violet-500/20 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-lg font-bold text-[11px]">{hari}</span>
                                ))
                              ) : (
                                (result.result?.video_panjang?.rekomendasi_upload?.hari_terbaik || ["Minggu", "Jumat", "Rabu"]).map((hari: string, i: number) => (
                                  <span key={i} className="bg-violet-500/20 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-lg font-bold text-[11px]">{hari}</span>
                                ))
                              )}
                            </div>
                          </div>
                          <div className="bg-background/50 rounded-xl p-4 border border-border space-y-1">
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold block">Rekomendasi Jam</span>
                            <span className="text-violet-300 font-extrabold text-2xl block">
                              {outputType === "shorts" ? "17:00 WIB" : (result.result?.video_panjang?.rekomendasi_upload?.jam_upload || "17:00 WIB")}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground/90 font-sans leading-relaxed">
                          💡 <strong>Alasan:</strong> {outputType === "shorts" 
                            ? "Berdasarkan pembagian jadwal optimal channel Suara Filsuf, hari biasa (Senin, Selasa, Kamis) dialokasikan untuk format Shorts guna mengisi traffic harian penonton. Waktu upload terbaik adalah tepat pukul 17:00 WIB untuk menangkap traffic penonton online yang mulai naik di grafik heatmap pada pukul 18:00 - 21:00 WIB."
                            : (result.result?.video_panjang?.rekomendasi_upload?.alasan || "Berdasarkan analisis performa, hari Minggu, Jumat, dan Rabu adalah 3 hari emas berkinerja terbaik dengan CTR stabil > 5%. Waktu upload paling optimal adalah tepat pukul 17:00 WIB.")
                          }
                        </p>
                        
                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5">
                          <span className="text-[10px] text-red-400 font-bold block mb-1">⚠️ Hindari Waktu Ini:</span>
                          <span className="text-xs text-muted-foreground/80 font-sans">
                            {outputType === "shorts"
                              ? "Hindari mengunggah di luar jam aktif utama (seperti pukul 23:00 - 12:00 WIB) karena traffic penonton harian berada di titik terendah."
                              : (result.result?.video_panjang?.rekomendasi_upload?.hindari || "Hindari upload pada hari Sabtu (retensi rendah) dan jam 23:00 - 12:00 WIB.")
                            }
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Display citations if web search was enabled */}
                    {result.web_sources && result.web_sources.length > 0 && (
                      <div className="pt-6 border-t border-border/40">
                        <h4 className="text-[10px] font-bold text-pink-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                          <Search className="size-3.5" /> Riset Pencarian Web Real-Time Claude
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.web_sources.map((s: any, idx: number) => (
                            <a 
                              key={idx} 
                              href={s.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[11px] bg-muted border border-border hover:border-border/80 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                            >
                              <span className="bg-card text-foreground/80 font-bold px-1.5 py-0.5 rounded text-[9px] border border-border/60">{idx + 1}</span>
                              <span className="truncate max-w-[220px] font-medium">{s.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab: Shots/Segments details */}
                <TabsContent value="segmen" className="space-y-6">
                  {outputType === "shorts" ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Shot selection sidebar on the left */}
                      <div className="md:col-span-4 space-y-2.5">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1 px-1">
                          📋 Daftar Segmen Terpilih ({result.result?.shots?.length || 0} Shots)
                        </div>
                        <div className="space-y-2">
                          {(result.result?.shots || []).map((shot: any, idx: number) => {
                            const isSelected = selectedShotIndex === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedShotIndex(idx)}
                                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                                  isSelected 
                                    ? "bg-violet-600/10 border-violet-500/50 text-foreground font-bold shadow-sm" 
                                    : "bg-card text-card-foreground border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                }`}
                              >
                                <div className="space-y-1.5 truncate">
                                  <div className="text-[9px] tracking-widest uppercase font-mono font-bold flex items-center gap-1.5">
                                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-violet-500' : 'bg-muted-foreground/40'}`} />
                                    <span>{shot.segmen?.start_time || "00:00"} - {shot.segmen?.end_time || "00:00"}</span>
                                  </div>
                                  <div className="text-xs font-semibold truncate leading-tight">
                                    {shot.judul?.best_choice || `Shot #${idx + 1}`}
                                  </div>
                                </div>
                                <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors ${isSelected ? 'bg-violet-600/20 border-violet-500/30 text-violet-400' : 'bg-muted border-border text-muted-foreground'}`}>
                                  {idx + 1}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Detailed Shot view on the right */}
                      <div className="md:col-span-8">
                        {result.result?.shots && result.result?.shots[selectedShotIndex] && (
                          <div className="space-y-6">
                            
                            {/* Shot Header Card */}
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                                <div className="flex items-center gap-2 text-violet-400 text-[10px] font-bold uppercase tracking-widest">
                                  <Flame className="size-4 text-violet-400 animate-pulse" />
                                  <span>Shot {selectedShotIndex + 1} dari {result.result?.shots.length}</span>
                                </div>
                                <span className="text-[10px] font-mono bg-muted border border-border px-2.5 py-1 rounded-md text-foreground font-semibold">
                                  ⏱️ {result.result?.shots[selectedShotIndex].segmen?.start_time} - {result.result?.shots[selectedShotIndex].segmen?.end_time} ({result.result?.shots[selectedShotIndex].segmen?.durasi})
                                </span>
                              </div>
                              
                              <div className="space-y-2">
                                <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase">Judul Rekomendasi Utama</span>
                                <h3 className="text-lg font-extrabold text-foreground leading-snug">
                                  "{result.result?.shots[selectedShotIndex].judul?.best_choice || `Shot #${selectedShotIndex + 1}`}"
                                </h3>
                              </div>

                              <div className="bg-muted/30 p-4 border border-border rounded-xl text-xs space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Big Idea</span>
                                    <div className="font-semibold text-foreground leading-relaxed">
                                      {result.result?.shots[selectedShotIndex].strategi_konten?.big_idea}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Hook Pembuka</span>
                                    <div className="font-bold text-foreground leading-relaxed text-indigo-400">
                                      "{result.result?.shots[selectedShotIndex].strategi_konten?.hook_baru}"
                                    </div>
                                  </div>
                                </div>

                               {/* Alternatif Hook Rekomendasi untuk Shorts */}
                               {Array.isArray(result.result?.shots[selectedShotIndex].strategi_konten?.alternatif_hook) && result.result?.shots[selectedShotIndex].strategi_konten?.alternatif_hook.length > 0 && (
                                 <div className="space-y-2 border-t border-border/40 pt-4 mt-2">
                                   <span className="text-[10px] text-indigo-400 font-bold block flex items-center gap-1">
                                     💡 Pilihan Hook Alternatif (Meningkatkan Virality):
                                   </span>
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                     {result.result.shots[selectedShotIndex].strategi_konten.alternatif_hook.map((hook: any, hIdx: number) => (
                                       <div key={hIdx} className="bg-background/40 p-3 border border-indigo-500/15 rounded-xl space-y-1 text-xs">
                                         <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase inline-block w-fit">{hook.tipe}</span>
                                         <p className="text-foreground/90 font-medium italic mt-1">"{hook.teks}"</p>
                                         {hook.alasan && (
                                           <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">{hook.alasan}</p>
                                         )}
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               )}
                              </div>
                              
                              {result.result?.shots[selectedShotIndex].segmen?.alasan && (
                                <div className="bg-violet-500/5 p-3 rounded-lg border border-violet-500/10 text-xs">
                                  <span className="font-bold text-violet-400 text-[10px] uppercase tracking-wider block mb-1">Analisis Pilihan Segmen:</span>
                                  <p className="text-muted-foreground leading-relaxed font-sans italic">
                                    {result.result?.shots[selectedShotIndex].segmen?.alasan}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Accordion detail folders */}
                            <Accordion defaultValue={["titles", "thumbnail"]} className="w-full space-y-4">
                              
                              {/* Title Ideas Accordion */}
                              <AccordionItem value="titles" className="bg-card border border-border rounded-2xl overflow-hidden px-5 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-4">
                                  <div className="flex items-center gap-2.5">
                                    <User className="size-4 text-sky-400" />
                                    <span>Alternatif Judul (SEO &amp; High CTR)</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 pt-2 space-y-3">
                                  {(() => {
                                    const judulObj = result.result?.shots[selectedShotIndex].judul || {};
                                    const opsi = judulObj.opsi || [];
                                    const bestChoice = judulObj.best_choice || "";
                                    return opsi.map((t: string, i: number) => {
                                      const isBest = t === bestChoice;
                                      return (
                                        <div key={i} className={`bg-background/80 p-4 rounded-xl border flex items-center justify-between gap-4 ${isBest ? "border-emerald-500/50 bg-emerald-500/5" : "border-border"}`}>
                                          <div className="space-y-1.5">
                                            <div className="text-xs font-bold text-foreground leading-relaxed">"{t}"</div>
                                            {isBest && (
                                              <span className="inline-flex bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">
                                                ★ Best Choice
                                              </span>
                                            )}
                                          </div>
                                          <Button 
                                            onClick={() => copyToClipboard(t)} 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-8 w-8 hover:bg-muted border-border shrink-0 text-muted-foreground hover:text-foreground"
                                            title="Salin judul"
                                          >
                                            <Copy className="size-3.5" />
                                          </Button>
                                        </div>
                                      );
                                    });
                                  })()}
                                </AccordionContent>
                              </AccordionItem>
  
                              {/* Thumbnail Concept Accordion */}
                              <AccordionItem value="thumbnail" className="bg-card border border-border rounded-2xl overflow-hidden px-5 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-4">
                                  <div className="flex items-center gap-2.5">
                                    <ImageIcon className="size-4 text-emerald-400" />
                                    <span>Konsep Thumbnail Visual</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 pt-2 space-y-5">
                                  {(() => {
                                    const thumb = result.result?.shots[selectedShotIndex].thumbnail || {};
                                    return (
                                      <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="p-4 rounded-xl bg-background/50 border border-border space-y-2">
                                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold block">Konsep Visual Utama</span>
                                            <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                                              {thumb.konsep || "-"}
                                            </p>
                                          </div>
                                          <div className="p-4 rounded-xl bg-background/50 border border-border space-y-2">
                                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold block">Teks Overlay (Kata Pemicu CTR)</span>
                                            <div className="bg-muted p-4 border border-border/80 rounded-lg text-center flex items-center justify-center min-h-[60px]">
                                              <span className="text-base font-extrabold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 font-sans">
                                                {thumb.teks_thumbnail || "(Tidak ada teks)"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="p-4 rounded-xl bg-background/50 border border-border space-y-1.5">
                                          <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold block">Komposisi &amp; Layout Visual</span>
                                          <p className="text-xs text-foreground/90 font-sans leading-relaxed">
                                            {thumb.komposisi || "-"}
                                          </p>
                                        </div>

                                        {thumb.warna && thumb.warna.length > 0 && (
                                          <div className="p-4 rounded-xl bg-background/50 border border-border space-y-3">
                                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold block">Palet Warna &amp; Psikologi</span>
                                            <div className="flex flex-wrap gap-2">
                                              {thumb.warna.map((w: string, idx: number) => (
                                                <span key={idx} className="bg-muted border border-border text-foreground px-2.5 py-1 rounded-md text-[10px] font-bold font-mono">
                                                  🎨 {w}
                                                </span>
                                              ))}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">{thumb.psikologi_warna}</p>
                                          </div>
                                        )}

                                        {thumb.prompt_ai_image && (
                                          <div className="space-y-2.5 pt-3 border-t border-border/40">
                                            <div className="flex justify-between items-center">
                                              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Prompt AI Image (Salin ke Gemini/Imagen)</span>
                                              <Button 
                                                onClick={() => copyToClipboard(thumb.prompt_ai_image)} 
                                                variant="outline" 
                                                size="xs" 
                                                className="h-6 text-[10px] text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                              >
                                                <Copy className="size-3 mr-1" /> Salin Prompt
                                              </Button>
                                            </div>
                                            <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 text-xs text-foreground/95 font-mono leading-relaxed select-text">
                                              {thumb.prompt_ai_image}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground italic leading-normal block">
                                              💡 Tips: Salin prompt bahasa Inggris di atas, kirim ke Google Gemini untuk membuat visual thumbnail super realistis.
                                            </span>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </AccordionContent>
                              </AccordionItem>
  
                              {/* Description & Tags Accordion */}
                              <AccordionItem value="description" className="bg-card border border-border rounded-2xl overflow-hidden px-5 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-4">
                                  <div className="flex items-center gap-2.5">
                                    <FileText className="size-4 text-violet-400" />
                                    <span>Deskripsi &amp; Metadata SEO</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 pt-2 space-y-4">
                                  {(() => {
                                    const shot = result.result?.shots[selectedShotIndex] || {};
                                    const desc = shot.deskripsi_youtube || "-";
                                    const tags = shot.seo?.tags || [];
                                    const keywords = shot.seo?.keyword_utama || [];
                                    const keywordsTurunan = shot.seo?.keyword_turunan || [];
                                    return (
                                      <>
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Naskah Deskripsi Video</span>
                                            <Button 
                                              onClick={() => copyToClipboard(desc)} 
                                              variant="outline" 
                                              size="xs" 
                                              className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                                            >
                                              <Copy className="size-3 mr-1" /> Salin Deskripsi
                                            </Button>
                                          </div>
                                          <div className="bg-background/80 p-4 rounded-xl border border-border text-xs text-foreground/90 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                                            {desc}
                                          </div>
                                        </div>

                                        {keywords.length > 0 && (
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Kata Kunci Utama</span>
                                              <button
                                                onClick={() => { navigator.clipboard.writeText(keywords.join(', ')); }}
                                                className="text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-1 font-semibold"
                                              >
                                                <Copy className="size-3" /> Salin Semua
                                              </button>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                              {keywords.map((kw: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-md font-bold font-mono">
                                                  🔑 {kw}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {keywordsTurunan.length > 0 && (
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Kata Kunci Turunan</span>
                                              <button
                                                onClick={() => { navigator.clipboard.writeText(keywordsTurunan.join(', ')); }}
                                                className="text-[10px] text-sky-500 hover:text-sky-400 flex items-center gap-1 font-semibold"
                                              >
                                                <Copy className="size-3" /> Salin Semua
                                              </button>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                              {keywordsTurunan.map((kw: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2.5 py-1 rounded-md font-mono">
                                                  🔑 {kw}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {tags.length > 0 && (
                                          <div className="space-y-2">
                                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold block">Tag Kata Kunci SEO</span>
                                            <div className="flex flex-wrap gap-1.5">
                                              {tags.map((t: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-muted border border-border text-muted-foreground px-2.5 py-1 rounded-md font-bold font-mono">
                                                  #{t}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </AccordionContent>
                              </AccordionItem>
  
                              {/* Editing Recommendations Accordion */}
                              <AccordionItem value="editing" className="bg-card border border-border rounded-2xl overflow-hidden px-5 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-4">
                                  <div className="flex items-center gap-2.5">
                                    <Scissors className="size-4 text-amber-400" />
                                    <span>Instruksi Editing (Visual &amp; Audio)</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 pt-2 space-y-4">
                                  {(() => {
                                    const recommendations = result.result?.shots[selectedShotIndex].editing?.rekomendasi || [];
                                    return (
                                      <div className="space-y-2.5">
                                        {recommendations.length > 0 ? (
                                          recommendations.map((rec: string, i: number) => (
                                            <div key={i} className="flex items-start gap-3 text-xs text-foreground/90 leading-relaxed p-3 bg-background/50 border border-border rounded-xl">
                                              <span className="h-5 w-5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                                                {i + 1}
                                              </span>
                                              <p className="font-sans font-medium">{rec}</p>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-xs text-muted-foreground">-</p>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </AccordionContent>
                              </AccordionItem>
  
                              {/* Beat Timeline / Outline Accordion */}
                              <AccordionItem value="outline" className="bg-card border border-border rounded-2xl overflow-hidden px-5 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-4">
                                  <div className="flex items-center gap-2.5">
                                    <Clock className="size-4 text-indigo-400" />
                                    <span>Outline &amp; Beat Timeline</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 pt-2 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-b border-border/40 pb-4 mb-2">
                                    <div className="space-y-1">
                                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Big Idea</span>
                                      <p className="text-foreground/95 font-sans leading-relaxed">{result.result?.shots[selectedShotIndex].strategi_konten?.big_idea}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Unique Angle</span>
                                      <p className="text-foreground/95 font-sans leading-relaxed">{result.result?.shots[selectedShotIndex].strategi_konten?.unique_angle}</p>
                                    </div>
                                  </div>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold block mb-1">Beat Timeline:</span>
                                  <div className="space-y-2.5">
                                    {(result.result?.shots[selectedShotIndex].strategi_konten?.outline || []).map((beat: any, i: number) => (
                                      <div key={i} className="bg-background/80 p-3.5 rounded-xl border border-border flex items-start gap-3">
                                        <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                                          #{i+1}
                                        </span>
                                        <div className="text-xs leading-relaxed font-sans font-medium">
                                          <strong className="text-foreground font-bold block mb-0.5">{beat.babak}</strong>
                                          <p className="text-muted-foreground">{beat.isi}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {result.result?.shots[selectedShotIndex].strategi_konten?.cta && (
                                    <div className="bg-rose-500/5 border border-rose-500/15 p-4 rounded-xl text-xs leading-relaxed mt-4 space-y-1">
                                      <span className="text-rose-400 font-bold uppercase tracking-widest text-[9px] block">Call To Action (CTA):</span>
                                      <p className="font-sans font-bold text-foreground">"{result.result?.shots[selectedShotIndex].strategi_konten?.cta}"</p>
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
 
                              {/* Performance & Checklists */}
                              <AccordionItem value="checklist" className="bg-card border border-border rounded-2xl overflow-hidden px-5 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-4">
                                  <div className="flex items-center gap-2.5">
                                    <CheckSquare className="size-4 text-emerald-400" />
                                    <span>Checklist Produksi &amp; Prediksi Performa</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 pt-2 space-y-6">
                                  
                                  {/* Performance cards */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-background/80 p-4 border border-border rounded-xl space-y-1 text-center">
                                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Estimasi CTR</span>
                                      <div className="text-base font-extrabold text-emerald-400">{result.result?.shots[selectedShotIndex].prediksi_performa?.ctr_estimate}</div>
                                    </div>
                                    <div className="bg-background/80 p-4 border border-border rounded-xl space-y-1 text-center">
                                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Target Retensi</span>
                                      <div className="text-xs text-foreground font-semibold leading-normal">{result.result?.shots[selectedShotIndex].prediksi_performa?.retention_prediction}</div>
                                    </div>
                                    <div className="bg-background/80 p-4 border border-border rounded-xl space-y-1 text-center">
                                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Potensi Viral</span>
                                      <div className="text-base font-extrabold text-indigo-400">{result.result?.shots[selectedShotIndex].prediksi_performa?.viral_potential}</div>
                                    </div>
                                  </div>
 
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
                                    {/* Production checklist */}
                                    <div className="space-y-3">
                                      <h4 className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">🛠️ Langkah Produksi</h4>
                                      <div className="space-y-2.5">
                                        {(result.result?.shots[selectedShotIndex].checklist?.produksi || []).map((item: string, i: number) => (
                                          <div key={i} className="flex items-start gap-2.5 text-xs bg-background/50 border border-border p-2.5 rounded-lg">
                                            <input type="checkbox" id={`chk-prod-${i}`} className="mt-0.5 accent-violet-600 rounded cursor-pointer size-3.5 border-border" />
                                            <label htmlFor={`chk-prod-${i}`} className="text-foreground/90 leading-normal font-sans cursor-pointer font-medium">{item}</label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
 
                                    {/* Upload/Publish checklist */}
                                    <div className="space-y-3">
                                      <h4 className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">📤 Langkah Upload &amp; SEO</h4>
                                      <div className="space-y-2.5">
                                        {(result.result?.shots[selectedShotIndex].checklist?.publikasi || []).map((item: string, i: number) => (
                                          <div key={i} className="flex items-start gap-2.5 text-xs bg-background/50 border border-border p-2.5 rounded-lg">
                                            <input type="checkbox" id={`chk-pub-${i}`} className="mt-0.5 accent-violet-600 rounded cursor-pointer size-3.5 border-border" />
                                            <label htmlFor={`chk-pub-${i}`} className="text-foreground/90 leading-normal font-sans cursor-pointer font-medium">{item}</label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Renders for Video Panjang */
                    <div className="space-y-6">
                      {result.result?.video_panjang && (
                        <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
                          
                          {/* Title block */}
                          <div className="space-y-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-violet-400 font-bold uppercase tracking-widest bg-violet-500/10 border border-violet-500/25 px-2.5 py-1 rounded-md">
                                Konsep Utama Video Panjang
                              </span>
                              <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                                Target CTR &gt; 10%
                              </span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight leading-tight">
                              "{result.result?.video_panjang?.judul?.best_choice || "Judul Rekomendasi"}"
                            </h3>
                            {result.result?.video_panjang?.judul?.alasan_best_choice && (
                              <p className="text-xs text-muted-foreground leading-relaxed italic font-sans bg-muted/40 p-3 rounded-lg border border-border/30">
                                💡 <strong>Analisis Judul:</strong> {result.result?.video_panjang?.judul?.alasan_best_choice}
                              </p>
                            )}
                            {result.result?.video_panjang?.judul?.opsi && result.result?.video_panjang?.judul?.opsi.length > 0 && (
                              <div className="pt-2.5">
                                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mb-2">Alternatif Judul CTR Tinggi:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {result.result?.video_panjang?.judul?.opsi.map((op: string, idx: number) => (
                                    <div key={idx} className="bg-background/80 p-3 border border-border rounded-xl flex items-center justify-between gap-3">
                                      <span className="text-xs font-semibold text-foreground/90">"{op}"</span>
                                      <Button 
                                        onClick={() => copyToClipboard(op)}
                                        variant="outline" 
                                        size="icon" 
                                        className="h-7 w-7 shrink-0 hover:bg-muted border-border"
                                        title="Salin judul"
                                      >
                                        <Copy className="size-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
 
                          <Separator className="bg-border/60" />
 
                          {/* Hook Terkuat & Opening 60 Detik */}
                          <div className="space-y-4 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-6 border border-violet-500/20 rounded-2xl">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-violet-500/20 pb-3.5 mb-2">
                              <div>
                                <h4 className="text-sm font-bold text-violet-300 flex items-center gap-2">
                                  <Flame className="size-5 text-violet-400 animate-pulse" /> Hook &amp; Opening Terkuat (60 Detik Pertama)
                                </h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Dirancang khusus untuk menahan retensi penonton dari detik ke-0.</p>
                              </div>
                              <span className="text-[9px] font-bold text-violet-400 bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                                RETENSI CRITICAL ZONE
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div className="bg-background/60 p-3.5 border border-violet-500/20 rounded-xl space-y-1">
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Big Idea</span>
                                <p className="text-foreground/95 font-sans leading-relaxed font-semibold">{result.result?.video_panjang?.strategi_konten?.big_idea}</p>
                              </div>
                              <div className="bg-background/60 p-3.5 border border-violet-500/20 rounded-xl space-y-1">
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Unique Angle</span>
                                <p className="text-foreground/95 font-sans leading-relaxed font-semibold">{result.result?.video_panjang?.strategi_konten?.unique_angle}</p>
                              </div>
                              <div className="bg-background/60 p-3.5 border border-violet-500/20 rounded-xl space-y-1">
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Hook Pembuka Baru</span>
                                <p className="text-violet-300 font-sans leading-relaxed font-bold">"{result.result?.video_panjang?.strategi_konten?.hook_baru}"</p>
                              </div>
                            </div>

                            {/* Alternatif Hook Rekomendasi untuk Video Panjang */}
                            {Array.isArray(result.result?.video_panjang?.strategi_konten?.alternatif_hook) && result.result?.video_panjang?.strategi_konten?.alternatif_hook.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-violet-500/20 space-y-2">
                                <span className="text-xs text-indigo-300 font-bold block flex items-center gap-1">
                                  💡 Pilihan Hook Alternatif untuk Meningkatkan Virality
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {result.result.video_panjang.strategi_konten.alternatif_hook.map((hook: any, hIdx: number) => (
                                    <div key={hIdx} className="bg-background/40 p-3.5 border border-indigo-500/15 rounded-xl space-y-1.5 text-xs">
                                      <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase inline-block w-fit">{hook.tipe}</span>
                                      <p className="text-foreground/90 font-medium italic mt-1">"{hook.teks}"</p>
                                      {hook.alasan && (
                                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">{hook.alasan}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

 
                            {/* Opening 60 Detik Segment Outline */}
                            {result.result?.video_panjang?.strategi_konten?.opening_60_detik && (
                              <div className="mt-4 pt-4 border-t border-violet-500/20 space-y-3">
                                <span className="text-xs text-violet-300 font-bold block">⏱️ Naskah &amp; Instruksi Visual 60 Detik Pertama</span>
                                <div className="space-y-3">
                                  {(result.result?.video_panjang?.strategi_konten?.opening_60_detik?.klip || []).map((klip: any, idx: number) => (
                                    <div key={idx} className="bg-background/80 p-4 rounded-xl border border-violet-500/20 space-y-2">
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="font-bold text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded">Detik {klip.video_baru_start} - {klip.video_baru_end}</span>
                                        <span className="text-muted-foreground/80 font-mono">Sumber Referensi: {klip.sumber_start} - {klip.sumber_end}</span>
                                      </div>
                                      <p className="text-xs leading-relaxed italic text-foreground/95 font-sans bg-muted/30 p-2.5 rounded border border-border/40">
                                        "{klip.narasi_sumber}"
                                      </p>
                                      {klip.catatan_editing && (
                                        <div className="text-[11px] text-indigo-300 font-semibold bg-indigo-500/5 p-2 rounded border border-indigo-500/10 flex items-start gap-1">
                                          <span className="shrink-0 mt-0.5">🎬</span>
                                          <span><strong>Visual/Editing:</strong> {klip.catatan_editing}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {result.result?.video_panjang?.strategi_konten?.opening_60_detik?.alasan && (
                                  <div className="bg-violet-500/5 p-3 rounded-lg border border-violet-500/15 text-xs">
                                    <span className="text-[9px] text-violet-400 font-bold block mb-1">Pola Psikologis Hook:</span>
                                    <p className="text-muted-foreground font-sans leading-relaxed italic">{result.result?.video_panjang?.strategi_konten?.opening_60_detik?.alasan}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
 
                          {/* Detailed Outline Chapter Timeline */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                              <Compass className="size-5 text-indigo-400" /> Babak Outline &amp; Chapter Timeline (Urutan Pembahasan)
                            </h4>
                            <div className="space-y-3">
                              {(result.result?.video_panjang?.strategi_konten?.outline || []).map((chapter: any, idx: number) => (
                                <div key={idx} className="bg-background border border-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-start gap-4 hover:border-border/80 transition-colors">
                                  <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                    {idx + 1}
                                  </div>
                                  <div className="space-y-2 w-full">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <h5 className="text-xs font-bold text-foreground">{chapter.babak}</h5>
                                      <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded text-indigo-400 border border-border">
                                        ⏱️ Estimasi: {chapter.start_estimate} - {chapter.end_estimate}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">{chapter.isi}</p>
                                    {chapter.sumber_segmen && chapter.sumber_segmen.map((src: any, srcIdx: number) => (
                                      <div key={srcIdx} className="text-[10px] text-emerald-400/90 font-medium bg-emerald-500/5 p-2 rounded border border-emerald-500/10 inline-flex items-center gap-1.5 mt-2">
                                        📹 <span>Ambil dari video referensi {src.start} - {src.end}</span>
                                        {src.catatan && <span className="text-muted-foreground/60">({src.catatan})</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
 
                          {/* CTA (Call To Action) */}
                          {result.result?.video_panjang?.strategi_konten?.cta && (() => {
                            const ctaObj = result.result.video_panjang.strategi_konten.cta;
                            return (
                              <div className="space-y-4">
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                  <Activity className="size-5 text-rose-400" /> Strategi Call To Action (Optimasi Konversi)
                                </h4>
                                
                                {typeof ctaObj === "string" ? (
                                  <div className="bg-rose-500/5 border border-rose-500/15 p-4 rounded-xl text-xs space-y-1.5">
                                    <span className="text-rose-400 font-bold uppercase tracking-widest text-[9px] block">Narasi CTA Utama</span>
                                    <p className="text-foreground leading-relaxed font-sans font-bold">"{ctaObj}"</p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {ctaObj.teks_video && (
                                      <div className="bg-rose-500/5 border border-rose-500/15 p-4 rounded-xl text-xs space-y-2">
                                        <span className="text-rose-400 font-bold uppercase tracking-widest text-[9px] block">Narasi Video</span>
                                        <p className="text-foreground font-semibold font-sans leading-relaxed">"{ctaObj.teks_video}"</p>
                                      </div>
                                    )}
                                    {ctaObj.komentar_pin && (
                                      <div className="bg-rose-500/5 border border-rose-500/15 p-4 rounded-xl text-xs space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-rose-400 font-bold uppercase tracking-widest text-[9px]">Draf Komentar Pin</span>
                                          <Button 
                                            onClick={() => copyToClipboard(ctaObj.komentar_pin)} 
                                            variant="outline" 
                                            size="xs" 
                                            className="h-5 text-[9px] text-rose-400 hover:bg-rose-500/10 border-rose-500/20"
                                          >
                                            <Copy className="size-3 mr-1" /> Salin Komentar
                                          </Button>
                                        </div>
                                        <p className="text-foreground font-semibold font-sans italic leading-relaxed">"{ctaObj.komentar_pin}"</p>
                                      </div>
                                    )}
                                    {ctaObj.postingan_komunitas && (ctaObj.postingan_komunitas.teks || ctaObj.postingan_komunitas.rekomendasi_gambar) && (
                                      <div className="col-span-1 md:col-span-2 bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 space-y-3">
                                        <span className="text-rose-400 font-bold uppercase tracking-widest text-[9px] block">Draf Postingan Komunitas (Untuk Promosi Silang)</span>
                                        {ctaObj.postingan_komunitas.teks && (
                                          <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                              <span className="text-[10px] text-muted-foreground/80">Teks Postingan:</span>
                                              <Button 
                                                onClick={() => copyToClipboard(ctaObj.postingan_komunitas.teks)} 
                                                variant="outline" 
                                                size="xs" 
                                                className="h-5 text-[9px] text-rose-400 hover:bg-rose-500/10 border-rose-500/25"
                                              >
                                                <Copy className="size-3 mr-1" /> Salin Postingan
                                              </Button>
                                            </div>
                                            <div className="bg-background/60 p-3 rounded-lg border border-border/80 text-foreground font-sans whitespace-pre-wrap leading-relaxed text-xs">
                                              {ctaObj.postingan_komunitas.teks}
                                            </div>
                                          </div>
                                        )}
                                        {ctaObj.postingan_komunitas.rekomendasi_gambar && (
                                          <div className="pt-2 border-t border-rose-500/15">
                                            <span className="text-[10px] text-muted-foreground/80 block mb-1">🖼️ Rekomendasi Gambar/Visual:</span>
                                            <p className="text-muted-foreground text-xs leading-relaxed italic">{ctaObj.postingan_komunitas.rekomendasi_gambar}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
 
                          <Separator className="bg-border/60" />
 
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Visual Thumbnail */}
                            <div className="space-y-4 bg-background border border-border p-5 rounded-2xl">
                              <h4 className="text-xs font-extrabold text-foreground flex items-center gap-2">
                                <ImageIcon className="size-4 text-emerald-400" /> Konsep Visual Thumbnail
                              </h4>
                              <div className="space-y-3.5 text-xs">
                                <div>
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Teks Overlay Pemicu CTR</span>
                                  <div className="text-sm font-extrabold text-emerald-400 uppercase mt-1">"{result.result?.video_panjang?.thumbnail?.teks_thumbnail}"</div>
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Visual Deskripsi Utama</span>
                                  <p className="text-foreground/90 leading-relaxed mt-1 font-sans font-medium">{result.result?.video_panjang?.thumbnail?.konsep}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Komposisi &amp; Fokus</span>
                                  <p className="text-foreground/90 leading-relaxed mt-1 font-sans font-medium">{result.result?.video_panjang?.thumbnail?.komposisi}</p>
                                </div>
                                {result.result?.video_panjang?.thumbnail?.prompt_ai_image && (
                                  <div className="space-y-2 pt-2 border-t border-border/40">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Prompt Imagen/Gemini</span>
                                      <Button 
                                        onClick={() => copyToClipboard(result.result?.video_panjang?.thumbnail?.prompt_ai_image)}
                                        variant="outline" 
                                        size="xs" 
                                        className="h-5 text-[9px] text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20"
                                      >
                                        <Copy className="size-3 mr-1" /> Salin Prompt
                                      </Button>
                                    </div>
                                    <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 text-xs font-mono select-text leading-relaxed">
                                      {result.result?.video_panjang?.thumbnail?.prompt_ai_image}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground italic leading-normal">
                                      💡 Kirim prompt ini ke AI Generator dengan instruksi "Rasio 16:9 untuk Thumbnail YouTube".
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
 
                            {/* Description & Tags */}
                            <div className="space-y-4 bg-background border border-border p-5 rounded-2xl">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-extrabold text-foreground flex items-center gap-2">
                                  <FileText className="size-4 text-sky-400" /> Deskripsi Siap Upload &amp; Tags
                                </h4>
                                <Button 
                                  onClick={() => copyToClipboard(result.result?.video_panjang?.deskripsi_youtube)}
                                  variant="outline" 
                                  size="xs" 
                                  className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                                >
                                  <Copy className="size-3 mr-1" /> Salin Deskripsi
                                </Button>
                              </div>
                              <div className="bg-muted/40 p-4 rounded-xl border border-border text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                {result.result?.video_panjang?.deskripsi_youtube}
                              </div>
                              
                              {(() => {
                                const keywords = result.result?.video_panjang?.seo?.keyword_utama || [];
                                if (keywords.length === 0) return null;
                                return (
                                  <div className="space-y-2 mt-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Kata Kunci Utama</span>
                                      <button
                                        onClick={() => { navigator.clipboard.writeText(keywords.join(', ')); }}
                                        className="text-[10px] text-amber-500 hover:text-amber-400 font-semibold"
                                      >
                                        Salin Semua
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {keywords.map((kw: string, i: number) => (
                                        <span key={i} className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-md font-mono font-bold">
                                          🔑 {kw}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
 
                              {(() => {
                                const kwTurunan = result.result?.video_panjang?.seo?.keyword_turunan || [];
                                if (kwTurunan.length === 0) return null;
                                return (
                                  <div className="space-y-2 mt-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Kata Kunci Turunan</span>
                                      <button
                                        onClick={() => { navigator.clipboard.writeText(kwTurunan.join(', ')); }}
                                        className="text-[10px] text-sky-500 hover:text-sky-400 font-semibold"
                                      >
                                        Salin Semua
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {kwTurunan.map((kw: string, i: number) => (
                                        <span key={i} className="text-[10px] bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2.5 py-1 rounded-md font-mono">
                                          🔑 {kw}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
 
                              <div className="space-y-2 mt-2">
                                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">SEO Tags</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {(result.result?.video_panjang?.seo?.tags || []).map((t: string, i: number) => (
                                    <span key={i} className="text-[10px] bg-muted border border-border text-muted-foreground px-2.5 py-1 rounded-md font-bold font-mono">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
 
                          <Separator className="bg-border/60" />
 
                          {/* Editing & Pacing */}
                          <div className="space-y-4 bg-background border border-border p-5 rounded-2xl">
                            <h4 className="text-xs font-extrabold text-foreground flex items-center gap-2">
                              <Scissors className="size-4 text-amber-400" /> Rekomendasi Editing Detail
                            </h4>
                            <div className="space-y-2.5 text-xs">
                              {(result.result?.video_panjang?.editing?.rekomendasi || []).map((rec: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 leading-relaxed text-foreground/90 font-sans p-3 bg-muted/30 border border-border rounded-xl">
                                  <span className="h-5 w-5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                                    {i+1}
                                  </span>
                                  <p className="font-medium">{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Rekomendasi Upload */}
                          {channelDna === "suara_filsuf" && result.result?.video_panjang?.rekomendasi_upload?.tersedia && (
                            <>
                              <Separator className="bg-border/60" />
                              <div className="space-y-4 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-5 border border-violet-500/20 rounded-2xl">
                                <h4 className="text-xs font-bold text-violet-300 flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                  📅 Jadwal &amp; Waktu Upload Terbaik <span className="text-[9px] text-violet-400/70 font-normal ml-1">(Database Suara Filsuf)</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                  <div className="bg-background/80 rounded-xl p-4 border border-violet-500/20 space-y-2">
                                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold block">Hari Upload Optimal</span>
                                    <div className="flex flex-wrap gap-2">
                                      {(result.result?.video_panjang?.rekomendasi_upload?.hari_terbaik || []).map((hari: string, i: number) => (
                                        <span key={i} className="bg-violet-500/20 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-lg font-bold text-[11px]">{hari}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="bg-background/80 rounded-xl p-4 border border-violet-500/20 space-y-1">
                                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold block">Rekomendasi Jam</span>
                                    <span className="text-violet-300 font-extrabold text-2xl block">{result.result?.video_panjang?.rekomendasi_upload?.jam_upload}</span>
                                  </div>
                                </div>
                                {result.result?.video_panjang?.rekomendasi_upload?.alasan && (
                                  <p className="text-xs text-muted-foreground/90 font-sans leading-relaxed">
                                    💡 <strong>Alasan:</strong> {result.result?.video_panjang?.rekomendasi_upload?.alasan}
                                  </p>
                                )}
                                {result.result?.video_panjang?.rekomendasi_upload?.hindari && (
                                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5">
                                    <span className="text-[10px] text-red-400 font-bold block mb-1">⚠️ Hindari Waktu Ini:</span>
                                    <span className="text-xs text-muted-foreground/80 font-sans">{result.result?.video_panjang?.rekomendasi_upload?.hindari}</span>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="raw_json">
                  <Card className="bg-card text-card-foreground border-border p-6 space-y-4">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Struktur JSON respons modul AI pipeline</span>
                      <Button 
                        onClick={() => copyToClipboard(result.raw_ai_text)} 
                        variant="outline" 
                        size="sm" 
                        className="border-border text-xs font-semibold text-foreground/90 hover:bg-muted"
                      >
                        <Copy className="size-3.5 mr-2" /> Salin JSON Mentah
                      </Button>
                    </div>
                    <div className="bg-muted p-4 border border-border rounded-xl max-h-[500px] overflow-y-auto font-mono text-[11px] text-foreground/90 leading-relaxed whitespace-pre-wrap select-text">
                      {result.raw_ai_text}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </section>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-border bg-[#111318]/40 py-6 mt-12 text-center text-xs text-muted-foreground/80 font-medium">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 AI-YouTube-Content-Intelligence Pro. Dikembangkan untuk Kreator Original YouTube Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}



