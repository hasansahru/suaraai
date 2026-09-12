"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Toaster, toast } from "sonner";
import {
  Clapperboard,
  Settings,
  Play,
  Brain,
  Sparkles,
  Sliders,
  Key,
  KeyRound,
  Check,
  CheckCircle2,
  Loader2,
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
  ExternalLink,
  Menu,
  X,
  ChevronRight,
  FileText,
} from "lucide-react";

import { AnalysisResultPanel } from "@/components/AnalysisResultPanel";
import { FFmpegPeakAnalyzer } from "@/components/studio/FFmpegPeakAnalyzer";
import { SidebarNav } from "@/components/studio/SidebarNav";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ──────────────────────────────────────────────────────────────
   STATIC CONFIG (pakai konstanta saja, tidak ada tema terang)
   ────────────────────────────────────────────────────────────── */

const DEFAULT_PROVIDERS = [
  {
    id: "nine_router",
    label: "9Router (Free)",
    mode: "openai_compatible",
    default_base_url: "https://ai.sahru.my.id/v1",
    models: [
      { id: "Combo-Maut", label: "Combo-Maut", description: "Otomatis pilih model terkuat dengan failover cadangan." },
      { id: "ComToken", label: "ComToken", description: "Model fallback super cepat & stabil." },
      { id: "Google", label: "Google", description: "Grup model Google Gemini via 9Router dengan auto-fallback." },
      { id: "ag/gemini-3.7-flash-high", label: "Gemini 3.7 Flash High (AG)" },
      { id: "ag/claude-sonnet-4-6", label: "Claude Sonnet 4.6 (AG)" },
      { id: "kr/claude-opus-4.7", label: "Claude Opus 4.7 (KR, Premium)" },
    ],
  },
  {
    id: "google_ai_studio",
    label: "Google AI Studio",
    mode: "google",
    default_base_url: "",
    /* HANYA model yang masih AKTIF di Google AI Studio.
       Model 2.0/1.5 series sudah retired (Google membalas 404
       "models/gemini-x.x is no longer available") — JANGAN ditambah lagi. */
    models: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Rekomendasi — Cepat & Stabil." },
      { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", description: "Super hemat token." },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Analisis & naskah mendalam." },
    ],
  },
];

