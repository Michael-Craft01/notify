import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Notify | Deadline Warden",
  description: "Eliminate Assignment Amnesia",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[var(--color-background)] text-[var(--color-text-main)] antialiased`}>
        <div className="mx-auto max-w-md min-h-screen bg-[var(--color-surface)] shadow-xl sm:border-x sm:border-[var(--color-surface-hover)]">
          {children}
        </div>
      </body>
    </html>
  );
}
