import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import SideNavLeft from "@/app/components/layouts/SideNavLeft";
import SideNavRight from "@/app/components/layouts/SideNavRight";

export const dynamic = 'force-dynamic';

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
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      <div className="min-h-screen flex items-stretch">
        <SideNavLeft />
        <main className="flex-1">
          {children}
        </main>
        <div className="hidden lg:flex h-screen items-stretch">
          <SideNavRight />
        </div>
      </div>
    </div>
  );
}