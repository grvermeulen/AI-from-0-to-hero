<<<<<<< HEAD
"use client";
import { useState } from "react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">Create account</h1>
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
        Already have an account? <a className="underline" href="/api/auth/signin">Sign in</a>
      </p>
    </main>
=======
import { Suspense } from 'react';
import SignUpClient from './SignUpClient';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpClient />
    </Suspense>
>>>>>>> origin/image
  );
}


