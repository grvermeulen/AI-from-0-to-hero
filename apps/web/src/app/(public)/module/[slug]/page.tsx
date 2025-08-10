import Link from 'next/link';
import { getServerTrpcCaller } from '@/server/trpcClient';

type Params = { params: { slug: string } };

const SAMPLE: Record<string, { title: string; lessons: { slug: string; title: string }[]; labs: { id: string; title: string }[]; quizId?: string }> = {
  foundation: {
    title: 'Foundation',
    lessons: [
      { slug: 'intro-to-git', title: 'Intro to Git' },
      { slug: 'ts-basics', title: 'TypeScript Basics' },
    ],
    labs: [{ id: 'seed-lab-1', title: 'Initialize a Repo' }],
    quizId: 'seed-quiz-1',
  },
  'ai-augmented': {
    title: 'AI‑Augmented Testing',
    lessons: [
      { slug: 'prompt-engineering', title: 'Prompt Engineering for Test Design' },
      { slug: 'readyapi-to-code', title: 'ReadyAPI → Code' },
    ],
    labs: [{ id: 'lab-ai-1', title: 'Convert ReadyAPI collection' }],
    quizId: 'seed-quiz-2',
  },
};

export default async function ModulePage({ params }: Params) {
  const { slug } = params;
  let data: { title: string; lessons: { slug: string; title: string }[]; labs: { id: string; title: string }[]; quizId?: string } =
    SAMPLE[slug] ?? { title: slug, lessons: [], labs: [] };
  try {
    const caller = await getServerTrpcCaller();
    const mod = await caller.module.getBySlug({ slug });
    data = {
      title: mod.title,
      lessons: mod.lessons.map((l: any) => ({ slug: l.slug, title: l.title })),
      labs: mod.labs.map((l: any) => ({ id: l.id, title: l.title })),
      quizId: (mod.quizzes?.[0]?.id as string | undefined),
    };
  } catch {}
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
<<<<<<< HEAD
              <Link className="underline" href={`/lab/${l.id}`}>{l.title}</Link>
=======
              <span>{l.title}</span>
>>>>>>> origin/image
            </li>
          ))}
          {data.labs.length === 0 && <li className="text-sm text-gray-500">No labs yet.</li>}
        </ul>
      </section>
      {data.quizId && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Module Quiz</h2>
          <Link className="inline-block mt-2 rounded bg-blue-600 px-3 py-1 text-white" href={`/quiz/${data.quizId}`}>Start Quiz</Link>
        </section>
      )}
    </main>
  );
}


