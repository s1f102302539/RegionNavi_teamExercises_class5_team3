'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// このコンポーネントが受け取るPropsの型を定義
type User = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  status: string | null;
};

type UserCardProps = {
  user: User;
  side: "left" | "right"; // ← 追加
};

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
          
          {/* 条件に応じてバッジを表示 */}
          {user.status === 'Official' && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full mx-1 my-1">
              公式
            </span>
          )}
          <p className="font-bold">{user.username}</p> 
        </div>
        

        <p className="text-sm text-gray-600 line-clamp-1">{user.bio}</p>
      </div>
    </Link>
  );
}