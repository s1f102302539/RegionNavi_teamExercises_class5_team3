'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
// ★ shadcn/uiのコンポーネントをインポート
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Quiz型を定義
type Quiz = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
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
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
        
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('quiz_date', localDateString)
        .eq('prefecture_name', prefKey)
        .limit(1);
      
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
      <Card className="text-center p-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-500">🎉 クリア済み 🎉</CardTitle>
          <CardDescription>このクイズは既に正解しています。</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/home?left=quiz-calendar">カレンダーで記録を見る</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) {
    return (
      <Card className="text-center p-8">
        <CardHeader>
          <CardTitle>今日のクイズはありません</CardTitle>
          <CardDescription>また明日挑戦してください！</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{prefKey ? `${prefKey}のデイリークイズ` : 'デイリークイズ'}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg mb-6">{quiz.question}</p>
        
        <div className="space-y-3 mb-6">
          {(quiz.options || []).map((option) => (
            <Button
              key={option}
              variant={selectedAnswer === option ? 'default' : 'outline'}
              className="w-full justify-start p-6 text-base"
              onClick={() => setSelectedAnswer(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="link" asChild className="p-0">
          <Link href="/home?right=timeline">タイムラインでヒントを探す</Link>
        </Button>
        <Button 
          onClick={handleAnswerSubmit}
          disabled={!selectedAnswer}
        >
          回答する
        </Button>
      </CardFooter>
    </Card>
  );
}