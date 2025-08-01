import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "../globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RERENAVI - 地方の魅力を楽しく知れるプラットフォーム",
  description: "RERENAVIへようこそ！",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}