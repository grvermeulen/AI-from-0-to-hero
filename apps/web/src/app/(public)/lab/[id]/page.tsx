import { getServerTrpcCaller } from '@/server/trpcClient';
import { redirect } from 'next/navigation';

type Params = { params: { id: string } };
type SearchParams = { searchParams?: { submissionId?: string; error?: string } };

export default async function LabPage({ params, searchParams }: Params & SearchParams) {
  const { id } = params;
  const caller = await getServerTrpcCaller();
  async function submit(formData: FormData) {
    'use server';
    const repoUrl = String(formData.get('repoUrl') || '');
    const code = String(formData.get('code') || '');
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
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">{lab.title}</h1>
        {searchParams?.submissionId && (
          <div className="mt-3 rounded border p-3 text-sm">
            <div>Submission: <span className="font-mono">{searchParams.submissionId}</span></div>
            <div>Status: <span className="font-semibold">Pending</span></div>
          </div>
        )}
        {searchParams?.error && (
          <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">Submission failed. Please login and try again.</div>
        )}
        <p className="mt-4 whitespace-pre-wrap text-gray-800">{lab.description}</p>
        <form action={submit} className="mt-6 rounded border p-4 grid gap-3">
          <h2 className="text-lg font-semibold">Submit</h2>
          <label className="grid gap-1">
            <span className="text-sm">Repository URL</span>
            <input name="repoUrl" type="url" placeholder="https://github.com/you/repo" className="border rounded px-2 py-1" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Or paste code</span>
            <textarea name="code" rows={6} className="border rounded px-2 py-1" />
          </label>
          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-white w-max">Submit</button>
        </form>
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


