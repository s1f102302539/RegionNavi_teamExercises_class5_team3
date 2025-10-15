'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { FaHome, FaMapMarkedAlt, FaQuestionCircle, FaSearch, FaPlusSquare, FaUser, FaBookmark } from 'react-icons/fa';


const navItems = [
  { key: 'home', icon: FaHome, label: 'タイムライン' },
  { key: 'stamprally', icon: FaMapMarkedAlt, label: 'スタンプラリー' },
  { key: 'quiz', icon: FaQuestionCircle, label: 'クイズ' },
  { key: 'search', icon: FaSearch, label: '検索' },
  { key: 'post', icon: FaPlusSquare, label: '投稿'},
    { key: 'bookmarks', icon: FaBookmark, label: 'ブックマーク' },
  { key: 'mypage', icon: FaUser, label: 'マイページ' },
];

export default function SideNavLeft() {
  const params = useSearchParams();
  const currentLeft = params.get('left') || 'home';

  // ★ 修正: より安全で正確なURL生成関数
  const createNavUrl = (itemKey: string) => {
    // 現在のURLパラメータをすべてコピーして、新しいURLのベースを作成
    const newParams = new URLSearchParams(params.toString());
    
    // クリックされる前の左画面の状態を保持
    const previousLeft = params.get('left');

    // 左画面の表示内容を、クリックされたアイコンのものに更新
    newParams.set('left', itemKey);

    // もし、「クリックされる前の左画面が」他人のプロフィールページだった場合、
    // 不要になったuserIdをURLから削除します。
    // これにより、右画面が表示しているプロフィール用のuserIdは維持されます。
    if (previousLeft === 'userprofile') {
      newParams.delete('userId');
    }

    return `/home?${newParams.toString()}`;
  };

  return (
    <aside className="w-20 bg-yellow-400 p-3 flex flex-col items-center space-y-4 shadow-lg z-10">
      <Link href="/home" className="mb-4">
        <Image
          src="/rerenavi.png"
          alt="RERENAVI Logo"
          width={48}
          height={48}
        />
      </Link>
      <nav className="flex flex-col items-center space-y-2">
        {navItems.map((item) => {
          const isActive = currentLeft === item.key;
          return (
            <Link
              key={item.key}
              // ★ 修正: 生成したURLをリンク先として使用
              href={createNavUrl(item.key)}
              className="group relative p-3 rounded-xl transition-colors duration-200 hover:bg-yellow-500/50"
            >
              <item.icon size={24} className={isActive ? 'text-black' : 'text-gray-800'} />
              <span className="absolute left-full ml-4 px-3 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}