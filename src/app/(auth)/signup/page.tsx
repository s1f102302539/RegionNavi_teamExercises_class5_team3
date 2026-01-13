'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  // 1. ユーザー名用のStateを追加
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const router = useRouter(); // routerは将来的にリダイレクトなどで使用可能

  const supabase = createClient();
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(''); // メッセージをリセット

    // 4. ユーザー名を送信データに含める
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `${location.origin}/callback`,
        data: {
          user_name: username,
        },
      },
    });

    if (error) {
      setMessage('エラー: ' + error.message);
      setMessageType('error');
    } else if (data.user && data.user.identities?.length === 0) {
      // Supabaseの仕様上、Email confirmationが有効な場合、既に登録済みのメールでもエラーにならず、
      // identitiesが空のuserオブジェクトが返るため、これで重複を検知する
      setMessage('このメールアドレスは既に使用されている可能性があります。');
      setMessageType('error');
    } else if (data.user) {
      setMessage('確認メールを送信しました。メールボックスを確認してください。');
      setMessageType('success');
      // 成功後にフォームをクリア
      setUsername('');
      setEmail('');
      setPassword('');
    }
  };

  return (
    <>
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

      {/* 2. onSubmitを追加 */}
      <form onSubmit={handleSignUp} className="space-y-4">
        {/* 3. メッセージ表示部分を追加 */}
        {message && (
          <p
            className={`text-center p-3 rounded-lg text-sm ${
              messageType === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {message}
          </p>
        )}

        <div>
          <label htmlFor="username" className="text-sm font-medium text-gray-700">
            ユーザー名
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            // 2 & 4. stateと紐付け
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            // 2. stateと紐付け
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            // 2. stateと紐付け
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
            placeholder="8文字以上"
          />
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required // 同意を必須にする
            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="font-medium text-yellow-600 hover:text-yellow-500 hover:underline focus:outline-none"
              >
              利用規約
            </button>
            に同意します
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


    {/* 利用規約モーダル */}
      <AnimatePresence>
        {isTermsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* モーダルヘッダー */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">利用規約</h2>
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* モーダル本文 (スクロール可能) */}
              <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-4">
                <p>ReRenavi 利用規約
最終更新日：2025/12/17
本利用規約（以下「本規約」）は、ReRenavi運営チーム（以下「運営」）が提供するサービス「ReRenavi」（以下「本サービス」）の利用条件を定めるものです。ユーザーは、本サービスを利用することで本規約に同意したものとみなされます。</p>
                
                <h3 className="font-bold text-gray-800 text-base">第1条（適用）</h3>
                <p>本規約は、ユーザーと運営との間の本サービスの利用に関わる一切の関係に適用されます。
運営は、本サービスに関し、本規約のほか、プライバシーポリシー等の各種規定（以下「個別規定」）を定める場合があります。個別規定は本規約の一部を構成します。</p>

                <h3 className="font-bold text-gray-800 text-base">第2条（利用登録）</h3>
                <p>本サービスの利用を希望する者は、運営が定める方法により利用登録を申請するものとします。
利用登録に際しては、メールアドレスおよびパスワードの登録が必要です。
ユーザー名・自己紹介・アイコンなどのプロフィール情報は、利用者に公開されます。</p>

                <h3 className="font-bold text-gray-800 text-base">第3条（アカウント管理）</h3>
                <p>ユーザーは、自己の責任においてアカウント情報を管理するものとします。
メールアドレス・パスワードの不正使用等によってユーザーに生じた損害について、運営は責任を負いません。
不正アクセスの疑いがある場合、運営は必要に応じてアカウントを停止できるものとします。</p>
                

                <h3 className="font-bold text-gray-800 text-base">第4条（禁止事項）</h3>
                <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>他者への誹謗中傷や差別的表現</li>
                  <li>迷惑行為、スパム、広告目的の利用</li>
                  <li>他のユーザーになりすます行為</li>
                  <li>他者の著作権・肖像権などの権利を侵害する行為</li>
                  <li>本サービスの運営を妨害する行為</li>
                  <li>本サービスのリバースエンジニアリング等の解析行為</li>
                  <li>運営が不適切と判断する行為</li>
                </ul>
                
                <h3 className="font-bold text-gray-800 text-base">第5条（投稿内容の取り扱い）</h3>
                <p>ユーザーは、自身が投稿した内容（テキスト、画像、写真、イラスト、動画、その他のデータ。以下「投稿データ」）について、一切の責任を負うものとします。
ユーザーは、投稿データが以下に該当しないことを保証するものとします。</p>
   <ul className="list-disc pl-5 space-y-1">
                  <li>第三者の著作権・商標権・肖像権などの権利を侵害するもの</li>
                  <li>他者のプライバシーを侵害する内容</li>
                  <li>他者が写り込む写真を本人の許可なく投稿する行為</li>
                  <li>アプリの性質上不適切と判断される画像（過度な暴力描写、性的表現、差別表現等）</li>
                </ul>
                <p>運営は以下の場合、予告なく投稿データを削除または非表示とすることができます。</p>
   <ul className="list-disc pl-5 space-y-1">
                  <li>法令違反またはそのおそれがある場合</li>
                  <li>他者の権利を侵害するおそれがある場合</li>
                  <li>公序良俗に反する場合</li>
                  <li>運営が不適切と判断した場合</li>
                </ul>
                <p>投稿データの著作権はユーザーに帰属します。ただし、運営は以下目的の範囲で投稿データを利用できるものとします。
本サービスの運営、機能提供、改善
不正利用の調査
システムの動作検証
※いわゆる「サーバ上で表示するための利用」であり、ユーザーの画像を勝手に広告に使うなどの目的ではありません。
ユーザーは、投稿データが第三者による権利侵害だと申し立てられた場合、その処理・解決について運営に一切の迷惑をかけないものとし、自己の責任で対応するものとします。</p>
                <h3 className="font-bold text-gray-800 text-base">第6条（AI旅行計画機能の注意事項）</h3>
                <p>AIによる提案内容は必ずしも正確または最新ではありません。
ユーザーはAIの出力を自己責任で利用するものとします。
AIが生成した内容によりユーザーに損害が生じても、運営は責任を負いません。</p>
                
                <h3 className="font-bold text-gray-800 text-base">第7条（個人情報の取り扱い）</h3>
                <p>運営は、メールアドレス・パスワード等の個人情報を本サービス提供のために利用します。
具体的な取り扱いはプライバシーポリシーに定めます。
運営は、法令に定める場合を除き、第三者に個人情報を開示しません。</p>
                
                <h3 className="font-bold text-gray-800 text-base">第8条（サービス内容の変更・停止）</h3>
                <p>運営は、ユーザーに事前通知することなく、サービス内容の変更または提供の停止を行うことがあります。これによりユーザーに損害が生じても、運営は責任を負いません。</p>
                
                <h3 className="font-bold text-gray-800 text-base">第9条（利用制限および登録抹消）</h3>
                <p>運営は、以下の場合にユーザーへの事前通知なくアカウントの利用を制限または削除できるものとします。
本規約に違反した場合
運営がサービス継続を困難と判断した場合</p>
                
                <h3 className="font-bold text-gray-800 text-base">第10条（免責事項）</h3>
                <p>運営は、ユーザー間のトラブルについて、一切の責任を負いません。
天災、通信障害、システムエラー等によりサービスが停止した場合、運営は責任を負いません。
運営は、本サービスを利用することにより生じたあらゆる損害について、運営に故意または重大な過失がある場合を除き、責任を負いません。</p>
                
                <h3 className="font-bold text-gray-800 text-base">第11条（規約の変更）</h3>
                <p>運営は必要に応じて本規約を変更できるものとします。
規約変更後、本サービスの利用を継続した場合、変更後の規約に同意したものとみなします。</p>
                
                <h3 className="font-bold text-gray-800 text-base">第12条（準拠法・裁判管轄）</h3>
                <p>本規約の解釈には日本法を準拠法とします。
本サービスに関して紛争が生じた場合、運営の所在地を管轄する裁判所を専属的合意管轄とします。</p>
                


              </div>

              {/* モーダルフッター */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="px-6 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition"
                >
                  閉じる
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}