import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import PostCard from '../../pages/PostCard';
import { Post } from '@/types/supabase';

type TimelineProps = {
  userId?: string;
  title?: string;
};

export default async function Timeline({ userId, title = "タイムライン" }: TimelineProps) {
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
  const { data: posts, error } = await rpcCall;


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
        {posts.map((post) => (
          <PostCard key={post.id} post={post as unknown as Post} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
}
