"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60"
      aria-live="polite"
      aria-busy={pending || undefined}
    >
      {pending ? "Submitting…" : children}
    </button>
  );
}


