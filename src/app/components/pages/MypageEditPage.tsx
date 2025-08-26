'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function MypageEditPage() {
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally'; // 右画面の状態を維持

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('プロフィールを保存しました（ダミー）');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">プロフィール編集</h1>
      <div className="bg-white p-8 rounded-xl shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <Image src="/logo_circle.png" alt="現在のアバター" width={100} height={100} className="rounded-full mb-2" />
            <button type="button" className="text-sm font-semibold text-[#00A968] hover:underline">画像を変更</button>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">ユーザー名</label>
            <input type="text" id="username" name="username" defaultValue="自分 ユーザー" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A968] focus:border-[#00A968]" />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">自己紹介</label>
            <textarea id="bio" name="bio" rows={4} defaultValue="埼玉県の魅力を発信中！" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A968] focus:border-[#00A968]" />
          </div>
          <div className="flex justify-end space-x-4">
            {/* キャンセル時は右画面の状態を維持したままマイページに戻る */}
            <Link href={`/home?left=mypage&right=${rightView}`} className="px-6 py-2 border border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-50 transition">キャンセル</Link>
            <button type="submit" className="px-6 py-2 bg-[#00A968] text-white font-semibold rounded-full hover:bg-[#008f58] transition">保存する</button>
          </div>
        </form>
      </div>
    </div>
  );
}