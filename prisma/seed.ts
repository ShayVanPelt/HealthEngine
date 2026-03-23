import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: { email: 'test@example.com' },
  });

  console.log(`User: ${user.email} (${user.id})`);

  // Seed workouts skipped — requires Exercise rows first

  // Seed calorie entries
  await prisma.calorieEntry.createMany({
    data: [
      { userId: user.id, calories: 2200, protein: 150, carbs: 250, fat: 70 },
      { userId: user.id, calories: 1950, protein: 130, carbs: 220, fat: 65 },
      { userId: user.id, calories: 2400, protein: 160, carbs: 280, fat: 80 },
    ],
  });

  // Seed weight entries
  await prisma.weightEntry.createMany({
    data: [
      { userId: user.id, weight: 81.2, bodyFat: 19.0 },
      { userId: user.id, weight: 80.8, bodyFat: 18.7 },
      { userId: user.id, weight: 80.5, bodyFat: 18.5 },
      { userId: user.id, weight: 80.1, bodyFat: 18.2 },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
