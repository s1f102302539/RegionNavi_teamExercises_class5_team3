import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import PostCard from '../../pages/PostCard';

// propsの型を定義
type TimelineProps = {
  userId?: string; // オプショナルなプロパティとしてuserIdを追加
  title?: string;  // 表示するタイトルもpropsで変更できるようにすると便利
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

  // ベースとなるクエリを作成
  let query = supabase
    .from('posts')
    .select(`*, profiles (username, avatar_url)`)
    .order('created_at', { ascending: false })
    .limit(100);

  // もしuserIdがpropsとして渡されていたら、そのユーザーの投稿に絞り込む
  if (userId) {
    query = query.eq('user_id', userId);
  }

  // クエリを実行
  const { data: posts, error } = await query;


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
          <PostCard key={post.id} post={post} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
}
