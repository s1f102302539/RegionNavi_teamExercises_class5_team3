'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { FaHeart, FaComment, FaRegBookmark } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// 型定義を拡張して、画像のURLも受け取れるようにする
type Post = {
  id: number;
  created_at: string;
  content: string;
  image_url: string | null; // 投稿画像のURL (postsテーブルに追加)
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

type PostCardProps = {
  post: Post;
  likesCount: number;
  isLiked: boolean;
};

export default function PostCard({ post, likesCount: initialLikesCount, isLiked: initialIsLiked }: PostCardProps) {
  const supabase = createClientComponentClient();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);

  // いいね処理（前回と同じ）
  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('いいねするにはログインが必要です。');
      return;
    }
    if (isLiked) {
      await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
      setLikesCount(likesCount - 1);
      setIsLiked(false);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
      setLikesCount(likesCount + 1);
      setIsLiked(true);
    }
  };

  return (
    // ここからがご希望のUIデザインです
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      {/* ユーザー情報 */}
      <div className="flex items-center mb-4">
        <Image
          src={post.profiles?.avatar_url || '/logo_circle.png'}
          alt={post.profiles?.username || 'ユーザー'}
          width={48}
          height={48}
          className="rounded-full"
        />
        <div className="ml-4">
          <p className="font-bold text-gray-900">{post.profiles?.username || '匿名ユーザー'}</p>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ja })}
          </p>
        </div>
      </div>

      {/* 投稿本文 */}
      <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

      {/* 投稿画像（image_urlが存在する場合のみ表示） */}
      {post.image_url && (
        <div className="rounded-xl overflow-hidden border mb-4">
          <Image
            src={post.image_url}
            alt="投稿画像"
            width={800}
            height={450}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* いいね、コメント、ブックマークのボタン */}
      <div className="flex justify-between items-center text-gray-500">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 transition-colors duration-200 ${
            isLiked ? 'text-pink-500' : 'hover:text-pink-500'
          }`}
        >
          <FaHeart />
          <span className="text-sm font-semibold">{likesCount}</span>
        </button>
        <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors duration-200">
          <FaComment />
          <span className="text-sm font-semibold">0</span> {/* コメント数は別途実装 */}
        </button>
        <button className="hover:text-yellow-500 transition-colors duration-200">
          <FaRegBookmark size={18} />
        </button>
      </div>
    </div>
  );
}