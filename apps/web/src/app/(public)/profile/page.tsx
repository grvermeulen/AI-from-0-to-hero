import { getServerTrpcCaller } from '@/server/trpcClient';

export default async function ProfilePage() {
  const caller = await getServerTrpcCaller();
  try {
    const data = await caller.me.progress();
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <div className="mt-4 grid gap-2">
<<<<<<< HEAD
          <div>XP: <span className="font-semibold">{data.xp}</span></div>
          <div>Badges: <span className="font-semibold">{data.badgeCount}</span></div>
          <div>Submissions: <span className="font-semibold">{data.submissionStats.total}</span> (passed {data.submissionStats.passed}, failed {data.submissionStats.failed})</div>
=======
          <div>XP: <span className="font-semibold">{data.xpTotal}</span></div>
          <div>Badges: <span className="font-semibold">{data.badgesCount}</span></div>
          <div>
            Submissions: <span className="font-semibold">{data.submissions.passed + data.submissions.failed + data.submissions.pending}</span>
            {' '} (passed {data.submissions.passed}, failed {data.submissions.failed})
          </div>
>>>>>>> origin/image
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

