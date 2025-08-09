import { createTRPCRouter } from '@/server/trpc';
import { lessonRouter } from './lesson';

export const appRouter = createTRPCRouter({
  lesson: lessonRouter,
});

export type AppRouter = typeof appRouter;

