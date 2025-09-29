'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { User } from '@supabase/supabase-js';

export default function QuizCalendarPage() {
  const supabase = createClient();
  const [clearedDates, setClearedDates] = useState<Date[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // ★ 1. コンポーネントがブラウザに読み込まれたかを管理するStateを追加
  const [isMounted, setIsMounted] = useState(false);

  // ★ 2. ページが読み込まれたら isMounted を true にする
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data } = await supabase
          .from('quiz_completions')
          .select('quizzes!inner(quiz_date)')
          .eq('user_id', user.id);
        
        if (data) {
          const dates = data.map(item => new Date((item.quizzes as any).quiz_date + 'T00:00:00'));
          setClearedDates(dates);
        }
      }
    };
    fetchUserData();
  }, [supabase]);

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">クリア履歴</h1>
      <style>{`
        .cleared-day {
          background-color: #a7f3d0;
          border-radius: 50%;
        }
      `}</style>
      
      {/* ★ 3. isMountedがtrueの時だけカレンダーを表示する */}
      {isMounted && (
        <Calendar
          className="w-full border-none"
          tileClassName={({ date, view }) => {
            if (view === 'month' && clearedDates.some(d => d.toDateString() === date.toDateString())) {
              return 'cleared-day';
            }
            return null;
          }}
        />
      )}
    </div>
  );
}