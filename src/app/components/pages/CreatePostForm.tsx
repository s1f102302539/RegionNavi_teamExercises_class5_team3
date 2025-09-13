'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaImage, FaMapMarkerAlt } from 'react-icons/fa';

// コンポーネント名をファイル名と合わせることを推奨します
export default function CreatePostForm() {
  const router = useRouter();

  // 共有いただいた投稿ロジックは、そのまま活用します
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const content = formData.get('content') as string;
    const form = event.currentTarget;

    if (!content.trim()) return; // 空白のみの投稿も防ぐ

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
      console.error("投稿エラー:", error);
      alert('投稿に失敗しました。');
      return;
    }

    // サーバーコンポーネントを再描画して新しい投稿を反映
    router.refresh();
    alert('投稿が完了しました');
    // フォームの内容をリセット
    form.reset();
  };

  // --- ここから下がUI部分です ---
  // 前回提案したUIデザインを適用し、formとtextareaにロジックを接続します
  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow">
      <div className="flex space-x-4">
        <Image
          src="/logo_circle.png" // 将来的にはログインユーザーのアバター画像
          alt="あなた"
          width={48}
          height={48}
          className="rounded-full"
        />
        <textarea
          name="content" // FormDataで値を取得するためにname属性は必須です
          placeholder="埼玉県の魅力について投稿しよう！"
          className="w-full p-2 border-none focus:ring-0 rounded-lg bg-gray-100 resize-none"
          rows={3}
        />
      </div>
      <div className="flex justify-between items-center mt-3">
        <div className="flex space-x-4 text-gray-500">
          <button type="button" className="hover:text-[#00A968] transition" aria-label="画像を追加">
            <FaImage size={20} />
          </button>
          <button type="button" className="hover:text-[#00A968] transition" aria-label="位置情報を追加">
            <FaMapMarkerAlt size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="bg-[#00A968] text-white font-bold py-2 px-6 rounded-full hover:bg-[#008f58] transition"
        >
          投稿する
        </button>
      </div>
    </form>
  );
}