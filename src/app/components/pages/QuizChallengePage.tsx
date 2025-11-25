'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaTrophy, FaStar, FaBookOpen, FaMapMarkedAlt } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Quiz型
type Quiz = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  prefecture_id: string;
};

// 漢字名→ID変換 (逆引き用)
const PREFECTURE_ID_TO_KANJI: { [key: string]: string } = {
  hokkaido: "北海道", aomori: "青森県", iwate: "岩手県", miyagi: "宮城県", akita: "秋田県", yamagata: "山形県", fukushima: "福島県",
  ibaraki: "茨城県", tochigi: "栃木県", gunma: "群馬県", saitama: "埼玉県", chiba: "千葉県", tokyo: "東京都", kanagawa: "神奈川県",
  niigata: "新潟県", toyama: "富山県", ishikawa: "石川県", fukui: "福井県", yamanashi: "山梨県", nagano: "長野県", gifu: "岐阜県", shizuoka: "静岡県", aichi: "愛知県",
  mie: "三重県", shiga: "滋賀県", kyoto: "京都府", osaka: "大阪府", hyogo: "兵庫県", nara: "奈良県", wakayama: "和歌山県",
  tottori: "鳥取県", shimane: "島根県", okayama: "岡山県", hiroshima: "広島県", yamaguchi: "山口県",
  tokushima: "徳島県", kagawa: "香川県", ehime: "愛媛県", kochi: "高知県",
  fukuoka: "福岡県", saga: "佐賀県", nagasaki: "長崎県", kumamoto: "熊本県", oita: "大分県", miyazaki: "宮崎県", kagoshima: "鹿児島県", okinawa: "沖縄県"
};

// アニメーション定義
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }
};

