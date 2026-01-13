// src/app/actions/createTravelPlan.ts

'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type Post = {
  content: string;
};

export async function createTravelPlan(
  bookmarkedPosts: Post[], 
  duration: string, 
  budget: string,  // 追加
  userRequest: string
): Promise<string> {
  
  if (!bookmarkedPosts || bookmarkedPosts.length === 0) {
    return 'ブックマークされた投稿がありません。計画を作成できませんでした。';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    // ✅ プロンプト
    const prompt = `
あなたは日本の地方創生を応援する、クリエイティブな旅行プランナーです。
以下のユーザーがブックマークした投稿内容と、ユーザーからの具体的な要望、予算感を参考に、魅力的でユニークな旅行計画を提案してください。

# ユーザーの希望する旅行期間:
${duration}

# 1人あたりの予算感:
${budget}

# ユーザーからの具体的な要望:
${userRequest || '特になし（おまかせ）'}

# ユーザーの興味・関心リスト（ブックマーク）:
${bookmarkedPosts.map((post) => `- ${post.content}`).join('\n')}
`;

const basePrompt = `
# 指示:
- 上記のリストから、ユーザーが最も興味を持ちそうな中心的なテーマや地域を1つか2つ選んでください。
- 全体のタイトルとして、**レベル1見出し ( \`#\` )** を使用してください。（例: \`# 最高の金沢満喫プラン\`）
- 「1日目」「2日目」「プランのまとめ」など、旅程の大きな区切りには **レベル2見出し ( \`##\` )** を使用してください。

- 各日の中で、「タイムテーブル」「旅行プラン詳細」「ワンポイントアドバイス」といった小見出しには **レベル3見出し ( \`###\` )** を使用してください。

- 「タイムテーブル」セクションでは、**必ず Markdown のリスト形式 ( \`-\` )** を使用してください。
- 時間と場所・行動をセットにし、項目ごとに \`-\` を付けてください。
- （例）
  \`\`\`
  - 10:00 〇〇駅 到着
  - 10:30 △△城 見学
  - 12:00 ランチ（郷土料理）
  \`\`\`

- 「旅行プラン詳細」セクションでは、以下を厳守してください:
    - 行先（場所名）だけを **太文字 ( \`**\` )** で記載してください。
    - 太文字の行先の後には、必ず改行を入れてから詳しい説明を記述してください。
    - 詳しい説明文を**書き終えた後**、**最後の行**にその場所の公式ウェブサイトやGoogle マップ検索への **リンク ( \`[表示名](URL)\` )** を可能であれば1つ含めてください。（例: \`[Google Mapで検索](https://www.google.com/maps/search/場所名)\`）

- 各日の最後に、その日の注意事項や豆知識を **引用 ( \`>\` )** の形式で「ワンポイントアドバイス」として簡潔に付け加えてください。

- 「プランのまとめ」セクションでは、**箇条書き ( \`-\` ) を一切使わないでください。**
- 代わりに、\`**移動手段**:\` のように項目名を太字にしてください。
- 項目名の**次の行**に、説明文を記述してください。
- 各項目（例: 「移動手段」と「おすすめの食事」）の間は、**必ず一行（空の行）をあけて**ください。
- （例）
  \`\`\`
  **移動手段**:
  熊本市内は「市電1日乗車券」の活用がおすすめです。

  **おすすめの食事**:
  馬刺し、熊本ラーメン、いきなり団子など。

  **宿泊施設**:
  熊本桜町バスターミナル周辺や、下通りアーケード周辺のホテルが便利です。
  \`\`\`
  
- 全体的に、地域の隠れた魅力を発見できるような、ワクワクする提案にしてください。
- 出力はMarkdown形式で、上記の見出し・リスト・太字・引用・リンクを必ず使用して分かりやすく整形してください。
`;



// ( ... この上に prompt と basePrompt の定義がある ... )

    // 2つのプロンプトを結合して、AIに送る最終的なプロンプトを作成します
    const finalPrompt = `${prompt}\n\n${basePrompt}`;

    // ✅ generateContent() 呼び出し (渡す変数を finalPrompt に変更)
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    // ✅ 404などの詳細も返すように改善
    return `AIによる旅行計画の生成に失敗しました。(${error.status ?? 'Unknown Error'})`;
  }
}