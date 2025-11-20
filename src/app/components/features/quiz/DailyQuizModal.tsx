'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FaCheckCircle, FaTimesCircle, FaTrophy, FaFire } from 'react-icons/fa';
import JSConfetti from 'js-confetti'; // 紙吹雪用 (npm install js-confetti が必要ですが、一旦前のConfettiコンポーネントでも可。今回は簡易実装します)

// 前のフェーズで使ったConfettiコンポーネントを再利用
const SimpleConfetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex justify-center items-center overflow-hidden">
       {/* 簡易的な演出（本来はライブラリ推奨） */}
       <div className="absolute inset-0 bg-yellow-500/20 animate-pulse"></div>
    </div>
  );
};

type Quiz = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

export default function DailyQuizModal() {
  const supabase = createClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  
  // ゲーム状態
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showResult, setShowResult] = useState(false); // 正解/不正解の表示
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    const checkAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. プロフィールを確認して、今日すでに実施済みかチェック
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_daily_quiz_at')
        .eq('id', user.id)
        .single();

      const lastDate = profile?.last_daily_quiz_at ? new Date(profile.last_daily_quiz_at).toDateString() : null;
      const today = new Date().toDateString();

      // すでに今日やっていたら何もしない
      if (lastDate === today) {
        setLoading(false);
        return;
      }

      // 2. まだならクイズをランダムに3問取得 (PostgreSQLの random() を利用)
      // Supabaseでランダム取得は .rpc() を使うのが正式ですが、
      // 簡易的に「多めに取ってJSでシャッフル」します。
      const { data: allQuizzes } = await supabase
        .from('quizzes')
        .select('*')
        .limit(50); // とりあえず50件取得

      if (allQuizzes && allQuizzes.length >= 3) {
        // シャッフルして3問選出
        const shuffled = allQuizzes.sort(() => 0.5 - Math.random()).slice(0, 3);
        setQuizzes(shuffled);
        setIsOpen(true); // モーダルを開く
      }
      setLoading(false);
    };

    checkAndFetch();
  }, [supabase]);

  const handleAnswer = (option: string) => {
    setSelectedOption(option);
    const correct = option === quizzes[currentIndex].correct_answer;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
    
    setShowResult(true);

    // 1.5秒後に次の問題へ
    setTimeout(() => {
      setShowResult(false);
      setSelectedOption(null);
      if (currentIndex < 2) {
        setCurrentIndex(prev => prev + 1);
      } else {
        finishQuiz(correct ? score + 1 : score);
      }
    }, 1500);
  };

  const finishQuiz = async (finalScore: number) => {
    setIsFinished(true);
    const isPerfect = finalScore === 3;

    // サーバー側へ結果送信
    await supabase.rpc('submit_daily_quiz', { is_perfect: isPerfect });
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white" onInteractOutside={(e) => e.preventDefault()}> {/* 外側クリック無効 */}
        
        {!isFinished ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl text-orange-600">
                <FaFire /> 今日のデイリークイズ
              </DialogTitle>
              <DialogDescription>
                全3問！全問正解でレベルアップ＆ストリーク継続！
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="mb-2 text-sm font-bold text-gray-500">Q{currentIndex + 1} / 3</div>
              <h3 className="text-lg font-bold text-gray-800 mb-6 min-h-[3rem]">
                {quizzes[currentIndex]?.question}
              </h3>

              <div className="space-y-3">
                {quizzes[currentIndex]?.options.map((option) => {
                  let btnClass = "w-full justify-start p-4 text-left border-2 h-auto";
                  if (showResult) {
                    if (option === quizzes[currentIndex].correct_answer) btnClass += " bg-green-100 border-green-500 text-green-800";
                    else if (option === selectedOption) btnClass += " bg-red-100 border-red-500 text-red-800";
                  } else {
                     btnClass += " hover:bg-orange-50 hover:border-orange-300";
                  }

                  return (
                    <Button
                      key={option}
                      variant="ghost"
                      className={btnClass}
                      onClick={() => !showResult && handleAnswer(option)}
                      disabled={showResult}
                    >
                      {option}
                      {showResult && option === quizzes[currentIndex].correct_answer && <FaCheckCircle className="ml-auto text-green-600"/>}
                      {showResult && option === selectedOption && option !== quizzes[currentIndex].correct_answer && <FaTimesCircle className="ml-auto text-red-500"/>}
                    </Button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          // 結果画面
          <div className="text-center py-8">
            {score === 3 ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <SimpleConfetti />
                <FaTrophy className="text-6xl text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">全問正解！！</h2>
                <p className="text-orange-600 font-bold mb-6">レベルアップしました！</p>
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <div className="text-6xl mb-4">😢</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">おしい！</h2>
                <p className="text-gray-600 mb-6">{score}問正解でした。<br/>また明日挑戦してね！</p>
              </motion.div>
            )}
            
            <Button onClick={handleClose} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              閉じる
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}