"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const search = useSearchParams();
  const notice = useMemo(() => {
    const err = search?.get('error');
    if (!err) return null;
    switch (err) {
      case 'exists':
        return 'An account with this email already exists. Try logging in.';
      case 'missing':
        return 'Please fill in both email and password.';
      case 'invalid_email':
        return 'Email format looks invalid. Example: user@example.com';
      case 'weak_password':
        return 'Password is too short. Use at least 8 characters (mix letters, numbers, symbols recommended).';
      case 'server':
        return 'Unexpected server error during signup. Please try again.';
      default:
        return 'Invalid signup details. Please check your inputs and try again.';
    }
  }, [search]);
  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">Create account</h1>
      {notice && (
        <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{notice}</div>
      )}
      <form className="mt-4 grid gap-3" action="/api/auth/signup" method="post">
        <label className="grid gap-1">
          <span>Email or username</span>
          <input className="border p-2" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="grid gap-1">
          <span>Password</span>
          <input className="border p-2" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="bg-black text-white px-4 py-2" type="submit">Sign up</button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account? <a className="underline" href="/login">Sign in</a>
      </p>
    </main>
  );
}


