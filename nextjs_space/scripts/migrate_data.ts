import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check current languageMode values
  const programs: any[] = await prisma.$queryRaw`SELECT id, "languageMode" FROM programs`;
  console.log('Current programs:', programs);
  
  // Update EN_ONLY to EN, ES_ONLY to ES
  await prisma.$executeRaw`UPDATE programs SET "languageMode" = 'EN' WHERE "languageMode" = 'EN_ONLY'`;
  await prisma.$executeRaw`UPDATE programs SET "languageMode" = 'ES' WHERE "languageMode" = 'ES_ONLY'`;
  
  console.log('Updated language modes');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
