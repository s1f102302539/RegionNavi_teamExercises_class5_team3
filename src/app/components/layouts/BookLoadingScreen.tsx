'use client';
import { useState, useEffect } from 'react';

export default function BookLoadingScreen({ isLoading }: { isLoading: boolean }) {
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // ローディングが始まったらアニメーションを開始
      setStartAnimation(true);
    }
  }, [isLoading]);

  if (!isLoading && !startAnimation) return null;

  return (
    // ローディング画面全体
    <div className={`fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 ${startAnimation ? 'animate-fade-out' : ''}`}>
      <div className="book-container w-[200px] h-[280px] md:w-[300px] md:h-[420px]">
        {/* 本全体 */}
        <div className="relative w-full h-full transform-style-preserve-3d">
          
          {/* 裏表紙 (静的) */}
          <div className="absolute w-full h-full bg-yellow-600 rounded-r-lg shadow-2xl"></div>
          
          {/* 1枚目のページ */}
          <div className={`absolute w-full h-full bg-yellow-50 origin-left transform-style-preserve-3d rounded-r-lg ${startAnimation ? 'animate-flip-page-2' : ''}`}>
             <div className="p-8 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-gray-700">RERENAVI</h2>
                <p className="mt-4 text-gray-600">埼玉の魅力、再発見</p>
            </div>
          </div>
          
          {/* 2枚目のページ */}
          <div className={`absolute w-full h-full bg-yellow-50 origin-left transform-style-preserve-3d rounded-r-lg ${startAnimation ? 'animate-flip-page-1' : ''}`}>
            <div className="p-8 text-center flex flex-col justify-center items-center h-full">
                <p className="text-4xl md:text-6xl">📖</p>
                <p className="mt-4 font-semibold text-gray-700">読み込み中...</p>
            </div>
          </div>

          {/* 表紙 */}
          <div className={`absolute w-full h-full bg-yellow-500 origin-left transform-style-preserve-3d rounded-lg flex flex-col items-center justify-center p-4 shadow-2xl ${startAnimation ? 'animate-open-book' : ''}`}>
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center font-bold text-yellow-500 text-5xl shadow-inner">
              R
            </div>
            <h1 className="text-white text-2xl md:text-4xl font-bold mt-4">RERENAVI</h1>
          </div>
          
        </div>
      </div>
    </div>
  );
}