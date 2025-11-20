'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FaCheckCircle, FaMapMarkerAlt, FaPlus, FaMinus } from 'react-icons/fa';

// ローカルのGeoJSONファイルを参照
const GEO_URL = "/prefectures.geojson";

// 日本語名(GeoJSON) から ID(DB用) への変換マップ
const PREFECTURE_KANJI_TO_ID: { [key: string]: string } = {
  "北海道": "hokkaido", "青森県": "aomori", "岩手県": "iwate", "宮城県": "miyagi", "秋田県": "akita", "山形県": "yamagata", "福島県": "fukushima",
  "茨城県": "ibaraki", "栃木県": "tochigi", "群馬県": "gunma", "埼玉県": "saitama", "千葉県": "chiba", "東京都": "tokyo", "神奈川県": "kanagawa",
  "新潟県": "niigata", "富山県": "toyama", "石川県": "ishikawa", "福井県": "fukui", "山梨県": "yamanashi", "長野県": "nagano", "岐阜県": "gifu", "静岡県": "shizuoka", "愛知県": "aichi",
  "三重県": "mie", "滋賀県": "shiga", "京都府": "kyoto", "大阪府": "osaka", "兵庫県": "hyogo", "奈良県": "nara", "和歌山県": "wakayama",
  "鳥取県": "tottori", "島根県": "shimane", "岡山県": "okayama", "広島県": "hiroshima", "山口県": "yamaguchi",
  "徳島県": "tokushima", "香川県": "kagawa", "愛媛県": "ehime", "高知県": "kochi",
  "福岡県": "fukuoka", "佐賀県": "saga", "長崎県": "nagasaki", "熊本県": "kumamoto", "大分県": "oita", "宮崎県": "miyazaki", "鹿児島県": "kagoshima", "沖縄県": "okinawa"
};

export default function StampRallyPage() {
  const supabase = createClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 制覇済み都道府県IDのセット
  const [achievedPrefectures, setAchievedPrefectures] = useState<Set<string>>(new Set());
  
  const [selectedPrefectureName, setSelectedPrefectureName] = useState<string | null>(null);
  const [selectedPrefectureId, setSelectedPrefectureId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [position, setPosition] = useState({ coordinates: [137, 38], zoom: 1 });

  const fetchData = useCallback(async (currentUser: User) => {
    try {
      // ★ 変更: conquered_prefectures テーブルから制覇状況を取得
      const { data, error } = await supabase
        .from('conquered_prefectures')
        .select('prefecture_id')
        .eq('user_id', currentUser.id);

      if (error) throw error;

      if (data) {
        const achievedSet = new Set(data.map(item => item.prefecture_id));
        setAchievedPrefectures(achievedSet);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchData(user);
      } else {
        setLoading(false);
      }
    };
    checkUserAndFetchData();
  }, [supabase.auth, fetchData]);


  const handleZoomIn = () => { if (position.zoom < 4) setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.2 })); };
  const handleZoomOut = () => { if (position.zoom > 1) setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.2 })); };
  const handleMoveEnd = (position: { coordinates: [number, number], zoom: number }) => { setPosition(position); };

  const handleGeographyClick = (geo: any) => {
    const prefName = geo.properties.name || geo.properties.nam || geo.properties.nam_ja;
    const prefId = PREFECTURE_KANJI_TO_ID[prefName];

    if (prefName && prefId) {
      setSelectedPrefectureName(prefName);
      setSelectedPrefectureId(prefId);
      setIsModalOpen(true);
    }
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;
  if (!user) return <div className="p-8 text-center">ログインが必要です。</div>;

  const isSelectedPrefectureAchieved = selectedPrefectureId ? achievedPrefectures.has(selectedPrefectureId) : false;

  return (
    <div className="container mx-auto p-4 md:p-8 bg-slate-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-bold text-indigo-900 mb-2">日本全国スタンプラリー</h1>
        <p className="text-gray-600">投稿して地図を塗りつぶそう！</p>
        <div className="mt-4 inline-block px-6 py-2 bg-white rounded-full shadow-sm border border-indigo-100">
            <span className="font-bold text-indigo-600 text-xl">{achievedPrefectures.size}</span>
            <span className="text-gray-500 mx-2">/</span>
            <span className="text-gray-500">47 都道府県制覇</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
      >
        <div className="w-full aspect-[4/3] md:aspect-video bg-[#aadaff]">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 1600,
              center: [137, 36]
            }}
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
                    const isAchieved = prefId && achievedPrefectures.has(prefId);
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => handleGeographyClick(geo)}
                        style={{
                          default: {
                            fill: isAchieved ? "#4CAF50" : "#FFFFFF",
                            stroke: "#607D8B",
                            strokeWidth: 0.5,
                            outline: "none",
                          },
                          hover: {
                            fill: isAchieved ? "#43A047" : "#FFF9C4",
                            stroke: "#607D8B",
                            strokeWidth: 1,
                            outline: "none",
                            cursor: "pointer"
                          },
                          pressed: {
                            fill: "#FFEB3B",
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

          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button onClick={handleZoomIn} variant="secondary" size="icon" className="shadow-md">
              <FaPlus />
            </Button>
            <Button onClick={handleZoomOut} variant="secondary" size="icon" className="shadow-md">
              <FaMinus />
            </Button>
          </div>
        </div>
        
        <div className="p-4 bg-white border-t flex justify-end gap-4 text-sm font-medium">
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#4CAF50] rounded-sm border border-gray-300"></span>
                <span>制覇済み</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-white rounded-sm border border-gray-300"></span>
                <span>未制覇</span>
            </div>
        </div>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <FaMapMarkerAlt className="text-red-500" />
              {selectedPrefectureName}
            </DialogTitle>
            <DialogDescription>
              制覇状況
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-8 text-center">
            {isSelectedPrefectureAchieved ? (
              <div className="flex flex-col items-center text-green-600">
                 <FaCheckCircle className="text-6xl mb-4" />
                 <h3 className="text-2xl font-bold">制覇済み！</h3>
                 <p className="text-gray-600 mt-2">素晴らしい！この調子で全国を回ろう！</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <p className="mb-2">まだこの都道府県の投稿がありません。</p>
                <p className="text-sm">写真を投稿してスタンプをゲットしよう！</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}