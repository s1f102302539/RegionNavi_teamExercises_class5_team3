import { Suspense } from 'react';
import Timeline from '@/app/components/features/timeline/Timeline'; // サーバーコンポーネント
import HomePageClient from './HomePageController'; // 先ほど作成したクライアントコンポーネント

// こちらが新しいページの本体（サーバーコンポーネント）です
// 'use client' は付けません
export default function Page() {
  
  // 1. サーバーサイドでTimelineコンポーネントを生成する
  const timelineComponent = (
    <Suspense fallback={<p className="text-center mt-8">タイムラインを読み込み中...</p>}>
      {/* @ts-ignore Async Server Component */}
      <Timeline />
    </Suspense>
  );

  // 2. クライアントコンポーネントに、propsとしてサーバーコンポーネントを渡す
  return (
    <HomePageClient timelineComponent={timelineComponent} />
  );
}