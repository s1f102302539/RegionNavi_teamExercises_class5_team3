'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import UserCard from './UserCard'; // 既存のUserCardを再利用
import type { UserResult } from '@/types/supabase';

interface FollowListProps {
  userId: string;
  type: 'followers' | 'following';
  side: 'left' | 'right';
}

export default function FollowList({ userId, type, side }: FollowListProps) {
  const supabase = createClient();
  const params = useSearchParams();
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  // 「← プロフィールに戻る」リンクのURLを生成
  const backUrl = (() => {
    const newParams = new URLSearchParams(params.toString());
    // 現在の画面(side)を再びプロフィール表示に戻す設定
    newParams.set(side, 'userprofile');
    newParams.set('userId', userId);
    // 不要なtypeパラメータは削除
    newParams.delete('type');
    return `/home?${newParams.toString()}`;
  })();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      let data: any[] | null = null;
      let error = null;

      if (type === 'followers') {
        setTitle('フォロワー');
        // 「自分をフォローしている人」を取得
        // followsテーブルの following_id が自分(userId)であるレコードを探し、
        // そのレコードの follower_id (相手) のプロフィール情報を取得する
        const response = await supabase
          .from('follows')
          .select('profiles!follower_id(id, username, avatar_url, bio)')
          .eq('following_id', userId);
        
        // レスポンスの構造を平坦化してUserResult[]の形にする
        data = response.data?.map((d: any) => d.profiles) || [];
        error = response.error;

      } else {
        setTitle('フォロー中');
        // 「自分がフォローしている人」を取得
        // followsテーブルの follower_id が自分(userId)であるレコードを探し、
        // そのレコードの following_id (相手) のプロフィール情報を取得する
        const response = await supabase
          .from('follows')
          .select('profiles!following_id(id, username, avatar_url, bio)')
          .eq('follower_id', userId);

        data = response.data?.map((d: any) => d.profiles) || [];
        error = response.error;
      }

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data as UserResult[]);
      }
      setLoading(false);
    };

    fetchUsers();
  }, [userId, type, supabase]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex items-center p-2">
        <Link href={backUrl} className="text-sm font-semibold text-gray-600 hover:underline mr-4">
          ← プロフィールに戻る
        </Link>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-500">読み込み中...</p>
      ) : users.length === 0 ? (
        <p className="text-center py-8 text-gray-500">ユーザーがいません。</p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            // sideを渡すことで、クリック時に正しい画面でプロフィールが開くようになる
            <UserCard key={user.id} user={user} side={side} />
          ))}
        </div>
      )}
    </div>
  );
}