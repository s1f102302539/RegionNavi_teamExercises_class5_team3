import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
// ★ 追加: デイリークイズモーダルをインポート
import DailyQuizModal from "@/app/components/features/quiz/DailyQuizModal";

// サイドバーのインポートは削除されたまま（HomePageController等で制御されているためOK）
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
      {/* ★ ここに追加: これでログイン後の全画面でデイリークイズ判定が動きます */}
      <DailyQuizModal />

      {/* ★ 修正: ここにあったサイドバーやレイアウト構造(div)を削除し、childrenのみを表示 */}
      {children}
    </div>
  );
}