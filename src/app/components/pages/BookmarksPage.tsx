'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import PostCard from './PostCard';
import type { User } from '@supabase/supabase-js';

export default function BookmarksPage() {
  const supabase = createClient();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchBookmarkedPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUser(user);

      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          posts (
            *,
            profiles ( username, avatar_url ),
            reactions ( user_id ) 
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookmarks:', error);
      } else if (data) {
        // ★ 1. 取得したデータに「ブックマーク済み」の情報を追加する
        const posts = data.map(item => ({
          ...item.posts,
          is_bookmarked_by_user: true, // このページでは常にtrue
          // いいねの状態も正しく反映させるための追加
          is_liked_by_user: item.posts.reactions.some((r: any) => r.user_id === user.id),
          likes: item.posts.reactions.length,
        }));
        setBookmarkedPosts(posts);
      }
      setLoading(false);
    };

    fetchBookmarkedPosts();
  }, [supabase]);

  if (loading) {
    return <p className="text-center">ブックマークを読み込み中...</p>;
  }
  if (bookmarkedPosts.length === 0) {
    return <p className="text-center">ブックマークされた投稿はありません。</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">ブックマーク</h1>
      <div className="space-y-4">
        {bookmarkedPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUser={currentUser} 
            side="left"
          />
        ))}
      </div>
    </div>
  );
}