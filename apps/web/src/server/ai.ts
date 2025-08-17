export type AiSuggestOptions = {
  system?: string;
};

/**
 * Suggest a short draft based on a prompt. If OPENAI_API_KEY is not set,
 * falls back to a deterministic template (useful in dev/tests).
 */
export async function suggestDraftForPrompt(prompt: string, opts: AiSuggestOptions = {}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return `Draft (offline):\n- Based on: ${prompt.slice(0, 200)}\n- Include assertions for status, schema, and negative paths.`;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const system =
    opts.system ||
    'You are a helpful assistant that writes concise testing suggestions. Output plain text with clear bullets.';

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 200,
      }),
    });
    if (!resp.ok) {
      // Fallback in case of API error
      return `Draft (fallback):\n- ${prompt.slice(0, 200)}\n- Add at least 3 assertions and one negative case.`;
    }
    const data: {
      choices?: Array<{ message?: { content?: string | null } }>;
    } = await resp.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || `Draft (empty): ${prompt.slice(0, 120)}`;
  } catch {
    return `Draft (error):\n- ${prompt.slice(0, 200)}\n- Include status/schema/negatives.`;
  }
}


