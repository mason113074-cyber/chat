import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

const SYSTEM_PROMPT = `你是 Customer AI Pro 的智慧客服助手，專門協助企業處理客戶諮詢。

## 你的角色
- 你是一位親切、專業的客服人員
- 你代表使用 Customer AI Pro 服務的商家來服務他們的客戶
- 你的目標是快速、準確地幫助客戶解決問題

## 回覆規則
1. **語言**：一律使用繁體中文回覆
2. **語氣**：友善、溫暖但專業，像一位值得信賴的朋友
3. **長度**：簡潔有力，通常 2-4 句話，不要長篇大論
4. **格式**：因為是 LINE 訊息，不要用 Markdown 格式，用純文字
5. **表情符號**：適度使用 emoji 增加親和力，但不要過多（每則訊息最多 1-2 個）

## 行為準則
- 如果客戶打招呼，熱情回應並主動詢問需要什麼幫助
- 如果客戶問產品/服務問題，盡力回答，不確定的事情誠實說「我幫您確認一下」
- 如果客戶抱怨，先表達理解和歉意，再提供解決方案
- 如果客戶問的問題超出你的能力，建議他們聯繫真人客服
- 永遠不要編造不存在的資訊

## 範例
客戶：「你好」
回覆：「您好！歡迎聯繫我們 😊 請問有什麼我可以幫您的嗎？」

客戶：「我想了解你們的服務」
回覆：「感謝您的興趣！我們提供 AI 智慧客服解決方案，能幫助您的企業 24 小時自動回覆客戶訊息。請問您想了解哪方面的細節呢？例如功能、方案還是價格？」
`;

export async function generateReply(message: string): Promise<string> {
  const openai = getOpenAIClient();
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      throw new Error('No reply generated from OpenAI');
    }

    return reply;
  } catch (error) {
    console.error('Error generating reply:', error);
    throw error;
  }
}

export { getOpenAIClient as openai };
