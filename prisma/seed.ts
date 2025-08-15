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

  // Foundation: TS Basics lesson (under Git Basics module for now)
  await db.lesson.upsert({
    where: { slug: 'ts-basics' },
    create: {
      slug: 'ts-basics',
      title: 'TypeScript Basics',
      contentMd:
        '# TS Basics\n\nLearn types, interfaces, generics, and strict mode.\n\n- Primitive and union types\n- Interfaces vs types\n- Generics for reusable utilities',
      module: { connect: { slug: 'git-basics' } },
      order: 2,
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

<<<<<<< HEAD
  // Dev test user: username/email "QA" with password "QA"
  await db.user.upsert({
    where: { email: 'QA' },
    update: {},
    create: {
      email: 'QA',
      passwordHash: hashSync('QA', 10),
      role: Role.USER,
=======
  // AI-Augmented track core module + lessons, quiz, and lab
  const aiModule = await db.module.upsert({
    where: { slug: 'ai-aug-core' },
    create: {
      slug: 'ai-aug-core',
      title: 'AI-Augmented Testing Core',
      track: { connect: { slug: 'ai-augmented' } },
      order: 1,
    },
    update: {},
  });

  await db.lesson.upsert({
    where: { slug: 'prompt-engineering' },
    create: {
      slug: 'prompt-engineering',
      title: 'Prompt Engineering for Test Design',
      contentMd:
        '# Prompt Engineering for Testing\n\nDesign prompts that produce test cases, negative paths, and boundary sets.\n\n> Always validate outputs with assertions and schemas.',
      moduleId: aiModule.id,
      order: 1,
    },
    update: {},
  });

  await db.lesson.upsert({
    where: { slug: 'readyapi-to-code' },
    create: {
      slug: 'readyapi-to-code',
      title: 'From ReadyAPI to Code',
      contentMd:
        '# ReadyAPI → Code\n\nTranslate suites into Rest-Assured tests with parity assertions.\n\n- Map requests, auth, data\n- Add negative paths',
      moduleId: aiModule.id,
      order: 2,
    },
    update: {},
  });

  await db.quiz.upsert({
    where: { id: 'seed-quiz-2' },
    create: {
      id: 'seed-quiz-2',
      moduleId: aiModule.id,
      title: 'AI-Aug Basics',
      questions: {
        create: [
          { kind: 'mc', prompt: 'What is a good strategy to avoid hallucinations?', options: '["Stricter prompts","Remove assertions"]', answer: 'Stricter prompts' },
          { kind: 'mc', prompt: 'What should always validate AI outputs?', options: '["Schemas and tests","Manual vibes"]', answer: 'Schemas and tests' },
        ],
      },
    },
    update: {},
  });

  await db.lab.upsert({
    where: { id: 'lab-ai-1' },
    create: {
      id: 'lab-ai-1',
      moduleId: aiModule.id,
      title: 'Convert ReadyAPI collection',
      description: 'Convert a ReadyAPI collection into Rest-Assured tests (happy + negative).',
      graderType: 'rubric-ai',
      maxScore: 100,
    },
    update: {},
  });

  // Dev test user: username/email "QA" with password "QA"
  await db.user.upsert({
    where: { email: 'grvermeulen@gmail.com' },
    update: {},
    create: {
      email: 'grvermeulen@gmail.com',
      passwordHash: hashSync('QA', 10),
      role: Role.LEARNER,
>>>>>>> origin/image
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

