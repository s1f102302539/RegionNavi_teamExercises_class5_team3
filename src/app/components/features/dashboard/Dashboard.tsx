import Link from 'next/link';
import { FaMapMarkedAlt, FaQuestionCircle } from 'react-icons/fa';

export default function Dashboard() {
  return (
    // sticky top-24で、スクロールしてもヘッダーの下に固定されるようにします
    <div className="sticky top-24 space-y-8">
      {/* スタンプラリーカード */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center mb-4">
          <FaMapMarkedAlt className="text-yellow-500" size={24} />
          <h2 className="ml-3 text-xl font-bold text-gray-800">スタンプラリー</h2>
        </div>
        <p className="text-gray-600 mb-4">埼玉県の観光名所を巡って、限定スタンプを集めよう！</p>
        <Link href="/stamprally" className="block w-full text-center bg-yellow-400 text-gray-900 font-bold py-3 rounded-xl hover:bg-yellow-500 transition-colors duration-200">
          詳細を見る
        </Link>
      </div>
      
      {/* クイズカード */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center mb-4">
          <FaQuestionCircle className="text-yellow-500" size={24} />
          <h2 className="ml-3 text-xl font-bold text-gray-800">ご当地クイズ</h2>
        </div>
        <p className="text-gray-600 mb-4">あなたの埼玉知識はどのくらい？クイズに挑戦して腕試し！</p>
        <Link href="/quiz" className="block w-full text-center bg-yellow-400 text-gray-900 font-bold py-3 rounded-xl hover:bg-yellow-500 transition-colors duration-200">
          クイズに挑戦
        </Link>
      </div>
    </div>
  );
}