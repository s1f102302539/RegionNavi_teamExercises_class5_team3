'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import PostCard from '../pages/PostCard';
import UserCard from '../pages/UserCard'; // ★ UserCardをインポート
import type { User } from '@supabase/supabase-js';
import { Post } from '@/types/supabase';
import { useSearchParams } from 'next/navigation'

type UserResult = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export default function SearchPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState('posts');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<(Post | UserResult)[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleHashtagSearch = async (tag: string) => {
    setLoading(true);
    setHasSearched(true);
    setTab('posts'); // タブを「投稿」に強制

    // hashtagsテーブルからタグ名で検索し、関連する投稿をすべて取得
    const { data, error } = await supabase
      .from('hashtags')
      .select(`
        name,
        posts (
          *,
          profiles ( username, avatar_url )
        )
      `)
      .eq('name', tag.toLowerCase()) // タグは小文字で検索
      .single();

    if (error) {
      console.error('ハッシュタグ検索エラー:', error);
      setResults([]);
    } else {
      // 取得したデータの中から投稿の配列を取り出す
      setResults(data?.posts || []);
    }
    setLoading(false);
  };

  // ★ ページ読み込み時に一度だけ実行されるuseEffect
  useEffect(() => {
    const tag = searchParams.get('tag');
    if (tag) {
      // URLにtagパラメータがあれば、ハッシュタグ検索を実行
      setSearchTerm(`#${tag}`);
      handleHashtagSearch(tag);
    }

    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []); // 空の配列を渡して初回レンダリング時のみ実行

  // キーワード入力時の検索（ディレイ付き）
  useEffect(() => {
    // ★ URLパラメータ由来の検索（#から始まる）の場合は、このディレイ検索をスキップ
    if (searchTerm.startsWith('#') && searchParams.get('tag')) {
      return;
    }
    
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, tab]);

  // 通常のキーワード検索
  const handleSearch = async (term: string) => {
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
        .rpc('search_posts_with_details', {
          // パラメータとして検索キーワードを渡す
          search_term: term 
        });
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