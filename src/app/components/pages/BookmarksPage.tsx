// src/app/components/pages/BookmarksPage.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import PostCard from './PostCard';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createTravelPlan } from '../../actions/createTravelPlan';
import ReactMarkdown from 'react-markdown';

// ✅ 入力モーダル用のコンポーネント
const PlanInputModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isGenerating 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (duration: string, budget: string, request: string) => void; // budgetを追加
  isGenerating: boolean; 
}) => {
  const [duration, setDuration] = useState('1泊2日');
  const [budget, setBudget] = useState('未定'); // 予算のstate
  const [request, setRequest] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">旅行プランの条件設定</h2>
        
        {/* 旅行期間 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">旅行期間</label>
          <select 
            value={duration} 
            onChange={(e) => setDuration(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="日帰り">日帰り</option>
            <option value="1泊2日">1泊2日</option>
            <option value="2泊3日">2泊3日</option>
            <option value="3泊4日">3泊4日</option>
          </select>
        </div>

        {/* ✅ 予算選択の追加 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">予算 (1人あたり)</label>
          <select 
            value={budget} 
            onChange={(e) => setBudget(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="未定">未定</option>
            <option value="〜3万円 (なるべく節約)">〜3万円 (なるべく節約)</option>
            <option value="3〜5万円 (標準)">3〜5万円 (標準)</option>
            <option value="5〜10万円 (少し贅沢)">5〜10万円 (少し贅沢)</option>
            <option value="10万円〜 (ラグジュアリー)">10万円〜 (ラグジュアリー)</option>
          </select>
        </div>

        {/* 具体的な要望 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            具体的な要望 (任意)
          </label>
          <textarea 
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="例: 温泉に入りたい、海鮮が食べたい、歴史的な場所に行きたい..."
            className="w-full border border-gray-300 rounded-md p-2 h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            キャンセル
          </Button>
          <Button 
            onClick={() => onSubmit(duration, budget, request)} 
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? '生成中...' : 'プランを作成する'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function BookmarksPage() {
  const supabase = createClient();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [travelPlan, setTravelPlan] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // ✅ 引数に budget を追加
  const handleGeneratePlan = async (duration: string, budget: string, request: string) => {
    setIsGeneratingPlan(true);
    setTravelPlan(null);
    try {
      // サーバーアクションに期間・予算・要望を渡す
      const plan = await createTravelPlan(bookmarkedPosts, duration, budget, request);
      setTravelPlan(plan);
      setIsModalOpen(false);
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
          <Button onClick={handleOpenModal} disabled={isGeneratingPlan}>
            AIに旅行計画を提案してもらう
          </Button>
        )}
      </div>

      <PlanInputModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleGeneratePlan}
        isGenerating={isGeneratingPlan}
      />

      {travelPlan && (
        <Card className="mb-6 bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-blue-500">AIからの旅行プラン提案</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => (
                  <h1 className="text-2xl font-bold text-blue-500 mb-4 border-b border-blue-100 pb-2" {...props} />
                ),
                h2: ({node, ...props}) => (
                  <h2 className="text-xl font-semibold text-blue-500 mt-6 mb-3" {...props} />
                ),
                h3: ({node, ...props}) => (
                  <h3 className="text-lg font-semibold text-teal-500 mt-4 mb-2" {...props} />
                ),
                strong: ({node, ...props}) => (
                  <strong className="font-bold text-emerald-500" {...props} />
                ),
                a: ({node, ...props}) => (
                  <a className="text-indigo-500 hover:text-indigo-700 hover:underline" {...props} />
                ),
                ul: ({node, ...props}) => (
                  <ul className="list-none list-inside space-y-1 my-3 pl-0" {...props} />
                ),
                li: ({node, ...props}) => (
                  <li 
                    className="text-gray-800 [&_strong]:text-gray-800 [&_strong]:font-normal marker:text-blue-400" 
                    {...props} 
                  />
                ),
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-l-blue-300 text-slate-600 bg-blue-50 pl-4 pr-3 py-2 my-4 rounded-r-md" {...props} />
                ),
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