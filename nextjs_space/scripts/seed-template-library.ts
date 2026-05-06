/**
 * =============================================================================
 * TEMPLATE LIBRARY SEED SCRIPT
 * Creates GLOBAL Christian templates and DENOMINATION-specific templates
 * =============================================================================
 */

import { PrismaClient, TemplateScope, Denomination } from '@prisma/client';

const prisma = new PrismaClient();

interface TemplateSection {
  order: number;
  title: string;
  titleEs?: string;
  role?: string;
  durationMin?: number;
  optional?: boolean;
  notes?: string;
}

interface TemplateDefinition {
  templateId: string;
  category: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  variables: string[];
  scope: TemplateScope;
  denomination: Denomination;
  sections: TemplateSection[];
}

// =============================================================================
// GLOBAL CHRISTIAN TEMPLATES (10 Base Templates)
// Available to ALL denominations
// =============================================================================

const GLOBAL_TEMPLATES: TemplateDefinition[] = [
  // 1. Sunday Worship Service
  {
    templateId: 'SUNDAY_WORSHIP_01',
    category: 'Weekly',
    name: 'Sunday Worship Service',
    nameEs: 'Culto Dominical',
    description: 'Standard Sunday morning worship service',
    descriptionEs: 'Culto de adoración dominical estándar',
    variables: ['pastor', 'worshipLeader', 'date'],
    scope: 'GLOBAL',
    denomination: 'CHRISTIAN',
    sections: [
      { order: 1, title: 'Prelude / Preludio', durationMin: 5, notes: 'Instrumental music as congregation gathers' },
      { order: 2, title: 'Welcome & Announcements', titleEs: 'Bienvenida y Anuncios', role: 'Host', durationMin: 5 },
      { order: 3, title: 'Call to Worship', titleEs: 'Llamado a la Adoración', role: 'Pastor', durationMin: 3 },
      { order: 4, title: 'Opening Hymn', titleEs: 'Himno de Apertura', durationMin: 4 },
      { order: 5, title: 'Invocation Prayer', titleEs: 'Oración de Invocación', role: 'Pastor', durationMin: 3 },
      { order: 6, title: 'Worship Songs', titleEs: 'Cánticos de Adoración', role: 'Worship Leader', durationMin: 15 },
      { order: 7, title: 'Scripture Reading', titleEs: 'Lectura Bíblica', role: 'Reader', durationMin: 5 },
      { order: 8, title: 'Pastoral Prayer', titleEs: 'Oración Pastoral', role: 'Pastor', durationMin: 5 },
      { order: 9, title: 'Offering', titleEs: 'Ofrenda', durationMin: 5 },
      { order: 10, title: 'Special Music', titleEs: 'Música Especial', durationMin: 5, optional: true },
      { order: 11, title: 'Sermon', titleEs: 'Sermón', role: 'Pastor', durationMin: 30 },
      { order: 12, title: 'Altar Call / Response', titleEs: 'Llamado al Altar', role: 'Pastor', durationMin: 5, optional: true },
      { order: 13, title: 'Closing Hymn', titleEs: 'Himno Final', durationMin: 4 },
      { order: 14, title: 'Benediction', titleEs: 'Bendición', role: 'Pastor', durationMin: 2 },
      { order: 15, title: 'Postlude / Postludio', durationMin: 3 },
    ],
  },

  // 2. Midweek Prayer Meeting
  {
    templateId: 'MIDWEEK_PRAYER_01',
    category: 'Weekly',
    name: 'Midweek Prayer Meeting',
    nameEs: 'Culto de Oración',
    description: 'Wednesday or midweek prayer and Bible study service',
    descriptionEs: 'Servicio de oración y estudio bíblico de mitad de semana',
    variables: ['leader', 'date'],
    scope: 'GLOBAL',
    denomination: 'CHRISTIAN',
    sections: [
      { order: 1, title: 'Opening Song', titleEs: 'Canto de Apertura', durationMin: 4 },
      { order: 2, title: 'Welcome', titleEs: 'Bienvenida', role: 'Leader', durationMin: 3 },
      { order: 3, title: 'Opening Prayer', titleEs: 'Oración Inicial', durationMin: 3 },
      { order: 4, title: 'Praise & Worship', titleEs: 'Alabanza y Adoración', durationMin: 15 },
      { order: 5, title: 'Bible Study / Devotional', titleEs: 'Estudio Bíblico / Devocional', role: 'Leader', durationMin: 20 },
      { order: 6, title: 'Prayer Requests', titleEs: 'Peticiones de Oración', durationMin: 10 },
      { order: 7, title: 'Group Prayer', titleEs: 'Oración en Grupos', durationMin: 15, notes: 'Small groups or united prayer' },
      { order: 8, title: 'Closing Song', titleEs: 'Canto Final', durationMin: 4 },
      { order: 9, title: 'Benediction', titleEs: 'Bendición', role: 'Leader', durationMin: 2 },
    ],
  },

  // 3. Youth Service
  {
    templateId: 'YOUTH_SERVICE_01',
    category: 'Weekly',
    name: 'Youth Service',
    nameEs: 'Culto Juvenil',
    description: 'Dynamic worship service designed for youth and young adults',
    descriptionEs: 'Servicio de adoración dinámico diseñado para jóvenes y adultos jóvenes',
    variables: ['youthLeader', 'speaker', 'date'],
    scope: 'GLOBAL',
    denomination: 'CHRISTIAN',
    sections: [
      { order: 1, title: 'Pre-Service Music', titleEs: 'Música Pre-Servicio', durationMin: 10 },
      { order: 2, title: 'Welcome & Icebreaker', titleEs: 'Bienvenida y Rompe Hielo', role: 'Youth Leader', durationMin: 10 },
      { order: 3, title: 'Worship Set', titleEs: 'Set de Adoración', role: 'Worship Team', durationMin: 20 },
      { order: 4, title: 'Announcements & Birthdays', titleEs: 'Anuncios y Cumpleaños', durationMin: 5 },
      { order: 5, title: 'Testimony / Video', titleEs: 'Testimonio / Video', durationMin: 5, optional: true },
      { order: 6, title: 'Message', titleEs: 'Mensaje', role: 'Speaker', durationMin: 25 },
      { order: 7, title: 'Response Time', titleEs: 'Tiempo de Respuesta', durationMin: 10 },
      { order: 8, title: 'Closing Song', titleEs: 'Canto Final', durationMin: 5 },
      { order: 9, title: 'Closing Prayer', titleEs: 'Oración Final', role: 'Youth Leader', durationMin: 3 },
      { order: 10, title: 'Fellowship / Snacks', titleEs: 'Confraternización / Refrigerio', durationMin: 15, optional: true },
    ],
  },

  // 4. Family Worship Night
  {
    templateId: 'FAMILY_WORSHIP_01',
    category: 'Weekly',
    name: 'Family Worship Night',
    nameEs: 'Noche de Adoración Familiar',
    description: 'Intergenerational worship service for the whole family',
    descriptionEs: 'Servicio de adoración intergeneracional para toda la familia',
    variables: ['leader', 'date'],
    scope: 'GLOBAL',
    denomination: 'CHRISTIAN',
    sections: [
      { order: 1, title: 'Family Gathering Song', titleEs: 'Canto de Reunión Familiar', durationMin: 5 },
      { order: 2, title: 'Welcome', titleEs: 'Bienvenida', role: 'Leader', durationMin: 3 },
      { order: 3, title: 'Family Worship Songs', titleEs: 'Cantos de Adoración Familiar', durationMin: 15, notes: 'Include songs for all ages' },
      { order: 4, title: 'Children\'s Moment', titleEs: 'Momento Infantil', durationMin: 5 },
      { order: 5, title: 'Scripture Reading', titleEs: 'Lectura Bíblica', durationMin: 5, notes: 'Family members read together' },
      { order: 6, title: 'Family Devotional', titleEs: 'Devocional Familiar', role: 'Leader', durationMin: 15 },
      { order: 7, title: 'Family Prayer Time', titleEs: 'Tiempo de Oración Familiar', durationMin: 10, notes: 'Families pray together' },
      { order: 8, title: 'Activity / Craft', titleEs: 'Actividad / Manualidad', durationMin: 15, optional: true },
      { order: 9, title: 'Closing Song', titleEs: 'Canto Final', durationMin: 4 },
      { order: 10, title: 'Family Blessing', titleEs: 'Bendición Familiar', role: 'Leader', durationMin: 3 },
    ],
  },

  // 5. Communion Service
  {
    templateId: 'COMMUNION_01',
    category: 'Ordinances',
    name: 'Communion Service',
    nameEs: 'Servicio de Santa Cena',
    description: 'Lord\'s Supper / Holy Communion service',
    descriptionEs: 'Servicio de la Cena del Señor / Santa Comunión',
    variables: ['pastor', 'elders', 'date'],
    scope: 'GLOBAL',
    denomination: 'CHRISTIAN',
    sections: [
      { order: 1, title: 'Prelude / Preludio', durationMin: 5 },
      { order: 2, title: 'Welcome', titleEs: 'Bienvenida', role: 'Pastor', durationMin: 3 },
      { order: 3, title: 'Opening Hymn', titleEs: 'Himno de Apertura', durationMin: 4 },
      { order: 4, title: 'Scripture: Institution of Lord\'s Supper', titleEs: 'Escritura: Institución de la Cena', role: 'Pastor', durationMin: 5, notes: '1 Cor 11:23-26 or Matthew 26:26-29' },
      { order: 5, title: 'Meditation on the Bread', titleEs: 'Meditación sobre el Pan', role: 'Pastor', durationMin: 5 },
      { order: 6, title: 'Prayer of Blessing (Bread)', titleEs: 'Oración de Bendición (Pan)', role: 'Elder', durationMin: 2 },
      { order: 7, title: 'Distribution of Bread', titleEs: 'Distribución del Pan', durationMin: 5, notes: 'Deacons/Elders serve' },
      { order: 8, title: 'Partaking of Bread', titleEs: 'Participación del Pan', durationMin: 3 },
      { order: 9, title: 'Meditation on the Cup', titleEs: 'Meditación sobre la Copa', role: 'Pastor', durationMin: 5 },
      { order: 10, title: 'Prayer of Blessing (Cup)', titleEs: 'Oración de Bendición (Copa)', role: 'Elder', durationMin: 2 },
      { order: 11, title: 'Distribution of Cup', titleEs: 'Distribución de la Copa', durationMin: 5 },
      { order: 12, title: 'Partaking of Cup', titleEs: 'Participación de la Copa', durationMin: 3 },
      { order: 13, title: 'Closing Hymn', titleEs: 'Himno Final', durationMin: 4 },
      { order: 14, title: 'Benediction', titleEs: 'Bendición', role: 'Pastor', durationMin: 2 },
    ],
  },

  // 6. Wedding Ceremony
  {
    templateId: 'WEDDING_01',
    category: 'Ceremonies',
    name: 'Wedding Ceremony',
    nameEs: 'Ceremonia de Boda',
    description: 'Christian wedding ceremony',
    descriptionEs: 'Ceremonia de matrimonio cristiano',
    variables: ['bride', 'groom', 'officiant', 'date', 'venue'],
    scope: 'GLOBAL',
    denomination: 'CHRISTIAN',
    sections: [
      { order: 1, title: 'Prelude / Preludio', durationMin: 10 },
      { order: 2, title: 'Seating of Parents', titleEs: 'Entrada de los Padres', durationMin: 3 },
      { order: 3, title: 'Processional', titleEs: 'Procesional', durationMin: 5 },
      { order: 4, title: 'Giving of the Bride', titleEs: 'Entrega de la Novia', role: 'Father', durationMin: 2 },
      { order: 5, title: 'Welcome & Opening Prayer', titleEs: 'Bienvenida y Oración', role: 'Officiant', durationMin: 5 },
      { order: 6, title: 'Scripture Reading', titleEs: 'Lectura Bíblica', role: 'Reader', durationMin: 3 },
      { order: 7, title: 'Message', titleEs: 'Mensaje', role: 'Officiant', durationMin: 10 },
      { order: 8, title: 'Exchange of Vows', titleEs: 'Intercambio de Votos', durationMin: 5 },
      { order: 9, title: 'Ring Ceremony', titleEs: 'Ceremonia de Anillos', durationMin: 3 },
      { order: 10, title: 'Unity Ceremony', titleEs: 'Ceremonia de Unidad', durationMin: 5, optional: true, notes: 'Candle, sand, or other unity symbol' },
      { order: 11, title: 'Special Music', titleEs: 'Música Especial', durationMin: 4, optional: true },
      { order: 12, title: 'Declaration of Marriage', titleEs: 'Declaración de Matrimonio', role: 'Officiant', durationMin: 3 },
      { order: 13, title: 'Blessing Prayer', titleEs: 'Oración de Bendición', role: 'Officiant', durationMin: 3 },
      { order: 14, title: 'Presentation of Couple', titleEs: 'Presentación de la Pareja', role: 'Officiant', durationMin: 2 },
      { order: 15, title: 'Recessional', titleEs: 'Recesional', durationMin: 3 },
    ],
  },

  // 7. Funeral / Memorial Service
  {
    templateId: 'FUNERAL_01',
    category: 'Ceremonies',
    name: 'Funeral / Memorial Service',
    nameEs: 'Servicio Fúnebre / Memorial',
    description: 'Christian funeral or memorial service',
    descriptionEs: 'Servicio fúnebre o memorial cristiano',
    variables: ['deceased', 'pastor', 'date', 'venue'],
    scope: 'GLOBAL',
    denomination: 'CHRISTIAN',
    sections: [
      { order: 1, title: 'Prelude / Preludio', durationMin: 10 },
      { order: 2, title: 'Opening Words', titleEs: 'Palabras de Apertura', role: 'Pastor', durationMin: 3 },
      { order: 3, title: 'Opening Prayer', titleEs: 'Oración Inicial', role: 'Pastor', durationMin: 3 },
      { order: 4, title: 'Scripture Reading', titleEs: 'Lectura Bíblica', role: 'Reader', durationMin: 5, notes: 'Psalm 23, John 14:1-6, or other comfort passages' },
      { order: 5, title: 'Hymn / Special Music', titleEs: 'Himno / Música Especial', durationMin: 4 },
      { order: 6, title: 'Obituary Reading', titleEs: 'Lectura del Obituario', durationMin: 5 },
      { order: 7, title: 'Tributes / Memories', titleEs: 'Tributos / Memorias', durationMin: 15, notes: 'Family and friends share' },
      { order: 8, title: 'Special Music', titleEs: 'Música Especial', durationMin: 4, optional: true },
      { order: 9, title: 'Message of Hope', titleEs: 'Mensaje de Esperanza', role: 'Pastor', durationMin: 15 },
      { order: 10, title: 'Closing Prayer', titleEs: 'Oración Final', role: 'Pastor', durationMin: 3 },
      { order: 11, title: 'Closing Hymn', titleEs: 'Himno Final', durationMin: 4 },
      { order: 12, title: 'Benediction', titleEs: 'Bendición', role: 'Pastor', durationMin: 2 },
      { order: 13, title: 'Postlude / Viewing', titleEs: 'Postludio / Visita', durationMin: 10, optional: true },
    ],
  },

  // 8. Child Dedication
  {
    templateId: 'CHILD_DEDICATION_01',
    category: 'Ceremonies',
    name: 'Child Dedication',
    nameEs: 'Dedicación de Niños',
    description: 'Service for dedicating children to the Lord',
    descriptionEs: 'Servicio para dedicar niños al Señor',
    variables: ['childName', 'parents', 'pastor', 'date'],
    scope: 'GLOBAL',
    denomination: 'CHRISTIAN',
    sections: [
      { order: 1, title: 'Welcome', titleEs: 'Bienvenida', role: 'Pastor', durationMin: 2 },
      { order: 2, title: 'Introduction & Purpose', titleEs: 'Introducción y Propósito', role: 'Pastor', durationMin: 3, notes: 'Explain biblical basis for child dedication' },
      { order: 3, title: 'Scripture Reading', titleEs: 'Lectura Bíblica', role: 'Pastor', durationMin: 3, notes: 'Mark 10:13-16, Luke 2:22-32, 1 Samuel 1:27-28' },
      { order: 4, title: 'Questions to Parents', titleEs: 'Preguntas a los Padres', role: 'Pastor', durationMin: 3 },
      { order: 5, title: 'Congregational Pledge', titleEs: 'Compromiso de la Congregación', role: 'Pastor', durationMin: 2 },
      { order: 6, title: 'Prayer of Dedication', titleEs: 'Oración de Dedicación', role: 'Pastor', durationMin: 3 },
      { order: 7, title: 'Presentation of Certificate', titleEs: 'Entrega de Certificado', durationMin: 2 },
      { order: 8, title: 'Blessing Song', titleEs: 'Canto de Bendición', durationMin: 3, optional: true },
      { order: 9, title: 'Congregation Welcome', titleEs: 'Bienvenida de la Congregación', durationMin: 2 },
    ],
  },

  // 9. Baptism Service
  {
    templateId: 'BAPTISM_01',
    category: 'Ordinances',
    name: 'Baptism Service',
    nameEs: 'Servicio de Bautismo',
    description: 'Christian baptism service',
    descriptionEs: 'Servicio de bautismo cristiano',
    variables: ['candidates', 'pastor', 'date'],
    scope: 'GLOBAL',
    denomination: 'CHRISTIAN',
    sections: [
      { order: 1, title: 'Opening Hymn', titleEs: 'Himno de Apertura', durationMin: 4 },
      { order: 2, title: 'Welcome & Introduction', titleEs: 'Bienvenida e Introducción', role: 'Pastor', durationMin: 3 },
      { order: 3, title: 'Scripture: Meaning of Baptism', titleEs: 'Escritura: Significado del Bautismo', role: 'Pastor', durationMin: 5, notes: 'Matthew 28:19-20, Romans 6:3-4' },
      { order: 4, title: 'Brief Message', titleEs: 'Breve Mensaje', role: 'Pastor', durationMin: 10 },
      { order: 5, title: 'Candidate Testimonies', titleEs: 'Testimonios de Candidatos', durationMin: 10, optional: true },
      { order: 6, title: 'Baptismal Vows', titleEs: 'Votos Bautismales', role: 'Pastor', durationMin: 5 },
      { order: 7, title: 'Prayer', titleEs: 'Oración', role: 'Pastor', durationMin: 3 },
      { order: 8, title: 'Baptism', titleEs: 'Bautismo', durationMin: 15, notes: 'Time varies based on number of candidates' },
      { order: 9, title: 'Welcome to Fellowship', titleEs: 'Bienvenida a la Comunidad', role: 'Pastor', durationMin: 3 },
      { order: 10, title: 'Closing Hymn', titleEs: 'Himno Final', durationMin: 4 },
      { order: 11, title: 'Benediction', titleEs: 'Bendición', role: 'Pastor', durationMin: 2 },
    ],
  },

  // 10. Vow Renewal
  {
    templateId: 'VOW_RENEWAL_01',
    category: 'Ceremonies',
    name: 'Marriage Vow Renewal',
    nameEs: 'Renovación de Votos Matrimoniales',
    description: 'Service for couples renewing their wedding vows',
    descriptionEs: 'Servicio para parejas que renuevan sus votos matrimoniales',
    variables: ['couple', 'officiant', 'anniversary', 'date'],
    scope: 'GLOBAL',
    denomination: 'CHRISTIAN',
    sections: [
      { order: 1, title: 'Prelude / Preludio', durationMin: 5 },
      { order: 2, title: 'Welcome', titleEs: 'Bienvenida', role: 'Officiant', durationMin: 3 },
      { order: 3, title: 'Opening Prayer', titleEs: 'Oración de Apertura', role: 'Officiant', durationMin: 2 },
      { order: 4, title: 'Scripture Reading', titleEs: 'Lectura Bíblica', role: 'Reader', durationMin: 3 },
      { order: 5, title: 'Reflection on Marriage Journey', titleEs: 'Reflexión sobre el Viaje Matrimonial', role: 'Officiant', durationMin: 8 },
      { order: 6, title: 'Special Music', titleEs: 'Música Especial', durationMin: 4, optional: true },
      { order: 7, title: 'Renewal of Vows', titleEs: 'Renovación de Votos', durationMin: 5 },
      { order: 8, title: 'Ring Blessing', titleEs: 'Bendición de Anillos', durationMin: 3, optional: true },
      { order: 9, title: 'Prayer of Blessing', titleEs: 'Oración de Bendición', role: 'Officiant', durationMin: 3 },
      { order: 10, title: 'Declaration & Kiss', titleEs: 'Declaración y Beso', role: 'Officiant', durationMin: 2 },
      { order: 11, title: 'Closing Song', titleEs: 'Canto Final', durationMin: 4 },
      { order: 12, title: 'Benediction', titleEs: 'Bendición', role: 'Officiant', durationMin: 2 },
    ],
  },
];

