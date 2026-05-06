import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Update all organizations to correct pastor name
  const result = await prisma.organization.updateMany({
    where: {},
    data: {
      associatePastor: 'Pastor Rowland Nwosu'
    }
  });
  
  console.log(`Updated ${result.count} organizations`);
  
  const orgs = await prisma.organization.findMany({
    select: { nameEn: true, associatePastor: true }
  });
  
  console.log('\nCurrent:');
  orgs.forEach(org => {
    console.log(`  ${org.nameEn}: ${org.associatePastor}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
