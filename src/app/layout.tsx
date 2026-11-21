
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";
import LocaleShell from "@/components/LocaleShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MONSTER ARCHIVE | BABYMONSTER Fan Archive",
  description:
    "A global independent fan archive dedicated to BABYMONSTER. Discover performances, videos, members and unforgettable moments.",
};

function LayoutFallback() {
  return (
    <div className="min-h-screen bg-[#08090d]">
      <div className="h-20 border-b border-white/10" />

      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="h-10 w-64 animate-pulse rounded bg-white/5" />
        <div className="mt-6 h-5 w-96 max-w-full animate-pulse rounded bg-white/5" />
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<LayoutFallback />}>
          <LocaleShell>{children}</LocaleShell>
        </Suspense>
      </body>
    </html>
  );
}
