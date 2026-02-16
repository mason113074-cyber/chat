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

export async function generateReply(message: string): Promise<string> {
  const openai = getOpenAIClient();
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            '你是一個專業的客服助手。請用繁體中文回答用戶的問題，保持友善、專業的態度。回答要簡潔明確，幫助用戶解決問題。',
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
