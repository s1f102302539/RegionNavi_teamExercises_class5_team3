import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import PostCard from '../../pages/PostCard';
import { Post, User, PostWithDetails } from '@/types/supabase';

type TimelineProps = {
  userId?: string;
  title?: string;
  side: 'left' | 'right'; // 追加: sideプロパティ
};

type PostForCard = PostWithDetails & {
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes: number;
  comments: number;
  is_liked_by_user: boolean;
  prefecture: string | null;
  is_bookmarked_by_user: boolean;
};

export default async function Timeline({ userId, title = "タイムライン", side }: TimelineProps) {
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

  // RPC関数を呼び出す準備
  let rpcCall;

  if (userId) {
    // userIdがある場合：パラメータを付けてRPCを呼び出す
    rpcCall = supabase.rpc('get_posts_with_details', { filter_user_id: userId });
  } else {
    // userIdがない場合：パラメータなしでRPCを呼び出す（全ユーザーの投稿を取得）
    rpcCall = supabase.rpc('get_posts_with_details');
  }

  // RPC関数を実行してデータを取得
  const { data: postsData, error } = await rpcCall;
  const posts = postsData as PostForCard[];


  if (error) {
    return <p className="text-center text-red-500">エラーが発生しました: {error.message}</p>;
  }
  if (!posts || posts.length === 0) {
    const message = userId ? "まだ投稿がありません。" : "タイムラインに表示する投稿がありません。";
    return <p className="text-center text-gray-500 mt-8">{message}</p>;
  }

  return (
    <div>
      {/* propsで受け取ったタイトルを表示 */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>
      <div className="space-y-4">
        {posts.map((post: PostForCard) => ( // postに明示的に型を指定
          <PostCard 
            key={post.id} 
            post={post} // 型が一致しているので、危険な 'as unknown as Post' は不要
            currentUser={currentUser} 
            side={side} // 追加: sideプロパティを渡す
          />
        ))}
      </div>
    </div>
  );
}
