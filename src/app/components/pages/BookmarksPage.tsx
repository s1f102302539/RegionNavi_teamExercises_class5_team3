'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import PostCard from './PostCard';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createTravelPlan } from '../../actions/createTravelPlan';
import ReactMarkdown from 'react-markdown';

export default function BookmarksPage() {
  const supabase = createClient();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [travelPlan, setTravelPlan] = useState<string | null>(null);

  // ★ 1. データベースからブックマーク投稿を読み込むuseEffectを正しく実装
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
        const posts = data.map(item => ({
          ...item.posts,
          is_bookmarked_by_user: true,
          is_liked_by_user: item.posts.reactions.some((r: any) => r.user_id === user.id),
          likes: item.posts.reactions.length,
        }));
        setBookmarkedPosts(posts);
      }
      setLoading(false);
    };

    fetchBookmarkedPosts();
  }, [supabase]);

 // ★ 2. AIに計画を作成させる関数 (変更なし)
const handleCreatePlan = async () => {
  setIsGeneratingPlan(true);
  setTravelPlan(null);
  try {
    const plan = await createTravelPlan(bookmarkedPosts);
    setTravelPlan(plan);
  } catch (error) {
    setTravelPlan('エラーが発生しました。');
  } finally {
    setIsGeneratingPlan(false);
  }
};

if (loading) {
  return <p className="text-center">ブックマークを読み込み中...</p>;
}

return (
  <div>
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">ブックマーク</h1>
      {bookmarkedPosts.length > 0 && (
        <Button onClick={handleCreatePlan} disabled={isGeneratingPlan}>
          {isGeneratingPlan ? '計画を生成中...' : 'AIに旅行計画を提案してもらう'}
        </Button>
      )}
    </div>

    {travelPlan && (
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">AIからの旅行プラン提案</CardTitle>
        </CardHeader>
        <CardContent>

          <ReactMarkdown
            components={{
              // レベル1見出し (#)
              h1: ({node, ...props}) => (
                <h1 className="text-2xl font-bold text-blue-700 mb-4 border-b pb-2" {...props} />
              ),
              // レベル2見出し (##)
              h2: ({node, ...props}) => (
                <h2 className="text-xl font-semibold text-blue-700 mt-6 mb-3" {...props} />
              ),
              // レベル3見出し (###)
              h3: ({node, ...props}) => (
                <h3 className="text-lg font-semibold text-teal-600 mt-4 mb-2" {...props} />
              ),
              // 太字 (**)
              strong: ({node, ...props}) => (
                <strong className="font-bold text-emerald-600" {...props} />
              ),
              // リンク ([text](url))
              a: ({node, ...props}) => (
                <a className="text-indigo-600 hover:text-indigo-800 hover:underline" {...props} />
              ),
              // 箇条書きリスト
              ul: ({node, ...props}) => (
                <ul className="list-disc list-inside space-y-1 my-3 pl-2" {...props} />
              ),
              // リストの項目
              li: ({node, ...props}) => (
                <li 
                  className="text-gray-800 [&_strong]:text-gray-800 [&_strong]:font-normal marker:text-blue-500"
                  {...props} 
                />
              ),
              // 引用 (>)
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-4 border-l-blue-400 text-slate-600 bg-blue-100/50 pl-4 pr-3 py-2 my-4 rounded-r-md" {...props} />
              ),
              // 通常の段落
              p: ({node, ...props}) => (
                <p className="text-gray-800 mb-3" {...props} />
              ),
            }}
          >
            {travelPlan}
          </ReactMarkdown>
        </CardContent>
      </Card>
    )}

{bookmarkedPosts.length === 0 ? (
      <p className="text-center text-gray-500">ブックマークされた投稿はありません。</p>
    ) : ( 
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
    )}
  </div>
);
}