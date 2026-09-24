import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { buildMessages } from './prompt.js';

const app = express();
const PORT = process.env.PORT || 3001;
// The assignment's original Llama options were retired by Groq in August 2026.
// GPT-OSS 20B is Groq's recommended successor for Llama 3.1 8B Instant.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
app.use(cors({ origin: (origin, callback) => {
  const localDevOrigin = !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  callback(null, localDevOrigin);
} }));
app.use(express.json({ limit: '32kb' }));

function validResult(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== 'blocks,topic'
    || typeof value.topic !== 'string' || !value.topic.trim() || !Array.isArray(value.blocks)) return false;
  const cards = value.blocks.filter((block) => block?.type === 'card');
  if (cards.length < 5 || cards.length > 10) return false;
  const ids = new Set();
  return value.blocks.every((block) => {
    if (!block || typeof block.id !== 'string' || !block.id.trim() || ids.has(block.id)) return false;
    ids.add(block.id);
    if (block.type === 'card') return Object.keys(block).sort().join(',') === 'answer,difficulty,id,question,type'
      && typeof block.question === 'string' && !!block.question.trim() && typeof block.answer === 'string' && !!block.answer.trim()
      && ['easy', 'medium', 'hard'].includes(block.difficulty);
    if (block.type === 'chart') return Object.keys(block).sort().join(',') === 'id,labels,title,type,values'
      && typeof block.title === 'string' && !!block.title.trim() && Array.isArray(block.labels) && Array.isArray(block.values)
      && block.labels.length >= 2 && block.labels.length === block.values.length
      && block.labels.every((label) => typeof label === 'string' && !!label.trim())
      && block.values.every((number) => typeof number === 'number' && Number.isFinite(number));
    if (block.type === 'checklist') return Object.keys(block).sort().join(',') === 'id,items,title,type'
      && typeof block.title === 'string' && !!block.title.trim() && Array.isArray(block.items) && block.items.length > 0
      && block.items.every((item) => typeof item === 'string' && !!item.trim());
    return false;
  });
}

app.post(['/api/generate', '/api/refine'], async (req, res) => {
  const input = typeof req.body?.input === 'string' ? req.body.input.trim() : '';
  const isRefine = req.path === '/api/refine';
  const refinement = typeof req.body?.refinement === 'string' ? req.body.refinement.trim() : '';
  if ((!isRefine && input.length < 10) || (isRefine && (!refinement || !validResult(req.body?.result)))) return res.status(400).json({ error: 'invalid_request' });
  if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'service_unavailable' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages: buildMessages(input, isRefine ? req.body.result : null, refinement), response_format: { type: 'json_object' }, temperature: 0.4, stream: true }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: response.status === 429 ? 'rate_limited' : 'upstream_error' });
    }
    res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    let content = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split('\n'); pending = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;
        let chunk;
        try { chunk = JSON.parse(raw)?.choices?.[0]?.delta?.content || ''; } catch { continue; }
        if (chunk) {
          content += chunk;
          res.write(`event: delta\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
        }
      }
    }
    if (!content.trim()) { res.write(`event: error\ndata: {"error":"empty_response"}\n\n`); return res.end(); }
    let result;
    try { result = JSON.parse(content); } catch { res.write(`event: error\ndata: {"error":"invalid_json"}\n\n`); return res.end(); }
    if (!validResult(result)) { res.write(`event: error\ndata: {"error":"invalid_shape"}\n\n`); return res.end(); }
    res.write(`event: complete\ndata: ${JSON.stringify(result)}\n\n`);
    return res.end();
  } catch (error) {
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error?.name === 'AbortError' ? 'timeout' : 'upstream_error' })}\n\n`);
      return res.end();
    }
    if (error?.name === 'AbortError') return res.status(504).json({ error: 'timeout' });
    return res.status(502).json({ error: 'upstream_error' });
  } finally {
    clearTimeout(timeout);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'invalid_request' });
  return res.status(500).json({ error: 'server_error' });
});

export default app;

if (process.env.VERCEL !== '1') app.listen(PORT, () => console.log(`Chat Is This Real API listening on ${PORT}`));
