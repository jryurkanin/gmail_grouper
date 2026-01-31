import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import OpenAI from 'openai';

const app = express();
app.use(express.json({ limit: '1mb' }));

// CORS: tighten this to your extension id(s) in production.
app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    methods: ['POST', 'GET'],
  })
);

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const AUTH_TOKEN = process.env.GMAIL_GROUPER_AUTH_TOKEN || null;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ClassifyReq = z.object({
  allowedLabels: z.array(z.string().min(1)).min(1),
  rootEmailText: z.string().min(1).max(50000),
});

function requireAuth(req) {
  if (!AUTH_TOKEN) return; // dev mode
  const hdr = req.headers['authorization'] || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice('Bearer '.length) : null;
  if (token !== AUTH_TOKEN) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/classify', async (req, res) => {
  try {
    requireAuth(req);

    const parsed = ClassifyReq.parse(req.body);
    const { allowedLabels, rootEmailText } = parsed;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not set on server' });
    }

    const system =
      'You are a strict email-thread classifier. ' +
      'Return only a JSON object with a single key "label" whose value is one of the allowedLabels.';

    const user =
      `Classify this Gmail thread based ONLY on the opening (root) email text.\n\n` +
      `allowedLabels: ${JSON.stringify(allowedLabels)}\n\n` +
      `rootEmailText:\n${rootEmailText}`;

    const resp = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    });

    const content = resp.choices?.[0]?.message?.content || '{}';
    let data;
    try {
      data = JSON.parse(content);
    } catch {
      return res.status(502).json({ error: 'Invalid JSON from model', raw: content });
    }

    const label = typeof data.label === 'string' ? data.label : null;
    if (!label || !allowedLabels.includes(label)) {
      return res.status(502).json({
        error: 'Model returned label not in allowedLabels',
        label,
        allowedLabels,
        raw: data,
      });
    }

    return res.json({ label });
  } catch (e) {
    const status = e.statusCode || 400;
    return res.status(status).json({ error: e.message || String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`gmail_grouper backend listening on :${PORT}`);
});
