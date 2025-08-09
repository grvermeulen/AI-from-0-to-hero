import { getServerTrpcCaller } from '@/server/trpcClient';

type Params = { params: { id: string } };

export default async function QuizPage({ params }: Params) {
  const { id } = params;
  const caller = await getServerTrpcCaller();

  try {
    const quiz = await caller.quiz.start({ quizId: id });
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <ol className="mt-4 grid gap-4 list-decimal pl-6">
          {quiz.questions.map((q: any) => (
            <li key={q.id}>
              <div className="font-semibold">{q.prompt}</div>
              {q.options && (
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {(JSON.parse(q.options) as string[]).map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-gray-600">Submission UI coming next (client form + submit).</p>
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


