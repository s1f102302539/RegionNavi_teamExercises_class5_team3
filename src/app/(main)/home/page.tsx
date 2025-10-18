import { Suspense } from 'react';
import Timeline from '@/app/components/features/timeline/Timeline';
import HomePageController from './HomePageController';

export const dynamic = 'force-dynamic';

// searchParamsを受け取れるようにシグネチャを変更
export default function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // 左右のタイムライン用のタブ情報をURLクエリから取得。なければ 'all' をデフォルトに。
  const leftTab = typeof searchParams.left_tab === 'string' ? searchParams.left_tab : 'all';
  const rightTab = typeof searchParams.right_tab === 'string' ? searchParams.right_tab : 'all';

  return (
    <HomePageController
      // Timelineコンポーネントに取得したタブ情報を `tab` propとして渡す
      leftTimeline={<Timeline side="left" tab={leftTab} />}
      rightTimeline={<Timeline side="right" tab={rightTab} />}
    />
  );
}