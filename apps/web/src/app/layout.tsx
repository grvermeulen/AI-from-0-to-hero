import '../styles/globals.css';
import EnvBanner from './EnvBanner';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getCurrentSession } from '@/server/session';
import SignOutButton from '@/components/SignOutButton';

export const metadata = {
  title: 'AI‑First QA Training Platform',
  description: 'Gamified training to upskill testers into AI‑assisted Quality Engineers',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <EnvBanner />
          <div className="mx-auto max-w-5xl p-4 flex items-center justify-between">
            <Link href="/" className="font-semibold">AI‑First QA</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/catalog" className="underline">Catalog</Link>
              <Link href="/profile" className="underline">Profile</Link>
              <Link href="/leaderboard" className="underline">Leaderboards</Link>
              {session?.user ? (
                <>
                  <span className="text-gray-600">Logged in as {session.user.email ?? session.user.id}</span>
                  <SignOutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="underline">Login</Link>
                  <Link href="/signup" className="underline">Sign up</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <div>{children}</div>
      </body>
    </html>
  );
}

