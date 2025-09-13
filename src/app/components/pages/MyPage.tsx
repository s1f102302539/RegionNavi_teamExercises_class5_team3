'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiSettings } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

// プロフィールと投稿の型を定義しておくと便利です
type Profile = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

type Post = {
  id: string;
  media_url: string | null;
  content: string;
};

export default function MyPage() {
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally';

  // Supabaseクライアントを初期化
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 状態を管理するためのStateを定義
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  // ページ読み込み時にデータを取得する
  useEffect(() => {
    const fetchUserData = async () => {
      // 1. 現在ログインしているユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. ユーザーIDを使ってプロフィール情報を取得
        const { data: profileData } = await supabase
          .from('profiles') // あなたのプロフィールテーブル名
          .select('username, avatar_url, bio')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        // 3. ユーザーIDを使って投稿一覧を取得
        const { data: postsData } = await supabase
          .from('posts') // あなたの投稿テーブル名
          .select('id, media_url, content')
          .eq('user_id', user.id) // あなたの投稿テーブルのユーザーIDカラム名
          .order('created_at', { ascending: false });
        
        if(postsData) {
          setPosts(postsData);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []); // 空の依存配列で初回レンダリング時のみ実行

  // データ読み込み中の表示
  if (loading) {
    return <div className="text-center p-8">読み込み中...</div>;
  }
  
  // プロフィール情報が取得できなかった場合の表示
  if (!profile) {
    return <div className="text-center p-8">ユーザー情報が見つかりません。ログインしているか確認してください。</div>;
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post) => (
              post.media_url && (
                <div key={post.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <Image 
                    src={post.media_url} 
                    alt={`投稿画像`} 
                    width={400} 
                    height={400} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )
              
            ))}
          </div>
        ) : (
          <p className="text-gray-500">まだ投稿がありません。</p>
        )}
      </div>
    </div>
  );
}