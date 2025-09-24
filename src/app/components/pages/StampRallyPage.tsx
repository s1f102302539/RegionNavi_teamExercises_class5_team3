'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Stamp } from '@/types/supabase';


export default function StampRallyPage() {
  const supabase = createClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [stampedStampIds, setStampedStampIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (currentUser: User) => {
    try {
      // 1. 全てのスタンプ情報を取得 (緯度・経度もselect)
      const { data: stampsData, error: stampsError } = await supabase
        .from('stamps')
        .select('id, name, description, prefecture, latitude, longitude') // 緯度・経度を追加
        .order('name', { ascending: true });
      
      if (stampsError) throw stampsError;

      // 2. ログインユーザーの達成済みスタンプIDを取得
      const { data: stampedData, error: stampedError } = await supabase
        .from('stamped_statuses')
        .select('stamp_id')
        .eq('user_id', currentUser.id);

      if (stampedError) throw stampedError;

      setStamps(stampsData || []);
      const stampedIds = new Set(stampedData.map(item => item.stamp_id));
      setStampedStampIds(stampedIds);

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('データの取得に失敗しました。');
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

  const handleToggleStamp = async (stampId: string, isCurrentlyStamped: boolean) => {
    // ... (この関数は変更ありません)
    if (!user) return alert('ログインが必要です。');
    try {
      if (isCurrentlyStamped) {
        await supabase.from('stamped_statuses').delete().match({ user_id: user.id, stamp_id: stampId });
        setStampedStampIds(prev => { const next = new Set(prev); next.delete(stampId); return next; });
      } else {
        await supabase.from('stamped_statuses').insert({ user_id: user.id, stamp_id: stampId });
        setStampedStampIds(prev => { const next = new Set(prev); next.add(stampId); return next; });
      }
    } catch (error) {
      console.error('Error updating stamp status:', error);
      alert('更新に失敗しました。');
    }
  };

  if (loading) return <div>読み込み中...</div>;
  if (!user) return <div>スタンプラリー機能を利用するには、ログインしてください。</div>;

  const unstampedStamps = stamps.filter(stamp => !stampedStampIds.has(stamp.id));
  const stampedStamps = stamps.filter(stamp => stampedStampIds.has(stamp.id));

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">スタンプラリー</h1>
        <p className="text-gray-600 mt-2">指定のスポットを訪れてスタンプを集めよう！</p>
      </div>
      <div className="space-y-4">
        {/* === 未達成のスタンプリスト === */}
        {unstampedStamps.map(stamp => (
          <div
            key={stamp.id}
            className="bg-white p-4 rounded-xl shadow flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleToggleStamp(stamp.id, false)}
          >
            <div>
              <h2 className="text-lg font-bold">{stamp.name}</h2>
              <p className="text-gray-500 mt-1">{stamp.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                {stamp.prefecture && (
                  <div className="flex items-center text-sm text-gray-400">
                    <FaMapMarkerAlt className="mr-1" />
                    <span>{stamp.prefecture}</span>
                  </div>
                )}
                {/* 地図で見るボタン */}
                {stamp.latitude && stamp.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${stamp.latitude},${stamp.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // 親要素のonClickが発火しないようにする
                    className="text-sm text-blue-500 hover:underline"
                  >
                    地図で見る
                  </a>
                )}
              </div>
            </div>
            <div className="px-4 py-2 border rounded-full font-semibold flex-shrink-0 ml-4">未達成</div>
          </div>
        ))}

        {/* === 区切り線 === */}
        {stampedStamps.length > 0 && unstampedStamps.length > 0 && (
          <div className="py-4">
            <div className="relative text-center">
              <hr />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-4 text-sm text-gray-500">
                達成済み
              </span>
            </div>
          </div>
        )}

        {/* === 達成済みのスタンプリスト === */}
        {stampedStamps.map(stamp => (
          <div
            key={stamp.id}
            className="bg-white p-4 rounded-xl shadow flex items-center justify-between cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => handleToggleStamp(stamp.id, true)}
          >
            <div>
              <h2 className="text-lg font-bold">{stamp.name}</h2>
              <p className="text-gray-500 mt-1">{stamp.description}</p>
               <div className="flex items-center space-x-4 mt-2">
                {stamp.prefecture && (
                  <div className="flex items-center text-sm text-gray-400">
                    <FaMapMarkerAlt className="mr-1" />
                    <span>{stamp.prefecture}</span>
                  </div>
                )}
                {stamp.latitude && stamp.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${stamp.latitude},${stamp.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    地図で見る
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-yellow-500 flex-shrink-0 ml-4">
              <FaCheckCircle size={24} />
              <span className="font-bold">達成済</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}