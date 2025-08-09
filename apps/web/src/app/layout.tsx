import '../styles/globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'AI‑First QA Training Platform',
  description: 'Gamified training to upskill testers into AI‑assisted Quality Engineers',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

