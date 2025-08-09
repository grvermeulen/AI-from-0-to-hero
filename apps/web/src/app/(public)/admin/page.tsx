import { getSession } from '@/server/auth';

export default async function AdminPage() {
  const session = await getSession();
  const role = (session?.user as any)?.role;
  if (role !== 'ADMIN' && role !== 'STAFF') {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p className="mt-2">You do not have access to this page.</p>
      </main>
    );
  }
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-2">Welcome, {(session?.user as any)?.email}</p>
    </main>
  );
}

