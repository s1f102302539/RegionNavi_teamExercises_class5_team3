"use client";

import { createClient } from '@/lib/supabase/client'; // Supabaseクライアント
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// アイコンをインポート
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaTrophy, 
  FaStar, 
  FaClock,          // タイム用に「時計」アイコンを追加
  FaExclamationTriangle, // ペナルティ用に「警告」アイコンを追加
  FaCrown,
  FaInfoCircle,
  FaBookOpen
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Quiz型を定義
type Quiz = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string; // ★ 解説カラム
  category: string; // ★ カテゴリカラム
};

// --- アニメーション用コンポーネント (ご提示のコードから流用) ---

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

// カード全体のアニメーション
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

// 選択肢のアニメーション
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
  shake: { // 不正解時のシェイク
    x: [-8, 8, -8, 8, 0],
    transition: { duration: 0.4 }
  }
};

// ★★★ ここからロジックを統合 ★★★

const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

type ScoreboardEntry = {
  nickname: string;
  created_at: string;
  score: number;
};

export default function QuizEventComponent() {
  
  // --- State定義 (ロジックとUIの両方を管理) ---
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [nickname, setNickname] = useState('');
  // 3画面の状態を管理
  const [quizState, setQuizState] = useState<'nickname_input' | 'countdown' | 'loading' | 'in_progress' | 'finished'>('nickname_input');

  const [countdown, setCountdown] = useState(3);

  // タイム計測用
  const [startTime, setStartTime] = useState<number | null>(null);
  const [penaltyCount, setPenaltyCount] = useState(0);
  const [finalClearTimeMs, setFinalClearTimeMs] = useState<number | null>(null);

  // クイズ中のUI制御用
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState(''); // '違います！...'
  const [shakeOption, setShakeOption] = useState<string | null>(null); // 不正解シェイク用
  
  // クイズ終了時のエフェクト用
  const [showConfetti, setShowConfetti] = useState(false);

  const [scoreboardData, setScoreboardData] = useState<ScoreboardEntry[]>([]);
  const [isScoreboardLoading, setIsScoreboardLoading] = useState(true);

  const [selectedQuizCategory, setSelectedQuizCategory] = useState<string>('akabane');
  const [showExplanation, setShowExplanation] = useState(false);

  const supabase = createClient();

  // --- 関数定義 (クイズロジック) ---

  // 1. クイズ取得
  const fetchQuizzes = async () => {
    setQuizState('loading');

    const { data, error } = await supabase
        .from('event_quiz')
        .select('id, question, options, answer, explanation, category') // ★ 必要なカラムを明示
        .eq('category', selectedQuizCategory) // ★ 選択されたカテゴリで絞り込み
        .limit(10);

    if (error) {
      console.error('クイズの取得に失敗:', error);
      setQuizState('nickname_input'); // エラー時は入力画面に戻す
    } else if (data && data.length > 0) {
      console.log('取得したクイズデータ:', data);

      const shuffledQuizzes = data.map(quiz => ({
        ...quiz,
        options: shuffleArray([...quiz.options]) // 元配列を壊さないようコピー
      }));

      setQuizzes(shuffledQuizzes);
      setQuizState('in_progress');
      
      // クイズ挑戦ごとにStateをリセット
      setCurrentQuestionIndex(0);
      setPenaltyCount(0);
      setFinalClearTimeMs(null);
      setDisabledOptions([]);
      setFeedback('');
      setShowExplanation(false);
      
      // タイマースタート
      setStartTime(Date.now()); 
    } else {
      // クイズが1件もなかった場合
      console.log('クイズデータがありません');
      setQuizzes([]); // 空にする
      setQuizState('in_progress'); // 'クイズがない'状態も in_progress で処理する
    }
  };
  
  // ニックネーム送信
const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim() === '') {
      alert('ニックネームを入力してください');
      return;
    }
    // fetchQuizzes() を直接呼ばず、カウントダウンを開始する
    setCountdown(3); // カウントダウンをリセット
    setQuizState('countdown'); 
  };

  // 2. 回答処理 (正解するまで進めないロジック)
  const handleAnswerSelect = (selectedOption: string) => {
    
    const currentQuiz = quizzes[currentQuestionIndex];
    if (!currentQuiz) return;

    // Supabaseの `answer` カラムを `answer` に変更してください
    if (selectedOption === currentQuiz.answer) { 
      // --- 正解時 ---
      setFeedback(''); 
      setDisabledOptions([]); 
      setShakeOption(null);

      // 最後の問題かチェック
      if (currentQuestionIndex < quizzes.length - 1) {
        // 次の問題へ
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // クイズ終了
        finishQuiz();
      }

    } else {
      // --- 不正解時 ---
      setPenaltyCount(prevCount => prevCount + 1); // ペナルティ加算
      setDisabledOptions(prevDisabled => [...prevDisabled, selectedOption]); // 選択肢を無効化
      setFeedback('違います！もう一度選んでください。'); // フィードバック表示
      
      // シェイクアニメーション
      setShakeOption(selectedOption);
      setTimeout(() => setShakeOption(null), 500); 
    }
  };

  // 3. クイズ終了処理
  const finishQuiz = async () => {
    setQuizState('finished');
    setShowConfetti(true); 
    
    // タイム計算 (変更なし)
    const endTime = Date.now();
    const baseTimeMs = endTime - (startTime || endTime);
    const penaltyTimeMs = penaltyCount * 5000;
    const finalTime = baseTimeMs + penaltyTimeMs;
    
    setFinalClearTimeMs(finalTime); // 画面表示用に保持

    // DBに保存
    if (nickname) {
      const { error } = await supabase
        .from('quiz_results')
        .insert({
          nickname: nickname,
          score: finalTime, // ★ clear_time_ms の代わりに score に finalTime を格納
          penalty_count: penaltyCount,
          quiz_category: selectedQuizCategory
        });

      if (error) {
        console.error('結果の保存に失敗:', error);
      }
    }
    
    // 4秒後にコンフェッティを消す
    setTimeout(() => setShowConfetti(false), 4000);
    
    // ★ スコアボードデータを取得
    fetchScoreboard();
  };

  const fetchScoreboard = async () => {
    setIsScoreboardLoading(true); 
    const { data, error } = await supabase
      .from('quiz_results')
      .select('nickname, created_at, score')
      // ★ 修正点: 現在選択中のカテゴリで絞り込む
      .eq('quiz_category', selectedQuizCategory) 
      .order('score', { ascending: true }) 
      .limit(10); 

    if (error) {
      console.error('スコアボードの取得に失敗:', error);
    } else if (data) {
      setScoreboardData(data);
    }
    setIsScoreboardLoading(false); 
  };
  
  // ミリ秒をフォーマットするヘルパー関数 (変更なし)
  const formatTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    return (ms / 1000).toFixed(3);
  };
  
  // ★ 日付をフォーマットするヘルパー関数 (新設)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { // 日本のロケールで
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  useEffect(() => {
    if (quizState === 'countdown') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) { // 1 の状態から 0 になる時
            clearInterval(timer);
            fetchQuizzes(); // カウントダウン終了後にクイズ取得開始
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // 1秒ごとに実行

      return () => clearInterval(timer); // コンポーネントがアンマウントされたらタイマー解除
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizState]); // quizState が 'countdown' になった時だけ実行

  // --- 4. 表示の切り替え (UIとロジックを統合) ---

