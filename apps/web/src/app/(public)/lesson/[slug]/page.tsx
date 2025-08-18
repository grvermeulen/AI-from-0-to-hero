import { remark } from 'remark';
import html from 'remark-html';
import PromptWidget from '@/components/PromptWidget';
import { CommandExercise, CodeExercise } from '@/components/Exercise';

type Params = { params: { slug: string } };

const SAMPLE_LESSONS: Record<string, { title: string; contentMd: string }> = {
  'intro-to-git': { title: 'Intro to Git', contentMd: '# Git Basics\n\nLearn init/add/commit.' },
  'ts-basics': { title: 'TypeScript Basics', contentMd: '# TS Basics\n\nTypes, interfaces, generics.' },
};

export default async function LessonPage({ params }: Params) {
  const { slug } = params;
  let data = SAMPLE_LESSONS[slug] ?? { title: slug, contentMd: 'Content coming soon.' };
  try {
    const caller = await getServerTrpcCaller();
    const lesson = await caller.lesson.get({ slug });
    data = { title: lesson.title, contentMd: lesson.contentMd };
  } catch {}
  const processed = await remark().use(html).process(data.contentMd);
  const contentHtml = processed.toString();
  let attempts: Array<{ id: string; createdAt: string; status: string; score: number | null; feedback: string | null }> = [] as any;
  try {
    const caller = await getServerTrpcCaller();
    attempts = await caller.lesson.attempts({ slug, take: 5 });
  } catch {}
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">{data.title}</h1>
      <article className="prose mt-4" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      <PromptWidget initialPrompt={`Generate 3 Playwright API test ideas for the lesson: ${data.title}. Include one negative case.`} />
      <CommandExercise lessonSlug={slug} />
      <CodeExercise lessonSlug={slug} />
      <section className="mt-6 rounded border p-4">
        <h3 className="text-base font-semibold">Recent Attempts</h3>
        {attempts.length ? (
          <ul className="mt-2 grid gap-2 text-sm">
            {attempts.map((a) => (
              <li key={a.id} className="rounded border p-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-gray-600">{new Date(a.createdAt).toLocaleString()}</span>
                  <span className={`font-semibold ${a.status === 'PASSED' ? 'text-green-700' : a.status === 'FAILED' ? 'text-red-700' : 'text-gray-700'}`}>{a.status}{typeof a.score === 'number' ? ` (${a.score})` : ''}</span>
                </div>
                {a.feedback ? <div className="mt-1 text-gray-800 whitespace-pre-wrap">{a.feedback}</div> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-600">No attempts yet. Submit an exercise above to see history.</p>
        )}
      </section>
    </main>
  );
}


