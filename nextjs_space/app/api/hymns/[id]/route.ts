export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hymnId = parseInt(params?.id);
    if (isNaN(hymnId)) {
      return NextResponse.json({ error: 'Invalid hymn ID' }, { status: 400 });
    }

    const hymn = await prisma.hymnPair.findUnique({
      where: { id: hymnId },
    });

    if (!hymn) {
      return NextResponse.json({ error: 'Hymn not found' }, { status: 404 });
    }

    return NextResponse.json(hymn);
  } catch (error) {
    console.error('Error fetching hymn:', error);
    return NextResponse.json({ error: 'Failed to fetch hymn' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hymnId = parseInt(params?.id);
    if (isNaN(hymnId)) {
      return NextResponse.json({ error: 'Invalid hymn ID' }, { status: 400 });
    }

    const body = await request.json();
    const { titleEn, numberEn, titleEs, numberEs, lyricsEn, lyricsEs } = body ?? {};

    if (!titleEs || !numberEs) {
      return NextResponse.json({ error: 'Spanish title and number are required' }, { status: 400 });
    }

    const numEs = parseInt(numberEs);
    const numEn = numberEn ? parseInt(numberEn) : null;

    const hymn = await prisma.hymnPair.update({
      where: { id: hymnId },
      data: {
        numberEs: numEs,
        titleEs,
        numberEn: numEn,
        titleEn: titleEn || null,
        lyricsEn: lyricsEn ?? undefined, // Don't overwrite existing lyrics unless provided
        lyricsEs: lyricsEs ?? undefined,
      },
    });

    return NextResponse.json(hymn);
  } catch (error) {
    console.error('Error updating hymn:', error);
    return NextResponse.json({ error: 'Failed to update hymn' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hymnId = parseInt(params?.id);
    if (isNaN(hymnId)) {
      return NextResponse.json({ error: 'Invalid hymn ID' }, { status: 400 });
    }

    // Check if hymn is used in any programs
    const usedInPrograms = await prisma.programItem.findFirst({
      where: { hymnPairId: hymnId },
    });

    if (usedInPrograms) {
      return NextResponse.json({ error: 'Cannot delete hymn that is used in programs' }, { status: 400 });
    }

    await prisma.hymnPair.delete({
      where: { id: hymnId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hymn:', error);
    return NextResponse.json({ error: 'Failed to delete hymn' }, { status: 500 });
  }
}
