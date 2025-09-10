'use client';

import { useSearchParams } from 'next/navigation';
import SideNavLeft from '@/app/components/layouts/SideNavLeft';
import SideNavRight from '@/app/components/layouts/SideNavRight';

// ページコンポーネントのインポート
// import Timeline from '@/app/components/features/timeline/Timeline';
import StampRallyPage from '@/app/components/pages/StampRallyPage';
import QuizTopPage from '@/app/components/pages/QuizTopPage';
import SearchPage from '@/app/components/pages/SearchPage';
import CreatePostForm from '@/app/components/pages/CreatePostForm';
import MyPage from '@/app/components/pages/MyPage';
import MypageEditPage from '@/app/components/pages/MypageEditPage';
import PrefectureQuizPage from '@/app/components/pages/PrefectureQuizPage';

const componentMap: { [key: string]: React.ComponentType<any> } = {
  // home: Timeline,
  stamprally: StampRallyPage,
  quiz: QuizTopPage,
  search: SearchPage,
  post: CreatePostForm,
  mypage: MyPage,
  'mypage-edit': MypageEditPage,
};

// getComponent関数を修正して、propsで受け取ったtimelineComponentを扱えるようにする
const getComponent = (viewKey: string, timelineComponent: React.ReactNode) => {
  if (!viewKey || viewKey === 'home') {
    // コンポーネントの代わりに、受け取ったJSXをそのまま返す関数を返す
    return { Component: () => <>{timelineComponent}</>, props: {} };
  }
  const Component = componentMap[viewKey];
  // もし一致するものがなければTimelineを表示
  if (!Component) {
    return { Component: () => <>{timelineComponent}</>, props: {} };
  }
  return { Component, props: {} };
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

  // propsで受け取ったtimelineComponentをgetComponentに渡す
  const { Component: LeftComponent, props: leftProps } = getComponent(leftView, timelineComponent);
  const { Component: RightComponent, props: rightProps } = getComponent(rightView, timelineComponent);

  const isDuplicate = leftView === rightView;

  return (

    <div className="flex h-screen w-full bg-yellow-50">
      <SideNavLeft />
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 lg:gap-5">
        
        <div className="col-span-1 h-screen overflow-y-auto p-4 sm:p-6 lg:p-8">
          <LeftComponent {...leftProps} />
        </div>
        
        <div className="hidden lg:flex col-span-1 h-screen overflow-y-auto p-4 sm:p-6 lg:p-8 border-l-2 border-yellow-200">
          {isDuplicate ? <DuplicateViewError /> : <RightComponent {...rightProps} />}
        </div>
      </div>
      
      <div className="hidden lg:block">
        <SideNavRight />
      </div>
    </div>
  );
}