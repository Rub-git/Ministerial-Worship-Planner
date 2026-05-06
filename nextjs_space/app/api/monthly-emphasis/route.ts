export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getAvailableEmphases, getMonthlyEmphasisConfig } from '@/lib/monthly-emphasis';

/**
 * GET /api/monthly-emphasis
 * Fetch monthly emphasis records for the user's organization
 * Query params:
 * - year: number (required)
 * - month: number (optional, 1-12)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session?.user as any)?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : null;

    // Build query
    const where: any = {
      organizationId: user.organizationId,
      year,
    };
    if (month) {
      where.month = month;
    }

    const emphases = await prisma.monthlyEmphasis.findMany({
      where,
      orderBy: { month: 'asc' },
    });

    // Enrich with config labels
    const enrichedEmphases = emphases.map((e) => {
      const config = getMonthlyEmphasisConfig(e.emphasisKey);
      return {
        ...e,
        labelEn: config?.labelEn ?? e.emphasisKey,
        labelEs: config?.labelEs ?? e.emphasisKey,
        preferredCategories: config?.preferredCategories ?? [],
      };
    });

    // Also return available options for UI dropdown
    const availableOptions = getAvailableEmphases();

    return NextResponse.json({
      emphases: enrichedEmphases,
      availableOptions,
      year,
    });
  } catch (error) {
    console.error('Error fetching monthly emphases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly emphases' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monthly-emphasis
 * Create or update a monthly emphasis for a specific month/year
 * Body: { month: number, year: number, emphasisKey: string, title?: string, titleEs?: string }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session?.user as any)?.role;
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    const userId = (session?.user as any)?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const { month, year, emphasisKey, title, titleEs } = body;

    if (!month || !year || !emphasisKey) {
      return NextResponse.json(
        { error: 'month, year, and emphasisKey are required' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Validate emphasis key exists
    const config = getMonthlyEmphasisConfig(emphasisKey);
    if (!config) {
      return NextResponse.json(
        { error: `Invalid emphasis key: ${emphasisKey}` },
        { status: 400 }
      );
    }

    // Upsert the monthly emphasis (only ONE per month per org)
    const emphasis = await prisma.monthlyEmphasis.upsert({
      where: {
        organizationId_month_year: {
          organizationId: user.organizationId,
          month,
          year,
        },
      },
      update: {
        emphasisKey,
        title: title || null,
        titleEs: titleEs || null,
      },
      create: {
        organizationId: user.organizationId,
        month,
        year,
        emphasisKey,
        title: title || null,
        titleEs: titleEs || null,
      },
    });

    return NextResponse.json({
      success: true,
      emphasis: {
        ...emphasis,
        labelEn: config.labelEn,
        labelEs: config.labelEs,
        preferredCategories: config.preferredCategories,
      },
    });
  } catch (error) {
    console.error('Error saving monthly emphasis:', error);
    return NextResponse.json(
      { error: 'Failed to save monthly emphasis' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/monthly-emphasis
 * Remove a monthly emphasis for a specific month/year
 * Query params: month, year
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session?.user as any)?.role;
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    const userId = (session?.user as any)?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '0', 10);
    const year = parseInt(searchParams.get('year') || '0', 10);

    if (!month || !year) {
      return NextResponse.json(
        { error: 'month and year are required' },
        { status: 400 }
      );
    }

    await prisma.monthlyEmphasis.delete({
      where: {
        organizationId_month_year: {
          organizationId: user.organizationId,
          month,
          year,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monthly emphasis:', error);
    return NextResponse.json(
      { error: 'Failed to delete monthly emphasis' },
      { status: 500 }
    );
  }
}
