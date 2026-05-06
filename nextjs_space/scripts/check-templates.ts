import { prisma } from '../lib/db';

async function main() {
  const templates = await prisma.ceremonyTemplate.findMany({
    where: { category: 'Weekly Programs' },
    include: { sections: { orderBy: { order: 'asc' } } }
  });
  
  console.log('Weekly Program Templates:', templates.length);
  for (const t of templates) {
    console.log(`\n=== ${t.name} (${t.templateId}) ===`);
    console.log('Variables:', t.variables);
    console.log('Sections:', t.sections.length);
    for (const s of t.sections) {
      console.log(`  ${s.order}. ${s.title} (${s.role || 'no role'})`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
