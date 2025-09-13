'use client';

import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaHeart, FaComment, FaRegBookmark } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

// 型定義
type Post = {
  id: string;
  content: string;
  media_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes?: number; // ★いいね・コメント数を許容するよう修正
  comments?: number;
};

type User = {
  id: string;
};

// コンポーネントのPropsの型定義
type PostItemProps = {
  post: Post;
  currentUser: User | null;
};

export default function PostCard({ post, currentUser }: PostItemProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 投稿を削除する関数
  const handleDelete = async () => {
    if (!window.confirm('本当にこの投稿を削除しますか？')) return;

    // postsテーブルからレコードを削除
    const { error } = await supabase.from('posts').delete().eq('id', post.id);

    if (error) {
      alert('削除に失敗しました: ' + error.message);
      return;
    }
    
    // もし画像があれば、Storageからも削除
    if (post.media_url) {
        const fileName = post.media_url.split('/').pop();
        if (fileName) {
            await supabase.storage.from('TimeLineImages').remove([`${post.user_id}/${fileName}`]);
        }
    }

    router.refresh(); // ページを再読み込みしてUIを更新
  };

  // 投稿を更新する関数
  const handleUpdate = async () => {
    if (!editedContent.trim()) {
        alert('内容を入力してください。');
        return;
    }

    const { error } = await supabase
      .from('posts')
      .update({ content: editedContent })
      .eq('id', post.id);

    if (error) {
      alert('更新に失敗しました: ' + error.message);
    } else {
      setIsEditing(false); // 編集モードを終了
      router.refresh(); // ページを再読み込み
    }
  };

  // 現在ログインしているユーザーが投稿者かどうかを判定
  const isAuthor = currentUser?.id === post.user_id;

  return (
    <>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start">
        <Image
          src={post.profiles?.avatar_url || '/logo_circle.png'}
          alt={post.profiles?.username || 'ユーザー'}
          width={48}
          height={48}
          className="rounded-full bg-gray-200"
        />
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-bold ${isAuthor ? 'text-green-600' : 'text-gray-900'}`}>{post.profiles?.username || '匿名ユーザー'}</p>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ja })}
              </p>
            </div>
            {/* 投稿者本人にのみ編集・削除ボタンを表示 */}
            {isAuthor && (
              <div className="flex space-x-2">
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-sm text-gray-500 hover:text-blue-500">編集</button>
                )}
                <button onClick={handleDelete} className="text-sm text-gray-500 hover:text-red-500">削除</button>
              </div>
            )}
          </div>

          {/* 編集モードのUI */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-2 border rounded-lg bg-gray-100"
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button onClick={() => setIsEditing(false)} className="text-sm py-1 px-3 rounded-full bg-gray-200 hover:bg-gray-300">キャンセル</button>
                <button onClick={handleUpdate} className="text-sm py-1 px-3 rounded-full bg-[#00A968] text-white hover:bg-[#008f58]">更新する</button>
              </div>
            </div>
          ) : (
            // 通常表示のUI
              <>
                {post.content && (
                  <p className="text-gray-800 mt-2 mb-4 whitespace-pre-wrap">{post.content}</p>
                )}
                
                {/* ★変更点: 画像表示部分にサイズ制限とクリックイベントを追加 */}
                {post.media_url && (
                  <div 
                    className="rounded-xl overflow-hidden border mt-3 max-h-[500px] cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Image
                      src={post.media_url} alt="投稿画像" width={800} height={450}
                      className="w-full h-full object-cover" // h-autoからh-fullに変更
                    />
                  </div>
                )}
              </>
          )}

          {/* いいね、コメントなどのアイコン */}
          {!isEditing && (
             <div className="flex justify-between items-center mt-4 text-gray-500">
                {/* ... アイコンボタン ... */}
                <button className="flex items-center space-x-2 hover:text-pink-500 transition-colors duration-200"><FaHeart /> <span className="text-sm font-semibold">{post.likes}</span></button>
                <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors duration-200"><FaComment /> <span className="text-sm font-semibold">{post.comments}</span></button>
                <button className="hover:text-yellow-500 transition-colors duration-200"><FaRegBookmark size={18} /></button>
             </div>
          )}
        </div>
      </div>
    </div>

      {/* ★追加: 画像オーバーレイ表示用のJSX */}
      {isModalOpen && post.media_url && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()} 
          >
            <Image
              src={post.media_url}
              alt="投稿画像（拡大）"
              width={1200}
              height={1200}
              className="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-5 right-5 text-white text-4xl"
            aria-label="閉じる"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
}
