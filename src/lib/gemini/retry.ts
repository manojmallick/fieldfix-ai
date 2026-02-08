export function isQuota429(error: unknown): boolean {
  const anyErr = error as { status?: number; response?: { status?: number }; message?: string } | undefined;
  const status = anyErr?.status ?? anyErr?.response?.status;
  if (status === 429) return true;
  if (anyErr?.message) return /\b(429|quota|quota_exceeded|rate limit)\b/i.test(anyErr.message);
  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withGeminiRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Retry only on 503 / overloaded
      const anyErr = error as { status?: number; response?: { status?: number }; message?: string } | undefined;
      const status = anyErr?.status ?? anyErr?.response?.status;
      const is503 = status === 503 || (anyErr?.message && /503|overload|overloaded/i.test(anyErr.message));

      if (!is503 || attempt === attempts) {
        throw error;
      }

      const backoffMs = 400 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
      await sleep(backoffMs);
    }
  }

  throw lastError;
}
