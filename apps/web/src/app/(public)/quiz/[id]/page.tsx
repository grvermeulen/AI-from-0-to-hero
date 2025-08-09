import { getServerTrpcCaller } from '@/server/trpcClient';
import { revalidatePath } from 'next/cache';

type Params = { params: { id: string } };

export default async function QuizPage({ params }: Params) {
  const { id } = params;
  const caller = await getServerTrpcCaller();

  async function submit(formData: FormData) {
    'use server';
    const answers: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('q_')) answers[key.slice(2)] = String(value);
    }
    const c = await getServerTrpcCaller();
    try {
      const res = await c.quiz.submit({ quizId: id, answers });
      revalidatePath(`/quiz/${id}`);
      return { ok: true, res };
    } catch (e) {
      return { ok: false };
    }
  }

  try {
    const quiz = await caller.quiz.start({ quizId: id });
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <form action={submit} className="mt-4">
          <ol className="grid gap-4 list-decimal pl-6">
          {quiz.questions.map((q: any) => (
            <li key={q.id}>
              <div className="font-semibold">{q.prompt}</div>
              {q.options && (
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {(JSON.parse(q.options) as string[]).map((opt, i) => (
                    <li key={i}>
                      <label className="inline-flex items-center gap-2">
                        <input type="radio" name={`q_${q.id}`} value={opt} required />
                        <span>{opt}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          </ol>
          <button type="submit" className="mt-6 rounded bg-blue-600 px-3 py-1 text-white">Submit</button>
        </form>
      </main>
    );
  } catch {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Quiz</h1>
        <p className="mt-4 text-sm text-gray-600">Please login to start the quiz.</p>
      </main>
    );
  }
}


