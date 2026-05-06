import { Role, ProgramType, LanguageMode, ProgramBlock } from '@prisma/client';

export type { Role, ProgramType, LanguageMode, ProgramBlock };

// Hymn categories for Smart Generator scoring
export type HymnCategory = 
  | 'PRAISE' 
  | 'PRAYER' 
  | 'HOPE' 
  | 'SECOND_COMING' 
  | 'RESURRECTION'
  | 'FAITH'
  | 'SALVATION'
  | 'COMMUNION' 
  | 'DEDICATION'
  | 'HOLY_SPIRIT'
  | 'CHRISTMAS'
  | 'SABBATH'
  | 'GENERAL'
  | 'MISSION'
  | 'CALL'
  | 'SCRIPTURE'
  | 'VICTORY'
  | 'GRATITUDE'
  | 'SERVICE'
  | 'LOVE'
  | 'SACRIFICE'
  | 'WORSHIP';

export interface HymnPair {
  id: string;
  titleEn: string;
  numberEn: number;
  titleEs: string;
  numberEs: number;
  lyricsEn?: string | null;
  lyricsEs?: string | null;
  tags?: any;
  createdAt: Date;
}

export interface Program {
  id: string;
  date: Date;
  type: ProgramType;
  languageMode: LanguageMode;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  items?: ProgramItem[];
  createdBy?: { id: string; name?: string | null; email: string };
}

export interface ProgramItem {
  id: string;
  programId: string;
  block: ProgramBlock;
  order: number;
  sectionKey: string;
  textEn?: string | null;
  textEs?: string | null;
  hymnPairId?: string | null;
  hymnPair?: HymnPair | null;
  personName?: string | null;
  createdAt: Date;
}

export interface Setting {
  id: string;
  key: string;
  valueEn: string;
  valueEs: string;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  createdAt: Date;
}

export interface ProgramTemplate {
  key: string;
  labelEn: string;
  labelEs: string;
  hasHymn?: boolean;
  hasPerson?: boolean;
  hasText?: boolean;
  block?: ProgramBlock;
}

