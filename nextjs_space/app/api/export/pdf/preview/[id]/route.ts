export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { PROGRAM_TEMPLATES } from '@/lib/types';
import fs from 'fs';
import path from 'path';

const PROGRAM_TYPE_NAMES: Record<string, { en: string; es: string }> = {
  FRIDAY: { en: 'Friday Vespers', es: 'Culto de Viernes' },
  WEDNESDAY: { en: 'Wednesday Prayer Meeting', es: 'Culto de Oración' },
  SABBATH: { en: 'Sabbath Worship', es: 'Culto Sabático' },
  YOUTH: { en: 'Youth Program', es: 'Programa Juvenil' },
};

function formatDate(date: Date): { en: string; es: string } {
  const d = new Date(date);
  const day = d.getDate();
  const year = d.getFullYear();
  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthIndex = d.getMonth();
  return {
    en: `${monthsEn[monthIndex]} ${day}, ${year}`,
    es: `${day} de ${monthsEs[monthIndex]} de ${year}`,
  };
}

function getLogoSvg(org?: { logoSvg?: string | null; logoPath?: string | null } | null): string {
  try {
    if (org?.logoSvg) return org.logoSvg;
    if (org?.logoPath) {
      const orgLogoPath = path.join(process.cwd(), 'public', org.logoPath.replace(/^\//, ''));
      if (fs.existsSync(orgLogoPath)) return fs.readFileSync(orgLogoPath, 'utf-8');
    }
    const defaultPath = path.join(process.cwd(), 'public', 'assets', 'adventist-en--bluejay.svg');
    return fs.readFileSync(defaultPath, 'utf-8');
  } catch { return ''; }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const programId = params.id;
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
        organization: true,
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

    const org = program.organization;
    const churchName = {
      valueEn: org?.nameEn ?? 'Your Church Name',
      valueEs: org?.nameEs ?? 'Nombre de su Iglesia',
    };
    
    const orgDefaults = {
      coverVerseEn: org?.defaultCoverVerseEn ?? '',
      coverVerseEs: org?.defaultCoverVerseEs ?? '',
      announcementVerseEn: org?.defaultAnnouncementVerseEn ?? '',
      announcementVerseEs: org?.defaultAnnouncementVerseEs ?? '',
      welcomeMessageEn: org?.welcomeMessageEn ?? '',
      welcomeMessageEs: org?.welcomeMessageEs ?? '',
      websiteUrl: org?.websiteUrl ?? '',
      facebookUrl: org?.facebookUrl ?? '',
      seniorPastor: org?.seniorPastor ?? '',
      associatePastor: org?.associatePastor ?? '',
      sabbathSchoolTime: org?.sabbathSchoolTime ?? '9:15 AM',
      divineServiceTime: org?.divineServiceTime ?? '11:00 AM',
      youthTime: org?.youthTime ?? '4:30 PM',
      wednesdayTime: org?.wednesdayTime ?? '7:00 PM',
      fridayTime: org?.fridayTime ?? '7:00 PM',
      foodDistributionTime: org?.foodDistributionTime ?? 'Sunday 2:00 - 4:00 PM',
      addressLine1: org?.addressLine1 ?? '11568 Chamberlaine Way',
      city: org?.city ?? '',
      state: org?.state ?? 'CA',
      zip: org?.zip ?? '92301',
    };
    
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, { valueEn: string; valueEs: string }> = {};
    for (const s of settings ?? []) {
      settingsMap[s?.key ?? ''] = { valueEn: s?.valueEn ?? '', valueEs: s?.valueEs ?? '' };
    }
    const footerEn = settingsMap['pdf_footer_quote_en']?.valueEn ?? '';
    const footerEs = settingsMap['pdf_footer_quote_es']?.valueEs ?? '';
    const dateFormatted = formatDate(program?.date);
    const typeNames = PROGRAM_TYPE_NAMES[program?.type] ?? { en: program?.type, es: program?.type };

    const template = PROGRAM_TEMPLATES[program?.type as keyof typeof PROGRAM_TEMPLATES] ?? [];
    const templateMap: Record<string, { labelEn: string; labelEs: string }> = {};
    for (const t of template) {
      templateMap[t.key] = { labelEn: t.labelEn, labelEs: t.labelEs };
    }

    const ssItems = (program?.items ?? []).filter(i => i?.block === 'SABBATH_SCHOOL');
    const dwItems = (program?.items ?? []).filter(i => i?.block === 'DIVINE_WORSHIP');
    const mainItems = (program?.items ?? []).filter(i => i?.block === 'MAIN');
    const languageMode = program?.languageMode ?? 'BILINGUAL';

    const renderItem = (item: any) => {
      const hymn = item?.hymnPair;
      const labels = templateMap[item?.sectionKey] ?? { labelEn: item?.sectionKey ?? '', labelEs: item?.sectionKey ?? '' };
      const hasEnglish = hymn && hymn.numberEn !== null && hymn.titleEn !== null;
      
      let contentEn = '';
      if (hymn && hasEnglish) {
        contentEn = `#${hymn.numberEn} - ${hymn.titleEn}`;
      } else if (hymn && !hasEnglish) {
        contentEn = `<span style="color:#9ca3af;font-style:italic;">Solo español</span>`;
      } else if (item?.textEn) {
        contentEn = item.textEn;
      }
      if (item?.personName) {
        contentEn += contentEn ? ` <span style="font-style:italic;color:#666;">(${item.personName})</span>` : `<span style="font-style:italic;color:#666;">${item.personName}</span>`;
      }

      let contentEs = '';
      if (hymn) {
        contentEs = `#${hymn.numberEs} - ${hymn.titleEs}`;
      } else if (item?.textEs) {
        contentEs = item.textEs;
      }
      if (item?.personName) {
        contentEs += contentEs ? ` <span style="font-style:italic;color:#666;">(${item.personName})</span>` : `<span style="font-style:italic;color:#666;">${item.personName}</span>`;
      }

      if (languageMode === 'EN') {
        return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top;width:100%;"><div style="font-weight:600;color:#1e40af;margin-bottom:2px;font-size:11px;">${labels.labelEn}</div><div style="color:#374151;font-size:10px;">${contentEn || '—'}</div></td></tr>`;
      } else if (languageMode === 'ES') {
        return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top;width:100%;"><div style="font-weight:600;color:#1e40af;margin-bottom:2px;font-size:11px;">${labels.labelEs}</div><div style="color:#374151;font-size:10px;">${contentEs || '—'}</div></td></tr>`;
      } else {
        return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top;width:50%;"><div style="font-weight:600;color:#1e40af;margin-bottom:2px;font-size:11px;">${labels.labelEn}</div><div style="color:#374151;font-size:10px;">${contentEn || '—'}</div></td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top;width:50%;"><div style="font-weight:600;color:#1e40af;margin-bottom:2px;font-size:11px;">${labels.labelEs}</div><div style="color:#374151;font-size:10px;">${contentEs || '—'}</div></td></tr>`;
      }
    };

    const renderSection = (title: { en: string; es: string }, items: any[]) => {
      if (!items?.length) return '';
      let headerContent = '';
      if (languageMode === 'EN') {
        headerContent = `<div style="font-size:12px;">${title?.en}</div>`;
      } else if (languageMode === 'ES') {
        headerContent = `<div style="font-size:12px;">${title?.es}</div>`;
      } else {
        headerContent = `<div style="flex:1;font-size:12px;">${title?.en}</div><div style="flex:1;font-size:12px;">${title?.es}</div>`;
      }
      return `<div style="margin-bottom:15px;"><div style="display:flex;background:linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);color:white;font-weight:bold;padding:8px 12px;border-radius:6px 6px 0 0;">${headerContent}</div><table style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 6px 6px;"><tbody>${items?.map?.(renderItem)?.join?.('') ?? ''}</tbody></table></div>`;
    };

    let htmlContent = '';

    if (program?.type === 'SABBATH') {
      const logoSvg = getLogoSvg(org);
      const coverVerseEn = program.coverVerseEn || orgDefaults.coverVerseEn;
      const coverVerseEs = program.coverVerseEs || orgDefaults.coverVerseEs;
      const coverImageUrl = program.coverImageUrl || '';
      
      const renderProgramColumn = (sectionTitle: string, items: any[], lang: 'en' | 'es') => {
        if (!items?.length) return '';
        return `<div style="margin-bottom:20px;"><div style="font-family:'Brush Script MT', 'Lucida Handwriting', cursive;font-size:24px;font-weight:bold;color:#1e3a8a;text-align:center;margin-bottom:15px;border-bottom:2px solid #1e40af;padding-bottom:8px;">${sectionTitle}</div>${items?.map?.((item: any) => {
          const hymn = item?.hymnPair;
          const labels = templateMap[item?.sectionKey] ?? { labelEn: item?.sectionKey ?? '', labelEs: item?.sectionKey ?? '' };
          const label = lang === 'en' ? labels.labelEn : labels.labelEs;
          let content = '';
          let person = item?.personName || '';
          if (lang === 'en') {
            const hasEnglish = hymn && hymn.numberEn !== null && hymn.titleEn !== null;
            if (hymn && hasEnglish) content = `Hymn #${hymn.numberEn}`;
            else if (hymn && !hasEnglish) content = '';
            else if (item?.textEn) content = item.textEn;
          } else {
            if (hymn) content = `Himno #${hymn.numberEs}`;
            else if (item?.textEs) content = item.textEs;
          }
          return `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;font-size:13px;line-height:1.4;"><div style="font-weight:600;color:#1f2937;min-width:140px;">${label}</div><div style="flex:1;text-align:center;color:#374151;">${content}</div><div style="text-align:right;color:#6b7280;font-style:italic;min-width:120px;">${person}</div></div>`;
        })?.join?.('') ?? ''}</div>`;
      };

      const fullAddress = `${orgDefaults.addressLine1}, ${orgDefaults.city}, ${orgDefaults.state} ${orgDefaults.zip}`;
      
      htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page { size: Letter landscape; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #1f2937; background: white; } .page { width: 11in; height: 8.5in; page-break-after: always; position: relative; background: white; } .page:last-child { page-break-after: auto; }</style></head><body>
        <div class="page" style="display:flex;">
          <div style="width:5.5in;height:8.5in;padding:25px 30px;display:flex;flex-direction:column;border-right:1px solid #e5e7eb;">
            <div style="margin-bottom:18px;text-align:center;padding:15px;background:#fefce8;border-radius:8px;border:1px solid #fef08a;"><div style="font-family:'Brush Script MT', 'Lucida Handwriting', cursive;font-size:22px;color:#92400e;margin-bottom:8px;">Welcome / Bienvenidos</div><div style="font-size:11px;color:#374151;line-height:1.5;">${orgDefaults.welcomeMessageEn || 'Welcome to our worship service!'}</div><div style="font-size:10px;color:#6b7280;font-style:italic;line-height:1.5;margin-top:6px;">${orgDefaults.welcomeMessageEs || '¡Bienvenidos a nuestro servicio!'}</div></div>
            <div style="margin-bottom:18px;"><div style="text-align:center;margin-bottom:10px;"><div style="font-family:'Brush Script MT', 'Lucida Handwriting', cursive;font-size:20px;color:#1e3a8a;margin-bottom:2px;">Service Schedule</div><div style="font-size:11px;color:#6b7280;font-style:italic;">Horario de Cultos</div></div><div style="background:#f8fafc;border-radius:6px;padding:12px;border:1px solid #e5e7eb;font-size:11px;"><div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e5e7eb;"><span style="font-weight:600;color:#374151;">Sabbath School / Escuela Sabática</span><span style="color:#1e40af;font-weight:600;">${orgDefaults.sabbathSchoolTime}</span></div><div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e5e7eb;"><span style="font-weight:600;color:#374151;">Divine Service / Culto Divino</span><span style="color:#1e40af;font-weight:600;">${orgDefaults.divineServiceTime}</span></div><div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e5e7eb;"><span style="font-weight:600;color:#374151;">Youth / Jóvenes</span><span style="color:#1e40af;font-weight:600;">${orgDefaults.youthTime}</span></div><div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e5e7eb;"><span style="font-weight:600;color:#374151;">Wednesday Prayer</span><span style="color:#1e40af;font-weight:600;">${orgDefaults.wednesdayTime}</span></div><div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e5e7eb;"><span style="font-weight:600;color:#374151;">Friday Vespers</span><span style="color:#1e40af;font-weight:600;">${orgDefaults.fridayTime}</span></div><div style="display:flex;justify-content:space-between;padding:5px 0;"><span style="font-weight:600;color:#374151;">Food Distribution</span><span style="color:#1e40af;font-weight:600;">${orgDefaults.foodDistributionTime}</span></div></div></div>
            <div style="flex:1;margin-bottom:15px;"><div style="text-align:center;margin-bottom:10px;"><div style="font-family:'Brush Script MT', 'Lucida Handwriting', cursive;font-size:20px;color:#1e3a8a;margin-bottom:2px;">Announcements / Anuncios</div></div><div style="background:#f9fafb;border-radius:6px;padding:12px;border:1px solid #e5e7eb;min-height:120px;">${program.announcements ? `<div style="font-size:11px;color:#374151;line-height:1.6;white-space:pre-line;">${program.announcements}</div>` : `<div style="color:#9ca3af;font-style:italic;font-size:11px;text-align:center;">—</div>`}</div></div>
            <div style="text-align:center;padding:12px;background:#f0f9ff;border-radius:6px;"><div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Visit Us / Visítanos</div><div style="font-size:12px;font-weight:600;color:#1e40af;margin-bottom:4px;">${fullAddress}</div>${orgDefaults.websiteUrl ? `<div style="font-size:10px;color:#6b7280;">🌐 ${orgDefaults.websiteUrl.replace(/^https?:\/\//, '')}</div>` : ''}${orgDefaults.facebookUrl ? `<div style="font-size:10px;color:#6b7280;margin-top:2px;">📘 ${churchName.valueEn}</div>` : ''}</div>
          </div>
          <div style="width:5.5in;height:8.5in;display:flex;flex-direction:column;align-items:center;padding:30px;background:white;">
            <div style="text-align:center;margin-bottom:15px;"><div style="font-size:19px;font-weight:700;color:#1e40af;letter-spacing:0.5px;white-space:nowrap;">${churchName.valueEn}</div></div>
            <div style="text-align:center;margin-bottom:15px;width:85%;"><div style="font-size:13px;font-weight:600;color:#1e40af;">${org?.mottoEn || 'Proclaiming Christ. Preparing a People.'}</div><div style="font-size:12px;color:#3b82f6;font-style:italic;margin-top:3px;">${org?.mottoEs || 'Predicando a Cristo. Preparando un Pueblo.'}</div></div>
            <div style="width:50%;height:2px;background:linear-gradient(90deg, transparent, #1e40af, transparent);margin:10px 0;"></div>
            ${coverImageUrl ? `<div style="width:100%;max-height:300px;margin:15px 0;display:flex;justify-content:center;overflow:hidden;border-radius:8px;"><img src="${coverImageUrl}" style="max-width:100%;max-height:300px;object-fit:contain;border-radius:8px;" /></div>${coverVerseEn ? `<div style="text-align:center;margin-bottom:15px;padding:12px 15px;background:#f8fafc;border-radius:8px;width:90%;"><div style="font-size:12px;font-style:italic;color:#374151;line-height:1.5;">"${coverVerseEn}"</div>${coverVerseEs ? `<div style="font-size:11px;font-style:italic;color:#6b7280;margin-top:8px;line-height:1.4;">"${coverVerseEs}"</div>` : ''}</div>` : ''}` : `${coverVerseEn ? `<div style="text-align:center;margin:25px 0;padding:18px 20px;background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);border-radius:12px;width:85%;"><div style="font-size:14px;font-style:italic;color:#1e40af;line-height:1.6;">"${coverVerseEn}"</div>${coverVerseEs ? `<div style="font-size:12px;font-style:italic;color:#3b82f6;margin-top:12px;line-height:1.5;">"${coverVerseEs}"</div>` : ''}</div>` : `<div style="margin:40px 0;text-align:center;"><div style="font-size:72px;color:#1e40af;opacity:0.25;">✝</div></div>`}`}
            <div style="flex:1;"></div>
            <div style="text-align:center;margin-bottom:20px;"><div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Church Leadership / Liderazgo</div><div style="font-size:13px;color:#1f2937;margin-bottom:2px;"><strong>${orgDefaults.seniorPastor || 'Senior Pastor'}</strong></div><div style="font-size:13px;color:#1f2937;"><strong>${orgDefaults.associatePastor || 'Associate Pastor'}</strong></div></div>
            <div style="width:220px;">${logoSvg}</div>
          </div>
        </div>
        <div class="page" style="display:flex;padding:40px 30px 20px 30px;">
          <div style="width:50%;padding-right:25px;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;"><div style="text-align:center;margin-bottom:20px;"><div style="font-size:15px;font-weight:600;color:#1e40af;">${dateFormatted?.en}</div></div><div style="flex:1;">${renderProgramColumn('Sabbath School', ssItems, 'en')}${renderProgramColumn('Divine Worship', dwItems, 'en')}</div><div style="padding-top:15px;text-align:center;border-top:1px solid #e5e7eb;margin-top:10px;"><div style="font-size:11px;font-style:italic;color:#6b7280;">"The Lord is in His Holy Temple, let all the earth keep silent before Him."</div><div style="font-size:10px;color:#9ca3af;margin-top:2px;">(Habakkuk 2:20)</div></div></div>
          <div style="width:50%;padding-left:25px;display:flex;flex-direction:column;"><div style="text-align:center;margin-bottom:20px;"><div style="font-size:15px;font-weight:600;color:#1e40af;">${dateFormatted?.es}</div></div><div style="flex:1;">${renderProgramColumn('Escuela Sabática', ssItems, 'es')}${renderProgramColumn('Culto Divino', dwItems, 'es')}</div><div style="padding-top:15px;text-align:center;border-top:1px solid #e5e7eb;margin-top:10px;"><div style="font-size:11px;font-style:italic;color:#6b7280;">"Jehová está en su santo templo, calle delante de Él toda la tierra."</div><div style="font-size:10px;color:#9ca3af;margin-top:2px;">(Habacuc 2:20)</div></div></div>
        </div>
        <div style="position:fixed;bottom:10px;right:15px;"><svg viewBox="0 0 100 80" fill="none" width="20" height="16"><g><path d="M10 15 L10 70 Q30 65 48 70 L48 15 Q30 10 10 15" fill="white" stroke="#1E3A8A" stroke-width="2"/><path d="M52 15 L52 70 Q70 65 90 70 L90 15 Q70 10 52 15" fill="white" stroke="#1E3A8A" stroke-width="2"/><rect x="47" y="12" width="6" height="60" fill="#1E3A8A"/><path d="M50 12 L50 75" stroke="#C9A227" stroke-width="3" stroke-linecap="round"/></g></svg></div>
      </body></html>`;
    } else {
      let contentHtml = '';
      let headerHtml = '';
      if (languageMode === 'EN') headerHtml = `<div style="font-size:16px;">English</div>`;
      else if (languageMode === 'ES') headerHtml = `<div style="font-size:16px;">Español</div>`;
      else headerHtml = `<div style="flex:1;font-size:16px;">English</div><div style="flex:1;font-size:16px;">Español</div>`;
      contentHtml = `<div style="margin-bottom:25px;"><div style="display:flex;background:linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);color:white;font-weight:bold;padding:12px 15px;border-radius:8px 8px 0 0;">${headerHtml}</div><table style="width:100%;border-collapse:collapse;background:#faf5ff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;"><tbody>${mainItems?.map?.(renderItem)?.join?.('') ?? ''}</tbody></table></div>`;
      htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 30px 40px; color: #1f2937; background: white; } .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #7c3aed; } .church-name { font-size: 22px; font-weight: bold; color: #5b21b6; margin-bottom: 8px; letter-spacing: 0.5px; } .church-name-es { font-size: 18px; color: #7c3aed; margin-bottom: 12px; } .program-type { font-size: 20px; color: #4b5563; margin-bottom: 8px; font-weight: 600; } .date { font-size: 14px; color: #6b7280; } .content { margin-bottom: 30px; } .footer { text-align: center; font-style: italic; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; } .mwp-icon { position: fixed; bottom: 10px; right: 15px; }</style></head><body><div class="header"><div class="church-name">${churchName?.valueEn ?? ''}</div><div class="church-name-es">${churchName?.valueEs ?? ''}</div><div class="program-type">${typeNames?.en} / ${typeNames?.es}</div><div class="date">${dateFormatted?.en}<br/>${dateFormatted?.es}</div></div><div class="content">${contentHtml}</div>${footerEn || footerEs ? `<div class="footer">${footerEn}${footerEn && footerEs ? '<br/>' : ''}${footerEs}</div>` : ''}<div class="mwp-icon"><svg viewBox="0 0 100 80" fill="none" width="20" height="16"><g><path d="M10 15 L10 70 Q30 65 48 70 L48 15 Q30 10 10 15" fill="white" stroke="#1E3A8A" stroke-width="2"/><path d="M52 15 L52 70 Q70 65 90 70 L90 15 Q70 10 52 15" fill="white" stroke="#1E3A8A" stroke-width="2"/><rect x="47" y="12" width="6" height="60" fill="#1E3A8A"/><path d="M50 12 L50 75" stroke="#C9A227" stroke-width="3" stroke-linecap="round"/></g></svg></div></body></html>`;
    }

    const pdfOptions = program?.type === 'SABBATH' 
      ? { format: 'Letter', landscape: true, margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' } }
      : { format: 'Letter', margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' } };

    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: htmlContent,
        pdf_options: pdfOptions,
        base_url: process.env.NEXTAUTH_URL ?? '',
      }),
    });

    if (!createResponse?.ok) {
      return NextResponse.json({ error: 'Failed to create PDF request' }, { status: 500 });
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json({ error: 'No request ID returned' }, { status: 500 });
    }

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
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="program.pdf"',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      } else if (status === 'FAILED') {
        return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
      }
      attempts++;
    }
    return NextResponse.json({ error: 'PDF generation timed out' }, { status: 500 });
  } catch (error) {
    console.error('PDF preview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
