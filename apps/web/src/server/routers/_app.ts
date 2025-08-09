import { createTRPCRouter } from '@/server/trpc';
import { lessonRouter } from './lesson';
import { trackRouter } from './track';
import { moduleRouter } from './module';
import { meRouter } from './me';
import { quizRouter } from './quiz';
import { labRouter } from './lab';
import { userRouter } from './user';

export const appRouter = createTRPCRouter({
  lesson: lessonRouter,
  track: trackRouter,
  module: moduleRouter,
  me: meRouter,
  quiz: quizRouter,
  lab: labRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

