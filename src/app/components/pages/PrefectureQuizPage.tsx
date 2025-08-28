'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

const prefectureMap: { [key: string]: string } = { saitama: '埼玉県', tokyo: '東京都' };

const dummyQuizData = [
  { type: 'multiple-choice', question: '埼玉県の県庁所在地はどこ？', options: ['川越市', 'さいたま市', '熊谷市', '所沢市'], answer: 'さいたま市' },
  { type: 'true-false', question: '埼玉県の「そうか」は漢字で「草加」と書く。', answer: true },
  { type: 'multiple-choice', question: '次のうち、秩父夜祭で曳き回されるものはどれ？', options: ['神輿', '山車', 'ねぶた', 'だんじり'], answer: '山車' }
];

const FeedbackOverlay = ({ status }: { status: 'correct' | 'incorrect' | null }): JSX.Element | null => {
  if (!status) return null;

  return (
    <div className={`feedback-overlay rounded-xl ${status === 'correct' ? 'bg-green-500/90' : 'bg-red-500/90'}`}>
      {status === 'correct' && (<><svg className="w-32 h-32" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" stroke="white" strokeWidth="8" fill="none" className="correct-circle" /></svg><span className="text-4xl mt-4">正解！</span></>)}
      {status === 'incorrect' && (<><svg className="w-32 h-32 incorrect-cross" viewBox="0 0 100 100"><path d="M 20,20 L 80,80" stroke="white" strokeWidth="8" /><path d="M 80,20 L 20,80" stroke="white" strokeWidth="8" /></svg><span className="text-4xl mt-4">不正解...</span></>)}
    </div>
  );
};

export default function PrefectureQuizPage({ prefecture }: { prefecture: string }) {
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally';
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = useMemo(() => dummyQuizData[currentQuestionIndex], [currentQuestionIndex]);
  const prefectureName = prefectureMap[prefecture] || prefecture;

  useEffect(() => {
    if (isAnswered || !currentQuestion) return;
    if (timer === 0) { handleAnswer(null); return; }
    const intervalId = setInterval(() => { setTimer(prev => prev - 1); }, 1000);
    return () => clearInterval(intervalId);
  }, [timer, isAnswered, currentQuestion]);

  const handleAnswer = (selectedAnswer: string | boolean | null) => {
    setIsAnswered(true);
    const isCorrect = selectedAnswer === currentQuestion.answer;
    if (isCorrect) { setScore(prev => prev + 1); }
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setTimeout(() => {
      if (currentQuestionIndex < dummyQuizData.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setTimer(30);
        setFeedback(null);
        setIsAnswered(false);
      } else {
        setCurrentQuestionIndex(dummyQuizData.length);
      }
    }, 2000);
  };
  
  if (!currentQuestion) {
    const totalQuestions = dummyQuizData.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    let resultMessage = '';
    let resultImage = '/logo_circle.png'; 

    if (percentage === 100) {
      resultMessage = '素晴らしい！あなたはもう埼玉マスターですね！';
      resultImage = '/toppage_background.webp'; 
    } else if (percentage >= 60) {
      resultMessage = 'おしい！なかなかの埼玉通ですね！';
      resultImage = '/toppage_background.webp';
    } else {
      resultMessage = 'また挑戦して埼玉の魅力を発見しよう！';
    }
    
    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setTimer(30);
        setFeedback(null);
        setIsAnswered(false);
    }

    return (
      <div className="max-w-2xl mx-auto text-center bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800">結果発表</h1>
        <div className="my-6">
            <p className="text-xl text-gray-600">あなたの正解数は...</p>
            <p className="text-6xl font-bold text-yellow-500 my-2">{score} <span className="text-3xl text-gray-500">/ {totalQuestions} 問</span></p>
            <p className="text-2xl font-semibold text-gray-700">{percentage}%</p>
        </div>
        <Image src={resultImage} alt="結果" width={400} height={200} className="rounded-lg mx-auto object-cover" />
        <p className="text-xl font-semibold text-gray-800 mt-6">{resultMessage}</p>
        <div className="flex justify-center gap-4 mt-8">
            <button onClick={resetQuiz} className="px-6 py-3 bg-[#00A968] text-white font-bold rounded-full hover:bg-[#008f58] transition">もう一度挑戦</button>
            <Link href={`/home?left=quiz&right=${rightView}`} className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-full hover:bg-gray-300 transition">他のクイズへ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
        <Link href={`/home?left=quiz&right=${rightView}`} className="text-sm font-semibold text-gray-600 hover:underline mb-4 inline-block">← 都道府県選択に戻る</Link>
        <h1 className="text-2xl font-bold text-center mb-2"><span className="text-[#00A968]">{prefectureName}</span> クイズ</h1>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6"><div className="h-full bg-green-400 time-bar" style={{ animationPlayState: isAnswered ? 'paused' : 'running' }}></div></div>
        <div className="bg-white p-8 rounded-xl shadow relative overflow-hidden">
            <FeedbackOverlay status={feedback} />
            <p className="text-lg font-semibold mb-2">Q{currentQuestionIndex + 1}.</p>
            <p className="text-xl mb-6 min-h-[56px]">{currentQuestion.question}</p>
            
            {currentQuestion.type === 'multiple-choice' && ( <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{currentQuestion.options?.map(option => ( <button key={option} onClick={() => handleAnswer(option)} disabled={isAnswered} className="p-4 rounded-lg text-lg text-left font-semibold border-2 transition bg-white hover:bg-gray-50 border-gray-200 disabled:opacity-50">{option}</button>))}</div>)}
            {currentQuestion.type === 'true-false' && ( <div className="flex justify-center gap-8"><button onClick={() => handleAnswer(true)} disabled={isAnswered} className="w-32 h-32 rounded-full border-[10px] border-blue-400 text-blue-400 text-6xl font-bold transition hover:bg-blue-50 disabled:opacity-50">○</button><button onClick={() => handleAnswer(false)} disabled={isAnswered} className="w-32 h-32 rounded-full border-[10px] border-red-400 text-red-400 text-6xl font-bold transition hover:bg-red-50 disabled:opacity-50">×</button></div>)}
        </div>
    </div>
  );
}