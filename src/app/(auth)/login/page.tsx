'use client';

import Link from 'next/link';
import { FaGoogle, FaTwitter } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function LoginPage() {
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

      <form className="space-y-6">
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
            autoComplete="current-password"
            required
            className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
            placeholder="••••••••"
          />
        </div>
        
        <div className="text-right text-sm">
          <a href="#" className="font-medium text-yellow-600 hover:text-yellow-500">
            パスワードをお忘れですか？
          </a>
        </div>

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
        <div className="grid grid-cols-2 gap-3">
          <button className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition">
            <FaGoogle className="w-5 h-5" />
          </button>
          <button className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition">
            <FaTwitter className="w-5 h-5" />
          </button>
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
