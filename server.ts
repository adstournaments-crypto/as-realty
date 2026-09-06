import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

app.use(express.json());

import {
  AS_REALTY_HINGLISH_VOICE_INSTRUCTION,
  AS_REALTY_SYSTEM_INSTRUCTION,
  generateSmartFallback,
} from './src/data/advisorKnowledge';

// Supabase Backend Client Initialization
const SUPABASE_PROJECT_ID = 'Mwyudzasqktveuqmdxjb';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID.toLowerCase()}.supabase.co`;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JQijMHGYr-zm5s8OeGMVHw_NQcI8bqZ';

const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// In-memory server fallback cache for voice sessions and inquiries
const serverVoiceSessionsStore: any[] = [];
const serverLeadsStore: any[] = [];

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AS Realty AI Concierge', supabaseProjectId: SUPABASE_PROJECT_ID });
});

// Supabase Backend Status Check
app.get('/api/supabase-status', async (_req, res) => {
  try {
    const { error } = await supabaseServer.auth.getSession();
    res.json({
      status: error ? 'warning' : 'connected',
      projectId: SUPABASE_PROJECT_ID,
      supabaseUrl: SUPABASE_URL,
      connected: !error,
      error: error?.message || null,
      message: error ? error.message : 'Supabase backend is connected and ready for AI Voice & Authentication.',
    });
  } catch (err: any) {
    res.json({
      status: 'error',
      projectId: SUPABASE_PROJECT_ID,
      connected: false,
      error: err?.message || 'Failed to ping Supabase backend',
    });
  }
});

// Record Voice Session to Supabase Backend
app.post('/api/voice-session', async (req, res) => {
  try {
    const { userId, userEmail, userName, query, response, voiceEngine } = req.body;
    const sessionRecord = {
      user_id: userId || null,
      user_email: userEmail || null,
      user_name: userName || 'VIP Client',
      query_text: query || '',
      response_text: response || '',
      voice_engine: voiceEngine || 'serverless-voice',
      created_at: new Date().toISOString(),
    };

    serverVoiceSessionsStore.unshift(sessionRecord);
    if (serverVoiceSessionsStore.length > 50) serverVoiceSessionsStore.pop();

    try {
      const { error } = await supabaseServer.from('voice_sessions').insert([sessionRecord]);
      if (error) {
        console.info('[Server Supabase] voice_sessions note:', error.message);
      }
    } catch (_) {}

    res.json({ status: 'ok', saved: true, record: sessionRecord });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err?.message });
  }
});

// Retrieve Voice Sessions from Supabase Backend
app.get('/api/voice-sessions', async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    if (userId) {
      const { data, error } = await supabaseServer
        .from('voice_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        res.json({ sessions: data });
        return;
      }
    }
    res.json({ sessions: serverVoiceSessionsStore });
  } catch (err: any) {
    res.json({ sessions: serverVoiceSessionsStore });
  }
});

// Gemini Multi-Turn Chatbot API
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], modelSpeed = 'general' } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required and must be a string.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Determine model according to prompt specifications:
    // "Use gemini-3.1-pro-preview for particularly complex tasks, gemini-3.5-flash for general tasks, and gemini-3.1-flash-lite for tasks that should happen fast."
    let model = 'gemini-3.5-flash';
    if (modelSpeed === 'complex') {
      model = 'gemini-3.1-pro-preview';
    } else if (modelSpeed === 'fast') {
      model = 'gemini-3.1-flash-lite';
    } else {
      model = 'gemini-3.5-flash';
    }

    // If no API key is available or placeholder, use smart fallback
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      const fallbackReply = generateSmartFallback(message);
      res.json({
        reply: fallbackReply,
        modelUsed: 'as-realty-expert-engine',
        status: 'fallback',
        note: 'Configure GEMINI_API_KEY in AI Studio Settings > Secrets for live Gemini model streaming.',
      });
      return;
    }

    // Initialize Gemini client on the server side
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Format chat history into contents array
    const contents = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-10)) {
        if (item && item.text && (item.role === 'user' || item.role === 'model' || item.role === 'assistant')) {
          contents.push({
            role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
            parts: [{ text: String(item.text) }],
          });
        }
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
          systemInstruction: AS_REALTY_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const replyText = response.text || generateSmartFallback(message);
      res.json({
        reply: replyText,
        modelUsed: model,
        status: 'success',
      });
    } catch (apiError: any) {
      console.error('Gemini API call failed, falling back to expert knowledge base:', apiError?.message);
      const fallbackReply = generateSmartFallback(message);
      res.json({
        reply: fallbackReply,
        modelUsed: 'as-realty-fallback',
        status: 'fallback',
        errorDetails: apiError?.message || 'API request error',
      });
    }
  } catch (err: any) {
    console.error('Server error handling /api/chat:', err);
    res.status(500).json({
      error: 'Failed to process chat message.',
      details: err?.message,
    });
  }
});

// Live API Status check endpoint
app.get('/api/live-status', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    liveModel: 'gemini-3.1-flash-live-preview',
    hasApiKey: hasKey,
    language: 'Professional Hinglish (Hindi + English)',
    sampleRates: { input: 16000, output: 24000 },
  });
});

// Vite middleware & Static Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);

  // Setup WebSocket Server for Gemini Live API Voice Conversations with Resilient Fallback Bridge
  const wss = new WebSocketServer({ server, path: '/api/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Live Voice Advisor] Client connected to /api/live');
    let session: any = null;
    let isConversationalBridge = false;

    const activateConversationalBridge = (reason: string) => {
      console.log(`[Live Voice Advisor] Activating resilient conversational voice bridge (${reason})`);
      isConversationalBridge = true;
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'status',
          status: 'ready',
          mode: 'conversational-bridge',
          message: 'Namaste! AS Realty Live Hinglish Advisor is ready. Speak now.',
          model: 'gemini-voice-bridge',
        }));
      }
    };

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
        activateConversationalBridge('Missing or placeholder GEMINI_API_KEY');
      } else {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        try {
          session = await ai.live.connect({
            model: 'gemini-3.1-flash-live-preview',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
              },
              systemInstruction: AS_REALTY_HINGLISH_VOICE_INSTRUCTION,
            },
            callbacks: {
              onmessage: (message: LiveServerMessage) => {
                const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audio && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'audio', audio }));
                }
                if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'interrupted', interrupted: true }));
                }
                const textPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
                if (textPart && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'text', text: textPart }));
                }
              },
              onclose: () => {
                console.log('[Live Voice Advisor] Gemini Live session closed, maintaining bridge');
                if (!isConversationalBridge) {
                  activateConversationalBridge('Live session closed');
                }
              },
              onerror: (err: any) => {
                console.warn('[Live Voice Advisor] Gemini session warning, using conversational bridge:', err?.message || err);
                if (!isConversationalBridge) {
                  activateConversationalBridge(err?.message || 'Live session error');
                }
              },
            },
          });

          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'status',
              status: 'ready',
              message: 'Namaste! AS Realty Live Hinglish Advisor is ready. Speak now.',
              model: 'gemini-3.1-flash-live-preview',
            }));
          }
        } catch (liveErr: any) {
          console.warn('[Live Voice Advisor] Live connect failed, switching to conversational voice bridge:', liveErr?.message || liveErr);
          activateConversationalBridge(liveErr?.message || 'Live connect error');
        }
      }

      clientWs.on('message', async (rawData) => {
        try {
          const msg = JSON.parse(rawData.toString());
          if (msg.audio && session && !isConversationalBridge) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          } else if (msg.text) {
            if (session && !isConversationalBridge) {
              session.sendRealtimeInput({
                text: msg.text,
              });
            } else {
              // Resilient Bridge: Generate response and send back as text for speech synthesis
              const reply = generateSmartFallback(msg.text);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'text', text: reply }));
                clientWs.send(JSON.stringify({ type: 'turnComplete' }));
              }
            }
          }
        } catch (e: any) {
          console.error('[Live Voice Advisor] Error processing client message:', e);
        }
      });

      clientWs.on('close', () => {
        console.log('[Live Voice Advisor] Client disconnected');
        if (session) {
          try {
            session.close();
          } catch (_) {}
        }
      });

      clientWs.on('error', (err) => {
        console.error('[Live Voice Advisor] Client WS error:', err);
        if (session) {
          try {
            session.close();
          } catch (_) {}
        }
      });

    } catch (err: any) {
      console.warn('[Live Voice Advisor] Setup caught, activating bridge:', err);
      activateConversationalBridge(err?.message || 'General setup error');
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`AS Realty luxury portal with Live API running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
