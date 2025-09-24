'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function QuizTopPage() {
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally';

  // ★ 1. 表示名とURLで使うキーの対応表を作成
  const prefectureMap: { [key: string]: string } = {
    '埼玉': 'saitama',
    '東京': 'tokyo',
    '神奈川': 'kanagawa',
    '千葉': 'chiba',
  };

  const regions = [{ name: '関東地方', prefectures: ['埼玉', '東京', '神奈川', '千葉'] }];
  
  return (
    <div>
      <div className="text-center mb-8"><h1 className="text-3xl font-bold">クイズに挑戦！</h1><p className="text-gray-600 mt-2">都道府県を選んで知識を試そう！</p></div>
        {regions.map(region => (
        <div key={region.name} className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold border-b pb-2 mb-4">{region.name}</h2>
          <div className="flex flex-wrap gap-4">
            {region.prefectures.map(pref => {
              // ★ 2. 対応表から英語のキーを取得
              const prefKey = prefectureMap[pref]; 
              
              return (
                <Link 
                  key={pref} 
                  // ★ 3. URLには英語のキーを使う
                  href={`/home?left=quiz-${prefKey}&right=${rightView}`}
                  className="px-5 py-2 bg-gray-100 rounded-full font-semibold text-gray-700 hover:bg-[#00A968] hover:text-white transition">
                  {/* ボタンの表示は日本語のまま */}
                  {pref}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}