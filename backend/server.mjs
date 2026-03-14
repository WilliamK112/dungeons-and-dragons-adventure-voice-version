import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Modality } from '@google/genai';

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

app.post('/api/live/session', async (req, res) => {
  let session;
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'Server missing GEMINI_API_KEY/API_KEY' });
    }

    const {
      model = 'gemini-live-2.5-flash-preview',
      prompt = 'Reply with exactly: LIVE_OK',
      timeoutMs = 15000,
    } = req.body || {};

    const ai = new GoogleGenAI({ apiKey });

    const result = await new Promise(async (resolve, reject) => {
      let done = false;
      let connected = false;
      const timeout = setTimeout(() => {
        if (!done) {
          done = true;
          reject(new Error(`Live session timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      try {
        session = await ai.live.connect({
          model,
          config: {
            responseModalities: [Modality.TEXT],
          },
          callbacks: {
            onopen: () => {
              connected = true;
            },
            onmessage: (message) => {
              if (done) return;
              const parts = message?.serverContent?.modelTurn?.parts || [];
              const text = parts.map((p) => p?.text || '').join(' ').trim();
              done = true;
              clearTimeout(timeout);
              resolve({
                text: text || null,
                rawType: Object.keys(message || {}),
                hasServerContent: Boolean(message?.serverContent),
                connected,
              });
            },
            onerror: (err) => {
              if (done) return;
              done = true;
              clearTimeout(timeout);
              reject(err?.error || err || new Error('Unknown live session error'));
            },
            onclose: () => {
              if (done) return;
              done = true;
              clearTimeout(timeout);
              if (connected) {
                resolve({ text: null, rawType: [], hasServerContent: false, connected: true, note: 'connected_then_closed' });
              } else {
                reject(new Error('Live session closed before connection established'));
              }
            },
          },
        });

        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: prompt }] }],
          turnComplete: true,
        });
      } catch (err) {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    return res.json({ ok: true, model, result });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown live session error',
    });
  } finally {
    if (session) {
      try {
        session.close();
      } catch {
        // ignore close errors
      }
    }
  }
});

app.get('/api/compliance/status', (_req, res) => {
  return res.json({
    ok: true,
    track: 'Creative Storyteller',
    deployment: {
      project: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || null,
      region: process.env.CLOUD_RUN_REGION || null,
      service: process.env.K_SERVICE || null,
    },
    requirements: {
      geminiModel: true,
      genaiSdkOrAdk: true,
      liveApiOrAdk: 'implemented_probe_endpoint',
      googleCloudBackend: 'deployed_cloud_run',
    },
  });
});

app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      voice = 'onyx',
      model = 'gpt-4o-mini-tts',
      format = 'mp3',
      instructions = 'Speak in a calm, low, mysterious male narrator voice.',
      provider = process.env.TTS_PROVIDER || 'openai',
      fallbackProvider = process.env.TTS_FALLBACK_PROVIDER || 'openai',
      timeoutMs = 15000,
    } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing text (string)' });
    }

    const fetchWithTimeout = async (url, init, ms = 15000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      try {
        return await fetch(url, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
    };

    const tryOpenAI = async () => {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return { ok: false, status: 500, error: 'Server missing OPENAI_API_KEY' };
      }

      const response = await fetchWithTimeout('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model,
          voice,
          input: text,
          format,
          instructions,
        }),
      }, timeoutMs);

      if (!response.ok) {
        const errText = await response.text();
        return { ok: false, status: response.status, error: `OpenAI TTS failed: ${errText}` };
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      return { ok: true, contentType: format === 'wav' ? 'audio/wav' : 'audio/mpeg', audioBuffer };
    };

    const tryCosyVoice = async () => {
      const base = (process.env.COSYVOICE_BASE_URL || '').replace(/\/$/, '');
      if (!base) {
        return { ok: false, status: 500, error: 'Server missing COSYVOICE_BASE_URL' };
      }

      const endpoint = process.env.COSYVOICE_TTS_PATH || '/api/tts';
      const cosyVoiceName = process.env.COSYVOICE_VOICE || voice;
      const response = await fetchWithTimeout(`${base}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: cosyVoiceName,
          speaker: cosyVoiceName,
          format,
          stream: false,
        }),
      }, timeoutMs);

      if (!response.ok) {
        const errText = await response.text();
        return { ok: false, status: response.status, error: `CosyVoice TTS failed: ${errText}` };
      }

      const contentType = response.headers.get('content-type') || (format === 'wav' ? 'audio/wav' : 'audio/mpeg');
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      return { ok: true, contentType, audioBuffer };
    };

    const resolveProvider = async (name) => {
      if (name === 'cosyvoice') return tryCosyVoice();
      return tryOpenAI();
    };

    let result = await resolveProvider(String(provider || 'openai').toLowerCase());
    if (!result.ok && fallbackProvider && String(fallbackProvider).toLowerCase() !== String(provider).toLowerCase()) {
      const fallback = await resolveProvider(String(fallbackProvider).toLowerCase());
      if (fallback.ok) {
        result = fallback;
      }
    }

    if (!result.ok) {
      return res.status(result.status || 500).json({ ok: false, error: result.error || 'TTS failed' });
    }

    res.setHeader('Content-Type', result.contentType || 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(result.audioBuffer);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown TTS server error',
    });
  }
});

app.listen(port, () => {
  console.log(`dnd-gemini-backend listening on :${port}`);
});
