import { getServerTrpcCaller } from '@/server/trpcClient';
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
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">{data.title}</h1>
      <article className="prose mt-4" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      <PromptWidget initialPrompt={`Generate 3 Playwright API test ideas for the lesson: ${data.title}. Include one negative case.`} />
      <CommandExercise lessonSlug={slug} />
      <CodeExercise lessonSlug={slug} />
    </main>
  );
}


