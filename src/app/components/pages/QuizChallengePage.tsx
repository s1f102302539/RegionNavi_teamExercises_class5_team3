'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

// Quiz型を定義
type Quiz = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  // 他に必要なプロパティがあれば追加
};

export default function QuizChallengePage() {
  const supabase = createClient();
  const params = useSearchParams();
  const prefKey = params.get('left')?.replace('quiz-', '');

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isCleared, setIsCleared] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // getMonth()は0から始まるため+1
    const day = String(now.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    console.log("コードが探している日付:", localDateString);
    console.log("URLから取得したキー (prefKey):", prefKey);

      
      const { data: quizData, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('quiz_date', localDateString)
        .eq('prefecture_name', prefKey)
        .limit(1);

        console.log("取得したクイズ:", quizData);
        console.log("error:", error);

    const { data} = await supabase.from('quizzes').select('*');
        console.log("all quizzes:", data);

      
      if (quizData && quizData.length > 0) {
        const currentQuiz = quizData[0];
        setQuiz(currentQuiz);
        const { data: completionData } = await supabase
          .from('quiz_completions')
          .select('id')
          .eq('quiz_id', currentQuiz.id)
          .eq('user_id', user.id)
          .single();
        if (completionData) {
          setIsCleared(true);
        }
      }
    };
    fetchInitialData();
  }, [prefKey, supabase]);

  const handleAnswerSubmit = async () => {
    if (!quiz || !currentUser) return;

    if (selectedAnswer === quiz.correct_answer) {
      await supabase.from('quiz_completions').insert({
        user_id: currentUser.id,
        quiz_id: quiz.id,
      });
      setIsCleared(true);
      alert('正解！カレンダーに記録しました。');
    } else {
      alert('不正解です。ヒントを見てみよう！');
    }
  };

  if (isCleared) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-green-500">🎉 クリア済み 🎉</h2>
        <p>このクイズは既に正解しています。</p>
        <Link href="/home?left=quiz-calendar" className="text-blue-500 hover:underline mt-4 inline-block">
          カレンダーで記録を見る
        </Link>
      </div>
    );
  }

  if (!quiz) {
    return <div className="text-center p-8">今日のクイズはまだないようです。</div>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h1 className="text-xl font-bold mb-4">{prefKey}のデイリークイズ</h1>
      <p className="text-lg mb-6">{quiz.question}</p>
      
      <div className="space-y-3 mb-6">
        {(quiz.options || []).map((option) => (
          <button
            key={option}
            onClick={() => setSelectedAnswer(option)}
            className={`w-full text-left p-3 rounded-lg border-2 transition ${
              selectedAnswer === option
                ? 'bg-green-100 border-green-500'
                : 'bg-gray-50 border-gray-200 hover:border-green-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Link href="/home?right=timeline" className="text-sm text-blue-500 hover:underline">
          タイムラインでヒントを探す
        </Link>
        <button 
          onClick={handleAnswerSubmit}
          disabled={!selectedAnswer}
          className="px-6 py-2 bg-[#00A968] text-white font-semibold rounded-full hover:bg-[#008f58] transition disabled:bg-gray-300"
        >
          回答する
        </button>
      </div>
    </div>
  );
}