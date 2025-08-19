export default function HomePage() {
  return (
    <main className="min-h-dvh grid place-items-center p-10">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl font-bold">AI‑First QA Training Platform</h1>
        <p className="mt-4 text-muted-foreground">
          Gamified online training to upskill testers into AI‑assisted Quality Engineers.
        </p>
        <nav className="mt-8 grid gap-2 justify-center">
          <a className="underline" href="/catalog">Browse tracks</a>
          <a className="underline" href="/profile">My profile</a>
          <a className="underline" href="/login">Login</a>
        </nav>
        <section aria-labelledby="tracks-preview" className="mt-10 text-left">
          <h2 id="tracks-preview" className="text-xl font-semibold text-center">Tracks Preview</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="rounded border p-4">
              <div className="font-semibold">Foundation</div>
              <p className="text-sm text-gray-600">Git, TypeScript, Unit Testing, HTTP & APIs.</p>
            </li>
            <li className="rounded border p-4">
              <div className="font-semibold">AI‑Augmented Testing</div>
              <p className="text-sm text-gray-600">Prompt engineering, ReadyAPI → Code, AI feedback.</p>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}

