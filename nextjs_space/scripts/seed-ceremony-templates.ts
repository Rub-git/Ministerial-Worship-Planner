import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEMPLATES = [
  // ============ WEEKLY PROGRAMS ============
  {
    template_id: "CULTO_SABADO_01",
    category: "Weekly Programs",
    name: "Culto Sabático (Escuela Sabática + Culto Divino)",
    description: "Programa completo del sábado: Escuela Sabática y Culto de Adoración Divina.",
    variables: [
      "fecha",
      "tema_leccion",
      "director_escuela_sabatica",
      "maestro_leccion",
      "historia_misionera",
      "orador_sermon",
      "tema_sermon",
      "texto_biblico",
      "musica_especial",
      "anciano_plataforma",
      "diaconos_ofrenda"
    ],
    sections: [
      // ESCUELA SABÁTICA
      { order: 1, title: "— ESCUELA SABÁTICA —", role: "", duration_min: 0, optional: false, notes: "Bloque de Escuela Sabática" },
      { order: 2, title: "Servicio de Canto", role: "Director(a) de Canto", duration_min: 8, optional: false, notes: "Cantos de alabanza para abrir." },
      { order: 3, title: "Himno de Escuela Sabática", role: "Congregación", duration_min: 3, optional: false, notes: "" },
      { order: 4, title: "Oración Inicial", role: "Participante asignado", duration_min: 2, optional: false, notes: "" },
      { order: 5, title: "Bienvenida y Registro", role: "Secretario(a)", duration_min: 3, optional: true, notes: "Registro de asistencia y visitantes." },
      { order: 6, title: "Historia Misionera", role: "Participante asignado", duration_min: 8, optional: true, notes: "Historia del campo misionero." },
      { order: 7, title: "Repaso de la Lección", role: "Maestro(a)", duration_min: 35, optional: false, notes: "Estudio interactivo de la lección." },
      { order: 8, title: "Oración Final de Escuela Sabática", role: "Participante asignado", duration_min: 2, optional: false, notes: "" },
      // CULTO DIVINO
      { order: 9, title: "— CULTO DE ADORACIÓN DIVINA —", role: "", duration_min: 0, optional: false, notes: "Bloque de Culto Divino" },
      { order: 10, title: "Preludio / Servicio de Canto", role: "Música", duration_min: 5, optional: true, notes: "Preparación para la adoración." },
      { order: 11, title: "Doxología", role: "Congregación", duration_min: 2, optional: false, notes: "Himno 524 u otro." },
      { order: 12, title: "Invocación", role: "Anciano(a)", duration_min: 2, optional: false, notes: "" },
      { order: 13, title: "Himno Congregacional", role: "Congregación", duration_min: 4, optional: false, notes: "" },
      { order: 14, title: "Lectura Bíblica", role: "Participante asignado", duration_min: 3, optional: false, notes: "Texto del día." },
      { order: 15, title: "Oración Intercesora", role: "Anciano(a)", duration_min: 4, optional: false, notes: "Oración por necesidades de la iglesia." },
      { order: 16, title: "Diezmos y Ofrendas", role: "Diáconos", duration_min: 5, optional: false, notes: "Incluir llamado a la ofrenda." },
      { order: 17, title: "Música Especial", role: "Participante(s)", duration_min: 5, optional: true, notes: "Solo, dueto, coro, etc." },
      { order: 18, title: "Sermón", role: "Orador(a)", duration_min: 30, optional: false, notes: "Mensaje cristocéntrico." },
      { order: 19, title: "Himno de Clausura", role: "Congregación", duration_min: 4, optional: false, notes: "Himno de respuesta." },
      { order: 20, title: "Bendición", role: "Pastor / Anciano", duration_min: 2, optional: false, notes: "Bendición pastoral." }
    ]
  },
  {
    template_id: "JA_SABADO_TARDE_01",
    category: "Weekly Programs",
    name: "Jóvenes Adventistas (Sábado de Tarde)",
    description: "Programa juvenil para sábado por la tarde (alabanza, dinámica, mensaje, llamado).",
    variables: [
      "fecha",
      "hora_inicio",
      "lugar",
      "director_programa",
      "tema",
      "predicador_orador",
      "lider_alabanza",
      "pianista_o_pista",
      "participantes_especiales",
      "anuncios_clave",
      "llamado_tipo"
    ],
    sections: [
      { order: 1, title: "Bienvenida e Introducción", role: "Director(a) del programa", duration_min: 3, optional: false, notes: "Saludo, objetivo, tema de la tarde." },
      { order: 2, title: "Oración Inicial", role: "Joven asignado / Anciano", duration_min: 2, optional: false, notes: "" },
      { order: 3, title: "Alabanza (Bloque 1)", role: "Líder de alabanza", duration_min: 12, optional: false, notes: "2–3 cantos. Puede incluir lectura corta entre cantos." },
      { order: 4, title: "Lectura Bíblica", role: "Joven asignado", duration_min: 2, optional: true, notes: "Texto base del tema." },
      { order: 5, title: "Dinámica / Actividad de integración", role: "Equipo juvenil", duration_min: 8, optional: true, notes: "Breve, respetuosa, con propósito (no solo entretenimiento)." },
      { order: 6, title: "Participación Especial (música/poesía/testimonio)", role: "Participante(s)", duration_min: 6, optional: true, notes: "1 o 2 especiales máximo." },
      { order: 7, title: "Mensaje / Reflexión", role: "Orador(a)", duration_min: 18, optional: false, notes: "Cristocéntrico, práctico, llamado a decisión." },
      { order: 8, title: "Llamado", role: "Orador(a) / Director(a)", duration_min: 5, optional: true, notes: "Oración de entrega / llamado al frente / tarjeta de decisión." },
      { order: 9, title: "Alabanza (Bloque 2 - respuesta)", role: "Líder de alabanza", duration_min: 6, optional: true, notes: "1 canto de consagración." },
      { order: 10, title: "Anuncios (juveniles + iglesia)", role: "Director(a) / Secretario(a) J.A.", duration_min: 4, optional: true, notes: "Solo lo esencial." },
      { order: 11, title: "Oración Final y Despedida", role: "Anciano / Joven asignado", duration_min: 2, optional: false, notes: "" }
    ]
  },
  {
    template_id: "ORACION_MIERCOLES_01",
    category: "Weekly Programs",
    name: "Noche de Oración (Miércoles)",
    description: "Programa de oración congregacional de mitad de semana.",
    variables: [
      "fecha",
      "hora_inicio",
      "lugar",
      "director_programa",
      "tema_reflexion",
      "orador",
      "lider_alabanza",
      "lista_motivos_oracion",
      "participaciones_especiales"
    ],
    sections: [
      { order: 1, title: "Bienvenida", role: "Director(a)", duration_min: 3, optional: false, notes: "Saludo y propósito de la noche." },
      { order: 2, title: "Alabanza Inicial (2 cantos)", role: "Líder de alabanza", duration_min: 8, optional: false, notes: "Cantos enfocados en confianza y dependencia." },
      { order: 3, title: "Lectura Bíblica", role: "Participante asignado", duration_min: 3, optional: false, notes: "Texto relacionado con el tema." },
      { order: 4, title: "Reflexión / Mensaje Breve", role: "Orador(a)", duration_min: 12, optional: false, notes: "Devocional práctico y cristocéntrico." },
      { order: 5, title: "Presentación de Motivos de Oración", role: "Director(a)", duration_min: 7, optional: false, notes: "Enfermos, familia, iglesia, país, peticiones especiales." },
      { order: 6, title: "Oración Congregacional (grupos pequeños)", role: "Congregación", duration_min: 20, optional: false, notes: "Dividir en grupos de 3–5 personas." },
      { order: 7, title: "Oración Final General", role: "Anciano / Pastor", duration_min: 3, optional: false, notes: "Cerrar con oración pastoral." },
      { order: 8, title: "Anuncios Breves", role: "Director(a)", duration_min: 3, optional: true, notes: "Solo lo esencial." }
    ]
  },
  {
    template_id: "RECIBIMIENTO_SABADO_01",
    category: "Weekly Programs",
    name: "Recibimiento del Sábado (Viernes PM)",
    description: "Programa de bienvenida al sábado con espíritu de adoración y consagración.",
    variables: [
      "fecha",
      "hora_inicio",
      "lugar",
      "director_programa",
      "tema_reflexion",
      "orador",
      "lider_alabanza",
      "participaciones_especiales",
      "lectura_biblica"
    ],
    sections: [
      { order: 1, title: "Preludio Musical", role: "Música", duration_min: 5, optional: true, notes: "Ambiente reverente antes de iniciar." },
      { order: 2, title: "Bienvenida y Explicación del Significado del Sábado", role: "Director(a)", duration_min: 4, optional: false, notes: "Recordar Génesis 2:1–3 o Éxodo 20:8–11." },
      { order: 3, title: "Cantos de Adoración (2–3)", role: "Líder de alabanza", duration_min: 10, optional: false, notes: "Enfocados en creación, redención, descanso." },
      { order: 4, title: "Lectura Bíblica", role: "Participante asignado", duration_min: 3, optional: false, notes: "Texto sabático o profético." },
      { order: 5, title: "Reflexión Espiritual", role: "Orador(a)", duration_min: 15, optional: false, notes: "Consagración, descanso en Cristo, esperanza." },
      { order: 6, title: "Momento de Gratitud / Testimonios", role: "Congregación", duration_min: 8, optional: true, notes: "2–3 participaciones máximo." },
      { order: 7, title: "Oración de Consagración", role: "Pastor / Anciano", duration_min: 3, optional: false, notes: "Entregar el sábado a Dios." },
      { order: 8, title: "Canto Final Suave", role: "Música", duration_min: 4, optional: true, notes: "Salida en espíritu reverente." }
    ]
  },
  // ============ ORDENANZAS ============
  {
    template_id: "SANTA_CENA_01",
    category: "Ordenanzas",
    name: "Santa Cena (cada 3 meses)",
    description: "Ordenanza de la Santa Cena (humildad + pan y vino), durante Culto Divino o al final.",
    variables: [
      "fecha",
      "hora_inicio",
      "modalidad",
      "pastor_u_oficiante",
      "ancianos_oficiantes",
      "diaconos",
      "diaconisas",
      "lectura_biblica_principal",
      "himnos",
      "nota_logistica_salones"
    ],
    sections: [
      { order: 1, title: "Introducción a la Ordenanza", role: "Pastor/Anciano", duration_min: 4, optional: false, notes: "Explicar significado, reverencia y participación." },
      { order: 2, title: "Himno", role: "Música", duration_min: 3, optional: true, notes: "Preferible himno de cruz/consagración." },
      { order: 3, title: "Lectura Bíblica", role: "Pastor/Anciano", duration_min: 3, optional: false, notes: "1 Cor 11:23–26 u otro texto." },
      { order: 4, title: "Oración", role: "Pastor/Anciano", duration_min: 2, optional: false, notes: "" },
      { order: 5, title: "Ordenanza de Humildad (Lavamiento de pies)", role: "Diáconos/Diaconisas + Ancianos", duration_min: 25, optional: false, notes: "Separar por áreas (hombres/mujeres/parejas/familias). Indicar logística y reverencia." },
      { order: 6, title: "Regreso al Santuario (música suave)", role: "Música", duration_min: 3, optional: true, notes: "Transición reverente." },
      { order: 7, title: "Bendición del Pan", role: "Pastor/Anciano", duration_min: 2, optional: false, notes: "Oración por el pan." },
      { order: 8, title: "Distribución del Pan", role: "Diáconos", duration_min: 8, optional: false, notes: "Servir ordenado; música opcional." },
      { order: 9, title: "Bendición del Vino", role: "Pastor/Anciano", duration_min: 2, optional: false, notes: "Oración por el vino." },
      { order: 10, title: "Distribución del Vino", role: "Diaconisas/Diáconos", duration_min: 8, optional: false, notes: "Servir ordenado; música opcional." },
      { order: 11, title: "Himno Final / Canto de Gratitud", role: "Congregación", duration_min: 3, optional: true, notes: "" },
      { order: 12, title: "Oración Final y Salida en Silencio", role: "Pastor/Anciano", duration_min: 2, optional: false, notes: "Recomendar salida reverente." }
    ]
  },
  // ============ CEREMONIAS ============
  {
    template_id: "BODA_01",
    category: "Ceremonias",
    name: "Programa de Bodas (Ceremonia)",
    description: "Ceremonia de boda cristiana (Adventista), centrada en votos, bendición y palabra.",
    variables: [
      "fecha",
      "hora_inicio",
      "lugar",
      "novio",
      "novia",
      "oficiante",
      "cortejo",
      "padrinos",
      "musica_preludio",
      "musica_procesional",
      "musica_especial",
      "texto_biblico",
      "tema_mensaje",
      "tipo_votos",
      "tipo_anillos"
    ],
    sections: [
      { order: 1, title: "Preludio Musical", role: "Música", duration_min: 8, optional: true, notes: "Ambientación reverente." },
      { order: 2, title: "Entrada del Cortejo", role: "Coordinación + Música", duration_min: 6, optional: false, notes: "Orden: familiares/cortejo/novia." },
      { order: 3, title: "Bienvenida", role: "Oficiante", duration_min: 2, optional: false, notes: "" },
      { order: 4, title: "Oración Inicial", role: "Oficiante", duration_min: 2, optional: false, notes: "" },
      { order: 5, title: "Lectura Bíblica", role: "Lector asignado", duration_min: 3, optional: true, notes: "1 Cor 13 / Gén 2 / Ef 5, etc." },
      { order: 6, title: "Mensaje / Meditación", role: "Oficiante", duration_min: 10, optional: false, notes: "Breve, práctico, pacto y Cristo al centro." },
      { order: 7, title: "Declaración de Intención", role: "Oficiante + Novios", duration_min: 3, optional: false, notes: "Preguntas a ambos." },
      { order: 8, title: "Votos Matrimoniales", role: "Oficiante + Novios", duration_min: 5, optional: false, notes: "Tradicional o personalizado." },
      { order: 9, title: "Intercambio de Anillos", role: "Oficiante + Novios", duration_min: 4, optional: true, notes: "Con frase breve y oración." },
      { order: 10, title: "Oración de Bendición", role: "Oficiante", duration_min: 3, optional: false, notes: "Puede invitar a padres/pastores a acercarse." },
      { order: 11, title: "Pronunciamiento", role: "Oficiante", duration_min: 2, optional: false, notes: "Declarar esposo y esposa." },
      { order: 12, title: "Presentación de los Esposos", role: "Oficiante", duration_min: 1, optional: false, notes: "" },
      { order: 13, title: "Salida (Recesional)", role: "Música", duration_min: 4, optional: false, notes: "" }
    ]
  },
  {
    template_id: "QUINCE_01",
    category: "Ceremonias",
    name: "Programa de Quinceañera (Dedicación)",
    description: "Programa cristiano para quinceañera: gratitud, consagración, palabra, oración, compromiso.",
    variables: [
      "fecha",
      "hora_inicio",
      "lugar",
      "quinceanera",
      "padres",
      "oficiante",
      "damas_y_caballeros",
      "tema",
      "texto_biblico",
      "musica_especial",
      "acto_simbolico"
    ],
    sections: [
      { order: 1, title: "Preludio", role: "Música", duration_min: 6, optional: true, notes: "" },
      { order: 2, title: "Entrada", role: "Coordinación + Música", duration_min: 5, optional: false, notes: "Familia / corte / quinceañera." },
      { order: 3, title: "Bienvenida", role: "Director(a) / Oficiante", duration_min: 2, optional: false, notes: "" },
      { order: 4, title: "Oración Inicial", role: "Oficiante", duration_min: 2, optional: false, notes: "" },
      { order: 5, title: "Alabanza / Himno", role: "Música", duration_min: 4, optional: true, notes: "" },
      { order: 6, title: "Lectura Bíblica", role: "Lector asignado", duration_min: 3, optional: false, notes: "Ej: Prov 3:5-6 / Sal 37:5 / 1 Tim 4:12." },
      { order: 7, title: "Mensaje / Consejo para la vida", role: "Oficiante", duration_min: 12, optional: false, notes: "Identidad, propósito, pureza, fe, decisiones." },
      { order: 8, title: "Participación Especial", role: "Invitado(s)", duration_min: 5, optional: true, notes: "Canto / poema / testimonio." },
      { order: 9, title: "Acto de Consagración (compromiso)", role: "Oficiante + Quinceañera", duration_min: 5, optional: false, notes: "Compromiso de caminar con Dios y honrar a la familia." },
      { order: 10, title: "Oración de Bendición (con imposición de manos opcional)", role: "Oficiante + Padres", duration_min: 3, optional: false, notes: "" },
      { order: 11, title: "Palabras de Padres / Agradecimientos", role: "Padres", duration_min: 4, optional: true, notes: "Breve." },
      { order: 12, title: "Salida", role: "Música", duration_min: 3, optional: false, notes: "" }
    ]
  },
  {
    template_id: "PRESENTACION_NINOS_01",
    category: "Ceremonias",
    name: "Presentación de Niños (Dedicación)",
    description: "Presentación/dedicación de niño(s) en culto o ceremonia breve.",
    variables: [
      "fecha",
      "hora",
      "nombre_nino",
      "edad_nino",
      "padres",
      "oficiante",
      "texto_biblico",
      "certificado"
    ],
    sections: [
      { order: 1, title: "Introducción", role: "Oficiante", duration_min: 2, optional: false, notes: "Explicar dedicación y compromiso familiar." },
      { order: 2, title: "Lectura Bíblica", role: "Oficiante / Lector", duration_min: 2, optional: true, notes: "Ej: Marcos 10:13–16." },
      { order: 3, title: "Llamado a Padres (Compromiso)", role: "Oficiante + Padres", duration_min: 3, optional: false, notes: "Promesa de criar en fe, amor y disciplina." },
      { order: 4, title: "Oración de Dedicación", role: "Oficiante", duration_min: 2, optional: false, notes: "Imposición de manos opcional según práctica local." },
      { order: 5, title: "Presentación del Niño a la Congregación", role: "Oficiante", duration_min: 1, optional: false, notes: "" },
      { order: 6, title: "Entrega de Certificado / Foto", role: "Secretaría / Diácono", duration_min: 2, optional: true, notes: "" }
    ]
  },
  {
    template_id: "FUNERAL_01",
    category: "Ceremonias",
    name: "Programa de Funeral (Servicio Conmemorativo)",
    description: "Servicio funerario: consuelo, esperanza en Cristo, homenaje con dignidad.",
    variables: [
      "fecha",
      "hora",
      "lugar",
      "nombre_fallecido",
      "fecha_nacimiento",
      "fecha_fallecimiento",
      "familia_principal",
      "oficiante",
      "musica_especial",
      "lector_obituario",
      "participaciones",
      "texto_biblico",
      "mensaje_tema",
      "cementerio",
      "logistica_floral"
    ],
    sections: [
      { order: 1, title: "Preludio (música)", role: "Música", duration_min: 8, optional: true, notes: "Sobrio y reverente." },
      { order: 2, title: "Bienvenida", role: "Oficiante", duration_min: 3, optional: false, notes: "Reconocer dolor, afirmar esperanza." },
      { order: 3, title: "Oración Inicial", role: "Oficiante", duration_min: 2, optional: false, notes: "" },
      { order: 4, title: "Himno / Canto de Consuelo", role: "Música", duration_min: 4, optional: true, notes: "" },
      { order: 5, title: "Obituario / Reseña de vida", role: "Lector asignado", duration_min: 6, optional: true, notes: "Respetuoso, factual, sin exageraciones." },
      { order: 6, title: "Participaciones (2–3 máximo)", role: "Familia/Amigos", duration_min: 10, optional: true, notes: "Definir tiempo por participante (2–3 min)." },
      { order: 7, title: "Participación Especial (música)", role: "Música", duration_min: 5, optional: true, notes: "" },
      { order: 8, title: "Mensaje de Esperanza", role: "Oficiante", duration_min: 15, optional: false, notes: "Resurrección, consuelo, segunda venida." },
      { order: 9, title: "Oración Final", role: "Oficiante", duration_min: 2, optional: false, notes: "" },
      { order: 10, title: "Salida / Instrucciones (si aplica)", role: "Oficiante/Director", duration_min: 2, optional: true, notes: "Indicaciones a cementerio/recepción." }
    ]
  },
  {
    template_id: "RENOVACION_VOTOS_01",
    category: "Ceremonias",
    name: "Confirmación / Renovación de Votos Matrimoniales",
    description: "Renovación de votos: gratitud, pacto, palabra, bendición.",
    variables: [
      "fecha",
      "hora",
      "lugar",
      "esposo",
      "esposa",
      "aniversario_numero",
      "oficiante",
      "texto_biblico",
      "tema",
      "musica_especial",
      "anillos_opcional"
    ],
    sections: [
      { order: 1, title: "Bienvenida", role: "Oficiante", duration_min: 2, optional: false, notes: "" },
      { order: 2, title: "Oración Inicial", role: "Oficiante", duration_min: 2, optional: false, notes: "" },
      { order: 3, title: "Lectura Bíblica", role: "Lector / Oficiante", duration_min: 3, optional: true, notes: "Ecl 4:9–12 / Col 3:12–14, etc." },
      { order: 4, title: "Mensaje Breve", role: "Oficiante", duration_min: 10, optional: false, notes: "Pacto, perdón, misión familiar." },
      { order: 5, title: "Renovación de Votos", role: "Oficiante + Pareja", duration_min: 5, optional: false, notes: "Puede ser lectura responsiva." },
      { order: 6, title: "Intercambio de Anillos (opcional)", role: "Oficiante + Pareja", duration_min: 3, optional: true, notes: "" },
      { order: 7, title: "Oración de Bendición", role: "Oficiante", duration_min: 3, optional: false, notes: "" },
      { order: 8, title: "Agradecimientos", role: "Pareja / Director", duration_min: 3, optional: true, notes: "Breve." },
      { order: 9, title: "Salida", role: "Música", duration_min: 3, optional: true, notes: "" }
    ]
  }
];

