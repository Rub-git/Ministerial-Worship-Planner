export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext, verifyCeremonyProgramAccess, unauthorizedResponse, forbiddenResponse, canCreateContent, viewOnlyResponse } from '@/lib/tenant-security';

// GET: Get a specific ceremony program
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return unauthorizedResponse();
    }

    // Verify tenant access
    const access = await verifyCeremonyProgramAccess(params.id, ctx);
    if (!access.allowed) {
      return access.error === 'Program not found'
        ? NextResponse.json({ error: access.error }, { status: 404 })
        : forbiddenResponse(access.error);
    }

    return NextResponse.json(access.program);
  } catch (error) {
    console.error('Error fetching ceremony program:', error);
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 });
  }
}

// PUT: Update a ceremony program
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return unauthorizedResponse();
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(ctx.userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify tenant access
    const access = await verifyCeremonyProgramAccess(params.id, ctx);
    if (!access.allowed) {
      return access.error === 'Program not found'
        ? NextResponse.json({ error: access.error }, { status: 404 })
        : forbiddenResponse(access.error);
    }

    // Check subscription status
    const canCreate = await canCreateContent(ctx);
    if (!canCreate) {
      return viewOnlyResponse();
    }

    const body = await request.json();
    const { date, variables, sectionOverrides, status } = body;

    const program = await prisma.ceremonyProgram.update({
      where: { id: params.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(variables && { variables }),
        ...(sectionOverrides && { sectionOverrides }),
        ...(status && { status }),
      },
      include: {
        template: {
          include: { sections: { orderBy: { order: 'asc' } } },
        },
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error('Error updating ceremony program:', error);
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
  }
}

// DELETE: Delete a ceremony program
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return unauthorizedResponse();
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(ctx.userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify tenant access
    const access = await verifyCeremonyProgramAccess(params.id, ctx);
    if (!access.allowed) {
      return access.error === 'Program not found'
        ? NextResponse.json({ error: access.error }, { status: 404 })
        : forbiddenResponse(access.error);
    }

    // Check subscription status
    const canCreate = await canCreateContent(ctx);
    if (!canCreate) {
      return viewOnlyResponse();
    }

    await prisma.ceremonyProgram.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ceremony program:', error);
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  }
}
