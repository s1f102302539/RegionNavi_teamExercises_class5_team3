// postsテーブルの基本的な型
export type Post = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

// profilesテーブルの基本的な型
export type Profile = {
  id: string;
  username: string;
  avatar_url: string;
};

// Post型にProfile情報を結合した新しい型
export type PostWithProfile = Post & {
  profiles: Profile | null;
};