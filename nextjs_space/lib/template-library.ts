/**
 * =============================================================================
 * TEMPLATE LIBRARY UTILITIES
 * Handles template filtering, cloning, and organization-specific templates
 * =============================================================================
 */

import { prisma } from './db';
import { TemplateScope, Denomination } from '@prisma/client';

// Map denomination string to enum value
export function mapDenominationToEnum(denomination: string): Denomination {
  const mapping: Record<string, Denomination> = {
    'Seventh-day Adventist': 'SDA',
    'seventh-day adventist': 'SDA',
    'SDA': 'SDA',
    'sda': 'SDA',
    'Baptist': 'BAPTIST',
    'baptist': 'BAPTIST',
    'Methodist': 'METHODIST',
    'methodist': 'METHODIST',
    'Presbyterian': 'PRESBYTERIAN',
    'presbyterian': 'PRESBYTERIAN',
    'Lutheran': 'LUTHERAN',
    'lutheran': 'LUTHERAN',
    'Pentecostal': 'PENTECOSTAL',
    'pentecostal': 'PENTECOSTAL',
    'Catholic': 'CATHOLIC',
    'catholic': 'CATHOLIC',
    'Non-denominational': 'NON_DENOMINATIONAL',
    'non-denominational': 'NON_DENOMINATIONAL',
    'OTHER': 'OTHER',
    'other': 'OTHER',
  };
  return mapping[denomination] || 'CHRISTIAN';
}

/**
 * Get the effective denomination for template filtering.
 * OTHER denomination uses CHRISTIAN templates.
 */
export function getEffectiveDenominationForTemplates(denomination: Denomination): Denomination {
  // OTHER uses the same templates as CHRISTIAN
  if (denomination === 'OTHER') {
    return 'CHRISTIAN';
  }
  return denomination;
}

/**
 * Get templates available to an organization based on their denomination
 * Returns: GLOBAL templates + matching DENOMINATION templates + their ORG_CUSTOM templates
 */
export async function getTemplatesForOrganization(
  organizationId: string,
  denomination: Denomination = 'CHRISTIAN'
) {
  const templates = await prisma.ceremonyTemplate.findMany({
    where: {
      isActive: true,
      OR: [
        // GLOBAL templates (available to all)
        { scope: 'GLOBAL' },
        // DENOMINATION templates matching their denomination
        { scope: 'DENOMINATION', denomination },
        // Their own custom templates
        { scope: 'ORG_CUSTOM', organizationId },
      ],
    },
    include: {
      sections: { orderBy: { order: 'asc' } },
    },
    orderBy: [
      { scope: 'asc' },
      { category: 'asc' },
      { name: 'asc' },
    ],
  });

  return templates;
}

/**
 * Clone templates for a new organization
 * - Clones all GLOBAL templates as read-only references
 * - Clones matching DENOMINATION templates as read-only references
 * 
 * Note: We don't actually duplicate templates in the database.
 * Instead, organizations access GLOBAL/DENOMINATION templates directly.
 * Only ORG_CUSTOM templates are created as copies when explicitly requested.
 */
export async function setupTemplatesForOrganization(
  organizationId: string,
  denomination: Denomination = 'CHRISTIAN'
): Promise<{ globalCount: number; denominationCount: number }> {
  // For now, organizations access templates by query filtering.
  // No actual cloning needed - just return counts for logging.
  
  const globalCount = await prisma.ceremonyTemplate.count({
    where: { scope: 'GLOBAL', isActive: true },
  });
  
  const denominationCount = await prisma.ceremonyTemplate.count({
    where: { scope: 'DENOMINATION', denomination, isActive: true },
  });
  
  console.log(`[Template Library] Org ${organizationId} has access to:`);
  console.log(`  - ${globalCount} GLOBAL templates`);
  console.log(`  - ${denominationCount} ${denomination} templates`);
  
  return { globalCount, denominationCount };
}

/**
 * Clone a template as an organization's custom template
 * This creates a full copy that the org can modify
 */
export async function cloneTemplateForOrganization(
  sourceTemplateId: string,
  organizationId: string
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    // Get the source template with sections
    const source = await prisma.ceremonyTemplate.findUnique({
      where: { id: sourceTemplateId },
      include: { sections: { orderBy: { order: 'asc' } } },
    });

    if (!source) {
      return { success: false, error: 'Source template not found' };
    }

    // Generate a unique templateId for the clone
    const timestamp = Date.now();
    const newTemplateId = `${source.templateId}_CUSTOM_${timestamp}`;

    // Create the cloned template
    const cloned = await prisma.ceremonyTemplate.create({
      data: {
        templateId: newTemplateId,
        category: source.category,
        name: `${source.name} (Custom)`,
        nameEs: source.nameEs ? `${source.nameEs} (Personalizado)` : null,
        description: source.description,
        descriptionEs: source.descriptionEs,
        variables: source.variables,
        scope: 'ORG_CUSTOM',
        denomination: source.denomination,
        organizationId,
        sourceTemplateId: source.id,
        isActive: true,
        sections: {
          create: source.sections.map((s) => ({
            order: s.order,
            title: s.title,
            role: s.role,
            durationMin: s.durationMin,
            optional: s.optional,
            notes: s.notes,
          })),
        },
      },
    });

    return { success: true, templateId: cloned.id };
  } catch (error) {
    console.error('Error cloning template:', error);
    return { success: false, error: 'Failed to clone template' };
  }
}

/**
 * Get template counts by scope for an organization
 */
export async function getTemplateCountsForOrganization(
  organizationId: string,
  denomination: Denomination = 'CHRISTIAN'
) {
  const [globalCount, denominationCount, customCount] = await Promise.all([
    prisma.ceremonyTemplate.count({ where: { scope: 'GLOBAL', isActive: true } }),
    prisma.ceremonyTemplate.count({ where: { scope: 'DENOMINATION', denomination, isActive: true } }),
    prisma.ceremonyTemplate.count({ where: { scope: 'ORG_CUSTOM', organizationId, isActive: true } }),
  ]);

  return {
    global: globalCount,
    denomination: denominationCount,
    custom: customCount,
    total: globalCount + denominationCount + customCount,
  };
}
