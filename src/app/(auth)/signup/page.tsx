'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SignupPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">RERENAVIへようこそ！</h1>
        <p className="mt-2 text-sm text-gray-600">新しいアカウントを作成</p>
      </div>

      <form className="space-y-4">
        <div>
          <label htmlFor="username" className="text-sm font-medium text-gray-700">
            ユーザー名
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
            placeholder="例: rerenavi_taro"
          />
        </div>
        
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
            required
            className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
            placeholder="8文字以上"
          />
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            <a href="#" className="font-medium hover:underline">利用規約</a>に同意します
          </label>
        </div>

        <div>
          <button
            type="submit"
            className="mt-4 w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-lg text-lg font-bold text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-transform transform hover:scale-105"
          >
            登録する
          </button>
        </div>
      </form>

      <p className="text-sm text-center text-gray-600">
        すでにアカウントをお持ちですか？{' '}
        <Link href="/login" className="font-medium text-yellow-600 hover:text-yellow-500">
          ログイン
        </Link>
      </p>
    </motion.div>
  );
}
