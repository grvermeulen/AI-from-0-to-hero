import { getServerTrpcCaller } from '@/server/trpcClient';
import { redirect } from 'next/navigation';
import SubmitButton from '@/components/SubmitButton';
import QuizQuestions from '@/components/QuizQuestions';

type Params = { params: { id: string } };

type SearchParams = { searchParams?: { score?: string; passed?: string; error?: string } };

export default async function QuizPage({ params, searchParams }: Params & SearchParams) {
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
      const q = new URLSearchParams({ score: String(res.score ?? ''), passed: res.status === 'PASSED' ? '1' : '0' });
      redirect(`/quiz/${id}?${q.toString()}`);
    } catch (e) {
      redirect(`/quiz/${id}?error=1`);
    }
  }

  try {
    const quiz = await caller.quiz.start({ quizId: id });
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <p className="mt-1 text-sm text-gray-600">Answer all questions and click Submit. You’ll see a pass/fail banner with your score.</p>
        {searchParams?.score !== undefined && (
          <div className="mt-3 rounded border p-3 text-sm">
            <div>Score: <span className="font-semibold">{searchParams.score}</span></div>
            <div>Status: {searchParams.passed === '1' ? <span className="text-green-700 font-semibold">Passed</span> : <span className="text-red-700 font-semibold">Failed</span>}</div>
          </div>
        )}
        {searchParams?.error && (
          <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">Submission failed. Please login and try again.</div>
        )}
        <form action={submit} className="mt-4">
          <QuizQuestions quizId={id} questions={quiz.questions as any} />
          <SubmitButton>Submit</SubmitButton>
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


