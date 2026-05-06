export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ProgramType, LanguageMode, ProgramBlock } from '@prisma/client';
import { getTenantContext, verifyProgramAccess, unauthorizedResponse, forbiddenResponse, canCreateContent, viewOnlyResponse } from '@/lib/tenant-security';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return unauthorizedResponse();
    }

    // Verify tenant access to this program
    const access = await verifyProgramAccess(params?.id, ctx);
    if (!access.allowed) {
      return access.error === 'Program not found'
        ? NextResponse.json({ error: access.error }, { status: 404 })
        : forbiddenResponse(access.error);
    }

    return NextResponse.json(access.program);
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return unauthorizedResponse();
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(ctx.userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify tenant access and subscription status
    const access = await verifyProgramAccess(params?.id, ctx);
    if (!access.allowed) {
      return access.error === 'Program not found'
        ? NextResponse.json({ error: access.error }, { status: 404 })
        : forbiddenResponse(access.error);
    }

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
      // Cover customization
      coverImageUrl,
      coverVerseEn,
      coverVerseEs,
      announcements,
    } = body ?? {};

    // Delete existing items
    await prisma.programItem.deleteMany({
      where: { programId: params?.id },
    });

    // Update program with new items
    const program = await prisma.program.update({
      where: { id: params?.id },
      data: {
        date: date ? new Date(date) : undefined,
        type: type as ProgramType,
        languageMode: languageMode as LanguageMode,
        // Cover customization (only update if provided)
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(coverVerseEn !== undefined && { coverVerseEn }),
        ...(coverVerseEs !== undefined && { coverVerseEs }),
        ...(announcements !== undefined && { announcements }),
        items: {
          create: (items ?? []).map((item: any, index: number) => ({
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
        items: { include: { hymnPair: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error('Error updating program:', error);
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return unauthorizedResponse();
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(ctx.userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify tenant access
    const access = await verifyProgramAccess(params?.id, ctx);
    if (!access.allowed) {
      return access.error === 'Program not found'
        ? NextResponse.json({ error: access.error }, { status: 404 })
        : forbiddenResponse(access.error);
    }

    const canCreate = await canCreateContent(ctx);
    if (!canCreate) {
      return viewOnlyResponse();
    }

    await prisma.program.delete({
      where: { id: params?.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  }
}
