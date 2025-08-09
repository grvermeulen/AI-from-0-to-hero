import Link from 'next/link';

type Params = { params: { slug: string } };

const SAMPLE: Record<string, { title: string; lessons: { slug: string; title: string }[]; labs: { id: string; title: string }[] }> = {
  foundation: {
    title: 'Foundation',
    lessons: [
      { slug: 'intro-to-git', title: 'Intro to Git' },
      { slug: 'ts-basics', title: 'TypeScript Basics' },
    ],
    labs: [{ id: 'seed-lab-1', title: 'Initialize a Repo' }],
  },
  'ai-augmented': {
    title: 'AI‑Augmented Testing',
    lessons: [
      { slug: 'prompt-engineering', title: 'Prompt Engineering for Test Design' },
      { slug: 'readyapi-to-code', title: 'ReadyAPI → Code' },
    ],
    labs: [{ id: 'lab-ai-1', title: 'Convert ReadyAPI collection' }],
  },
};

export default async function ModulePage({ params }: Params) {
  const { slug } = params;
  const data = SAMPLE[slug] ?? { title: slug, lessons: [], labs: [] };
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">{data.title}</h1>
      <section className="mt-6">
        <h2 className="text-xl font-semibold">Lessons</h2>
        <ul className="mt-2 grid gap-2">
          {data.lessons.map((l) => (
            <li key={l.slug}>
              <Link className="underline" href={`/lesson/${l.slug}`}>{l.title}</Link>
            </li>
          ))}
          {data.lessons.length === 0 && <li className="text-sm text-gray-500">No lessons yet.</li>}
        </ul>
      </section>
      <section className="mt-6">
        <h2 className="text-xl font-semibold">Labs</h2>
        <ul className="mt-2 grid gap-2">
          {data.labs.map((l) => (
            <li key={l.id}>
              <span>{l.title}</span>
            </li>
          ))}
          {data.labs.length === 0 && <li className="text-sm text-gray-500">No labs yet.</li>}
        </ul>
      </section>
    </main>
  );
}


