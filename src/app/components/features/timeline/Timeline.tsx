
import Image from 'next/image';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { FaHeart, FaComment, FaRegBookmark } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

// サーバーコンポーネントは async function で定義できます
export default async function Timeline() {
  // サーバーコンポーネント用のSupabaseクライアントを作成
  const supabase = createServerComponentClient({ cookies });

  // 投稿(posts)と、それに関連するプロフィール(profiles)を同時に取得
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false }) // 新しい順に並び替え
    .limit(100); // 表示件数を100件に制限

  // エラーが発生した場合や投稿がない場合の表示
  if (error) {
    return <p className="text-center text-red-500">エラーが発生しました: {error.message}</p>;
  }
  if (!posts || posts.length === 0) {
    return <p className="text-center text-gray-500 mt-8">まだ投稿がありません。</p>;
  }

  // 取得したデータを元にUIをレンダリング
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">タイムライン</h1>
      <div className="space-y-4">
      {posts.map((post: any) => (
        <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center mb-4">
            <Image
              src={post.profiles?.avatar_url || '/logo_circle.png'} // プロフィール画像がなければデフォルト画像
              alt={post.profiles?.username || 'ユーザー'}
              width={48}
              height={48}
              className="rounded-full bg-gray-200"
            />
            <div className="ml-4">
              <div className="flex items-center space-x-2">
                <p className="font-bold text-gray-900">{post.profiles?.username || '匿名ユーザー'}</p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ja })}
                </p>
              </div>
              
              <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

              {post.image && <div className="rounded-xl overflow-hidden border"><Image src={post.image} alt="投稿画像" width={800} height={450} className="w-full object-cover" /></div>}
             <div className="flex justify-between items-center mt-4 text-gray-500">
               <button className="flex items-center space-x-2 hover:text-pink-500 transition-colors duration-200"><FaHeart /> <span className="text-sm font-semibold">{post.likes}</span></button>
               <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors duration-200"><FaComment /> <span className="text-sm font-semibold">{post.comments}</span></button>
               <button className="hover:text-yellow-500 transition-colors duration-200"><FaRegBookmark size={18} /></button>
             </div>
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

// const dummyPosts = [
//   { id: 1, account: { name: '川越市役所【公式】', handle: '@City_Kawagoe', avatar: '/logo_circle.png' }, content: '春の喜多院では桜が見頃です！\n#川越 #喜多院 #桜', image: '/toppage_background.webp', likes: 256, comments: 12, },
//   { id: 2, account: { name: '秩父市【公式】観光課', handle: '@chichibu_kanko', avatar: '/logo_circle.png' }, content: '羊山公園の芝桜の丘、まもなく見頃を迎えます！\n#秩父 #芝桜', image: '/toppage_background.webp', likes: 512, comments: 34, },
// ];

// export default function Timeline() {
//   return (
//     <div>
//       <h1 className="text-2xl font-bold text-gray-800 mb-4">タイムライン</h1>
//       <div className="space-y-4">
//         {dummyPosts.map((post) => (
//           <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
//             <div className="flex items-center mb-4">
//               <Image src={post.account.avatar} alt={post.account.name} width={48} height={48} className="rounded-full" />
//               <div className="ml-4">
//                 <p className="font-bold text-gray-900">{post.account.name}</p>
//                 <p className="text-sm text-gray-500">{post.account.handle}</p>
//               </div>
//             </div>
//             <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>
//             {post.image && <div className="rounded-xl overflow-hidden border"><Image src={post.image} alt="投稿画像" width={800} height={450} className="w-full object-cover" /></div>}
//             <div className="flex justify-between items-center mt-4 text-gray-500">
//               <button className="flex items-center space-x-2 hover:text-pink-500 transition-colors duration-200"><FaHeart /> <span className="text-sm font-semibold">{post.likes}</span></button>
//               <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors duration-200"><FaComment /> <span className="text-sm font-semibold">{post.comments}</span></button>
//               <button className="hover:text-yellow-500 transition-colors duration-200"><FaRegBookmark size={18} /></button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }