'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaTrophy, FaStar, FaFire } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Quiz型を定義
type Quiz = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  prefecture_name?: string;
};

// ★ ダミーデータ
const DUMMY_QUIZ: Quiz = {
  id: 'dummy-001',
  question: '日本で一番面積が大きい都道府県はどこでしょう？',
  options: ['北海道', '岩手県', '福島県', '長野県'],
  correct_answer: '北海道',
  prefecture_name: '北海道'
};

// ★ コンフェッティ（紙吹雪）コンポーネント
const Confetti = () => {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94'][Math.floor(Math.random() * 5)]
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            top: '-10%'
          }}
          initial={{ y: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: '110vh',
            rotate: 360 * 3,
            opacity: 0,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeIn'
          }}
        />
      ))}
    </div>
  );
};

// ★ パーティクル背景
const ParticleBackground = ({ isCorrect }: { isCorrect: boolean }) => {
  const particles = Array.from({ length: 20 }, (_, i) => i);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: isCorrect ? '#4ECDC4' : '#FF6B6B',
          }}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

// ★ スコアカウントアップ
const ScoreCounter = ({ score }: { score: number }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = score / 30;
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 20);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="text-4xl font-bold text-yellow-500"
    >
      +{displayScore} pt
    </motion.div>
  );
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { 
      duration: 0.5, 
      ease: 'easeOut',
      when: "beforeChildren",
      staggerChildren: 0.1
    } 
  },
  exit: { opacity: 0, y: -30, scale: 0.98, transition: { duration: 0.3 } },
};

const optionVariants = {
  hidden: { opacity: 0, x: -30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      type: 'spring',
      stiffness: 100
    }
  }),
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  }
};

const flashVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: [0, 0.3, 0],
    transition: { duration: 0.5 }
  }
};

