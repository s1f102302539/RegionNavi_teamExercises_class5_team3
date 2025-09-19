'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { CommentType } from '@/types/supabase'; // 型定義をインポート

type CommentItemProps = {
  comment: CommentType;
};

export default function CommentItem({ comment }: CommentItemProps) {
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState('/logo_circle.png');

  useEffect(() => {
    if (comment.profiles?.avatar_url) {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(comment.profiles.avatar_url);
      setAvatarUrl(data.publicUrl);
    }
  }, [comment.profiles?.avatar_url, supabase.storage]);

  return (
    <div className="flex items-start text-sm space-x-3">
      {/* アイコン画像 */}
      <Image
        src={avatarUrl}
        alt={comment.profiles?.username || 'ユーザー'}
        width={36}
        height={36}
        className="rounded-full bg-gray-200 object-cover mt-1"
      />
      <div className="flex-1">
        <div className="bg-gray-100 rounded-xl p-3">
          <div className="flex items-center justify-between">
            {/* ユーザー名 */}
            <p className="font-bold text-gray-900">{comment.profiles?.username || '匿名'}</p>
            {/* 投稿時間 */}
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ja })}
            </p>
          </div>
          {/* コメント本文 */}
          <p className="text-gray-800 mt-1 whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
    </div>
  );
}