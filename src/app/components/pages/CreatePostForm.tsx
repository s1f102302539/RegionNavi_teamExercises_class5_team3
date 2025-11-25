'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaImage, FaMapMarkerAlt } from 'react-icons/fa';
import { useRef, useState, useEffect } from 'react';
import { regions } from '@/types/prefectureData';

export default function CreatePostForm() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string>('/logo_circle.png');
  const [username, setUsername] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 処理中のローディング状態
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('avatar_url, username')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (profileData) {
          if (profileData.username) {
            setUsername(profileData.username);
          }
          if (profileData.avatar_url) {
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(profileData.avatar_url);
            
            setDisplayAvatarUrl(urlData.publicUrl);
          }
        }
      }
    };

    fetchProfile();
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];

    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setPreviewUrl(e.target.result);
        }
      };
      reader.onerror = (error) => {
        console.error("FileReader error: ", error);
        alert("画像の読み込みに失敗しました。");
        setImageFile(null);
        setPreviewUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return; // 二重送信防止

    const formData = new FormData(event.currentTarget);
    const content = formData.get('content') as string;
    const prefecture = formData.get('prefecture') as string; // 都道府県ID (tokyo, saitama...)
    const form = event.currentTarget;

    if (!content.trim() && !imageFile) {
        alert('内容を入力するか、画像を選択してください。');
        return;
    }

    setIsSubmitting(true); // 送信開始

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('ログインしてください');
      setIsSubmitting(false);
      return;
    }

    try {
      let imageUrl: string | null = null;

      // 1. 画像アップロード
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const randomName = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const fileName = `${randomName}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('TimeLineImages')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('TimeLineImages')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // 2. 投稿データの挿入 (作成された投稿のIDを取得する)
      const { data: postData, error: insertError } = await supabase
        .from('posts')
        .insert({
          content: content,
          user_id: user.id,
          media_url: imageUrl,
          prefecture_id: prefecture || null, // カラム名を prefecture_id に統一推奨
        })
        .select('id') // ★ 追加: IDを取得
        .single();

      if (insertError) throw insertError;

      let successMessage = '投稿が完了しました';

      // 3. 都道府県制覇判定 (画像があり、都道府県が選択されている場合)
      // ※ 「画像付き投稿」という条件を含めるなら if (prefecture && imageUrl) にします
      if (prefecture) {
        const { data: conquestData, error: conquestError } = await supabase
          .rpc('register_conquest', {
            target_prefecture_id: prefecture,
            target_post_id: postData.id
          });

        if (!conquestError && conquestData) {
          // 新規制覇だった場合
          if (conquestData.is_new) {
            successMessage = `投稿完了！\n🎉 新しいエリアを制覇しました！\n🆙 レベルが上がりました！`;
          }
        }
      }

      alert(successMessage);
      
      // フォームリセット
      form.reset();
      setImageFile(null);
      setPreviewUrl(null);
      router.refresh();

    } catch (error: any) {
      console.error("エラーが発生しました:", error);
      alert('投稿に失敗しました: ' + (error.message || '不明なエラー'));
    } finally {
      setIsSubmitting(false); // 送信終了
    }
  };
  
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">記事を投稿しよう</h1>
        <p className="text-gray-600 mt-2">一押しのスポットを写真ともに投稿しよう！</p>
      </div>
      <div className="mb-6 text-gray-700">
        投稿者: <span className="font-semibold">{username || '名無しのユーザー'}</span>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow">
        <div className="flex space-x-4">
          <Image
            src={displayAvatarUrl}
            alt="あなた"
            width={64}
            height={64}
            className="rounded-full"
          />
          <textarea
            name="content"
            placeholder="地方の魅力について投稿しよう！"
            className="w-full p-2 border-none focus:ring-0 rounded-lg bg-gray-100 resize-none"
            rows={3}
          />
        </div>

        <div className="mt-4">
          <select
            name="prefecture"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A968] focus:border-transparent"
            defaultValue=""
            required // 制覇機能を入れるなら必須にした方が良いかも？（今回は任意）
          >
            <option value="" disabled>都道府県を選択（スタンプラリー対象）</option>
            {regions.map((region) => (
              <optgroup key={region.name} label={region.name}>
                {region.prefectures.map((pref) => (
                  <option key={pref.value} value={pref.value}>
                    {pref.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

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

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
          accept="image/*"
        />

        <div className="flex justify-between items-center mt-3">
          <div className="flex space-x-4 text-gray-500">
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
            disabled={isSubmitting}
            className={`bg-[#00A968] text-white font-bold py-2 px-6 rounded-full hover:bg-[#008f58] transition ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? '送信中...' : '投稿する'}
          </button>
        </div>
      </form>
    </div>
  );
}