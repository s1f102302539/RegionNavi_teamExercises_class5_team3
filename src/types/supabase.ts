// 型定義 (例: types/supabase.ts)

// ユーザープロフィール
export type Profile = {
  username: string | null;
  avatar_url: string | null;
  status: string | null;
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
    status: string | null;
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
  prefecture: string | null; // ★ 追加点: 都道府県情報
  is_bookmarked_by_user: boolean;
};

// ユーザーの型
export type User = {
  id: string;
};


export type UserResult = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  status: string | null;
};

// stampsテーブルの型定義 (緯度・経度を追加)
export type Stamp = {
  id: string;
  name: string;
  description: string | null;
  prefecture: string | null;
  latitude: number | null;  // 緯度を追加
  longitude: number | null; // 経度を追加
};

// RPC関数から返ってくる生のデータの型
export type PostWithDetails = {
  id: string;
  user_id: string;
  media_url: string | null;
  content: string;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
  like_count: number;
  comment_count: number;
  is_liked_by_user: boolean;
  prefecture: string | null;
  is_bookmarked_by_user: boolean;
};

// PostCardコンポーネントが props として必要とする post オブジェクトの型
export type PostForCard = {
  id: string;
  user_id: string;
  media_url: string | null;
  content: string;
  created_at: string;
  profiles: { // PostCardはprofilesオブジェクトを期待している
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes: number; // PostCardが期待するプロパティ名
  comments: number; // PostCardが期待するプロパティ名
  is_liked_by_user: boolean;
  prefecture: string | null;
  is_bookmarked_by_user: boolean;
};

// PostCardコンポーネントのProps全体の型
export type PostItemProps = {
  post: PostForCard;
  currentUser: User | null;
};