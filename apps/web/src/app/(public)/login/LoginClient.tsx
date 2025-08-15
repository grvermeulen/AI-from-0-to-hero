"use client";
import { useState, useMemo } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const search = useSearchParams();

  const notice = useMemo(() => {
    if (search?.get('signup') === '1') return 'Account created. Please sign in.';
    const err = search?.get('error');
    if (!err) return null;
    switch (err) {
      case 'CredentialsSignin':
        return 'Invalid email or password.';
      case 'AccessDenied':
        return 'Access denied.';
      case 'Configuration':
        return 'Auth configuration error. Please contact support.';
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
        return 'Third‑party sign‑in failed. Please try again or use email/password.';
      case 'EmailSignin':
        return 'Email sign‑in failed. Please try again.';
      case 'SessionRequired':
        return 'Please sign in to continue.';
      default:
        return 'Sign‑in failed. Please try again.';
    }
  }, [search]);

  function validateInputs(): string | null {
    if (!email || !password) return 'Please fill in both email and password.';
    const emailValid = /.+@.+\..+/.test(email);
    if (!emailValid) return 'Email format looks invalid. Example: user@example.com';
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      const inputError = validateInputs();
      if (inputError) {
        setLocalError(inputError);
        return;
      }
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/profile',
      });
      if (res?.error) {
        setLocalError(
          res.error === 'CredentialsSignin'
            ? 'Invalid email or password.'
            : 'Sign‑in failed. Please try again.'
        );
        return;
      }
      if (res?.ok && res.url) {
        window.location.assign(res.url);
      }
    } catch (err) {
      setLocalError('Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">Login</h1>
      {notice && <div className="mt-3 rounded border p-3 text-sm">{notice}</div>}
      {localError && <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{localError}</div>}
      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <label className="grid gap-1">
          <span>Email</span>
          <input className="border p-2" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span>Password</span>
          <input className="border p-2" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="bg-black text-white px-4 py-2 disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="mt-4 text-sm">No account? <a className="underline" href="/signup">Sign up</a></p>
    </main>
  );
}


