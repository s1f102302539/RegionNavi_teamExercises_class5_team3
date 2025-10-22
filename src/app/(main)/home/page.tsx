import { Suspense } from 'react';
import Timeline from '@/app/components/features/timeline/Timeline';
import HomePageController from './HomePageController';

export const dynamic = 'force-dynamic';

// searchParamsを受け取れるようにシグネチャを変更
export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Next.js requires awaiting dynamic route/search params before accessing properties.
  // Awaiting a local value is safe and satisfies the runtime check.
  const params = await Promise.resolve(searchParams);

  // 左右のタイムライン用のタブ情報をURLクエリから取得。なければ 'all' をデフォルトに。
  const leftTab = typeof params.left_tab === 'string' ? params.left_tab : 'all';
  const rightTab = typeof params.right_tab === 'string' ? params.right_tab : 'all';

  return (
    <HomePageController
      // Timelineコンポーネントに取得したタブ情報を `tab` propとして渡す
      leftTimeline={<Timeline side="left" tab={leftTab} />}
      rightTimeline={<Timeline side="right" tab={rightTab} />}
    />
  );
}