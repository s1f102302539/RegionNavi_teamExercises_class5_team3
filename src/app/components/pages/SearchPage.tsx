'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import PostCard from '../pages/PostCard';
import UserCard from '../pages/UserCard'; // ★ UserCardをインポート
import type { User } from '@supabase/supabase-js';

// (型定義は変更なし)
type Post = {
  id: string;
  content: string;
  media_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};
type UserResult = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export default function SearchPage() {
  const supabase = createClient();
  const [tab, setTab] = useState('posts');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<(Post | UserResult)[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, [supabase]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, tab]);

  const handleSearch = async (term: string) => {
    // (この関数の中身は変更なし)
    if (term.trim() === '') {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    let error = null;
    let data = null;
    if (tab === 'posts') {
      const response = await supabase
        .from('posts')
        .select(`id, content, media_url, created_at, user_id, profiles ( username, avatar_url )`)
        .ilike('content', `%${term}%`);
      error = response.error;
      data = response.data;
    } else {
      const response = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .ilike('username', `%${term}%`);
      error = response.error;
      data = response.data;
    }
    if (error) {
      console.error('検索エラー:', error);
      alert('検索中にエラーが発生しました。');
    } else {
      setResults(data || []);
    }
    setLoading(false);
  };
  
  return (
    <div>
      {/* (検索ボックスとタブの部分は変更なし) */}
      <h1 className="text-2xl font-bold mb-4">検索</h1>
      <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
             placeholder="キーワードを入力..." className="w-full px-4 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00A968]" />
      <div className="flex border-b mt-6">
        <button onClick={() => { setTab('posts'); setResults([]); setHasSearched(false); }} className={`py-3 px-6 font-semibold ${tab === 'posts' ? 'border-b-2 border-[#00A968] text-[#00A968]' : 'text-gray-500'}`}>投稿</button>
        <button onClick={() => { setTab('users'); setResults([]); setHasSearched(false); }} className={`py-3 px-6 font-semibold ${tab === 'users' ? 'border-b-2 border-[#00A968] text-[#00A968]' : 'text-gray-500'}`}>ユーザー</button>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-gray-500">検索中...</p>
        ) : !hasSearched ? (
          <p className="text-gray-500">キーワードを入力して検索してください。</p>
        ) : results.length === 0 ? (
          <p className="text-gray-500">検索結果が見つかりませんでした。</p>
        ) : (
          <div className="space-y-4">
            {results.map((item) => (
              tab === 'posts' ? (
                <PostCard 
                  key={(item as Post).id} 
                  post={item as Post} 
                  currentUser={currentUser} 
                />
              ) : (
                // ★ ユーザーの検索結果をUserCardで表示するように変更
                <UserCard 
                  key={(item as UserResult).id}
                  user={item as UserResult}
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}