
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

export interface ImageData {
  buffer: string;
  mimeType: string;
}

export const synthesizeImage = async (
  prompt: string,
  primary: ImageData,
  overlay?: { data: ImageData; intensity: number }
): Promise<{ imageUrl: string | null; text: string | null }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const parts: any[] = [];
  
  // Construct the intelligent prompt based on overlay presence
  let finalPrompt = prompt;
  if (overlay) {
    finalPrompt = `[TRANSFORMATION_PROTOCOL]: Blend the primary image with the provided overlay texture. 
    [INTENSITY_PARAMETER]: ${overlay.intensity}%. 
    Higher intensity means the overlay texture should dominate the visual structure.
    [USER_PROMPT]: ${prompt}`;
  }

  parts.push({ text: finalPrompt });
  
  // Primary image part
  parts.push({
    inlineData: {
      mimeType: primary.mimeType,
      data: primary.buffer
    }
  });

  // Optional overlay image part
  if (overlay) {
    parts.push({
      inlineData: {
        mimeType: overlay.data.mimeType,
        data: overlay.data.buffer
      }
    });
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config: {
        temperature: 0.9,
    }
  });

  let imageUrl: string | null = null;
  let text: string | null = null;

  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        text = part.text;
      }
    }
  }

  return { imageUrl, text };
};
