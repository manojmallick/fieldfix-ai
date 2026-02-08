import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
}

export function getGeminiFallbackModelName(): string {
  return process.env.GEMINI_FALLBACK_MODEL || 'gemini-3-pro-preview';
}
