import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const prisma = new PrismaClient();

// CSV Parser for hymns
function parseHymnsCsv(csvPath: string) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const hymns: Array<{
    numberEs: number;
    titleEs: string;
    numberEn: number | null;
    titleEn: string | null;
  }> = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line handling quoted fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    const [spanishNumStr, spanishTitle, englishNumStr, englishTitle] = fields;
    
    const spanishNum = parseInt(spanishNumStr, 10);
    if (isNaN(spanishNum) || !spanishTitle) continue; // Skip rows without valid Spanish number or title

    const englishNum = englishNumStr ? Math.floor(parseFloat(englishNumStr)) : null;
    const engTitle = englishTitle?.trim() || null;

    hymns.push({
      numberEs: spanishNum,
      titleEs: spanishTitle,
      numberEn: englishNum && !isNaN(englishNum) ? englishNum : null,
      titleEn: engTitle,
    });
  }

  return hymns;
}

async function importHymns() {
  const csvPath = '/home/ubuntu/Uploads/Hymns_Spanish_527_Base_With_Confirmed_English.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.log('CSV file not found at:', csvPath);
    console.log('Skipping hymn import from CSV.');
    return;
  }

  console.log('Importing hymns from CSV...');
  const hymns = parseHymnsCsv(csvPath);
  console.log(`Found ${hymns.length} hymns in CSV`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const hymn of hymns) {
    try {
      const existing = await prisma.hymnPair.findUnique({
        where: { numberEs: hymn.numberEs },
      });

      if (existing) {
        // Update only if new data has values (don't overwrite with nulls or existing lyrics)
        const updateData: Record<string, unknown> = {};
        
        if (hymn.titleEs && hymn.titleEs !== existing.titleEs) {
          updateData.titleEs = hymn.titleEs;
        }
        if (hymn.numberEn !== null && hymn.numberEn !== existing.numberEn) {
          updateData.numberEn = hymn.numberEn;
        }
        if (hymn.titleEn !== null && hymn.titleEn !== existing.titleEn) {
          updateData.titleEn = hymn.titleEn;
        }
        // Note: Do NOT overwrite existing lyrics

        if (Object.keys(updateData).length > 0) {
          await prisma.hymnPair.update({
            where: { numberEs: hymn.numberEs },
            data: updateData,
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Create new hymn
        await prisma.hymnPair.create({
          data: {
            numberEs: hymn.numberEs,
            titleEs: hymn.titleEs,
            numberEn: hymn.numberEn,
            titleEn: hymn.titleEn,
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`Error processing hymn ${hymn.numberEs}:`, error);
    }
  }

  console.log(`Hymn import complete: ${created} created, ${updated} updated, ${skipped} skipped`);
}

async function main() {
  console.log('Starting seed...');

  // ============================================================================
  // PHASE 5: MULTI-TENANT ARCHITECTURE (Local Church Level)
  // 
  // MIGRATION PLAN:
  // - Adelanto Bilingual SDA Church = Organization #1
  // - All existing data (users, programs, series) associated with this org
  // - Global hymnal (HymnPair) remains shared across all organizations
  // 
  // ROLES: ADMIN / EDITOR / VIEWER (church-level only)
  // NO institutional permissions (conference/union fields are informational only)
  // ============================================================================
  console.log('Creating default organization (Organization #1)...');
  
  // Calculate trial end date (30 days from now for new orgs)
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 30);
  
  const defaultOrg = await prisma.organization.upsert({
    where: { id: 'adelanto-church-001' },
    update: {
      // SaaS Identity
      slug: 'adelanto-bilingual-sda',
      denomination: 'Seventh-day Adventist',
      primaryLanguage: 'both',
      // Bilingual identity
      nameEn: 'Adelanto Bilingual SDA Church',
      nameEs: 'Iglesia Adventista Bilingüe de Adelanto',
      mottoEn: 'Proclaiming Christ. Preparing a People.',
      mottoEs: 'Predicando a Cristo. Preparando un Pueblo.',
      // Address - ACTUAL ADDRESS
      addressLine1: '11568 Chamberlaine Way',
      city: 'Adelanto',
      state: 'CA',
      zip: '92301',
      country: 'USA',
      // Branding
      logoPath: '/assets/adventist-en--bluejay.svg',
      primaryColor: '#004B87',
      // Leadership - ACTUAL LEADERSHIP
      seniorPastor: 'Senior Pastor Edgar Lloren',
      associatePastor: 'Pastor Rowland Nwoso',
      // Subscription - Set to ACTIVE for existing org
      subscriptionStatus: 'ACTIVE',
      planTier: 'pro',
      // Informational only - NOT used for permissions
      conference: 'Southeastern California Conference',
      union: 'Pacific Union Conference',
    },
    create: {
      id: 'adelanto-church-001',
      // SaaS Identity
      slug: 'adelanto-bilingual-sda',
      denomination: 'Seventh-day Adventist',
      primaryLanguage: 'both',
      // Bilingual identity
      nameEn: 'Adelanto Bilingual SDA Church',
      nameEs: 'Iglesia Adventista Bilingüe de Adelanto',
      mottoEn: 'Proclaiming Christ. Preparing a People.',
      mottoEs: 'Predicando a Cristo. Preparando un Pueblo.',
      // Address - ACTUAL ADDRESS
      addressLine1: '11568 Chamberlaine Way',
      city: 'Adelanto',
      state: 'CA',
      zip: '92301',
      country: 'USA',
      timezone: 'America/Los_Angeles',
      // Branding - verified path exists: public/assets/adventist-en--bluejay.svg
      logoPath: '/assets/adventist-en--bluejay.svg',
      primaryColor: '#004B87',
      // Leadership - ACTUAL LEADERSHIP
      seniorPastor: 'Senior Pastor Edgar Lloren',
      associatePastor: 'Pastor Rowland Nwoso',
      // Contact/Social
      email: 'info@adelantobilingualsdachurch.com',
      websiteUrl: 'https://adelantobilingualsda.com',
      facebookUrl: 'https://facebook.com/adelantobilingualsdachurch',
      // Default verses (fallback for programs)
      defaultCoverVerseEn: '"Come to me, all you who are weary and burdened, and I will give you rest." - Matthew 11:28',
      defaultCoverVerseEs: '"Vengan a mí todos ustedes que están cansados y agobiados, y yo les daré descanso." - Mateo 11:28',
      defaultAnnouncementVerseEn: '"Trust in the LORD with all your heart." - Proverbs 3:5',
      defaultAnnouncementVerseEs: '"Confía en el SEÑOR con todo tu corazón." - Proverbios 3:5',
      // Welcome message
      welcomeMessageEn: 'Welcome to our worship service! We are blessed to have you with us today.',
      welcomeMessageEs: '¡Bienvenidos a nuestro servicio de adoración! Somos bendecidos de tenerlos con nosotros hoy.',
      // Service schedule
      sabbathSchoolTime: '9:15 AM',
      divineServiceTime: '11:00 AM',
      youthTime: '4:30 PM',
      wednesdayTime: '7:00 PM',
      fridayTime: '7:00 PM',
      foodDistributionTime: 'Sunday 2:00 - 4:00 PM',
      // Subscription - Set to ACTIVE for founding org
      subscriptionStatus: 'ACTIVE',
      planTier: 'pro',
      // Informational only - NOT used for permissions
      conference: 'Southeastern California Conference',
      union: 'Pacific Union Conference',
    },
  });
  console.log(`✓ Organization #1 created: ${defaultOrg.nameEn} (${defaultOrg.id})`);

  // Create default test user (hidden admin) - associated with org
  // Mark as verified since this is a seeded test user
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: { 
      organizationId: defaultOrg.id,
      emailVerified: new Date(), // Mark as verified
    },
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'John Doe',
      role: Role.ADMIN,
      organizationId: defaultOrg.id,
      emailVerified: new Date(), // Mark as verified
    },
  });

  // Create admin user for the church - associated with org
  const adminPassword = await bcrypt.hash('ChurchAdmin2026!', 10);
  await prisma.user.upsert({
    where: { email: 'info@adelantobilingualsdachurch.com' },
    update: { 
      role: Role.ADMIN, 
      organizationId: defaultOrg.id,
      emailVerified: new Date(), // Mark as verified
    },
    create: {
      email: 'info@adelantobilingualsdachurch.com',
      password: adminPassword,
      name: 'Church Admin',
      role: Role.ADMIN,
      organizationId: defaultOrg.id,
      emailVerified: new Date(), // Mark as verified
    },
  });

  // ============================================================================
  // SUPER_ADMIN - Created via secure bootstrap (env vars or invite)
  // DO NOT hardcode credentials here!
  // ============================================================================
  // Check if SUPER_ADMIN bootstrap is configured via environment variables
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  
  if (superAdminEmail && superAdminPassword) {
    console.log('Creating platform SUPER_ADMIN from environment variables...');
    const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 10);
    await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: { role: 'SUPER_ADMIN' },
      create: {
        email: superAdminEmail,
        password: hashedSuperAdminPassword,
        name: 'Platform Administrator',
        role: 'SUPER_ADMIN',
        organizationId: null, // SUPER_ADMIN has no org - can access all
      },
    });
    console.log(`✓ SUPER_ADMIN created: ${superAdminEmail}`);
    console.log('⚠️  IMPORTANT: Remove SUPER_ADMIN_PASSWORD from .env after first run!');
  } else {
    console.log('ℹ️  No SUPER_ADMIN credentials in env - skipping bootstrap.');
    console.log('   To create SUPER_ADMIN, set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env');
  }

  // Import hymns from CSV (GLOBAL - not org-specific)
  await importHymns();

  // Seed default GLOBAL settings (legacy)
  const defaultSettings = [
    { key: 'church_name', valueEn: 'Adelanto Bilingual SDA Church', valueEs: 'Iglesia Adventista Bilingüe de Adelanto' },
    { key: 'pdf_footer_quote_en', valueEn: '', valueEs: '' },
    { key: 'pdf_footer_quote_es', valueEn: '', valueEs: '' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Seed organization-specific settings
  const orgSettings = [
    { key: 'church_name', valueEn: 'Adelanto Bilingual SDA Church', valueEs: 'Iglesia Adventista Bilingüe de Adelanto' },
    { key: 'pdf_footer_quote', valueEn: 'Come, let us worship the Lord.', valueEs: 'Venid, adoremos al Señor.' },
  ];

  for (const setting of orgSettings) {
    await prisma.organizationSetting.upsert({
      where: {
        organizationId_key: {
          organizationId: defaultOrg.id,
          key: setting.key,
        },
      },
      update: { valueEn: setting.valueEn, valueEs: setting.valueEs },
      create: {
        organizationId: defaultOrg.id,
        key: setting.key,
        valueEn: setting.valueEn,
        valueEs: setting.valueEs,
      },
    });
  }

  // Note: Programs and series are now required to have organizationId
  // The migration script already associated existing records with the default org
  console.log('✓ Programs and series already associated via migration');

  // Phase 6: Seed Monthly Emphasis for 2026
  // Sample: March 2026 → EVANGELISM
  const monthlyEmphasisData = [
    { month: 1, year: 2026, emphasisKey: 'STEWARDSHIP', title: 'Faithful Stewardship Month', titleEs: 'Mes de Mayordomía Fiel' },
    { month: 2, year: 2026, emphasisKey: 'EDUCATION', title: 'Adventist Education Month', titleEs: 'Mes de Educación Adventista' },
    { month: 3, year: 2026, emphasisKey: 'EVANGELISM', title: 'Evangelism Emphasis', titleEs: 'Énfasis de Evangelismo' },
    { month: 4, year: 2026, emphasisKey: 'YOUTH_DAY', title: 'Global Youth Day', titleEs: 'Día Global de la Juventud' },
    { month: 5, year: 2026, emphasisKey: 'FAMILY_DAY', title: 'Family Month', titleEs: 'Mes de la Familia' },
    { month: 6, year: 2026, emphasisKey: 'HEALTH_EMPHASIS', title: 'Health & Wellness', titleEs: 'Salud y Bienestar' },
    { month: 10, year: 2026, emphasisKey: 'REFORMATION', title: 'Reformation Month', titleEs: 'Mes de la Reforma' },
    { month: 11, year: 2026, emphasisKey: 'MUSIC_MINISTRY', title: 'Music Ministry Month', titleEs: 'Mes del Ministerio de Música' },
  ];

  for (const emphasis of monthlyEmphasisData) {
    await prisma.monthlyEmphasis.upsert({
      where: {
        organizationId_month_year: {
          organizationId: defaultOrg.id,
          month: emphasis.month,
          year: emphasis.year,
        },
      },
      update: {
        emphasisKey: emphasis.emphasisKey,
        title: emphasis.title,
        titleEs: emphasis.titleEs,
      },
      create: {
        organizationId: defaultOrg.id,
        month: emphasis.month,
        year: emphasis.year,
        emphasisKey: emphasis.emphasisKey,
        title: emphasis.title,
        titleEs: emphasis.titleEs,
      },
    });
  }
  console.log(`✓ Monthly Emphasis seeded for 2026 (${monthlyEmphasisData.length} months)`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
