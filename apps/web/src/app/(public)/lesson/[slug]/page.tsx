type Params = { params: { slug: string } };

export default async function LessonPage({ params }: Params) {
  const { slug } = params;
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Lesson: {slug}</h1>
      <article className="prose mt-4">Lesson content placeholder.</article>
    </main>
  );
}


