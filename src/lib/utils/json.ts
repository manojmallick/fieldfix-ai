export function extractFirstJson(text: string): string | null {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  
  // Remove ```json and ``` markers
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  
  // Try to find JSON object boundaries
  const startIndex = cleaned.indexOf('{');
  if (startIndex === -1) return null;
  
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = startIndex; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        return cleaned.substring(startIndex, i + 1);
      }
    }
  }
  
  return null;
}

export function safeJsonParse<T>(text: string): T | null {
  try {
    // First try to extract JSON if wrapped in markdown or has extra text
    const extracted = extractFirstJson(text);
    if (extracted) {
      return JSON.parse(extracted) as T;
    }
    
    // Try parsing the whole text
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
}
