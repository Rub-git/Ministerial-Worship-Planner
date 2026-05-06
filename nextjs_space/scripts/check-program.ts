import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const program = await prisma.program.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });
  
  if (program) {
    console.log('Program ID:', program.id);
    console.log('Cover Image URL:', program.coverImageUrl);
    console.log('Items count:', program.items.length);
    console.log('\nAll items:');
    program.items.forEach(item => {
      console.log(`  ${item.sectionKey}: personName="${item.personName}", hymnPairId=${item.hymnPairId}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
