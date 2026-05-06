/**
 * =============================================================================
 * PHASE 7C: SCRIPTURE CLASSIFICATION ENGINE
 * =============================================================================
 * 
 * Parses Bible references and classifies them by:
 * - Testament (OT / NT)
 * - Category (LAW, HISTORY, POETRY, PROPHETS, GOSPELS, ACTS, EPISTLES, APOCALYPTIC)
 * 
 * Uses static internal mapping table - no external APIs.
 */

// =============================================================================
// TYPES
// =============================================================================

export type Testament = 'OT' | 'NT';

export type ScriptureCategory = 
  | 'LAW'        // Torah/Pentateuch: Genesis-Deuteronomy
  | 'HISTORY'    // Historical Books: Joshua-Esther (OT), Acts (NT)
  | 'POETRY'     // Wisdom Literature: Job-Song of Solomon
  | 'PROPHETS'   // Major & Minor Prophets: Isaiah-Malachi
  | 'GOSPELS'    // Matthew, Mark, Luke, John
  | 'ACTS'       // Acts of the Apostles
  | 'EPISTLES'   // Romans-Jude
  | 'APOCALYPTIC'; // Daniel, Revelation

export interface ScriptureClassification {
  book: string;
  bookNormalized: string;
  testament: Testament;
  category: ScriptureCategory;
  reference: string;  // Original reference
  chapter?: number;
  verse?: number;
  verseEnd?: number;
}

export interface BookInfo {
  canonical: string;     // Canonical English name
  testament: Testament;
  category: ScriptureCategory;
  aliases: string[];     // Alternative names (Spanish, abbreviations)
}

// =============================================================================
// BIBLE BOOK MAPPING TABLE
// Complete mapping of all 66 canonical books
// =============================================================================

export const BIBLE_BOOKS: BookInfo[] = [
  // =========== OLD TESTAMENT ===========
  
  // LAW (Torah/Pentateuch)
  { canonical: 'Genesis', testament: 'OT', category: 'LAW', aliases: ['Gen', 'Gn', 'Génesis', 'Gén'] },
  { canonical: 'Exodus', testament: 'OT', category: 'LAW', aliases: ['Ex', 'Exod', 'Éxodo', 'Éx'] },
  { canonical: 'Leviticus', testament: 'OT', category: 'LAW', aliases: ['Lev', 'Lv', 'Levítico', 'Lv'] },
  { canonical: 'Numbers', testament: 'OT', category: 'LAW', aliases: ['Num', 'Nm', 'Números', 'Núm'] },
  { canonical: 'Deuteronomy', testament: 'OT', category: 'LAW', aliases: ['Deut', 'Dt', 'Deuteronomio', 'Deu'] },
  
  // HISTORY (OT Historical Books)
  { canonical: 'Joshua', testament: 'OT', category: 'HISTORY', aliases: ['Josh', 'Jos', 'Josué'] },
  { canonical: 'Judges', testament: 'OT', category: 'HISTORY', aliases: ['Judg', 'Jdg', 'Jueces', 'Jue'] },
  { canonical: 'Ruth', testament: 'OT', category: 'HISTORY', aliases: ['Rut', 'Rt'] },
  { canonical: '1 Samuel', testament: 'OT', category: 'HISTORY', aliases: ['1Sam', '1 Sam', '1Sa', '1 Samuel', '1Samuel'] },
  { canonical: '2 Samuel', testament: 'OT', category: 'HISTORY', aliases: ['2Sam', '2 Sam', '2Sa', '2 Samuel', '2Samuel'] },
  { canonical: '1 Kings', testament: 'OT', category: 'HISTORY', aliases: ['1Kgs', '1 Kgs', '1Ki', '1 Reyes', '1Reyes', '1 Kings'] },
  { canonical: '2 Kings', testament: 'OT', category: 'HISTORY', aliases: ['2Kgs', '2 Kgs', '2Ki', '2 Reyes', '2Reyes', '2 Kings'] },
  { canonical: '1 Chronicles', testament: 'OT', category: 'HISTORY', aliases: ['1Chr', '1 Chr', '1Ch', '1 Crónicas', '1Crónicas', '1 Chronicles'] },
  { canonical: '2 Chronicles', testament: 'OT', category: 'HISTORY', aliases: ['2Chr', '2 Chr', '2Ch', '2 Crónicas', '2Crónicas', '2 Chronicles'] },
  { canonical: 'Ezra', testament: 'OT', category: 'HISTORY', aliases: ['Ezr', 'Esdras', 'Esd'] },
  { canonical: 'Nehemiah', testament: 'OT', category: 'HISTORY', aliases: ['Neh', 'Ne', 'Nehemías', 'Neh'] },
  { canonical: 'Esther', testament: 'OT', category: 'HISTORY', aliases: ['Est', 'Ester'] },
  
  // POETRY (Wisdom Literature)
  { canonical: 'Job', testament: 'OT', category: 'POETRY', aliases: ['Jb'] },
  { canonical: 'Psalms', testament: 'OT', category: 'POETRY', aliases: ['Ps', 'Psa', 'Psalm', 'Salmos', 'Salmo', 'Sal'] },
  { canonical: 'Proverbs', testament: 'OT', category: 'POETRY', aliases: ['Prov', 'Pr', 'Proverbios', 'Prov'] },
  { canonical: 'Ecclesiastes', testament: 'OT', category: 'POETRY', aliases: ['Eccl', 'Ecc', 'Eclesiastés', 'Ecl'] },
  { canonical: 'Song of Solomon', testament: 'OT', category: 'POETRY', aliases: ['Song', 'SoS', 'Song of Songs', 'Cantares', 'Cantar de los Cantares', 'Cnt'] },
  
  // PROPHETS (Major)
  { canonical: 'Isaiah', testament: 'OT', category: 'PROPHETS', aliases: ['Isa', 'Is', 'Isaías', 'Is'] },
  { canonical: 'Jeremiah', testament: 'OT', category: 'PROPHETS', aliases: ['Jer', 'Jr', 'Jeremías', 'Jer'] },
  { canonical: 'Lamentations', testament: 'OT', category: 'PROPHETS', aliases: ['Lam', 'La', 'Lamentaciones', 'Lm'] },
  { canonical: 'Ezekiel', testament: 'OT', category: 'PROPHETS', aliases: ['Ezek', 'Eze', 'Ezequiel', 'Ez'] },
  
  // APOCALYPTIC (OT)
  { canonical: 'Daniel', testament: 'OT', category: 'APOCALYPTIC', aliases: ['Dan', 'Dn'] },
  
  // PROPHETS (Minor)
  { canonical: 'Hosea', testament: 'OT', category: 'PROPHETS', aliases: ['Hos', 'Oseas', 'Os'] },
  { canonical: 'Joel', testament: 'OT', category: 'PROPHETS', aliases: ['Joe', 'Jl'] },
  { canonical: 'Amos', testament: 'OT', category: 'PROPHETS', aliases: ['Am'] },
  { canonical: 'Obadiah', testament: 'OT', category: 'PROPHETS', aliases: ['Obad', 'Ob', 'Abdías', 'Abd'] },
  { canonical: 'Jonah', testament: 'OT', category: 'PROPHETS', aliases: ['Jon', 'Jonás'] },
  { canonical: 'Micah', testament: 'OT', category: 'PROPHETS', aliases: ['Mic', 'Mi', 'Miqueas', 'Miq'] },
  { canonical: 'Nahum', testament: 'OT', category: 'PROPHETS', aliases: ['Nah', 'Na', 'Nahúm'] },
  { canonical: 'Habakkuk', testament: 'OT', category: 'PROPHETS', aliases: ['Hab', 'Habacuc', 'Hab'] },
  { canonical: 'Zephaniah', testament: 'OT', category: 'PROPHETS', aliases: ['Zeph', 'Zep', 'Sofonías', 'Sof'] },
  { canonical: 'Haggai', testament: 'OT', category: 'PROPHETS', aliases: ['Hag', 'Hageo', 'Hag'] },
  { canonical: 'Zechariah', testament: 'OT', category: 'PROPHETS', aliases: ['Zech', 'Zec', 'Zacarías', 'Zac'] },
  { canonical: 'Malachi', testament: 'OT', category: 'PROPHETS', aliases: ['Mal', 'Malaquías', 'Mal'] },
  
  // =========== NEW TESTAMENT ===========
  
  // GOSPELS
  { canonical: 'Matthew', testament: 'NT', category: 'GOSPELS', aliases: ['Matt', 'Mt', 'Mateo', 'Mat'] },
  { canonical: 'Mark', testament: 'NT', category: 'GOSPELS', aliases: ['Mk', 'Mr', 'Marcos', 'Mar'] },
  { canonical: 'Luke', testament: 'NT', category: 'GOSPELS', aliases: ['Lk', 'Lu', 'Lucas', 'Luc'] },
  { canonical: 'John', testament: 'NT', category: 'GOSPELS', aliases: ['Jn', 'Jhn', 'Juan', 'Jua'] },
  
  // ACTS
  { canonical: 'Acts', testament: 'NT', category: 'ACTS', aliases: ['Ac', 'Hechos', 'Hch'] },
  
  // EPISTLES (Pauline)
  { canonical: 'Romans', testament: 'NT', category: 'EPISTLES', aliases: ['Rom', 'Ro', 'Romanos', 'Rom'] },
  { canonical: '1 Corinthians', testament: 'NT', category: 'EPISTLES', aliases: ['1Cor', '1 Cor', '1Co', '1 Corintios', '1Corintios'] },
  { canonical: '2 Corinthians', testament: 'NT', category: 'EPISTLES', aliases: ['2Cor', '2 Cor', '2Co', '2 Corintios', '2Corintios'] },
  { canonical: 'Galatians', testament: 'NT', category: 'EPISTLES', aliases: ['Gal', 'Ga', 'Gálatas', 'Gál'] },
  { canonical: 'Ephesians', testament: 'NT', category: 'EPISTLES', aliases: ['Eph', 'Efesios', 'Ef'] },
  { canonical: 'Philippians', testament: 'NT', category: 'EPISTLES', aliases: ['Phil', 'Php', 'Filipenses', 'Fil'] },
  { canonical: 'Colossians', testament: 'NT', category: 'EPISTLES', aliases: ['Col', 'Colosenses', 'Col'] },
  { canonical: '1 Thessalonians', testament: 'NT', category: 'EPISTLES', aliases: ['1Thess', '1 Thess', '1Th', '1 Tesalonicenses', '1Tesalonicenses'] },
  { canonical: '2 Thessalonians', testament: 'NT', category: 'EPISTLES', aliases: ['2Thess', '2 Thess', '2Th', '2 Tesalonicenses', '2Tesalonicenses'] },
  { canonical: '1 Timothy', testament: 'NT', category: 'EPISTLES', aliases: ['1Tim', '1 Tim', '1Ti', '1 Timoteo', '1Timoteo'] },
  { canonical: '2 Timothy', testament: 'NT', category: 'EPISTLES', aliases: ['2Tim', '2 Tim', '2Ti', '2 Timoteo', '2Timoteo'] },
  { canonical: 'Titus', testament: 'NT', category: 'EPISTLES', aliases: ['Tit', 'Tito'] },
  { canonical: 'Philemon', testament: 'NT', category: 'EPISTLES', aliases: ['Phlm', 'Phm', 'Filemón', 'Flm'] },
  
  // EPISTLES (General)
  { canonical: 'Hebrews', testament: 'NT', category: 'EPISTLES', aliases: ['Heb', 'Hebreos', 'Heb'] },
  { canonical: 'James', testament: 'NT', category: 'EPISTLES', aliases: ['Jas', 'Jm', 'Santiago', 'Stg'] },
  { canonical: '1 Peter', testament: 'NT', category: 'EPISTLES', aliases: ['1Pet', '1 Pet', '1Pe', '1 Pedro', '1Pedro'] },
  { canonical: '2 Peter', testament: 'NT', category: 'EPISTLES', aliases: ['2Pet', '2 Pet', '2Pe', '2 Pedro', '2Pedro'] },
  { canonical: '1 John', testament: 'NT', category: 'EPISTLES', aliases: ['1Jn', '1 Jn', '1 John', '1 Juan', '1Juan'] },
  { canonical: '2 John', testament: 'NT', category: 'EPISTLES', aliases: ['2Jn', '2 Jn', '2 John', '2 Juan', '2Juan'] },
  { canonical: '3 John', testament: 'NT', category: 'EPISTLES', aliases: ['3Jn', '3 Jn', '3 John', '3 Juan', '3Juan'] },
  { canonical: 'Jude', testament: 'NT', category: 'EPISTLES', aliases: ['Jud', 'Judas'] },
  
  // APOCALYPTIC (NT)
  { canonical: 'Revelation', testament: 'NT', category: 'APOCALYPTIC', aliases: ['Rev', 'Rv', 'Apocalipsis', 'Ap'] },
];

// =============================================================================
// LOOKUP INDEX (built at module load for O(1) lookups)
// =============================================================================

const bookLookup: Map<string, BookInfo> = new Map();

// Build index from all canonical names and aliases
for (const book of BIBLE_BOOKS) {
  // Add canonical name
  bookLookup.set(book.canonical.toLowerCase(), book);
  
  // Add all aliases
  for (const alias of book.aliases) {
    bookLookup.set(alias.toLowerCase(), book);
  }
}

// =============================================================================
// CLASSIFICATION FUNCTIONS
// =============================================================================

/**
 * Parse a scripture reference string and extract the book name
 * Examples:
 * - "Daniel 2:44" → "Daniel"
 * - "1 Cor 13:4-7" → "1 Cor"
 * - "Mateo 5:1" → "Mateo"
 * - "Apocalipsis 21:1-4" → "Apocalipsis"
 */
export function parseBookFromReference(reference: string): string | null {
  if (!reference || typeof reference !== 'string') return null;
  
  const trimmed = reference.trim();
  if (!trimmed) return null;
  
  // Pattern to match book name (with optional number prefix like "1 ", "2 ")
  // Followed by chapter:verse which we want to exclude
  const match = trimmed.match(/^(\d?\s*[A-Za-záéíóúüñÁÉÍÓÚÜÑ]+(?:\s+[A-Za-záéíóúüñÁÉÍÓÚÜÑ]+)?)\s*\d/i);
  
  if (match) {
    return match[1].trim();
  }
  
  // If no chapter/verse found, might just be a book name
  const bookOnlyMatch = trimmed.match(/^(\d?\s*[A-Za-záéíóúüñÁÉÍÓÚÜÑ]+(?:\s+[A-Za-záéíóúüñÁÉÍÓÚÜÑ]+)?)$/i);
  if (bookOnlyMatch) {
    return bookOnlyMatch[1].trim();
  }
  
  return null;
}

/**
 * Parse chapter and verse from reference
 */
export function parseChapterVerse(reference: string): { chapter?: number; verse?: number; verseEnd?: number } {
  if (!reference) return {};
  
  // Match patterns like "3:16", "3:16-18", "3"
  const match = reference.match(/(\d+)(?::(\d+)(?:-(\d+))?)?/);
  
  if (!match) return {};
  
  return {
    chapter: match[1] ? parseInt(match[1]) : undefined,
    verse: match[2] ? parseInt(match[2]) : undefined,
    verseEnd: match[3] ? parseInt(match[3]) : undefined,
  };
}

/**
 * Look up book info from a book name
 */
export function lookupBook(bookName: string): BookInfo | null {
  if (!bookName) return null;
  
  const normalized = bookName.toLowerCase().trim();
  
  // Direct lookup
  const direct = bookLookup.get(normalized);
  if (direct) return direct;
  
  // Try without accents
  const noAccents = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const noAccentMatch = bookLookup.get(noAccents);
  if (noAccentMatch) return noAccentMatch;
  
  // Try partial matching for common variations
  for (const [key, book] of bookLookup.entries()) {
    if (key.startsWith(normalized) || normalized.startsWith(key)) {
      return book;
    }
  }
  
  return null;
}

/**
 * Classify a scripture reference
 * Main entry point for the classification engine
 */
export function classifyScripture(reference: string): ScriptureClassification | null {
  if (!reference) return null;
  
  const bookName = parseBookFromReference(reference);
  if (!bookName) return null;
  
  const bookInfo = lookupBook(bookName);
  if (!bookInfo) return null;
  
  const chapterVerse = parseChapterVerse(reference);
  
  return {
    book: bookInfo.canonical,
    bookNormalized: bookInfo.canonical,
    testament: bookInfo.testament,
    category: bookInfo.category,
    reference: reference,
    ...chapterVerse,
  };
}

/**
 * Get testament from book name
 */
export function getTestament(bookName: string): Testament | null {
  const bookInfo = lookupBook(bookName);
  return bookInfo?.testament ?? null;
}

/**
 * Get category from book name
 */
export function getScriptureCategory(bookName: string): ScriptureCategory | null {
  const bookInfo = lookupBook(bookName);
  return bookInfo?.category ?? null;
}

/**
 * Get canonical book name from any alias
 */
export function getCanonicalBookName(bookName: string): string | null {
  const bookInfo = lookupBook(bookName);
  return bookInfo?.canonical ?? null;
}

// =============================================================================
// DISPLAY LABELS
// =============================================================================

export const TESTAMENT_LABELS: Record<Testament, { en: string; es: string }> = {
  OT: { en: 'Old Testament', es: 'Antiguo Testamento' },
  NT: { en: 'New Testament', es: 'Nuevo Testamento' },
};

export const CATEGORY_LABELS: Record<ScriptureCategory, { en: string; es: string }> = {
  LAW: { en: 'Law (Torah)', es: 'Ley (Torá)' },
  HISTORY: { en: 'History', es: 'Historia' },
  POETRY: { en: 'Poetry & Wisdom', es: 'Poesía y Sabiduría' },
  PROPHETS: { en: 'Prophets', es: 'Profetas' },
  GOSPELS: { en: 'Gospels', es: 'Evangelios' },
  ACTS: { en: 'Acts', es: 'Hechos' },
  EPISTLES: { en: 'Epistles', es: 'Epístolas' },
  APOCALYPTIC: { en: 'Apocalyptic', es: 'Apocalíptico' },
};

// =============================================================================
// UTILITY FUNCTIONS FOR ANALYTICS
// =============================================================================

/**
 * Get all books in a category
 */
export function getBooksInCategory(category: ScriptureCategory): string[] {
  return BIBLE_BOOKS
    .filter(b => b.category === category)
    .map(b => b.canonical);
}

/**
 * Get all books in a testament
 */
export function getBooksInTestament(testament: Testament): string[] {
  return BIBLE_BOOKS
    .filter(b => b.testament === testament)
    .map(b => b.canonical);
}

/**
 * Get all category keys
 */
export function getAllCategories(): ScriptureCategory[] {
  return ['LAW', 'HISTORY', 'POETRY', 'PROPHETS', 'GOSPELS', 'ACTS', 'EPISTLES', 'APOCALYPTIC'];
}

/**
 * Get all testament keys
 */
export function getAllTestaments(): Testament[] {
  return ['OT', 'NT'];
}
