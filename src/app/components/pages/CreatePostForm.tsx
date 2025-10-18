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
  const [username, setUsername] = useState<string>(''); // ★ username用のstateを追加
  const fileInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
    // ★ 2. 関数名をより具体的に変更 (任意)
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // ★ 3. select句に 'username' を追加
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('avatar_url, username') // ← ここ！
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (profileData) {
          // ★ 4. usernameがあればstateを更新
          if (profileData.username) {
            setUsername(profileData.username);
          }
          // avatar_urlがあればstateを更新
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
  // ★★★ ここに `handleImageChange` があります ★★★
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // ファイルが選択されなかった場合は何もしない
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];

    // ファイルが存在する場合のみ処理を続行
    if (file) {
      setImageFile(file);
      const reader = new FileReader();

      // 読み込み成功時の処理
      reader.onload = (e) => {
        // e.target.resultが文字列であることを確認してから、プレビューURLをセット
        if (typeof e.target?.result === 'string') {
          setPreviewUrl(e.target.result);
        }
      };

      // 読み込み失敗時のエラーハンドリングを追加
      reader.onerror = (error) => {
        console.error("FileReader error: ", error);
        alert("画像の読み込みに失敗しました。別のファイルをお試しください。");
        // 失敗した場合はstateをリセット
        setImageFile(null);
        setPreviewUrl(null);
      };
      
      // ファイルの読み込みを開始
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const content = formData.get('content') as string;
    const prefecture = formData.get('prefecture') as string;
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
    let userName: string | null = null; // userNameはまだ使われていませんが、取得ロジックは残しておきます

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const randomName = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const fileName = `${randomName}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('TimeLineImages')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('画像アップロードエラー:', uploadError);
        alert('画像のアップロードに失敗しました。');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('TimeLineImages')
        .getPublicUrl(filePath);

      imageUrl = urlData.publicUrl;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
      
    userName = profileData?.username || "Unsetting";

    const { error: insertError } = await supabase.from('posts').insert({
      content: content,
      user_id: user.id,
      media_url: imageUrl,
      prefecture: prefecture,
    });

    if (insertError) {
      console.error("投稿エラー:", insertError);
      alert('投稿に失敗しました。');
      return;
    }

    router.refresh();
    alert('投稿が完了しました');
    form.reset();
    setImageFile(null);
    setPreviewUrl(null);
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
          placeholder="埼玉県の魅力について投稿しよう！"
          className="w-full p-2 border-none focus:ring-0 rounded-lg bg-gray-100 resize-none"
          rows={3}
        />
      </div>

      <div className="mt-4">
        <select
          name="prefecture"
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A968] focus:border-transparent"
          defaultValue=""
        >
          <option value="" disabled>都道府県を選択</option>
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
          className="bg-[#00A968] text-white font-bold py-2 px-6 rounded-full hover:bg-[#008f58] transition"
        >
          投稿する
        </button>
      </div>
    </form>
    </div>
  );
}