/**
 * Internal Verse Library for Smart Program Generation
 * Contains Bible verses organized by season/theme for auto-suggestions
 */

export interface Verse {
  reference: string;
  textEn: string;
  textEs: string;
  keywords: string[];
}

export interface SeasonConfig {
  name: string;
  nameEs: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  keywords: string[];
  verses: Verse[];
}

// Helper to determine if a date falls within a season range
export function isDateInRange(
  date: Date,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number
): boolean {
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  // Handle cross-year seasons (e.g., Advent/Christmas: Nov-Jan)
  if (startMonth > endMonth) {
    return (
      (month > startMonth || (month === startMonth && day >= startDay)) ||
      (month < endMonth || (month === endMonth && day <= endDay))
    );
  }

  return (
    (month > startMonth || (month === startMonth && day >= startDay)) &&
    (month < endMonth || (month === endMonth && day <= endDay))
  );
}

// Church seasons configuration (Adventist liturgical calendar)
export const SEASONS: SeasonConfig[] = [
  {
    name: 'Advent',
    nameEs: 'Adviento',
    startMonth: 11, // November
    startDay: 26,
    endMonth: 12,
    endDay: 24,
    keywords: ['advent', 'waiting', 'preparation', 'coming', 'hope'],
    verses: [
      {
        reference: 'Isaiah 9:6',
        textEn: 'For to us a child is born, to us a son is given...',
        textEs: 'Porque un niño nos es nacido, hijo nos es dado...',
        keywords: ['birth', 'messiah', 'prophecy'],
      },
      {
        reference: 'Luke 2:10-11',
        textEn: 'Do not be afraid. I bring you good news that will cause great joy...',
        textEs: 'No temáis; porque he aquí os doy nuevas de gran gozo...',
        keywords: ['joy', 'good news', 'birth'],
      },
      {
        reference: 'Matthew 1:23',
        textEn: 'The virgin will conceive and give birth to a son, and they will call him Immanuel...',
        textEs: 'He aquí, la virgen concebirá y dará a luz un hijo, y llamarás su nombre Emanuel...',
        keywords: ['immanuel', 'birth', 'prophecy'],
      },
    ],
  },
  {
    name: 'Christmas',
    nameEs: 'Navidad',
    startMonth: 12,
    startDay: 25,
    endMonth: 1,
    endDay: 6,
    keywords: ['christmas', 'birth', 'celebration', 'joy', 'peace'],
    verses: [
      {
        reference: 'Luke 2:14',
        textEn: 'Glory to God in the highest heaven, and on earth peace to those on whom his favor rests.',
        textEs: 'Gloria a Dios en las alturas, y en la tierra paz a los que gozan de su buena voluntad.',
        keywords: ['glory', 'peace', 'angels'],
      },
      {
        reference: 'John 1:14',
        textEn: 'The Word became flesh and made his dwelling among us...',
        textEs: 'Y aquel Verbo fue hecho carne, y habitó entre nosotros...',
        keywords: ['word', 'flesh', 'incarnation'],
      },
    ],
  },
  {
    name: 'Lent',
    nameEs: 'Cuaresma',
    startMonth: 2, // Flexible - calculated based on Easter
    startDay: 10,
    endMonth: 4,
    endDay: 10,
    keywords: ['lent', 'repentance', 'sacrifice', 'preparation', 'cross'],
    verses: [
      {
        reference: 'Joel 2:12-13',
        textEn: 'Return to me with all your heart, with fasting and weeping and mourning...',
        textEs: 'Convertíos a mí con todo vuestro corazón, con ayuno y lloro y lamento...',
        keywords: ['repentance', 'fasting', 'return'],
      },
      {
        reference: 'Isaiah 53:5',
        textEn: 'But he was pierced for our transgressions, he was crushed for our iniquities...',
        textEs: 'Mas él herido fue por nuestras rebeliones, molido por nuestros pecados...',
        keywords: ['sacrifice', 'healing', 'redemption'],
      },
    ],
  },
  {
    name: 'Easter',
    nameEs: 'Pascua',
    startMonth: 3, // Flexible based on Easter date
    startDay: 20,
    endMonth: 5,
    endDay: 31,
    keywords: ['easter', 'resurrection', 'victory', 'life', 'hope'],
    verses: [
      {
        reference: 'Matthew 28:6',
        textEn: 'He is not here; he has risen, just as he said...',
        textEs: 'No está aquí, pues ha resucitado, como dijo...',
        keywords: ['resurrection', 'risen', 'victory'],
      },
      {
        reference: '1 Corinthians 15:55',
        textEn: 'Where, O death, is your victory? Where, O death, is your sting?',
        textEs: '¿Dónde está, oh muerte, tu aguijón? ¿Dónde, oh sepulcro, tu victoria?',
        keywords: ['death', 'victory', 'triumph'],
      },
    ],
  },
  {
    name: 'Pentecost',
    nameEs: 'Pentecostés',
    startMonth: 5,
    startDay: 15,
    endMonth: 6,
    endDay: 15,
    keywords: ['pentecost', 'spirit', 'fire', 'power', 'unity'],
    verses: [
      {
        reference: 'Acts 2:4',
        textEn: 'All of them were filled with the Holy Spirit and began to speak in other tongues...',
        textEs: 'Y fueron todos llenos del Espíritu Santo, y comenzaron a hablar en otras lenguas...',
        keywords: ['spirit', 'tongues', 'filled'],
      },
      {
        reference: 'Joel 2:28',
        textEn: 'I will pour out my Spirit on all people...',
        textEs: 'Derramaré mi Espíritu sobre toda carne...',
        keywords: ['spirit', 'prophecy', 'outpouring'],
      },
    ],
  },
];

