import { PrismaClient, TrackPhase, Role } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const foundation = await db.track.upsert({
    where: { slug: 'foundation' },
    create: { slug: 'foundation', name: 'Foundation', phase: TrackPhase.FOUNDATION, order: 1 },
    update: {},
  });

  await db.module.upsert({
    where: { slug: 'git-basics' },
    create: {
      slug: 'git-basics',
      title: 'Git Basics',
      trackId: foundation.id,
      order: 1,
    },
    update: {},
  });

  const introLesson = await db.lesson.upsert({
    where: { slug: 'intro-to-git' },
    create: {
      slug: 'intro-to-git',
      title: 'Intro to Git',
      contentMd: '# Git Basics',
      module: { connect: { slug: 'git-basics' } },
      order: 1,
    },
    update: {},
  });

  const quiz = await db.quiz.upsert({
    where: { id: 'seed-quiz-1' },
    create: {
      id: 'seed-quiz-1',
      module: { connect: { slug: 'git-basics' } },
      title: 'Git Quiz 1',
      questions: {
        create: [
          { kind: 'mc', prompt: 'What does git add do?', options: '["stage changes","commit changes"]', answer: 'stage changes' },
          { kind: 'mc', prompt: 'What command creates a commit?', options: '["git push","git commit"]', answer: 'git commit' },
        ],
      },
    },
    update: {},
  });

  await db.lab.upsert({
    where: { id: 'seed-lab-1' },
    create: {
      id: 'seed-lab-1',
      module: { connect: { slug: 'git-basics' } },
      title: 'Initialize a Repo',
      description: 'Create a repo, add a file, commit, and push.',
      graderType: 'rubric-ai',
      maxScore: 100,
    },
    update: {},
  });

  await db.track.upsert({
    where: { slug: 'ai-augmented' },
    create: { slug: 'ai-augmented', name: 'AI‑Augmented Testing', phase: TrackPhase.AI_AUGMENTED, order: 2 },
    update: {},
  });

  // Dev test user: username/email "QA" with password "QA"
  await db.user.upsert({
    where: { email: 'QA' },
    update: {},
    create: {
      email: 'QA',
      passwordHash: hashSync('QA', 10),
      role: Role.USER,
    },
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

