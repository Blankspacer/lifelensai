import { LanguageCode, ScanAnalysis, ChatMessage } from '../types';

export interface AnalyzeScanResponse {
  success: boolean;
  analysis: ScanAnalysis;
  error?: string;
}

export async function analyzeScanAPI(
  imageDataUrl: string,
  targetLanguage: LanguageCode = 'en',
  userNotes?: string
): Promise<ScanAnalysis> {
  const mimeTypeMatch = imageDataUrl.match(/^data:([^;]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
  const cleanBase64 = imageDataUrl.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

  const response = await fetch('/api/analyze-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: cleanBase64,
      mimeType,
      targetLanguage,
      userNotes,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to analyze image (Status: ${response.status})`);
  }

  const data: AnalyzeScanResponse = await response.json();
  if (!data.success || !data.analysis) {
    throw new Error(data.error || 'No analysis returned from LifeLens AI.');
  }

  return data.analysis;
}

export async function askDocumentQuestionAPI(
  question: string,
  documentContext: Partial<ScanAnalysis>,
  chatHistory: ChatMessage[],
  targetLanguage: LanguageCode = 'en'
): Promise<string> {
  const response = await fetch('/api/chat-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      documentContext,
      chatHistory: chatHistory.map((m) => ({ role: m.role, content: m.content })),
      targetLanguage,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to get answer (Status: ${response.status})`);
  }

  const data = await response.json();
  return data.answer || 'No response generated.';
}

export async function speakTextAPI(text: string, language: LanguageCode = 'en'): Promise<void> {
  // Try server-side Gemini TTS first
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceName: 'Kore',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        await audio.play();
        return;
      }
    }
  } catch (err) {
    console.warn('Backend TTS failed, falling back to Web Speech API:', err);
  }

  // Graceful browser Web Speech API fallback
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
    const langMap: Record<string, string> = {
      en: 'en-US',
      bn: 'bn-BD',
      es: 'es-ES',
      ja: 'ja-JP',
    };
    utterance.lang = langMap[language] || 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

// Generates an .ics calendar file download for deadlines
export function downloadCalendarEvent(title: string, description: string, dateStr?: string | null) {
  let targetDate = new Date();
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    } else {
      // Set to 7 days ahead if unparseable
      targetDate.setDate(targetDate.getDate() + 7);
    }
  } else {
    targetDate.setDate(targetDate.getDate() + 5);
  }

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatICSDate = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T090000Z`;

  const nowFormatted = formatICSDate(new Date());
  const dueFormatted = formatICSDate(targetDate);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LifeLens AI//Understand Anything//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@lifelens.ai`,
    `DTSTAMP:${nowFormatted}`,
    `DTSTART:${dueFormatted}`,
    `DTEND:${dueFormatted}`,
    `SUMMARY:LifeLens Reminder: ${title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifelens-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