const DEFAULT_CHANNELS = [
  { id: "suara_filsuf", name: "Suara Filsuf", emoji: "🧠", description: "Filosofi populer, reflektif, tenang, dan dalam." },
  { id: "nalar_senyap", name: "Nalar Senyap", emoji: "🌿", description: "Psikologi, healing, dan kontemplasi diri yang hangat." },
  { id: "tutur_kyai", name: "Tutur Kyai", emoji: "🕊️", description: "Hikmah Islami, akhlak, dan nilai spiritual yang santun." },
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

const FALLBACK_API_BASE = "https://api.filsuf.my.id";

function resolveApiBase(): string {
  if (typeof window === "undefined") return FALLBACK_API_BASE;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL as string;
  return FALLBACK_API_BASE;
}

const API_BASE = resolveApiBase();

/* ──────────────────────────────────────────────────────────────
   GLASS PRIMITIVES — pure dark, no light fallback
   ────────────────────────────────────────────────────────────── */

const glassCard =
  "bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl p-5";
const glassCardLarge =
  "bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl p-5";
const inputField =
  "w-full bg-black/30 border border-white/15 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all";

/* ──────────────────────────────────────────────────────────────
   API HANDLER — explicit Bearer + x-api-key, env fallback, guard
   ────────────────────────────────────────────────────────────── */

type ApiCallOptions = {
  path: string;
  method?: "GET" | "POST" | "DELETE";
  body?: any;
  apiKey: string;
  authToken?: string | null;
  contentType?: "json" | "multipart";
  formData?: FormData;
  timeoutMs?: number;
  /* Mode provider upstream — menentukan header auth apa yang dikirim
     (agar header Google tidak dicampur dengan header OpenAI/9Router). */
  providerMode?: "google" | "openai_compatible" | "anthropic";
};

async function callApi(opts: ApiCallOptions): Promise<Response> {
  const {
    path,
    method = "POST",
    body,
    apiKey,
    authToken,
    contentType = "json",
    formData,
    timeoutMs = 180_000,
    providerMode = "openai_compatible",
  } = opts;

  const headers: Record<string, string> = {};
  if (contentType === "json") headers["Content-Type"] = "application/json";
  headers["Accept"] = "application/json";

  // Auth backend (FastAPI) — Bearer token user (login suaraai).
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  // Upstream auth — DIPISAHKAN EKSPANSIF per mode provider.
  const cleanKey = (apiKey || "").trim();
  if (cleanKey.length > 0) {
    if (providerMode === "google") {
      // Google AI Studio (Gemini API): header `x-goog-api-key` + URL param `?key=`
      // (URL param ditangani pemanggil saat fetch langsung ke REST Gemini).
      headers["x-goog-api-key"] = cleanKey;
    } else if (providerMode === "anthropic") {
      // Anthropic: x-api-key + version.
      headers["x-api-key"] = cleanKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      // OpenAI-compatible (9Router dst): Authorization Bearer + x-api-key.
      headers["Authorization"] = `Bearer ${cleanKey}`;
      headers["x-api-key"] = cleanKey;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: formData ?? (contentType === "json" && body ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */

export default function Dashboard() {
  /* Provider / model / key state */
  const [apiSettings, setApiSettings] = useState<any>(null);
  const [provider, setProvider] = useState<string>("nine_router");
  const [model, setModel] = useState<string>("Combo-Maut");
  const [apiKey, setApiKey] = useState<string>(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? ""
  );
  const [baseUrl, setBaseUrl] = useState<string>("https://ai.sahru.my.id/v1");
  const [timeout, setTimeoutVal] = useState<number>(180);

  /* Studio state */
  const [channelDna, setChannelDna] = useState<string>("suara_filsuf");
  const [outputType, setOutputType] = useState<"shorts" | "video_panjang">("shorts");
  const [duration, setDuration] = useState<string>("30s");
  const [shotCount, setShotCount] = useState<number>(5);
  const [extraNotes, setExtraNotes] = useState<string>("");

  /* Source input */
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [manualTranscript, setManualTranscript] = useState<string>("");
  const [useManual, setUseManual] = useState<boolean>(false);

  /* Analytics */
  const [analyticsExists, setAnalyticsExists] = useState<boolean>(false);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);

  /* UI state */
  const [activeMenu, setActiveMenu] = useState<string>("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isInputDrawerOpen, setIsInputDrawerOpen] = useState(false);
  const [openModules, setOpenModules] = useState<string[]>(() => {
    try {
      const r = localStorage.getItem("suaraai.openModules");
      const p = r ? JSON.parse(r) : null;
      return Array.isArray(p) ? (p as string[]) : ["dna", "format"];
    } catch {
      return ["dna", "format"];
    }
  });
  const [activeCanvasTab, setActiveCanvasTab] = useState<string>(() => {
    try {
      const r = localStorage.getItem("suaraai.canvasTab");
      return typeof r === "string" && r ? r : "ringkasan";
    } catch {
      return "ringkasan";
    }
  });

  /* Loading */
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  /* Result + history */
  const [result, setResult] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);

  /* Keywords assist */
  const [keywordQuery, setKeywordQuery] = useState("");
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  /* Refs (for future focus jumps) */
  const inputSectionRef = useRef<HTMLDivElement | null>(null);
  const channelSectionRef = useRef<HTMLDivElement | null>(null);
  const formatSectionRef = useRef<HTMLDivElement | null>(null);

  /* ── Persisted loaders ── */
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("suara_ai_api_key");
      if (savedKey && savedKey.trim().length > 0) setApiKey(savedKey);

      const savedModel = localStorage.getItem("suara_ai_model");
      if (savedModel) setModel(savedModel);

      const stored = localStorage.getItem("suara_ai_history");
      if (stored) setHistoryList(JSON.parse(stored));
    } catch (e) {
      console.error("LocalStorage load failed:", e);
    }
  }, []);

  /* Persist key on change (skip empty to avoid wiping out) */
  useEffect(() => {
    if (apiKey && apiKey.trim().length > 0) {
      localStorage.setItem("suara_ai_api_key", apiKey.trim());
    }
  }, [apiKey]);

  /* Persist model */
  useEffect(() => {
    if (model) localStorage.setItem("suara_ai_model", model);
  }, [model]);

  /* Persist open accordion modules */
  useEffect(() => {
    localStorage.setItem("suaraai.openModules", JSON.stringify(openModules));
  }, [openModules]);

  /* Persist last canvas facet */
  useEffect(() => {
    localStorage.setItem("suaraai.canvasTab", activeCanvasTab);
  }, [activeCanvasTab]);

  /* ── History helpers ── */
  const addToHistory = useCallback((title: string, dna: string, output: string, resData: any) => {
    setHistoryList((prev) => {
      const newItem = {
        id: Date.now().toString(),
        title: title || "Video Tanpa Judul",
        channel_dna: dna,
        output_type_id: output,
        timestamp: new Date().toLocaleString("id-ID"),
        result: resData,
      };
      const updated = [newItem, ...prev].slice(0, 15);
      try {
        localStorage.setItem("suara_ai_history", JSON.stringify(updated));
      } catch { }
      return updated;
    });
  }, []);

  const deleteHistoryItem = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("suara_ai_history", JSON.stringify(updated));
        toast.success("Item riwayat berhasil dihapus!");
      } catch { }
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

  /* ── Keyword assist (debounced) ── */
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

  /* ── Analytics fetch ── */
  useEffect(() => {
    let cancelled = false;
    async function checkAnalytics() {
      try {
        const res = await fetch(`${API_BASE}/api/channels/${channelDna}/analytics`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setAnalyticsExists(data.exists);
          setAnalyticsSummary(data.exists ? data.summary : null);
        }
      } catch (err) {
        console.error("Analytics check failed:", err);
      }
    }
    checkAnalytics();
    return () => {
      cancelled = true;
    };
  }, [channelDna]);

  const handleUploadAnalytics = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    const toastId = toast.loading("Memproses data analytics...");
    try {
      const res = await callApi({
        path: `/api/channels/${channelDna}/analytics`,
        method: "POST",
        apiKey,
        formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAnalyticsExists(true);
        setAnalyticsSummary(data.summary);
        toast.success("Analytics berhasil disimpan!", { id: toastId });
      } else {
        toast.error(`Gagal: ${data.detail || "Format tidak didukung"}`, { id: toastId });
      }
    } catch (err) {
      toast.error("Gagal menghubungi backend API.", { id: toastId });
    }
  };

  const handleDeleteAnalytics = async () => {
    try {
      const res = await callApi({
        path: `/api/channels/${channelDna}/analytics`,
        method: "DELETE",
        apiKey,
      });
      if (res.ok) {
        setAnalyticsExists(false);
        setAnalyticsSummary(null);
        toast.success("Data analytics channel berhasil dihapus!");
      } else {
        toast.error("Gagal menghapus data analytics.");
      }
    } catch {
      toast.error("Gagal terhubung ke backend API.");
    }
  };

  /* ── Settings + provider list ── */
  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setApiSettings(data);
          if (data.ai_provider?.default_provider) {
            setProvider(data.ai_provider.default_provider);
          }
        }
      } catch (err) {
        console.log("Using local default settings:", err);
      }
    }
    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
    const pInfo = providers.find((p: any) => p.id === provider);
    const list = pInfo?.models || [];
    if (list.length > 0) {
      const firstModel = typeof list[0] === "string" ? list[0] : list[0].id;
      setModel((prev) => (list.some((m: any) => (typeof m === "string" ? m : m.id) === prev) ? prev : firstModel));
    }
    const rawDefault =
      pInfo?.default_base_url ??
      DEFAULT_PROVIDERS.find((p) => p.id === provider)?.default_base_url;
    setBaseUrl(rawDefault !== undefined && rawDefault !== null ? rawDefault : "");
  }, [provider, apiSettings]);

  useEffect(() => {
    if (outputType === "shorts") setDuration("30s");
    else setDuration("5-15m");
  }, [outputType]);

  /* ── API GUARD: panggil ini sebelum semua fetch yang butuh key ── */
  const requireApiKey = (): string | null => {
    const key = (apiKey || "").trim() || (process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "").trim();
    if (!key) {
      toast.error("API Key Wajib Diisi!", {
        description: "Buka Konfigurasi AI lalu tempel API Key Anda.",
      });
      setIsSettingsOpen(true);
      return null;
    }
    return key;
  };

  /* ── Actions ── */

  /* Bersihkan nama model Gemini dari prefix `models/` atau `gemini/`.
     Hasil wajib: 'gemini-2.5-flash' — TANPA prefix apa pun. */
  const cleanGeminiModel = (raw: string): string =>
    (raw || "").replace(/^(models\/|gemini\/)/, "").trim();

  const handleTestConnection = async () => {
    /* 1. Ambil API Key LANGSUNG dari input state modal (bukan global). */
    const inputApiKey = (apiKey || "").trim();
    if (!inputApiKey) {
      toast.error("API Key wajib diisi sebelum tes koneksi!");
      setTestResult({ ok: false, message: "API Key wajib diisi sebelum tes koneksi!" });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
    const pInfo = providers.find((p: any) => p.id === provider);
    const mode = pInfo?.mode || (provider === "anthropic" ? "anthropic" : "openai_compatible");
    const targetBaseUrl = (baseUrl || "https://ai.sahru.my.id/v1").replace(/\/+$/, "");

    /* ══════════════════════════════════════════════════════════════
       BRANCH A — GOOGLE AI STUDIO (mode "google")
       DILARANG menembak endpoint 9Router. Direct REST ke:
       GET https://generativelanguage.googleapis.com/v1beta/models?key=<KEY>
       header `x-goog-api-key`. Nama model dibersihkan dari prefix
       `models/` / `gemini/` sebelum diverifikasi.
       ══════════════════════════════════════════════════════════════ */
    if (provider === "google_ai_studio" || mode === "google") {
      try {
        const cleanModel = cleanGeminiModel(model);
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(inputApiKey)}`;
        const res = await fetch(listUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": inputApiKey,
          },
        });

        if (res.status === 401 || res.status === 403) {
          const msg = `API Key tidak valid (HTTP ${res.status} Unauthorized). Silakan periksa kembali API Key Anda.`;
          setTestResult({ ok: false, message: msg });
          toast.error(msg);
          return;
        }

        if (res.status === 404) {
          const msg = "Endpoint Google AI Studio tidak ditemukan (HTTP 404). Pastikan model Gemini yang dipilih masih aktif (seri 2.5).";
          setTestResult({ ok: false, message: msg });
          toast.error(msg);
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const detail = typeof data?.error?.message === "string" ? data.error.message : `Error status ${res.status}`;
          setTestResult({ ok: false, message: detail });
          toast.error(`Koneksi API Gagal: ${detail}`);
          return;
        }

        const data = await res.json().catch(() => ({}));
        const availableModels: any[] = data.models || [];

        // Verifikasi model terpilih masih tersedia di akun Google ini.
        const matched = availableModels.find(
          (m: any) => m.name === `models/${cleanModel}` || m.name === cleanModel,
        );
        if (!matched && availableModels.length > 0) {
          const msg = `Model '${cleanModel}' tidak tersedia di akun Anda (retired/berubah). Model aktif: ${availableModels.map((m: any) => (m.name || "").replace(/^models\//, "")).filter(Boolean).slice(0, 5).join(", ")}`;
          setTestResult({ ok: false, message: msg });
          toast.error(msg);
          return;
        }

        setTestResult({ ok: true, message: `Koneksi Google AI Studio online — model '${cleanModel}' aktif & siap digunakan.` });
        toast.success("Koneksi API Berhasil!");
      } catch (err: any) {
        const msg =
          err?.name === "AbortError"
            ? "Timeout saat menguji koneksi ke Google AI Studio."
            : `Gagal menghubungi Google AI Studio: ${err?.message || "periksa koneksi internet Anda."}`;
        setTestResult({ ok: false, message: msg });
        toast.error(msg);
      } finally {
        setTestLoading(false);
      }
      return;
    }

    /* ══════════════════════════════════════════════════════════════
       BRANCH B — 9ROUTER / OPENAI-COMPATIBLE
       POST backend /api/test-connection; fallback direct POST /chat/completions:
       Authorization Bearer + x-api-key.
       ══════════════════════════════════════════════════════════════ */
    try {
      const res = await callApi({
        path: "/api/test-connection",
        method: "POST",
        apiKey: inputApiKey,
        providerMode: "openai_compatible",
        body: {
          mode,
          model,
          api_key: inputApiKey,
          base_url: targetBaseUrl,
          timeout: 30,
        },
        timeoutMs: 45_000,
      });

      if (res.status === 401) {
        const msg = "API Key tidak valid (HTTP 401 Unauthorized). Silakan periksa kembali API Key Anda.";
        setTestResult({ ok: false, message: msg });
        toast.error(msg);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTestResult({ ok: true, message: data.message || "Online & Siap Digunakan" });
        toast.success("Koneksi API Berhasil!");
      } else {
        const msg = typeof data.detail === "string" ? data.detail : (data.detail ? JSON.stringify(data.detail) : data.message || `Error status ${res.status}`);
        setTestResult({ ok: false, message: msg });
        toast.error(`Koneksi API Gagal: ${msg}`);
      }
    } catch (err: any) {
      try {
        const baseUrlClean = targetBaseUrl.replace(/\/+$/, "");
        const targetUrl = baseUrlClean.endsWith("/chat/completions")
          ? baseUrlClean
          : `${baseUrlClean}/chat/completions`;

        const directRes = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${inputApiKey}`,
            "x-api-key": inputApiKey,
          },
          body: JSON.stringify({
            model: model || "Combo-Maut",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 5,
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (directRes.status === 401) {
          const msg = "API Key tidak valid (HTTP 401 Unauthorized). Silakan periksa kembali API Key Anda.";
          setTestResult({ ok: false, message: msg });
          toast.error(msg);
          return;
        }

        if (directRes.ok) {
          setTestResult({ ok: true, message: "Koneksi 9Router Online!" });
          toast.success("Koneksi API Berhasil!");
          return;
        }

        const modelsRes = await fetch(`${baseUrlClean}/models`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${inputApiKey}`,
            "x-api-key": inputApiKey,
          },
          signal: AbortSignal.timeout(10000),
        });
        if (modelsRes.ok) {
          setTestResult({ ok: true, message: "Koneksi 9Router Online!" });
          toast.success("Koneksi API Berhasil!");
          return;
        }
      } catch (_) { }

      const msg = err?.name === "AbortError" ? "Timeout saat menguji koneksi." : "Gagal menghubungkan ke server API.";
      setTestResult({ ok: false, message: msg });
      toast.error(msg);
    } finally {
      setTestLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    const key = requireApiKey();
    if (!key) return;

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
      "Memeriksa kesesuaian target durasi...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setLoadingStep(steps[i]);
        i++;
      }
    }, 4500);

    try {
      const resolvedProvId = provider === "nine_router" ? "custom" : provider;
      const extraCombined = [
        extraNotes,
        selectedKeywords.length > 0
          ? `\n\n[KEYWORD SEO YOUTUBE YANG DIREKOMENDASIKAN]: ${selectedKeywords.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("");

      const res = await callApi({
        path: "/api/analyze",
        method: "POST",
        apiKey: key,
        providerMode: provider === "google_ai_studio" ? "google" : "openai_compatible",
        body: {
          youtube_url: useManual ? null : youtubeUrl,
          manual_transcript: useManual ? manualTranscript : null,
          channel_dna: channelDna,
          output_type_id: outputType,
          duration_id: duration,
          shot_count: outputType === "shorts" ? shotCount : null,
          provider_id: resolvedProvId,
          model,
          api_key: key,
          base_url: baseUrl,
          request_timeout: timeout,
          extra_notes: extraCombined,
        },
        timeoutMs: (timeout + 30) * 1000,
      });

      clearInterval(interval);
      const data = await res.json();

      if (res.ok) {
        setResult(data);
        addToHistory(data.video_title, channelDna, outputType, data);
        toast.success("Analisis Video Berhasil diselesaikan!");
      } else {
        const msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        toast.error(msg || "Gagal melakukan analisis.");
      }
    } catch (err: any) {
      clearInterval(interval);
      const msg =
        err?.name === "AbortError"
          ? "Request timeout — backend lambat merespons."
          : "Gagal terhubung ke backend FastAPI.";
      toast.error(msg);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleGenerateTTS = async (textToSpeak: string) => {
    const key = requireApiKey();
    if (!key || !textToSpeak) return;
    try {
      const res = await callApi({
        path: "/api/tts",
        method: "POST",
        apiKey: key,
        providerMode: "openai_compatible",
        body: {
          text: textToSpeak,
          voice: "alloy",
          model: "tts-1",
          api_key: key,
          base_url: baseUrl,
          provider_id: provider,
        },
        timeoutMs: 120_000,
      });
      const data = await res.json();
      if (res.ok && data.status === "success") toast.success("Voiceover berhasil dibuat!");
      else toast.error(data.detail || "Gagal membuat suara.");
    } catch {
      toast.error("Gagal terhubung ke backend.");
    }
  };

  const handleGenerateImage = async (imagePrompt: string) => {
    const key = requireApiKey();
    if (!key || !imagePrompt) return;
    try {
      const res = await callApi({
        path: "/api/image",
        method: "POST",
        apiKey: key,
        providerMode: "openai_compatible",
        body: {
          prompt: imagePrompt,
          model: "dall-e-3",
          api_key: key,
          base_url: baseUrl,
          provider_id: provider,
        },
        timeoutMs: 180_000,
      });
      const data = await res.json();
      if (res.ok && data.status === "success") toast.success("Thumbnail berhasil dibuat!");
      else toast.error(data.detail || "Gagal membuat thumbnail.");
    } catch {
      toast.error("Gagal terhubung ke backend.");
    }
  };

  /* ────────────────────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────────────────────── */

  const ControlPanelBody = (
    <div className="flex flex-col gap-4">
      <Accordion
        multiple
        defaultValue={openModules}
        onValueChange={(v: any) => setOpenModules(v as string[])}
        className="flex flex-col gap-2"
      >
        {/* Module 1 — Channel DNA */}
        <AccordionItem value="dna" className="border-none">
          <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-sky-300 aria-expanded:text-sky-300">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 text-sky-400" />
              Channel DNA
            </span>
            <Badge variant="outline" className="ml-auto text-[10px] border-sky-400/30 text-sky-300">
              {DEFAULT_CHANNELS.find((c) => c.id === channelDna)?.name || channelDna}
            </Badge>
          </AccordionTrigger>
          <AccordionContent className="pb-0 pt-0">
            <div className={glassCard} ref={channelSectionRef}>
              <div className="grid grid-cols-3 gap-2">
                {DEFAULT_CHANNELS.map((ch) => {
                  const isSelected = channelDna === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setChannelDna(ch.id)}
                      className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${isSelected
                        ? "border-sky-400/60 bg-sky-500/10 shadow-inner"
                        : "border-white/10 bg-black/30 hover:bg-black/50"
                      }`}
                    >
                      <span className="text-2xl">{ch.emoji}</span>
                      <span
                        className={`text-[11px] font-semibold truncate max-w-full ${isSelected ? "text-sky-300" : "text-white"
                          }`}
                      >
                        {ch.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Analytics sub-panel */}
              <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-slate-400">Analytics CSV</label>
                  {analyticsExists && (
                    <button
                      onClick={handleDeleteAnalytics}
                      className="text-[10px] text-rose-400 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="size-3" /> Hapus
                    </button>
                  )}
                </div>

                {analyticsExists && analyticsSummary ? (
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-black/30 border border-white/10 p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-400">Avg CTR</div>
                      <div className="text-sm font-semibold text-emerald-400">
                        {analyticsSummary.avg_ctr_pct ? `${analyticsSummary.avg_ctr_pct}%` : "\u2014"}
                      </div>
                    </div>
                    <div className="bg-black/30 border border-white/10 p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-400">Avg Retention</div>
                      <div className="text-sm font-semibold text-sky-400">
                        {analyticsSummary.avg_retention_pct ? `${analyticsSummary.avg_retention_pct}%` : "\u2014"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center p-3 border border-dashed border-white/15 rounded-xl cursor-pointer hover:border-sky-400/50 text-[11px] text-slate-400">
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
          </AccordionContent>
        </AccordionItem>
        {/* Module 2 — Format & Target */}
        <AccordionItem value="format" className="border-none">
          <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-sky-300 aria-expanded:text-sky-300">
            <span className="flex items-center gap-1.5">
              <Sliders className="size-3.5 text-sky-400" />
              Format & Target
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-0 pt-0">
            <div className={glassCard} ref={formatSectionRef}>
              <div className="grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setOutputType("shorts")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${outputType === "shorts" ? "bg-sky-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                >
                  <Smartphone className="size-3.5" /> Shorts / Reels
                </button>
                <button
                  onClick={() => setOutputType("video_panjang")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${outputType === "video_panjang" ? "bg-sky-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                >
                  <MonitorPlay className="size-3.5" /> Long Form
                </button>
              </div>

              <div className="space-y-2 mt-3">
                <span className="text-[11px] text-slate-400 block">Target Durasi</span>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_DURATIONS.filter((d) => d.type === (outputType === "shorts" ? "shorts" : "long")).map((d) => {
                    const isSelected = duration === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setDuration(d.id)}
                        className={`px-3 py-1.5 text-[11px] rounded-lg border transition-all ${isSelected
                          ? "border-sky-400 bg-sky-500 text-white font-semibold shadow-sm"
                          : "border-white/10 bg-black/30 text-slate-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {outputType === "shorts" && (
                <div className="space-y-2 pt-3 mt-3 border-t border-white/10">
                  <span className="text-[11px] text-slate-400 block">Jumlah Shot / Hook Segmen</span>
                  <div className="flex gap-1.5">
                    {[3, 5, 7, 10, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => setShotCount(n)}
                        className={`flex-1 py-1.5 text-[11px] rounded-lg border transition-all ${shotCount === n
                          ? "border-sky-400 bg-sky-500/20 text-sky-300 font-semibold"
                          : "border-white/10 bg-black/30 text-slate-400 hover:text-white"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Module 3 — Provider / Model */}
        <AccordionItem value="provider" className="border-none">
          <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-sky-300 aria-expanded:text-sky-300">
            <span className="flex items-center gap-1.5">
              <Brain className="size-3.5 text-sky-400" />
              Provider & Model
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-0 pt-0">
            <div className="bg-black/30 border border-white/10 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Brain className="size-3.5 text-sky-400" />
                <span className="text-slate-400">Model:</span>
                <span className="font-semibold text-white">{model || "Combo-Maut"}</span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-[10px] text-sky-400 hover:underline font-semibold"
              >
                Ubah
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>
        {/* Module 4 — Source Input */}
        <AccordionItem value="source" className="border-none">
          <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-sky-300 aria-expanded:text-sky-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-sky-400" />
              Source Input
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-0 pt-0">
            <div className={glassCard} ref={inputSectionRef}>
              <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px]">
                <button
                  onClick={() => setUseManual(false)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${!useManual ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
                    }`}
                >
                  YouTube
                </button>
                <button
                  onClick={() => setUseManual(true)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${useManual ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
                    }`}
                >
                  Teks
                </button>
              </div>

              {!useManual ? (
                <div className="relative">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className={`${inputField} pl-9 h-11 text-xs`}
                  />
                  <Link2 className="absolute left-3 top-3.5 size-4 text-slate-500" />
                </div>
              ) : (
                <Textarea
                  placeholder="Tempel transkrip naskah sumber atau artikel di sini..."
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                  className={`${inputField} h-40 max-h-48 text-xs p-3 resize-y`}
                />
              )}

              <div className="space-y-2 mt-3">
                <label className="text-[11px] text-slate-400 block">Instruksi Tambahan (Opsional)</label>
                <Textarea
                  placeholder="cth: Fokuskan hook pada aspek psikologis; gaya bahasa puitis..."
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  className={`${inputField} h-[68px] text-xs resize-none p-2.5`}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        {/* Module 5 — Keywords / SEO */}
        <AccordionItem value="keywords" className="border-none">
          <AccordionTrigger className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-sky-300 aria-expanded:text-sky-300">
            <span className="flex items-center gap-1.5">
              <SearchIcon className="size-3.5 text-sky-400" />
              Keyword Assist
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-0 pt-0">
            <div className="space-y-2">
              <div className={`${inputField} px-3 flex items-center gap-2 h-10`}>
                <SearchIcon className="size-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Ketik topik kata kunci..."
                  value={keywordQuery}
                  onChange={(e) => setKeywordQuery(e.target.value)}
                  className="bg-transparent border-none text-xs w-full focus:outline-none text-white placeholder:text-slate-500"
                />
                {keywordLoading && <Loader2 className="size-3.5 animate-spin text-slate-400" />}
              </div>

              {keywordSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 max-h-[80px] overflow-y-auto">
                  {keywordSuggestions.map((kw, i) => (
                    <button
                      key={i}
                      onClick={() => toggleKeyword(kw)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${selectedKeywords.includes(kw)
                        ? "border-sky-400 bg-sky-500/20 text-sky-300 font-semibold"
                        : "border-white/10 bg-black/30 text-slate-400 hover:text-white"
                      }`}
                    >
                      {selectedKeywords.includes(kw) ? "✓ " : "+ "}
                      {kw}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Persistent Generate action */}
      <footer className="mt-2">
        <Button
          onClick={handleRunAnalysis}
          disabled={loading || (!useManual && !youtubeUrl) || (useManual && !manualTranscript)}
          className="w-full h-12 mt-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
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
      </footer>
    </div>
  );

  const CanvasBody = (
    <div className={`${glassCardLarge} flex-1 flex flex-col overflow-hidden`}>
      {result ? (
        <div className="max-w-5xl w-full mx-auto space-y-6 overflow-y-auto pr-1">
          <Tabs
            value={activeCanvasTab}
            onValueChange={setActiveCanvasTab}
            className="mb-4"
          >
            <TabsList className="bg-black/30 border border-white/10 p-1 rounded-xl grid grid-cols-3 gap-1 h-10">
              <TabsTrigger value="ringkasan" className="data-active:bg-sky-500/20 data-active:text-sky-300">
                <div className="flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  <span>Analisis</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="performa" className="data-active:bg-sky-500/20 data-active:text-sky-300">
                <div className="flex items-center gap-1.5">
                  <Activity className="size-3.5" />
                  <span>Timeline</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="strategi" className="data-active:bg-sky-500/20 data-active:text-sky-300">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5" />
                  <span>Settings</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <AnalysisResultPanel
            result={result}
            outputType={outputType}
            onGenerateTTS={handleGenerateTTS}
            onGenerateImage={handleGenerateImage}
            canvasTab={activeCanvasTab}
            onCanvasTabChange={setActiveCanvasTab}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/10 rounded-2xl min-h-[420px]">
          <div className="size-16 rounded-2xl bg-sky-500/10 text-sky-300 grid place-items-center mb-4 border border-sky-400/20 shadow-inner">
            <Clapperboard className="size-8 stroke-[1.75]" />
          </div>
          <h3 className="text-lg font-semibold text-white tracking-tight mb-1">Studio Canvas Siap Digunakan</h3>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            Pilih channel DNA, masukkan link YouTube atau transkrip di panel kontrol sebelah kiri, lalu klik{" "}
            <strong className="text-white">Generate Naskah Studio</strong> untuk menyusun naskah lengkap, visual shot, dan paket SEO CTR tinggi.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="text-[10px] border-white/15 text-slate-400 py-1 px-3">
              🔥 Auto Hook Shot-by-Shot
            </Badge>
            <Badge variant="outline" className="text-[10px] border-white/15 text-slate-400 py-1 px-3">
              🎯 SEO Package & CTR Tags
            </Badge>
            <Badge variant="outline" className="text-[10px] border-white/15 text-slate-400 py-1 px-3">
              ⚡ 9Router Multi-Model Support
            </Badge>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#05070c] text-slate-100">
      {/* ─── AMBIENT BACKGROUND (deep dark navy) ─── */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#05070c] pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
      </div>

      <Toaster
        position="top-center"
        theme="dark"
        richColors
        toastOptions={{
          style: {
            background: "#0c101d",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
          },
        }}
      />

      {/* ─── 1. DESKTOP SIDEBAR (glassmorphism panel) ─── */}
      <aside className="hidden md:flex w-72 flex-shrink-0 border-r border-white/10 bg-white/[0.03] backdrop-blur-2xl p-4 flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <SidebarNav
          activeTab={activeMenu}
          onSelectTab={(tab) => setActiveMenu(tab)}
          onNewAnalysis={() => {
            setActiveMenu("dashboard");
            setUseManual(false);
          }}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          historyCount={historyList.length}
          onClose={() => { }}
        />
      </aside>

      {/* ─── 2. CONTENT AREA (kanan) — 2-panel workspace: Input (380px) + Studio Canvas (flex-1) ─── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {activeMenu === "ffmpeg" ? (
          <div className="lg:col-span-12 space-y-4 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Activity className="size-5 text-amber-400" /> FFmpeg Peak Time Studio
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deteksi momen audio berenergi tinggi untuk ekstraksi hook video pendek viral.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveMenu("dashboard")}
                className="text-xs bg-black/30 border-white/10 text-white hover:bg-black/50"
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
          <>
            {/* Control Panel (lg:col-span-4) */}
            <section className="lg:col-span-4 flex flex-col">{ControlPanelBody}</section>

            {/* Studio Canvas (lg:col-span-8) */}
            <section className="lg:col-span-8 flex flex-col min-w-0">{CanvasBody}</section>
          </>
        )}
      </main>

      {/* ─── 3. MOBILE FLOATING HEADER + DRAWER ─── */}
      <header className="md:hidden fixed top-3 left-3 right-3 z-30 flex items-center justify-between h-12 px-3 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="size-9 rounded-xl bg-white/[0.04] border border-white/10 text-white"
          aria-label="Buka Menu"
        >
          <Menu className="size-4" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="size-7 grid place-items-center bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 text-white rounded-lg shadow-md">
            <Clapperboard className="size-3.5" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">
            SuaraAI <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">v3</span>
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsInputDrawerOpen(true)}
          className="size-9 rounded-xl bg-white/[0.04] border border-white/10 text-white"
          aria-label="Buka Panel Kontrol"
        >
          <Sliders className="size-4" />
        </Button>
      </header>

      {/* Mobile slide-up Drawer (Control Panel) */}
      <Sheet open={isInputDrawerOpen} onOpenChange={setIsInputDrawerOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#05070c]/95 backdrop-blur-2xl border-t border-white/10 text-white p-0 rounded-t-3xl max-h-[90vh] overflow-y-auto"
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-2" aria-hidden="true" />
          <SheetHeader className="px-5 pb-3">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Sliders className="size-4 text-sky-400" /> Panel Kontrol
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400">
              Channel DNA, format, dan sumber input. Tap di luar untuk menutup.
            </SheetDescription>
          </SheetHeader>
          <div className="px-5 pb-6">{ControlPanelBody}</div>
        </SheetContent>
      </Sheet>

      {/* Mobile Sidebar overlay */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-[280px] max-w-[85vw] h-full bg-black/60 backdrop-blur-2xl border-r border-white/10 shadow-2xl flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="size-8 grid place-items-center bg-gradient-to-tr from-sky-500 to-indigo-600 text-white rounded-lg">
                  <Clapperboard className="size-4" />
                </div>
                <span className="text-sm font-semibold text-white">SuaraAI</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="size-8 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/20"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarNav
                activeTab={activeMenu}
                onSelectTab={(tab) => {
                  setActiveMenu(tab);
                  setIsMobileSidebarOpen(false);
                }}
                onNewAnalysis={() => {
                  setActiveMenu("dashboard");
                  setUseManual(false);
                  setIsMobileSidebarOpen(false);
                }}
                onOpenHistory={() => {
                  setIsHistoryOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                onOpenSettings={() => {
                  setIsSettingsOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                historyCount={historyList.length}
                onClose={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}

      {/* ─── SETTINGS MODAL (Konfigurasi AI) ─── */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl w-full mx-auto bg-[#0c101d] border border-white/15 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="space-y-2 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Settings className="size-4 text-sky-400" /> Konfigurasi AI
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Pilih provider, masukkan API key, dan pilih model.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {/* Provider picker */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Pilih Provider AI</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS).map((p: any) => {
                  const isSelected = provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id)}
                      className={`relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[100px] ${isSelected
                          ? "border-sky-400/70 bg-sky-500/10 ring-1 ring-sky-400/40"
                          : "border-white/10 bg-black/30 hover:bg-black/50"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          {p.id === "nine_router" ? (
                            <Zap className="size-4 text-amber-400" />
                          ) : (
                            <Brain className="size-4 text-sky-400" />
                          )}
                          {p.label}
                        </div>
                        {isSelected && (
                          <div className="size-5 rounded-full bg-sky-500/20 text-sky-300 grid place-items-center shrink-0">
                            <Check className="size-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        {p.id === "nine_router"
                          ? "Server 9Router dengan banyak model premium, bisa pakai key bawaan."
                          : "Gunakan API Key pribadi dari Google AI Studio untuk akses Gemini langsung."}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Provider config card */}
            {(() => {
              const providers = apiSettings?.ai_provider?.providers || DEFAULT_PROVIDERS;
              const pInfo = providers.find((p: any) => p.id === provider);
              const requiresBaseUrl = pInfo
                ? pInfo.requires_base_url ?? provider === "nine_router"
                : provider === "nine_router";
              const modelList = pInfo?.models || [];

              return (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      {provider === "nine_router" ? (
                        <Zap className="size-4 text-amber-400" />
                      ) : (
                        <Brain className="size-4 text-sky-400" />
                      )}
                      Konfigurasi {pInfo?.label || provider}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testLoading}
                      className="rounded-xl px-3 h-9 text-xs bg-black/30 border-white/15 text-white hover:bg-black/50"
                    >
                      {testLoading ? (
                        <Loader2 className="size-3.5 animate-spin text-sky-400" />
                      ) : (
                        <Activity className="size-3.5 text-sky-400" />
                      )}
                      <span className="ml-1.5">Tes Koneksi</span>
                    </Button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-3 rounded-xl text-xs border ${testResult.ok
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : "border-rose-400/30 bg-rose-500/10 text-rose-300"
                        }`}
                    >
                      <span className="font-semibold">
                        {testResult.ok ? "✓ Koneksi Online" : "✗ Koneksi Gagal"}:
                      </span>
                      <span className="ml-2">{testResult.message}</span>
                    </div>
                  )}

                  {/* Info endpoint + header — eksplisit per provider, tidak membingungkan lagi */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-slate-300">
                      {provider === "google_ai_studio"
                        ? "→ generativelanguage.googleapis.com/v1beta"
                        : `→ ${(baseUrl || "https://ai.sahru.my.id/v1").replace(/\/+$/, "")}/chat/completions`}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-black/40 border border-emerald-400/20 text-emerald-300">
                      {provider === "google_ai_studio" ? "x-goog-api-key" : "Authorization: Bearer"}
                    </span>
                    {provider !== "google_ai_studio" && (
                      <span className="px-2 py-1 rounded-lg bg-black/40 border border-emerald-400/20 text-emerald-300">
                        x-api-key
                      </span>
                    )}
                  </div>

                  {requiresBaseUrl && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Endpoint API
                      </label>
                      <Input
                        type="text"
                        placeholder="https://ai.sahru.my.id/v1"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        className={`${inputField} h-11 text-xs`}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {provider === "google_ai_studio" ? "Gemini API Key" : "API Key"}
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                      <Input
                        type="password"
                        placeholder={provider === "google_ai_studio" ? "AlzaSy..." : "Masukkan API Key"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className={`${inputField} h-11 text-xs pl-10`}
                      />
                    </div>
                    {provider === "google_ai_studio" && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Dapatkan API Key gratis di{" "}
                        <a
                          href="https://aistudio.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                        >
                          Google AI Studio <ExternalLink className="size-2.5 ml-0.5" />
                        </a>
                        . Key disimpan aman secara lokal.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {provider === "google_ai_studio" ? "Pilih Model Gemini" : "Pilih Model"}
                    </label>
                    <div className="space-y-2">
                      {modelList.map((m: any) => {
                        const mId = typeof m === "string" ? m : m.id;
                        const mLabel = typeof m === "string" ? m : m.label || m.id;
                        const mDesc =
                          typeof m === "object" && m.description ? m.description : null;
                        const isSelected = model === mId;
                        return (
                          <div
                            key={mId}
                            onClick={() => setModel(mId)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${isSelected
                                ? "border-sky-400/70 bg-sky-500/10 ring-1 ring-sky-400/30"
                                : "border-white/10 bg-black/30 hover:bg-black/50"
                              }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-white truncate">{mLabel}</div>
                              {mDesc && (
                                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{mDesc}</div>
                              )}
                            </div>
                            {isSelected && (
                              <div className="size-5 rounded-full bg-sky-500 text-white grid place-items-center shrink-0">
                                <Check className="size-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            </div>

            {/* Footer — keluar dari area scroll (selalu terlihat, tidak ikut geser) */}
            <div className="shrink-0 flex items-center justify-end gap-2 pt-4 mt-2 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
                className="h-10 rounded-xl px-5 text-xs bg-transparent border-white/15 text-white hover:bg-black/30"
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  setIsSettingsOpen(false);
                  toast.success("Pengaturan disimpan!");
                }}
                className="h-10 rounded-xl px-6 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20"
              >
                Simpan
              </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent
          side="right"
          className="w-[380px] sm:w-[480px] bg-[#0c101d]/95 backdrop-blur-2xl border-l border-white/10 text-white p-6 flex flex-col space-y-6"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <History className="size-5 text-sky-400" /> Riwayat Analisis
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400">
              Daftar analisis konten yang pernah dilakukan.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-3">
            {historyList.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">Belum ada riwayat analisis.</div>
            ) : (
              historyList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className="bg-black/30 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between text-xs hover:bg-black/50 cursor-pointer group"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-2">
                    <div className="font-semibold text-white truncate group-hover:text-sky-300 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-400">{item.timestamp}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteHistoryItem(item.id, e)}
                    className="h-7 w-7 text-slate-400 hover:text-rose-400"
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
