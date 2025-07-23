import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* 背景画像とオーバーレイ */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/toppage_background.webp"
          alt="背景"
          fill
          sizes="100vw"
          priority
          quality={80}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-yellow-400/85"></div>
      </div>

      {/* フォームコンテンツ */}
      {children}
    </main>
  );
}