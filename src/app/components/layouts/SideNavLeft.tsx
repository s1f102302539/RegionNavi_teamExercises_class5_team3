'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { FaHome, FaMapMarkedAlt, FaQuestionCircle, FaSearch, FaPlusSquare, FaUser, FaBookmark } from 'react-icons/fa';
import { FiLogOut } from "react-icons/fi";
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { key: 'home', icon: FaHome, label: 'タイムライン' },
  { key: 'stamprally', icon: FaMapMarkedAlt, label: 'スタンプラリー' },
  { key: 'quiz', icon: FaQuestionCircle, label: 'クイズ' },
  { key: 'search', icon: FaSearch, label: '検索' },
  { key: 'post', icon: FaPlusSquare, label: '投稿'},
  { key: 'bookmarks', icon: FaBookmark, label: 'ブックマーク' },
  { key: 'mypage', icon: FaUser, label: 'マイページ' },
  { key: 'logout', icon: FiLogOut, label: 'ログアウト' },
];

export default function SideNavLeft() {
  const params = useSearchParams();
  const router = useRouter();
  const currentLeft = params.get('left') || 'home';
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowLogoutModal(false);
    router.push('/login');
    router.refresh();
  };

  const createNavUrl = (itemKey: string) => {
    const newParams = new URLSearchParams(params.toString());
    const previousLeft = params.get('left');
    newParams.set('left', itemKey);
    if (previousLeft === 'userprofile') {
      newParams.delete('userId');
    }
    return `/home?${newParams.toString()}`;
  };

  return (
    <>
      {/* ★修正1: h-screen を追加して画面の高さいっぱいに広げる */}
      <aside className="w-20 bg-yellow-400 p-3 flex flex-col items-center space-y-4 shadow-lg z-10 h-screen sticky top-0">
        <Link href="/home" className="mb-4">
          <Image
            src="/rerenavi.png"
            alt="RERENAVI Logo"
            width={48}
            height={48}
          />
        </Link>
        
        {/* ★修正2: flex-1 w-full を追加して、空きスペースをこのnavが埋めるようにする */}
        <nav className="flex flex-col items-center space-y-2 flex-1 w-full">
          {navItems.map((item) => {
            const isActive = currentLeft === item.key;
            
            // ★修正3: ログアウトの場合だけ mt-auto を付与して下に押しやる
            // （commonClassesに条件付きでクラスを追加）
            const commonClasses = `group relative p-3 rounded-xl transition-colors duration-200 hover:bg-yellow-500/50 flex justify-center items-center w-full ${
              item.key === 'logout' ? 'mt-auto' : ''
            }`;

            if (item.key === 'logout') {
              return (
                <button
                  key={item.key}
                  onClick={() => setShowLogoutModal(true)}
                  className={commonClasses}
                >
                  <item.icon size={24} className={isActive ? 'text-black' : 'text-gray-800'} />
                  {/* ツールチップの位置調整: 下寄せ時は上に出すなど必要なら調整（今回はそのまま） */}
                  <span className="absolute left-full ml-4 px-3 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                href={createNavUrl(item.key)}
                className={commonClasses}
              >
                <item.icon size={24} className={isActive ? 'text-black' : 'text-gray-800'} />
                <span className="absolute left-full ml-4 px-3 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ログアウト確認モーダル（変更なし） */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm transform transition-all">
            <h3 className="text-lg font-bold text-gray-900 mb-2">ログアウト確認</h3>
            <p className="text-gray-600 mb-6">本当にログアウトしますか？</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
              >
                キャンセル
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}