import { getServerTrpcCaller } from '@/server/trpcClient';
import * as Sentry from '@sentry/nextjs';

export default async function LeaderboardPage() {
  let rows: Array<{ rank: number; label: string; xp: number }> = [];
  try {
    const caller = await getServerTrpcCaller();
    const data = await Sentry.startSpan({ op: 'db.query', name: 'leaderboard.top' }, async () => caller.leaderboard.top({ period: 'weekly', limit: 10 }));
    rows = data.map((r: any) => ({ rank: r.rank, label: r.label, xp: r.xp }));
  } catch {}
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Leaderboard</h1>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-1">Rank</th>
            <th className="py-1">User</th>
            <th className="py-1">XP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank} className="border-t">
              <td className="py-1">{r.rank}</td>
              <td className="py-1">{r.label}</td>
              <td className="py-1">{r.xp}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="py-2 text-gray-500">No data available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
