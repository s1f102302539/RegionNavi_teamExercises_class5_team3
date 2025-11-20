'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FaCrown, FaMedal } from 'react-icons/fa';
import PostCard from './PostCard';
import { PostWithDetails } from '@/types/supabase';

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  exp: number;
  current_title_id: string | null;
};

type UserTitle = {
  title_id: string;
  acquired_at: string;
  titles: {
    id: string;
    name: string;
    description: string;
    icon_url: string | null;
  };
};

export default function UserProfile({ side, userId }: { side: 'left' | 'right', userId: string }) {
  const params = useSearchParams();
  const targetUserId = userId;

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [userTitles, setUserTitles] = useState<UserTitle[]>([]);
  const [currentTitleName, setCurrentTitleName] = useState<string | null>(null);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string>('/logo_circle.png');
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!targetUserId) return;

    const fetchData = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setCurrentUserId(currentUser?.id || null);

      // 1. プロフィール取得
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (profileData) {
        setProfile(profileData);
        if (profileData.avatar_url) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(profileData.avatar_url);
          if (data) setDisplayAvatarUrl(data.publicUrl);
        }
      }

      // 2. 投稿取得
      const { data: postsData } = await supabase.rpc('get_posts_with_details', { filter_user_id: targetUserId });
      if (postsData) setPosts(postsData as PostWithDetails[]);

      // 3. 称号取得
      const { data: titlesData } = await supabase
        .from('user_titles')
        .select('*, titles(*)')
        .eq('user_id', targetUserId)
        .order('acquired_at', { ascending: false });
      if (titlesData) setUserTitles(titlesData as any[]);

      // 4. フォロー/フォロワー数
      const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId);
      const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId);
      if (followers !== null) setFollowerCount(followers);
      if (following !== null) setFollowingCount(following);

      // 5. フォロー状態確認
      if (currentUser) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetUserId)
          .single();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    };

    fetchData();
  }, [targetUserId, supabase]);

  // 称号名の特定
  useEffect(() => {
    if (profile?.current_title_id && userTitles.length > 0) {
      const equipped = userTitles.find(t => t.titles.id === profile.current_title_id);
      setCurrentTitleName(equipped ? equipped.titles.name : null);
    } else {
      setCurrentTitleName(null);
    }
  }, [profile, userTitles]);

  // フォロー/解除処理
  const handleFollowToggle = async () => {
    if (!currentUserId || !targetUserId) return;
    
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: targetUserId });
      setIsFollowing(false);
      setFollowerCount(prev => prev - 1);
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetUserId });
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
    }
  };
  
  const getFollowListUrl = (type: 'followers' | 'following') => {
    const newParams = new URLSearchParams(params.toString());
    newParams.set(side, 'follow-list');
    newParams.set('userId', targetUserId || '');
    newParams.set('type', type);
    return `/home?${newParams.toString()}`;
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;
  if (!profile) return <div className="p-8 text-center">ユーザーが見つかりません。</div>;

  const nextLevelExp = (profile.level || 1) * 100;
  const expProgress = Math.min(((profile.exp || 0) / nextLevelExp) * 100, 100);
  const isMe = currentUserId === targetUserId;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="bg-white p-6 rounded-xl shadow mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-100 to-indigo-100 opacity-50"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-end mt-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
              <Image src={displayAvatarUrl} alt={profile.username} fill className="object-cover" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full border-2 border-white shadow">
              Lv.{profile.level || 1}
            </div>
          </div>

          <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left flex-1">
            {currentTitleName && (
              <Badge variant="secondary" className="mb-2 bg-yellow-100 text-yellow-800 border-yellow-300 text-xs px-2 py-0.5">
                <FaCrown className="mr-1 text-yellow-600" />
                {currentTitleName}
              </Badge>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{profile.username}</h1>
            <p className="text-gray-600 mt-1">{profile.bio || '自己紹介はありません'}</p>

            <div className="flex justify-center md:justify-start space-x-6 mt-4 text-sm">
              <div><span className="font-bold">{posts.length}</span> 投稿</div>
              <Link href={getFollowListUrl('followers')} className="hover:text-blue-500 hover:underline">
                <span className="font-bold">{followerCount}</span> フォロワー
              </Link>
              <Link href={getFollowListUrl('following')} className="hover:text-blue-500 hover:underline">
                <span className="font-bold">{followingCount}</span> フォロー中
              </Link>
            </div>
          </div>

          <div className="mt-4 md:mt-0">
            {isMe ? (
               <Button disabled variant="outline">自分を表示中</Button>
            ) : (
               <Button 
                 onClick={handleFollowToggle} 
                 variant={isFollowing ? "outline" : "default"}
                 className={isFollowing ? "border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600" : "bg-blue-600 hover:bg-blue-700"}
               >
                 {isFollowing ? 'フォロー解除' : 'フォローする'}
               </Button>
            )}
          </div>
        </div>
        
        <div className="mt-6 px-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>EXP: {profile.exp || 0}</span>
            <span>Next: {nextLevelExp}</span>
          </div>
          <Progress value={expProgress} className="h-2" />
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="posts">投稿 ({posts.length})</TabsTrigger>
          <TabsTrigger value="titles">実績 ({userTitles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} currentUser={null} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <p className="text-gray-500">まだ投稿がありません。</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="titles">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userTitles.map((item) => (
              <Card key={item.title_id} className="hover:border-gray-300 transition-colors">
                <CardHeader className="pb-2 flex flex-row items-start gap-3">
                  <div className="p-2 rounded-full bg-yellow-100 text-yellow-600"><FaMedal /></div>
                  <div>
                    <CardTitle className="text-base">{item.titles.name}</CardTitle>
                    <CardDescription className="text-xs">{item.titles.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {userTitles.length === 0 && (
               <div className="col-span-full text-center py-8 text-gray-500">実績はまだありません。</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}