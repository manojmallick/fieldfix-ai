import { getGeminiClient, getGeminiModelName } from './client';
import { InlineDataPart } from './parts';

export async function geminiVisionJson(
  prompt: string,
  imagePart: InlineDataPart
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });
  
  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          imagePart,
        ],
      },
    ],
  });
  
  const response = result.response;
  const text = response.text();
  
  return text;
}

export async function geminiJsonFromText(prompt: string): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });
  
  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  });
  
  const response = result.response;
  const text = response.text();
  
  return text;
}
