'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import UserCard from './UserCard';
import { FaArrowLeft } from 'react-icons/fa';

interface FollowListProps {
  userId: string;
  type: 'followers' | 'following';
  side: 'left' | 'right';
}

export default function FollowList({ userId, type, side }: FollowListProps) {
  const supabase = createClient();
  const params = useSearchParams();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  // 「← 戻る」リンクのURL (元のプロフィール画面に戻る)
  const backUrl = (() => {
    const newParams = new URLSearchParams(params.toString());
    // 自分のIDならmypage、他人ならuserprofileに戻すのが理想ですが、
    // HomePageControllerのロジック的に userprofile + userId で統一して問題ありません。
    newParams.set(side, 'userprofile');
    newParams.set('userId', userId); 
    newParams.delete('type');
    return `/home?${newParams.toString()}`;
  })();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      let data: any[] | null = null;
      
      if (type === 'followers') {
        setTitle('フォロワー');
        // 自分をフォローしている人を取得
        const response = await supabase
          .from('follows')
          .select('profiles!follower_id(*)') // follower_id側のプロフィールを取得
          .eq('following_id', userId);
        
        // データ構造を平坦化
        data = response.data?.map((d: any) => d.profiles) || [];

      } else {
        setTitle('フォロー中');
        // 自分がフォローしている人を取得
        const response = await supabase
          .from('follows')
          .select('profiles!following_id(*)') // following_id側のプロフィールを取得
          .eq('follower_id', userId);

        data = response.data?.map((d: any) => d.profiles) || [];
      }

      setUsers(data || []);
      setLoading(false);
    };

    fetchUsers();
  }, [userId, type, supabase]);

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col">
      <div className="mb-4 flex items-center p-4 bg-white rounded-xl shadow-sm sticky top-0 z-10">
        <Link href={backUrl} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition">
          <FaArrowLeft className="text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        {loading ? (
          <p className="text-center py-8 text-gray-500">読み込み中...</p>
        ) : users.length === 0 ? (
          <p className="text-center py-8 text-gray-500">ユーザーがいません。</p>
        ) : (
          <div className="space-y-2 pb-20">
            {users.map((user) => (
              <UserCard key={user.id} user={user} side={side} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}