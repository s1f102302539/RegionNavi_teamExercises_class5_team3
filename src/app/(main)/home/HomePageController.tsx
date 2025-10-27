'use client';

import { useState, useEffect, ReactNode, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

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
  side: 'left' | 'right'
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
  if (viewKey === 'mypage') {
    if (currentUser) return <MyPage userId={currentUser.id} side={side} />;
    return timelineComponent;
  }
  if (viewKey === 'userprofile' && targetUserId) {
    return <MyPage userId={targetUserId} side={side} />;
  }
  if (viewKey.startsWith('quiz-') && viewKey !== 'quiz-calendar') {
    // PrefectureQuizPageにもsideを渡す
    return <PrefectureQuizPage side={side} />;
  }
  const Component = componentMap[viewKey];
  if (!Component) {
    return timelineComponent;
  }
  // componentMapから取得したコンポーネントにもsideを渡す
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

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, [supabase]);

  const LeftComponent = getComponent(leftView, leftTimeline, currentUser, targetUserId, 'left');
  const RightComponent = getComponent(rightView, rightTimeline, currentUser, targetUserId, 'right');

  const isDuplicate = leftView === rightView;

  return (
    <div className="flex h-screen w-full bg-yellow-50">
      
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
      
     
    </div>
  );
}

