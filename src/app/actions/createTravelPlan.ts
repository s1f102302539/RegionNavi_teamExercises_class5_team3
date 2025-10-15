// src/app/actions/createTravelPlan.ts

'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type Post = {
  content: string;
};

export async function createTravelPlan(bookmarkedPosts: Post[]): Promise<string> {
  if (!bookmarkedPosts || bookmarkedPosts.length === 0) {
    return 'ブックマークされた投稿がありません。計画を作成できませんでした。';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // ✅ プロンプト
    const prompt = `
あなたは日本の地方創生を応援する、クリエイティブな旅行プランナーです。
以下のユーザーがブックマークした投稿内容のリストを参考に、魅力的でユニークな1泊2日の旅行計画を提案してください。

# ユーザーの興味・関心リスト:
${bookmarkedPosts.map((post) => `- ${post.content}`).join('\n')}

# 指示:
- 上記のリストから、ユーザーが最も興味を持ちそうな中心的なテーマや地域を1つか2つ選んでください。
- そのテーマや地域を軸に、具体的なスケジュールを時間軸（例: 1日目 午前、午後、夜）で提案してください。
- 移動手段や、おすすめの食事、宿泊施設のアイデアも簡潔に含めてください。
- 全体的に、地域の隠れた魅力を発見できるような、ワクワクする提案にしてください。
- 出力はMarkdown形式で、見出しやリストを使って分かりやすく整形してください。
`;

    // ✅ generateContent() 呼び出し
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    // ✅ 404などの詳細も返すように改善
    return `AIによる旅行計画の生成に失敗しました。(${error.status ?? 'Unknown Error'})`;
  }
}
