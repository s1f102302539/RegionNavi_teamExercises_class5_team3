import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// アプリ全体の基本フォントとしてNoto Sans JPを指定
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RERENAVI - 地方の魅力を楽しく知れるプラットフォーム",
  description: "RERENAVIへようこそ！地方の魅力をクイズやSNSで楽しく発見しよう。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* ここに<html>と<body>タグを記述します。
        フォントクラスはここに適用します。
      */}
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}