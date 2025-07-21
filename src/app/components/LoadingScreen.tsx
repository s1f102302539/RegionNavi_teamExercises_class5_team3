import Image from 'next/image';

// isVisibleプロパティを受け取るように設定
export default function LoadingScreen({ isVisible }: { isVisible: boolean }) {
  return (
    // isVisibleがfalseになったら非表示にするクラスを追加
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-yellow-400 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* ここではロゴをゆっくり点滅させるアニメーションをつけます */}
      <div className="relative w-48 h-48 animate-pulse">
        <Image
          src="/logo_circle.png"
          alt="ローディングロゴ"
          fill
          sizes="200px"
          className="object-contain"
        />
      </div>
    </div>
  );
}