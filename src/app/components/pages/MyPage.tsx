'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiSettings, FiAward } from 'react-icons/fi';
import { FaCrown, FaMedal } from 'react-icons/fa';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import PostCard from './PostCard';
import { PostWithDetails } from '../../../types/supabase';

import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

type Profile = {
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
  is_new: boolean;
  titles: {
    id: string;
    name: string;
    description: string;
    icon_url: string | null;
  };
};

export default function MyPage({ side }: { side: 'left' | 'right' }) {
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [userTitles, setUserTitles] = useState<UserTitle[]>([]);
  const [currentTitleName, setCurrentTitleName] = useState<string | null>(null);
  
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string>('/logo_circle.png');

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const [profileResponse, postsResponse, titlesResponse, followersResponse, followingResponse] = await Promise.all([
          supabase
            .from('profiles')
            .select('username, avatar_url, bio, level, exp, current_title_id')
            .eq('id', user.id)
            .single(),
          supabase.rpc('get_posts_with_details', { filter_user_id: user.id }),
          supabase
            .from('user_titles')
            .select('*, titles(*)')
            .eq('user_id', user.id)
            .order('acquired_at', { ascending: false }),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id)
        ]);

        if (profileResponse.data) {
          const p = profileResponse.data as Profile;
          setProfile(p);
          if (p.avatar_url) {
            const { data: imageData } = supabase.storage.from('avatars').getPublicUrl(p.avatar_url);
            if (imageData?.publicUrl) setDisplayAvatarUrl(imageData.publicUrl);
          }
        }
        if (postsResponse.data) setPosts(postsResponse.data as PostWithDetails[]);
        if (titlesResponse.data) setUserTitles(titlesResponse.data as any[]);
        
        if (followersResponse.count !== null) setFollowerCount(followersResponse.count);
        if (followingResponse.count !== null) setFollowingCount(followingResponse.count);
      }
    } catch (err: any) {
      console.error("データ取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [supabase]);

  useEffect(() => {
    if (profile?.current_title_id && userTitles.length > 0) {
      const equipped = userTitles.find(t => t.titles.id === profile.current_title_id);
      setCurrentTitleName(equipped ? equipped.titles.name : null);
    } else {
      setCurrentTitleName(null);
    }
  }, [profile, userTitles]);

  const handleEquipTitle = async (titleId: string) => {
    if (!currentUser) return;
    setProfile(prev => prev ? { ...prev, current_title_id: titleId } : null);
    const { error } = await supabase
      .from('profiles')
      .update({ current_title_id: titleId })
      .eq('id', currentUser.id);
    if (error) {
      alert('称号の変更に失敗しました。');
      fetchUserData();
    }
  };

  const getFollowListUrl = (type: 'followers' | 'following') => {
    const newParams = new URLSearchParams(params.toString());
    if (side) newParams.set(side, 'follow-list');
    if (currentUser) newParams.set('userId', currentUser.id);
    newParams.set('type', type);
    return `/home?${newParams.toString()}`;
  };

  if (loading) return <div className="text-center p-8">読み込み中...</div>;
  if (!profile) return <div className="text-center p-8">プロフィールが見つかりませんでした。</div>;

  const nextLevelExp = profile.level * 100; 
  const expProgress = Math.min((profile.exp / nextLevelExp) * 100, 100); 

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="bg-white p-6 rounded-xl shadow mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-yellow-200 to-orange-200 opacity-50"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-end mt-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
              <Image 
                src={displayAvatarUrl} 
                alt={profile.username} 
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full border-2 border-white shadow">
              Lv.{profile.level}
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
            <p className="text-gray-600 mt-1">{profile.bio || '自己紹介はまだありません'}</p>
            
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

          <Link href={`/home?left=mypage-edit&right=${rightView}`} className="mt-4 md:mt-0 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 flex items-center">
            <FiSettings className="mr-2" /> 編集
          </Link>
        </div>

        <div className="mt-6 px-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>EXP: {profile.exp}</span>
            <span>Next: {nextLevelExp}</span>
          </div>
          <Progress value={expProgress} className="h-2" />
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="posts">タイムライン ({posts.length})</TabsTrigger>
          <TabsTrigger value="titles">称号・実績 ({userTitles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post}
                  currentUser={currentUser} 
                  side={side}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">まだ投稿がありません。</p>
              <Link href="/home?left=post&right=stamprally" className="text-blue-500 font-bold mt-2 inline-block hover:underline">
                最初の投稿をする
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="titles">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userTitles.length > 0 ? (
              userTitles.map((item) => {
                const isEquipped = profile.current_title_id === item.titles.id;
                return (
                  <Card key={item.title_id} className={`relative overflow-hidden transition-all ${isEquipped ? 'border-yellow-400 bg-yellow-50 shadow-md' : 'hover:border-gray-300'}`}>
                    {isEquipped && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-bl-lg z-10">
                        装備中
                      </div>
                    )}
                    <CardHeader className="pb-2 flex flex-row items-start space-y-0 gap-3">
                      <div className={`p-3 rounded-full ${isEquipped ? 'bg-yellow-200 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                        <FaMedal size={24} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-gray-800">
                          {item.titles.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {item.titles.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(item.acquired_at).toLocaleDateString()} 獲得
                        </span>
                        {!isEquipped && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-8"
                            onClick={() => handleEquipTitle(item.titles.id)}
                          >
                            装備する
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">まだ称号を獲得していません。</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}