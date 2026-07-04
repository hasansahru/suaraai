"use client";

import React from "react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header / Navigasi Tanpa Menu Login */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            SuaraAI
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Content Intelligence Pro</span>
        </nav>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid gap-6 grid-cols-1 md:grid-cols-4">
        <div className="md:col-span-4 p-4 border rounded-xl bg-card">
          <h2 className="text-lg font-semibold mb-2">Dashboard Analisis Video</h2>
          <p className="text-sm text-muted-foreground">
            Silakan masukkan URL YouTube pada fitur analisis untuk memulai intelijen konten.
          </p>
        </div>
      </main>
    </div>
  );
}