export const PROGRAM_TEMPLATES: Record<ProgramType, ProgramTemplate[]> = {
  FRIDAY: [
    { key: 'welcome', labelEn: 'Welcome', labelEs: 'Bienvenida', hasPerson: true },
    { key: 'prayer', labelEn: 'Prayer', labelEs: 'Oración', hasPerson: true },
    { key: 'opening_hymn', labelEn: 'Opening Hymn', labelEs: 'Himno de Apertura', hasHymn: true },
    { key: 'theme', labelEn: 'Theme/Reflection', labelEs: 'Tema/Reflexión', hasText: true, hasPerson: true },
    { key: 'closing_hymn', labelEn: 'Closing Hymn', labelEs: 'Himno de Clausura', hasHymn: true },
    { key: 'final_prayer', labelEn: 'Final Prayer', labelEs: 'Oración Final', hasPerson: true },
  ],
  WEDNESDAY: [
    { key: 'welcome', labelEn: 'Welcome', labelEs: 'Bienvenida', hasPerson: true },
    { key: 'song', labelEn: 'Song/Hymn', labelEs: 'Canto/Himno', hasHymn: true },
    { key: 'prayer', labelEn: 'Prayer', labelEs: 'Oración', hasPerson: true },
    { key: 'testimonies', labelEn: 'Testimonies/Thanksgivings/Requests', labelEs: 'Testimonios/Agradecimientos/Peticiones', hasPerson: true },
    { key: 'prayer_requests', labelEn: 'Prayer for Requests', labelEs: 'Oración por Peticiones', hasPerson: true },
    { key: 'theme', labelEn: 'Theme/Reflection', labelEs: 'Tema/Reflexión', hasText: true, hasPerson: true },
    { key: 'closing_hymn', labelEn: 'Closing Hymn', labelEs: 'Himno de Clausura', hasHymn: true },
    { key: 'final_prayer', labelEn: 'Final Prayer', labelEs: 'Oración Final', hasPerson: true },
  ],
  YOUTH: [
    { key: 'welcome', labelEn: 'Welcome', labelEs: 'Bienvenida', hasPerson: true },
    { key: 'prayer', labelEn: 'Prayer', labelEs: 'Oración', hasPerson: true },
    { key: 'youth_song_1', labelEn: 'Youth Song', labelEs: 'Canto Juvenil', hasHymn: true, hasText: true },
    { key: 'bible_exercise', labelEn: 'Bible Exercise', labelEs: 'Ejercicio Bíblico', hasPerson: true, hasText: true },
    { key: 'youth_song_2', labelEn: 'Youth Song', labelEs: 'Canto Juvenil', hasHymn: true, hasText: true },
    { key: 'theme', labelEn: 'Theme/Reflection', labelEs: 'Tema/Reflexión', hasText: true, hasPerson: true },
    { key: 'farewell_song', labelEn: 'Sabbath Farewell Song', labelEs: 'Canto de Despedida del Sábado', hasHymn: true },
    { key: 'final_prayer', labelEn: 'Final Prayer', labelEs: 'Oración Final', hasPerson: true },
  ],
  SABBATH: [
    // Sabbath School Block
    { key: 'ss_song_service', labelEn: 'Song Service', labelEs: 'Servicio de Canto', hasPerson: true, block: 'SABBATH_SCHOOL' as ProgramBlock },
    { key: 'ss_welcome', labelEn: 'Welcome', labelEs: 'Bienvenida', hasPerson: true, block: 'SABBATH_SCHOOL' as ProgramBlock },
    { key: 'ss_prayer', labelEn: 'Prayer', labelEs: 'Oración', hasPerson: true, block: 'SABBATH_SCHOOL' as ProgramBlock },
    { key: 'ss_hymn', labelEn: 'Hymn', labelEs: 'Himno', hasHymn: true, block: 'SABBATH_SCHOOL' as ProgramBlock },
    { key: 'ss_scripture', labelEn: 'Scripture Reading', labelEs: 'Lectura Bíblica', hasPerson: true, hasText: true, block: 'SABBATH_SCHOOL' as ProgramBlock },
    { key: 'ss_mission', labelEn: 'Mission Story', labelEs: 'Historia Misionera', hasPerson: true, hasText: true, block: 'SABBATH_SCHOOL' as ProgramBlock },
    { key: 'ss_lesson', labelEn: 'Lesson Review', labelEs: 'Repaso de la Lección', hasPerson: true, hasText: true, block: 'SABBATH_SCHOOL' as ProgramBlock },
    { key: 'ss_final_prayer', labelEn: 'Final Prayer', labelEs: 'Oración Final', hasPerson: true, block: 'SABBATH_SCHOOL' as ProgramBlock },
    // Divine Worship Block
    { key: 'dw_song_service', labelEn: 'Song Service', labelEs: 'Servicio de Canto', hasPerson: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_prelude', labelEn: 'Prelude', labelEs: 'Preludio', hasHymn: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_doxology', labelEn: 'Doxology', labelEs: 'Doxología', hasHymn: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_invocation', labelEn: 'Invocation', labelEs: 'Invocación', hasPerson: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_welcome', labelEn: 'Welcome', labelEs: 'Bienvenida', hasPerson: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_hymn', labelEn: 'Congregational Hymn', labelEs: 'Himno Congregacional', hasHymn: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_scripture', labelEn: 'Scripture Reading', labelEs: 'Lectura Bíblica', hasPerson: true, hasText: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_intercessory', labelEn: 'Intercessory Prayer', labelEs: 'Oración Intercesora', hasPerson: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_childrens_story', labelEn: "Children's Story", labelEs: 'Historia de los Niños', hasPerson: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_offering', labelEn: 'Tithes and Offering', labelEs: 'Diezmos y Ofrendas', hasPerson: true, hasText: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_special_music', labelEn: 'Special Music', labelEs: 'Música Especial', hasPerson: true, hasText: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_sermon', labelEn: 'Sermon', labelEs: 'Sermón', hasPerson: true, hasText: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_closing_hymn', labelEn: 'Closing Hymn', labelEs: 'Himno de Clausura', hasHymn: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
    { key: 'dw_benediction', labelEn: 'Benediction', labelEs: 'Bendición', hasPerson: true, block: 'DIVINE_WORSHIP' as ProgramBlock },
  ],
};

export const UI_TRANSLATIONS = {
  en: {
    appName: 'Ministerial Worship Planner',
    appTagline: 'Structured Worship. Biblical Depth.',
    home: 'Home',
    archive: 'Archive',
    hymns: 'Hymns',
    settings: 'Settings',
    login: 'Login',
    logout: 'Logout',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    createProgram: 'Create Program',
    editProgram: 'Edit Program',
    deleteProgram: 'Delete Program',
    save: 'Save',
    cancel: 'Cancel',
    preview: 'Preview',
    exportPdf: 'Export PDF',
    exportPptx: 'Export PPTX',
    duplicate: 'Duplicate Last Week',
    selectDate: 'Select Date',
    selectType: 'Select Type',
    friday: 'Friday Vespers',
    wednesday: 'Wednesday Prayer Meeting',
    sabbath: 'Sabbath Worship',
    youth: 'Youth Program',
    sabbathSchool: 'Sabbath School',
    divineWorship: 'Divine Worship',
    hymnPicker: 'Select Hymn',
    search: 'Search',
    noHymnsFound: 'No hymns found',
    manageHymns: 'Manage Hymns',
    addHymn: 'Add Hymn',
    editHymn: 'Edit Hymn',
    deleteHymn: 'Delete Hymn',
    hymnTitle: 'Hymn Title',
    hymnNumber: 'Hymn Number',
    english: 'English',
    spanish: 'Spanish',
    users: 'Users',
    role: 'Role',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
    churchName: 'Church Name',
    pdfFooter: 'PDF Footer Quote',
    recentPrograms: 'Recent Programs',
    noPrograms: 'No programs found',
    confirmDelete: 'Are you sure you want to delete this?',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success!',
    personAssigned: 'Person Assigned',
    notes: 'Notes',
    bilingualOnly: 'Bilingual only (EN + ES)',
    noEnglish: 'No English equivalent',
    languageMode: 'Language Mode',
    bilingual: 'Bilingual (EN + ES)',
    englishOnly: 'English Only',
    spanishOnly: 'Spanish Only',
    enModeHymnWarning: 'Spanish-only hymns are disabled in English-Only mode',
    disabled: 'Disabled',
    smartGenerate: 'Smart Generate',
    generating: 'Generating...',
    smartGenerateDesc: 'Auto-select hymns based on season, avoiding recently used ones',
    smartGenerateSuccess: 'Generated!',
    hymnsSelected: 'hymns selected',
    selectDateFirst: 'Please select a date first',
  },
  es: {
    appName: 'Planificador de Culto Ministerial',
    appTagline: 'Culto Estructurado. Profundidad Bíblica.',
    home: 'Inicio',
    archive: 'Archivo',
    hymns: 'Himnos',
    settings: 'Configuración',
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    signup: 'Registrarse',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    name: 'Nombre',
    createProgram: 'Crear Programa',
    editProgram: 'Editar Programa',
    deleteProgram: 'Eliminar Programa',
    save: 'Guardar',
    cancel: 'Cancelar',
    preview: 'Vista Previa',
    exportPdf: 'Exportar PDF',
    exportPptx: 'Exportar PPTX',
    duplicate: 'Duplicar Semana Anterior',
    selectDate: 'Seleccionar Fecha',
    selectType: 'Seleccionar Tipo',
    friday: 'Culto de Viernes',
    wednesday: 'Culto de Oración',
    sabbath: 'Culto Sabático',
    youth: 'Programa Juvenil',
    sabbathSchool: 'Escuela Sabática',
    divineWorship: 'Culto Divino',
    hymnPicker: 'Seleccionar Himno',
    search: 'Buscar',
    noHymnsFound: 'No se encontraron himnos',
    manageHymns: 'Gestionar Himnos',
    addHymn: 'Agregar Himno',
    editHymn: 'Editar Himno',
    deleteHymn: 'Eliminar Himno',
    hymnTitle: 'Título del Himno',
    hymnNumber: 'Número del Himno',
    english: 'Inglés',
    spanish: 'Español',
    users: 'Usuarios',
    role: 'Rol',
    admin: 'Administrador',
    editor: 'Editor',
    viewer: 'Visualizador',
    churchName: 'Nombre de la Iglesia',
    pdfFooter: 'Cita de Pie de Página PDF',
    recentPrograms: 'Programas Recientes',
    noPrograms: 'No se encontraron programas',
    confirmDelete: '¿Está seguro de que desea eliminar esto?',
    yes: 'Sí',
    no: 'No',
    loading: 'Cargando...',
    error: 'Ocurrió un error',
    success: '¡Éxito!',
    personAssigned: 'Persona Asignada',
    notes: 'Notas',
    bilingualOnly: 'Solo bilingües (EN + ES)',
    noEnglish: 'Sin equivalente en inglés',
    languageMode: 'Modo de Idioma',
    bilingual: 'Bilingüe (EN + ES)',
    englishOnly: 'Solo Inglés',
    spanishOnly: 'Solo Español',
    enModeHymnWarning: 'Los himnos solo en español están deshabilitados en modo Solo Inglés',
    disabled: 'Deshabilitado',
    smartGenerate: 'Generar Automático',
    generating: 'Generando...',
    smartGenerateDesc: 'Selecciona himnos automáticamente según la temporada, evitando los usados recientemente',
    smartGenerateSuccess: '¡Generado!',
    hymnsSelected: 'himnos seleccionados',
    selectDateFirst: 'Por favor seleccione una fecha primero',
  },
};
