'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// ユーザー指定のパスからcreateClientをインポートします
import { createClient } from '@/lib/supabase/client';
import type { FC } from 'react';

// createClientを呼び出して、supabaseインスタンスを作成します
const supabase = createClient();

const AuthCallback: FC = () => {
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div>
      <p>認証が完了しました</p>
      <p>ページにお戻りください</p>
      <Link href='/login'>ログイン</Link>
    </div>
  );
};

export default AuthCallback;