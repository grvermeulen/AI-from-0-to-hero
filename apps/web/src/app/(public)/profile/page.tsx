import { getServerTrpcCaller } from '@/server/trpcClient';

export default async function ProfilePage() {
  const caller = await getServerTrpcCaller();
  try {
    const data = await caller.me.progress();

    // Simple leveling: 100 XP per level
    const level = Math.floor((data.xpTotal ?? 0) / 100) + 1;
    const levelStart = (level - 1) * 100;
    const levelEnd = level * 100;
    const currentInLevel = Math.min(Math.max((data.xpTotal ?? 0) - levelStart, 0), 100);
    const pct = Math.round((currentInLevel / 100) * 100);

    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Your Profile</h1>

        <section className="mt-6 grid gap-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-sm text-gray-600">Level</div>
              <div className="text-2xl font-semibold">{level}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total XP</div>
              <div className="text-2xl font-semibold">{data.xpTotal}</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>{levelStart} XP</span>
              <span>{levelEnd} XP</span>
            </div>
            <div className="mt-1 h-3 w-full rounded bg-gray-200">
              <div
                className="h-3 rounded bg-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                role="progressbar"
              />
            </div>
            <div className="mt-1 text-xs text-gray-700">{currentInLevel} / 100 XP to next level</div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded border p-3">
              <div className="text-sm text-gray-600">Badges</div>
              <div className="text-xl font-semibold">{data.badgesCount}</div>
              {data.badges?.length ? (
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {data.badges.slice(0, 6).map((b: any) => (
                    <li key={b.id} className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-yellow-200 flex items-center justify-center text-xs">
                        {b.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.icon} alt={b.name} className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <span>🏅</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium leading-tight">{b.name}</div>
                        <div className="text-xs text-gray-600">{new Date(b.earnedAt).toLocaleDateString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 text-xs text-gray-500">No badges yet</div>
              )}
            </div>
            <div className="rounded border p-3">
              <div className="text-sm text-gray-600">Submissions</div>
              <div className="text-xl font-semibold">
                {data.submissions.passed + data.submissions.failed + data.submissions.pending}
              </div>
              <div className="mt-1 text-xs text-gray-600">passed {data.submissions.passed}, failed {data.submissions.failed}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-sm text-gray-600">Streak</div>
              <div className="text-xl font-semibold">{data.streakDays} days</div>
              <div className="mt-1 text-xs text-gray-600">{data.streakDays > 0 ? 'Great momentum! 🔥' : 'Keep learning to start a streak!'}</div>
            </div>
          </div>
        </section>
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

