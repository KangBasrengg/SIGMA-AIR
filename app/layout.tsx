import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SIGMA AIR",
  description: "Sistem Informasi Genangan, Monitoring, dan Analisis Air real-time untuk Indonesia.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#0e7490",
  width: "device-width",
  initialScale: 1
};

import PwaInstallPrompt from "@/Components/PwaInstallPrompt";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={inter.variable}>
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
