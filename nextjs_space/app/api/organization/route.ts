import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/organization
 * Returns the current user's organization with all customization fields
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    return NextResponse.json(user.organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
  }
}

/**
 * PUT /api/organization
 * Update organization settings (ADMIN only)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const data = await request.json();

    // Update organization with all customization fields
    const updated = await prisma.organization.update({
      where: { id: user.organization.id },
      data: {
        // Bilingual identity
        nameEn: data.nameEn,
        nameEs: data.nameEs,
        mottoEn: data.mottoEn || null,
        mottoEs: data.mottoEs || null,
        
        // Address
        addressLine1: data.addressLine1 || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        
        // Branding
        logoPath: data.logoPath || null,
        logoSvg: data.logoSvg || null,
        primaryColor: data.primaryColor || null,
        
        // Leadership
        seniorPastor: data.seniorPastor || null,
        associatePastor: data.associatePastor || null,
        
        // Contact/Social
        websiteUrl: data.websiteUrl || null,
        facebookUrl: data.facebookUrl || null,
        
        // Default verses
        defaultCoverVerseEn: data.defaultCoverVerseEn || null,
        defaultCoverVerseEs: data.defaultCoverVerseEs || null,
        defaultAnnouncementVerseEn: data.defaultAnnouncementVerseEn || null,
        defaultAnnouncementVerseEs: data.defaultAnnouncementVerseEs || null,
        
        // Welcome message
        welcomeMessageEn: data.welcomeMessageEn || null,
        welcomeMessageEs: data.welcomeMessageEs || null,
        
        // Service schedule
        sabbathSchoolTime: data.sabbathSchoolTime || null,
        divineServiceTime: data.divineServiceTime || null,
        youthTime: data.youthTime || null,
        wednesdayTime: data.wednesdayTime || null,
        fridayTime: data.fridayTime || null,
        foodDistributionTime: data.foodDistributionTime || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}
