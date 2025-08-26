'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaMapMarkedAlt, FaQuestionCircle, FaSearch, FaUser } from 'react-icons/fa';

// ナビゲーションの項目
const navItems = [
  { href: '/home', icon: FaHome, label: 'タイムライン' },
  { href: '/stamprally', icon: FaMapMarkedAlt, label: 'スタンプラリー' },
  { href: '/quiz', icon: FaQuestionCircle, label: 'クイズ' },
  { href: '/search', icon: FaSearch, label: '検索' },
  { href: '/mypage', icon: FaUser, label: 'マイページ' },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="w-20 bg-yellow-400 p-3 flex flex-col items-center space-y-4 shadow-lg z-10">
      {/* ロゴ */}
      <Link href="/home" className="mb-4">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-yellow-500 text-lg shadow">
          R
        </div>
      </Link>
      
      {/* ナビゲーションリンク */}
      <nav className="flex flex-col items-center space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="group relative p-3 rounded-xl transition-colors duration-200 hover:bg-yellow-500/50"
            >
              <item.icon 
                size={24}
                className={isActive ? 'text-black' : 'text-gray-800'}
              />
              {/* ホバー時に表示されるツールチップ */}
              <span className="absolute left-full ml-4 px-3 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}