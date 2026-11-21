
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Geist } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";
import LocaleShell from "@/components/LocaleShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteName = "MONSTER ARCHIVE";

const siteDescription =
  "An independent, fan-made archive dedicated to BABYMONSTER. Explore member profiles, performances, music videos, and memorable moments from every era.";

const socialImage = "/og-image.jpg";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.themonsterarchive.com"),

  title: {
    default: "MONSTER ARCHIVE | BABYMONSTER Fan Archive",
    template: "%s | MONSTER ARCHIVE",
  },

  description: siteDescription,

  applicationName: siteName,
  creator: siteName,
  publisher: siteName,
  category: "Entertainment",

  openGraph: {
    type: "website",
    url: "https://www.themonsterarchive.com",
    siteName,
    title: "MONSTER ARCHIVE | BABYMONSTER Fan Archive",
    description: siteDescription,
    locale: "en_US",
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "MONSTER ARCHIVE — Every Era. Every Stage. Every Memory.",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "MONSTER ARCHIVE | BABYMONSTER Fan Archive",
    description: siteDescription,
    images: [socialImage],
  },
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
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<LayoutFallback />}>
          <LocaleShell>{children}</LocaleShell>
        </Suspense>
      </body>
    </html>
  );
}
