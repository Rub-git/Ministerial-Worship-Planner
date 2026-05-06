import { prisma } from '../lib/db';

async function main() {
  const user = await prisma.user.update({
    where: { email: 'Rubiesfamily@gmail.com' },
    data: { role: 'ADMIN' }
  });
  console.log('User promoted to ADMIN:', user.email);
  console.log('New role:', user.role);
}
main().catch(console.error).finally(() => prisma.$disconnect());
