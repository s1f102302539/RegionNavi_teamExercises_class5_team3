'use client';

import { useParams } from 'next/navigation';
import UserProfile from '@/app/components/pages/MyPage'; // ★ 作成した部品をインポート

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  // userIdがない場合はエラー表示など
  if (!userId) {
    return <div>ユーザーが見つかりません。</div>;
  }

  // ★ 部品を呼び出して、URLから取得したIDを渡すだけ
  return <UserProfile userId={userId} />;
}