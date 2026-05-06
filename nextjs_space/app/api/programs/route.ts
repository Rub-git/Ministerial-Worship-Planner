export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { ProgramType, LanguageMode, ProgramBlock } from '@prisma/client';
import { PROGRAM_TEMPLATES } from '@/lib/types';
import { getTenantContext, getOrgFilter, unauthorizedResponse, canCreateContent, viewOnlyResponse } from '@/lib/tenant-security';

export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams?.get?.('type') as ProgramType | null;
    const startDate = searchParams?.get?.('startDate');
    const endDate = searchParams?.get?.('endDate');

    // Build where clause with tenant isolation
    const orgFilter = getOrgFilter(ctx);
    const where: any = { ...orgFilter };
    if (type) where.type = type;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const programs = await prisma.program.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: { hymnPair: true },
          orderBy: [{ block: 'asc' }, { order: 'asc' }],
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(programs ?? []);
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}

// Generate default items from template if no items provided
function generateItemsFromTemplate(programType: ProgramType): any[] {
  const template = PROGRAM_TEMPLATES[programType] ?? [];
  return template.map((t, index) => ({
    sectionKey: t.key,
    block: t.block ?? 'MAIN',
    order: index,
    textEn: null,
    textEs: null,
    hymnPairId: null,
    personName: null,
  }));
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return unauthorizedResponse();
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(ctx.userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check subscription status (VIEW ONLY mode)
    const canCreate = await canCreateContent(ctx);
    if (!canCreate) {
      return viewOnlyResponse();
    }

    const body = await request.json();
    const { 
      date, 
      type, 
      languageMode, 
      items,
      // Phase 3.8: Special Theme
      isSpecialEvent,
      specialTheme,
      // Phase 4: Sermon Series
      seriesId,
      seriesTitle,
      seriesWeek,
      seriesTotal,
      // Cover customization
      coverImageUrl,
      coverVerseEn,
      coverVerseEs,
      announcements,
    } = body ?? {};

    if (!date || !type) {
      return NextResponse.json({ error: 'Date and type are required' }, { status: 400 });
    }

    const userId = ctx.userId;
    const organizationId = ctx.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 });
    }

    // Use provided items or generate from template if empty
    const itemsToCreate = (items && items.length > 0) 
      ? items 
      : generateItemsFromTemplate(type as ProgramType);

    const program = await prisma.program.create({
      data: {
        date: new Date(date),
        type: type as ProgramType,
        languageMode: (languageMode ?? 'BILINGUAL') as LanguageMode,
        organizationId,
        createdById: userId,
        // Phase 3.8: Special Theme
        isSpecialEvent: isSpecialEvent ?? false,
        specialTheme: specialTheme ?? null,
        // Phase 4: Sermon Series
        seriesId: seriesId ?? null,
        seriesTitle: seriesTitle ?? null,
        seriesWeek: seriesWeek ? parseInt(seriesWeek, 10) : null,
        seriesTotal: seriesTotal ? parseInt(seriesTotal, 10) : null,
        // Cover customization
        coverImageUrl: coverImageUrl ?? null,
        coverVerseEn: coverVerseEn ?? null,
        coverVerseEs: coverVerseEs ?? null,
        announcements: announcements ?? null,
        items: {
          create: itemsToCreate.map((item: any, index: number) => ({
            block: (item?.block ?? 'MAIN') as ProgramBlock,
            order: item?.order ?? index,
            sectionKey: item?.sectionKey ?? '',
            textEn: item?.textEn ?? null,
            textEs: item?.textEs ?? null,
            hymnPairId: item?.hymnPairId ?? null,
            personName: item?.personName ?? null,
          })),
        },
      },
      include: {
        items: { include: { hymnPair: true }, orderBy: [{ block: 'asc' }, { order: 'asc' }] },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
  }
}
