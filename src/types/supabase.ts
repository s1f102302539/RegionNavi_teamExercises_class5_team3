// 型定義 (例: types/supabase.ts)

// ユーザープロフィール
export type Profile = {
  username: string | null;
  avatar_url: string | null;
};

// コメントの型
export type CommentType = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

// 投稿の型 (元の型にいいねの状態などを追加)
export type Post = {
  id: string;
  content: string;
  media_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes: number; // ★ 変更点: いいねの総数 (RPCから取得)
  comments: number; // ★ 変更点: コメントの総数 (RPCから取得)
  is_liked_by_user: boolean; // ★ 変更点: ログインユーザーがいいね済みか (RPCから取得)
};

// ユーザーの型
export type User = {
  id: string;
};

// コンポーネントのPropsの型定義
export type PostItemProps = {
  post: Post;
  currentUser: User | null;
};