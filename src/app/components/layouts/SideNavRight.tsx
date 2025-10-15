'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaHome, FaMapMarkedAlt, FaQuestionCircle, FaSearch, FaPlusSquare, FaUser } from 'react-icons/fa';

const navItems = [
  { key: 'stamprally', icon: FaMapMarkedAlt, label: 'スタンプラリー' },
  { key: 'quiz', icon: FaQuestionCircle, label: 'クイズ' },
  { key: 'home', icon: FaHome, label: 'タイムライン' },
  { key: 'search', icon: FaSearch, label: '検索' },
  { key: 'post', icon: FaPlusSquare, label: '投稿'},
  { key: 'mypage', icon: FaUser, label: 'マイページ' },
];

export default function SideNavRight() {
  const params = useSearchParams();
  const currentRight = params.get('right') || 'stamprally';

  // ★ 修正: より安全で正確なURL生成関数 (右画面用)
  const createNavUrl = (itemKey: string) => {
    // 現在のURLパラメータをすべてコピー
    const newParams = new URLSearchParams(params.toString());
    
    // クリックされる前の右画面の状態を保持
    const previousRight = params.get('right');

    // 右画面の表示内容を、クリックされたアイコンのものに更新
    newParams.set('right', itemKey);

    // もし、「クリックされる前の右画面が」他人のプロフィールページだった場合、
    // 不要になったuserIdをURLから削除します。
    // これにより、左画面が表示しているプロフィール用のuserIdは維持されます。
    if (previousRight === 'userprofile') {
      newParams.delete('userId');
    }

    return `/home?${newParams.toString()}`;
  };

  return (
    <aside className="w-20 bg-yellow-400 p-3 flex flex-col items-center space-y-4 shadow-lg z-10 h-full">
      <div className="mb-4 w-12 h-12"></div> {/* スペーサー */}
      <nav className="flex flex-col items-center space-y-2">
        {navItems.map((item) => {
          const isActive = currentRight === item.key;
          return (
            <Link
              key={item.key}
              // ★ 修正: 生成したURLをリンク先として使用
              href={createNavUrl(item.key)}
              className="group relative p-3 rounded-xl transition-colors duration-200 hover:bg-yellow-500/50"
            >
              <item.icon size={24} className={isActive ? 'text-black' : 'text-gray-800'} />
              <span className="absolute right-full mr-4 px-3 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


