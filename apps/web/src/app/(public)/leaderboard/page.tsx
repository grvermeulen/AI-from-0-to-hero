import { getServerTrpcCaller } from '@/server/trpcClient';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const caller = await getServerTrpcCaller();
  const [weekly, allTime] = await Promise.all([
    caller.leaderboard.top({ period: 'weekly', limit: 10 }),
    caller.leaderboard.top({ period: 'all', limit: 10 }),
  ]);
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Leaderboards</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold">Weekly</h2>
          <ol className="mt-2 divide-y rounded border">
            {weekly.map((it) => (
              <li key={it.userId} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 text-right tabular-nums">{it.rank}.</div>
                  <div>{it.label}</div>
                </div>
                <div className="font-medium tabular-nums">{it.xp} XP</div>
              </li>
            ))}
            {weekly.length === 0 && <li className="p-3 text-sm text-gray-600">No entries yet</li>}
          </ol>
        </section>
        <section>
          <h2 className="text-lg font-semibold">All‑time</h2>
          <ol className="mt-2 divide-y rounded border">
            {allTime.map((it) => (
              <li key={it.userId} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 text-right tabular-nums">{it.rank}.</div>
                  <div>{it.label}</div>
                </div>
                <div className="font-medium tabular-nums">{it.xp} XP</div>
              </li>
            ))}
            {allTime.length === 0 && <li className="p-3 text-sm text-gray-600">No entries yet</li>}
          </ol>
        </section>
      </div>
    </main>
  );
}


