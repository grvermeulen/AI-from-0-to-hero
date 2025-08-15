import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
<<<<<<< HEAD
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">Login</h1>
      <form className="mt-4 grid gap-3" action="/api/auth/callback/credentials" method="post">
        <input type="hidden" name="csrfToken" />
        <label className="grid gap-1">
          <span>Email</span>
          <input className="border p-2" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span>Password</span>
          <input className="border p-2" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="bg-black text-white px-4 py-2" type="submit">Sign in</button>
      </form>
      <p className="mt-4 text-sm">No account? <a className="underline" href="/signup">Sign up</a></p>
    </main>
=======
    <Suspense>
      <LoginClient />
    </Suspense>
>>>>>>> origin/image
  );
}