async function seedCeremonyTemplates() {
  console.log('🎯 Seeding Ceremony Templates...');
  
  for (const template of TEMPLATES) {
    console.log(`  Creating template: ${template.template_id}`);
    
    // Upsert the template
    const createdTemplate = await prisma.ceremonyTemplate.upsert({
      where: { templateId: template.template_id },
      update: {
        category: template.category,
        name: template.name,
        description: template.description,
        variables: template.variables,
      },
      create: {
        templateId: template.template_id,
        category: template.category,
        name: template.name,
        description: template.description,
        variables: template.variables,
      },
    });
    
    // Delete existing sections and recreate
    await prisma.ceremonyTemplateSection.deleteMany({
      where: { templateId: createdTemplate.id },
    });
    
    // Create sections
    for (const section of template.sections) {
      await prisma.ceremonyTemplateSection.create({
        data: {
          templateId: createdTemplate.id,
          order: section.order,
          title: section.title,
          role: section.role,
          durationMin: section.duration_min,
          optional: section.optional,
          notes: section.notes || null,
        },
      });
    }
    
    console.log(`    ✓ Created ${template.sections.length} sections`);
  }
  
  console.log('\n✅ All ceremony templates seeded successfully!');
}

seedCeremonyTemplates()
  .catch((e) => {
    console.error('Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
