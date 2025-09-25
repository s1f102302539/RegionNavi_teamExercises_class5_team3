'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SideNavLeft from '@/app/components/layouts/SideNavLeft';
import SideNavRight from '@/app/components/layouts/SideNavRight';
import { createClient } from '@/lib/supabase/client'; // ★ 2. Supabaseクライアントを追加
import type { User } from '@supabase/supabase-js'; // ★ 3. User型を追加

// ページコンポーネントのインポート
import StampRallyPage from '@/app/components/pages/StampRallyPage';
import QuizTopPage from '@/app/components/pages/QuizTopPage';
import SearchPage from '@/app/components/pages/SearchPage';
import CreatePostForm from '@/app/components/pages/CreatePostForm';
import MypageEditPage from '@/app/components/pages/MypageEditPage';
// クイズ挑戦ページのインポート (ファイル名がQuizChallengePage.tsxであると仮定)
import PrefectureQuizPage from '@/app/components/pages/QuizChallengePage';
// ★ 1. QuizCalendarPageをインポート
import QuizCalendarPage from '@/app/components/pages/QuizCalendarPage';
import MyPage from '@/app/components/pages/MyPage'; // ★ 4. 作成したMypageをインポート

const componentMap: { [key: string]: React.ComponentType<any> } = {
  stamprally: StampRallyPage,
  quiz: QuizTopPage,
  search: SearchPage,
  post: CreatePostForm,
  'mypage-edit': MypageEditPage,
  'quiz-calendar': QuizCalendarPage,
};

// getComponent関数を修正
// ★ 修正: paneプロパティやcloneElementを必要としないシンプルな構造に戻す
const getComponent = (
  viewKey: string | null, 
  timelineComponent: React.ReactNode,
  currentUser: User | null,
  targetUserId: string | null
): React.ReactNode => {
  if (!viewKey || viewKey === 'home') {
    return <>{timelineComponent}</>;
  }

  if (viewKey === 'mypage') {
    if (currentUser) {
      // paneプロパティは不要
      return <MyPage userId={currentUser.id} />;
    }
    return <>{timelineComponent}</>;
  }

  if (viewKey === 'userprofile' && targetUserId) {
    // paneプロパティは不要
    return <MyPage userId={targetUserId} />;
  }
  
  const Component = componentMap[viewKey];
  
  if (!Component) {
    return <>{timelineComponent}</>;
  }
  // paneプロパティは不要
  return <Component />;
};


const DuplicateViewError = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-yellow-100 rounded-2xl border-2 border-dashed border-yellow-400">
    <h2 className="text-2xl font-bold text-yellow-800">おっと！</h2>
    <p className="text-yellow-700 mt-2">左右の画面で同じページは表示できません。</p>
  </div>
);

export default function HomePageClient({ timelineComponent }: { timelineComponent: React.ReactNode }) {
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

  const LeftComponent = getComponent(leftView, timelineComponent, currentUser, targetUserId);
  const RightComponent = getComponent(rightView, timelineComponent, currentUser, targetUserId);

  const isDuplicate = leftView === rightView;

  return (
    <div className="flex h-screen w-full bg-yellow-50">
      <SideNavLeft />
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 lg:gap-5">
        
        <div className="col-span-1 h-screen overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* ★ そのままコンポーネントを配置する */}
          {LeftComponent}
        </div>
        
        <div className="hidden lg:flex col-span-1 h-screen overflow-y-auto p-4 sm:p-6 lg:p-8 border-l-2 border-yellow-200">
          {isDuplicate ? <DuplicateViewError /> : RightComponent}
        </div>
      </div>
      
      <div className="hidden lg:block">
        <SideNavRight />
      </div>
    </div>
  );
}