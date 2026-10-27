import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '35mb' }));

// Shared Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    appName: 'LifeLens AI',
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Analyze Scan endpoint
app.post('/api/analyze-scan', async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg', targetLanguage = 'en', userNotes } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = image.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const languageInstructionMap: Record<string, string> = {
      en: 'English (simple, clear, friendly everyday English)',
      bn: 'Bengali / বাংলা (স্বাভাবিক ও সহজবোধ্য প্রমিত বাংলা ভাষায় সমস্ত উত্তর দিন)',
      es: 'Spanish / Español (español claro y comprensible)',
      ja: 'Japanese / 日本語 (わかりやすい丁寧な日本語)',
    };

    const targetLangDesc = languageInstructionMap[targetLanguage] || languageInstructionMap.en;

    const systemPrompt = `You are LifeLens AI, an expert, objective everyday scanner and explainer.
Your mission: "Scan It. Understand It. Make Better Decisions."
You analyze photos or screenshots of everyday items that confuse people:
- Utility bills, medical invoices, credit card statements
- Product nutrition labels, cosmetics, foreign packaging, expiry dates
- Legal contracts, lease agreements, official government forms, policy letters
- SMS messages, emails, potential scam alerts
- Appliance control panels, error codes, machinery instructions

CRITICAL GUIDELINES:
1. "Help Me Understand" simplicity: Explain complex jargon like you are explaining it to a smart 14-year-old or busy family member.
2. Distinguish read information from independent verification: You can transcribe and interpret what is stated on the document, but you must NOT verify authenticity as guaranteed fact (e.g. state "This document claims to be from Chase Bank, but LifeLens cannot verify sender origin; inspect official domain before clicking").
3. Flag hidden fees, penalty traps, fine print, allergens, or urgent deadlines.
4. Provide structured, actionable next steps.
5. All text fields in the JSON response MUST be provided in the user's chosen target language: ${targetLangDesc}.
6. Return purely valid JSON adhering strictly to the schema.`;

    const userPrompt = `Analyze this image in detail.
Target Language: ${targetLangDesc}
${userNotes ? `User Specific Note/Question: "${userNotes}"` : ''}

Respond with valid JSON matching this schema:
{
  "category": "bill" | "label" | "document" | "message" | "instruction" | "other",
  "categoryLabel": "short category name in target language",
  "documentTitle": "clear title of the item/document",
  "oneSentenceSummary": "punchy 1-sentence takeaway of what this item is and its main impact",
  "whatItMeans": "2-3 paragraphs in simple everyday language explaining what this actually means in real life",
  "keyDetails": [
    {
      "label": "string",
      "value": "string",
      "badge": "string (optional e.g. 'Due Soon', 'Important', 'High Sodium')",
      "isHighlighted": boolean
    }
  ],
  "concernsAndFlags": [
    {
      "severity": "high" | "medium" | "low" | "info",
      "title": "string",
      "explanation": "string",
      "advice": "actionable advice"
    }
  ],
  "nextSteps": [
    {
      "stepNumber": 1,
      "action": "clear action item",
      "deadline": "date or timeframe if mentioned or null",
      "importance": "critical" | "recommended" | "optional"
    }
  ],
  "extractedText": "full or key text extracted from the document/label",
  "verificationNotice": "statement clarifying what was read directly vs what cannot be verified externally",
  "suggestedFollowUps": [
    "3-4 contextual questions the user might want to ask next about this specific item"
  ],
  "disputeLetterTemplate": "optional ready-to-use polite dispute/inquiry email or letter template if there are questionable charges or confusing clauses, or null"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: userPrompt,
          },
        ],
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Clean possible markdown code fences
      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json({
      success: true,
      analysis: parsedData,
    });
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze document with LifeLens AI.',
    });
  }
});

// Follow-up Q&A endpoint
app.post('/api/chat-document', async (req, res) => {
  try {
    const { question, documentContext, chatHistory = [], targetLanguage = 'en' } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const languageInstructionMap: Record<string, string> = {
      en: 'English (simple, clear, friendly)',
      bn: 'Bengali / বাংলা',
      es: 'Spanish / Español',
      ja: 'Japanese / 日本語',
    };

    const targetLangDesc = languageInstructionMap[targetLanguage] || languageInstructionMap.en;

    const systemPrompt = `You are LifeLens AI's document assistant.
You are helping a user understand a specific document, bill, label, message, or instruction manual they have scanned.
You must ground your answers strictly in the document details provided:
Context: ${JSON.stringify(documentContext || {})}

Guidelines:
- Answer clearly in ${targetLangDesc}.
- Be direct, friendly, and practical.
- Never invent facts not in the document context. If something is unknown or not stated in the document, tell the user honestly and advise where they can confirm it.
- Keep answers concise and readable with bullet points where appropriate.`;

    // Construct contents
    const prompt = `User question: "${question}"
Previous conversation history:
${chatHistory.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}

Please answer the user's question clearly.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      answer: response.text || 'I could not generate an answer for that question.',
    });
  } catch (error: any) {
    console.error('Error in chat-document:', error);
    res.status(500).json({
      error: error.message || 'Failed to process document question.',
    });
  }
});

// Text to Speech endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    // Limit text length for fast speech synthesis (first 400 characters)
    const trimmedText = text.slice(0, 450);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: trimmedText,
              speechMetadata: {
                style: 'Calm, clear, helpful audio guide explaining document details',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio generated by TTS model.' });
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Error in tts:', error);
    // Don't fail the whole UI if TTS fails; return null audio so frontend falls back to Web Speech API
    res.json({
      success: false,
      audioBase64: null,
      fallbackToBrowser: true,
      message: error.message,
    });
  }
});

// Setup Vite in Dev or serve static in Prod
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeLens AI server running on http://0.0.0.0:${PORT} (env: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
