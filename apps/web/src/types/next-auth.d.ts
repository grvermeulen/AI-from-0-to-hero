import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    role?: 'ADMIN' | 'STAFF' | 'LEARNER';
  }
  interface Session {
    user?: {
      id: string;
      email?: string | null;
      name?: string | null;
      role?: 'ADMIN' | 'STAFF' | 'LEARNER';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'ADMIN' | 'STAFF' | 'LEARNER';
  }
}


