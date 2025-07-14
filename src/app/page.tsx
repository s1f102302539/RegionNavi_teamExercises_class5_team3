import Image from "next/image";

export default function Home() {
  return (
    <main>
      <div className="flex flex-col items-center p-4">
        <h1 className="text-lg">RERENAVI：仮ページです</h1>
        <p className="mt-2">ここにコンテンツを入力します</p>
        <ul className="mt-2 list-disc list-inside">
          <li>要素1</li>
          <li>要素2</li>
        </ul>
      </div>
    </main>
  );
}
