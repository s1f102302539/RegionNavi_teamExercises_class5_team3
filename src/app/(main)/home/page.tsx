// src/app/(main)/page.tsx

import { createClient } from "../../../lib/supabase/server";

// このページをサーバーコンポーネントとして非同期化
export default async function HomePage() {
  // サーバー用のSupabaseクライアントを作成
  const supabase = createClient();

  // 'notes'テーブルから全てのデータを取得
  const { data: notes, error } = await supabase.from("notes").select();

  if (error) {
    console.error("Error fetching notes:", error);
    // エラーが発生した場合の表示
    return <div>エラーが発生しました。</div>;
  }

  return (
    <div>
      <h1>Supabase 動作確認</h1>
      <h2>Notesテーブルのデータ:</h2>
      {/* 取得したデータを整形して表示 */}
      <pre>{JSON.stringify(notes, null, 2)}</pre>
    </div>
  );
}