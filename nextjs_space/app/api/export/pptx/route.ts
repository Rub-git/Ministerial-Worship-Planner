export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import PptxGenJS from 'pptxgenjs';
import { PROGRAM_TEMPLATES } from '@/lib/types';

const PROGRAM_TYPE_NAMES: Record<string, { en: string; es: string }> = {
  FRIDAY: { en: 'Friday Vespers', es: 'Culto de Viernes' },
  WEDNESDAY: { en: 'Wednesday Prayer Meeting', es: 'Culto de Oración' },
  SABBATH: { en: 'Sabbath Worship', es: 'Culto Sabático' },
  YOUTH: { en: 'Youth Program', es: 'Programa Juvenil' },
};

function formatDate(date: Date): { en: string; es: string } {
  const d = new Date(date);
  const optionsEn: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const optionsEs: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return {
    en: d.toLocaleDateString('en-US', optionsEn),
    es: d.toLocaleDateString('es-ES', optionsEs),
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { programId } = body ?? {};

    if (!programId) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        items: {
          include: { hymnPair: true },
          orderBy: [{ block: 'asc' }, { order: 'asc' }],
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Tenant isolation: verify user can access this program
    const userRole = (session?.user as any)?.role;
    const userOrgId = (session?.user as any)?.organizationId;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    
    if (!isSuperAdmin && program.organizationId !== userOrgId) {
      return NextResponse.json({ error: 'Access denied to this program' }, { status: 403 });
    }

    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, { valueEn: string; valueEs: string }> = {};
    for (const s of settings ?? []) {
      settingsMap[s?.key ?? ''] = { valueEn: s?.valueEn ?? '', valueEs: s?.valueEs ?? '' };
    }

    const churchName = settingsMap['church_name'] ?? { valueEn: 'Your Church Name', valueEs: 'Nombre de su Iglesia' };
    const dateFormatted = formatDate(program?.date);
    const typeNames = PROGRAM_TYPE_NAMES[program?.type] ?? { en: program?.type, es: program?.type };

    // Get template for section labels
    const template = PROGRAM_TEMPLATES[program?.type as keyof typeof PROGRAM_TEMPLATES] ?? [];
    const templateMap: Record<string, { labelEn: string; labelEs: string }> = {};
    for (const t of template) {
      templateMap[t.key] = { labelEn: t.labelEn, labelEs: t.labelEs };
    }

    // Get the language mode from the program (defaults to BILINGUAL)
    const languageMode = program?.languageMode ?? 'BILINGUAL';

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = `${typeNames?.en} - ${dateFormatted?.en}`;
    pptx.author = churchName?.valueEn ?? 'Church';

    // Title slide with gradient background
    const titleSlide = pptx.addSlide();
    titleSlide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      fill: { color: '5b21b6' },
    });

    // Title slide content based on language mode
    if (languageMode === 'EN') {
      titleSlide.addText(`${churchName?.valueEn ?? ''}`, {
        x: 0.5, y: 1.8, w: '90%', h: 0.8,
        fontSize: 36, color: 'FFFFFF', bold: true, align: 'center',
      });
      titleSlide.addText(`${typeNames?.en}`, {
        x: 0.5, y: 3.2, w: '90%', h: 0.6,
        fontSize: 28, color: 'FFFFFF', bold: true, align: 'center',
      });
      titleSlide.addText(`${dateFormatted?.en}`, {
        x: 0.5, y: 4.2, w: '90%', h: 0.5,
        fontSize: 20, color: 'E9D5FF', align: 'center',
      });
    } else if (languageMode === 'ES') {
      titleSlide.addText(`${churchName?.valueEs ?? ''}`, {
        x: 0.5, y: 1.8, w: '90%', h: 0.8,
        fontSize: 36, color: 'FFFFFF', bold: true, align: 'center',
      });
      titleSlide.addText(`${typeNames?.es}`, {
        x: 0.5, y: 3.2, w: '90%', h: 0.6,
        fontSize: 28, color: 'FFFFFF', bold: true, align: 'center',
      });
      titleSlide.addText(`${dateFormatted?.es}`, {
        x: 0.5, y: 4.2, w: '90%', h: 0.5,
        fontSize: 20, color: 'E9D5FF', align: 'center',
      });
    } else {
      // BILINGUAL
      titleSlide.addText(`${churchName?.valueEn ?? ''}`, {
        x: 0.5, y: 1.5, w: '90%', h: 0.8,
        fontSize: 36, color: 'FFFFFF', bold: true, align: 'center',
      });
      titleSlide.addText(`${churchName?.valueEs ?? ''}`, {
        x: 0.5, y: 2.3, w: '90%', h: 0.6,
        fontSize: 24, color: 'E9D5FF', align: 'center',
      });
      titleSlide.addText(`${typeNames?.en} / ${typeNames?.es}`, {
        x: 0.5, y: 3.4, w: '90%', h: 0.6,
        fontSize: 28, color: 'FFFFFF', bold: true, align: 'center',
      });
      titleSlide.addText(`${dateFormatted?.en}`, {
        x: 0.5, y: 4.2, w: '90%', h: 0.5,
        fontSize: 20, color: 'E9D5FF', align: 'center',
      });
      titleSlide.addText(`${dateFormatted?.es}`, {
        x: 0.5, y: 4.7, w: '90%', h: 0.5,
        fontSize: 18, color: 'C4B5FD', align: 'center',
      });
    }

    // Add slides for each hymn used in the program
    const hymnsUsed = new Set<number>();
    for (const item of program?.items ?? []) {
      const hymn = item?.hymnPair;
      if (hymn && !hymnsUsed.has(hymn.id)) {
        hymnsUsed.add(hymn.id);
        const labels = templateMap[item?.sectionKey] ?? { labelEn: 'Hymn', labelEs: 'Himno' };
        const hasEnglish = hymn.numberEn !== null && hymn.titleEn !== null;

        // For EN mode, skip hymns without English
        if (languageMode === 'EN' && !hasEnglish) {
          continue; // Skip Spanish-only hymns in English mode
        }

        const hymnSlide = pptx.addSlide();
        
        // Background
        hymnSlide.addShape('rect', {
          x: 0, y: 0, w: '100%', h: '100%',
          fill: { color: 'FEFBFF' },
        });

        // Section label header
        hymnSlide.addShape('rect', {
          x: 0, y: 0, w: '100%', h: 1.2,
          fill: { color: '7C3AED' },
        });

        // Header label based on language mode
        let headerLabel = '';
        if (languageMode === 'EN') {
          headerLabel = labels.labelEn;
        } else if (languageMode === 'ES') {
          headerLabel = labels.labelEs;
        } else {
          headerLabel = `${labels.labelEn} / ${labels.labelEs}`;
        }
        hymnSlide.addText(headerLabel, {
          x: 0.5, y: 0.35, w: '90%', h: 0.5,
          fontSize: 22, color: 'FFFFFF', bold: true, align: 'center',
        });

        // Hymn content based on language mode
        if (languageMode === 'EN') {
          // English only - centered, large
          hymnSlide.addText(`#${hymn.numberEn}`, {
            x: 0.5, y: 2.0, w: '90%', h: 1.0,
            fontSize: 60, color: '5B21B6', bold: true, align: 'center',
          });
          hymnSlide.addText(`${hymn.titleEn}`, {
            x: 0.5, y: 3.2, w: '90%', h: 0.9,
            fontSize: 38, color: '1F2937', bold: true, align: 'center',
          });
        } else if (languageMode === 'ES') {
          // Spanish only - centered, large
          hymnSlide.addText(`#${hymn.numberEs}`, {
            x: 0.5, y: 2.0, w: '90%', h: 1.0,
            fontSize: 60, color: '7C3AED', bold: true, align: 'center',
          });
          hymnSlide.addText(`${hymn.titleEs}`, {
            x: 0.5, y: 3.2, w: '90%', h: 0.9,
            fontSize: 38, color: '1F2937', bold: true, align: 'center',
          });
        } else if (hasEnglish) {
          // BILINGUAL with both languages available - English on top, Spanish below
          hymnSlide.addText(`#${hymn.numberEn}`, {
            x: 0.5, y: 1.8, w: '90%', h: 0.8,
            fontSize: 48, color: '5B21B6', bold: true, align: 'center',
          });
          hymnSlide.addText(`${hymn.titleEn}`, {
            x: 0.5, y: 2.6, w: '90%', h: 0.7,
            fontSize: 32, color: '1F2937', bold: true, align: 'center',
          });
          // Divider
          hymnSlide.addShape('rect', {
            x: 2, y: 3.5, w: 6, h: 0.02,
            fill: { color: 'E5E7EB' },
          });
          hymnSlide.addText(`#${hymn.numberEs}`, {
            x: 0.5, y: 3.8, w: '90%', h: 0.7,
            fontSize: 40, color: '7C3AED', bold: true, align: 'center',
          });
          hymnSlide.addText(`${hymn.titleEs}`, {
            x: 0.5, y: 4.5, w: '90%', h: 0.6,
            fontSize: 26, color: '4B5563', align: 'center',
          });
        } else {
          // BILINGUAL but Spanish only hymn - Centered, larger text
          hymnSlide.addText(`#${hymn.numberEs}`, {
            x: 0.5, y: 2.2, w: '90%', h: 1.0,
            fontSize: 60, color: '7C3AED', bold: true, align: 'center',
          });
          hymnSlide.addText(`${hymn.titleEs}`, {
            x: 0.5, y: 3.4, w: '90%', h: 0.9,
            fontSize: 38, color: '1F2937', bold: true, align: 'center',
          });
          hymnSlide.addText('Solo Español / Spanish Only', {
            x: 0.5, y: 4.6, w: '90%', h: 0.4,
            fontSize: 14, color: '9CA3AF', italic: true, align: 'center',
          });
        }
      }
    }

    // Generate PPTX buffer
    const pptxBuffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;

    return new NextResponse(pptxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="program-${program?.date?.toISOString?.()?.split?.('T')?.[0] ?? 'download'}.pptx"`,
      },
    });
  } catch (error) {
    console.error('Error generating PPTX:', error);
    return NextResponse.json({ error: 'Failed to generate PPTX' }, { status: 500 });
  }
}
