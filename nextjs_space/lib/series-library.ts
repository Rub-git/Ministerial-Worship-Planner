/**
 * Phase 4.5: Dual Series Engine - Series Library
 * 
 * Provides predefined Adventist doctrinal series and dynamic series generation.
 * This module supports both curated series from the library and custom
 * dynamically-generated series based on user-defined themes.
 * 
 * System Layering Priority:
 * 1. Adventist doctrinal weighting (base)
 * 2. SpecialTheme weighting (if applicable)
 * 3. Series weighting (this module)
 * 4. Balanced logic
 * 5. History filter
 */

import type { HymnCategory } from './types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface WeekConfig {
  weekNumber: number;
  title: string;
  titleEs: string;
  theme: string;
  themeEs: string;
  preferredCategories: HymnCategory[];
  secondaryCategories: HymnCategory[];
  categoryBoosts: Record<HymnCategory, number>;
}

export interface PredefinedSeries {
  id: string;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  theme: string;
  totalWeeks: number;
  weekProgression: WeekConfig[];
  closingProgression: HymnCategory[];
  keywords: string[];
}

export interface DynamicSeriesRequest {
  customTheme: string;
  totalWeeks?: number;
  startingCategory?: HymnCategory;
}

export interface DynamicSeriesResult {
  suggestedTitle: string;
  suggestedTitleEs: string;
  doctrinalProgressionMap: HymnCategory[];
  weekThemes: Array<{ en: string; es: string }>;
  weekConfigs: WeekConfig[];
  categoryWeightingPerWeek: Array<Record<HymnCategory, number>>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Category boost values for series scoring
export const SERIES_LIBRARY_BOOSTS = {
  PRIMARY: 20,      // +20 for primary/preferred categories
  SECONDARY: 12,    // +12 for secondary/related categories
  PROGRESSION: 15,  // +15 for matching week progression
  CLOSING: 10,      // +10 for closing category match
};

// Category relationships for dynamic generation
const CATEGORY_RELATIONSHIPS: Record<string, HymnCategory[]> = {
  faith: ['FAITH', 'HOPE', 'DEDICATION', 'PRAYER'],
  hope: ['HOPE', 'FAITH', 'SECOND_COMING', 'SALVATION'],
  love: ['LOVE', 'SALVATION', 'SACRIFICE', 'SERVICE'],
  prayer: ['PRAYER', 'FAITH', 'DEDICATION', 'HOLY_SPIRIT'],
  praise: ['PRAISE', 'GRATITUDE', 'WORSHIP', 'VICTORY'],
  salvation: ['SALVATION', 'FAITH', 'HOPE', 'RESURRECTION'],
  mission: ['MISSION', 'CALL', 'DEDICATION', 'SERVICE'],
  grace: ['SALVATION', 'FAITH', 'HOPE', 'DEDICATION'],
  holy_spirit: ['HOLY_SPIRIT', 'PRAYER', 'DEDICATION', 'FAITH'],
  second_coming: ['SECOND_COMING', 'HOPE', 'FAITH', 'DEDICATION'],
  resurrection: ['RESURRECTION', 'HOPE', 'SALVATION', 'VICTORY'],
  sabbath: ['SABBATH', 'PRAISE', 'DEDICATION', 'WORSHIP'],
  family: ['LOVE', 'DEDICATION', 'PRAYER', 'SERVICE'],
  stewardship: ['DEDICATION', 'SERVICE', 'GRATITUDE', 'MISSION'],
  discipleship: ['DEDICATION', 'FAITH', 'MISSION', 'PRAYER'],
  worship: ['WORSHIP', 'PRAISE', 'GRATITUDE', 'DEDICATION'],
  healing: ['PRAYER', 'FAITH', 'HOPE', 'SALVATION'],
  truth: ['FAITH', 'SCRIPTURE', 'DEDICATION', 'HOPE'],
  victory: ['VICTORY', 'FAITH', 'HOPE', 'SECOND_COMING'],
  commitment: ['DEDICATION', 'FAITH', 'CALL', 'MISSION'],
};

// Theme title mappings for dynamic generation
const THEME_TITLES: Record<string, { en: string; es: string }> = {
  faith: { en: 'Walking in Faith', es: 'Caminando en Fe' },
  hope: { en: 'Living in Hope', es: 'Viviendo en Esperanza' },
  love: { en: 'Love Divine', es: 'Amor Divino' },
  prayer: { en: 'Power of Prayer', es: 'El Poder de la Oración' },
  praise: { en: 'Songs of Praise', es: 'Cantos de Alabanza' },
  salvation: { en: 'The Way of Salvation', es: 'El Camino de Salvación' },
  mission: { en: 'Called to Serve', es: 'Llamados a Servir' },
  grace: { en: 'Amazing Grace', es: 'Sublime Gracia' },
  holy_spirit: { en: 'Spirit-Led Life', es: 'Vida Guiada por el Espíritu' },
  second_coming: { en: 'Ready for His Return', es: 'Listos para Su Regreso' },
  resurrection: { en: 'Risen with Christ', es: 'Resucitados con Cristo' },
  sabbath: { en: 'Sabbath Blessings', es: 'Bendiciones del Sábado' },
  family: { en: 'Family in Christ', es: 'Familia en Cristo' },
  stewardship: { en: 'Faithful Stewards', es: 'Mayordomos Fieles' },
  discipleship: { en: 'Following Jesus', es: 'Siguiendo a Jesús' },
  worship: { en: 'True Worship', es: 'Adoración Verdadera' },
  healing: { en: 'Divine Healing', es: 'Sanidad Divina' },
  truth: { en: 'Pillars of Truth', es: 'Pilares de la Verdad' },
  victory: { en: 'Victory in Christ', es: 'Victoria en Cristo' },
  commitment: { en: 'Total Commitment', es: 'Compromiso Total' },
};

// Week theme templates for dynamic generation
const WEEK_THEME_TEMPLATES: Record<HymnCategory, { en: string; es: string }> = {
  FAITH: { en: 'Foundation of Faith', es: 'Fundamento de Fe' },
  HOPE: { en: 'Hope for Tomorrow', es: 'Esperanza para el Mañana' },
  LOVE: { en: 'Love Overflowing', es: 'Amor que Desborda' },
  PRAYER: { en: 'Communion with God', es: 'Comunión con Dios' },
  PRAISE: { en: 'Heart of Praise', es: 'Corazón de Alabanza' },
  SALVATION: { en: 'Gift of Grace', es: 'Don de Gracia' },
  MISSION: { en: 'Sent to Serve', es: 'Enviados a Servir' },
  HOLY_SPIRIT: { en: 'Spirit Empowerment', es: 'Poder del Espíritu' },
  SECOND_COMING: { en: 'Blessed Hope', es: 'Bendita Esperanza' },
  RESURRECTION: { en: 'Living Hope', es: 'Esperanza Viva' },
  SABBATH: { en: 'Sacred Rest', es: 'Descanso Sagrado' },
  DEDICATION: { en: 'Surrendered Life', es: 'Vida Rendida' },
  CALL: { en: 'Divine Calling', es: 'Llamado Divino' },
  VICTORY: { en: 'Overcoming Faith', es: 'Fe Vencedora' },
  GRATITUDE: { en: 'Grateful Heart', es: 'Corazón Agradecido' },
  SERVICE: { en: 'Servant Heart', es: 'Corazón de Siervo' },
  WORSHIP: { en: 'True Worship', es: 'Adoración Verdadera' },
  SACRIFICE: { en: 'Living Sacrifice', es: 'Sacrificio Vivo' },
  COMMUNION: { en: 'Breaking Bread', es: 'Partiendo el Pan' },
  CHRISTMAS: { en: 'Emmanuel', es: 'Emmanuel' },
  SCRIPTURE: { en: 'Living Word', es: 'Palabra Viva' },
  GENERAL: { en: 'Walking Together', es: 'Caminando Juntos' },
};

// ============================================================================
// PREDEFINED ADVENTIST DOCTRINAL SERIES
// ============================================================================

export const PREDEFINED_SERIES: PredefinedSeries[] = [
  // 1. Living by Faith in the Last Days (4 weeks)
  {
    id: 'faith-last-days',
    title: 'Living by Faith in the Last Days',
    titleEs: 'Viviendo por Fe en los Últimos Días',
    description: 'A journey through faith as we prepare for Christ\'s return',
    descriptionEs: 'Un recorrido por la fe mientras nos preparamos para el regreso de Cristo',
    theme: 'FAITH',
    totalWeeks: 4,
    weekProgression: [
      {
        weekNumber: 1,
        title: 'The Foundation of Faith',
        titleEs: 'El Fundamento de la Fe',
        theme: 'Establishing faith in God\'s Word',
        themeEs: 'Estableciendo fe en la Palabra de Dios',
        preferredCategories: ['FAITH', 'SCRIPTURE'],
        secondaryCategories: ['HOPE', 'PRAYER'],
        categoryBoosts: { FAITH: 20, SCRIPTURE: 15, HOPE: 10, PRAYER: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 2,
        title: 'Faith Through Trials',
        titleEs: 'Fe a Través de las Pruebas',
        theme: 'Trusting God in difficulties',
        themeEs: 'Confiando en Dios en las dificultades',
        preferredCategories: ['HOPE', 'FAITH'],
        secondaryCategories: ['PRAYER', 'VICTORY'],
        categoryBoosts: { HOPE: 20, FAITH: 15, PRAYER: 10, VICTORY: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 3,
        title: 'Walking by Faith',
        titleEs: 'Caminando por Fe',
        theme: 'Living out our faith daily',
        themeEs: 'Viviendo nuestra fe diariamente',
        preferredCategories: ['DEDICATION', 'FAITH'],
        secondaryCategories: ['SERVICE', 'PRAYER'],
        categoryBoosts: { DEDICATION: 20, FAITH: 15, SERVICE: 10, PRAYER: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 4,
        title: 'Faith and the Second Coming',
        titleEs: 'Fe y la Segunda Venida',
        theme: 'Keeping faith until Christ returns',
        themeEs: 'Manteniendo la fe hasta que Cristo regrese',
        preferredCategories: ['SECOND_COMING', 'HOPE'],
        secondaryCategories: ['FAITH', 'DEDICATION'],
        categoryBoosts: { SECOND_COMING: 20, HOPE: 15, FAITH: 10, DEDICATION: 8 } as Record<HymnCategory, number>,
      },
    ],
    closingProgression: ['FAITH', 'HOPE', 'DEDICATION', 'SECOND_COMING'],
    keywords: ['faith', 'trust', 'believe', 'last days', 'second coming', 'fe', 'confianza'],
  },

  // 2. The Gift of Salvation (4 weeks)
  {
    id: 'gift-salvation',
    title: 'The Gift of Salvation',
    titleEs: 'El Don de la Salvación',
    description: 'Understanding God\'s plan of redemption through Christ',
    descriptionEs: 'Entendiendo el plan de redención de Dios a través de Cristo',
    theme: 'SALVATION',
    totalWeeks: 4,
    weekProgression: [
      {
        weekNumber: 1,
        title: 'Lost and Found',
        titleEs: 'Perdido y Encontrado',
        theme: 'Our need for a Savior',
        themeEs: 'Nuestra necesidad de un Salvador',
        preferredCategories: ['SALVATION', 'FAITH'],
        secondaryCategories: ['LOVE', 'HOPE'],
        categoryBoosts: { SALVATION: 20, FAITH: 15, LOVE: 10, HOPE: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 2,
        title: 'The Cross of Calvary',
        titleEs: 'La Cruz del Calvario',
        theme: 'Christ\'s sacrifice for us',
        themeEs: 'El sacrificio de Cristo por nosotros',
        preferredCategories: ['SACRIFICE', 'SALVATION'],
        secondaryCategories: ['LOVE', 'GRATITUDE'],
        categoryBoosts: { SACRIFICE: 20, SALVATION: 15, LOVE: 10, GRATITUDE: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 3,
        title: 'Victory Over Death',
        titleEs: 'Victoria Sobre la Muerte',
        theme: 'The resurrection and its meaning',
        themeEs: 'La resurrección y su significado',
        preferredCategories: ['RESURRECTION', 'VICTORY'],
        secondaryCategories: ['HOPE', 'SALVATION'],
        categoryBoosts: { RESURRECTION: 20, VICTORY: 15, HOPE: 10, SALVATION: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 4,
        title: 'Living as the Redeemed',
        titleEs: 'Viviendo como Redimidos',
        theme: 'Transformed by grace',
        themeEs: 'Transformados por la gracia',
        preferredCategories: ['DEDICATION', 'GRATITUDE'],
        secondaryCategories: ['SERVICE', 'PRAISE'],
        categoryBoosts: { DEDICATION: 20, GRATITUDE: 15, SERVICE: 10, PRAISE: 8 } as Record<HymnCategory, number>,
      },
    ],
    closingProgression: ['SALVATION', 'SACRIFICE', 'RESURRECTION', 'DEDICATION'],
    keywords: ['salvation', 'grace', 'cross', 'resurrection', 'redeemed', 'salvación', 'gracia', 'cruz'],
  },

  // 3. The Blessed Hope - Second Coming (4 weeks)
  {
    id: 'blessed-hope',
    title: 'The Blessed Hope',
    titleEs: 'La Bendita Esperanza',
    description: 'Preparing for Christ\'s glorious return',
    descriptionEs: 'Preparándonos para el glorioso regreso de Cristo',
    theme: 'SECOND_COMING',
    totalWeeks: 4,
    weekProgression: [
      {
        weekNumber: 1,
        title: 'The Promise of His Return',
        titleEs: 'La Promesa de Su Regreso',
        theme: 'Christ\'s promise to return',
        themeEs: 'La promesa de Cristo de regresar',
        preferredCategories: ['SECOND_COMING', 'HOPE'],
        secondaryCategories: ['FAITH', 'SCRIPTURE'],
        categoryBoosts: { SECOND_COMING: 20, HOPE: 15, FAITH: 10, SCRIPTURE: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 2,
        title: 'Signs of the Times',
        titleEs: 'Señales de los Tiempos',
        theme: 'Recognizing prophetic fulfillment',
        themeEs: 'Reconociendo el cumplimiento profético',
        preferredCategories: ['SCRIPTURE', 'SECOND_COMING'],
        secondaryCategories: ['FAITH', 'HOPE'],
        categoryBoosts: { SCRIPTURE: 20, SECOND_COMING: 15, FAITH: 10, HOPE: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 3,
        title: 'Ready and Waiting',
        titleEs: 'Listos y Esperando',
        theme: 'Living in readiness',
        themeEs: 'Viviendo en preparación',
        preferredCategories: ['DEDICATION', 'FAITH'],
        secondaryCategories: ['PRAYER', 'SERVICE'],
        categoryBoosts: { DEDICATION: 20, FAITH: 15, PRAYER: 10, SERVICE: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 4,
        title: 'The Glorious Appearing',
        titleEs: 'La Gloriosa Aparición',
        theme: 'The joy of His coming',
        themeEs: 'El gozo de Su venida',
        preferredCategories: ['SECOND_COMING', 'VICTORY'],
        secondaryCategories: ['PRAISE', 'HOPE'],
        categoryBoosts: { SECOND_COMING: 20, VICTORY: 15, PRAISE: 10, HOPE: 8 } as Record<HymnCategory, number>,
      },
    ],
    closingProgression: ['HOPE', 'FAITH', 'DEDICATION', 'SECOND_COMING'],
    keywords: ['second coming', 'return', 'blessed hope', 'prophecy', 'segunda venida', 'regreso', 'esperanza'],
  },

  // 4. The Sabbath Experience (4 weeks)
  {
    id: 'sabbath-experience',
    title: 'The Sabbath Experience',
    titleEs: 'La Experiencia del Sábado',
    description: 'Discovering the joy and meaning of God\'s holy day',
    descriptionEs: 'Descubriendo el gozo y significado del día santo de Dios',
    theme: 'SABBATH',
    totalWeeks: 4,
    weekProgression: [
      {
        weekNumber: 1,
        title: 'Creation\'s Memorial',
        titleEs: 'Memorial de la Creación',
        theme: 'The Sabbath from Eden',
        themeEs: 'El Sábado desde el Edén',
        preferredCategories: ['SABBATH', 'PRAISE'],
        secondaryCategories: ['WORSHIP', 'GRATITUDE'],
        categoryBoosts: { SABBATH: 20, PRAISE: 15, WORSHIP: 10, GRATITUDE: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 2,
        title: 'A Sign of Sanctification',
        titleEs: 'Una Señal de Santificación',
        theme: 'The Sabbath sanctifies us',
        themeEs: 'El Sábado nos santifica',
        preferredCategories: ['DEDICATION', 'SABBATH'],
        secondaryCategories: ['HOLY_SPIRIT', 'PRAYER'],
        categoryBoosts: { DEDICATION: 20, SABBATH: 15, HOLY_SPIRIT: 10, PRAYER: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 3,
        title: 'Rest in Christ',
        titleEs: 'Descanso en Cristo',
        theme: 'Spiritual rest and renewal',
        themeEs: 'Descanso y renovación espiritual',
        preferredCategories: ['FAITH', 'SABBATH'],
        secondaryCategories: ['HOPE', 'PRAYER'],
        categoryBoosts: { FAITH: 20, SABBATH: 15, HOPE: 10, PRAYER: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 4,
        title: 'Sabbath Delight',
        titleEs: 'Deleite Sabático',
        theme: 'Calling the Sabbath a delight',
        themeEs: 'Llamando al Sábado delicia',
        preferredCategories: ['WORSHIP', 'PRAISE'],
        secondaryCategories: ['SABBATH', 'GRATITUDE'],
        categoryBoosts: { WORSHIP: 20, PRAISE: 15, SABBATH: 10, GRATITUDE: 8 } as Record<HymnCategory, number>,
      },
    ],
    closingProgression: ['SABBATH', 'DEDICATION', 'FAITH', 'WORSHIP'],
    keywords: ['sabbath', 'rest', 'holy day', 'creation', 'sábado', 'descanso', 'santo'],
  },

  // 5. Spirit-Led Living (4 weeks)
  {
    id: 'spirit-led',
    title: 'Spirit-Led Living',
    titleEs: 'Vida Guiada por el Espíritu',
    description: 'Walking in the power of the Holy Spirit',
    descriptionEs: 'Caminando en el poder del Espíritu Santo',
    theme: 'HOLY_SPIRIT',
    totalWeeks: 4,
    weekProgression: [
      {
        weekNumber: 1,
        title: 'The Promised Comforter',
        titleEs: 'El Consolador Prometido',
        theme: 'Receiving the Holy Spirit',
        themeEs: 'Recibiendo al Espíritu Santo',
        preferredCategories: ['HOLY_SPIRIT', 'PRAYER'],
        secondaryCategories: ['FAITH', 'HOPE'],
        categoryBoosts: { HOLY_SPIRIT: 20, PRAYER: 15, FAITH: 10, HOPE: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 2,
        title: 'Fruits of the Spirit',
        titleEs: 'Frutos del Espíritu',
        theme: 'Character transformation',
        themeEs: 'Transformación del carácter',
        preferredCategories: ['DEDICATION', 'LOVE'],
        secondaryCategories: ['HOLY_SPIRIT', 'SERVICE'],
        categoryBoosts: { DEDICATION: 20, LOVE: 15, HOLY_SPIRIT: 10, SERVICE: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 3,
        title: 'Gifts for Ministry',
        titleEs: 'Dones para el Ministerio',
        theme: 'Spiritual gifts in service',
        themeEs: 'Dones espirituales en el servicio',
        preferredCategories: ['SERVICE', 'MISSION'],
        secondaryCategories: ['CALL', 'HOLY_SPIRIT'],
        categoryBoosts: { SERVICE: 20, MISSION: 15, CALL: 10, HOLY_SPIRIT: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 4,
        title: 'Empowered Witness',
        titleEs: 'Testigo con Poder',
        theme: 'Sharing Christ through the Spirit',
        themeEs: 'Compartiendo a Cristo por el Espíritu',
        preferredCategories: ['MISSION', 'FAITH'],
        secondaryCategories: ['HOLY_SPIRIT', 'VICTORY'],
        categoryBoosts: { MISSION: 20, FAITH: 15, HOLY_SPIRIT: 10, VICTORY: 8 } as Record<HymnCategory, number>,
      },
    ],
    closingProgression: ['HOLY_SPIRIT', 'DEDICATION', 'SERVICE', 'MISSION'],
    keywords: ['holy spirit', 'spirit', 'power', 'gifts', 'espíritu santo', 'poder', 'dones'],
  },

  // 6. Called to Mission (4 weeks)
  {
    id: 'called-mission',
    title: 'Called to Mission',
    titleEs: 'Llamados a la Misión',
    description: 'Responding to God\'s call to share the gospel',
    descriptionEs: 'Respondiendo al llamado de Dios para compartir el evangelio',
    theme: 'MISSION',
    totalWeeks: 4,
    weekProgression: [
      {
        weekNumber: 1,
        title: 'The Great Commission',
        titleEs: 'La Gran Comisión',
        theme: 'Christ\'s mandate to go',
        themeEs: 'El mandato de Cristo de ir',
        preferredCategories: ['CALL', 'MISSION'],
        secondaryCategories: ['FAITH', 'DEDICATION'],
        categoryBoosts: { CALL: 20, MISSION: 15, FAITH: 10, DEDICATION: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 2,
        title: 'Preparing Hearts',
        titleEs: 'Preparando Corazones',
        theme: 'Personal preparation for witness',
        themeEs: 'Preparación personal para testificar',
        preferredCategories: ['PRAYER', 'DEDICATION'],
        secondaryCategories: ['HOLY_SPIRIT', 'FAITH'],
        categoryBoosts: { PRAYER: 20, DEDICATION: 15, HOLY_SPIRIT: 10, FAITH: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 3,
        title: 'Serving with Compassion',
        titleEs: 'Sirviendo con Compasión',
        theme: 'Meeting needs, sharing love',
        themeEs: 'Supliendo necesidades, compartiendo amor',
        preferredCategories: ['SERVICE', 'LOVE'],
        secondaryCategories: ['MISSION', 'DEDICATION'],
        categoryBoosts: { SERVICE: 20, LOVE: 15, MISSION: 10, DEDICATION: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 4,
        title: 'Until the Harvest',
        titleEs: 'Hasta la Cosecha',
        theme: 'Faithful until the end',
        themeEs: 'Fieles hasta el fin',
        preferredCategories: ['MISSION', 'SECOND_COMING'],
        secondaryCategories: ['HOPE', 'FAITH'],
        categoryBoosts: { MISSION: 20, SECOND_COMING: 15, HOPE: 10, FAITH: 8 } as Record<HymnCategory, number>,
      },
    ],
    closingProgression: ['CALL', 'DEDICATION', 'SERVICE', 'MISSION'],
    keywords: ['mission', 'evangelism', 'witness', 'go', 'misión', 'evangelismo', 'testificar', 'ir'],
  },

  // 7. Prayer and Communion with God (4 weeks)
  {
    id: 'prayer-communion',
    title: 'Prayer and Communion with God',
    titleEs: 'Oración y Comunión con Dios',
    description: 'Deepening our prayer life and relationship with God',
    descriptionEs: 'Profundizando nuestra vida de oración y relación con Dios',
    theme: 'PRAYER',
    totalWeeks: 4,
    weekProgression: [
      {
        weekNumber: 1,
        title: 'Drawing Near to God',
        titleEs: 'Acercándonos a Dios',
        theme: 'The invitation to pray',
        themeEs: 'La invitación a orar',
        preferredCategories: ['PRAYER', 'FAITH'],
        secondaryCategories: ['DEDICATION', 'WORSHIP'],
        categoryBoosts: { PRAYER: 20, FAITH: 15, DEDICATION: 10, WORSHIP: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 2,
        title: 'Praying with Power',
        titleEs: 'Orando con Poder',
        theme: 'Effective, fervent prayer',
        themeEs: 'Oración eficaz y ferviente',
        preferredCategories: ['PRAYER', 'HOLY_SPIRIT'],
        secondaryCategories: ['FAITH', 'VICTORY'],
        categoryBoosts: { PRAYER: 20, HOLY_SPIRIT: 15, FAITH: 10, VICTORY: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 3,
        title: 'Listening to God',
        titleEs: 'Escuchando a Dios',
        theme: 'Prayer as two-way communication',
        themeEs: 'La oración como comunicación bidireccional',
        preferredCategories: ['SCRIPTURE', 'PRAYER'],
        secondaryCategories: ['FAITH', 'DEDICATION'],
        categoryBoosts: { SCRIPTURE: 20, PRAYER: 15, FAITH: 10, DEDICATION: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 4,
        title: 'A Lifestyle of Prayer',
        titleEs: 'Un Estilo de Vida de Oración',
        theme: 'Pray without ceasing',
        themeEs: 'Orad sin cesar',
        preferredCategories: ['DEDICATION', 'PRAYER'],
        secondaryCategories: ['FAITH', 'PRAISE'],
        categoryBoosts: { DEDICATION: 20, PRAYER: 15, FAITH: 10, PRAISE: 8 } as Record<HymnCategory, number>,
      },
    ],
    closingProgression: ['PRAYER', 'FAITH', 'DEDICATION', 'PRAISE'],
    keywords: ['prayer', 'communion', 'talk', 'listen', 'oración', 'comunión', 'hablar', 'escuchar'],
  },

  // 8. Songs of Praise and Worship (4 weeks)
  {
    id: 'praise-worship',
    title: 'Songs of Praise and Worship',
    titleEs: 'Cantos de Alabanza y Adoración',
    description: 'Exploring the purpose and power of worship',
    descriptionEs: 'Explorando el propósito y poder de la adoración',
    theme: 'PRAISE',
    totalWeeks: 4,
    weekProgression: [
      {
        weekNumber: 1,
        title: 'Created to Worship',
        titleEs: 'Creados para Adorar',
        theme: 'The purpose of worship',
        themeEs: 'El propósito de la adoración',
        preferredCategories: ['WORSHIP', 'PRAISE'],
        secondaryCategories: ['GRATITUDE', 'DEDICATION'],
        categoryBoosts: { WORSHIP: 20, PRAISE: 15, GRATITUDE: 10, DEDICATION: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 2,
        title: 'Praise from the Heart',
        titleEs: 'Alabanza del Corazón',
        theme: 'Authentic worship',
        themeEs: 'Adoración auténtica',
        preferredCategories: ['PRAISE', 'GRATITUDE'],
        secondaryCategories: ['WORSHIP', 'LOVE'],
        categoryBoosts: { PRAISE: 20, GRATITUDE: 15, WORSHIP: 10, LOVE: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 3,
        title: 'Worship in Spirit and Truth',
        titleEs: 'Adoración en Espíritu y Verdad',
        theme: 'True worship defined',
        themeEs: 'La verdadera adoración definida',
        preferredCategories: ['HOLY_SPIRIT', 'SCRIPTURE'],
        secondaryCategories: ['WORSHIP', 'FAITH'],
        categoryBoosts: { HOLY_SPIRIT: 20, SCRIPTURE: 15, WORSHIP: 10, FAITH: 8 } as Record<HymnCategory, number>,
      },
      {
        weekNumber: 4,
        title: 'Eternal Praise',
        titleEs: 'Alabanza Eterna',
        theme: 'Worship now and forever',
        themeEs: 'Adoración ahora y siempre',
        preferredCategories: ['PRAISE', 'SECOND_COMING'],
        secondaryCategories: ['HOPE', 'VICTORY'],
        categoryBoosts: { PRAISE: 20, SECOND_COMING: 15, HOPE: 10, VICTORY: 8 } as Record<HymnCategory, number>,
      },
    ],
    closingProgression: ['WORSHIP', 'PRAISE', 'FAITH', 'HOPE'],
    keywords: ['praise', 'worship', 'sing', 'adore', 'alabanza', 'adoración', 'cantar', 'adorar'],
  },
];

// ============================================================================
// DYNAMIC SERIES GENERATION
// ============================================================================

/**
 * Normalize theme string for matching
 */
function normalizeTheme(theme: string): string {
  return theme.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

/**
 * Find closest matching theme key from CATEGORY_RELATIONSHIPS
 */
function findClosestTheme(customTheme: string): string {
  const normalized = normalizeTheme(customTheme);
  
  // Direct match
  if (CATEGORY_RELATIONSHIPS[normalized]) {
    return normalized;
  }
  
  // Partial match
  for (const key of Object.keys(CATEGORY_RELATIONSHIPS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return key;
    }
  }
  
  // Keyword search in theme
  const themeWords = normalized.split('_');
  for (const word of themeWords) {
    if (CATEGORY_RELATIONSHIPS[word]) {
      return word;
    }
  }
  
  // Default to faith
  return 'faith';
}

/**
 * Generate a progression of categories that flows doctrinally
 */
function generateDoctrinalProgression(
  baseCategories: HymnCategory[],
  totalWeeks: number
): HymnCategory[] {
  const progression: HymnCategory[] = [];
  const used = new Set<HymnCategory>();
  
  for (let i = 0; i < totalWeeks; i++) {
    // Cycle through base categories, avoiding immediate repeats
    let category = baseCategories[i % baseCategories.length];
    
    // If we've used this recently, try next in sequence
    if (used.size < baseCategories.length && used.has(category)) {
      for (const cat of baseCategories) {
        if (!used.has(cat)) {
          category = cat;
          break;
        }
      }
    }
    
    progression.push(category);
    used.add(category);
    
    // Reset used set every 4 weeks for longer series
    if ((i + 1) % 4 === 0) {
      used.clear();
    }
  }
  
  return progression;
}

/**
 * Generate dynamic series based on custom theme input
 */
export function generateDynamicSeries(request: DynamicSeriesRequest): DynamicSeriesResult {
  const { customTheme, totalWeeks = 4, startingCategory } = request;
  
  // Find closest matching theme
  const matchedTheme = findClosestTheme(customTheme);
  const baseCategories = CATEGORY_RELATIONSHIPS[matchedTheme] || ['FAITH', 'HOPE', 'DEDICATION', 'PRAYER'];
  
  // If starting category provided, reorder base categories
  const orderedCategories = startingCategory && baseCategories.includes(startingCategory)
    ? [startingCategory, ...baseCategories.filter(c => c !== startingCategory)]
    : baseCategories;
  
  // Generate doctrinal progression
  const doctrinalProgression = generateDoctrinalProgression(orderedCategories as HymnCategory[], totalWeeks);
  
  // Get title suggestion
  const titleInfo = THEME_TITLES[matchedTheme] || { 
    en: `${customTheme.charAt(0).toUpperCase()}${customTheme.slice(1)} Series`, 
    es: `Serie de ${customTheme.charAt(0).toUpperCase()}${customTheme.slice(1)}` 
  };
  
  // Generate week configs
  const weekConfigs: WeekConfig[] = [];
  const weekThemes: Array<{ en: string; es: string }> = [];
  const categoryWeightingPerWeek: Array<Record<HymnCategory, number>> = [];
  
  for (let week = 1; week <= totalWeeks; week++) {
    const primaryCategory = doctrinalProgression[week - 1];
    const secondaryCategories = orderedCategories.filter(c => c !== primaryCategory).slice(0, 2) as HymnCategory[];
    
    // Get theme for this category
    const weekThemeInfo = WEEK_THEME_TEMPLATES[primaryCategory] || WEEK_THEME_TEMPLATES.GENERAL;
    weekThemes.push({ en: weekThemeInfo.en, es: weekThemeInfo.es });
    
    // Generate category boosts
    const boosts: Record<HymnCategory, number> = {} as Record<HymnCategory, number>;
    boosts[primaryCategory] = SERIES_LIBRARY_BOOSTS.PRIMARY;
    secondaryCategories.forEach((cat, idx) => {
      boosts[cat] = SERIES_LIBRARY_BOOSTS.SECONDARY - (idx * 2);
    });
    categoryWeightingPerWeek.push(boosts);
    
    weekConfigs.push({
      weekNumber: week,
      title: `Week ${week}: ${weekThemeInfo.en}`,
      titleEs: `Semana ${week}: ${weekThemeInfo.es}`,
      theme: weekThemeInfo.en,
      themeEs: weekThemeInfo.es,
      preferredCategories: [primaryCategory],
      secondaryCategories,
      categoryBoosts: boosts,
    });
  }
  
  return {
    suggestedTitle: titleInfo.en,
    suggestedTitleEs: titleInfo.es,
    doctrinalProgressionMap: doctrinalProgression,
    weekThemes,
    weekConfigs,
    categoryWeightingPerWeek,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a predefined series by ID
 */
export function getPredefinedSeries(id: string): PredefinedSeries | null {
  return PREDEFINED_SERIES.find(s => s.id === id) ?? null;
}

/**
 * Get all predefined series for UI dropdown
 */
export function getAllPredefinedSeries(): Array<{ id: string; title: string; titleEs: string; totalWeeks: number; theme: string }> {
  return PREDEFINED_SERIES.map(s => ({
    id: s.id,
    title: s.title,
    titleEs: s.titleEs,
    totalWeeks: s.totalWeeks,
    theme: s.theme,
  }));
}

/**
 * Get week configuration for a specific week in a predefined series
 */
export function getWeekConfigForPredefinedSeries(
  seriesId: string,
  weekNumber: number
): WeekConfig | null {
  const series = getPredefinedSeries(seriesId);
  if (!series || weekNumber < 1 || weekNumber > series.totalWeeks) {
    return null;
  }
  return series.weekProgression[weekNumber - 1] ?? null;
}

/**
 * Get category boosts for scoring based on series context
 */
export function getSeriesBoostsForScoring(
  seriesId: string | null,
  weekNumber: number,
  customTheme?: string
): Record<HymnCategory, number> | null {
  // If predefined series
  if (seriesId) {
    const weekConfig = getWeekConfigForPredefinedSeries(seriesId, weekNumber);
    return weekConfig?.categoryBoosts ?? null;
  }
  
  // If custom theme, generate dynamic boosts
  if (customTheme) {
    const dynamicSeries = generateDynamicSeries({ customTheme, totalWeeks: weekNumber });
    return dynamicSeries.categoryWeightingPerWeek[weekNumber - 1] ?? null;
  }
  
  return null;
}

/**
 * Check if a category should receive series boost
 */
export function calculateSeriesBoost(
  category: HymnCategory | string | null,
  seriesBoosts: Record<HymnCategory, number> | null
): number {
  if (!category || !seriesBoosts) return 0;
  return seriesBoosts[category.toUpperCase() as HymnCategory] ?? 0;
}

/**
 * Get closing progression for a series week
 */
export function getClosingCategoryForWeek(
  seriesId: string | null,
  weekNumber: number,
  customTheme?: string
): HymnCategory | null {
  if (seriesId) {
    const series = getPredefinedSeries(seriesId);
    if (series && weekNumber >= 1 && weekNumber <= series.totalWeeks) {
      return series.closingProgression[weekNumber - 1] ?? null;
    }
  }
  
  if (customTheme) {
    const dynamicSeries = generateDynamicSeries({ customTheme, totalWeeks: weekNumber });
    return dynamicSeries.doctrinalProgressionMap[weekNumber - 1] ?? null;
  }
  
  return null;
}
