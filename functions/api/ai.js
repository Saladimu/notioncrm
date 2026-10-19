const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_ORIGINS = 'https://notioncrm.pages.dev,http://localhost:8000,http://localhost:8788';
const MAX_QUESTION = 500;
const MAX_CONTEXT = 12000;

const SYSTEM_PROMPT = [
  'You are an analytics assistant for a digital product sales dashboard.',
  'Answer only using the DATA provided by the user.',
  'Be concise and reference concrete numbers.',
  'If the data is insufficient, say so instead of guessing.',
  'Never invent values and never request or reveal personal data such as emails.'
].join(' ');

export async function onRequestPost({ request, env }) {
  try {
    if (!isOriginAllowed(request, env)) {
      return json({ error: 'Origin not allowed.' }, 403);
    }
    if (!env.USER_LLM_API_KEY) {
      return json({ error: 'AI is not configured on the server.' }, 503);
    }

    const body = await readJson(request);
    if (!body || typeof body.question !== 'string') {
      return json({ error: 'Invalid request body.' }, 400);
    }

    const question = body.question.trim().slice(0, MAX_QUESTION);
    const context = typeof body.context === 'string' ? body.context.slice(0, MAX_CONTEXT) : '';
    if (!question) {
      return json({ error: 'Question is required.' }, 400);
    }

    const baseUrl = (env.USER_LLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    const model = env.USER_LLM_MODEL || DEFAULT_MODEL;

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.USER_LLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `DATA:\n${context}\n\nQUESTION:\n${question}` }
        ],
        temperature: 0.2,
        max_tokens: 600
      })
    });

    if (!upstream.ok) {
      console.error('LLM upstream error', upstream.status, await safeText(upstream));
      return json({ error: `AI provider error (${upstream.status}).` }, 502);
    }

    const payload = await upstream.json();
    const answer = payload?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return json({ error: 'The AI returned an empty response.' }, 502);
    }

    return json({ answer });
  } catch (err) {
    console.error('AI handler error', err && err.message);
    return json({ error: 'Unexpected server error.' }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: true, hint: 'POST { question, context } to this endpoint.' });
}

function isOriginAllowed(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}

async function safeText(response) {
  try {
    return (await response.text()).slice(0, 500);
  } catch (e) {
    return '';
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
