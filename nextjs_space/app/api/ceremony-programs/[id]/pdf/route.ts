export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const program = await prisma.ceremonyProgram.findUnique({
      where: { id: params.id },
      include: {
        template: {
          include: { sections: { orderBy: { order: 'asc' } } },
        },
        organization: {
          select: { nameEn: true, nameEs: true, logoSvg: true },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const variables = program.variables as Record<string, string>;
    const churchName = program.organization?.nameEn || 'Your Church Name';
    const dateFormatted = new Date(program.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Calculate total duration
    const totalDuration = program.template.sections.reduce((sum, s) => sum + (s.durationMin || 0), 0);

    // Generate HTML for the PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: Letter; margin: 0.75in; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            color: #1f2937;
            background: white;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1e40af;
          }
          .church-name {
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 8px;
          }
          .program-title {
            font-size: 24px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 8px;
          }
          .program-category {
            font-size: 14px;
            color: #3b82f6;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          .program-date {
            font-size: 16px;
            color: #4b5563;
          }
          .program-duration {
            font-size: 13px;
            color: #6b7280;
            margin-top: 5px;
          }
          .variables-section {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
          }
          .variables-title {
            font-size: 14px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .variables-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .variable-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .variable-label {
            color: #6b7280;
            font-size: 12px;
          }
          .variable-value {
            font-weight: 500;
            color: #1f2937;
            font-size: 12px;
          }
          .sections-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #1e40af;
          }
          .section-item {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 6px;
            background: #f0f9ff;
            border: 1px solid #bfdbfe;
          }
          .section-item.optional {
            background: #f9fafb;
            border: 1px dashed #d1d5db;
          }
          .section-number {
            flex-shrink: 0;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #1e40af;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: bold;
          }
          .section-content {
            flex: 1;
          }
          .section-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-title {
            font-weight: 600;
            color: #1f2937;
            font-size: 14px;
          }
          .section-optional-badge {
            font-size: 10px;
            padding: 2px 6px;
            background: #e5e7eb;
            color: #6b7280;
            border-radius: 4px;
          }
          .section-role {
            font-size: 12px;
            color: #1e40af;
            margin-top: 2px;
          }
          .section-notes {
            font-size: 11px;
            color: #6b7280;
            font-style: italic;
            margin-top: 4px;
          }
          .section-duration {
            flex-shrink: 0;
            font-size: 12px;
            color: #6b7280;
            text-align: right;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="church-name">${churchName}</div>
          <div class="program-category">${program.template.category}</div>
          <div class="program-title">${program.template.name}</div>
          <div class="program-date">${dateFormatted}</div>
          <div class="program-duration">Duración aproximada: ${totalDuration} minutos</div>
        </div>

        ${Object.keys(variables).length > 0 ? `
        <div class="variables-section">
          <div class="variables-title">Información del Evento</div>
          <div class="variables-grid">
            ${Object.entries(variables)
              .filter(([_, v]) => v)
              .map(([key, value]) => `
                <div class="variable-item">
                  <span class="variable-label">${key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                  <span class="variable-value">${value}</span>
                </div>
              `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="sections-title">Orden del Programa</div>
        
        ${program.template.sections.map(section => `
          <div class="section-item ${section.optional ? 'optional' : ''}">
            <div class="section-number">${section.order}</div>
            <div class="section-content">
              <div class="section-title-row">
                <span class="section-title">${section.title}</span>
                ${section.optional ? '<span class="section-optional-badge">Opcional</span>' : ''}
              </div>
              ${section.role ? `<div class="section-role">${section.role}</div>` : ''}
              ${section.notes ? `<div class="section-notes">${section.notes}</div>` : ''}
            </div>
            <div class="section-duration">
              ${section.durationMin ? `${section.durationMin} min` : ''}
            </div>
          </div>
        `).join('')}

        <div class="footer">
          ${churchName} • Generado el ${new Date().toLocaleDateString('es-ES')}
        </div>
        <div style="text-align:center;font-size:9px;color:#9ca3af;margin-top:15px;">Powered by Ministerial Worship Planner</div>
      </body>
      </html>
    `;

    // Generate PDF using HTML2PDF API
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: htmlContent,
        pdf_options: {
          format: 'Letter',
          margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
        },
        base_url: process.env.NEXTAUTH_URL ?? '',
      }),
    });

    if (!createResponse.ok) {
      return NextResponse.json({ error: 'Failed to create PDF request' }, { status: 500 });
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json({ error: 'No request ID returned' }, { status: 500 });
    }

    // Poll for status
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });

      const statusResult = await statusResponse.json();
      const status = statusResult?.status ?? 'FAILED';
      const result = statusResult?.result ?? null;

      if (status === 'SUCCESS' && result?.result) {
        const pdfBuffer = Buffer.from(result.result, 'base64');
        const filename = `${program.template.templateId}-${program.date}.pdf`;
        
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } else if (status === 'FAILED') {
        return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
      }
      attempts++;
    }

    return NextResponse.json({ error: 'PDF generation timed out' }, { status: 500 });
  } catch (error) {
    console.error('Error generating ceremony PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