// General verses for Ordinary Time (no special season)
export const ORDINARY_VERSES: Verse[] = [
  {
    reference: 'Psalm 100:4',
    textEn: 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.',
    textEs: 'Entrad por sus puertas con acción de gracias, por sus atrios con alabanza; alabadle, bendecid su nombre.',
    keywords: ['worship', 'thanksgiving', 'praise', 'gates'],
  },
  {
    reference: 'Psalm 95:6',
    textEn: 'Come, let us bow down in worship, let us kneel before the LORD our Maker.',
    textEs: 'Venid, adoremos y postrémonos; arrodillémonos delante de Jehová nuestro Hacedor.',
    keywords: ['worship', 'kneel', 'maker'],
  },
  {
    reference: 'Psalm 150:6',
    textEn: 'Let everything that has breath praise the LORD. Praise the LORD.',
    textEs: 'Todo lo que respira alabe a JAH. Aleluya.',
    keywords: ['praise', 'breath', 'all'],
  },
  {
    reference: 'Hebrews 10:25',
    textEn: 'Let us not give up meeting together, as some are in the habit of doing, but let us encourage one another...',
    textEs: 'No dejemos de congregarnos, como algunos tienen por costumbre, sino exhortémonos...',
    keywords: ['fellowship', 'gathering', 'encourage'],
  },
  {
    reference: 'Matthew 18:20',
    textEn: 'For where two or three gather in my name, there am I with them.',
    textEs: 'Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos.',
    keywords: ['gathering', 'presence', 'together'],
  },
  {
    reference: 'Psalm 122:1',
    textEn: 'I rejoiced with those who said to me, "Let us go to the house of the LORD."',
    textEs: 'Yo me alegré con los que me decían: A la casa de Jehová iremos.',
    keywords: ['joy', 'house', 'sabbath'],
  },
  {
    reference: 'Exodus 20:8',
    textEn: 'Remember the Sabbath day by keeping it holy.',
    textEs: 'Acuérdate del día de reposo para santificarlo.',
    keywords: ['sabbath', 'holy', 'remember'],
  },
  {
    reference: 'Isaiah 58:13-14',
    textEn: 'If you keep your feet from breaking the Sabbath and from doing as you please on my holy day, if you call the Sabbath a delight...',
    textEs: 'Si retrajeres del día de reposo tu pie, de hacer tu voluntad en mi día santo, y lo llamares delicia...',
    keywords: ['sabbath', 'delight', 'holy'],
  },
];

