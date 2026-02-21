import OpenAI from 'openai';
import { classifyOpenAIError, getFallbackMessage } from './openai-error-handler';
import { retryWithBackoff } from './retry';
import { calculateCost, trackTokenUsage, checkTokenBudget } from './openai-usage';
import { detectSensitiveKeywords } from './security/sensitive-keywords';
import { generateSecurePrompt, getSafetyFallbackResponse } from './security/secure-prompt';
import { filterAIOutput, logFilterEvent } from './security/output-filter';

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

export type PreviousMessage = { role: 'user' | 'assistant'; content: string };

export interface GenerateReplyOptions {
  maxReplyLength?: number;
  replyTemperature?: number;
  replyFormat?: string;
  autoDetectLanguage?: boolean;
  supportedLanguages?: string[];
  fallbackLanguage?: string;
  guidanceRules?: { rule_title: string; rule_content: string }[];
}

export async function generateReply(
  userMessage: string,
  systemPrompt?: string | null,
  model?: string | null,
  userId?: string,
  contactId?: string, // 用於安全日誌
  previousMessages?: PreviousMessage[], // 最近對話歷史，會加入 prompt context
  options?: GenerateReplyOptions
): Promise<string> {
  const modelId = model?.trim() || DEFAULT_MODEL;
  let basePrompt =
    systemPrompt?.trim() && systemPrompt.trim().length > 0
      ? systemPrompt.trim()
      : defaultSystemPrompt;

  // 格式要求（依 options.replyFormat）
  const replyFormat = options?.replyFormat ?? 'plain';
  if (replyFormat === 'bullet') {
    basePrompt += '\n\n【格式要求】請用條列式（bullet points）回覆，每點以「• 」開頭。';
  } else if (replyFormat === 'concise') {
    basePrompt += '\n\n【格式要求】請用 50 字以內的極簡短方式回覆。';
  }

  // 多語言自動偵測（Sprint 4）
  if (options?.autoDetectLanguage) {
    const supported = (options?.supportedLanguages ?? ['zh-TW']).join(', ');
    const fallback = options?.fallbackLanguage ?? 'zh-TW';
    basePrompt =
      `【語言指示】請自動偵測用戶的語言。如果用戶使用以下語言之一：${supported}，請用該語言回覆。否則用 ${fallback} 回覆。無論使用何種語言，都要保持相同的專業語氣。\n\n` +
      basePrompt;
  }

  // Sprint 5: Guidance 行為指令
  const rules = options?.guidanceRules ?? [];
  if (rules.length > 0) {
    basePrompt += '\n\n## AI 行為指令（你必須嚴格遵守以下規則）：\n';
    basePrompt += rules
      .map((r, i) => `${i + 1}. 【${r.rule_title}】${r.rule_content}`)
      .join('\n');
  }

  // === 安全防護 Step 1：檢查使用者輸入 ===
  const riskDetection = detectSensitiveKeywords(userMessage);
  const strictMode = process.env.SECURITY_STRICT_MODE !== 'false';

  if (strictMode && riskDetection.riskLevel === 'high') {
    console.warn('[Security] High-risk input detected, returning safety fallback:', {
      keywords: riskDetection.keywords,
      userId,
      contactId,
    });

    // 嚴格模式：高風險直接返回安全回覆，不呼叫 AI
    return getSafetyFallbackResponse(riskDetection.keywords);
  }

  // === Token Budget 檢查（保留原有邏輯）===
  if (userId) {
    const budget = await checkTokenBudget(userId);
    if (!budget.withinBudget) {
      console.warn(`[OpenAI] User ${userId} exceeded monthly budget`);
      return '本月 AI 回覆額度已達上限，請聯繫客服或升級方案。';
    }
  }

  // === 安全防護 Step 2：生成安全強化的 Prompt ===
  const securePrompt = generateSecurePrompt({
    baseSystemPrompt: basePrompt,
    userMessage,
    riskLevel: riskDetection.riskLevel,
    detectedKeywords: riskDetection.keywords,
  });

  try {
    // === 呼叫 OpenAI API（保留原有重試邏輯）===
    const apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: securePrompt },
      ...(previousMessages ?? []).flatMap((m) =>
        m.content.trim() ? [{ role: m.role as 'user' | 'assistant', content: m.content.trim() }] : []
      ),
      { role: 'user', content: userMessage },
    ];

    const maxTokens = Math.min(
      Math.max(50, options?.maxReplyLength ?? 500),
      1000
    );
    const temperature = Math.max(
      0,
      Math.min(1, options?.replyTemperature ?? 0.2)
    );

    const completion = await retryWithBackoff(
      async () => {
        return await getOpenAI().chat.completions.create({
          model: modelId,
          messages: apiMessages,
          temperature,
          max_tokens: maxTokens,
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

    const rawReply = completion.choices?.[0]?.message?.content ?? '無法生成回覆';

    // === 安全防護 Step 3：過濾 AI 輸出（可選超時）===
    const filterTimeoutMs = Math.max(0, parseInt(process.env.SECURITY_OUTPUT_FILTER_TIMEOUT ?? '0', 10));
    let filterResult: Awaited<ReturnType<typeof filterAIOutput>>;
    if (filterTimeoutMs > 0) {
      try {
        filterResult = await Promise.race([
          filterAIOutput(rawReply),
          new Promise<Awaited<ReturnType<typeof filterAIOutput>>>((_, reject) =>
            setTimeout(() => reject(new Error('Output filter timeout')), filterTimeoutMs)
          ),
        ]);
      } catch (err) {
        if (err instanceof Error && err.message === 'Output filter timeout') {
          filterResult = {
            isSafe: false,
            reason: '輸出過濾超時',
            originalResponse: rawReply,
            filteredResponse: '抱歉，系統忙碌，請稍後再試。',
          };
        } else {
          throw err;
        }
      }
    } else {
      filterResult = await filterAIOutput(rawReply);
    }

    // 記錄過濾事件
    await logFilterEvent(filterResult, {
      userId,
      contactId,
      userMessage,
    });

    // === Token 使用追蹤（保留原有邏輯）===
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

    // 返回過濾後的安全回覆
    return filterResult.filteredResponse;
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
