export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function dbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

// Explicit flag to enable offline development without a DB or login
// Set OFFLINE_MODE=1 in apps/web/.env.local to enable
export function offlineMode(): boolean {
  return !isProduction() && process.env.OFFLINE_MODE === '1';
}


