'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ★ 1. 取得するデータの型を拡張
type Completion = {
  id: string; // レコードのユニークID
  completed_at: string;
  quizzes: {
    quiz_date: string;
    prefecture_name: string;
  } | null;
};

// 連続クリア日数を計算するヘルパー関数
const calculateStreak = (dates: Date[]): number => {
  if (dates.length === 0) return 0;
  const sortedDates = dates.map(d => d.getTime()).sort((a, b) => b - a);
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneDay = 24 * 60 * 60 * 1000;

  if (today.getTime() - sortedDates[0] > oneDay) {
    return 0;
  }
  
  streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const diff = sortedDates[i] - sortedDates[i+1];
    if (diff === oneDay) {
      streak++;
    } else if (diff > oneDay) {
      break;
    }
  }
  return streak;
};


export default function QuizCalendarPage() {
  const supabase = createClient();
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        // ★ 2. select句にidを追加して取得
        const { data } = await supabase
          .from('quiz_completions')
          .select('id, completed_at, quizzes!inner(quiz_date, prefecture_name)')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });
        
        if (data) {
          setCompletions(data as Completion[]);
        }
      }
    };
    if(isMounted) fetchUserData();
  }, [supabase, isMounted]);

  const clearedDates = completions.map(c => new Date(c.quizzes!.quiz_date + 'T00:00:00'));
  const streak = calculateStreak(clearedDates);

  if (!isMounted) {
    return (
      <Card className="shadow-sm rounded-2xl border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center text-gray-800">クリア履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p>カレンダーを読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-gray-800">クリア履歴</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 md:p-6">
        <div className="flex justify-center">
          <Calendar
            mode="multiple"
            selected={clearedDates}
            modifiers={{ today: new Date() }}
            modifiersClassNames={{ today: 'bg-yellow-100 text-yellow-900 font-bold' }}
            classNames={{ day_selected: 'bg-green-200 text-green-900 font-bold hover:bg-green-200 focus:bg-green-200' }}
            styles={{ caption_label: { fontWeight: 'bold', fontSize: '1.1rem' } }}
          />
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">達成状況</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{completions.length}</p>
                <p className="text-sm text-gray-600">総クリア数</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600">{streak}</p>
                <p className="text-sm text-gray-600">連続クリア</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">最近クリアしたクイズ</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {completions.length > 0 ? completions.slice(0, 5).map(comp => (
                // ★ 3. keyをcomp.completed_atからcomp.idに変更
                <div key={comp.id} className="text-sm p-2 bg-gray-50 rounded-md">
                  <span className="font-semibold">{new Date(comp.quizzes!.quiz_date + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}:</span>
                  <span className="ml-2 text-gray-700">{comp.quizzes!.prefecture_name}クイズ</span>
                </div>
              )) : <p className="text-sm text-gray-500">まだクリアしたクイズはありません。</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}