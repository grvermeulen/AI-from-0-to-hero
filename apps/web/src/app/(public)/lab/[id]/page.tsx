import { getServerTrpcCaller } from '@/server/trpcClient';
import { redirect } from 'next/navigation';
import SubmitButton from '@/components/SubmitButton';
import PromptWidget from '@/components/PromptWidget';

type Params = { params: { id: string } };

type SearchParams = { searchParams?: { submissionId?: string; error?: string } };

export default async function LabPage({ params, searchParams }: Params & SearchParams) {
  const { id } = params;
  const caller = await getServerTrpcCaller();
  async function submit(formData: FormData) {
    'use server';
    const repoUrl = String(formData.get('repoUrl') || '');
    const code = String(formData.get('code') || '');
    if (!repoUrl && !code) {
      redirect(`/lab/${id}?error=missing`);
    }
    const c = await getServerTrpcCaller();
    try {
      const res = await c.lab.submit({ labId: id, repoUrl: repoUrl || undefined, code: code || undefined });
      const q = new URLSearchParams({ submissionId: res.id });
      redirect(`/lab/${id}?${q.toString()}`);
    } catch (e) {
      redirect(`/lab/${id}?error=1`);
    }
  }

  try {
    const lab = await caller.lab.start({ labId: id });
    return (
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-bold">{lab.title}</h1>
        <p className="mt-1 text-sm text-gray-600">Submit a repo URL or paste code. You’ll get a submission id and status.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="lab-instructions" className="rounded border p-4">
            <h2 id="lab-instructions" className="text-lg font-semibold">Instructions</h2>
            <p className="mt-2 whitespace-pre-wrap text-gray-800">{lab.description}</p>
            <div className="mt-6">
              <PromptWidget initialPrompt={`Suggest test assertions for lab: ${lab.title}. Include status, schema, and negative paths.`} />
            </div>
          </section>

          <section aria-labelledby="lab-submit" className="rounded border p-4">
            <h2 id="lab-submit" className="text-lg font-semibold">Submit</h2>
            {searchParams?.submissionId && (
              <div aria-live="polite" className="mt-3 rounded border p-3 text-sm">
                <div>Submission: <span className="font-mono">{searchParams.submissionId}</span></div>
                <div>Status: <span className="font-semibold">Pending</span></div>
              </div>
            )}
            {searchParams?.error && (
              <div aria-live="polite" className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                {searchParams.error === 'missing' ? 'Please provide a repo URL or paste code.' : 'Submission failed. Please login and try again.'}
              </div>
            )}

            <form action={submit} className="mt-4 grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm">Repository URL</span>
                <input name="repoUrl" type="url" placeholder="https://github.com/you/repo" className="border rounded px-2 py-1" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Or paste code</span>
                <textarea name="code" rows={8} className="border rounded px-2 py-1 font-mono" />
              </label>
              <SubmitButton>Submit</SubmitButton>
            </form>
          </section>
        </div>
      </main>
    );
  } catch {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Lab</h1>
        <p className="mt-4 text-sm text-gray-600">Please login to access the lab runner.</p>
      </main>
    );
  }
}


