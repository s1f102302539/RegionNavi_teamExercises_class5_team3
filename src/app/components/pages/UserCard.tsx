'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { UserResult } from '@/types/supabase';

interface UserCardProps {
  user: UserResult; // UserResultがstatusプロパティも含むようにする
  side: 'left' | 'right';
}

export default function UserCard({ user }: UserCardProps) {
  const supabase = createClient();
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string>('/logo_circle.png');

  // 画像のパスから完全な公開URLを生成する
  useEffect(() => {
    if (user.avatar_url) {
      const { data } = supabase.storage
        .from('avatars') // アバターが保存されているバケット名
        .getPublicUrl(user.avatar_url);

      if (data?.publicUrl) {
        setDisplayAvatarUrl(data.publicUrl);
      }
    }
  }, [user.avatar_url, supabase.storage]);

  return (
    <Link href={`/user/${user.id}`} className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <Image 
        src={displayAvatarUrl} 
        width={48} 
        height={48} 
        alt={user.username || 'avatar'} 
        className="rounded-full bg-gray-200 object-cover"
      />
      <div className="ml-4">
        <div className="flex items-center space-x-2">
          {/* featureブランチから「公式バッジ」の機能を採用 */}
          {user.status === 'Official' && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              公式
            </span>
          )}
          {/* mainブランチから「フォールバック表示」の機能を採用 */}
          <p className="font-bold text-gray-800">{user.username || '匿名ユーザー'}</p>
        </div>
        
        {/* mainブランチから「フォールバック表示」と「line-clamp-2」を採用 */}
        <p className="text-sm text-gray-600 line-clamp-2">{user.bio || '自己紹介がありません'}</p>
      </div>
    </Link>
  );
}