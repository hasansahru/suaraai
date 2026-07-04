"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Menggunakan URL direct backend Hugging Face yang valid
      const response = await fetch("https://suarafilsuf-suaraai-backend.hf.space/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          url: videoUrl,
          // Secara default kita set jumlah segmen rendah agar tidak terkena token limit error 500
          max_segments: 3 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error (Status ${response.status})`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      if (err.message.includes("Failed to fetch")) {
        setError("Gagal terhubung ke backend FastAPI. Pastikan server di Hugging Face sudah bangun.");
      } else {
        setError(`Analisis Gagal: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
        {/* Header Utama Tanpa Menu Login */}
        <header className="border-b bg-card px-6 py-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              SuaraAI
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-medium">Content Intelligence Pro</span>
          </nav>
        </header>

        {/* Konten Dashboard Analisis */}
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full grid gap-6 grid-cols-1">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Dashboard Analisis Video</CardTitle>
              <CardDescription>Masukkan URL YouTube untuk memulai intelijen konten secara otomatis.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalyze} className="flex gap-3 mb-6">
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="flex-1"
                  disabled={loading}
                  required
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Menganalisis..." : "Mulai Analisis"}
                </Button>
              </form>

              {/* Tampilan Error */}
              {error && (
                <div className="p-4 mb-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Tempat Merender Hasil Analisis */}
              {result && (
                <div className="p-4 border rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                  <h3 className="font-bold text-base mb-2 text-primary">Hasil Intelijen Konten:</h3>
                  {JSON.stringify(result, null, 2)}
                </div>
              )}

              {!result && !loading && !error && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada data analisis. Tempel tautan video Anda di atas.
                </p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
