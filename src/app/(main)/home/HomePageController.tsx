'use client';

import { useState, useEffect, ReactNode, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import SideNavLeft from '@/app/components/layouts/SideNavLeft';
import SideNavRight from '@/app/components/layouts/SideNavRight';

// 各ページコンポーネントのインポート
import StampRallyPage from '@/app/components/pages/StampRallyPage';
import QuizTopPage from '@/app/components/pages/QuizTopPage';
import SearchPage from '@/app/components/pages/SearchPage';
import CreatePostForm from '@/app/components/pages/CreatePostForm';
import MypageEditPage from '@/app/components/pages/MypageEditPage';
import PrefectureQuizPage from '@/app/components/pages/QuizChallengePage';
import QuizCalendarPage from '@/app/components/pages/QuizCalendarPage';
import MyPage from '@/app/components/pages/MyPage';
import BookmarksPage from '@/app/components/pages/BookmarksPage';
import TimelineTabs from '@/app/components/pages/TimelineTabs';
import QuizEventComponent from '@/app/components/pages/QuizEvent';
import FollowList from '@/app/components/pages/FollowList'; // ★ 追加

const componentMap: { [key: string]: React.ComponentType<any> } = {
  stamprally: StampRallyPage,
  quiz: QuizTopPage,
  search: SearchPage,
  post: CreatePostForm,
  'mypage-edit': MypageEditPage,
  'quiz-calendar': QuizCalendarPage,
  'bookmarks': BookmarksPage,
  'event': QuizEventComponent,
};

const getComponent = (
  viewKey: string | null,
  timelineComponent: React.ReactNode,
  currentUser: User | null,
  targetUserId: string | null,
  side: 'left' | 'right',
  followType: string | null // ★ 追加
): React.ReactNode => {
  // 'home' (タイムライン) が表示される場合に、タブUIも一緒に出力する
  if (!viewKey || viewKey === 'home') {
    return (
      <>
        <TimelineTabs side={side} />
        {timelineComponent}
      </>
    );
  }
  
  // 自分のマイページ
  if (viewKey === 'mypage') {
    if (currentUser) return <MyPage userId={currentUser.id} side={side} />;
    return timelineComponent;
  }
  
  // 他人のプロフィール
  if (viewKey === 'userprofile' && targetUserId) {
    return <MyPage userId={targetUserId} side={side} />;
  }

  // ★ 追加: フォロー・フォロワーリストの表示ロジック
  if (viewKey === 'follow-list' && targetUserId && followType) {
    return (
      <FollowList 
        userId={targetUserId} 
        type={followType as 'followers' | 'following'} 
        side={side} 
      />
    );
  }

  if (viewKey.startsWith('quiz-') && viewKey !== 'quiz-calendar') {
    return <PrefectureQuizPage side={side} />;
  }

  const Component = componentMap[viewKey];
  if (!Component) {
    return timelineComponent;
  }
  
  return <Component side={side} />;
};

const DuplicateViewError = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-yellow-100 rounded-2xl border-2 border-dashed border-yellow-400">
    <h2 className="text-2xl font-bold text-yellow-800">おっと！</h2>
    <p className="text-yellow-700 mt-2">左右の画面で同じページは表示できません。</p>
  </div>
);

interface HomePageControllerProps {
  leftTimeline: ReactNode;
  rightTimeline: ReactNode;
}

export default function HomePageController({ leftTimeline, rightTimeline }: HomePageControllerProps) {
  const params = useSearchParams();
  const leftView = params.get('left') || 'home';
  const rightView = params.get('right') || 'stamprally';
  const targetUserId = params.get('userId');
  const followType = params.get('type'); // ★ 追加: URLからtypeパラメータを取得

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, [supabase]);

  const LeftComponent = getComponent(leftView, leftTimeline, currentUser, targetUserId, 'left', followType);
  const RightComponent = getComponent(rightView, rightTimeline, currentUser, targetUserId, 'right', followType);

  // 重複エラーの条件から follow-list も除外しておく
  const isDuplicate = leftView === rightView && leftView !== 'userprofile' && leftView !== 'follow-list';

  return (
    <div className="flex h-screen w-full bg-yellow-50">
      <SideNavLeft />
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 lg:gap-5">
        
        <div className="col-span-1 h-screen overflow-y-auto p-4 sm:p-6 lg:p-8">
          {leftView === 'home' ? (
            <Suspense fallback={<p className="text-center mt-8">読み込み中...</p>}>
              {LeftComponent}
            </Suspense>
          ) : (
            LeftComponent
          )}
        </div>

        <div className="hidden lg:block col-span-1 h-screen overflow-y-auto p-4 sm:p-6 lg:p-8 border-l-2 border-yellow-200">
          {isDuplicate ? <DuplicateViewError /> : (
            rightView === 'home' ? (
              <Suspense fallback={<p className="text-center mt-8">読み込み中...</p>}>
                {RightComponent}
              </Suspense>
            ) : (
              RightComponent
            )
          )}
        </div>
      </div>
      
      <div className="hidden lg:block">
        <SideNavRight />
      </div>
    </div>
  );
}

