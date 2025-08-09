import { PrismaClient, TrackPhase } from '@prisma/client';

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

  await db.track.upsert({
    where: { slug: 'ai-augmented' },
    create: { slug: 'ai-augmented', name: 'AI‑Augmented Testing', phase: TrackPhase.AI_AUGMENTED, order: 2 },
    update: {},
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

