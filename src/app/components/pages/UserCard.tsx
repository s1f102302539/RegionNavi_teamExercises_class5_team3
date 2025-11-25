'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
// 型定義がない場合は any で回避しつつ、必要なプロパティを定義
interface UserCardProps {
  user: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    status?: string; // 公式マーク用
  };
  side: 'left' | 'right';
}

export default function UserCard({ user, side }: UserCardProps) {
  const params = useSearchParams();
  const supabase = createClient();
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string>('/logo_circle.png');

  // プロフィールページへのURLを動的に生成
  const profileUrl = (() => {
    const newParams = new URLSearchParams(params.toString());
    newParams.set(side, 'userprofile');
    newParams.set('userId', user.id);
    return `/home?${newParams.toString()}`;
  })();

  useEffect(() => {
    if (user.avatar_url) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(user.avatar_url);
      if (data?.publicUrl) {
        setDisplayAvatarUrl(data.publicUrl);
      }
    }
  }, [user.avatar_url, supabase]);

  return (
    <Link href={profileUrl} className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors duration-200 border border-gray-100">
      <div className="relative w-12 h-12 flex-shrink-0">
        <Image
          src={displayAvatarUrl}
          alt={user.username || 'アバター'}
          fill
          className="rounded-full bg-gray-200 object-cover"
        />
      </div>
      <div className="ml-4 min-w-0 flex-1">
        <div className="flex items-center space-x-2">
          {user.status === 'official' && (
            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
              公式
            </span>
          )}
          <p className="font-bold text-gray-800 truncate">{user.username || '匿名ユーザー'}</p>
        </div>
        <p className="text-sm text-gray-600 line-clamp-1">{user.bio || '自己紹介がありません'}</p>
      </div>
    </Link>
  );
}