// =============================================================================
// SDA DENOMINATION TEMPLATES
// Seventh-day Adventist specific templates
// =============================================================================

const SDA_TEMPLATES: TemplateDefinition[] = [
  // Sabbath School + Divine Worship (Combined)
  {
    templateId: 'SDA_SABBATH_WORSHIP_01',
    category: 'Weekly',
    name: 'Sabbath Worship (Sabbath School + Divine Service)',
    nameEs: 'Culto Sabático (Escuela Sabática + Culto Divino)',
    description: 'Complete Sabbath morning program including Sabbath School and Divine Worship',
    descriptionEs: 'Programa sabático completo incluyendo Escuela Sabática y Culto Divino',
    variables: ['pastor', 'ssLeader', 'date'],
    scope: 'DENOMINATION',
    denomination: 'SDA',
    sections: [
      // Sabbath School Block
      { order: 1, title: '─── SABBATH SCHOOL / ESCUELA SABÁTICA ───', durationMin: 0, notes: 'Block divider' },
      { order: 2, title: 'Opening Song', titleEs: 'Canto de Apertura', durationMin: 4 },
      { order: 3, title: 'Opening Prayer', titleEs: 'Oración Inicial', role: 'SS Leader', durationMin: 2 },
      { order: 4, title: 'Welcome & Mission Spotlight', titleEs: 'Bienvenida y Enfoque Misionero', durationMin: 5 },
      { order: 5, title: 'Mission Story / Offering Appeal', titleEs: 'Historia Misionera / Llamado de Ofrenda', durationMin: 5 },
      { order: 6, title: 'Lesson Study Groups', titleEs: 'Estudio de la Lección en Grupos', durationMin: 40 },
      { order: 7, title: 'Lesson Review', titleEs: 'Repaso de la Lección', durationMin: 10 },
      { order: 8, title: 'Closing Prayer', titleEs: 'Oración Final', durationMin: 2 },
      { order: 9, title: 'Transition / Intermedio', durationMin: 10 },
      // Divine Worship Block
      { order: 10, title: '─── DIVINE SERVICE / CULTO DIVINO ───', durationMin: 0, notes: 'Block divider' },
      { order: 11, title: 'Prelude / Preludio', durationMin: 5 },
      { order: 12, title: 'Introit / Entrada', durationMin: 3 },
      { order: 13, title: 'Call to Worship', titleEs: 'Llamado a la Adoración', role: 'Elder', durationMin: 2 },
      { order: 14, title: 'Doxology / Doxología', durationMin: 2 },
      { order: 15, title: 'Invocation', titleEs: 'Invocación', role: 'Elder', durationMin: 2 },
      { order: 16, title: 'Hymn of Praise', titleEs: 'Himno de Alabanza', durationMin: 4 },
      { order: 17, title: 'Children\'s Story', titleEs: 'Historia Infantil', durationMin: 5 },
      { order: 18, title: 'Offering Appeal', titleEs: 'Llamado de Ofrenda', role: 'Elder', durationMin: 3 },
      { order: 19, title: 'Offering / Ofrenda', durationMin: 5 },
      { order: 20, title: 'Special Music', titleEs: 'Música Especial', durationMin: 5, optional: true },
      { order: 21, title: 'Scripture Reading', titleEs: 'Lectura Bíblica', role: 'Reader', durationMin: 3 },
      { order: 22, title: 'Pastoral Prayer', titleEs: 'Oración Pastoral', role: 'Pastor', durationMin: 5 },
      { order: 23, title: 'Hymn of Preparation', titleEs: 'Himno de Preparación', durationMin: 4 },
      { order: 24, title: 'Sermon', titleEs: 'Sermón', role: 'Pastor', durationMin: 30 },
      { order: 25, title: 'Closing Hymn', titleEs: 'Himno Final', durationMin: 4 },
      { order: 26, title: 'Benediction', titleEs: 'Bendición', role: 'Pastor', durationMin: 2 },
      { order: 27, title: 'Postlude / Postludio', durationMin: 3 },
    ],
  },

  // Friday Vespers (Sabbath Welcome)
  {
    templateId: 'SDA_FRIDAY_VESPERS_01',
    category: 'Weekly',
    name: 'Friday Vespers (Sabbath Welcome)',
    nameEs: 'Recibimiento del Sábado',
    description: 'Friday evening service welcoming the Sabbath',
    descriptionEs: 'Servicio vespertino de viernes para recibir el sábado',
    variables: ['leader', 'date'],
    scope: 'DENOMINATION',
    denomination: 'SDA',
    sections: [
      { order: 1, title: 'Musical Prelude', titleEs: 'Preludio Musical', durationMin: 5 },
      { order: 2, title: 'Welcome & Sabbath Greeting', titleEs: 'Bienvenida y Saludo Sabático', role: 'Leader', durationMin: 3 },
      { order: 3, title: 'Opening Song (Sabbath Theme)', titleEs: 'Canto de Apertura (Tema Sabático)', durationMin: 4 },
      { order: 4, title: 'Scripture: Creation Sabbath', titleEs: 'Escritura: Sábado de Creación', role: 'Reader', durationMin: 3 },
      { order: 5, title: 'Sabbath Reflection', titleEs: 'Reflexión Sabática', role: 'Leader', durationMin: 10 },
      { order: 6, title: 'Worship Songs', titleEs: 'Cantos de Adoración', durationMin: 15 },
      { order: 7, title: 'Testimonies / Prayer Requests', titleEs: 'Testimonios / Pedidos de Oración', durationMin: 10, optional: true },
      { order: 8, title: 'Consecration Prayer', titleEs: 'Oración de Consagración', role: 'Leader', durationMin: 5 },
      { order: 9, title: 'Closing Song', titleEs: 'Canto Final', durationMin: 4 },
      { order: 10, title: 'Sabbath Blessing', titleEs: 'Bendición Sabática', role: 'Leader', durationMin: 2 },
    ],
  },

  // Communion with Foot Washing (SDA Ordinance of Humility)
  {
    templateId: 'SDA_COMMUNION_01',
    category: 'Ordinances',
    name: 'Communion Service with Ordinance of Humility',
    nameEs: 'Santa Cena con Rito de Humildad',
    description: 'Quarterly communion service including foot washing ceremony',
    descriptionEs: 'Servicio trimestral de comunión incluyendo el lavamiento de pies',
    variables: ['pastor', 'elders', 'deacons', 'date'],
    scope: 'DENOMINATION',
    denomination: 'SDA',
    sections: [
      { order: 1, title: 'Prelude / Preludio', durationMin: 5 },
      { order: 2, title: 'Welcome & Introduction', titleEs: 'Bienvenida e Introducción', role: 'Pastor', durationMin: 5 },
      { order: 3, title: 'Opening Hymn', titleEs: 'Himno de Apertura', durationMin: 4 },
      { order: 4, title: 'Scripture: John 13', titleEs: 'Escritura: Juan 13', role: 'Pastor', durationMin: 5 },
      { order: 5, title: '─── ORDINANCE OF HUMILITY / RITO DE HUMILDAD ───', durationMin: 0 },
      { order: 6, title: 'Explanation of Foot Washing', titleEs: 'Explicación del Lavamiento de Pies', role: 'Pastor', durationMin: 5 },
      { order: 7, title: 'Separation for Foot Washing', titleEs: 'Separación para Lavamiento', durationMin: 3, notes: 'Men and women separate' },
      { order: 8, title: 'Foot Washing Ceremony', titleEs: 'Ceremonia de Lavamiento de Pies', durationMin: 20 },
      { order: 9, title: 'Reunion Hymn', titleEs: 'Himno de Reunión', durationMin: 4 },
      { order: 10, title: '─── LORD\'S SUPPER / SANTA CENA ───', durationMin: 0 },
      { order: 11, title: 'Scripture: 1 Cor 11:23-26', titleEs: 'Escritura: 1 Cor 11:23-26', role: 'Pastor', durationMin: 3 },
      { order: 12, title: 'Meditation on the Bread', titleEs: 'Meditación sobre el Pan', role: 'Pastor', durationMin: 5 },
      { order: 13, title: 'Prayer of Blessing (Bread)', titleEs: 'Oración de Bendición (Pan)', role: 'Elder', durationMin: 2 },
      { order: 14, title: 'Distribution of Bread', titleEs: 'Distribución del Pan', durationMin: 5 },
      { order: 15, title: 'Partaking of Bread', titleEs: 'Participación del Pan', durationMin: 3 },
      { order: 16, title: 'Meditation on the Cup', titleEs: 'Meditación sobre la Copa', role: 'Pastor', durationMin: 5 },
      { order: 17, title: 'Prayer of Blessing (Cup)', titleEs: 'Oración de Bendición (Copa)', role: 'Elder', durationMin: 2 },
      { order: 18, title: 'Distribution of Cup', titleEs: 'Distribución de la Copa', durationMin: 5 },
      { order: 19, title: 'Partaking of Cup', titleEs: 'Participación de la Copa', durationMin: 3 },
      { order: 20, title: 'Closing Hymn', titleEs: 'Himno Final', durationMin: 4 },
      { order: 21, title: 'Benediction', titleEs: 'Bendición', role: 'Pastor', durationMin: 2 },
    ],
  },

  // AY (Adventist Youth) Program
  {
    templateId: 'SDA_AY_PROGRAM_01',
    category: 'Weekly',
    name: 'Adventist Youth (AY) Program',
    nameEs: 'Programa de Jóvenes Adventistas (JA)',
    description: 'Saturday afternoon youth program with Pathfinder/AY activities',
    descriptionEs: 'Programa juvenil sabatino con actividades de Conquistadores/JA',
    variables: ['ayLeader', 'speaker', 'date'],
    scope: 'DENOMINATION',
    denomination: 'SDA',
    sections: [
      { order: 1, title: 'Opening Song', titleEs: 'Canto de Apertura', durationMin: 4 },
      { order: 2, title: 'Welcome & AY Pledge', titleEs: 'Bienvenida y Voto JA', role: 'AY Leader', durationMin: 5, notes: 'Include AY pledge and aim' },
      { order: 3, title: 'Opening Prayer', titleEs: 'Oración Inicial', durationMin: 2 },
      { order: 4, title: 'Praise & Worship', titleEs: 'Alabanza y Adoración', durationMin: 15 },
      { order: 5, title: 'Scripture Spotlight', titleEs: 'Enfoque Bíblico', durationMin: 5 },
      { order: 6, title: 'Mission Report / Outreach', titleEs: 'Informe Misionero / Alcance', durationMin: 10, optional: true },
      { order: 7, title: 'Special Feature / Game', titleEs: 'Presentación Especial / Juego', durationMin: 15, optional: true },
      { order: 8, title: 'Message', titleEs: 'Mensaje', role: 'Speaker', durationMin: 20 },
      { order: 9, title: 'Response / Commitment', titleEs: 'Respuesta / Compromiso', durationMin: 5 },
      { order: 10, title: 'Announcements', titleEs: 'Anuncios', durationMin: 5 },
      { order: 11, title: 'Closing Song', titleEs: 'Canto Final', durationMin: 4 },
      { order: 12, title: 'Closing Prayer', titleEs: 'Oración Final', durationMin: 2 },
    ],
  },

  // Quinceañera (15th Birthday Dedication) - Hispanic SDA tradition
  {
    templateId: 'SDA_QUINCEANERA_01',
    category: 'Ceremonies',
    name: 'Quinceañera Dedication',
    nameEs: 'Quinceañera - Dedicación de los 15 Años',
    description: 'Religious ceremony celebrating a young woman\'s 15th birthday',
    descriptionEs: 'Ceremonia religiosa celebrando los 15 años de una joven',
    variables: ['quinceañera', 'parents', 'pastor', 'date'],
    scope: 'DENOMINATION',
    denomination: 'SDA',
    sections: [
      { order: 1, title: 'Musical Prelude', titleEs: 'Preludio Musical', durationMin: 5 },
      { order: 2, title: 'Entrance of Court', titleEs: 'Entrada de la Corte', durationMin: 5, notes: 'Damas and chambelanes enter' },
      { order: 3, title: 'Entrance of Quinceañera', titleEs: 'Entrada de la Quinceañera', durationMin: 3 },
      { order: 4, title: 'Welcome', titleEs: 'Bienvenida', role: 'Pastor', durationMin: 3 },
      { order: 5, title: 'Opening Prayer', titleEs: 'Oración Inicial', role: 'Pastor', durationMin: 2 },
      { order: 6, title: 'Scripture Reading', titleEs: 'Lectura Bíblica', role: 'Reader', durationMin: 3, notes: 'Proverbs 31, Psalm 139' },
      { order: 7, title: 'Message of Faith', titleEs: 'Mensaje de Fe', role: 'Pastor', durationMin: 15 },
      { order: 8, title: 'Parents\' Words', titleEs: 'Palabras de los Padres', durationMin: 5 },
      { order: 9, title: 'Presentation of Symbols', titleEs: 'Presentación de Símbolos', durationMin: 10, notes: 'Bible, ring, crown, last doll, etc.' },
      { order: 10, title: 'Special Music / Dance', titleEs: 'Música Especial / Vals', durationMin: 5 },
      { order: 11, title: 'Dedication Vows', titleEs: 'Votos de Dedicación', durationMin: 5 },
      { order: 12, title: 'Prayer of Blessing', titleEs: 'Oración de Bendición', role: 'Pastor', durationMin: 3 },
      { order: 13, title: 'Closing Song', titleEs: 'Canto Final', durationMin: 4 },
      { order: 14, title: 'Benediction', titleEs: 'Bendición', role: 'Pastor', durationMin: 2 },
    ],
  },
];

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

