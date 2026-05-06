export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams?.get?.('search') ?? '';
    const bilingualOnly = searchParams?.get?.('bilingualOnly') === 'true';

    let whereClause: any = {};

    // Filter for bilingual only (hymns with English equivalent)
    if (bilingualOnly) {
      whereClause.AND = [
        { numberEn: { not: null } },
        { titleEn: { not: null } },
      ];
    }

    // Search functionality
    if (search) {
      const searchNum = parseInt(search);
      const searchConditions: any[] = [
        { titleEs: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
      ];
      
      if (!isNaN(searchNum)) {
        searchConditions.push({ numberEs: searchNum });
        searchConditions.push({ numberEn: searchNum });
      }

      if (whereClause.AND) {
        whereClause.AND.push({ OR: searchConditions });
      } else {
        whereClause.OR = searchConditions;
      }
    }

    const hymns = await prisma.hymnPair.findMany({
      where: whereClause,
      orderBy: { numberEs: 'asc' },
    });

    return NextResponse.json(hymns ?? []);
  } catch (error) {
    console.error('Error fetching hymns:', error);
    return NextResponse.json({ error: 'Failed to fetch hymns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { titleEn, numberEn, titleEs, numberEs, lyricsEn, lyricsEs } = body ?? {};

    if (!titleEs || !numberEs) {
      return NextResponse.json({ error: 'Spanish title and number are required' }, { status: 400 });
    }

    const numEs = parseInt(numberEs);
    const numEn = numberEn ? parseInt(numberEn) : null;

    const hymn = await prisma.hymnPair.create({
      data: {
        numberEs: numEs,
        titleEs,
        numberEn: numEn,
        titleEn: titleEn || null,
        lyricsEn: lyricsEn ?? null,
        lyricsEs: lyricsEs ?? null,
      },
    });

    return NextResponse.json(hymn);
  } catch (error) {
    console.error('Error creating hymn:', error);
    return NextResponse.json({ error: 'Failed to create hymn' }, { status: 500 });
  }
}
