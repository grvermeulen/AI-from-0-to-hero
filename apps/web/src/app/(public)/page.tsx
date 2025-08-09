export default function HomePage() {
  return (
    <main className="min-h-dvh grid place-items-center p-10">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold">AI‑First QA Training Platform</h1>
        <p className="mt-4 text-muted-foreground">
          Gamified online training to upskill testers into AI‑assisted Quality Engineers.
        </p>
        <nav className="mt-8 grid gap-2 justify-center">
          <a className="underline" href="/catalog">Browse tracks</a>
          <a className="underline" href="/profile">My profile</a>
        </nav>
      </div>
    </main>
  );
}

