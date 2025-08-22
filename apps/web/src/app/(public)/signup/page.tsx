import { Suspense } from 'react';
import { cookies } from 'next/headers';
import SignUpClient from './SignUpClient';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const c = cookies();
  const token = Math.random().toString(36).slice(2);
  c.set('csrf', token, { httpOnly: false, sameSite: 'lax', path: '/' });
  return (
    <Suspense>
      {/* Hidden meta for client to include as header automatically if needed */}
      <meta name="csrf-token" content={token} />
      <SignUpClient />
    </Suspense>
  );
}


