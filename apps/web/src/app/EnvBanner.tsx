"use client";

export default function EnvBanner() {
  if (!process.env.NEXT_PUBLIC_SHOW_ENV) return null;
  const mode = process.env.NEXT_PUBLIC_OFFLINE_MODE === '1' ? 'OFFLINE' : 'DB';
  return (
    <div className="bg-amber-100 text-amber-900 text-xs px-3 py-1 border-b">
      Environment: {mode}
    </div>
  );
}


