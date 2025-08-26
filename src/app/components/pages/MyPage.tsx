'use client';
import Image from 'next/image';
import Link from 'next/link';
import { FiSettings } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';

export default function MyPage() {
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally';

  const profile = { username: '開発用 太郎', avatar_url: '/logo_circle.png', bio: 'これは開発用のダミー自己紹介です。' };
  const posts = Array(8).fill({ id: Math.random(), image_url: '/toppage_background.webp' });
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex flex-col md:flex-row items-center">
          <Image src={profile.avatar_url} alt={profile.username} width={120} height={120} className="rounded-full border-4 border-white shadow-md bg-gray-200" />
          <div className="md:ml-8 mt-4 md:mt-0 text-center md:text-left">
            <h1 className="text-3xl font-bold">{profile.username}</h1><p className="text-gray-500">@dummy_user</p><p className="mt-2">{profile.bio}</p>
            <div className="flex justify-center md:justify-start space-x-6 mt-4">
              <div><span className="font-bold">{posts.length}</span> 投稿</div><div><span className="font-bold">150</span> フォロワー</div><div><span className="font-bold">80</span> フォロー中</div>
            </div>
            {/* 編集ページへのリンクもクエリを維持するように変更 */}
            <Link href={`/home?left=mypage-edit&right=${rightView}`} className="inline-flex items-center mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition"><FiSettings className="mr-2" /> プロフィールを編集</Link>
          </div>
        </div>
      </div>
      {/* ... 投稿一覧部分は変更なし ... */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">投稿一覧</h2>
        {posts.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{posts.map((post, index) => (post.image_url && <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden"><Image src={post.image_url} alt={`投稿画像`} width={400} height={400} className="w-full h-full object-cover" /></div>))}</div> : <p className="text-gray-500">まだ投稿がありません。</p>}
      </div>
    </div>
  );
}