import Link from 'next/link';

export default function CatalogPage() {
  const tracks = [
    { slug: 'foundation', name: 'Foundation' },
    { slug: 'ai-augmented', name: 'AI‑Augmented Testing' },
  ];
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Catalog</h1>
      <ul className="mt-4 grid gap-3">
        {tracks.map((t) => (
          <li key={t.slug}>
            <Link className="underline" href={`/module/${t.slug}`}>{t.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}


