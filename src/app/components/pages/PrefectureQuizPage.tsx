'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const prefectureMap: { [key: string]: string } = { saitama: '埼玉県', tokyo: '東京都', kanagawa: '神奈川県', chiba: '千葉県' };

export default function PrefectureQuizPage({ prefecture }: { prefecture: string }) {
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally'; // 右画面の状態を維持

  const [selected, setSelected] = useState<string | null>(null);
  const prefectureName = prefectureMap[prefecture] || prefecture;

  const question = { text: `「${prefectureName}」の県庁所在地はどこ？`, options: ['川越市', 'さいたま市', '熊谷市', '所沢市'], answer: 'さいたま市' };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 戻るリンクも右画面の状態を維持する */}
      <Link href={`/home?left=quiz&right=${rightView}`} className="text-sm font-semibold text-gray-600 hover:underline mb-4 inline-block">← 都道府県選択に戻る</Link>
      <h1 className="text-2xl font-bold text-center mb-6"><span className="text-[#00A968]">{prefectureName}</span> クイズ</h1>
      <div className="bg-white p-8 rounded-xl shadow">
        <p className="text-lg font-semibold mb-2">Q1.</p>
        <p className="text-xl mb-6">{question.text}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map(option => (<button key={option} onClick={() => setSelected(option)} className={`p-4 rounded-lg text-lg text-left font-semibold border-2 transition ${selected === option ? 'bg-[#00A968] text-white border-[#00A968]' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>{option}</button>))}
        </div>
        <div className="text-right mt-8"><button className="px-8 py-3 bg-yellow-400 text-gray-800 font-bold rounded-full hover:bg-yellow-500 transition">次の問題へ</button></div>
      </div>
    </div>
  );
}