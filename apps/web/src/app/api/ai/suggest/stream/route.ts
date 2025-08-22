export const runtime = 'nodejs';

import { checkRateLimit, getClientIp } from '@/server/rateLimit';

function writeChunk(writer: WritableStreamDefaultWriter, text: string) {
  const enc = new TextEncoder();
  return writer.write(enc.encode(text));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prompt = url.searchParams.get('q') || '';
  if (!prompt) {
    return new Response('Missing q', { status: 400 });
  }

  const ip = getClientIp(req);
  const rl = checkRateLimit({ key: `ai:suggest:stream:${ip}`, limit: 30, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return new Response('Too Many Requests', { status: 429, headers: { 'retry-after': String(rl.retryAfter || 60) } });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const apiKey = process.env.OPENAI_API_KEY;
  (async () => {
    try {
      if (apiKey) {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            stream: true,
            messages: [
              { role: 'system', content: 'You write concise, bullet-point testing suggestions.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 300,
          }),
        });
        if (!resp.ok) {
          const txt = await resp.text();
          await writeChunk(writer, `Error: ${txt}`);
          await writer.close();
          return;
        }
        // If provider returned non-streaming json, emit it once
        const ctype = resp.headers.get('content-type') || '';
        if (ctype.includes('application/json') && !ctype.includes('stream')) {
          const json = await resp.json();
          const text = json?.choices?.[0]?.message?.content || '[no content]';
          await writeChunk(writer, text);
          await writer.close();
          return;
        }
        if (!resp.body) {
          await writeChunk(writer, '[empty response]');
          await writer.close();
          return;
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.replace(/^data:\s*/, '');
            if (data === '[DONE]') {
              await writer.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content;
              if (delta) await writeChunk(writer, delta);
            } catch {
              // ignore malformed chunk
            }
          }
        }
      } else {
        // Offline/dev streaming: send a few chunks
        const chunks = [
          'Draft (offline)\n',
          `- Based on: ${prompt.slice(0, 80)}\n`,
          '- Include status/schema/negative cases.\n',
        ];
        for (const c of chunks) {
          await writeChunk(writer, c);
          await new Promise((r) => setTimeout(r, 150));
        }
      }
    } catch (e) {
      await writeChunk(writer, '\n[error streaming suggestion]');
    } finally {
      try { await writer.close(); } catch {}
    }
  })();

  return new Response(readable, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}


