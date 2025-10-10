"use client";
import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function PromptWidget({ initialPrompt }: { initialPrompt?: string }) {
  const [input, setInput] = useState(initialPrompt ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  // Add basic ARIA labels for accessibility

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      await Sentry.startSpan({ op: "ui.click", name: "PromptWidget submit" }, async (span) => {
        span.setAttribute("input.length", input.length);
        // Try stream endpoint first
        setStreaming(true);
        const res = await fetch(`/api/ai/suggest/stream?q=${encodeURIComponent(input)}`);
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let acc = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value);
          setResult(acc);
        }
        setStreaming(false);
        setResult(acc);
          span.setAttribute("result.length", acc.length);
          return;
      }
      // Fallback to non-streaming
      const res2 = await fetch("/api/ai/suggest", { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: input }) });
      const json = await res2.json();
      setResult(json?.suggestion ?? '');
        span.setAttribute("fallback", true);
      });
    } catch (error) {
      Sentry.captureException(error as any);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded border p-4">
      <h2 className="text-lg font-semibold">AI Prompt (draft)</h2>
      <form onSubmit={onSubmit} className="mt-3 grid gap-2">
        <textarea
          aria-label="AI prompt input"
          className="min-h-[100px] rounded border p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the test or code you want to draft..."
        />
        <button disabled={loading} className="w-max rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60">
          {loading ? "Generating…" : "Generate"}
        </button>
      </form>
      <div className="mt-2">
        <button
          type="button"
          className="text-xs underline text-gray-600"
          onClick={async () => {
            try {
              const res = await fetch('/api/ai/templates/readyapi-to-playwright');
              const json = await res.json();
              if (json?.template) setInput(json.template);
            } catch {}
          }}
        >
          Load ReadyAPI → Playwright template
        </button>
      </div>
      {result !== null && (
        <div className="mt-3 rounded border bg-gray-50 p-3 text-sm whitespace-pre-wrap" role="region" aria-live="polite">
          {result}
          {streaming && <span className="animate-pulse">▍</span>}
        </div>
      )}
    </section>
  );
}