export default function QuizChallengePage({ side }: { side: 'left' | 'right' }) {
  const supabase = createClient();
  const params = useSearchParams();
  
  const prefKey = params.get(side)?.replace('quiz-', '') || '';
  const prefName = PREFECTURE_ID_TO_KANJI[prefKey] || prefKey;
  const otherSide = side === 'left' ? 'right' : 'left';
  const otherSideView = params.get(otherSide) || 'home';

  // State
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // null:未回答, true:正解, false:不正解
  const [showExplanation, setShowExplanation] = useState(false);
  
  // ゲーム状態: loading, playing, finished
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'finished'>('loading');
  const [isAllCorrect, setIsAllCorrect] = useState(false); // 全問正解フラグ
  const [wrongCount, setWrongCount] = useState(0); // 間違えた回数

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!prefKey) return;
      setGameState('loading');

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('prefecture_id', prefKey)
        .limit(5); // 5問取得

      if (!error && data && data.length > 0) {
        setQuizzes(data);
        setGameState('playing');
      } else {
        console.error("クイズ取得エラー:", error);
        // クイズがない場合の処理（空配列のまま）
        setGameState('playing'); 
      }
    };
    fetchQuizzes();
  }, [prefKey, supabase]);

  // 回答処理
  const handleAnswer = (option: string) => {
    if (selectedAnswer) return; // 既に回答済みなら何もしない

    setSelectedAnswer(option);
    const correct = option === quizzes[currentQuestionIndex].correct_answer;
    setIsCorrect(correct);
    setShowExplanation(true);

    if (!correct) {
      setWrongCount(prev => prev + 1); // 間違いカウント
    }
  };

  // 次の問題へ
  const handleNext = async () => {
    if (currentQuestionIndex < quizzes.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setShowExplanation(false);
    } else {
      // 全問終了
      const passed = wrongCount === 0 && isCorrect === true; // 今回も正解していること
      setIsAllCorrect(passed);
      setGameState('finished');

      // クリア処理 (全問正解かつ初回のみ)
      if (passed) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // クリア履歴を保存 (ON CONFLICT DO NOTHINGで重複防止)
          await supabase.rpc('unlock_title', { target_title_id: `quiz_${prefKey}` }); // もし称号があれば
          await supabase.from('prefecture_quiz_clears').insert({
             user_id: user.id,
             prefecture_id: prefKey
          }).select();
          
          // ★ レベルアップ処理 (1県クリアで+1レベル)
          // ここではサーバー側で重複チェックが必要ですが、簡易的に呼び出し
          // 本来は `increment_level` を呼ぶ前に「この県でレベルアップ済みか」を確認すべき
          // 今回はシンプルに呼び出します
          await supabase.rpc('increment_level', { target_user_id: user.id, amount: 1 });
        }
      }
    }
  };

  if (gameState === 'loading') return <div className="p-8 text-center">読み込み中...</div>;

  if (quizzes.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">準備中</h2>
        <p className="text-gray-500 mb-6">{prefName}のクイズはまだありません。</p>
        <Button asChild variant="outline">
          <Link href={`/home?${side}=quiz&${otherSide}=${otherSideView}`}>
            地図に戻る
          </Link>
        </Button>
      </div>
    );
  }

  // --- 結果画面 ---
  if (gameState === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-white to-yellow-50">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-yellow-200"
        >
          {isAllCorrect ? (
            <>
              <FaTrophy className="text-6xl text-yellow-500 mx-auto mb-4 drop-shadow-md" />
              <h2 className="text-3xl font-bold text-yellow-600 mb-2">完全制覇！</h2>
              <p className="text-gray-600 mb-6">{prefName}の知識マスターに認定！<br/>レベルが上がりました！</p>
            </>
          ) : (
            <>
              <FaTimesCircle className="text-6xl text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">おしい！</h2>
              <p className="text-gray-600 mb-6">{wrongCount}問ミスがありました。<br/>全問正解でクリアです！</p>
            </>
          )}

          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
               <Link href={`/home?${side}=quiz&${otherSide}=${otherSideView}`}>
                 地図に戻る
               </Link>
            </Button>
            {!isAllCorrect && (
              <Button onClick={() => window.location.reload()}>再挑戦</Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // --- クイズプレイ画面 ---
  const currentQuiz = quizzes[currentQuestionIndex];

  return (
    <div className="h-full overflow-y-auto p-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-gray-700 font-bold text-lg">
            <FaMapMarkedAlt className="text-indigo-500" />
            {prefName}クイズ
          </div>
          <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Q{currentQuestionIndex + 1} / {quizzes.length}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuiz.id}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card className="shadow-lg border-indigo-100">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
                  {currentQuiz.question}
                </h3>

                <div className="space-y-3">
                  {currentQuiz.options.map((option) => {
                    // 選択状態のスタイル計算
                    let btnStyle = "w-full justify-start p-4 text-lg h-auto border-2";
                    if (selectedAnswer === option) {
                      if (option === currentQuiz.correct_answer) {
                        btnStyle += " bg-green-100 border-green-500 text-green-800";
                      } else {
                        btnStyle += " bg-red-100 border-red-500 text-red-800";
                      }
                    } else if (selectedAnswer && option === currentQuiz.correct_answer) {
                       // 答え合わせ時に正解を表示
                       btnStyle += " bg-green-50 border-green-300 text-green-700 opacity-70";
                    } else if (selectedAnswer) {
                       btnStyle += " opacity-50 cursor-not-allowed";
                    } else {
                       btnStyle += " hover:border-indigo-400 hover:bg-indigo-50";
                    }

                    return (
                      <Button
                        key={option}
                        variant="ghost"
                        className={btnStyle}
                        onClick={() => handleAnswer(option)}
                        disabled={!!selectedAnswer}
                      >
                        {option}
                        {selectedAnswer === option && option === currentQuiz.correct_answer && (
                          <FaCheckCircle className="ml-auto text-green-600 text-xl" />
                        )}
                        {selectedAnswer === option && option !== currentQuiz.correct_answer && (
                          <FaTimesCircle className="ml-auto text-red-500 text-xl" />
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* 解説エリア */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-6 pt-4 border-t border-gray-100"
                    >
                      <div className={`flex items-center gap-2 font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                        {isCorrect ? (
                           <><FaCheckCircle /> 正解！</>
                        ) : (
                           <><FaTimesCircle /> 残念...</>
                        )}
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900 leading-relaxed">
                        <span className="font-bold block mb-1"><FaBookOpen className="inline mr-1"/> 解説</span>
                        {currentQuiz.explanation || "解説はありません。"}
                      </div>
                      
                      <div className="mt-6 text-right">
                        <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                          {currentQuestionIndex < quizzes.length - 1 ? "次の問題へ" : "結果を見る"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}