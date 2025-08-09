import { createTRPCRouter } from '@/server/trpc';
import { lessonRouter } from './lesson';
import { trackRouter } from './track';

export const appRouter = createTRPCRouter({
  lesson: lessonRouter,
  track: trackRouter,
});

export type AppRouter = typeof appRouter;

