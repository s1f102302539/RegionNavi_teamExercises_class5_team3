import { Suspense } from 'react';
import Timeline from '@/app/components/features/timeline/Timeline'; // サーバーコンポーネント
import HomePageClient from './HomePageController'; // 先ほど作成したクライアントコンポーネント
import HomePageController from './HomePageController';

// こちらが新しいページの本体（サーバーコンポーネント）です
// 'use client' は付けません
export default function Page() {
  // ★ Suspenseを削除し、純粋なTimelineコンポーネントのインスタンスを渡す
  return (
    <HomePageController
      // 左窓用と右窓用のTimelineを、それぞれpropsとして渡す
      leftTimeline={<Timeline side="left" />}
      rightTimeline={<Timeline side="right" />}
    />
  );
}