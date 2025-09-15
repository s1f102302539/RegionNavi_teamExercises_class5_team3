'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function MypageEditPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally';

  // --- State管理 ---
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- データ取得処理 ---
  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, bio, avatar_url`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username || '');
        setBio(data.bio || '');

        if (data.avatar_url) {
          // DBに保存されているパスから公開URLを生成
          const { data: imageData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.avatar_url);

            console.log('Supabaseから取得した画像データ:', imageData); 
          
          // imageDataとpublicUrlが有効な場合にのみURLをセット
          if (imageData && imageData.publicUrl) {
            setAvatarUrl(imageData.publicUrl);
          } else {
            // 有効なURLが取得できなかった場合はデフォルト画像を表示
            console.warn('Failed to get public URL for:', data.avatar_url);
            setAvatarUrl('/logo_circle.png');
          }
        } else {
          // avatar_urlが元々ない場合もデフォルト画像を表示
          setAvatarUrl('/logo_circle.png');
        }
      }
    } catch (error) {
      console.error('プロフィールの取得に失敗しました。', error);
      alert('エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  // --- ページ読み込み時にプロフィールを取得 ---
  useEffect(() => {
    getProfile();
  }, [getProfile]);


  // --- ファイルが選択されたときの処理 ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAvatarFile(file);
      // 画像プレビューのためにローカルURLを生成
      setAvatarUrl(URL.createObjectURL(file));
    }
  };


  // --- 更新処理 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let avatarPath: string | null = null;

      // 既存のプロフィールから現在のavatar_url(パス)を取得
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      avatarPath = currentProfile?.avatar_url || null;

      // 新しい画像ファイルが選択されていたらアップロード処理
      if (avatarFile) {
        const filePath = `${user.id}/${Date.now()}_${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }
        
        avatarPath = filePath; // 保存する値をパスに更新
      }

      // データベースを更新
      const updates = {
        username: username,
        bio: bio,
        updated_at: new Date().toISOString(),
        avatar_url: avatarPath,
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

      if (error) {
        throw error;
      }

      alert('プロフィールを保存しました！');
      router.push(`/home?left=mypage&right=${rightView}`);

    } catch (error) {
      console.error('プロフィールの更新に失敗しました。', error);
      alert('更新に失敗しました。');
    }
  };

  // --- ロード中の表示 ---
  if (loading || !avatarUrl) {
    return <div className="max-w-2xl mx-auto text-center py-10">読み込み中...</div>;
  }

  // --- JSX ---
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">プロフィール編集</h1>
      <div className="bg-white p-8 rounded-xl shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <Image 
                src={avatarUrl} 
                alt="現在のアバター" 
                width={100} 
                height={100} 
                className="rounded-full mb-2 object-cover w-[100px] h-[100px]"
            />
            <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold text-[#00A968] hover:underline">
                    画像を変更
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">ユーザー名</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A968] focus:border-[#00A968]"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">自己紹介</label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A968] focus:border-[#00A968]"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <Link href={`/home?left=mypage&right=${rightView}`} className="px-6 py-2 border border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-50 transition">キャンセル</Link>
            <button type="submit" className="px-6 py-2 bg-[#00A968] text-white font-semibold rounded-full hover:bg-[#008f58] transition">保存する</button>
          </div>
        </form>
      </div>
    </div>
  );
}