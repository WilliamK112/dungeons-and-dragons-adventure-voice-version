import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'dnd-gemini-backend', timestamp: new Date().toISOString() });
});

app.post('/api/story/next', async (req, res) => {
  try {
    const { prompt, model = 'gemini-2.5-flash' } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing prompt (string)' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'Server missing GEMINI_API_KEY/API_KEY' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return res.json({ ok: true, text: response.text || '' });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
});

app.post('/api/game/command', async (req, res) => {
  try {
    const {
      command,
      payload,
      schema,
      systemInstruction,
      model = 'gemini-2.5-flash',
    } = req.body || {};

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing command (string)' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'Server missing GEMINI_API_KEY/API_KEY' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: JSON.stringify({ command, payload }),
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(schema
          ? {
              responseMimeType: 'application/json',
              responseSchema: schema,
            }
          : {}),
      },
    });

    const text = (response.text || '').trim().replace(/^```json\s*|```\s*$/g, '');
    const data = text ? JSON.parse(text) : null;

    return res.json({ ok: true, data });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
});

// Live API/ADK readiness endpoint for hackathon compliance tracking.
// This is a scaffold endpoint; wire real Live session creation/token exchange next.
app.post('/api/live/session', async (_req, res) => {
  return res.status(501).json({
    ok: false,
    status: 'not_implemented',
    message: 'Live session bootstrap not implemented yet. Next step: integrate Gemini Live API or ADK session orchestration on Cloud Run.',
  });
});

app.get('/api/compliance/status', (_req, res) => {
  return res.json({
    ok: true,
    track: 'Creative Storyteller',
    requirements: {
      geminiModel: true,
      genaiSdkOrAdk: true,
      liveApiOrAdk: false,
      googleCloudBackend: 'in_progress',
    },
  });
});

app.listen(port, () => {
  console.log(`dnd-gemini-backend listening on :${port}`);
});
