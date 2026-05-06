import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Update all organizations with the wrong pastor name
  const result = await prisma.organization.updateMany({
    where: {
      associatePastor: {
        contains: 'Rowland'
      }
    },
    data: {
      associatePastor: 'Pastor Roland Nwosu'
    }
  });
  
  console.log(`Updated ${result.count} organizations`);
  
  // Also check and show current values
  const orgs = await prisma.organization.findMany({
    select: {
      nameEn: true,
      seniorPastor: true,
      associatePastor: true
    }
  });
  
  console.log('\nCurrent organization data:');
  orgs.forEach(org => {
    console.log(`  ${org.nameEn}:`);
    console.log(`    Senior Pastor: ${org.seniorPastor}`);
    console.log(`    Associate Pastor: ${org.associatePastor}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
