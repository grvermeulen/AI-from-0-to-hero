import { getServerTrpcCaller } from '@/server/trpcClient';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const caller = await getServerTrpcCaller();
  const weekly = await caller.leaderboard.top({ period: 'weekly', limit: 10 });
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Weekly Leaderboard</h1>
      <ol className="mt-4 grid gap-2 list-decimal pl-6">
        {weekly.map((it) => (
          <li key={it.userId} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 text-right tabular-nums">{it.rank}.</div>
              <div>{it.label}</div>
            </div>
            <div className="font-medium tabular-nums">{it.xp} XP</div>
          </li>
        ))}
        {weekly.length === 0 && <li className="text-sm text-gray-500">No data yet.</li>}
      </ol>
    </main>
  );
}


