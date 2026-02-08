import { getGeminiClient, getGeminiModelName } from './client';
import { withGeminiRetry } from './retry';
import { InlineDataPart } from './parts';

const DEFAULT_RETRY_ATTEMPTS = 3;

async function withRetry<T>(fn: () => Promise<T>, attempts = DEFAULT_RETRY_ATTEMPTS): Promise<T> {
  return withGeminiRetry(fn, attempts);
}

async function generateTextWithModel(modelName: string, prompt: string): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  });

  return result.response.text();
}

async function generateVisionWithModel(
  modelName: string,
  prompt: string,
  imagePart: InlineDataPart
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }, imagePart],
      },
    ],
  });

  return result.response.text();
}

export async function geminiVisionJson(
  prompt: string,
  imagePart: InlineDataPart
): Promise<string> {
  const primaryModel = getGeminiModelName();

  return await withRetry(() => generateVisionWithModel(primaryModel, prompt, imagePart));
}

export async function geminiJsonFromText(prompt: string): Promise<string> {
  const primaryModel = getGeminiModelName();

  return await withRetry(() => generateTextWithModel(primaryModel, prompt));
}
