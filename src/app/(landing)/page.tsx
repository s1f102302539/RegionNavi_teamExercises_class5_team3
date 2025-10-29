'use client'; 

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import "../globals.css";
import LoadingScreen from '@/app/components/LoadingScreen';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); 

    const contentTimer = setTimeout(() => {
      setIsContentVisible(true);
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(contentTimer);
    };
  }, []);

  return (
    <>
      <LoadingScreen isVisible={isLoading} />

      <main className="relative min-h-screen flex flex-col lg:flex-row w-full items-center justify-between px-6 md:px-12 lg:px-24 py-12 overflow-hidden">
        {/* 背景画像とオーバーレイ */}
        <div className="absolute inset-0 -z-10">
         {/* ▼▼▼ ここを <video> タグに置き換える ▼▼▼ */}
               <video
            autoPlay // 自動再生
            loop // ループ再生
            muted // ミュート (自動再生に必須)
            playsInline // iPhoneで全画面再生になるのを防ぐ
            className="w-full h-full object-cover" // 画像と同じスタイルを適用
          >
            {/* .webm を優先的に読み込み、非対応なら .mp4 を読み込む */}
            <source src="/top_background.webm" type="video/webm" />
            お使いのブラウザは動画の再生に対応していません。
          </video>
          {/* ▲▲▲ ここまで ▲▲▲ */}

          {/* オーバーレイは動画の上にも残します (テキストの可読性のため) */}
          <div className="absolute inset-0 bg-yellow-400/85"></div>
        </div>

        {/* 左カラム：キャッチフレーズとボタン */}
        <div
          className={`flex flex-col items-start text-left text-gray-800 z-10 mb-16 lg:mb-0 w-full lg:w-1/2 transition-opacity duration-1000 ${
            isContentVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">「地方の魅力」を</h1>
          <p className="mt-2 text-2xl md:text-3xl lg:text-4xl">楽しく知れるプラットフォーム。</p>
          
          {/* [修正] legacyBehaviorを削除し、classNameをLinkコンポーネントに直接適用 */}
          <div className="mt-8 lg:mt-10 flex flex-col sm:flex-row gap-4 w-full">
            <Link 
              href="/signup"
              className="text-center rounded-full bg-white px-8 md:px-12 py-3 md:py-4 text-lg md:text-xl font-bold text-gray-800 shadow-lg transition hover:bg-gray-50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              新規登録
            </Link>
            <Link 
              href="/login"
              className="text-center rounded-full bg-[#00A968] px-8 md:px-12 py-3 md:py-4 text-lg md:text-xl font-bold text-white shadow-lg transition hover:bg-[#008f58] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#00A968]"
            >
              ログイン
            </Link>
          </div>
        </div>

        {/* 右カラム：ロゴテキストと回転画像 */}
        <div
          className={`relative flex items-center justify-center z-10 w-full lg:w-1/2 aspect-square max-w-[600px] lg:max-w-[800px] transition-opacity duration-1000 ${
            isContentVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
            <Image
              src="/logo_circle.png"
              alt="回転するロゴ"
              fill
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 800px"
              className="object-contain"
            />
          </div>
        </div>
      </main>
    </>
  );
}
