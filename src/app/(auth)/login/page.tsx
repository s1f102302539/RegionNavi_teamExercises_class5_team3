'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaGoogle } from 'react-icons/fa'; // GitHubも使いたい場合は FaGithub もインポート
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/cliant';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // メール・パスワードでのログイン処理
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    // ログイン成功後、ホーム画面などに遷移
    router.push('/home');
    router.refresh(); // サーバーコンポーネントを再描画して状態を更新
  };

  // GoogleなどのOAuthプロバイダーでのログイン処理
  const handleOAuthLogin = async (provider: 'google' | 'github') => { // 型を限定
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // ログイン後のリダイレクト先
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">おかえりなさい！</h1>
        <p className="mt-2 text-sm text-gray-600">メールアドレスとパスワードでログイン</p>
      </div>

      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="text-right text-sm">
          <a href="#" className="font-medium text-yellow-600 hover:text-yellow-500">
            パスワードをお忘れですか？
          </a>
        </div>

        {/* エラーメッセージの表示 */}
        {error && (
          <p className="text-sm text-center text-red-500 bg-red-100 p-3 rounded-lg">
            {error}
          </p>
        )}

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-lg text-lg font-bold text-white bg-[#00A968] hover:bg-[#008f58] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A968] transition-transform transform hover:scale-105"
          >
            ログイン
          </button>
        </div>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">または</span>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 gap-3"> {/* 1列に変更 */}
          <button 
            onClick={() => handleOAuthLogin('google')}
            className="w-full inline-flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <FaGoogle className="w-5 h-5 mr-2" />
            Googleでログイン
          </button>
          {/* 他のプロバイダーもここに追加できます */}
        </div>
      </div>

      <p className="text-sm text-center text-gray-600">
        アカウントをお持ちでないですか？{' '}
        <Link href="/signup" className="font-medium text-yellow-600 hover:text-yellow-500">
          新規登録
        </Link>
      </p>
    </motion.div>
  );
}