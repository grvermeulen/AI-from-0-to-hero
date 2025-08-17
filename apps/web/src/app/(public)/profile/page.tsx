import { getServerTrpcCaller } from '@/server/trpcClient';

export default async function ProfilePage() {
  const caller = await getServerTrpcCaller();
  try {
    const data = await caller.me.progress();
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <div className="mt-4 grid gap-2">
          <div>XP: <span className="font-semibold">{data.xpTotal}</span></div>
          <div>Badges: <span className="font-semibold">{data.badgesCount}</span></div>
          <div>
            Submissions: <span className="font-semibold">{data.submissions.passed + data.submissions.failed + data.submissions.pending}</span>
            {' '} (passed {data.submissions.passed}, failed {data.submissions.failed})
          </div>
          {data.badges?.length ? (
            <div className="mt-2">
              <div className="font-semibold">Recent Badges</div>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {data.badges.slice(0, 3).map((b: any) => (
                  <li key={b.id}>{b.name}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.recentSubmissions?.length ? (
            <div className="mt-2">
              <div className="font-semibold">Recent Submissions</div>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {data.recentSubmissions.map((s: any) => (
                  <li key={String(s.id)}>{String(s.status)}{typeof s.score === 'number' ? ` (${s.score})` : ''}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </main>
    );
  } catch {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="mt-4 text-sm text-gray-600">Please login to view your progress.</p>
      </main>
    );
  }
}

