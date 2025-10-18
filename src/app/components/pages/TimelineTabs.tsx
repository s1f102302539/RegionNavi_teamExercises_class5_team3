'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type TimelineTabsProps = {
  side: 'left' | 'right';
};

export default function TimelineTabs({ side }: TimelineTabsProps) {
  const searchParams = useSearchParams();
  // sideに応じて 'left_tab' または 'right_tab' の値を取得
  const currentTab = searchParams.get(`${side}_tab`) || 'all';

  const tabs = [
    { key: 'all', label: 'すべて' },
    { key: 'following', label: 'フォロー中' },
    { key: 'official', label: '公式' },
    { key: 'quiz', label: 'ピックアップ' },
  ];

  // 既存のURLクエリを維持しつつ、新しいクエリを追加/更新するヘルパー関数
  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    return params.toString();
  };

  const baseClasses = "px-4 py-3 text-center font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200";
  const activeClasses = "border-b-2 border-blue-500 text-blue-600";
  const inactiveClasses = "border-b-2 border-transparent";

  return (
    <div className="flex border-b border-gray-200 mb-4">
      {tabs.map(tab => (
        <Link
          key={tab.key}
          href={`?${createQueryString(`${side}_tab`, tab.key)}`}
          scroll={false} // ページ遷移時にスクロール位置をリセットしない
          className={`${baseClasses} ${currentTab === tab.key ? activeClasses : inactiveClasses}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}