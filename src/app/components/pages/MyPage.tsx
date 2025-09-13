'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiSettings } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import PostCard from '../pages/PostCard'; 

// (型定義は変更なし)
type Profile = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};
type Post = {
  id: string;
  media_url: string | null;
  content: string;
  created_at: string; // created_atの型を追加
  profiles?: Profile | null; 
};

export default function MyPage() {
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally';

  const supabase = useMemo(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (user) {
          const [profileResponse, postsResponse] = await Promise.all([
            supabase
              .from('profiles')
              .select('username, avatar_url, bio')
              .eq('id', user.id)
              .single(),
            supabase
              .from('posts')
              .select('id, media_url, content, created_at') // `created_at`を追加！
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
          ]);

          if (profileResponse.error) throw profileResponse.error;
          if (postsResponse.error) throw postsResponse.error;

          setProfile(profileResponse.data);
          if (postsResponse.data) {
            setPosts(postsResponse.data);
          }
        }
      } catch (err: any) {
        console.error("データ取得エラー:", err);
        setError("データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [supabase]);

  // これで、以降のコードでは `profile` が null ではないことが保証されます。
  if (!profile) {
    return <div className="text-center p-8">ローディング中・・・</div>;
  }


  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex flex-col md:flex-row items-center">
          {/* 取得したデータを表示 */}
          <Image 
            src={profile.avatar_url || '/logo_circle.png'} // デフォルト画像を指定
            alt={profile.username || 'アバター'} 
            width={120} 
            height={120} 
            className="rounded-full border-4 border-white shadow-md bg-gray-200 object-cover" 
          />
          <div className="md:ml-8 mt-4 md:mt-0 text-center md:text-left">
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            <h2 className='text-1xl'>{profile.bio}</h2>
            <div className="flex justify-center md:justify-start space-x-6 mt-4">
              {/* 投稿数は取得した投稿の件数を表示 */}
              <div><span className="font-bold">{posts.length}</span> 投稿</div>
              {/* フォロー・フォロワー数は別途実装が必要です */}
              <div><span className="font-bold">150</span> フォロワー</div>
              <div><span className="font-bold">80</span> フォロー中</div>
            </div>
            <Link href={`/home?left=mypage-edit&right=${rightView}`} className="inline-flex items-center mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition">
              <FiSettings className="mr-2" /> プロフィールを編集
            </Link>
          </div>
        </div>
      </div>
      
 <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">投稿一覧</h2>
        {posts.length > 0 ? (
          <div className="space-y-4"> {/* gridからspace-y-4に変更 */}
            {posts.map((post) => {
              // PostCardに渡すためのデータを作成します
              // 投稿データ(post)とプロフィールデータ(profile)を組み合わせます
              const postForCard = {
                ...post,
                profiles: profile // `profiles`キーにプロフィール情報を追加
              };

              return (
                <PostCard 
                  key={post.id} 
                  post={postForCard} 
                  currentUser={currentUser} 
                />
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">まだ投稿がありません。</p>
        )}
      </div>
    </div>
  );
}