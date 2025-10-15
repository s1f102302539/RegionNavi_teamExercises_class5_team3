'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserResult } from '@/types/supabase';

// UserCardが受け取るProps(プロパティ)の型を定義
interface UserCardProps {
  user: UserResult;
  side: 'left' | 'right';
}

export default function UserCard({ user, side }: UserCardProps) {
  const params = useSearchParams();
  const supabase = createClient();
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string>('/logo_circle.png');

  // ★ 修正: PostCardと同様のロジックでプロフィールページへのURLを動的に生成します
  const profileUrl = (() => {
    // 現在のURLパラメータをすべてコピー
    const newParams = new URLSearchParams(params.toString());
    
    // このカードが表示されている画面(side)の表示内容を'userprofile'に設定
    newParams.set(side, 'userprofile');
    // 表示したいユーザーのIDを設定
    newParams.set('userId', user.id);

    return `/home?${newParams.toString()}`;
  })();

  // アバター画像の公開URLを取得
  useEffect(() => {
    if (user.avatar_url) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(user.avatar_url);
      if (data?.publicUrl) {
        setDisplayAvatarUrl(data.publicUrl);
      }
    }
  }, [user.avatar_url, supabase.storage]);

  return (
    // ★ 修正: 生成したprofileUrlをリンク先として使用
    <Link href={profileUrl} className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors duration-200">
      <Image
        src={displayAvatarUrl}
        alt={user.username || 'アバター'}
        width={48}
        height={48}
        className="rounded-full bg-gray-200 object-cover"
      />
      <div className="ml-4">
        <p className="font-bold text-gray-800">{user.username || '匿名ユーザー'}</p>
        <p className="text-sm text-gray-600 line-clamp-2">{user.bio || '自己紹介がありません'}</p>
      </div>
    </Link>
  );
}