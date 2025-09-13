'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function MypageEditPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally';

  // --- State管理 ---
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  // --- データ取得処理 ---
  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // ユーザーがいない場合はログインページなどにリダイレクト
        router.push('/login');
        return;
      }
      setUser(user);

      // Supabaseのprofilesテーブルからデータを取得
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, bio`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username || '');
        setBio(data.bio || '');
      }
    } catch (error) {
      console.error('プロフィールの取得に失敗しました。', error);
      alert('エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  // --- ページ読み込み時にプロフィールを取得 ---
  useEffect(() => {
    getProfile();
  }, [getProfile]);


  // --- 更新処理 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('profiles').update({
        username: username,
        bio: bio,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      if (error) {
        throw error;
      }

      alert('プロフィールを保存しました！');
      // 保存後、マイページに戻る
      router.push(`/home?left=mypage&right=${rightView}`);

    } catch (error) {
      console.error('プロフィールの更新に失敗しました。', error);
      alert('更新に失敗しました。');
    }
  };

  // ロード中の表示
  if (loading) {
    return <div className="max-w-2xl mx-auto text-center py-10">読み込み中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">プロフィール編集</h1>
      <div className="bg-white p-8 rounded-xl shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            {/* TODO: アバター画像表示機能 */}
            <Image src="/logo_circle.png" alt="現在のアバター" width={100} height={100} className="rounded-full mb-2" />
            <button type="button" className="text-sm font-semibold text-[#00A968] hover:underline">画像を変更</button>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">ユーザー名</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username} // defaultValueからvalueに変更
              onChange={(e) => setUsername(e.target.value)} // onChangeでStateを更新
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A968] focus:border-[#00A968]"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">自己紹介</label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={bio} // defaultValueからvalueに変更
              onChange={(e) => setBio(e.target.value)} // onChangeでStateを更新
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A968] focus:border-[#00A968]"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <Link href={`/home?left=mypage&right=${rightView}`} className="px-6 py-2 border border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-50 transition">キャンセル</Link>
            <button type="submit" className="px-6 py-2 bg-[#00A968] text-white font-semibold rounded-full hover:bg-[#008f58] transition">保存する</button>
          </div>
        </form>
      </div>
    </div>
  );
}
