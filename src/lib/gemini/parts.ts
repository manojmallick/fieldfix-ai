import fs from 'fs';

export interface InlineDataPart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export function fileToInlineDataPart(filePath: string, mimeType: string): InlineDataPart {
  const imageData = fs.readFileSync(filePath);
  const base64Data = imageData.toString('base64');
  
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}
