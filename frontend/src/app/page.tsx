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
  Search as SearchIcon
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
  { id: "suara_filsuf", name: "Suara Filsuf", emoji: "🧠 ", description: "Filosofi populer, reflektif, tenang, dan dalam." },
  { id: "nalar_senyap", name: "Nalar Senyap", emoji: "Œ¿", description: "Psikologi, healing, dan kontemplasi diri yang hangat." },
  { id: "tutur_kyai", name: "Tutur Kyai", emoji: "•Šï¸", description: "Hikmah Islami, akhlak, dan nilai spiritual yang santun." }
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

  const [ClapperboardUrl, setClapperboardUrl] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  
  // Proxy States
  const [proxyMode, setProxyMode] = useState("none");
  const [proxyHttpUrl, setProxyHttpUrl] = useState("");
  const [proxyHttpsUrl, setProxyHttpsUrl] = useState("");
  const [proxyWebshareUser, setProxyWebshareUser] = useState("");
  const [proxyWebsharePass] = useState("");
  
  // Skills States
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [webSearchMaxUses, setWebSearchMaxUses] = useState(5);
  const [enableThinking, setEnableThinking] = useState(false);
  const [thinkingBudget, setThinkingBudget] = useState(4000);
  const [enableCodeExecution, setEnableCodeExecution] = useState(false);
  
  // App Logic States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Selected Results States
  const [selectedShotIndex, setSelectedShotIndex] = useState(0);

  // Auth States
  const router = useRouter();
  const [authUser, setAuthUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

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

  // Auth check on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");
    if (!token) {
      router.replace("/login");
      return;
    }
    // Verify token
    fetch("https://suarafilsuf-suaraai-backend.hf.space/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("invalid");
        return r.json();
      })
      .then((data) => {
        setAuthUser(data);
        setAuthChecked(true);
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        router.replace("/login");
      });
  }, [router]);

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
          `https://suarafilsuf-suaraai-backend.hf.space/api/youtube-suggestions?q=${encodeURIComponent(keywordQuery.trim())}`
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
        const res = await fetch(`https://suarafilsuf-suaraai-backend.hf.space/api/channels/${channelDna}/analytics`);
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
      const res = await fetch(`https://suarafilsuf-suaraai-backend.hf.space/api/channels/${channelDna}/analytics`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAnalyticsExists(true);
        setAnalyticsSummary(data.summary);
        toast.success("âœ… Analytics berhasil disimpan!", { id: uploadToastId });
      } else {
        toast.error(`âŒ Gagal: ${data.detail || "Format tidak didukung"}`, { id: uploadToastId });
      }
    } catch (err) {
      toast.error("âŒ Gagal menghubungi backend API.", { id: uploadToastId });
    }
  };

  const handleDeleteAnalytics = async () => {
    try {
      const res = await fetch(`https://suarafilsuf-suaraai-backend.hf.space/api/channels/${channelDna}/analytics`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAnalyticsExists(false);
        setAnalyticsSummary(null);
        setAnalyticsFile(null);
        toast.success("—‘ï¸ Data analytics channel berhasil dihapus!");
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
        const res = await fetch("https://suarafilsuf-suaraai-backend.hf.space/api/settings");
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
      const res = await fetch("https://suarafilsuf-suaraai-backend.hf.space/api/test-connection", {
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
    if (!useManual && !ClapperboardUrl) {
      toast.warning("Silakan masukkan URL Clapperboard terlebih dahulu.");
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
      const res = await fetch("https://suarafilsuf-suaraai-backend.hf.space/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          Clapperboard_url: useManual ? null : ClapperboardUrl,
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
        toast.success("Analisis Video Berhasil diselesaikan!");
      } else if (res.status === 401) {
        toast.error("Sesi login expired. Silakan login ulang.");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        router.replace("/login");
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
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-600/10 border border-violet-500/20 rounded-xl text-violet-400">
              <Clapperboard className="size-6 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-violet-400 font-bold">AI Content Engine</div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span>Clapperboard</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Content Intelligence</span> Pro
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
          <Card className="bg-card text-card-foreground border-border backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground font-semibold">
                <Settings className="size-4 text-violet-400" />
                <span>Konfigurasi AI & Model</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pilih provider dan sesuaikan credentials Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">AI Provider</label>
                <Select value={provider} onValueChange={(v) => v && setProvider(v)}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground h-9 text-xs text-foreground font-semibold hover:bg-zinc-700/80 transition-colors">
                    <SelectValue placeholder="Pilih Provider">
                      {(() => {
                        const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
                        const p = providers.find((pr: any) => pr.id === provider);
                        return p ? p.label : provider;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-zinc-600/70 text-foreground font-semibold text-xs shadow-xl min-w-[260px]">
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
                    <SelectTrigger className="w-full bg-background border-border text-foreground h-9 text-xs text-foreground font-semibold hover:bg-zinc-700/80 transition-colors">
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
                    <SelectContent className="bg-card border-zinc-600/70 text-foreground font-semibold text-xs shadow-xl min-w-[240px]">
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
            </CardContent>
          </Card>

          {/* 🎭­ Target Channel & Analytics */}
          <Card className="bg-card text-card-foreground border-border backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <User className="size-4 text-amber-400" />
                <span>🎭 Target Channel &amp; Analytics</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pilih DNA channel dan unggah data analytics untuk konteks AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Channel Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">Target Channel</label>
                <Select value={channelDna} onValueChange={(v) => v && setChannelDna(v)}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground h-9 text-xs text-foreground font-semibold hover:bg-zinc-700/80 transition-colors">
                    <SelectValue placeholder="Pilih Channel">
                      {(() => {
                        const ch = DEFAULT_CHANNELS.find(c => c.id === channelDna);
                        return ch ? `${ch.emoji} ${ch.name}` : channelDna;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-zinc-600/70 text-foreground font-semibold text-xs shadow-2xl min-w-[240px]">
                    {DEFAULT_CHANNELS.map(ch => (
                      <SelectItem key={ch.id} value={ch.id} className="py-2">
                        <span className="flex items-center gap-2">
                          <span>{ch.emoji}</span>
                          <span>{ch.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Channel Description */}
                {(() => {
                  const ch = DEFAULT_CHANNELS.find(c => c.id === channelDna);
                  return ch ? (
                    <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/60 border border-border/40 rounded-lg px-3 py-2 mt-1">
                      {ch.emoji} <span className="font-semibold text-foreground/90">{ch.name}</span> — {ch.description}
                    </p>
                  ) : null;
                })()}
              </div>

              {/* Analytics CSV Upload */}
              <div className="space-y-2 pt-1 border-t border-border/30">
                <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="size-3 text-emerald-400" />
                  Analytics Channel
                </label>
                {analyticsExists ? (
                  <div className="space-y-2">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block mb-0.5 text-foreground">Analytics Aktif</strong>
                        Data performa real untuk channel ini sudah tersimpan dan otomatis digunakan.
                        {analyticsSummary && (
                          <div className="mt-2 pt-2 border-t border-emerald-500/30 text-[10px] space-y-1 text-muted-foreground">
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
                      className="border-rose-950 text-rose-400 hover:bg-rose-950/20 w-full h-8 text-[11px] font-medium transition-colors"
                    >
                      🗑️ Hapus data analytics channel ini
                    </Button>
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-600/60 rounded-xl p-4 bg-muted/40 hover:border-zinc-500/60 transition-colors">
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
            </CardContent>
          </Card>

          {/* Format Output & Durasi */}
          <Card className="bg-card text-card-foreground border-border backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground font-semibold">
                <Sliders className="size-4 text-indigo-400" />
                <span>Format Output</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Output Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">Format Output</label>
                <Select value={outputType} onValueChange={(v) => v && setOutputType(v)}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground h-9 text-xs text-foreground font-semibold hover:bg-zinc-700/80 transition-colors">
                    <SelectValue placeholder="Format Output">
                      {outputType === "shorts" ? "🎬 Shorts / Reels / TikTok" : "🎥 Video Panjang Clapperboard"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-zinc-600/70 text-foreground font-semibold text-xs shadow-2xl min-w-[240px]">
                    <SelectItem value="shorts" className="py-2">🎬 Shorts / Reels / TikTok</SelectItem>
                    <SelectItem value="video_panjang" className="py-2">🎥 Video Panjang Clapperboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration Target */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">Durasi Target</label>
                <Select value={duration} onValueChange={(v) => v && setDuration(v)}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground h-9 text-xs text-foreground font-semibold hover:bg-zinc-700/80 transition-colors">
                    <SelectValue placeholder="Durasi Target">
                      {(() => {
                        const d = DEFAULT_DURATIONS.find(x => x.id === duration);
                        return d ? d.label : duration;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-zinc-600/70 text-foreground font-semibold text-xs shadow-2xl min-w-[200px]">
                    {DEFAULT_DURATIONS.filter(d => d.type === (outputType === "shorts" ? "shorts" : "long")).map(d => (
                      <SelectItem key={d.id} value={d.id} className="py-2">{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Shot Count (Shorts Only) */}
              {outputType === "shorts" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider flex items-center justify-between">
                    <span>Jumlah Segmen / Shots</span>
                    <span className="text-xs text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">{shotCount} Shot</span>
                  </label>
                  <Select value={String(shotCount)} onValueChange={(v) => v && setShotCount(Number(v))}>
                    <SelectTrigger className="w-full bg-background border-border text-foreground h-9 text-xs text-foreground font-semibold hover:bg-zinc-700/80 transition-colors">
                      <SelectValue>
                        {shotCount} Shot
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-card border-zinc-600/70 text-foreground font-semibold text-xs shadow-2xl min-w-[200px]">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <SelectItem key={n} value={String(n)} className="py-2">{n} Shot{n > 1 ? " Rekomendasi" : " Rekomendasi"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Claude Beta Skills Expander */}
          {provider === "anthropic" && (
            <Card className="bg-card text-card-foreground border-border backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground font-semibold">
                  <Brain className="size-4 text-pink-400" />
                  <span>🧠  Skill Claude Tambahan</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Aktifkan kemampuan asinkron ekstra.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Web Search */}
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

                {/* Extended Thinking */}
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
                      <span>Extended Thinking</span>
                    </label>
                    <p className="text-[10px] text-muted-foreground/80 leading-normal">
                      Claude bernalar lebih lambat, mendalam, dan eksplisit (reasoning).
                    </p>
                  </div>
                </div>

                {enableThinking && (
                  <div className="space-y-2 pl-6 pb-2">
                    <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>Budget Token Berpikir</span>
                      <span className="text-pink-400">{thinkingBudget} Token</span>
                    </div>
                    <Slider 
                      min={1024} 
                      max={16000} 
                      step={1024} 
                      value={[thinkingBudget]} 
                      onValueChange={(v) => setThinkingBudget(typeof v === "number" ? v : (v as readonly number[])[0])}
                      className="[&_[role=slider]]:bg-pink-500 [&_[role=slider]]:border-pink-400"
                    />
                  </div>
                )}

                <Separator className="bg-card" />

                {/* Code Execution */}
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
              </CardContent>
            </Card>
          )}

          {/* Clapperboard Proxy Configuration */}
          <Card className="bg-card text-card-foreground border-border backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground font-semibold">
                <Compass className="size-4 text-emerald-400" />
                <span>Œ Proxy Clapperboard (Anti-Blocking)</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Mengurangi resiko rate-limit IP saat scraping transkrip.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Proxy Mode</label>
                <Select value={proxyMode} onValueChange={(v) => v && setProxyMode(v)}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground h-9 text-xs text-foreground font-semibold hover:bg-zinc-700/80 transition-colors">
                    <SelectValue placeholder="Pilih Proxy">
                      {proxyMode === "none" ? "Tidak pakai proxy" : proxyMode === "webshare" ? "Webshare Proxy" : "HTTP/HTTPS Proxy"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-zinc-600/70 text-foreground font-semibold text-xs shadow-xl min-w-[200px]">
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
                      className="bg-background border-border text-foreground text-foreground font-semibold text-xs h-9.5 focus:border-violet-500/60 transition-colors"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right Section (Main App Area) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Input Form */}
          <Card className="bg-card text-card-foreground border-border shadow-xl overflow-hidden relative border-t-2 border-t-violet-500/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground font-bold">
                <Sparkles className="size-5 text-violet-400" />
                <span>Analisis Strategi Konten Video Baru</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Masukkan URL video kompetitor/referensi untuk diekstraksi menjadi paket produksi orisinal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Selector Tab */}
              <div className="flex gap-2 p-1 bg-muted border-border rounded-lg w-fit">
                <Button 
                  onClick={() => setUseManual(false)} 
                  variant={!useManual ? "default" : "ghost"}
                  className={`text-xs h-8 px-4 rounded-md transition-all ${
                    !useManual 
                      ? "bg-violet-600 hover:bg-violet-700 text-white font-bold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Clapperboard className="size-3.5 mr-1.5" />
                  Clapperboard URL
                </Button>
                <Button 
                  onClick={() => setUseManual(true)} 
                  variant={useManual ? "default" : "ghost"}
                  className={`text-xs h-8 px-4 rounded-md transition-all ${
                    useManual 
                      ? "bg-violet-600 hover:bg-violet-700 text-white font-bold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="size-3.5 mr-1.5" />
                  Transkrip Manual
                </Button>
              </div>

              {/* Clapperboard URL input */}
              {!useManual ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-foreground/90 uppercase tracking-wider">URL Video Clapperboard</label>
                  <div className="relative">
                    <Input 
                      placeholder="Tempel tautan video Clapperboard... (e.g. https://www.Clapperboard.com/watch?v=...)" 
                      value={ClapperboardUrl} 
                      onChange={e => setClapperboardUrl(e.target.value)} 
                      className="bg-muted border-border text-sm h-11 pl-10 text-foreground"
                    />
                    <Clapperboard className="absolute left-3.5 top-3.5 size-4.5 text-muted-foreground/80" />
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
              <Button 
                onClick={handleRunAnalysis} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold h-12 shadow-lg hover:shadow-violet-600/10 transition-all text-sm rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    <span>{loadingStep || "Menganalisis..."}</span>
                  </>
                ) : (
                  <>
                    <Play className="size-4 mr-2 fill-white" />
                    JALANKAN ANALISIS ENGINE
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Loading Skeleton */}
          {loading && (
            <Card className="bg-card text-card-foreground border-border p-8 shadow-xl flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                <Brain className="absolute inset-0 m-auto size-6 text-violet-400 animate-pulse" />
              </div>
              <h3 className="text-base font-bold mb-2 animate-pulse text-foreground">AI Sedang Bekerja Keras</h3>
              <p className="text-xs text-muted-foreground text-center max-w-sm mb-6 leading-relaxed">
                Proses pipeline 5-modul membutuhkan waktu sekitar 30 - 90 detik karena model AI sedang menyusun paket konten Clapperboard yang komprehensif.
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
            <div className="space-y-6">
              
              {/* Video Title Header card */}
              <Card className="bg-card text-card-foreground border-border backdrop-blur-sm shadow-xl p-5 border-l-4 border-l-emerald-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      Hasil Analisis
                    </span>
                    <h2 className="text-lg font-bold text-foreground font-semibold flex items-center gap-2">
                      <Clapperboard className="size-5 text-rose-500 shrink-0" />
                      <span>{result.video_title}</span>
                    </h2>
                  </div>
                  {result.duration_warnings && result.duration_warnings.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {result.duration_warnings.map((w: string, i: number) => (
                        <span key={i} className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                          <AlertTriangle className="size-3 shrink-0" /> {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Main Tabs result container */}
              <Tabs defaultValue="ringkasan" className="space-y-6">
                <TabsList className="bg-muted border border-border/60 p-1 w-full md:w-auto h-auto grid grid-cols-3 gap-1 rounded-xl">
                  <TabsTrigger value="ringkasan" className="text-xs py-2 px-4 rounded-lg text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold transition-all">
                    🔍 Ringkasan AI
                  </TabsTrigger>
                  <TabsTrigger value="segmen" className="text-xs py-2 px-4 rounded-lg text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold transition-all">
                    🎭 Segmen & Shots
                  </TabsTrigger>
                  <TabsTrigger value="raw_json" className="text-xs py-2 px-4 rounded-lg text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold transition-all">
                    📄 JSON Mentah
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Summary */}
                <TabsContent value="ringkasan">
                  <Card className="bg-card text-card-foreground border-border">
                    <CardHeader className="pb-4 border-b border-border/60">
                      <CardTitle className="text-sm font-semibold text-foreground">Struktur Video & Target Audiens</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Hasil reverse engineering modul awal AI.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="size-3.5 text-violet-400" /> Inti Pesan
                          </h4>
                          <p className="text-sm text-foreground font-sans leading-relaxed">
                            {result.result?.ringkasan?.inti_pesan || "Tidak tersedia."}
                          </p>
                        </div>
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="size-3.5 text-violet-400" /> Target Audiens
                          </h4>
                          <p className="text-sm text-foreground font-sans leading-relaxed">
                            {result.result?.ringkasan?.target_audiens || "Tidak tersedia."}
                          </p>
                        </div>
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="size-3.5 text-violet-400" /> Hook Emosional
                          </h4>
                          <p className="text-sm text-foreground font-sans leading-relaxed">
                            {result.result?.ringkasan?.hook_emosional || "Tidak tersedia."}
                          </p>
                        </div>
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="size-3.5 text-violet-400" /> Pacing & Ritme
                          </h4>
                          <p className="text-sm text-foreground font-sans leading-relaxed">
                            {result.result?.ringkasan?.pacing_dan_ritme || "Tidak tersedia."}
                          </p>
                        </div>
                      </div>

                      {/* Display citations if web search was enabled */}
                      {result.web_sources && result.web_sources.length > 0 && (
                        <div className="pt-4 border-t border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                            <Search className="size-3.5 text-pink-400" /> Riset Pencarian Web Real-Time Claude
                          </h4>
                          <div className="flex flex-wrap gap-2.5">
                            {result.web_sources.map((s: any, idx: number) => (
                              <a 
                                key={idx} 
                                href={s.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[11px] bg-muted border border-border text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:border-border transition-all flex items-center gap-1.5"
                              >
                                <span className="bg-card text-foreground/90 font-bold px-1.5 py-0.5 rounded text-[9px]">{idx + 1}</span>
                                <span className="truncate max-w-[200px]">{s.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Shots/Segments details */}
                <TabsContent value="segmen" className="space-y-6">
                  {outputType === "shorts" ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Shot selection sidebar on the left */}
                      <div className="md:col-span-4 space-y-2">
                        <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold mb-2 px-1">Daftar Shots Terkuat</div>
                        {(result.result?.shots || []).map((shot: any, idx: number) => {
                          const isSelected = selectedShotIndex === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedShotIndex(idx)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                                isSelected 
                                  ? "bg-violet-600/10 border-violet-500/40 text-violet-300 font-bold" 
                                  : "bg-card text-card-foreground border-border/80 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                              }`}
                            >
                              <div className="space-y-1 truncate">
                                <div className="text-[10px] tracking-wider uppercase font-semibold flex items-center gap-1">
                                  <Clock className="size-3 text-muted-foreground" />
                                  <span>{shot.segmen?.start_time || "00:00"} - {shot.segmen?.end_time || "00:00"}</span>
                                </div>
                                <div className="text-xs truncate">{shot.judul?.best_choice || `Shot #${idx + 1}`}</div>
                              </div>
                              <span className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-foreground/90">
                                {idx + 1}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Detailed Shot view on the right */}
                      <div className="md:col-span-8">
                        {result.result?.shots && result.result?.shots[selectedShotIndex] && (
                          <div className="space-y-6">
                            
                            {/* Shot Header */}
                             <Card className="bg-card/50 border-border">
                               <CardContent className="p-6">
                                 <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                                   <Flame className="size-3.5" /> <span>Shot {selectedShotIndex + 1} dari {result.result?.shots.length}</span>
                                 </div>
                                 <h3 className="text-base font-bold text-foreground font-semibold">"{result.result?.shots[selectedShotIndex].judul?.best_choice || `Shot #${selectedShotIndex + 1}`}"</h3>
                                 <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/80 p-3 rounded-lg border border-border text-xs">
                                   <div>
                                     <span className="text-muted-foreground/80">Rentang Waktu:</span>
                                     <div className="font-semibold text-foreground mt-0.5">{result.result?.shots[selectedShotIndex].segmen?.start_time} - {result.result?.shots[selectedShotIndex].segmen?.end_time} (Durasi: {result.result?.shots[selectedShotIndex].segmen?.durasi})</div>
                                   </div>
                                   <div>
                                     <span className="text-muted-foreground/80">Big Idea:</span>
                                     <div className="font-semibold text-foreground mt-0.5 leading-normal">{result.result?.shots[selectedShotIndex].strategi_konten?.big_idea}</div>
                                   </div>
                                   <div>
                                     <span className="text-muted-foreground/80">Hook Pembuka Baru:</span>
                                     <div className="font-semibold text-foreground mt-0.5 leading-normal">"{result.result?.shots[selectedShotIndex].strategi_konten?.hook_baru}"</div>
                                   </div>
                                 </div>
                                 {result.result?.shots[selectedShotIndex].segmen?.alasan && (
                                   <p className="text-[11px] text-muted-foreground italic leading-relaxed mt-2.5 pt-2 border-t border-border/40">
                                     <strong>Alasan Segmen:</strong> {result.result?.shots[selectedShotIndex].segmen?.alasan}
                                   </p>
                                 )}
                               </CardContent>
                             </Card>

                            {/* Accordion detail folders */}
                            <Accordion defaultValue={["titles"]} className="w-full space-y-4">
                              
                              {/* Title Ideas Accordion */}
                              <AccordionItem value="titles" className="bg-muted/30 border border-border rounded-xl overflow-hidden px-4 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <User className="size-4 text-sky-400" />
                                    <span>Ide Judul Rekomendasi (SEO & CTR)</span>
                                  </div>
                                </AccordionTrigger>
                                  <AccordionContent className="pt-2 pb-4 space-y-3">
                                  {(() => {
                                    const judulObj = result.result?.shots[selectedShotIndex].judul || {};
                                    const opsi = judulObj.opsi || [];
                                    const bestChoice = judulObj.best_choice || "";
                                    return opsi.map((t: string, i: number) => {
                                      const isBest = t === bestChoice;
                                      return (
                                        <div key={i} className={`bg-muted p-3.5 rounded-lg border flex items-start justify-between gap-4 ${isBest ? "border-emerald-500/50 bg-emerald-500/5" : "border-border"}`}>
                                          <div className="space-y-1">
                                            <div className="text-sm font-semibold text-foreground font-sans">"{t}"</div>
                                            {isBest && (
                                              <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-1">
                                                ★ Pilihan Terbaik (Best Choice)
                                              </span>
                                            )}
                                          </div>
                                          <Button 
                                            onClick={() => copyToClipboard(t)} 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 hover:bg-muted text-muted-foreground/80 hover:text-foreground shrink-0"
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
                              <AccordionItem value="thumbnail" className="bg-muted/30 border border-border rounded-xl overflow-hidden px-4 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <ImageIcon className="size-4 text-emerald-400" />
                                    <span>Konsep Thumbnail Visual</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 space-y-4">
                                  {(() => {
                                    const thumb = result.result?.shots[selectedShotIndex].thumbnail || {};
                                    return (
                                      <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                            <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold">Konsep Visual</span>
                                            <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                                              {thumb.konsep || "-"}
                                            </p>
                                          </div>
                                          <div className="space-y-1">
                                            <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold">Teks Overlay (Kata Pemicu)</span>
                                            <div className="bg-muted p-4 border border-border rounded-xl text-center flex items-center justify-center min-h-[60px]">
                                              <span className="text-lg font-extrabold uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 font-sans tracking-tight">
                                                {thumb.teks_thumbnail || "(Tidak ada teks)"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="space-y-1 pt-2 border-t border-border">
                                          <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold">Komposisi & Layout</span>
                                          <p className="text-xs text-foreground/90 font-sans">
                                            {thumb.komposisi || "-"}
                                          </p>
                                        </div>
                                        {thumb.warna && thumb.warna.length > 0 && (
                                          <div className="space-y-1 pt-2 border-t border-border text-xs">
                                            <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold block mb-1">Palet Warna &amp; Psikologi</span>
                                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                                              {thumb.warna.map((w: string, idx: number) => (
                                                <span key={idx} className="bg-muted border border-border text-foreground px-2 py-0.5 rounded text-[10px] font-semibold">{w}</span>
                                              ))}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-normal">{thumb.psikologi_warna}</p>
                                          </div>
                                        )}
                                        {thumb.prompt_ai_image && (
                                          <div className="space-y-2 pt-2 border-t border-border">
                                            <div className="flex justify-between items-center text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold">
                                              <span>Prompt AI Image (Salin &amp; Kirim ke Gemini/Imagen)</span>
                                              <Button 
                                                onClick={() => copyToClipboard(thumb.prompt_ai_image)} 
                                                variant="ghost" 
                                                size="xs" 
                                                className="h-6 text-[10px] hover:bg-muted text-emerald-400 hover:text-emerald-300"
                                              >
                                                <Copy className="size-3 mr-1" /> Salin Prompt
                                              </Button>
                                            </div>
                                            <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20 text-xs text-foreground/90 font-mono leading-relaxed select-text">
                                              {thumb.prompt_ai_image}
                                            </div>
                                            <span className="text-[9px] text-muted-foreground italic leading-normal font-sans">
                                              💡 Tips: Salin prompt bahasa Inggris di atas, kirim ke Google Gemini dengan tambahan perintah "Buat gambar dengan rasio 9:16 untuk YouTube Shorts..."
                                            </span>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </AccordionContent>
                              </AccordionItem>
 
                              {/* Description & Tags Accordion */}
                              <AccordionItem value="description" className="bg-muted/30 border border-border rounded-xl overflow-hidden px-4 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <FileText className="size-4 text-violet-400" />
                                    <span>Deskripsi Siap Upload &amp; Tags</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 space-y-4">
                                  {(() => {
                                    const shot = result.result?.shots[selectedShotIndex] || {};
                                    const desc = shot.deskripsi_youtube || "-";
                                    const tags = shot.seo?.tags || [];
                                    const keywords = shot.seo?.keyword_utama || [];
                                    return (
                                      <>
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold">
                                            <span>Naskah Deskripsi</span>
                                            <Button 
                                              onClick={() => copyToClipboard(desc)} 
                                              variant="ghost" 
                                              size="xs" 
                                              className="h-6 text-[10px] hover:bg-muted text-muted-foreground hover:text-foreground"
                                            >
                                              <Copy className="size-3 mr-1" /> Salin Deskripsi
                                            </Button>
                                          </div>
                                          <div className="bg-muted p-3.5 rounded-lg border border-border text-xs text-foreground/90 font-mono leading-relaxed whitespace-pre-wrap">
                                            {desc}
                                          </div>
                                        </div>
                                        {keywords.length > 0 && (
                                          <div className="space-y-1">
                                            <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold block">Kata Kunci Utama</span>
                                            <div className="flex flex-wrap gap-1.5">
                                              {keywords.map((kw: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-semibold">
                                                  {kw}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {tags.length > 0 && (
                                          <div className="space-y-2">
                                            <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold">Tag Kata Kunci SEO</span>
                                            <div className="flex flex-wrap gap-1.5">
                                              {tags.map((t: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-muted border border-border text-muted-foreground px-2.5 py-1 rounded-md">
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
                              <AccordionItem value="editing" className="bg-muted/30 border border-border rounded-xl overflow-hidden px-4 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <Scissors className="size-4 text-amber-400" />
                                    <span>Instruksi Editing (Visual &amp; Audio)</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 space-y-4">
                                  {(() => {
                                    const recommendations = result.result?.shots[selectedShotIndex].editing?.rekomendasi || [];
                                    return (
                                      <div className="space-y-2">
                                        {recommendations.length > 0 ? (
                                          recommendations.map((rec: string, i: number) => (
                                            <div key={i} className="flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
                                              <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                                              <p className="font-sans text-foreground/90">{rec}</p>
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
                              <AccordionItem value="outline" className="bg-muted/30 border border-border rounded-xl overflow-hidden px-4 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <Clock className="size-4 text-indigo-400" />
                                    <span>⏩ Beat Timeline &amp; Strategi</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-b border-border/40 pb-3 mb-2">
                                    <div>
                                      <span className="text-muted-foreground/80 font-bold uppercase text-[9px] tracking-wider">Big Idea</span>
                                      <p className="text-foreground/90 font-sans leading-relaxed mt-0.5">{result.result?.shots[selectedShotIndex].strategi_konten?.big_idea}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground/80 font-bold uppercase text-[9px] tracking-wider">Unique Angle</span>
                                      <p className="text-foreground/90 font-sans leading-relaxed mt-0.5">{result.result?.shots[selectedShotIndex].strategi_konten?.unique_angle}</p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold block mb-1">Beat Timeline:</span>
                                  {(result.result?.shots[selectedShotIndex].strategi_konten?.outline || []).map((beat: any, i: number) => (
                                    <div key={i} className="bg-muted/60 p-2.5 rounded-lg border border-border/40 flex items-start gap-2.5">
                                      <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                                        #{i+1}
                                      </span>
                                      <div className="text-xs leading-normal font-sans">
                                        <strong>{beat.babak}</strong> — {beat.isi}
                                      </div>
                                    </div>
                                  ))}
                                  {result.result?.shots[selectedShotIndex].strategi_konten?.cta && (
                                    <div className="bg-muted border border-border p-3.5 rounded-lg text-xs leading-relaxed mt-2">
                                      <strong className="text-violet-400 block mb-0.5">Call To Action (CTA):</strong>
                                      <p className="font-sans">"{result.result?.shots[selectedShotIndex].strategi_konten?.cta}"</p>
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>

                              {/* Performance & Checklists */}
                              <AccordionItem value="checklist" className="bg-muted/30 border border-border rounded-xl overflow-hidden px-4 py-1">
                                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <CheckSquare className="size-4 text-emerald-400" />
                                    <span>Checklist Produksi & Prediksi Performa</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 space-y-5">
                                  
                                  {/* Performance cards */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-muted p-3 border border-border rounded-lg">
                                      <span className="text-[9px] text-muted-foreground/80 uppercase tracking-wider font-semibold">Estimasi CTR</span>
                                      <div className="text-sm font-bold text-emerald-400 mt-0.5">{result.result?.shots[selectedShotIndex].prediksi_performa?.ctr_estimate}</div>
                                    </div>
                                    <div className="bg-muted p-3 border border-border rounded-lg">
                                      <span className="text-[9px] text-muted-foreground/80 uppercase tracking-wider font-semibold">Kurva Retensi</span>
                                      <div className="text-xs text-foreground/90 mt-0.5 font-medium leading-normal">{result.result?.shots[selectedShotIndex].prediksi_performa?.retention_prediction}</div>
                                    </div>
                                    <div className="bg-muted p-3 border border-border rounded-lg">
                                      <span className="text-[9px] text-muted-foreground/80 uppercase tracking-wider font-semibold">Potensi Viral</span>
                                      <div className="text-sm font-bold text-indigo-400 mt-0.5">{result.result?.shots[selectedShotIndex].prediksi_performa?.viral_potential}</div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-border">
                                    {/* Production checklist */}
                                    <div className="space-y-2">
                                      <h4 className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold">Checklist Langkah Produksi</h4>
                                      <div className="space-y-2">
                                        {(result.result?.shots[selectedShotIndex].checklist?.produksi || []).map((item: string, i: number) => (
                                          <div key={i} className="flex items-start gap-2 text-xs">
                                            <input type="checkbox" id={`chk-prod-${i}`} className="mt-0.5 accent-violet-600 rounded" />
                                            <label htmlFor={`chk-prod-${i}`} className="text-foreground/90 leading-normal font-sans cursor-pointer">{item}</label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Upload/Publish checklist */}
                                    <div className="space-y-2">
                                      <h4 className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold">Checklist Saat Upload</h4>
                                      <div className="space-y-2">
                                        {(result.result?.shots[selectedShotIndex].checklist?.publikasi || []).map((item: string, i: number) => (
                                          <div key={i} className="flex items-start gap-2 text-xs">
                                            <input type="checkbox" id={`chk-pub-${i}`} className="mt-0.5 accent-violet-600 rounded" />
                                            <label htmlFor={`chk-pub-${i}`} className="text-foreground/90 leading-normal font-sans cursor-pointer">{item}</label>
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
                        <Card className="bg-card text-card-foreground border-border p-6 space-y-6">
                          <div className="space-y-2">
                            <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">
                              Konsep Produksi Video Panjang
                            </span>
                            <h3 className="text-lg font-bold text-foreground font-semibold">
                              "{result.result?.video_panjang?.judul?.best_choice || "Judul Rekomendasi"}"
                            </h3>
                            {result.result?.video_panjang?.judul?.alasan_best_choice && (
                              <p className="text-xs text-muted-foreground leading-relaxed mt-1 italic font-sans">
                                Alasan: {result.result?.video_panjang?.judul?.alasan_best_choice}
                              </p>
                            )}
                            {result.result?.video_panjang?.judul?.opsi && result.result?.video_panjang?.judul?.opsi.length > 0 && (
                              <div className="pt-2">
                                <span className="text-[10px] text-muted-foreground/80 uppercase font-bold tracking-wider">Opsi Judul Lainnya:</span>
                                <ul className="list-disc pl-4 text-xs text-foreground/80 space-y-1 mt-1 font-sans">
                                  {result.result?.video_panjang?.judul?.opsi.map((op: string, idx: number) => (
                                    <li key={idx}>"{op}"</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <Separator className="bg-card" />

                          {/* Strategi Konten & Outline */}
                          <div className="space-y-4 bg-muted/40 p-4 border border-border rounded-xl">
                            <h4 className="text-xs font-bold text-foreground/90 flex items-center gap-1.5 text-indigo-400">
                              <Sparkles className="size-4" /> Strategi Konten &amp; Outline
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-muted-foreground/80 font-bold uppercase text-[9px] tracking-wider block">Big Idea</span>
                                <p className="text-foreground/90 font-sans leading-relaxed mt-0.5">{result.result?.video_panjang?.strategi_konten?.big_idea}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground/80 font-bold uppercase text-[9px] tracking-wider block">Unique Angle</span>
                                <p className="text-foreground/90 font-sans leading-relaxed mt-0.5">{result.result?.video_panjang?.strategi_konten?.unique_angle}</p>
                              </div>
                            </div>
                            <div className="text-xs pt-1">
                              <span className="text-muted-foreground/80 font-bold uppercase text-[9px] tracking-wider block">Hook Pembuka Baru</span>
                              <p className="text-foreground/90 font-sans font-semibold leading-relaxed mt-0.5">"{result.result?.video_panjang?.strategi_konten?.hook_baru}"</p>
                            </div>

                            {/* Opening 60 Detik */}
                            {result.result?.video_panjang?.strategi_konten?.opening_60_detik && (
                              <div className="mt-3 pt-3 border-t border-border/40 text-xs">
                                <span className="text-muted-foreground/80 font-bold uppercase text-[9px] tracking-wider block mb-2 text-violet-400">⏱️ Rekomendasi Opening 60 Detik</span>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {(result.result?.video_panjang?.strategi_konten?.opening_60_detik?.klip || []).map((klip: any, idx: number) => (
                                    <div key={idx} className="bg-background/40 p-2.5 rounded-lg border border-border/30 space-y-1.5">
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="font-bold text-violet-400">🎬 Video Baru: {klip.video_baru_start} - {klip.video_baru_end}</span>
                                        <span className="text-muted-foreground">Sumber: {klip.sumber_start} - {klip.sumber_end}</span>
                                      </div>
                                      <p className="text-[11px] leading-relaxed italic font-sans">"{klip.narasi_sumber}"</p>
                                      {klip.catatan_editing && (
                                        <p className="text-[10px] text-muted-foreground">✏️ Editing: {klip.catatan_editing}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {result.result?.video_panjang?.strategi_konten?.opening_60_detik?.alasan && (
                                  <p className="text-[10px] text-muted-foreground italic mt-2 font-sans">Alasan Pilihan: {result.result?.video_panjang?.strategi_konten?.opening_60_detik?.alasan}</p>
                                )}
                              </div>
                            )}

                            {/* Detailed Outline */}
                            <div className="pt-3 border-t border-border/40 text-xs">
                              <span className="text-muted-foreground/80 font-bold uppercase text-[9px] tracking-wider block mb-2">📑 Outline &amp; Chapter Timeline</span>
                              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                {(result.result?.video_panjang?.strategi_konten?.outline || []).map((chapter: any, idx: number) => (
                                  <div key={idx} className="bg-background/30 p-3 rounded-lg border border-border/20">
                                    <div className="flex items-center justify-between font-bold mb-1">
                                      <span>Babak {idx+1}: {chapter.babak}</span>
                                      <span className="text-indigo-400 text-[10px]">⏱️ {chapter.start_estimate} - {chapter.end_estimate}</span>
                                    </div>
                                    <p className="text-muted-foreground text-[11px] font-sans leading-relaxed">{chapter.isi}</p>
                                    {chapter.sumber_segmen && chapter.sumber_segmen.map((src: any, srcIdx: number) => (
                                      <div key={srcIdx} className="text-[10px] text-muted-foreground/80 mt-1 border-t border-border/10 pt-1 font-sans">
                                        📹 Ambil dari video sumber {src.start} - {src.end} {src.catatan && `· ${src.catatan}`}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <Separator className="bg-card" />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Visual Thumbnail */}
                            <div className="space-y-3 bg-muted p-4 border border-border rounded-xl">
                              <h4 className="text-xs font-bold text-foreground/90 flex items-center gap-1.5">
                                <ImageIcon className="size-4 text-emerald-400" /> Konsep Thumbnail
                              </h4>
                              <div className="space-y-2.5 text-xs">
                                <div>
                                  <span className="text-muted-foreground/80">Teks Utama:</span>
                                  <div className="text-sm font-bold text-emerald-400 uppercase mt-0.5">"{result.result?.video_panjang?.thumbnail?.teks_thumbnail}"</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground/80">Deskripsi Visual:</span>
                                  <p className="text-foreground/90 leading-relaxed mt-0.5 font-sans">{result.result?.video_panjang?.thumbnail?.konsep}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground/80">Gaya Tata Letak:</span>
                                  <p className="text-foreground/90 leading-relaxed mt-0.5 font-sans">{result.result?.video_panjang?.thumbnail?.komposisi}</p>
                                </div>
                                {result.result?.video_panjang?.thumbnail?.prompt_ai_image && (
                                  <div className="space-y-1.5 pt-2 border-t border-border/40">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold">Prompt AI Image (Kirim ke Gemini)</span>
                                      <Button 
                                        onClick={() => copyToClipboard(result.result?.video_panjang?.thumbnail?.prompt_ai_image)}
                                        variant="ghost" 
                                        size="xs" 
                                        className="h-5 text-[9px] text-emerald-400 hover:text-emerald-300"
                                      >
                                        <Copy className="size-3 mr-1" /> Salin Prompt
                                      </Button>
                                    </div>
                                    <div className="bg-emerald-500/5 p-2.5 rounded border border-emerald-500/10 text-[11px] font-mono select-text leading-relaxed">
                                      {result.result?.video_panjang?.thumbnail?.prompt_ai_image}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground italic leading-normal">
                                      💡 Tips: Kirim prompt bahasa Inggris ini ke Google Gemini dengan instruksi "Buat gambar dengan rasio 16:9 untuk Thumbnail YouTube..."
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Description & Tags */}
                            <div className="space-y-3 bg-muted p-4 border border-border rounded-xl">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold text-foreground/90 flex items-center gap-1.5">
                                  <FileText className="size-4 text-sky-400" /> Deskripsi Siap Upload
                                </h4>
                                <Button 
                                  onClick={() => copyToClipboard(result.result?.video_panjang?.deskripsi_youtube)}
                                  variant="ghost" 
                                  size="xs" 
                                  className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                                >
                                  <Copy className="size-3 mr-1" /> Salin
                                </Button>
                              </div>
                              <div className="bg-muted p-3 rounded-lg text-xs font-mono max-h-36 overflow-y-auto whitespace-pre-wrap leading-normal">
                                {result.result?.video_panjang?.deskripsi_youtube}
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-bold">SEO Tags</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {(result.result?.video_panjang?.seo?.tags || []).map((t: string, i: number) => (
                                    <span key={i} className="text-[10px] bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <Separator className="bg-card" />

                          {/* Editing & Pacing */}
                          <div className="space-y-3 bg-muted p-4 border border-border rounded-xl">
                            <h4 className="text-xs font-bold text-foreground/90 flex items-center gap-1.5">
                              <Scissors className="size-4 text-amber-400" /> Rekomendasi Editing
                            </h4>
                            <div className="space-y-2 text-xs">
                              {(result.result?.video_panjang?.editing?.rekomendasi || []).map((rec: string, i: number) => (
                                <div key={i} className="flex items-start gap-2.5 leading-relaxed text-foreground/90 font-sans">
                                  <span className="text-amber-500 font-bold mt-0.5">•</span>
                                  <p>{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
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
          <p>Â© 2026 AI-Clapperboard-Content-Intelligence Pro. Dikembangkan untuk Kreator Original Clapperboard Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}



