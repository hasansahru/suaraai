"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, UserPlus, Eye, EyeOff, Sparkles, Brain } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://suarafilsuf-suaraai-backend.hf.space";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Jika sudah login, redirect ke dashboard
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Verifikasi token masih valid
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => {
          if (r.ok) router.replace("/");
        })
        .catch(() => {});
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body: Record<string, string> = { username, password };
      if (mode === "register" && displayName) {
        body.display_name = displayName;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Terjadi kesalahan.");
      }

      // Simpan token & user info
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      // Redirect ke dashboard
      router.replace("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a12]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(120, 60, 255, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(60, 180, 255, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 80%, rgba(200, 60, 255, 0.06) 0%, transparent 50%)
            `,
            animation: "pulse 8s ease-in-out infinite alternate",
          }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Login Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        style={{ animation: "fadeInUp 0.6s ease-out both" }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 mb-4">
            <Brain className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            AI Content Intelligence
          </h1>
          <p className="text-sm text-white/40 mt-1">
            YouTube Strategy & Content Generator
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/[0.08] p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(24px) saturate(1.2)",
            boxShadow: "0 32px 64px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Tab switch */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "login"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <LogIn className="size-4" />
              Masuk
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "register"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <UserPlus className="size-4" />
              Daftar
            </button>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                autoFocus
                className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
              />
            </div>

            {/* Display Name (register only) */}
            {mode === "register" && (
              <div className="space-y-1.5" style={{ animation: "fadeInUp 0.3s ease-out both" }}>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Nama Tampilan
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama yang ditampilkan"
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                />
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  minLength={4}
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "login" ? "Sedang masuk..." : "Mendaftarkan..."}
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  {mode === "login" ? "Masuk ke Dashboard" : "Daftar & Masuk"}
                </>
              )}
            </button>
          </form>

          {/* Default credentials hint */}
          {mode === "login" && (
            <div className="mt-5 pt-4 border-t border-white/[0.06] text-center">
              <p className="text-[11px] text-white/25">
                Akun default: <span className="text-white/40 font-mono">admin</span> / <span className="text-white/40 font-mono">admin123</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/15 mt-6">
          AI YouTube Content Intelligence Pro &copy; 2024
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1.05) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}
