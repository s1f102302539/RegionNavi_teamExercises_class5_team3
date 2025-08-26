'use client'; // このコンポーネントがクライアント側で動作することを明示

import { useState, useEffect } from 'react';
import SideNav from "@/app/components/layouts/SideNav";
import BookLoadingScreen from '@/app/components/layouts/BookLoadingScreen';

export default function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ページの読み込みが完了したと仮定して、3.5秒後にローディングを終了
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <BookLoadingScreen isLoading={isLoading} />

      <div className="flex h-screen">
        <SideNav />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
}