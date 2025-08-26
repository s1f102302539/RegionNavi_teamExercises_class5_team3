'use client';
import { useState } from 'react';

export default function SearchPage() {
  const [tab, setTab] = useState('posts');
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">検索</h1>
      <input type="text" placeholder="キーワードを入力..." className="w-full px-4 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00A968]" />
      <div className="flex border-b mt-6">
        <button onClick={() => setTab('posts')} className={`py-3 px-6 font-semibold ${tab === 'posts' ? 'border-b-2 border-[#00A968] text-[#00A968]' : 'text-gray-500'}`}>投稿</button>
        <button onClick={() => setTab('users')} className={`py-3 px-6 font-semibold ${tab === 'users' ? 'border-b-2 border-[#00A968] text-[#00A968]' : 'text-gray-500'}`}>ユーザー</button>
      </div>
      <div className="mt-6"><p className="text-gray-500">検索結果がここに表示されます。</p></div>
    </div>
  );
}