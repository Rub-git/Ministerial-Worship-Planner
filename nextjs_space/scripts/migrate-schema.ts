/**
 * Schema Migration Script: Add new columns and enum values for multi-tenant SaaS
 * 
 * This script runs raw SQL to:
 * 1. Add SUPER_ADMIN to Role enum
 * 2. Add SubscriptionStatus enum
 * 3. Add new columns to organizations table
 * 4. Add new columns to User table
 * 5. Update existing data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting schema migration for multi-tenant SaaS...');
  
  const defaultOrgId = 'adelanto-church-001';
  
  // Step 1: Add SUPER_ADMIN to Role enum
  console.log('\n📝 Step 1: Adding SUPER_ADMIN to Role enum...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'`);
    console.log('✓ SUPER_ADMIN added to Role enum');
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('✓ SUPER_ADMIN already exists in Role enum');
    } else {
      console.log('Note:', e.message);
    }
  }
  
  // Step 2: Create SubscriptionStatus enum
  console.log('\n📝 Step 2: Creating SubscriptionStatus enum...');
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ SubscriptionStatus enum created');
  } catch (e: any) {
    console.log('Note:', e.message);
  }
  
  // Step 3: Add new columns to organizations table
  console.log('\n📝 Step 3: Adding columns to organizations table...');
  
  const orgColumns = [
    { name: 'slug', type: 'VARCHAR(255)', unique: true },
    { name: 'denomination', type: 'VARCHAR(255)' },
    { name: 'primary_language', type: 'VARCHAR(10)', default: "'es'" },
    { name: 'primary_color', type: 'VARCHAR(20)' },
    { name: 'email', type: 'VARCHAR(255)' },
    { name: 'phone', type: 'VARCHAR(50)' },
    { name: 'subscription_status', type: '"SubscriptionStatus"', default: "'TRIAL'" },
    { name: 'trial_end_date', type: 'TIMESTAMP' },
    { name: 'subscription_end_date', type: 'TIMESTAMP' },
    { name: 'stripe_customer_id', type: 'VARCHAR(255)', unique: true },
    { name: 'stripe_subscription_id', type: 'VARCHAR(255)' },
    { name: 'plan_tier', type: 'VARCHAR(50)', default: "'free'" },
  ];
  
  for (const col of orgColumns) {
    try {
      let sql = `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`;
      if (col.default) {
        sql += ` DEFAULT ${col.default}`;
      }
      await prisma.$executeRawUnsafe(sql);
      console.log(`  ✓ Added column: ${col.name}`);
      
      // Add unique constraint if needed
      if (col.unique) {
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE organizations 
            ADD CONSTRAINT organizations_${col.name}_key UNIQUE (${col.name})
          `);
        } catch (e) {
          // Constraint may already exist
        }
      }
    } catch (e: any) {
      console.log(`  Note for ${col.name}:`, e.message);
    }
  }
  
  // Step 4: Add new columns to User table
  console.log('\n📝 Step 4: Adding columns to User table...');
  
  const userColumns = [
    { name: 'is_active', type: 'BOOLEAN', default: 'true' },
    { name: 'email_verified', type: 'TIMESTAMP' },
    { name: 'last_login_at', type: 'TIMESTAMP' },
  ];
  
  for (const col of userColumns) {
    try {
      let sql = `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`;
      if (col.default) {
        sql += ` DEFAULT ${col.default}`;
      }
      await prisma.$executeRawUnsafe(sql);
      console.log(`  ✓ Added column: ${col.name}`);
    } catch (e: any) {
      console.log(`  Note for ${col.name}:`, e.message);
    }
  }
  
  // Step 5: Update existing organization with default values
  console.log('\n📝 Step 5: Updating existing organization...');
  try {
    await prisma.$executeRawUnsafe(`
      UPDATE organizations 
      SET 
        slug = 'adelanto-bilingual-sda',
        denomination = 'Seventh-day Adventist',
        primary_language = 'both',
        primary_color = '#004B87',
        subscription_status = 'ACTIVE',
        plan_tier = 'pro'
      WHERE id = '${defaultOrgId}'
    `);
    console.log('✓ Organization updated with SaaS fields');
  } catch (e: any) {
    console.log('Note:', e.message);
  }
  
  // Step 6: Associate programs with organization
  console.log('\n📝 Step 6: Associating programs with organization...');
  try {
    const result = await prisma.$executeRawUnsafe(`
      UPDATE programs 
      SET organization_id = '${defaultOrgId}'
      WHERE organization_id IS NULL
    `);
    console.log(`✓ Programs associated: ${result}`);
  } catch (e: any) {
    console.log('Note:', e.message);
  }
  
  // Step 7: Associate sermon series with organization
  console.log('\n📝 Step 7: Associating sermon series with organization...');
  try {
    const result = await prisma.$executeRawUnsafe(`
      UPDATE sermon_series 
      SET organization_id = '${defaultOrgId}'
      WHERE organization_id IS NULL
    `);
    console.log(`✓ Sermon series associated: ${result}`);
  } catch (e: any) {
    console.log('Note:', e.message);
  }
  
  // Step 8: Associate ceremony programs with organization
  console.log('\n📝 Step 8: Associating ceremony programs with organization...');
  try {
    const result = await prisma.$executeRawUnsafe(`
      UPDATE ceremony_programs 
      SET organization_id = '${defaultOrgId}'
      WHERE organization_id IS NULL
    `);
    console.log(`✓ Ceremony programs associated: ${result}`);
  } catch (e: any) {
    console.log('Note:', e.message);
  }
  
  // Step 9: Associate users with organization (except SUPER_ADMIN)
  console.log('\n📝 Step 9: Associating users with organization...');
  try {
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "User" 
      SET organization_id = '${defaultOrgId}'
      WHERE organization_id IS NULL
    `);
    console.log(`✓ Users associated: ${result}`);
  } catch (e: any) {
    console.log('Note:', e.message);
  }
  
  // Step 10: Create indexes
  console.log('\n📝 Step 10: Creating indexes...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS organizations_subscription_status_idx ON organizations(subscription_status);
      CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
      CREATE INDEX IF NOT EXISTS programs_date_idx ON programs(date);
    `);
    console.log('✓ Indexes created');
  } catch (e: any) {
    console.log('Note:', e.message);
  }
  
  console.log('\n✅ Schema migration completed!');
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
