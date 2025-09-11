/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // ▼ エラーメッセージに出てきたホスト名をここに貼り付けます
        // 画像の表示用のアドレス
        hostname: 'xhiyphnhltprmmairiww.supabase.co', 
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;