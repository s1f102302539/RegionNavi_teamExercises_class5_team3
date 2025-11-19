'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiSettings } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import PostCard from '@/app/components/pages/PostCard';
import { PostWithDetails } from '@/types/supabase';

// 投稿データの型定義
type PostForCard = PostWithDetails & {
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes: number;
  comments: number;
  is_liked_by_user: boolean;
};

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

export default function MyPage({ userId, side }: { userId: string, side?: 'left' | 'right' }) {
  const supabase = useMemo(() => createClient(), []);
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally';
  const currentSide = side || 'left'; // デフォルトはleft

  const targetUserId = userId; 

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostForCard[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string>('/logo_circle.png');
  
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // ★ 追加: 一覧画面へのURLを生成する関数
  const createFollowListUrl = (type: 'followers' | 'following') => {
    const newParams = new URLSearchParams(params.toString());
    // 現在の画面(side)を follow-list に切り替え
    newParams.set(currentSide, 'follow-list');
    // 対象ユーザーIDとタイプ(フォロワーorフォロー中)をセット
    newParams.set('userId', userId);
    newParams.set('type', type);
    return `/home?${newParams.toString()}`;
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProfile(null);
    setPosts([]);
    setDisplayAvatarUrl('/logo_circle.png');

    if (!targetUserId) {
      setError("ユーザーIDが指定されていません。");
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        const ownProfile = user ? user.id === targetUserId : false;
        setIsOwnProfile(ownProfile);

        const [profileResponse, postsResponse, followerCountRes, followingCountRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, username, avatar_url, bio')
            .eq('id', targetUserId)
            .single(),
          supabase.rpc('get_posts_with_details', { filter_user_id: targetUserId }),
          supabase.from('follows').select('follower_id', { count: 'exact' }).eq('following_id', targetUserId),
          supabase.from('follows').select('following_id', { count: 'exact' }).eq('follower_id', targetUserId),
        ]);

        if (profileResponse.error) throw profileResponse.error;
        if (postsResponse.error) throw postsResponse.error;
        
        const fetchedProfile = profileResponse.data;
        if (!fetchedProfile) throw new Error("プロフィールが見つかりません。");
        setProfile(fetchedProfile);
        
        setFollowerCount(followerCountRes.count || 0);
        setFollowingCount(followingCountRes.count || 0);

        if (fetchedProfile.avatar_url) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fetchedProfile.avatar_url);
          if (publicUrl) setDisplayAvatarUrl(publicUrl);
        }

        if (postsResponse.data) {
          setPosts(postsResponse.data as PostForCard[]);
        }
        
        if (user && !ownProfile) {
          const { data, error } = await supabase.from('follows')
            .select()
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId)
            .single();

          if (error && error.code !== 'PGRST116') throw error;
          setIsFollowing(!!data);
        }

      } catch (err: any) {
        console.error("データ取得エラー:", err);
        setError(err.message || "データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [supabase, targetUserId]);

  const handleFollow = async () => {
    if (!currentUser || !profile || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      const { error } = await supabase.from('follows').insert({
        follower_id: currentUser.id,
        following_id: profile.id
      }).select();

      if (error) throw error;
      
      setIsFollowing(true);
      setFollowerCount(prevCount => prevCount + 1);

    } catch (error: any) {
      console.error('フォローに失敗しました:', error.message);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !profile || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      const { error } = await supabase.from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id);
      
      if (error) throw error;

      setIsFollowing(false);
      setFollowerCount(prevCount => prevCount - 1);

    } catch (error: any) {
      console.error('フォロー解除に失敗しました:', error.message);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">ローディング中・・・</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!profile) return <div className="text-center p-8">プロフィールが見つかりませんでした。</div>;

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
              
              {/* ▼▼▼ フォロワー・フォロー中をリンクに変更 ▼▼▼ */}
              <Link href={createFollowListUrl('followers')} className="hover:underline cursor-pointer text-blue-600 hover:text-blue-800 transition-colors">
                <span className="font-bold text-black">{followerCount}</span> フォロワー
              </Link>
              <Link href={createFollowListUrl('following')} className="hover:underline cursor-pointer text-blue-600 hover:text-blue-800 transition-colors">
                <span className="font-bold text-black">{followingCount}</span> フォロー中
              </Link>
              {/* ▲▲▲ ここまで ▲▲▲ */}
            </div>
            
            <div className="mt-4">
              {isOwnProfile ? (
                <Link href={`/home?left=mypage-edit&right=${rightView}`} className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition">
                  <FiSettings className="mr-2" /> プロフィールを編集
                </Link>
              ) : (
                isFollowing ? (
                  <button 
                    onClick={handleUnfollow} 
                    disabled={isFollowLoading}
                    className="px-6 py-2 bg-gray-200 text-red-600 rounded-full font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    {isFollowLoading ? '処理中...' : 'フォロー解除'}
                  </button>
                ) : (
                  <button 
                    onClick={handleFollow} 
                    disabled={isFollowLoading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    {isFollowLoading ? '処理中...' : 'フォローする'}
                  </button>
                )
              )}
            </div>
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
                post={post}
                currentUser={currentUser}
                side={currentSide} // sideをPostCardに引き継ぐ
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