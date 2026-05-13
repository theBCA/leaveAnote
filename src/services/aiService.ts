import type { NoteTheme } from '../types';
import { THEME_CONFIG } from '../types';
import { apiRequest } from './apiClient';

export interface AiMessageRequest {
  occasion: NoteTheme;
  recipientName: string;
  relationship: string;
  tone: string;
  details: string;
  senderName: string;
}

export async function generateMessage(request: AiMessageRequest): Promise<string> {
  const occasionLabel = THEME_CONFIG[request.occasion].label;

  const response = await apiRequest<{ message: string }>('/api/ai/generate', {
    method: 'POST',
    body: JSON.stringify({
      ...request,
      occasionLabel,
    }),
  });

  return response.message.trim();
}
