// 以前 stamprally/page.tsx にあった内容をここに移動
import { FaCheckCircle } from 'react-icons/fa';

export default function StampRallyPage() {
  const spots = [
    { name: '川越氷川神社', description: '縁結びの神様として有名', stamped: true },
    { name: '三峯神社', description: '関東最強のパワースポット', stamped: false },
    { name: '長瀞ライン下り', description: '荒川の渓谷美を堪能', stamped: true },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">スタンプラリー</h1>
        <p className="text-gray-600 mt-2">指定のスポットを訪れてスタンプを集めよう！</p>
      </div>
      <div className="space-y-4">
        {spots.map(spot => (
          <div key={spot.name} className="bg-white p-4 rounded-xl shadow flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{spot.name}</h2>
              <p className="text-gray-500">{spot.description}</p>
            </div>
            {spot.stamped ? <div className="flex items-center space-x-2 text-yellow-500"><FaCheckCircle size={24} /><span className="font-bold">達成済</span></div> : <div className="px-4 py-2 border rounded-full font-semibold">未達成</div>}
          </div>
        ))}
      </div>
    </div>
  );
}