'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { FC } from 'react';

const supabase = createClient();

const AuthCallback: FC = () => {
  const router = useRouter();

  const [secondsLeft, setSecondsLeft] = useState<number>(10);

  useEffect(() => {
    // タイマー: 10秒のカウントダウン後にログインページへ遷移
    setSecondsLeft(10);
    const intervalId = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    const timeoutId = setTimeout(() => {
      router.push('/login');
    }, 10000);

    // セッションは確認するが、ユーザーがページを読む余地を与えるため即遷移は行わない
    const supabaseGet = supabase.auth.getSession().then(() => {
      /* no immediate redirect; just ensure client is initialized */
    });

    const { data } = supabase.auth.onAuthStateChange(() => {
      // 状態変化はログに留める。自動遷移はカウントダウンに任せる。
      return null;
    });

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      try {
        data?.subscription?.unsubscribe();
      } catch (e) {
        // no-op
      }
      // supabaseGetはPromiseなので明示的なclean-up不要
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-2xl shadow-xl text-center"
      >
        <div className="flex flex-col items-center gap-4">
          <svg
            className="w-16 h-16 text-green-500"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M7 13l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <h1 className="text-2xl font-bold text-gray-900">認証が完了しました</h1>
          <p className="text-sm text-gray-600">リダイレクト中です。ログインページへ移動します…</p>

          <div className="flex items-center gap-3 mt-2">
            <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">あと{secondsLeft}秒でログインページに移動します</span>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600">自動で遷移しない場合はこちら：</p>
          <div className="mt-3 flex justify-center gap-4">
            <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00A968] text-white font-medium hover:bg-[#008f58]">
              ログインページへ移動
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCallback;