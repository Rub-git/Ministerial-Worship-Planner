/**
 * Phase 3.6 - HYBRID Hymn Metadata Initialization (REFINED)
 * 
 * Rule-Based Classification:
 * 1. Auto-assign category, seasonTag, worshipSection, keywords
 * 2. Based on Spanish/English titles and known hymnal structure
 * 3. All auto-classified hymns: metadataVerified = false
 * 
 * REFINEMENT GOALS:
 * - Reduce GENERAL from 36% to under 20%
 * - Increase SECOND_COMING detection
 * - Expand seasonTag coverage
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// CATEGORY DEFINITIONS
// ============================================
type HymnCategory = 
  | 'PRAISE'
  | 'PRAYER'
  | 'HOPE'
  | 'SECOND_COMING'
  | 'RESURRECTION'
  | 'HOLY_SPIRIT'
  | 'FAITH'
  | 'SALVATION'
  | 'COMMUNION'
  | 'DEDICATION'
  | 'SABBATH'
  | 'CHRISTMAS'
  | 'GENERAL';

// ============================================
// KEYWORD SEED MAPPINGS
// ============================================
const CATEGORY_KEYWORDS: Record<HymnCategory, string[]> = {
  PRAISE: ['praise', 'glory', 'holy', 'majesty', 'worship', 'exalt', 'honor', 'adore', 'great', 'wonderful', 'almighty', 'sing', 'cantad', 'alabanza'],
  PRAYER: ['prayer', 'guide', 'near', 'speak', 'hear', 'listen', 'lead', 'comfort', 'peace', 'still', 'oración'],
  HOPE: ['hope', 'eternal', 'heaven', 'forever', 'promise', 'assurance', 'blessed', 'rest', 'peace', 'joy', 'cielo', 'esperanza'],
  SECOND_COMING: ['coming', 'trumpet', 'king', 'return', 'soon', 'clouds', 'glory', 'meeting', 'rapture', 'day', 'vendrá', 'trompeta', 'reino', 'volverá', 'maranatha'],
  RESURRECTION: ['resurrection', 'victory', 'alive', 'risen', 'lives', 'death', 'tomb', 'grave', 'conquer', 'vive', 'resucitó'],
  HOLY_SPIRIT: ['spirit', 'fire', 'power', 'fill', 'breath', 'dove', 'pentecost', 'anointing', 'espíritu'],
  FAITH: ['faith', 'trust', 'believe', 'confidence', 'assurance', 'anchor', 'rock', 'foundation', 'stand', 'fe', 'confío'],
  SALVATION: ['salvation', 'saved', 'redeemed', 'blood', 'cross', 'grace', 'forgiven', 'cleanse', 'mercy', 'calvary', 'cruz', 'gracia'],
  COMMUNION: ['communion', 'bread', 'wine', 'body', 'blood', 'remember', 'supper', 'table', 'comunión'],
  DEDICATION: ['dedication', 'surrender', 'consecrate', 'give', 'serve', 'follow', 'commit', 'yield', 'all', 'rindo', 'entrego'],
  SABBATH: ['sabbath', 'rest', 'holy day', 'blessed', 'seventh', 'creator', 'remember', 'sábado', 'reposo'],
  CHRISTMAS: ['christmas', 'manger', 'bethlehem', 'born', 'baby', 'shepherds', 'wise men', 'star', 'nativity', 'navidad', 'pesebre'],
  GENERAL: ['worship', 'lord', 'god', 'jesus', 'christ', 'love', 'sing'],
};

// ============================================
// WORSHIP SECTION MAPPINGS
// ============================================
const WORSHIP_SECTION_MAPPINGS: Record<string, HymnCategory[]> = {
  'OPENING': ['PRAISE', 'GENERAL'],
  'PRAISE_SERVICE': ['PRAISE'],
  'PRAYER': ['PRAYER', 'FAITH'],
  'SERMON': ['FAITH', 'SALVATION', 'DEDICATION'],
  'CLOSING': ['HOPE', 'SECOND_COMING', 'DEDICATION'],
  'SPECIAL': ['SALVATION', 'FAITH', 'DEDICATION'],
};

// ============================================
// SPANISH TITLE PATTERNS → CATEGORY (EXPANDED)
// ============================================
const SPANISH_TITLE_RULES: Array<{ pattern: RegExp; category: HymnCategory; theme?: string; seasonTag?: string }> = [
  // PRAISE patterns (expanded)
  { pattern: /\b(santo|gloria|alabad|exaltad|majestad|grande|maravilloso|adorad|alabanza|cantad|canto|himno|celebr|ador[ae])\b/i, category: 'PRAISE', theme: 'Alabanza' },
  { pattern: /\b(doxolog[ií]a)\b/i, category: 'PRAISE', theme: 'Doxología' },
  { pattern: /\b(loor|lo[aá]moste|engrandec)\b/i, category: 'PRAISE', theme: 'Alabanza' },
  
  // PRAYER patterns (expanded)
  { pattern: /\b(oraci[oó]n|gu[ií]a|cerca|habla|escucha|dirige|consuela|intercede|suplica)\b/i, category: 'PRAYER', theme: 'Oración' },
  { pattern: /\b(dulce oraci[oó]n|hora de orar|oh dios.*alma)\b/i, category: 'PRAYER', theme: 'Oración' },
  
  // HOPE patterns (expanded)
  { pattern: /\b(esperanza|cielo|eterno|promesa|seguridad|bendito|descanso|hogar.*celestial|morada)\b/i, category: 'HOPE', theme: 'Esperanza' },
  { pattern: /\b(all[aá] en el cielo|cuando.*cielo|brazos.*jes[uú]s)\b/i, category: 'HOPE', theme: 'Cielo' },
  { pattern: /\b(paz.*alma|bien.*alma|descans)\b/i, category: 'HOPE', theme: 'Paz' },
  
  // SECOND COMING patterns (GREATLY EXPANDED for Phase 3.6)
  { pattern: /\b(vendr[aá]|viene|regres[ao]|volverá|pronto|trompeta|nubes|corona|reino|rey.*reyes|maranatha)\b/i, category: 'SECOND_COMING', theme: 'Segunda Venida', seasonTag: 'ADVENT' },
  { pattern: /\b(segunda venida|cristo viene|jes[uú]s viene|se[nñ]or viene)\b/i, category: 'SECOND_COMING', theme: 'Segunda Venida', seasonTag: 'ADVENT' },
  { pattern: /\b(coronad|triunfante|glorioso.*rey|dia.*final|ju[ií]cio|angel.*cantan)\b/i, category: 'SECOND_COMING', theme: 'Segunda Venida', seasonTag: 'ADVENT' },
  { pattern: /\b(cielos.*abrir|nube|resplan.*gloria)\b/i, category: 'SECOND_COMING', theme: 'Segunda Venida', seasonTag: 'ADVENT' },
  
  // RESURRECTION patterns (expanded)
  { pattern: /\b(resurrecci[oó]n|victoria|vivo|resucit[oó]|vive|muerte|tumba|sepulcro|venci[oó])\b/i, category: 'RESURRECTION', theme: 'Resurrección', seasonTag: 'EASTER' },
  { pattern: /\b(porque [eé]l vive|mi redentor vive|cristo vive|levant[oó])\b/i, category: 'RESURRECTION', theme: 'Resurrección', seasonTag: 'EASTER' },
  
  // HOLY SPIRIT patterns (expanded)
  { pattern: /\b(esp[ií]ritu|fuego|poder|llena|aliento|paloma|pentecost[eé]s|unci[oó]n|santo.*esp[ií]ritu)\b/i, category: 'HOLY_SPIRIT', theme: 'Espíritu Santo', seasonTag: 'PENTECOST' },
  
  // FAITH patterns (expanded)
  { pattern: /\b(fe|conf[ií][ao]|creo|seguridad|ancla|roca|fundamento|firme|fortaleza)\b/i, category: 'FAITH', theme: 'Fe' },
  { pattern: /\b(castillo fuerte|roca eterna|fidelidad|fiel)\b/i, category: 'FAITH', theme: 'Fe' },
  
  // SALVATION patterns (expanded)
  { pattern: /\b(salvaci[oó]n|salvado|redimido|sangre|cruz|gracia|perdon|limpia|misericordia|calvario|cordero)\b/i, category: 'SALVATION', theme: 'Salvación' },
  { pattern: /\b(alcanz[eé] salvaci[oó]n|sublime gracia|dulce|preciosa)\b/i, category: 'SALVATION', theme: 'Salvación' },
  
  // DEDICATION patterns (expanded)
  { pattern: /\b(dedicaci[oó]n|rendici[oó]n|consagr|entrego|sirvo|sigo|compromiso|rindo|obedec)\b/i, category: 'DEDICATION', theme: 'Dedicación' },
  { pattern: /\b(todo a cristo|me rindo|sigue|ven a cristo)\b/i, category: 'DEDICATION', theme: 'Consagración' },
  { pattern: /\b(tal como soy|tu vol[ua]ntad)\b/i, category: 'DEDICATION', theme: 'Entrega' },
  
  // SABBATH patterns (expanded)
  { pattern: /\b(s[aá]bado|s[eé]ptimo d[ií]a|reposo|creador|d[ií]a.*santo|guardar)\b/i, category: 'SABBATH', theme: 'Sábado' },
  
  // CHRISTMAS patterns (expanded - with CHRISTMAS seasonTag)
  { pattern: /\b(navidad|pesebre|bel[eé]n|nacido|ni[nñ]o.*jes[uú]s|pastores|reyes.*magos|estrella|noche.*paz|noche.*santa)\b/i, category: 'CHRISTMAS', theme: 'Navidad', seasonTag: 'CHRISTMAS' },
  { pattern: /\b(emmanuel|encarnaci[oó]n|virgen|mar[ií]a.*madre)\b/i, category: 'CHRISTMAS', theme: 'Navidad', seasonTag: 'CHRISTMAS' },
  
  // COMMUNION patterns
  { pattern: /\b(comuni[oó]n|pan|vino|cuerpo|sangre|recuerda|cena|mesa.*se[nñ]or)\b/i, category: 'COMMUNION', theme: 'Comunión' },
  
  // Additional catch-all patterns to reduce GENERAL
  { pattern: /\b(jes[uú]s.*amor|amor.*jes[uú]s|cristo.*amor|tierno)\b/i, category: 'SALVATION', theme: 'Amor de Cristo' },
  { pattern: /\b(familia|hogar|padres|hijos|matrimonio)\b/i, category: 'DEDICATION', theme: 'Familia' },
  { pattern: /\b(iglesia|pueblo|congreg|hermanos|unidos)\b/i, category: 'PRAISE', theme: 'Comunidad' },
  { pattern: /\b(ma[nñ]ana|amanecer|nuevo d[ií]a|despertar)\b/i, category: 'PRAISE', theme: 'Adoración Matutina' },
  { pattern: /\b(noche|atardecer|ocaso|vespertino)\b/i, category: 'PRAYER', theme: 'Adoración Vespertina' },
  { pattern: /\b(guarda|protege|amparo|refugio|escudo|defensor)\b/i, category: 'FAITH', theme: 'Protección Divina' },
];

// ============================================
// ENGLISH TITLE PATTERNS → CATEGORY (EXPANDED)
// ============================================
const ENGLISH_TITLE_RULES: Array<{ pattern: RegExp; category: HymnCategory; theme?: string; seasonTag?: string }> = [
  // PRAISE patterns (expanded)
  { pattern: /\b(holy|glory|praise|exalt|majesty|great|wonderful|almighty|adore|worship|sing unto|joyful)\b/i, category: 'PRAISE', theme: 'Praise' },
  { pattern: /\b(how great thou art|to god be the glory|o worship)\b/i, category: 'PRAISE', theme: 'Praise' },
  { pattern: /\b(doxology|praise god from whom|all creatures)\b/i, category: 'PRAISE', theme: 'Doxology' },
  
  // PRAYER patterns (expanded)
  { pattern: /\b(prayer|guide|near|speak|hear|listen|lead|comfort|sweet hour|abide)\b/i, category: 'PRAYER', theme: 'Prayer' },
  { pattern: /\b(what a friend|nearer.*god|closer.*walk|draw me)\b/i, category: 'PRAYER', theme: 'Prayer' },
  
  // HOPE patterns (expanded)
  { pattern: /\b(hope|eternal|heaven|forever|promise|assurance|blessed|rest|well with my soul|home)\b/i, category: 'HOPE', theme: 'Hope' },
  { pattern: /\b(when we all get to heaven|leaning.*arms|everlasting)\b/i, category: 'HOPE', theme: 'Heaven' },
  
  // SECOND COMING patterns (GREATLY EXPANDED for Phase 3.6)
  { pattern: /\b(coming|trumpet|king.*return|return.*king|soon|clouds|meeting|maranatha)\b/i, category: 'SECOND_COMING', theme: 'Second Coming', seasonTag: 'ADVENT' },
  { pattern: /\b(crown him|all hail|lo he comes|christ.*king|jesus.*king|king of kings)\b/i, category: 'SECOND_COMING', theme: 'Second Coming', seasonTag: 'ADVENT' },
  { pattern: /\b(judgment|final day|glorious appearing|sky|angels.*sing|we shall see)\b/i, category: 'SECOND_COMING', theme: 'Second Coming', seasonTag: 'ADVENT' },
  { pattern: /\b(reign|kingdom|throne|crowned|coronation|triumphant)\b/i, category: 'SECOND_COMING', theme: 'Christ the King', seasonTag: 'ADVENT' },
  
  // RESURRECTION patterns (expanded)
  { pattern: /\b(resurrection|victory|alive|risen|he lives|death.*sting|tomb|grave|arose|conquer)\b/i, category: 'RESURRECTION', theme: 'Resurrection', seasonTag: 'EASTER' },
  { pattern: /\b(because he lives|christ arose|up from the grave|low in the grave)\b/i, category: 'RESURRECTION', theme: 'Resurrection', seasonTag: 'EASTER' },
  
  // HOLY SPIRIT patterns (expanded)
  { pattern: /\b(spirit|fire|power|fill|breath|dove|pentecost|anointing|holy ghost)\b/i, category: 'HOLY_SPIRIT', theme: 'Holy Spirit', seasonTag: 'PENTECOST' },
  
  // FAITH patterns (expanded)
  { pattern: /\b(faith|trust|believe|confidence|anchor|rock|foundation|stand|fortress|stronghold)\b/i, category: 'FAITH', theme: 'Faith' },
  { pattern: /\b(mighty fortress|tis so sweet to trust|standing.*promises|firm foundation)\b/i, category: 'FAITH', theme: 'Faith' },
  { pattern: /\b(great is thy faithfulness|faithful|never fail)\b/i, category: 'FAITH', theme: 'Faithfulness' },
  
  // SALVATION patterns (expanded)
  { pattern: /\b(salvation|saved|redeemed|blood|cross|grace|forgiven|cleanse|mercy|amazing grace|calvary|lamb)\b/i, category: 'SALVATION', theme: 'Salvation' },
  { pattern: /\b(at the cross|old rugged cross|there is a fountain|washed)\b/i, category: 'SALVATION', theme: 'The Cross' },
  
  // DEDICATION patterns (expanded)
  { pattern: /\b(dedication|surrender|consecrate|give|serve|follow|commit|yield|all to jesus)\b/i, category: 'DEDICATION', theme: 'Dedication' },
  { pattern: /\b(i surrender all|just as i am|have thine own way|take my life)\b/i, category: 'DEDICATION', theme: 'Consecration' },
  
  // SABBATH patterns
  { pattern: /\b(sabbath|seventh day|rest|creator|remember the sabbath)\b/i, category: 'SABBATH', theme: 'Sabbath' },
  
  // CHRISTMAS patterns (with seasonTag)
  { pattern: /\b(christmas|manger|bethlehem|born|baby jesus|shepherds|wise men|star|silent night|away in|o come)\b/i, category: 'CHRISTMAS', theme: 'Christmas', seasonTag: 'CHRISTMAS' },
  { pattern: /\b(hark.*herald|joy.*world|first noel|angels we have heard|little town)\b/i, category: 'CHRISTMAS', theme: 'Christmas', seasonTag: 'CHRISTMAS' },
  
  // COMMUNION patterns
  { pattern: /\b(communion|bread|wine|body|blood|remember|supper|table|broken)\b/i, category: 'COMMUNION', theme: 'Communion' },
  
  // Additional catch-all patterns to reduce GENERAL
  { pattern: /\b(love.*jesus|jesus.*love|god.*love|tender|sweet)\b/i, category: 'SALVATION', theme: 'Love of Christ' },
  { pattern: /\b(family|home|father|mother|children|marriage)\b/i, category: 'DEDICATION', theme: 'Family' },
  { pattern: /\b(church|people|congregation|brethren|united|fellowship)\b/i, category: 'PRAISE', theme: 'Community' },
  { pattern: /\b(morning|dawn|new day|awake|sunrise)\b/i, category: 'PRAISE', theme: 'Morning Worship' },
  { pattern: /\b(evening|sunset|night|vesper)\b/i, category: 'PRAYER', theme: 'Evening Worship' },
  { pattern: /\b(shield|refuge|defender|hiding|shelter|safe)\b/i, category: 'FAITH', theme: 'Divine Protection' },
  { pattern: /\b(maker|my god|o lord|our god|almighty god)\b/i, category: 'PRAISE', theme: 'Praise' },
];

// ============================================
// KNOWN HYMN CLASSIFICATIONS (by English number)
// High-confidence mappings for common hymns (EXPANDED)
// ============================================
const KNOWN_HYMN_CLASSIFICATIONS: Record<number, { category: HymnCategory; theme: string; worshipSection: string; seasonTag?: string }> = {
  // Praise & Worship
  86: { category: 'PRAISE', theme: 'Greatness of God', worshipSection: 'OPENING' },  // How Great Thou Art
  341: { category: 'PRAISE', theme: 'Glory to God', worshipSection: 'OPENING' },     // To God Be the Glory
  249: { category: 'PRAISE', theme: 'Praise', worshipSection: 'PRAISE_SERVICE' },   // Praise Him! Praise Him!
  694: { category: 'PRAISE', theme: 'Doxology', worshipSection: 'OPENING' },         // Praise God From Whom
  6: { category: 'PRAISE', theme: 'Worship', worshipSection: 'OPENING' },            // O Worship the Lord
  1: { category: 'PRAISE', theme: 'Praise', worshipSection: 'OPENING' },             // Praise to the Lord
  
  // Prayer
  499: { category: 'PRAYER', theme: 'Friendship with Jesus', worshipSection: 'PRAYER' }, // What a Friend
  473: { category: 'PRAYER', theme: 'Nearness to God', worshipSection: 'PRAYER' },       // Nearer, My God, to Thee
  478: { category: 'PRAYER', theme: 'Prayer', worshipSection: 'PRAYER' },                // Sweet Hour of Prayer
  487: { category: 'PRAYER', theme: 'Communion with God', worshipSection: 'PRAYER' },    // In the Garden
  668: { category: 'PRAYER', theme: 'Prayer', worshipSection: 'PRAYER' },                // O Thou Who Hearest
  
  // Hope & Assurance
  462: { category: 'HOPE', theme: 'Assurance', worshipSection: 'CLOSING' },         // Blessed Assurance
  530: { category: 'HOPE', theme: 'Peace', worshipSection: 'CLOSING' },             // It Is Well With My Soul
  633: { category: 'HOPE', theme: 'Heaven', worshipSection: 'CLOSING' },            // When We All Get to Heaven
  469: { category: 'HOPE', theme: 'Trust', worshipSection: 'CLOSING' },             // Leaning on the Everlasting Arms
  
  // Faith & Trust
  524: { category: 'FAITH', theme: 'Trust', worshipSection: 'SERMON' },             // Tis So Sweet to Trust
  506: { category: 'FAITH', theme: 'Strength', worshipSection: 'SERMON' },          // A Mighty Fortress
  100: { category: 'FAITH', theme: 'Faithfulness', worshipSection: 'OPENING' },     // Great Is Thy Faithfulness
  
  // Salvation & Grace
  313: { category: 'DEDICATION', theme: 'Surrender', worshipSection: 'SPECIAL' },   // Just As I Am
  309: { category: 'DEDICATION', theme: 'Consecration', worshipSection: 'SPECIAL' },// I Surrender All
  569: { category: 'SALVATION', theme: 'Mercy', worshipSection: 'SPECIAL' },        // Pass Me Not
  
  // Resurrection (EASTER)
  251: { category: 'RESURRECTION', theme: 'Resurrection', worshipSection: 'SPECIAL', seasonTag: 'EASTER' }, // He Lives
  526: { category: 'RESURRECTION', theme: 'Living Christ', worshipSection: 'SPECIAL', seasonTag: 'EASTER' }, // Because He Lives
  
  // Second Coming (ADVENT) - EXPANDED for Phase 3.6
  15: { category: 'SECOND_COMING', theme: 'Christ the King', worshipSection: 'CLOSING', seasonTag: 'ADVENT' }, // My Maker and My King
  201: { category: 'SECOND_COMING', theme: 'Second Coming', worshipSection: 'CLOSING', seasonTag: 'ADVENT' },
  202: { category: 'SECOND_COMING', theme: 'Second Coming', worshipSection: 'CLOSING', seasonTag: 'ADVENT' },
  203: { category: 'SECOND_COMING', theme: 'Second Coming', worshipSection: 'CLOSING', seasonTag: 'ADVENT' },
  213: { category: 'SECOND_COMING', theme: 'Second Coming', worshipSection: 'CLOSING', seasonTag: 'ADVENT' },
  214: { category: 'SECOND_COMING', theme: 'Second Coming', worshipSection: 'CLOSING', seasonTag: 'ADVENT' },
  
  // Phase 3.6: Reclassify remaining GENERAL hymns
  8: { category: 'PRAISE', theme: 'Community Worship', worshipSection: 'OPENING' },      // We Gather Together
  7: { category: 'SECOND_COMING', theme: 'Christ Reigns', worshipSection: 'CLOSING', seasonTag: 'ADVENT' }, // The Lord in Zion Reigneth
  316: { category: 'DEDICATION', theme: 'Christian Living', worshipSection: 'SPECIAL' }, // Live Out Thy Life
  65: { category: 'PRAYER', theme: 'Benediction', worshipSection: 'CLOSING' },           // God Be With You
  51: { category: 'PRAYER', theme: 'Evening Worship', worshipSection: 'CLOSING' },       // Day Is Dying in the West
  690: { category: 'PRAYER', theme: 'Benediction', worshipSection: 'CLOSING' },          // Dismiss Us With Blessing
  78: { category: 'SALVATION', theme: 'God\'s Love', worshipSection: 'SPECIAL' },        // For God So Loved Us
  98: { category: 'PRAISE', theme: 'Creation', worshipSection: 'OPENING' },              // Can You Count the Stars?
  477: { category: 'PRAYER', theme: 'Comfort', worshipSection: 'PRAYER' },               // Come, Ye Disconsolate
  181: { category: 'FAITH', theme: 'Jesus Cares', worshipSection: 'SERMON' },            // Does Jesus Care?
  196: { category: 'SALVATION', theme: 'Gospel Story', worshipSection: 'SPECIAL' },     // Tell Me the Old, Old Story
  186: { category: 'FAITH', theme: 'Friend in Jesus', worshipSection: 'SERMON' },       // I've Found a Friend
  290: { category: 'FAITH', theme: 'Focus on Christ', worshipSection: 'SERMON' },       // Turn Your Eyes Upon Jesus
  184: { category: 'SALVATION', theme: 'Atonement', worshipSection: 'SPECIAL' },        // Jesus Paid It All
};

// ============================================
// CLASSIFICATION FUNCTIONS
// ============================================

function classifyBySpanishTitle(titleEs: string): { category: HymnCategory; theme?: string; seasonTag?: string } | null {
  for (const rule of SPANISH_TITLE_RULES) {
    if (rule.pattern.test(titleEs)) {
      return {
        category: rule.category,
        theme: rule.theme,
        seasonTag: rule.seasonTag,
      };
    }
  }
  return null;
}

function classifyByEnglishTitle(titleEn: string | null): { category: HymnCategory; theme?: string; seasonTag?: string } | null {
  if (!titleEn) return null;
  
  for (const rule of ENGLISH_TITLE_RULES) {
    if (rule.pattern.test(titleEn)) {
      return {
        category: rule.category,
        theme: rule.theme,
        seasonTag: rule.seasonTag,
      };
    }
  }
  return null;
}

function getKnownClassification(numberEn: number | null): typeof KNOWN_HYMN_CLASSIFICATIONS[number] | null {
  if (numberEn === null) return null;
  return KNOWN_HYMN_CLASSIFICATIONS[numberEn] ?? null;
}

function generateKeywords(category: HymnCategory, titleEs: string, titleEn: string | null): string[] {
  const keywords = new Set<string>();
  
  // Add category keywords
  const categoryKeywords = CATEGORY_KEYWORDS[category] ?? [];
  categoryKeywords.slice(0, 5).forEach(kw => keywords.add(kw));
  
  // Extract meaningful words from titles
  const titleWords = (titleEs + ' ' + (titleEn ?? '')).toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !['para', 'como', 'este', 'esta', 'with', 'from', 'that', 'have', 'what'].includes(w));
  
  titleWords.slice(0, 5).forEach(w => keywords.add(w));
  
  return Array.from(keywords).slice(0, 10);
}

function determineWorshipSection(category: HymnCategory): string {
  // Map category to most suitable worship section
  const sectionMap: Record<HymnCategory, string> = {
    PRAISE: 'OPENING',
    PRAYER: 'PRAYER',
    HOPE: 'CLOSING',
    SECOND_COMING: 'CLOSING',
    RESURRECTION: 'SPECIAL',
    HOLY_SPIRIT: 'SPECIAL',
    FAITH: 'SERMON',
    SALVATION: 'SPECIAL',
    COMMUNION: 'SPECIAL',
    DEDICATION: 'SPECIAL',
    SABBATH: 'OPENING',
    CHRISTMAS: 'SPECIAL',
    GENERAL: 'OPENING',
  };
  return sectionMap[category] ?? 'OPENING';
}

// ============================================
// MAIN INITIALIZATION FUNCTION
// ============================================

async function initializeHymnMetadata() {
  console.log('\n========================================');
  console.log('PHASE 3.5 - HYMN METADATA INITIALIZATION');
  console.log('========================================\n');

  const hymns = await prisma.hymnPair.findMany({
    orderBy: { numberEs: 'asc' },
  });

  console.log(`Processing ${hymns.length} hymns...\n`);

  const stats = {
    total: hymns.length,
    byCategory: {} as Record<string, number>,
    bySeasonTag: {} as Record<string, number>,
    byWorshipSection: {} as Record<string, number>,
    classifiedByKnown: 0,
    classifiedByEnglish: 0,
    classifiedBySpanish: 0,
    fallbackToGeneral: 0,
  };

  const updates: Array<{
    id: number;
    numberEs: number;
    titleEs: string;
    category: string;
    theme: string | null;
    seasonTag: string | null;
    worshipSection: string;
    keywords: string[];
    classificationSource: string;
  }> = [];

  for (const hymn of hymns) {
    let category: HymnCategory = 'GENERAL';
    let theme: string | null = null;
    let seasonTag: string | null = null;
    let worshipSection: string = 'OPENING';
    let classificationSource = 'FALLBACK';

    // Priority 1: Known classification (highest confidence)
    const known = getKnownClassification(hymn.numberEn);
    if (known) {
      category = known.category;
      theme = known.theme;
      seasonTag = known.seasonTag ?? null;
      worshipSection = known.worshipSection;
      classificationSource = 'KNOWN';
      stats.classifiedByKnown++;
    } else {
      // Priority 2: English title pattern matching
      const englishMatch = classifyByEnglishTitle(hymn.titleEn);
      if (englishMatch) {
        category = englishMatch.category;
        theme = englishMatch.theme ?? null;
        seasonTag = englishMatch.seasonTag ?? null;
        worshipSection = determineWorshipSection(category);
        classificationSource = 'ENGLISH_TITLE';
        stats.classifiedByEnglish++;
      } else {
        // Priority 3: Spanish title pattern matching
        const spanishMatch = classifyBySpanishTitle(hymn.titleEs);
        if (spanishMatch) {
          category = spanishMatch.category;
          theme = spanishMatch.theme ?? null;
          seasonTag = spanishMatch.seasonTag ?? null;
          worshipSection = determineWorshipSection(category);
          classificationSource = 'SPANISH_TITLE';
          stats.classifiedBySpanish++;
        } else {
          // Fallback to GENERAL
          category = 'GENERAL';
          theme = 'General Worship';
          worshipSection = 'OPENING';
          classificationSource = 'FALLBACK';
          stats.fallbackToGeneral++;
        }
      }
    }

    const keywords = generateKeywords(category, hymn.titleEs, hymn.titleEn);

    // Track stats
    stats.byCategory[category] = (stats.byCategory[category] ?? 0) + 1;
    if (seasonTag) {
      stats.bySeasonTag[seasonTag] = (stats.bySeasonTag[seasonTag] ?? 0) + 1;
    }
    stats.byWorshipSection[worshipSection] = (stats.byWorshipSection[worshipSection] ?? 0) + 1;

    updates.push({
      id: hymn.id,
      numberEs: hymn.numberEs,
      titleEs: hymn.titleEs,
      category,
      theme,
      seasonTag,
      worshipSection,
      keywords,
      classificationSource,
    });
  }

  // Apply updates to database
  console.log('Applying metadata updates to database...\n');
  
  for (const update of updates) {
    await prisma.hymnPair.update({
      where: { id: update.id },
      data: {
        category: update.category,
        theme: update.theme,
        seasonTag: update.seasonTag,
        worshipSection: update.worshipSection,
        keywords: update.keywords,
        metadataVerified: false, // All auto-classified = unverified
      },
    });
  }

  // Generate report
  console.log('========================================');
  console.log('METADATA INITIALIZATION REPORT');
  console.log('========================================\n');

  console.log('--- CLASSIFICATION SOURCES ---');
  console.log(`Known Hymn Mappings:     ${stats.classifiedByKnown}`);
  console.log(`English Title Patterns:  ${stats.classifiedByEnglish}`);
  console.log(`Spanish Title Patterns:  ${stats.classifiedBySpanish}`);
  console.log(`Fallback to GENERAL:     ${stats.fallbackToGeneral}`);
  console.log(`Total:                   ${stats.total}`);

  console.log('\n--- HYMNS BY CATEGORY ---');
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / stats.total) * 100).toFixed(1);
      console.log(`${cat.padEnd(20)} ${count.toString().padStart(3)} (${pct}%)`);
    });

  console.log('\n--- HYMNS BY SEASON TAG ---');
  if (Object.keys(stats.bySeasonTag).length === 0) {
    console.log('No seasonal tags assigned');
  } else {
    Object.entries(stats.bySeasonTag)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tag, count]) => {
        console.log(`${tag.padEnd(20)} ${count.toString().padStart(3)}`);
      });
  }
  console.log(`No Season:               ${stats.total - Object.values(stats.bySeasonTag).reduce((a, b) => a + b, 0)}`);

  console.log('\n--- HYMNS BY WORSHIP SECTION ---');
  Object.entries(stats.byWorshipSection)
    .sort((a, b) => b[1] - a[1])
    .forEach(([section, count]) => {
      const pct = ((count / stats.total) * 100).toFixed(1);
      console.log(`${section.padEnd(20)} ${count.toString().padStart(3)} (${pct}%)`);
    });

  console.log('\n--- METADATA VERIFICATION STATUS ---');
  console.log(`Verified:                0 (0.0%)`);
  console.log(`Unverified:              ${stats.total} (100.0%)`);

  console.log('\n--- SAMPLE CLASSIFICATIONS ---');
  updates.slice(0, 15).forEach(u => {
    console.log(`#${u.numberEs.toString().padStart(3)} ${u.titleEs.substring(0, 25).padEnd(25)} → ${u.category.padEnd(15)} [${u.classificationSource}]`);
  });

  console.log('\n========================================');
  console.log('INITIALIZATION COMPLETE');
  console.log('========================================');

  return stats;
}

// Run initialization
initializeHymnMetadata()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
