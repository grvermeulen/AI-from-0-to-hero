import { getServerTrpcCaller } from '@/server/trpcClient';

type Params = { params: { id: string } };

export default async function LabPage({ params }: Params) {
  const { id } = params;
  const caller = await getServerTrpcCaller();
  try {
    const lab = await caller.lab.start({ labId: id });
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">{lab.title}</h1>
        <p className="mt-4 whitespace-pre-wrap text-gray-800">{lab.description}</p>
        <div className="mt-6 rounded border p-4">
          <h2 className="text-lg font-semibold">Submit</h2>
          <p className="text-sm text-gray-600 mt-1">Submission UI coming next (repo URL/code upload).
          For now, ensure you can access the lab endpoint.</p>
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