export default function QuizChallengePage({ side }: { side: 'left' | 'right' }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isCleared, setIsCleared] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [score, setScore] = useState(0);
  const [shakeOption, setShakeOption] = useState<string | null>(null);
  const otherSide = side === 'left' ? 'right' : 'left';
  const prefKey = quiz?.prefecture_name || '';

  useEffect(() => {
    // ★ ダミーデータを使用（開発用）
    setQuiz(DUMMY_QUIZ);
  }, []);

  const handleAnswerSubmit = async () => {
    if (!quiz || isSubmitting) return;

    setIsSubmitting(true);
    const isCorrect = selectedAnswer === quiz.correct_answer;
    
    if (isCorrect) {
      setFeedback('correct');
      setShowConfetti(true);
      const newStreak = streak + 1;
      setStreak(newStreak);
      const earnedScore = 100 * newStreak; // 連続正解でボーナス
      setScore(earnedScore);
      
      setTimeout(() => {
        setIsCleared(true);
        setShowConfetti(false);
      }, 3000);
    } else {
      setFeedback('incorrect');
      setShakeOption(selectedAnswer);
      setStreak(0);
      
      setTimeout(() => {
        setSelectedAnswer('');
        setFeedback(null);
        setIsSubmitting(false);
        setShakeOption(null);
      }, 2000);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">

      {/* ★ コンフェッティ */}
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      {/* ★ フラッシュエフェクト */}
      <AnimatePresence>
        {feedback === 'correct' && (
          <motion.div
            variants={flashVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-green-400 pointer-events-none z-40"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {isCleared ? (
            <motion.div
              key="cleared"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="relative overflow-hidden border-4 border-yellow-400 shadow-2xl shadow-yellow-500/50 bg-gradient-to-br from-yellow-50 to-orange-50">
                {/* ★ パーティクル背景 */}
                <ParticleBackground isCorrect={true} />
                
                <CardHeader className="flex flex-col items-center relative z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
                  >
                    <FaTrophy className="w-24 h-24 text-yellow-500 drop-shadow-lg" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <CardTitle className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mt-4">
                      🎉 素晴らしい！ 🎉
                    </CardTitle>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <CardDescription className="text-lg mt-2">クイズクリア！</CardDescription>
                  </motion.div>

                  {/* ★ スコア表示 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-4"
                  >
                    <ScoreCounter score={score} />
                  </motion.div>

                  {/* ★ 連続正解表示 */}
                  {streak > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                      className="flex items-center gap-2 mt-2 text-orange-600"
                    >
                      <FaFire className="text-2xl" />
                      <span className="text-xl font-bold">{streak}連続正解！</span>
                    </motion.div>
                  )}
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    <Button 
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-6 text-lg"
                      asChild
                    >
                      <Link href={`/home?${side}=quiz-calendar&${otherSide}=home`}>
                        カレンダーで記録を見る
                       </Link>
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : !quiz ? (
            <motion.div
              key="no-quiz"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="text-center p-8 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>今日のクイズはありません</CardTitle>
                  <CardDescription>また明日挑戦してください！</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="quiz"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="relative overflow-hidden bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-purple-200">
                {/* ★ ヘッダーグラデーション */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
                
                <CardHeader className="relative">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <FaStar className="text-yellow-500 text-2xl" />
                    <CardTitle className="text-2xl">
                      {quiz.prefecture_name ? `${quiz.prefecture_name}のデイリークイズ` : 'デイリークイズ'}
                    </CardTitle>
                  </motion.div>
                </CardHeader>
                
                <CardContent>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl mb-8 font-medium text-gray-800 leading-relaxed"
                  >
                    {quiz.question}
                  </motion.p>
                  
                  <div className="space-y-4 mb-6">
                    {(quiz.options || []).map((option, i) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrectAnswer = option === quiz.correct_answer;
                      let variant: "default" | "outline" | "secondary" | "destructive" = 'outline';
                      let icon = null;
                      let className = 'w-full justify-between p-6 text-lg h-auto transition-all duration-300 font-medium';

                      if (feedback) {
                        if (isCorrectAnswer) {
                          variant = 'secondary';
                          className += ' bg-green-100 border-green-500 text-green-800 hover:bg-green-100';
                          icon = <FaCheckCircle className="text-green-500 text-2xl" />;
                        }
                        if (isSelected && feedback === 'incorrect') {
                          variant = 'destructive';
                          icon = <FaTimesCircle className="text-2xl" />;
                        }
                      } else if (isSelected) {
                        variant = 'default';
                        className += ' bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105 shadow-lg';
                      } else {
                        className += ' hover:scale-102 hover:shadow-md hover:border-purple-300';
                      }

                      return (
                        <motion.div
                          key={option}
                          custom={i}
                          variants={optionVariants}
                          initial="hidden"
                          animate={shakeOption === option ? "shake" : "visible"}
                        >
                          <Button
                            variant={variant}
                            className={className}
                            onClick={() => !isSubmitting && setSelectedAnswer(option)}
                            disabled={isSubmitting}
                          >
                            <span className="text-left flex-1">{option}</span>
                            <AnimatePresence>
                              {icon && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: 'spring' }}
                                >
                                  {icon}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* ★ フィードバックメッセージ */}
                  <AnimatePresence>
                    {feedback === 'incorrect' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center"
                      >
                        <p className="text-red-700 font-bold text-lg">
                          もう一度チャレンジ！💪
                        </p>
                        <p className="text-red-600 text-sm mt-1">
                          ヒントを探してみよう
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
                
                <CardFooter className="flex justify-between items-center bg-gray-50">
                  <Button variant="ghost" className="text-purple-600 hover:text-purple-800 hover:bg-purple-50" asChild>
                    <Link href={`/home?${side}=quiz-${prefKey}&${otherSide}=home`}>
                      💡 タイムラインでヒントを探す
                    </Link>
                  </Button>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleAnswerSubmit}
                      disabled={!selectedAnswer || isSubmitting}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-6 text-lg shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            ⏳
                          </motion.div>
                          判定中...
                        </span>
                      ) : (
                        '回答する ✨'
                      )}
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}