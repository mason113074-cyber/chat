import OpenAI from 'openai';
import { getSupabaseAdmin } from './supabase';

let sentimentOpenAI: OpenAI | null = null;
let hasWarnedMissingOpenAIKey = false;

function getSentimentOpenAI(): OpenAI | null {
  if (sentimentOpenAI) return sentimentOpenAI;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    if (!hasWarnedMissingOpenAIKey) {
      console.warn('[sentiment] OPENAI_API_KEY is missing, skip sentiment analysis.');
      hasWarnedMissingOpenAIKey = true;
    }
    return null;
  }

  sentimentOpenAI = new OpenAI({ apiKey });
  return sentimentOpenAI;
}

export type SentimentResult = {
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  score: number;
  confidence: number;
  keywords: string[];
  suggestedTone: string;
};

export async function analyzeSentiment(text: string): Promise<SentimentResult | null> {
  try {
    const openai = getSentimentOpenAI();
    if (!openai) return null;

    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `分析客服對話訊息的客戶情緒。回傳 JSON：
{
  "sentiment": "positive"|"neutral"|"negative"|"urgent",
  "score": -1.0 到 1.0,
  "confidence": 0.0 到 1.0,
  "keywords": ["關鍵詞陣列"],
  "suggestedTone": "empathetic"|"apologetic"|"professional"|"cheerful"
}
判斷：urgent=投訴/退款/取消/法律行動；negative=不滿/抱怨；neutral=一般詢問；positive=感謝/稱讚`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 200,
    });
    const raw = res.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw.replace(/```json?\s*/g, '').replace(/```\s*$/g, '').trim()) as SentimentResult;
    return parsed;
  } catch {
    return null;
  }
}

export async function storeSentimentAndAlert(
  conversationId: string,
  contactId: string,
  userId: string,
  messageContent: string,
  contactName: string | null
): Promise<void> {
  try {
    const result = await analyzeSentiment(messageContent);
    if (!result) return;

    const admin = getSupabaseAdmin();
    await admin.from('message_sentiments').upsert(
      {
        conversation_id: conversationId,
        contact_id: contactId,
        user_id: userId,
        sentiment: result.sentiment,
        score: result.score,
        confidence: result.confidence,
        keywords: result.keywords ?? [],
        suggested_tone: result.suggestedTone,
        alert_triggered: false,
      },
      { onConflict: 'conversation_id' }
    );

    const shouldAlert = result.sentiment === 'negative' && result.score < -0.5 || result.sentiment === 'urgent';
    if (!shouldAlert) return;

    const alertLevel = result.sentiment === 'urgent' ? 'critical' : 'warning';
    const reason = `客戶 ${contactName || '未知'} 發送了${result.sentiment}情緒訊息，關鍵詞：${(result.keywords ?? []).join(', ') || '無'}`;

    await admin.from('message_sentiments').update({ alert_triggered: true }).eq('conversation_id', conversationId);
    await admin.from('sentiment_alerts').insert({
      user_id: userId,
      contact_id: contactId,
      conversation_id: conversationId,
      alert_level: alertLevel,
      reason,
    });
  } catch (e) {
    console.error('[sentiment] storeSentimentAndAlert error:', e);
  }
}
