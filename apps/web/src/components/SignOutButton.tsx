"use client";

import { signOut } from "next-auth/react";
import React from "react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="underline"
      aria-label="Sign out"
    >
      Sign out
    </button>
  );
}


