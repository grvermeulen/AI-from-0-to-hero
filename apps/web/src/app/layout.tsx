import '../styles/globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'AI‑First QA Training Platform',
  description: 'Gamified training to upskill testers into AI‑assisted Quality Engineers',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <div className="mx-auto max-w-5xl p-4 flex items-center justify-between">
            <Link href="/" className="font-semibold">AI‑First QA</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/catalog" className="underline">Catalog</Link>
              <Link href="/profile" className="underline">Profile</Link>
              <Link href="/leaderboard" className="underline">Leaderboards</Link>
              <Link href="/login" className="underline">Login</Link>
              <Link href="/signup" className="underline">Sign up</Link>
            </nav>
          </div>
        </header>
        <div>{children}</div>
      </body>
    </html>
  );
}