async function seedTemplateLibrary() {
  console.log('\n🔧 TEMPLATE LIBRARY SEED SCRIPT');
  console.log('================================\n');

  // First, update existing templates with new fields
  console.log('Updating existing templates with scope/denomination fields...');
  await prisma.ceremonyTemplate.updateMany({
    where: { scope: undefined as any },
    data: {
      scope: 'GLOBAL',
      denomination: 'CHRISTIAN',
    },
  });

  // Seed GLOBAL templates
  console.log('\n📚 Seeding GLOBAL Christian templates...');
  let globalCount = 0;
  for (const template of GLOBAL_TEMPLATES) {
    try {
      await prisma.ceremonyTemplate.upsert({
        where: { templateId: template.templateId },
        update: {
          category: template.category,
          name: template.name,
          nameEs: template.nameEs,
          description: template.description,
          descriptionEs: template.descriptionEs,
          variables: template.variables,
          scope: template.scope,
          denomination: template.denomination,
        },
        create: {
          templateId: template.templateId,
          category: template.category,
          name: template.name,
          nameEs: template.nameEs,
          description: template.description,
          descriptionEs: template.descriptionEs,
          variables: template.variables,
          scope: template.scope,
          denomination: template.denomination,
        },
      });

      // Upsert sections
      const createdTemplate = await prisma.ceremonyTemplate.findUnique({
        where: { templateId: template.templateId },
      });
      if (createdTemplate) {
        // Delete existing sections and recreate
        await prisma.ceremonyTemplateSection.deleteMany({
          where: { templateId: createdTemplate.id },
        });

        await prisma.ceremonyTemplateSection.createMany({
          data: template.sections.map((s) => ({
            templateId: createdTemplate.id,
            order: s.order,
            title: s.titleEs ? `${s.title} / ${s.titleEs}` : s.title,
            role: s.role || null,
            durationMin: s.durationMin || null,
            optional: s.optional || false,
            notes: s.notes || null,
          })),
        });
      }

      console.log(`  ✓ ${template.templateId}: ${template.name}`);
      globalCount++;
    } catch (error) {
      console.error(`  ✗ Error seeding ${template.templateId}:`, error);
    }
  }
  console.log(`\n  → ${globalCount} GLOBAL templates seeded`);

  // Seed SDA templates
  console.log('\n⛪ Seeding SDA denomination templates...');
  let sdaCount = 0;
  for (const template of SDA_TEMPLATES) {
    try {
      await prisma.ceremonyTemplate.upsert({
        where: { templateId: template.templateId },
        update: {
          category: template.category,
          name: template.name,
          nameEs: template.nameEs,
          description: template.description,
          descriptionEs: template.descriptionEs,
          variables: template.variables,
          scope: template.scope,
          denomination: template.denomination,
        },
        create: {
          templateId: template.templateId,
          category: template.category,
          name: template.name,
          nameEs: template.nameEs,
          description: template.description,
          descriptionEs: template.descriptionEs,
          variables: template.variables,
          scope: template.scope,
          denomination: template.denomination,
        },
      });

      // Upsert sections
      const createdTemplate = await prisma.ceremonyTemplate.findUnique({
        where: { templateId: template.templateId },
      });
      if (createdTemplate) {
        await prisma.ceremonyTemplateSection.deleteMany({
          where: { templateId: createdTemplate.id },
        });

        await prisma.ceremonyTemplateSection.createMany({
          data: template.sections.map((s) => ({
            templateId: createdTemplate.id,
            order: s.order,
            title: s.titleEs ? `${s.title} / ${s.titleEs}` : s.title,
            role: s.role || null,
            durationMin: s.durationMin || null,
            optional: s.optional || false,
            notes: s.notes || null,
          })),
        });
      }

      console.log(`  ✓ ${template.templateId}: ${template.name}`);
      sdaCount++;
    } catch (error) {
      console.error(`  ✗ Error seeding ${template.templateId}:`, error);
    }
  }
  console.log(`\n  → ${sdaCount} SDA templates seeded`);

  // Summary
  const totalTemplates = await prisma.ceremonyTemplate.count();
  const globalTemplates = await prisma.ceremonyTemplate.count({ where: { scope: 'GLOBAL' } });
  const denominationTemplates = await prisma.ceremonyTemplate.count({ where: { scope: 'DENOMINATION' } });

  console.log('\n================================');
  console.log('📊 TEMPLATE LIBRARY SUMMARY');
  console.log('================================');
  console.log(`Total Templates: ${totalTemplates}`);
  console.log(`  - GLOBAL (Christian): ${globalTemplates}`);
  console.log(`  - DENOMINATION: ${denominationTemplates}`);
  console.log('================================\n');
}

// Run the seed
seedTemplateLibrary()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
