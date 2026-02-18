/**
 * Classify OpenAI API errors and provide user-facing fallback messages.
 */

export type OpenAIErrorType =
  | 'rate_limit'
  | 'timeout'
  | 'auth'
  | 'context_length'
  | 'server_error'
  | 'unknown';

export interface ClassifiedError {
  type: OpenAIErrorType;
  retryable: boolean;
}

function getStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    const s = (error as { status: unknown }).status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

function getMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function getCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const c = (error as { code: unknown }).code;
    return typeof c === 'string' ? c : undefined;
  }
  return undefined;
}

export function classifyOpenAIError(error: unknown): ClassifiedError {
  const status = getStatus(error);
  const message = getMessage(error).toLowerCase();
  const code = getCode(error);

  if (status === 429 || code === 'rate_limit_exceeded') {
    return { type: 'rate_limit', retryable: true };
  }
  if (status === 401 || status === 403 || code === 'invalid_api_key' || code === 'insufficient_quota') {
    return { type: 'auth', retryable: false };
  }
  if (status === 400 && (message.includes('context_length') || message.includes('maximum context'))) {
    return { type: 'context_length', retryable: false };
  }
  if (
    status !== undefined &&
    status >= 500 &&
    status < 600
  ) {
    return { type: 'server_error', retryable: true };
  }
  if (
    code === 'timeout' ||
    code === 'ETIMEDOUT' ||
    message.includes('timeout') ||
    message.includes('econnreset')
  ) {
    return { type: 'timeout', retryable: true };
  }

  return { type: 'unknown', retryable: false };
}

export function getFallbackMessage(type: OpenAIErrorType): string {
  switch (type) {
    case 'rate_limit':
      return '目前使用量較大，請稍後再試。';
    case 'timeout':
      return '回覆生成逾時，請再試一次。';
    case 'auth':
      return '服務設定暫時有誤，請聯繫客服。';
    case 'context_length':
      return '訊息過長，請簡短描述您的問題。';
    case 'server_error':
      return 'AI 服務暫時忙碌，請稍後再試。';
    default:
      return '抱歉，處理您的訊息時發生錯誤，請稍後再試。';
  }
}
