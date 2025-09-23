'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiSettings } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import PostCard from '../pages/PostCard';
import { PostWithDetails } from '@/types/supabase';

// (型定義は変更なし)
type Profile = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
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
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string>('/logo_circle.png');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);


        if (user) {
          // ★★★ 投稿取得部分をRPC呼び出しに変更 ★★★
          const [profileResponse, postsResponse] = await Promise.all([
            supabase
              .from('profiles')
              .select('username, avatar_url, bio')
              .eq('id', user.id)
              .single(),
            // RPCを呼び出して、自分の投稿のみを取得
            supabase.rpc('get_posts_with_details', { filter_user_id: user.id })
          ]);

          if (profileResponse.error) throw profileResponse.error;
          if (postsResponse.error) throw postsResponse.error;
          
          const fetchedProfile = profileResponse.data;
          setProfile(fetchedProfile);
          
          if (fetchedProfile && fetchedProfile.avatar_url) {
            const { data: imageData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fetchedProfile.avatar_url);

            if (imageData && imageData.publicUrl) {
              setDisplayAvatarUrl(imageData.publicUrl);
            }
          }

          if (postsResponse.data) {
            // ★ 型アサーションを追加
            setPosts(postsResponse.data as PostWithDetails[]);
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

  // ローディング表示はloading stateを使うように変更
  if (loading) {
    return <div className="text-center p-8">ローディング中・・・</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }
  
  // プロフィールがない場合の表示
  if (!profile) {
    return <div className="text-center p-8">プロフィールが見つかりませんでした。</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex flex-col md:flex-row items-center">
          <Image 
            src={displayAvatarUrl}
            alt={profile.username || 'アバター'} 
            width={120} 
            height={120} 
            className="rounded-full border-4 border-white shadow-md bg-gray-200 object-cover" 
          />
          <div className="md:ml-8 mt-4 md:mt-0 text-center md:text-left">
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            <h2 className='text-1xl'>{profile.bio}</h2>
            <div className="flex justify-center md:justify-start space-x-6 mt-4">
              <div><span className="font-bold">{posts.length}</span> 投稿</div>
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
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id} 
                post={post} // ★ RPCからのデータをそのまま渡すだけでOK！
                currentUser={currentUser} 
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">まだ投稿がありません。</p>
        )}
      </div>
    </div>
  );
}