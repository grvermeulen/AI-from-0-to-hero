"use client";
import React from 'react';
import { useEffect, useState } from 'react';

export default function Toast({ message, duration = 2000 }: { message: string; duration?: number }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setOpen(false), duration);
    return () => clearTimeout(id);
  }, [duration]);
  if (!open) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/80 px-3 py-2 text-white text-sm shadow-lg"
    >
      {message}
    </div>
  );
}
