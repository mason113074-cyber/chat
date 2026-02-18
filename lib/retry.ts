/**
 * Retry with exponential backoff for async operations (e.g. LINE API, OpenAI).
 */

export interface RetryOptions {
  maxRetries: number; // 最多重試次數
  initialDelay: number; // 初始延遲（毫秒）
  maxDelay: number; // 最大延遲（毫秒）
  backoffMultiplier: number; // 延遲倍數
  retryableErrors?: (error: unknown) => boolean; // 可重試錯誤判斷
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1 秒
  maxDelay: 30000, // 30 秒
  backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 檢查是否可重試
      if (opts.retryableErrors && !opts.retryableErrors(error)) {
        throw error;
      }

      // 已達最大重試次數
      if (attempt === opts.maxRetries) {
        break;
      }

      // 等待後重試
      console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // 計算下次延遲（exponential backoff）
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError;
}
