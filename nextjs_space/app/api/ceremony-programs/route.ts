export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET: List ceremony programs for the user's organization
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = session.user as { id: string; email: string; organizationId?: string | null };
    const organizationId = sessionUser.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 });
    }

    const programs = await prisma.ceremonyProgram.findMany({
      where: { organizationId },
      include: {
        template: {
          select: { name: true, category: true, templateId: true },
        },
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching ceremony programs:', error);
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}

// POST: Create a new ceremony program
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = session.user as { id: string; email: string; organizationId?: string | null; role: string };
    
    if (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'EDITOR' && sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organizationId = sessionUser.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 });
    }

    const body = await request.json();
    const { templateId, date, variables, sectionOverrides } = body;

    if (!templateId || !date) {
      return NextResponse.json({ error: 'Template ID and date are required' }, { status: 400 });
    }

    // Find template by templateId (the string ID like "BODA_01")
    const template = await prisma.ceremonyTemplate.findFirst({
      where: {
        OR: [
          { id: templateId },
          { templateId: templateId },
        ],
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const program = await prisma.ceremonyProgram.create({
      data: {
        templateId: template.id,
        organizationId,
        createdById: sessionUser.id,
        date: new Date(date),
        variables: variables || {},
        sectionOverrides: sectionOverrides || [],
        status: 'draft',
      },
      include: {
        template: {
          include: { sections: { orderBy: { order: 'asc' } } },
        },
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error('Error creating ceremony program:', error);
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
  }
}
