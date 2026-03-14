import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  metadataBase: new URL("https://notify-7xs6.vercel.app"),
  title: "Notify | Intelligent Schedule Assistant",
  description: "Professional schedule management and deadline tracking for academic cohorts.",
  applicationName: "Notify",
  authors: [{ name: "Notify Development Team" }],
  keywords: ["academic", "schedule", "deadline", "tracker", "AI assistant", "university"],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Notify",
    description: "Professional schedule management and deadline tracking.",
    url: "https://notify-7xs6.vercel.app",
    siteName: "Notify",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <div className="min-h-screen">
          {children}
        </div>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
