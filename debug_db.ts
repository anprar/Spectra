import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const exams = await db.exam.findMany({
    include: {
      trainingModule: {
        include: {
          lessons: true
        }
      },
      rules: true
    }
  });

  console.log("--- DATABASE EXAMS ---");
  for (const exam of exams) {
    console.log(`ID: ${exam.id}`);
    console.log(`Title: ${exam.title}`);
    console.log(`trainingModuleId: ${exam.trainingModuleId}`);
    console.log(`trainingModule Title: ${exam.trainingModule?.title}`);
    console.log(`trainingModule Lessons Count: ${exam.trainingModule?.lessons.length || 0}`);
    console.log(`Rules Count: ${exam.rules.length}`);
    console.log("----------------------");
  }

  const modules = await db.trainingModule.findMany();
  console.log("--- DATABASE MODULES ---");
  for (const mod of modules) {
    console.log(`ID: ${mod.id}`);
    console.log(`Title: ${mod.title}`);
    console.log(`Status: ${mod.status}`);
  }
}

main().catch(console.error).finally(() => db.$disconnect());
