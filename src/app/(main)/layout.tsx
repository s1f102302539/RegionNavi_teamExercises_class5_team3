import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
// ★ 修正: サイドバーのインポートを削除
// import SideNavLeft from "@/app/components/layouts/SideNavLeft";
// import SideNavRight from "@/app/components/layouts/SideNavRight";

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "REReNAVI",
  description: "RERENAVI - 地方の魅力を楽しく知れるプラットフォーム",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      {/* ★ 修正: ここにあったサイドバーやレイアウト構造(div)を削除し、childrenのみを表示 */}
      {children}
    </div>
  );
}