"use client";
import { useState } from 'react';

export function CommandExercise({ lessonSlug }: { lessonSlug: string }) {
  const [input, setInput] = useState('git init\ngit add .\ngit commit -m "Initial"');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; pass: boolean; feedback: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai/evaluate/command', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lessonSlug, input }),
      });
      const json = await res.json();
      if (res.ok) setResult({ score: json.score, pass: !!json.pass, feedback: String(json.feedback || '') });
      else setResult({ score: 0, pass: false, feedback: 'Submission failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded border p-4">
      <h3 className="text-base font-semibold">Exercise: Commands</h3>
      <form onSubmit={submit} className="mt-2 grid gap-2">
        <textarea className="min-h-[80px] rounded border p-2" value={input} onChange={(e) => setInput(e.target.value)} />
        <button disabled={loading} className="w-max rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60">{loading ? 'Submitting…' : 'Submit'}</button>
      </form>
      {result && (
        <div className={`mt-3 rounded border p-3 text-sm ${result.pass ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
          <div><span className="font-semibold">Score:</span> {result.score}/100</div>
          <div className="mt-1 whitespace-pre-wrap">{result.feedback}</div>
        </div>
      )}
    </section>
  );
}

export function CodeExercise({ lessonSlug }: { lessonSlug: string }) {
  const [code, setCode] = useState('import { test, expect } from "@playwright/test";\n\ntest("example", async ({ request }) => {\n  const res = await request.get("/api/health");\n  expect(res.status()).toBe(200);\n});');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; pass: boolean; feedback: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai/evaluate/code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lessonSlug, code }),
      });
      const json = await res.json();
      if (res.ok) setResult({ score: json.score, pass: !!json.pass, feedback: String(json.feedback || '') });
      else setResult({ score: 0, pass: false, feedback: 'Submission failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded border p-4">
      <h3 className="text-base font-semibold">Exercise: Code snippet</h3>
      <form onSubmit={submit} className="mt-2 grid gap-2">
        <textarea className="min-h-[120px] rounded border p-2 font-mono" value={code} onChange={(e) => setCode(e.target.value)} />
        <button disabled={loading} className="w-max rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60">{loading ? 'Submitting…' : 'Submit'}</button>
      </form>
      {result && (
        <div className={`mt-3 rounded border p-3 text-sm ${result.pass ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
          <div><span className="font-semibold">Score:</span> {result.score}/100</div>
          <div className="mt-1 whitespace-pre-wrap">{result.feedback}</div>
        </div>
      )}
    </section>
  );
}


