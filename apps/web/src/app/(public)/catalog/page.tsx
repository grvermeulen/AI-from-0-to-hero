import Link from 'next/link';
import { getServerTrpcCaller } from '@/server/trpcClient';

const SAMPLE = [
  { slug: 'foundation', name: 'Foundation' },
  { slug: 'ai-augmented', name: 'AI‑Augmented Testing' },
];

export default async function CatalogPage() {
  let tracks: { slug: string; name: string }[] = SAMPLE;
  try {
    const caller = await getServerTrpcCaller();
    const result = await caller.track.list({ page: 1, pageSize: 50 });
    tracks = result.items;
  } catch {
    // Fallback to sample list when DB is not configured
  }
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Catalog</h1>
      <ul className="mt-4 grid gap-3">
        {tracks.map((t) => (
          <li key={t.slug}>
            <Link className="underline" href={`/module/${t.slug}`}>{t.name}</Link>
          </li>
        ))}
        {tracks.length === 0 && <li className="text-sm text-gray-500">No tracks found.</li>}
      </ul>
    </main>
  );
}


