type Params = { params: { slug: string } };

const SAMPLE_LESSONS: Record<string, { title: string; contentMd: string }> = {
  'intro-to-git': { title: 'Intro to Git', contentMd: '# Git Basics\n\nLearn init/add/commit.' },
  'ts-basics': { title: 'TypeScript Basics', contentMd: '# TS Basics\n\nTypes, interfaces, generics.' },
};

export default async function LessonPage({ params }: Params) {
  const { slug } = params;
  const data = SAMPLE_LESSONS[slug] ?? { title: slug, contentMd: 'Content coming soon.' };
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">{data.title}</h1>
      <article className="prose mt-4 whitespace-pre-wrap">{data.contentMd}</article>
    </main>
  );
}


