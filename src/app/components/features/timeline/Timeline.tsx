'use client';

import Image from 'next/image';
import { FaHeart, FaComment, FaRegBookmark } from 'react-icons/fa';

const dummyPosts = [
  { id: 1, account: { name: '川越市役所【公式】', handle: '@City_Kawagoe', avatar: '/logo_circle.png' }, content: '春の喜多院では桜が見頃です！\n#川越 #喜多院 #桜', image: '/toppage_background.webp', likes: 256, comments: 12, },
  { id: 2, account: { name: '秩父市【公式】観光課', handle: '@chichibu_kanko', avatar: '/logo_circle.png' }, content: '羊山公園の芝桜の丘、まもなく見頃を迎えます！\n#秩父 #芝桜', image: '/toppage_background.webp', likes: 512, comments: 34, },
];

export default function Timeline() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">タイムライン</h1>
      <div className="space-y-4">
        {dummyPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center mb-4">
              <Image src={post.account.avatar} alt={post.account.name} width={48} height={48} className="rounded-full" />
              <div className="ml-4">
                <p className="font-bold text-gray-900">{post.account.name}</p>
                <p className="text-sm text-gray-500">{post.account.handle}</p>
              </div>
            </div>
            <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>
            {post.image && <div className="rounded-xl overflow-hidden border"><Image src={post.image} alt="投稿画像" width={800} height={450} className="w-full object-cover" /></div>}
            <div className="flex justify-between items-center mt-4 text-gray-500">
              <button className="flex items-center space-x-2 hover:text-pink-500 transition-colors duration-200"><FaHeart /> <span className="text-sm font-semibold">{post.likes}</span></button>
              <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors duration-200"><FaComment /> <span className="text-sm font-semibold">{post.comments}</span></button>
              <button className="hover:text-yellow-500 transition-colors duration-200"><FaRegBookmark size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}