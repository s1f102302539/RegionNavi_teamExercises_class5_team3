// 例: components/CreatePost.tsx
'use client';
import { createClient } from '../../lib/supabase/cliant';
import { useRouter } from 'next/navigation';

export default function CreatePost() {
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const content = formData.get('content') as string;

    if (!content) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('ログインしてください');
      return;
    }

    const { error } = await supabase.from('posts').insert({
      content: content,
      user_id: user.id,
    });

    if (error) {
      console.error(error);
      return;
    }

    // 投稿後にページをリフレッシュして新しい投稿を表示
    router.refresh();
    event.currentTarget.reset(); // フォームをリセット
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="content" placeholder="いまどうしてる？" />
      <button type="submit">投稿</button>
    </form>
  );
}