import { getServerTrpcCaller } from '@/server/trpcClient';

export default async function ProfilePage() {
  const caller = await getServerTrpcCaller();
  try {
    const data = await caller.me.progress();
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="grid gap-2">
              <div>XP: <span className="font-semibold">{data.xpTotal}</span></div>
              <div>Badges: <span className="font-semibold">{data.badgesCount}</span></div>
              <div>
                Submissions: <span className="font-semibold">{data.submissions.passed + data.submissions.failed + data.submissions.pending}</span>
                {' '} (passed {data.submissions.passed}, failed {data.submissions.failed})
              </div>
              {data.badges?.length ? (
                <div className="mt-2">
                  <div className="font-semibold">Recent Badges</div>
                  <ul className="flex flex-wrap gap-3 items-center text-sm text-gray-700">
                    {data.badges.slice(0, 5).map((b: { id: string; name: string; icon?: string | null }) => (
                      <li key={b.id} className="flex items-center gap-2 border rounded-md px-2 py-1">
                        <span aria-hidden="true" className="text-lg leading-none">{b.icon ?? '🏆'}</span>
                        <span className="whitespace-nowrap">{b.name}</span>
                      </li>
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
          </section>

          <aside>
            <div className="grid gap-6">
              <section>
                <div className="font-semibold">Your Badges</div>
                {data.badgesEarned?.length ? (
                  <ul className="mt-2 grid gap-2">
                    {data.badgesEarned.map((b: { id: string; name: string; icon?: string | null; percentUsers?: number }) => (
                      <li key={b.id} className="flex items-center justify-between rounded-md border px-2 py-1 text-sm">
                        <span className="flex items-center gap-2"><span aria-hidden className="text-lg">{b.icon ?? '🏆'}</span>{b.name}</span>
                        {typeof b.percentUsers === 'number' ? <span className="text-gray-500">{b.percentUsers}%</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">No badges yet. Start a lesson or quiz to earn one!</p>
                )}
              </section>

              <section>
                <div className="font-semibold">Available Badges</div>
                {data.badgesAvailable?.length ? (
                  <ul className="mt-2 grid gap-2">
                    {data.badgesAvailable.map((b: { id: string; name: string; icon?: string | null; percentUsers?: number }) => (
                      <li key={b.id} className="flex items-center justify-between rounded-md border px-2 py-1 text-sm">
                        <span className="flex items-center gap-2"><span aria-hidden className="text-lg">{b.icon ?? '🏆'}</span>{b.name}</span>
                        {typeof b.percentUsers === 'number' ? <span title="Percentage of users with this badge" className="text-gray-500">{b.percentUsers}%</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">All badges earned — great job!</p>
                )}
              </section>
            </div>
          </aside>
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

