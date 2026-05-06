export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext, getOrgFilter, unauthorizedResponse, canCreateContent, viewOnlyResponse } from '@/lib/tenant-security';

/**
 * GET /api/series
 * List sermon series for user's organization
 */
export async function GET() {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return unauthorizedResponse();
    }

    // Apply tenant filter
    const orgFilter = getOrgFilter(ctx);
    
    const series = await prisma.sermonSeries.findMany({
      where: orgFilter,
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { programs: true },
        },
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/series
 * Create a new sermon series
 */
export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return unauthorizedResponse();
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(ctx.userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check subscription status
    const canCreate = await canCreateContent(ctx);
    if (!canCreate) {
      return viewOnlyResponse();
    }

    const body = await request.json();
    const { title, titleEs, theme, totalWeeks, startDate } = body ?? {};

    if (!title || !theme || !totalWeeks || !startDate) {
      return NextResponse.json(
        { error: 'Title, theme, totalWeeks, and startDate are required' },
        { status: 400 }
      );
    }

    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 });
    }

    const series = await prisma.sermonSeries.create({
      data: {
        title,
        titleEs: titleEs ?? null,
        theme,
        totalWeeks: parseInt(totalWeeks, 10),
        startDate: new Date(startDate),
        organizationId: ctx.organizationId,
      },
    });

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    console.error('Error creating series:', error);
    return NextResponse.json(
      { error: 'Failed to create series' },
      { status: 500 }
    );
  }
}
