import { createTRPCRouter } from '@/server/trpc';
import { lessonRouter } from './lesson';
import { trackRouter } from './track';
import { moduleRouter } from './module';
import { meRouter } from './me';
import { quizRouter } from './quiz';
import { labRouter } from './lab';
import { userRouter } from './user';
import { leaderboardRouter } from './leaderboard';

export const appRouter = createTRPCRouter({
  lesson: lessonRouter,
  track: trackRouter,
  module: moduleRouter,
  me: meRouter,
  quiz: quizRouter,
  lab: labRouter,
  user: userRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;

