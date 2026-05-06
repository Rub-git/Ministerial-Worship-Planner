import { prisma } from '../lib/db';

async function main() {
  const org = await prisma.organization.findFirst({
    include: { users: true }
  });
  if (org) {
    console.log('Organization:', org.nameEn);
    console.log('Status:', org.subscriptionStatus);
    console.log('Trial End Date:', org.trialEndDate);
    console.log('Users:', org.users.map(u => ({ email: u.email, role: u.role, emailVerified: u.emailVerified })));
  } else {
    console.log('No organization found');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
