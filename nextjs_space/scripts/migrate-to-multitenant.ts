/**
 * Migration Script: Convert single-tenant to multi-tenant architecture
 * 
 * This script:
 * 1. Adds slug to existing organization
 * 2. Associates all programs with the default organization
 * 3. Associates all sermon series with the default organization
 * 4. Sets default subscription status
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting multi-tenant migration...');
  
  // Step 1: Get or create the default organization ID
  const defaultOrgId = 'adelanto-church-001';
  
  // Step 2: Update organization with new required fields using raw SQL
  console.log('\n📝 Step 1: Adding slug to organization...');
  try {
    await prisma.$executeRaw`
      UPDATE organizations 
      SET slug = 'adelanto-bilingual-sda'
      WHERE id = ${defaultOrgId}
      AND (slug IS NULL OR slug = '')
    `;
    console.log('✓ Organization slug updated');
  } catch (e) {
    console.log('Note: slug column may not exist yet or already set');
  }
  
  // Step 3: Add subscription fields using raw SQL
  console.log('\n📝 Step 2: Setting subscription status...');
  try {
    await prisma.$executeRaw`
      UPDATE organizations 
      SET 
        subscription_status = 'ACTIVE',
        plan_tier = 'pro',
        denomination = 'Seventh-day Adventist',
        primary_language = 'both'
      WHERE id = ${defaultOrgId}
    `;
    console.log('✓ Subscription fields updated');
  } catch (e) {
    console.log('Note: subscription columns may not exist yet:', e);
  }
  
  // Step 4: Associate all programs with default org
  console.log('\n📝 Step 3: Associating programs with organization...');
  const programsUpdated = await prisma.$executeRaw`
    UPDATE programs 
    SET organization_id = ${defaultOrgId}
    WHERE organization_id IS NULL
  `;
  console.log(`✓ ${programsUpdated} programs associated with organization`);
  
  // Step 5: Associate all sermon series with default org
  console.log('\n📝 Step 4: Associating sermon series with organization...');
  const seriesUpdated = await prisma.$executeRaw`
    UPDATE sermon_series 
    SET organization_id = ${defaultOrgId}
    WHERE organization_id IS NULL
  `;
  console.log(`✓ ${seriesUpdated} sermon series associated with organization`);
  
  // Step 6: Associate all ceremony programs with default org
  console.log('\n📝 Step 5: Associating ceremony programs with organization...');
  try {
    const ceremonyUpdated = await prisma.$executeRaw`
      UPDATE ceremony_programs 
      SET organization_id = ${defaultOrgId}
      WHERE organization_id IS NULL
    `;
    console.log(`✓ ${ceremonyUpdated} ceremony programs associated with organization`);
  } catch (e) {
    console.log('Note: ceremony_programs table may not exist yet');
  }
  
  // Step 7: Ensure all users have organization or are SUPER_ADMIN
  console.log('\n📝 Step 6: Verifying user organization assignments...');
  const usersUpdated = await prisma.$executeRaw`
    UPDATE "User" 
    SET organization_id = ${defaultOrgId}
    WHERE organization_id IS NULL AND role != 'SUPER_ADMIN'
  `;
  console.log(`✓ ${usersUpdated} users associated with organization`);
  
  // Step 8: Add is_active field to users if not exists
  console.log('\n📝 Step 7: Setting user active status...');
  try {
    await prisma.$executeRaw`
      UPDATE "User" 
      SET is_active = true
      WHERE is_active IS NULL
    `;
    console.log('✓ User active status set');
  } catch (e) {
    console.log('Note: is_active column may not exist yet');
  }
  
  console.log('\n✅ Multi-tenant migration completed!');
  console.log('\nNext steps:');
  console.log('1. Run: yarn prisma db push');
  console.log('2. Run: yarn prisma generate');
  console.log('3. Run: yarn tsx --require dotenv/config scripts/seed.ts');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
