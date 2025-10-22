import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import PostCard from '../../pages/PostCard';
import { Post, User, PostWithDetails } from '@/types/supabase';

// Propsの型定義
type TimelineProps = {
  userId?: string;
  side: 'left' | 'right';
  tab: string; // 'all', 'following', 'official', 'quiz' など
};

// RPC関数の戻り値の型を定義（元のコードに合わせて調整）
type PostFromRpc = PostWithDetails & {
  profiles: {
    username: string | null;
    avatar_url: string | null;
    status: string | null;
  } | null;
  likes: number;
  comments: number;
  is_liked_by_user: boolean;
  prefecture: string | null;
  is_bookmarked_by_user: boolean;
};

export default async function Timeline({ userId, side, tab }: TimelineProps) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 1. まずRPC関数で全件取得する
  // selectではなく、元のRPC呼び出しに戻す
  const { data: allPostsData, error } = await supabase.rpc('get_posts_with_details');

  if (error) {
    return <p className="text-center text-red-500">エラーが発生しました: {error.message}</p>;
  }

  // asで型を明示
  const allPosts = (allPostsData as PostFromRpc[]) || [];

  // 2. 取得した配列をJavaScriptでフィルタリングする
  let filteredPosts: PostFromRpc[] = allPosts;

  // --- `tab` prop の値に応じて配列を絞り込み ---
  switch (tab) {
    case 'following':
      if (currentUser) {
        const { data: followingIdsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUser.id);
        
        if (followingIdsData && followingIdsData.length > 0) {
          const followingIds = followingIdsData.map(f => f.following_id);
          // allPosts配列から、フォロー中のユーザーの投稿のみを抽出
          filteredPosts = allPosts.filter(post => followingIds.includes(post.user_id));
        } else {
          filteredPosts = []; // フォローがいなければ空にする
        }
      } else {
        filteredPosts = []; // 未ログイン時は空
      }
      break;

    case 'official':
      // allPosts配列から、公式アカウントの投稿のみを抽出
      filteredPosts = allPosts.filter(post => post.profiles?.status === 'Official');
      break;

case 'quiz':
      // タイムゾーンを指定して、日本時間の`YYYY-MM-DD`形式の文字列を直接生成する
      const jstDateString = new Date().toLocaleString('sv-SE', {
        timeZone: 'Asia/Tokyo',
      });
      const todayStr = jstDateString.split(' ')[0]; // "YYYY-MM-DD"の部分だけを取り出す
      console.log('今日の日付（JST）:', todayStr);
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('prefecture_name')
        .eq('quiz_date', todayStr)
        .single();
      
      if (quiz?.prefecture_name) {
        // allPosts配列から、クイズの県と一致する投稿のみを抽出
        filteredPosts = allPosts.filter(post => post.prefecture === quiz.prefecture_name);
      } else {
        filteredPosts = []; // 今日のクイズがなければ空にする
      }
      break;
  }
  
  // もしuserId propがあれば、さらに絞り込む（マイページ用）
  if (userId) {
      filteredPosts = filteredPosts.filter(post => post.user_id === userId);
  }

  // tabに応じてタイトルを動的に設定
  const titles: { [key: string]: string } = {
    all: 'タイムライン',
    following: 'フォロー中の投稿',
    official: '公式アカウントの投稿',
    quiz: '今日のクイズに関連する投稿'
  };
  const timelineTitle = userId ? 'あなたの投稿' : (titles[tab] || 'タイムライン');

  if (filteredPosts.length === 0) { 
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{timelineTitle}</h1>
        <p className="text-gray-600">表示する投稿がありません。</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{timelineTitle}</h1>
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <PostCard 
            key={post.id} 
            // postの型はPostCardが期待するものと一致しているはず
            post={post as any} 
            currentUser={currentUser} 
            side={side} 
          />
        ))}
      </div>
    </div>
  );
}