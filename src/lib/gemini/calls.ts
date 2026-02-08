import { getGeminiClient, getGeminiModelName } from './client';
import { InlineDataPart } from './parts';

const DEFAULT_RETRY_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error: unknown): boolean {
  const anyError = error as { status?: number; response?: { status?: number }; message?: string };
  const status = anyError?.status ?? anyError?.response?.status;

  if (status === 429 || status === 503) return true;

  if (anyError?.message) {
    return /429|503|overloaded|rate/i.test(anyError.message);
  }

  return false;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = DEFAULT_RETRY_ATTEMPTS): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableGeminiError(error) || attempt === attempts) {
        throw error;
      }

      const backoffMs = 400 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
      await sleep(backoffMs);
    }
  }

  throw lastError;
}

export async function geminiVisionJson(
  prompt: string,
  imagePart: InlineDataPart
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });

  return withRetry(async () => {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }, imagePart],
        },
      ],
    });

    const response = result.response;
    return response.text();
  });
}

export async function geminiJsonFromText(prompt: string): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });

  return withRetry(async () => {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    const response = result.response;
    return response.text();
  });
}