return (
    <div className="relative w-full h-full flex items-center justify-center min-h-screen bg-gray-100 p-4">
      
      {/* (コンフェッティ表示エリアは変更なし) */}
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>
      
  <div className="relative z-10 w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-6">
  <div className="w-full max-w-2xl">
    <AnimatePresence mode="wait">
      {/* --- 画面1: ニックネーム入力 (ルール説明を追加) --- */}
      {quizState === 'nickname_input' && (
        <motion.div
          key="nickname"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Card className="relative overflow-hidden bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-purple-200">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
            
            {/* ★ 修正: mt-20 と <hr /> を削除 */}
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-gray-800 mb-2">
                {selectedQuizCategory === 'akabane' ? '赤羽クイズ' : '全国地方クイズ'} タイムアタック！
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                ニックネームを入力して挑戦しよう
              </CardDescription>
            </CardHeader>

            {/* ★ 修正: CardContent で囲む */}
            <CardContent>
              {/* ★ 1. クイズ選択UI */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-center mb-3 text-gray-700">
                  クイズを選択
                </h4>
                <div className="flex gap-4 justify-center">
                  {/* 赤羽クイズ (変更なし) */}
                  <label className={`flex-1 p-4 border-2 rounded-lg cursor-pointer text-center transition-all ${selectedQuizCategory === 'akabane' ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="quizCategory"
                      value="akabane" // Supabaseのcategoryカラムの値
                      checked={selectedQuizCategory === 'akabane'}
                      onChange={(e) => setSelectedQuizCategory(e.target.value)}
                      className="sr-only" 
                    />
                    <span className="text-lg font-bold">赤羽クイズ</span>
                  </label>
                  
                  {/* ★ 修正: value を 'tihou' に、checked の比較対象も 'tihou' に */}
                  <label className={`flex-1 p-4 border-2 rounded-lg cursor-pointer text-center transition-all ${selectedQuizCategory === 'tihou' ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="quizCategory"
                      value="tihou" // ★ バグ修正: 'it' から 'tihou' へ
                      checked={selectedQuizCategory === 'tihou'} // ★ 修正: 'it' から 'tihou' へ
                      onChange={(e) => setSelectedQuizCategory(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-lg font-bold">全国地方クイズ</span>
                  </label>
                </div>
              </div>
              </CardContent>

                  {/* ★ 2. ルール説明を追加 */}
                  <CardContent>
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="flex items-center justify-center gap-2 text-lg font-semibold text-center mb-3 text-gray-700">
                        <FaInfoCircle />ルール説明
                      </h4>
                      <ul className="space-y-2 text-gray-600 list-disc list-inside">
                        <li>問題は<span className="font-bold">全10問</span>です。</li>
                        {/* ★ 1. ルール説明を動的に */}
                        <li>すべて<span className="font-bold">「{selectedQuizCategory === 'akabane' ? '赤羽' : '全国の地方'}」</span>に関する問題です。</li>
                        <li>答えがわからない時は<span className="font-bold">タイムライン等</span>で調べてOK！</li>
                        <li>誤答は<span className="font-bold text-red-600">+5秒</span>のペナルティです。</li>
                      </ul>
                    </div>
                  
                    <form onSubmit={handleNicknameSubmit} className="space-y-4">
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="ニックネーム"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                      />
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit" 
                          disabled={nickname.trim() === ''}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg shadow-lg"
                        >
                          挑戦する ✨
                        </Button>
                      </motion.div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ★ 4. カウントダウン画面を追加 */}
            {quizState === 'countdown' && (
              <motion.div
                key="countdown"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Card className="text-center p-12 bg-white/80 backdrop-blur-sm shadow-2xl">
                  <CardHeader>
                    <CardDescription className="text-3xl font-bold text-gray-700 mb-6">
                      まもなく開始します...
                    </CardDescription>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={countdown} // keyをcountdownの値にすることで数字が切り替わる
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.4 }}
                        className="text-9xl font-extrabold text-purple-600"
                      >
                        {countdown}
                      </motion.div>
                    </AnimatePresence>
                  </CardHeader>
                </Card>
              </motion.div>
            )}

            {/* --- 画面 (ロード中) --- */}
            {quizState === 'loading' && (
              <motion.div
                key="loading"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Card className="text-center p-8 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>クイズを読み込み中...</CardTitle>
                    <CardDescription>まもなく開始します！</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            )}

            {/* --- 画面3: クイズ終了 (結果表示) --- */}
            {quizState === 'finished' && (
              <motion.div
                key="cleared"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Card className="relative overflow-hidden border-4 border-yellow-400 shadow-2xl shadow-yellow-500/50 bg-gradient-to-br from-yellow-50 to-orange-50">
                  {/* 結果画面のパーティクル */}
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
                        🎉 クリアおめでとう！ 🎉
                      </CardTitle>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <CardDescription className="text-xl mt-2 font-bold text-gray-700">
                        {nickname} さんの結果
                      </CardDescription>
                    </motion.div>

                    {/* ★ タイム表示 */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                      className="mt-6 text-center"
                    >
                    <div className="text-lg text-gray-600">最終スコア (タイム)</div>
                      <div className="text-6xl font-extrabold text-blue-600 mb-6">
                        {/* ★ score カラムに格納した値（finalTime）を表示 */}
                        {formatTime(finalClearTimeMs)}
                        <span className="text-3xl ml-2">秒</span>
                      </div>
                    </motion.div>

                    {/* ★ タイム内訳 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                      className="space-y-2 text-gray-700 w-full max-w-xs"
                    >
                      <p className="flex justify-between text-lg">
                        <span className="flex items-center gap-2">
                          <FaClock />
                          基本タイム:
                        </span>
                        <span className="font-medium">{formatTime(finalClearTimeMs! - (penaltyCount * 5000))} 秒</span>
                      </p>
                      <p className="flex justify-between text-lg">
                        <span className="flex items-center gap-2 text-red-500">
                          <FaExclamationTriangle />
                          ペナルティ:
                        </span>
                        <span className="font-medium text-red-500">
                          +{penaltyCount * 5}.000 秒
                        </span>
                      </p>
                    </motion.div>

                  </CardHeader>
                  
                  <CardContent className="relative z-10 mt-6">

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 }}
                      className="mb-6"
                    >
                      <h3 className="flex items-center justify-center gap-2 text-2xl font-bold text-center text-gray-800 mb-4">
                        <FaCrown className="text-yellow-500" />
                        スコアボード (TOP 10)
                      </h3>
                      
                      {isScoreboardLoading ? (
                        <div className="text-center text-gray-600">ランキングを読み込み中...</div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto rounded-lg bg-white/50 p-4 shadow-inner">
                          {scoreboardData.length === 0 ? (
                            <div className="text-center text-gray-500">まだ記録がありません。</div>
                          ) : (
                            scoreboardData.map((entry, index) => (
                              <div 
                                key={entry.created_at + entry.nickname}
                                className={`flex items-center justify-between p-2 rounded ${
                                  index === 0 ? 'bg-yellow-100 border-yellow-300 border' : 
                                  index === 1 ? 'bg-gray-100' : 
                                  index === 2 ? 'bg-orange-50' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`font-bold text-lg w-6 text-center ${
                                    index === 0 ? 'text-yellow-600' : 
                                    index === 1 ? 'text-gray-600' : 
                                    index === 2 ? 'text-orange-600' : 'text-gray-500'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  <div>
                                    <span className="font-semibold text-gray-800">{entry.nickname}</span>
                                    <span className="text-xs text-gray-500 ml-2">{formatDate(entry.created_at)}</span>
                                  </div>
                                </div>
                                <span className="font-bold text-lg text-blue-600">
                                  {/* score(タイム) をフォーマットして表示 */}
                                  {formatTime(entry.score)} 秒
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </motion.div>
                    
                {/* ★ 3. 解説表示エリア (レイアウト調整版) */}
                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        key="explanation-area"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        // ★ 修正: 背景を白にし、内側に影を追加して可読性を向上
                        className="mb-6 p-4 bg-white rounded-lg border border-gray-200 max-h-96 overflow-y-auto shadow-inner"
                      >
                        <h3 className="text-xl font-bold text-center mb-4 text-gray-800">
                          クイズの解説
                        </h3>
                        {/* ★ 修正: 項目間のスペースを調整 */}
                        <div className="space-y-5">
                          {quizzes.map((quiz, index) => (
                            // ★ 修正: 区切り線を少し薄く
                            <div key={quiz.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                              {/* ★ 修正: 質問文を大きく、太く */}
                              <p className="text-lg font-bold text-gray-800 mb-3">
                                Q{index + 1}. {quiz.question}
                              </p>
                              
                              {/* ★ 修正: 選択肢リストのマージンとスペースを調整 */}
                              <ul className="space-y-1.5 mb-3">
                                {quiz.options.map((option) => (
                                  <li 
                                    key={option} 
                                    // ★ 修正: gapを調整、正解/不正解のコントラストを強調
                                    className={`flex items-start gap-2.5 ${
                                      option === quiz.answer 
                                        ? 'font-bold text-green-700' // 正解
                                        : 'text-gray-500' // 不正解
                                    }`}
                                  >
                                    <span className="mt-1 flex-shrink-0">
                                      {option === quiz.answer ? (
                                        // ★ 修正: アイコンにも色を明記
                                        <FaCheckCircle className="text-green-600" />
                                      ) : (
                                        // ★ 修正: opacityより直接色指定
                                        <FaTimesCircle className="text-gray-300" />
                                      )}
                                    </span>
                                    <span>{option}</span>
                                  </li>
                                ))}
                              </ul>

                              {/* ★ 修正: 解説ボックスに角丸を追加 */}
                              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800 mt-3 rounded-r-md">
                                {/* ★ 修正:【解説】を太字に */}
                                <p className="font-bold mb-1">【解説】</p>
                                {/* ★ 修正: 解説文の行間を広げる */}
                                <p className="leading-relaxed">{quiz.explanation || '解説はありません。'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                    
                    {/* ★ 3. 解説ボタンの追加 */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.1 }}
                      className="mb-4"
                    >
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-6 text-lg"
                        onClick={() => setShowExplanation(!showExplanation)}
                        variant="outline" 
                      >
                       <FaBookOpen className="mr-2" />
                        {showExplanation ? '解説を閉じる' : '解説を読む'}
                      </Button>
                    </motion.div>

                    {/* もう一度挑戦するボタン */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                    >
                      <Button 
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-6 text-lg"
                        onClick={() => {
                          setShowExplanation(false); // ★ 解説を閉じてから戻る
                          setQuizState('nickname_input');
                        }}
                      >
                        もう一度挑戦する
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* --- 画面2: クイズ中 --- */}
            {quizState === 'in_progress' && (
              // ★ key に index を入れることで、問題が進むたびにアニメーションが発火します
              <motion.div
                key={`quiz-${currentQuestionIndex}`} 
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* クイズデータが空だった場合の表示 */}
                {quizzes.length === 0 ? (
                  <Card className="text-center p-8 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>今日のクイズはありません</CardTitle>
                      <CardDescription>また明日挑戦してください！</CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  // クイズがある場合の表示
                  <Card className="relative overflow-hidden bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-purple-200">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
                    
                    <CardHeader className="relative">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between items-center"
                      >
                        <CardTitle className="text-2xl flex items-center gap-2">
                          <FaStar className="text-yellow-500" />
                          {nickname} さん、第{currentQuestionIndex + 1}問
                        </CardTitle>
                        <span className="text-sm text-gray-500 font-medium">
                          (全 {quizzes.length} 問中)
                        </span>
                      </motion.div>
                    </CardHeader>
                    
                    <CardContent>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl mb-8 font-medium text-gray-800 leading-relaxed min-h-[6rem]"
                      >
                        {quizzes[currentQuestionIndex]?.question}
                      </motion.p>
                      
                      <div className="space-y-4 mb-6">
                        {(quizzes[currentQuestionIndex]?.options || []).map((option, i) => {
                          const isDisabled = disabledOptions.includes(option);
                          
                          let className = 'w-full justify-start p-6 text-lg h-auto transition-all duration-300 font-medium';
                          
                          // 不正解で無効化されたボタンのスタイル
                          if (isDisabled) {
                            className += ' bg-red-100 border-red-400 text-red-700 cursor-not-allowed opacity-70';
                          } else {
                          // まだ選べるボタンのスタイル
                            className += ' hover:scale-102 hover:shadow-md hover:border-purple-300 border-2 border-gray-300 bg-white';
                          }

                          return (
                            <motion.div
                              key={option}
                              custom={i}
                              variants={optionVariants}
                              initial="hidden"
                              animate={shakeOption === option ? "shake" : "visible"} // シェイク判定
                            >
                              <Button
                                variant={isDisabled ? "destructive" : "outline"}
                                className={className}
                                onClick={() => handleAnswerSelect(option)} // クリックで即判定
                                disabled={isDisabled} // 無効化
                              >
                                {isDisabled && <FaTimesCircle className="mr-3 text-2xl" />}
                                <span className="text-left flex-1">{option}</span>
                              </Button>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* 不正解時のフィードバック */}
                      <AnimatePresence>
                        {feedback && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center"
                          >
                            <p className="text-red-700 font-bold text-lg">
                              {feedback}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                    
                    {/* フッターにペナルティ回数を表示 */}
                    <CardFooter className="flex justify-between items-center bg-gray-50 p-4">
                       <div className="flex items-center gap-2 text-red-600">
                         <FaExclamationTriangle className="text-2xl" />
                         <span className="text-lg font-bold">
                           ペナルティ: {penaltyCount} 回
                         </span>
                       </div>
                       
                       {/* 「回答する」ボタンは不要（選択肢クリックで即判定するため） */}

                    </CardFooter>
                  </Card>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}