// Section-specific verse suggestions
export const SECTION_VERSES: Record<string, Verse[]> = {
  welcome: [
    {
      reference: 'Psalm 100:4',
      textEn: 'Enter his gates with thanksgiving and his courts with praise.',
      textEs: 'Entrad por sus puertas con acción de gracias, por sus atrios con alabanza.',
      keywords: ['welcome', 'gates', 'praise'],
    },
  ],
  invocation: [
    {
      reference: 'Psalm 19:14',
      textEn: 'May these words of my mouth and this meditation of my heart be pleasing in your sight, LORD...',
      textEs: 'Sean gratos los dichos de mi boca y la meditación de mi corazón delante de ti, oh Jehová...',
      keywords: ['invocation', 'words', 'heart'],
    },
  ],
  offering: [
    {
      reference: 'Malachi 3:10',
      textEn: 'Bring the whole tithe into the storehouse, that there may be food in my house...',
      textEs: 'Traed todos los diezmos al alfolí y haya alimento en mi casa...',
      keywords: ['tithe', 'offering', 'blessing'],
    },
    {
      reference: '2 Corinthians 9:7',
      textEn: 'Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.',
      textEs: 'Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.',
      keywords: ['cheerful', 'giver', 'heart'],
    },
  ],
  benediction: [
    {
      reference: 'Numbers 6:24-26',
      textEn: 'The LORD bless you and keep you; the LORD make his face shine on you and be gracious to you...',
      textEs: 'Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti, y tenga de ti misericordia...',
      keywords: ['blessing', 'benediction', 'grace'],
    },
    {
      reference: '2 Corinthians 13:14',
      textEn: 'May the grace of the Lord Jesus Christ, and the love of God, and the fellowship of the Holy Spirit be with you all.',
      textEs: 'La gracia del Señor Jesucristo, el amor de Dios, y la comunión del Espíritu Santo sean con todos vosotros.',
      keywords: ['grace', 'love', 'fellowship'],
    },
  ],
};

/**
 * Detect the current liturgical season based on date
 */
export function detectSeason(date: Date): SeasonConfig | null {
  for (const season of SEASONS) {
    if (
      isDateInRange(
        date,
        season.startMonth,
        season.startDay,
        season.endMonth,
        season.endDay
      )
    ) {
      return season;
    }
  }
  return null; // Ordinary time
}

/**
 * Get verses appropriate for a date (season-specific or general)
 */
export function getVersesForDate(date: Date): Verse[] {
  const season = detectSeason(date);
  if (season) {
    return [...season.verses, ...ORDINARY_VERSES];
  }
  return ORDINARY_VERSES;
}

/**
 * Get verses for a specific section
 */
export function getVersesForSection(sectionKey: string): Verse[] {
  // Normalize section key to lowercase and check for partial matches
  const normalizedKey = sectionKey.toLowerCase();
  
  for (const [key, verses] of Object.entries(SECTION_VERSES)) {
    if (normalizedKey.includes(key)) {
      return verses;
    }
  }
  
  return ORDINARY_VERSES.slice(0, 3); // Default subset
}

/**
 * Get random verse for cover page
 */
export function getRandomCoverVerse(date: Date): Verse {
  const verses = getVersesForDate(date);
  const randomIndex = Math.floor(Math.random() * verses.length);
  return verses[randomIndex] ?? ORDINARY_VERSES[0];
}

/**
 * Extract keywords from season/date for hymn matching
 */
export function getKeywordsForDate(date: Date): string[] {
  const season = detectSeason(date);
  const keywords = ['worship', 'praise', 'sabbath'];
  
  if (season) {
    keywords.push(...season.keywords);
  }
  
  return keywords;
}
