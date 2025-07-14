import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RERENAVI",
  description: "仮のSNSページ",
};

// 共通要素の定義

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {/* ヘッダー */}
        <header className="bg-gray-100 py-4 shadow-md">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold">RERENAVI</h1>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="container mx-auto px-4 py-8 flex-1">
          {children}
        </main>

        {/* フッター */}
        <footer className="bg-gray-100 py-4 text-center text-sm text-gray-500">
          &copy; 2025 RERENAVI. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
