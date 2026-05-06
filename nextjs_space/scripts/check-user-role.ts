import { prisma } from '../lib/db';

async function main() {
  // Find Rubiesfamily user
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'Rubies', mode: 'insensitive' } },
    include: { organization: true }
  });
  if (user) {
    console.log('User:', user.email);
    console.log('Role:', user.role);
    console.log('Organization:', user.organization?.nameEn);
    console.log('Org Status:', user.organization?.subscriptionStatus);
  } else {
    console.log('User not found');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
