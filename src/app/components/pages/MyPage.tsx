'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiSettings } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // createBrowserClientから変更されている可能性を考慮
import type { User } from '@supabase/supabase-js';
import PostCard from '@/app/components/pages/PostCard'; // パスは適宜調整
import { PostWithDetails } from '@/types/supabase';

type PostForCard = PostWithDetails & {
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes: number; // 配列(any[])から数値(number)に変更
  comments: number; // 配列(any[])から数値(number)に変更
  is_liked_by_user: boolean; // is_liked_by_userプロパティを追加
};

// (型定義は変更なし)
type Profile = {
  id: string; // ★ 表示対象のユーザーIDを保持するために追加
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

// ★ useParamsの代わりに、userIdをpropsで受け取る
export default function UserProfile({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally';
  
  // ★ targetUserIdの取得方法が変わる
  const targetUserId = userId; 

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostForCard[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string>('/logo_circle.png');
  
  // ★★★ フォロー機能用のStateを追加 ★★★
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);


  useEffect(() => {
    // ★ 修正: ユーザーが切り替わるたびに、まずローディング状態に戻す
    setLoading(true);
    setError(null);
    setProfile(null); // 古いプロフィール情報をクリア
    setPosts([]); // 古い投稿をクリア
    setDisplayAvatarUrl('/logo_circle.png'); // アバターをデフォルトに戻す
    // ★ targetUserIdがない場合は処理を中断
    if (!targetUserId) {
      setError("ユーザーIDが指定されていません。");
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        // 1. ログインしているユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // ★ 自分自身のプロフィールかどうかを判定
        const ownProfile = user ? user.id === targetUserId : false;
        setIsOwnProfile(ownProfile);

        // 2. プロフィール情報、投稿、フォロー情報を並行して取得
        const [profileResponse, postsResponse, followerCountRes, followingCountRes] = await Promise.all([
          // ★ 表示対象ユーザーのプロフィールを取得
          supabase
            .from('profiles')
            .select('id, username, avatar_url, bio')
            .eq('id', targetUserId)
            .single(),
          // ★ 表示対象ユーザーの投稿を取得
          supabase.rpc('get_posts_with_details', { filter_user_id: targetUserId }),
          // ★ フォロワー数を取得
          supabase.from('follows').select('follower_id', { count: 'exact' }).eq('following_id', targetUserId),
          // ★ フォロー数を取得
          supabase.from('follows').select('following_id', { count: 'exact' }).eq('follower_id', targetUserId),
        ]);

        if (profileResponse.error) throw profileResponse.error;
        if (postsResponse.error) throw postsResponse.error;
        if (followerCountRes.error) throw followerCountRes.error;
        if (followingCountRes.error) throw followingCountRes.error;
        
        // プロフィール情報の設定
        const fetchedProfile = profileResponse.data;
        if (!fetchedProfile) throw new Error("プロフィールが見つかりません。");
        setProfile(fetchedProfile);
        
        // フォロワー・フォロー数の設定
        setFollowerCount(followerCountRes.count || 0);
        setFollowingCount(followingCountRes.count || 0);

        // アバター画像URLの設定
        if (fetchedProfile.avatar_url) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fetchedProfile.avatar_url);
          if (publicUrl) setDisplayAvatarUrl(publicUrl);
        }

        // 投稿情報の設定
        if (postsResponse.data) {
          setPosts(postsResponse.data as PostForCard[]);
        }
        
        // 3. ★ 他人のプロフィールの場合は、フォロー状態を確認
        if (user && !ownProfile) {
          const { data, error } = await supabase.from('follows')
            .select()
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId)
            .single();

          if (error && error.code !== 'PGRST116') throw error; // PGRST116はレコードがない場合のエラーなので無視
          setIsFollowing(!!data); // レコードがあればtrue, なければfalse
        }

      } catch (err: any) {
        console.error("データ取得エラー:", err);
        setError(err.message || "データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [supabase, targetUserId]); // ★ targetUserIdが変わるたびに再実行

  // ★★★ フォロー・フォロー解除のハンドラ関数 ★★★
  const handleFollow = async () => {
    if (!currentUser || !profile || isFollowLoading) return;
    
    setIsFollowLoading(true); // ★ ローディング開始

    // 楽観的UI更新は行わない方が安全
    try {
      // ★ 修正: onConflictを追加して重複エラーを無視する
      const { error } = await supabase.from('follows').insert({
        follower_id: currentUser.id,
        following_id: profile.id
      }).select(); // select()を追加してupsertモードにするのが一般的

      if (error) throw error;
      
      // 成功した場合のみUIを更新
      setIsFollowing(true);
      setFollowerCount(prevCount => prevCount + 1);

    } catch (error: any) {
      console.error('フォローに失敗しました:', error.message);
    } finally {
      setIsFollowLoading(false); // ★ ローディング終了
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !profile || isFollowLoading) return;

    setIsFollowLoading(true); // ★ ローディング開始

    try {
      const { error } = await supabase.from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id);
      
      if (error) throw error;

      // 成功した場合のみUIを更新
      setIsFollowing(false);
      setFollowerCount(prevCount => prevCount - 1);

    } catch (error: any) {
      console.error('フォロー解除に失敗しました:', error.message);
    } finally {
      setIsFollowLoading(false); // ★ ローディング終了
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
              {/* ★ Stateからフォロワー・フォロー数を表示 */}
              <div><span className="font-bold">{followerCount}</span> フォロワー</div>
              <div><span className="font-bold">{followingCount}</span> フォロー中</div>
            </div>
            
            {/* ★★★ ここでボタンを条件分岐 ★★★ */}
            <div className="mt-4">
              {isOwnProfile ? (
                // 自分のプロフィールの時
                <Link href={`/home?left=mypage-edit&right=${rightView}`} className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition">
                  <FiSettings className="mr-2" /> プロフィールを編集
                </Link>
              ) : (
                // 他人のプロフィールの時
                isFollowing ? (
                  <button onClick={handleUnfollow} className="px-6 py-2 bg-gray-200 text-red-600 rounded-full font-semibold hover:bg-gray-300 transition">
                    フォロー解除
                  </button>
                ) : (
                  <button onClick={handleFollow} className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition">
                    フォローする
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