'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaImage, FaMapMarkerAlt } from 'react-icons/fa';
import { useRef, useState } from 'react'; // useRefとuseStateをインポート
import { profile } from 'console';

export default function CreatePostForm() {
  const router = useRouter();
  // 選択された画像ファイルを管理するstate
  const [imageFile, setImageFile] = useState<File | null>(null);
  // 画像のプレビューURLを管理するstate
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // ファイル選択inputへの参照
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 画像が選択されたときの処理
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      // 選択された画像のプレビューを生成
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 投稿処理
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const content = formData.get('content') as string;
    const form = event.currentTarget;

    if (!content.trim() && !imageFile) {
        alert('内容を入力するか、画像を選択してください。');
        return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('ログインしてください');
      return;
    }

    let imageUrl: string | null = null;
    let userName: string | null = null;

    // 1. 画像が選択されていれば、Storageにアップロード
    if (imageFile) {
      // ファイルの拡張子を取得 (例: .png)
      const fileExt = imageFile.name.split('.').pop();
      // 新しい安全なファイル名を生成 (タイムスタンプ + ランダムな16進数文字列 + 拡張子)
      const randomName = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const fileName = `${randomName}.${fileExt}`;
      
      // 生成したファイル名でfilePathを作成
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('TimeLineImages')
        .upload(filePath, imageFile);

      if (uploadError) {
        // ここで表示されるエラーが Invalid key ではなくなるはず
        console.error('画像アップロードエラー:', uploadError);
        alert('画像のアップロードに失敗しました。');
        return;
      }

      // アップロードした画像の公開URLを取得
      const { data: urlData } = supabase.storage
        .from('TimeLineImages')
        .getPublicUrl(filePath);

      imageUrl = urlData.publicUrl;
    }

    // 2. ユーザーネームを取得
      const { data: profileData } = await supabase
        .from('profiles') // あなたのプロフィールテーブル名
        .select('username')
        .eq('id', user.id)
        .single();
      
      userName = profileData?.username || "Unsetting";


    // 3. postsテーブルにデータを挿入
    const { error: insertError } = await supabase.from('posts').insert({
      content: content,
      user_id: user.id,
      media_url: imageUrl,  // 画像URLを追加
    });

    if (insertError) {
      console.error("投稿エラー:", insertError);
      alert('投稿に失敗しました。');
      return;
    }

    // 後処理
    router.refresh();
    alert('投稿が完了しました');
    form.reset();
    setImageFile(null);
    setPreviewUrl(null);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow">
      <h1 className=''>{}</h1>
      <div className="flex space-x-4">
        <Image
          src="/logo_circle.png"
          alt="あなた"
          width={48}
          height={48}
          className="rounded-full"
        />
        <textarea
          name="content"
          placeholder="埼玉県の魅力について投稿しよう！"
          className="w-full p-2 border-none focus:ring-0 rounded-lg bg-gray-100 resize-none"
          rows={3}
        />
      </div>

      {/* 画像プレビュー */}
      {previewUrl && (
        <div className="mt-4">
          <Image
            src={previewUrl}
            alt="プレビュー"
            width={120}
            height={120}
            className="rounded-lg object-cover"
          />
        </div>
      )}

      {/* ファイル選択用のinput (非表示) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
        accept="image/*"
      />

      <div className="flex justify-between items-center mt-3">
        <div className="flex space-x-4 text-gray-500">
          {/* 画像アイコンをクリックしたらファイル選択を開く */}
          <button
            type="button"
            className="hover:text-[#00A968] transition"
            aria-label="画像を追加"
            onClick={() => fileInputRef.current?.click()}
          >
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