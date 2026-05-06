import { prisma } from '../lib/db';

async function main() {
  const programs = await prisma.program.findMany({
    include: { items: { include: { hymnPair: true } } },
    orderBy: { date: 'desc' },
    take: 5
  });
  console.log('Found programs:', programs.length);
  for (const p of programs) {
    console.log(`\n--- Program: ${p.date.toISOString().split('T')[0]} (${p.type}) ---`);
    console.log(`Items: ${p.items.length}`);
    for (const item of p.items.slice(0, 5)) {
      console.log(`  - ${item.sectionKey}: textEn="${item.textEn}" textEs="${item.textEs}" person="${item.personName}" hymn=${item.hymnPairId}`);
    }
    if (p.items.length > 5) console.log(`  ... and ${p.items.length - 5} more items`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
