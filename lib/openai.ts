import OpenAI from 'openai';
import { classifyOpenAIError, getFallbackMessage } from './openai-error-handler';
import { retryWithBackoff } from './retry';
import { calculateCost, trackTokenUsage, checkTokenBudget } from './openai-usage';
import { filterAIOutput, logFilterEvent } from './ai-output-filter';

let openaiInstance: OpenAI | null = null;

const OPENAI_TIMEOUT_MS = Math.max(
  1000,
  parseInt(process.env.OPENAI_TIMEOUT_MS ?? '30000', 10) || 30000
);

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: OPENAI_TIMEOUT_MS,
      maxRetries: 0, // 關閉內建重試，由 retryWithBackoff 控制
    });
  }
  return openaiInstance;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const defaultSystemPrompt =
  '你是一個專業的客服助手。請用繁體中文回答用戶的問題，保持友善、專業的態度。回答要簡潔明確，幫助用戶解決問題。';

export async function generateReply(
  userMessage: string,
  systemPrompt?: string | null,
  model?: string | null,
  userId?: string
): Promise<string> {
  const modelId = model?.trim() || DEFAULT_MODEL;
  const prompt =
    systemPrompt?.trim() && systemPrompt.trim().length > 0
      ? systemPrompt.trim()
      : defaultSystemPrompt;

  if (userId) {
    const budget = await checkTokenBudget(userId);
    if (!budget.withinBudget) {
      console.warn(`[OpenAI] User ${userId} exceeded monthly budget`);
      return '本月 AI 回覆額度已達上限，請聯繫客服或升級方案。';
    }
  }

  try {
    const completion = await retryWithBackoff(
      async () => {
        return await getOpenAI().chat.completions.create({
          model: modelId,
          messages: [
            { role: 'system' as const, content: prompt },
            { role: 'user' as const, content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });
      },
      {
        maxRetries: Math.max(0, parseInt(process.env.OPENAI_MAX_RETRIES ?? '2', 10) || 2),
        initialDelay: 1000,
        retryableErrors: (error) => {
          const classified = classifyOpenAIError(error);
          return classified.retryable;
        },
      }
    );

    let reply = completion.choices?.[0]?.message?.content ?? '無法生成回覆';
    const filterResult = await filterAIOutput(reply);
    if (!filterResult.isSafe) {
      reply = filterResult.filteredResponse;
      await logFilterEvent(filterResult, { userId, userMessage });
    }

    if (userId && completion.usage) {
      const cost = calculateCost(
        modelId,
        completion.usage.prompt_tokens,
        completion.usage.completion_tokens
      );
      await trackTokenUsage(userId, {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
        cost,
      });
    }

    return reply;
  } catch (error) {
    console.error('[OpenAI] generateReply error:', error);

    const classified = classifyOpenAIError(error);
    const fallbackMessage = getFallbackMessage(classified.type);

    console.error(
      `[OpenAI] Error type: ${classified.type}, fallback: ${fallbackMessage}`
    );

    return fallbackMessage;
  }
}

export { getOpenAI as openai };
