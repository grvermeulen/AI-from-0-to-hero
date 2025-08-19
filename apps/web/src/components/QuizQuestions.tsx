"use client";

import React from 'react';
import { useEffect, useMemo, useState } from 'react';

type Question = {
  id: string;
  prompt: string;
  options?: string | null;
};

export default function QuizQuestions({ quizId, questions }: { quizId: string; questions: ReadonlyArray<Question> }) {
  const parsedOptions = useMemo(
    () =>
      questions.map((q) => ({
        ...q,
        parsed: Array.isArray(q.options) ? (q.options as unknown as string[]) : q.options ? (JSON.parse(q.options) as string[]) : [],
      })),
    [questions],
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const q of questions) {
      const key = `quiz_${quizId}_${q.id}`;
      const val = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (val) initial[q.id] = val;
    }
    setAnswers(initial);
  }, [quizId, questions]);

  const onChange = (qid: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
    if (typeof window !== 'undefined') window.localStorage.setItem(`quiz_${quizId}_${qid}`, val);
  };

  return (
    <ol className="grid gap-6 list-decimal pl-6">
      {parsedOptions.map((q) => (
        <li key={q.id}>
          <fieldset>
            <legend className="font-semibold">
              {q.prompt} <span className="text-red-600" aria-hidden>*</span>
            </legend>
            {q.parsed.length > 0 && (
              <ul className="mt-2 list-none pl-0 text-sm">
                {q.parsed.map((opt, i) => (
                  <li key={i}>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={opt}
                        required
                        aria-required="true"
                        checked={answers[q.id] === opt}
                        onChange={(e) => onChange(q.id, (e.target as HTMLInputElement).value)}
                      />
                      <span>{opt}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
        </li>
      ))}
    </ol>
  );
}


