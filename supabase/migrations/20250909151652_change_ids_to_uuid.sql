-- ========= 1. 既存のテーブルを全て削除 =========
-- 外部キーの依存関係があるため、参照しているテーブルから先に削除します。
DROP TABLE IF EXISTS "public"."comments";
DROP TABLE IF EXISTS "public"."post_tags";
DROP TABLE IF EXISTS "public"."reactions";
DROP TABLE IF EXISTS "public"."posts";
DROP TABLE IF EXISTS "public"."tags";
DROP TABLE IF EXISTS "public"."follows";
DROP TABLE IF EXISTS "public"."users";
DROP TABLE IF EXISTS "public"."notes";


-- ========= 2. UUIDを主キーとしてテーブルを再定義 =========

-- profilesテーブル (旧usersテーブル)
-- Supabase Authのユーザーと1対1で紐づくプロフィール情報を格納します。
CREATE TABLE "public"."profiles" (
    "id" uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "username" text,
    "avatar_url" text,
    "updated_at" timestamptz DEFAULT timezone('utc'::text, now())
);
COMMENT ON TABLE "public"."profiles" IS 'User profile information';

-- followsテーブル
CREATE TABLE "public"."follows" (
    "follower_id" uuid NOT NULL REFERENCES "public"."profiles"(id) ON DELETE CASCADE,
    "following_id" uuid NOT NULL REFERENCES "public"."profiles"(id) ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT "follows_check" CHECK (("follower_id" <> "following_id"))
);
COMMENT ON TABLE "public"."follows" IS 'User follow relationships';

-- tagsテーブル
CREATE TABLE "public"."tags" (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL UNIQUE,
    "created_at" timestamptz DEFAULT timezone('utc'::text, now())
);
COMMENT ON TABLE "public"."tags" IS 'Tags for posts';

-- postsテーブル
CREATE TABLE "public"."posts" (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"(id) ON DELETE CASCADE,
    "content" text,
    "media_url" varchar(255),
    "created_at" timestamptz DEFAULT timezone('utc'::text, now())
);
COMMENT ON TABLE "public"."posts" IS 'User posts content';

-- commentsテーブル
CREATE TABLE "public"."comments" (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "post_id" uuid NOT NULL REFERENCES "public"."posts"(id) ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"(id) ON DELETE CASCADE,
    "content" text NOT NULL,
    "created_at" timestamptz DEFAULT timezone('utc'::text, now())
);
COMMENT ON TABLE "public"."comments" IS 'Comments on posts';

-- reactions (いいね) テーブル
CREATE TABLE "public"."reactions" (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "post_id" uuid NOT NULL REFERENCES "public"."posts"(id) ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"(id) ON DELETE CASCADE,
    "reaction_type" varchar(50),
    "created_at" timestamptz DEFAULT timezone('utc'::text, now()),
    UNIQUE (post_id, user_id) -- 1ユーザーが1投稿にできるリアクションは1つだけ
);
COMMENT ON TABLE "public"."reactions" IS 'Reactions to posts, like likes';

-- post_tags (中間テーブル)
CREATE TABLE "public"."post_tags" (
    "post_id" uuid NOT NULL REFERENCES "public"."posts"(id) ON DELETE CASCADE,
    "tag_id" uuid NOT NULL REFERENCES "public"."tags"(id) ON DELETE CASCADE,
    "created_at" timestamptz DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (post_id, tag_id)
);
COMMENT ON TABLE "public"."post_tags" IS 'Join table for posts and tags';


-- ========= 3. RLSポリシーを有効化 =========
-- 各テーブルでRow Level Securityを有効にします。
-- (ポリシーの具体的な定義は別途マイグレーションで行うのが一般的です)
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."post_tags" ENABLE ROW LEVEL SECURITY;


-- ========= 4. handle_new_user関数とトリガーの再設定 =========
-- Supabase Authに新しいユーザーが登録されたとき、profilesテーブルに自動で行を挿入する関数。
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER set search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
END;
$$;

-- auth.usersテーブルにトリガーを設定
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();