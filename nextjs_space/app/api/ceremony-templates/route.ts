export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { mapDenominationToEnum } from '@/lib/template-library';
import { Denomination } from '@prisma/client';

// GET: List ceremony templates available to the user's organization
// Filters by: GLOBAL + matching DENOMINATION + ORG_CUSTOM
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userOrgId = (session.user as any).organizationId;
    const isSuperAdmin = (session.user as any).role === 'SUPER_ADMIN';

    // Get user's organization denomination
    let orgDenomination: Denomination = 'CHRISTIAN';
    if (userOrgId) {
      const org = await prisma.organization.findUnique({
        where: { id: userOrgId },
        select: { denomination: true },
      });
      if (org?.denomination) {
        orgDenomination = mapDenominationToEnum(org.denomination);
      }
    }

    // Build where clause based on scope
    const whereClause = isSuperAdmin
      ? { isActive: true } // SUPER_ADMIN sees all
      : {
          isActive: true,
          OR: [
            // GLOBAL templates (available to all)
            { scope: 'GLOBAL' as const },
            // DENOMINATION templates matching their denomination
            { scope: 'DENOMINATION' as const, denomination: orgDenomination },
            // Their own custom templates
            ...(userOrgId ? [{ scope: 'ORG_CUSTOM' as const, organizationId: userOrgId }] : []),
          ],
        };

    const templates = await prisma.ceremonyTemplate.findMany({
      where: whereClause,
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ scope: 'asc' }, { category: 'asc' }, { name: 'asc' }],
    });

    // Group by category for UI
    const grouped = templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, typeof templates>);

    // Also return counts by scope
    const scopeCounts = {
      global: templates.filter(t => t.scope === 'GLOBAL').length,
      denomination: templates.filter(t => t.scope === 'DENOMINATION').length,
      custom: templates.filter(t => t.scope === 'ORG_CUSTOM').length,
    };

    return NextResponse.json({ 
      templates, 
      grouped, 
      scopeCounts,
      userDenomination: orgDenomination,
    });
  } catch (error) {
    console.error('Error fetching ceremony templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
