'use client';

import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, FormEvent } from 'react';
import { FaHeart, FaComment, FaRegBookmark, FaRegHeart } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { FiSend } from 'react-icons/fi';
import CommentItem from './CommentItem';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Post, User, CommentType } from '@/types/supabase'; 

export interface PostItemProps {
  post: any; // PostForCardの型
  currentUser: User | null;
  side: 'left' | 'right'; // 追加: sideプロパティ
}

// ハッシュタグをリンクに変換するコンポーネント
const PostContent = ({ content, side }: { content: string, side: 'left' | 'right'}) => {
  // ★ 現在のURLパラメータを取得
  const currentParams = useSearchParams();

  // ★ レイアウトに合わせたハッシュタグ検索URLを生成する関数
  const createHashtagSearchUrl = (tag: string) => {
    // 現在のURLパラメータをベースに、新しいパラメータを作成
    const newParams = new URLSearchParams(currentParams.toString());

    newParams.set(side, 'search');
    newParams.set('tag', tag);
    
    return `/home?${newParams.toString()}`;
  };
  
  // 正規表現は前回修正した日本語対応版を使用
  const parts = content.split(/(#[^\s#]+)/g);
  
    return (
    <p className="text-gray-800 mt-2 mb-4 whitespace-pre-wrap">
      {parts.map((part, index) =>
        part.match(/#[^\s#]+/) ? (
          <Link
            key={index}
            // 生成したURLをリンク先として使用
            href={createHashtagSearchUrl(part.substring(1))}
            className="text-blue-500 hover:underline"
          >
            {part}
          </Link>
        ) : (
          part
        )
      )}
    </p>
  );
};

export default function PostCard({ post, currentUser, side }: PostItemProps) {
  const router = useRouter();
  const supabase = createClient();
  const params = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string>('/logo_circle.png');
  // 投稿画像のフルパスを管理するState
  const [displayMediaUrl, setDisplayMediaUrl] = useState<string | null>(null);

  // いいね機能のState
  const [isLiked, setIsLiked] = useState(post.is_liked_by_user);
  const [likeCount, setLikeCount] = useState<number>(post.likes); 

  // コメント機能のState
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentList, setCommentList] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(post.comments);

  const rightView = params.get('right') || 'stamprally';

  console.log('渡されたpostデータ:', post);

  // コンポーネント読み込み時にパスから完全なURLを生成
  useEffect(() => {
    // アバター画像のURLを生成
    if (post.profiles?.avatar_url) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(post.profiles.avatar_url);
      if (data?.publicUrl) {
        setDisplayAvatarUrl(data.publicUrl);
      }
    }
    // 投稿画像のURLを生成
    if (post.media_url) {
      // media_urlが既に完全なURL形式('http'で始まる)かどうかをチェック
      if (post.media_url.startsWith('http')) {
        // すでにURLなら、そのままstateにセット
        setDisplayMediaUrl(post.media_url);
      } else {
        // URLでなければ（パス形式なら）、公開URLを取得
        const { data } = supabase.storage.from('TimeLineImages').getPublicUrl(post.media_url);
        if (data?.publicUrl) {
          setDisplayMediaUrl(data.publicUrl);
        }
      }
    }
  }, [post.profiles?.avatar_url, post.media_url, supabase.storage]);


  // 投稿を削除する関数
  const handleDelete = async () => {
    if (!window.confirm('本当にこの投稿を削除しますか？')) return;

    const { error } = await supabase.from('posts').delete().eq('id', post.id);

    if (error) {
      alert('削除に失敗しました: ' + error.message);
      return;
    }
    
    // post.media_urlはパスなので、Storageから削除する際もパスを直接使う
    if (post.media_url) {
        await supabase.storage.from('TimeLineImages').remove([post.media_url]);
    }

    router.refresh();
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
      setIsEditing(false);
      router.refresh();
    }
  };

    // ★ 変更点: いいねボタンの処理
  const handleLikeToggle = async () => {
    if (!currentUser) return alert('いいねするにはログインが必要です。');
    
    const currentlyLiked = !isLiked;
    setIsLiked(currentlyLiked);
    setLikeCount(likeCount + (currentlyLiked ? 1 : -1));

    if (currentlyLiked) {
      const { error } = await supabase.from('reactions').insert({ user_id: currentUser.id, post_id: post.id, reaction_type: 'good' });
      if (error) {
        setIsLiked(false);
        setLikeCount(likeCount);
        console.error('Error liking post:', error.message);
      }
    } else {
      const { error } = await supabase.from('reactions').delete().match({ user_id: currentUser.id, post_id: post.id, reaction_type: 'good' });
      if (error) {
        setIsLiked(true);
        setLikeCount(likeCount);
        console.error('Error unliking post:', error.message);
      }
    }
  };

  // コメント
  const toggleComments = async () => {
  const shouldOpen = !isCommentsOpen;
  setIsCommentsOpen(shouldOpen);

  if (shouldOpen && commentList.length === 0) {
    setIsLoadingComments(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (data) setCommentList(data as CommentType[]);
    if (error) console.error('Error fetching comments:', error.message);
    setIsLoadingComments(false);
  }
};

  // ★ 変更点: コメント投稿の処理
  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || newComment.trim() === '') return;

    const { data, error } = await supabase
      .from('comments')
      .insert({ content: newComment.trim(), user_id: currentUser.id, post_id: post.id })
      .select('*, profiles(username, avatar_url)')
      .single();

    if (error) {
      alert('コメントの投稿に失敗しました。');
    } else if (data) {
      setCommentList([...commentList, data as CommentType]);
      setNewComment('');
      setCommentCount(prevCount => prevCount + 1);
    }
  };

  const userProfileUrl = (() => {
    const newParams = new URLSearchParams(params.toString());
    // 常に左画面をuserprofileに設定
    newParams.set(side, 'userprofile');
    newParams.set('userId', post.user_id);
    // 右画面の状態は new URLSearchParams(params.toString()) によって維持される
    return `/home?${newParams.toString()}`;
  })();

  const isAuthor = currentUser?.id === post.user_id;

  return (
    <>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start">
        <Link href={userProfileUrl}>
          <Image
            src={displayAvatarUrl}
            alt={post.profiles?.username || 'ユーザー'}
            width={48}
            height={48}
            className="rounded-full bg-gray-200 object-cover"
          />
        </Link>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <Link href={userProfileUrl}>
               <p className={`font-bold ${isAuthor ? 'text-green-600' : 'text-gray-900'} hover:underline`}>
                  {post.profiles?.username || '匿名ユーザー'}
                </p>
              </Link>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ja })}
              </p>
            </div>
            {isAuthor && (
              <div className="flex space-x-2">
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-sm text-gray-500 hover:text-blue-500">編集</button>
                )}
                <button onClick={handleDelete} className="text-sm text-gray-500 hover:text-red-500">削除</button>
              </div>
            )}
          </div>

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
              <>
                {post.content && (
                  <PostContent content={post.content} side={side} />
                )}
                
                {/* ★ 変更点4: 投稿画像のsrcをState変数に変更 */}
                {displayMediaUrl && (
                  <div 
                    className="rounded-xl overflow-hidden border mt-3 max-h-[500px] cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Image
                      src={displayMediaUrl} alt="投稿画像" width={800} height={450}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </>
          )}

          {!isEditing && (
            <>
              <div className="flex justify-between items-center mt-4 text-gray-500">
                <button onClick={handleLikeToggle} className="flex items-center space-x-2 hover:text-pink-500 transition-colors duration-200">
                  {isLiked ? <FaHeart className="text-pink-500" /> : <FaRegHeart />}
                  <span className="text-sm font-semibold">{likeCount}</span>
                </button>
                <button onClick={toggleComments} className="flex items-center space-x-2 hover:text-blue-500 transition-colors duration-200">
                  <FaComment /> 
                  <span className="text-sm font-semibold">{commentCount}</span>
                </button>
                <button className="hover:text-yellow-500 transition-colors duration-200"><FaRegBookmark size={18} /></button>
              </div>
              
              {/* コメントセクションの描画 */}
              {isCommentsOpen && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <form onSubmit={handleCommentSubmit} className="flex items-center mb-4">
                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="コメントを追加..." className="flex-grow border rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A968]" />
                    <button type="submit" className="ml-2 p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"><FiSend size={20} /></button>
                  </form>
                    {isLoadingComments ? (<p className="text-sm text-gray-500">コメントを読み込み中...</p>) : (
                      <div className="space-y-4"> {/* 見やすさのため space-y-3 -> space-y-4 に変更 */}
                        {/* CommentItem コンポーネントを使って表示 */}
                        {commentList.map((comment) => (
                          <CommentItem key={comment.id} comment={comment} />
                        ))}
                        {commentList.length === 0 && <p className="text-sm text-gray-500">まだコメントはありません。</p>}
                      </div>
                    )}
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>

    {isModalOpen && displayMediaUrl && (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
        <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <Image src={displayMediaUrl} alt="投稿画像（拡大）" width={1200} height={1200} className="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain" />
        </div>
        <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-white text-4xl" aria-label="閉じる">&times;</button>
      </div>
    )}
    </>
  );
}