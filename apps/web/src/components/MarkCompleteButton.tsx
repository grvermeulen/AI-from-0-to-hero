"use client";
import React from 'react';
import { useState, useTransition } from "react";

export default function MarkCompleteButton({
  slug,
  action,
  defaultCompleted = false,
}: {
  slug: string;
  action: () => Promise<void>;
  defaultCompleted?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted] = useState<boolean>(defaultCompleted);

  async function onClick() {
    if (completed || isPending) return;
    startTransition(async () => {
      try {
        await action();
      } catch {}
      try {
        const key = "completed_lessons";
        const existing = typeof window !== "undefined" ? window.localStorage.getItem(key) || "" : "";
        const set = new Set(existing ? existing.split(",") : []);
        set.add(slug);
        if (typeof window !== "undefined") window.localStorage.setItem(key, Array.from(set).join(","));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("lesson-completed", { detail: { slug } }));
        }
      } catch {}
      setCompleted(true);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending || completed}
      aria-busy={isPending || undefined}
      aria-live="polite"
      className="rounded bg-green-600 px-3 py-1 text-white disabled:opacity-60"
      title={completed ? "Completed" : "Mark as complete"}
    >
      {completed ? "Completed" : isPending ? "Working…" : "Mark complete"}
    </button>
  );
}
