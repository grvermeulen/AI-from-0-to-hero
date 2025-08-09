type Params = { params: { slug: string } };

export default async function ModulePage({ params }: Params) {
  const { slug } = params;
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Module: {slug}</h1>
      <p className="mt-2">Lessons and labs will appear here.</p>
    </main>
  );
}


