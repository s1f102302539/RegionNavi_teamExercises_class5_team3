import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import SideNav from "@/app/components/layouts/SideNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// サーバーコンポーネントなので metadata をエクスポートできる
export const metadata: Metadata = {
  title: "RERENAVI",
  description: "RERENAVI - 地方の魅力を楽しく知れるプラットフォーム",
};

// UI構造は持たず、子要素をそのまま表示するだけのシンプルな作りにします。
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}