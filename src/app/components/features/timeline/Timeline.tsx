import { createServerClient } from '@supabase/ssr'; // 変更点
import { cookies } from 'next/headers';
import PostCard from '../../pages/PostCard'; 

export default async function Timeline() {
  const cookieStore = await cookies(); // cookieストアを取得

  // Supabaseクライアントの作成方法を変更
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

  // 現在のユーザー情報を取得
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  console.log('サーバーコンポーネントで取得したユーザー:', currentUser); 
  
  // 投稿データを取得
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`*, profiles (username, avatar_url)`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return <p className="text-center text-red-500">エラーが発生しました: {error.message}</p>;
  }
  if (!posts || posts.length === 0) {
    return <p className="text-center text-gray-500 mt-8">まだ投稿がありません。</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">タイムライン</h1>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
}