import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Plus Jakarta Sans: clean, modern, premium — cocok untuk AI tools & dashboards
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "SuaraAI Studio",
  description: "Reverse engineer YouTube strategies generate original content packages with AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#07090e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${spaceMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-[#07090e] text-foreground font-sans">
        {/* ─── Ambient Dynamic Blurs (latar melayang futuristik) ─────────────
             Diset -z-10 + pointer-events-none agar tidak mengganggu klik. */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 overflow-hidden bg-[#07090e]"
        >
          {/* Orb 1 — Indigo besar pojok kiri-atas */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none animate-float-slow" />
          {/* Orb 2 — Cyan sedang pojok kanan-bawah */}
          <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
          {/* Orb 3 — Aksen halus ungu untuk kedalaman (tambahan, opsional) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-700/[0.04] rounded-full blur-[160px] pointer-events-none" />
        </div>

        {children}
        <Toaster />
      </body>
    </html>
  );
}
