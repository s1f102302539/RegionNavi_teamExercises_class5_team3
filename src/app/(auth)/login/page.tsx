'use client';

import { motion } from 'framer-motion';
import { FaGoogle, FaTwitter } from 'react-icons/fa';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/cliant';

export default function LoginPage() {
  const supabase = createClient();

  const handleOAuthLogin = async (provider: 'google' | 'twitter') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/route`,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl mx-auto mt-16"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">おかえりなさい！</h1>
        <p className="mt-2 text-sm text-gray-600">ログイン方法を選んでください</p>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">外部サービスでログイン</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleOAuthLogin('google')}
          className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
        >
          <FaGoogle className="w-5 h-5 mr-2" />
          Google
        </button>
        <button
          onClick={() => handleOAuthLogin('twitter')}
          className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
        >
          <FaTwitter className="w-5 h-5 mr-2" />
          Twitter
        </button>
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
