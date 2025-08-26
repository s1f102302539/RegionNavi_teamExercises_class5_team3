'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function QuizTopPage() {
  const params = useSearchParams();
  const rightView = params.get('right') || 'stamprally'; // 右画面の状態を維持

  const regions = [{ name: '関東地方', prefectures: ['埼玉', '東京', '神奈川', '千葉'] }];
  
  return (
    <div>
      <div className="text-center mb-8"><h1 className="text-3xl font-bold">クイズに挑戦！</h1><p className="text-gray-600 mt-2">都道府県を選んで知識を試そう！</p></div>
       {regions.map(region => (
        <div key={region.name} className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold border-b pb-2 mb-4">{region.name}</h2>
          <div className="flex flex-wrap gap-4">
            {region.prefectures.map(pref => {
              const prefKey = pref.toLowerCase();
              return (
                // リンク先を動的パラメータを含むクエリに変更
                <Link key={pref} href={`/home?left=quiz-${prefKey}&right=${rightView}`}
                  className="px-5 py-2 bg-gray-100 rounded-full font-semibold text-gray-700 hover:bg-[#00A968] hover:text-white transition">
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