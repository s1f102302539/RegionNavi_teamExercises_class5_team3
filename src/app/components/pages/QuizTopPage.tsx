'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FaPlus, FaMinus, FaTrophy, FaMapMarkedAlt } from 'react-icons/fa';

// スタンプラリーと同じGeoJSONを使用
const GEO_URL = "/prefectures.geojson";

// 漢字名→ID変換マップ
const PREFECTURE_KANJI_TO_ID: { [key: string]: string } = {
  "北海道": "hokkaido", "青森県": "aomori", "岩手県": "iwate", "宮城県": "miyagi", "秋田県": "akita", "山形県": "yamagata", "福島県": "fukushima",
  "茨城県": "ibaraki", "栃木県": "tochigi", "群馬県": "gunma", "埼玉県": "saitama", "千葉県": "chiba", "東京都": "tokyo", "神奈川県": "kanagawa",
  "新潟県": "niigata", "富山県": "toyama", "石川県": "ishikawa", "福井県": "fukui", "山梨県": "yamanashi", "長野県": "nagano", "岐阜県": "gifu", "静岡県": "shizuoka", "愛知県": "aichi",
  "三重県": "mie", "滋賀県": "shiga", "京都府": "kyoto", "大阪府": "osaka", "兵庫県": "hyogo", "奈良県": "nara", "和歌山県": "wakayama",
  "鳥取県": "tottori", "島根県": "shimane", "岡山県": "okayama", "広島県": "hiroshima", "山口県": "yamaguchi",
  "徳島県": "tokushima", "香川県": "kagawa", "愛媛県": "ehime", "高知県": "kochi",
  "福岡県": "fukuoka", "佐賀県": "saga", "長崎県": "nagasaki", "熊本県": "kumamoto", "大分県": "oita", "宮崎県": "miyazaki", "鹿児島県": "kagoshima", "沖縄県": "okinawa"
};

export default function QuizTopPage({ side }: { side: 'left' | 'right' }) {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  
  // 画面遷移用のパラメータ計算
  const otherSide = side === 'left' ? 'right' : 'left';
  const otherSideView = params.get(otherSide) || (otherSide === 'right' ? 'stamprally' : 'home');

  // State
  const [clearedPrefectures, setClearedPrefectures] = useState<Set<string>>(new Set());
  const [position, setPosition] = useState({ coordinates: [137, 38], zoom: 1.2 }); // 初期ズーム
  const [loading, setLoading] = useState(true);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 常設クイズのクリア状況を取得 (prefecture_quiz_clearsテーブル)
        const { data, error } = await supabase
          .from('prefecture_quiz_clears')
          .select('prefecture_id')
          .eq('user_id', user.id);

        if (!error && data) {
          setClearedPrefectures(new Set(data.map(d => d.prefecture_id)));
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  // 都道府県クリック時の処理
  const handleGeographyClick = (geo: any) => {
    // GeoJSONのプロパティから日本語名を取得 (データによって name, nam, nam_ja など異なるので注意)
    const prefName = geo.properties.name || geo.properties.nam || geo.properties.nam_ja;
    const prefId = PREFECTURE_KANJI_TO_ID[prefName];

    if (prefId) {
      // URLを更新してクイズページへ遷移
      // /home?left=quiz-hokkaido&right=... のような形式にする
      router.push(`/home?${side}=quiz-${prefId}&${otherSide}=${otherSideView}`);
    }
  };

  // ズーム操作
  const handleZoomIn = () => { if (position.zoom < 4) setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.2 })); };
  const handleZoomOut = () => { if (position.zoom > 1) setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.2 })); };
  const handleMoveEnd = (position: { coordinates: [number, number], zoom: number }) => { setPosition(position); };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden border border-blue-100 shadow-sm">
      
      {/* ヘッダー */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-blue-100 w-[90%] max-w-md text-center">
        <h1 className="text-xl font-bold text-indigo-900 flex items-center justify-center gap-2">
          <FaMapMarkedAlt className="text-indigo-500" />
          常設：地方知識マスター
        </h1>
        <p className="text-xs text-gray-500 mt-1">地図をクリックしてクイズに挑戦！</p>
      </div>

      {/* 地図エリア */}
      <div className="w-full h-full">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 1600, center: [137, 37] }}
          className="w-full h-full"
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates as [number, number]}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={4}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const prefName = geo.properties.name || geo.properties.nam || geo.properties.nam_ja;
                  const prefId = PREFECTURE_KANJI_TO_ID[prefName];
                  const isCleared = clearedPrefectures.has(prefId);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleGeographyClick(geo)}
                      style={{
                        default: {
                          fill: isCleared ? "#FFD700" : "#FFFFFF", // クリア済みはゴールド
                          stroke: "#94A3B8", // 境界線
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: isCleared ? "#FFC107" : "#818CF8", // ホバー時（未クリアはインディゴ）
                          stroke: "#4F46E5",
                          strokeWidth: 1,
                          cursor: "pointer",
                          outline: "none",
                        },
                        pressed: {
                          fill: "#4338CA",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* ズームコントローラー */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <Button onClick={handleZoomIn} variant="outline" size="icon" className="bg-white shadow-md hover:bg-gray-50">
          <FaPlus className="text-gray-600" />
        </Button>
        <Button onClick={handleZoomOut} variant="outline" size="icon" className="bg-white shadow-md hover:bg-gray-50">
          <FaMinus className="text-gray-600" />
        </Button>
      </div>

      {/* 凡例 */}
      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-100 text-xs font-medium">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-4 h-4 bg-[#FFD700] rounded-sm border border-yellow-600"></span>
          <span className="text-gray-700">クリア (Master)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-white rounded-sm border border-slate-400"></span>
          <span className="text-gray-500">未挑戦</span>
        </div>
      </div>
      
      {/* 制覇数表示 */}
      <div className="absolute top-20 right-4 bg-white/80 backdrop-blur px-3 py-2 rounded-lg shadow border border-yellow-100 flex flex-col items-center">
         <FaTrophy className="text-yellow-500 text-lg mb-1" />
         <span className="text-sm font-bold text-gray-800">{clearedPrefectures.size} / 47</span>
      </div>

    </div>
  );
}