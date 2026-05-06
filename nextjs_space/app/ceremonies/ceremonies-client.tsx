'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { useSubscription } from '@/lib/subscription-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Heart, Cross, Baby, Users, Music, Calendar, Plus, FileText, Eye, Trash2, Clock, ChevronRight, Lock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface CeremonyTemplate {
  id: string;
  templateId: string;
  category: string;
  name: string;
  nameEs: string | null;
  description: string | null;
  descriptionEs: string | null;
  variables: string[];
  scope: 'GLOBAL' | 'DENOMINATION' | 'ORG_CUSTOM';
  denomination: string;
  sections: {
    id: string;
    order: number;
    title: string;
    role: string | null;
    durationMin: number | null;
    optional: boolean;
    notes: string | null;
  }[];
}

interface CeremonyProgram {
  id: string;
  date: string;
  status: string;
  variables: Record<string, string>;
  template: {
    name: string;
    category: string;
    templateId: string;
  };
  createdBy: {
    name: string | null;
    email: string;
  };
}

interface Props {
  templates: CeremonyTemplate[];
  programs: CeremonyProgram[];
  userRole: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Ceremonies': Heart,
  'Ceremonias': Heart,
  'Ordinances': Cross,
  'Ordenanzas': Cross,
  'Weekly': Calendar,
  'Funerales': Cross,
  'Jovenes': Users,
};

const SCOPE_BADGES: Record<string, { label: string; labelEs: string; color: string }> = {
  'GLOBAL': { label: 'Standard', labelEs: 'Estándar', color: 'bg-blue-100 text-blue-700' },
  'DENOMINATION': { label: 'Denominational', labelEs: 'Denominacional', color: 'bg-purple-100 text-purple-700' },
  'ORG_CUSTOM': { label: 'Custom', labelEs: 'Personalizado', color: 'bg-green-100 text-green-700' },
};

const VARIABLE_LABELS: Record<string, { en: string; es: string }> = {
  fecha: { en: 'Date', es: 'Fecha' },
  hora: { en: 'Time', es: 'Hora' },
  hora_inicio: { en: 'Start Time', es: 'Hora de Inicio' },
  lugar: { en: 'Location', es: 'Lugar' },
  novio: { en: 'Groom', es: 'Novio' },
  novia: { en: 'Bride', es: 'Novia' },
  esposo: { en: 'Husband', es: 'Esposo' },
  esposa: { en: 'Wife', es: 'Esposa' },
  oficiante: { en: 'Officiant', es: 'Oficiante' },
  tema: { en: 'Theme', es: 'Tema' },
  texto_biblico: { en: 'Bible Text', es: 'Texto Bíblico' },
  quinceanera: { en: 'Quinceañera', es: 'Quinceañera' },
  padres: { en: 'Parents', es: 'Padres' },
  nombre_nino: { en: 'Child\'s Name', es: 'Nombre del Niño' },
  edad_nino: { en: 'Child\'s Age', es: 'Edad del Niño' },
  nombre_fallecido: { en: 'Deceased\'s Name', es: 'Nombre del Fallecido' },
  fecha_nacimiento: { en: 'Birth Date', es: 'Fecha de Nacimiento' },
  fecha_fallecimiento: { en: 'Death Date', es: 'Fecha de Fallecimiento' },
  familia_principal: { en: 'Primary Family', es: 'Familia Principal' },
  director_programa: { en: 'Program Director', es: 'Director del Programa' },
  predicador_orador: { en: 'Preacher/Speaker', es: 'Predicador/Orador' },
  lider_alabanza: { en: 'Worship Leader', es: 'Líder de Alabanza' },
  aniversario_numero: { en: 'Anniversary Number', es: 'Número de Aniversario' },
  pastor_u_oficiante: { en: 'Pastor/Officiant', es: 'Pastor/Oficiante' },
  ancianos_oficiantes: { en: 'Officiating Elders', es: 'Ancianos Oficiantes' },
  diaconos: { en: 'Deacons', es: 'Diáconos' },
  diaconisas: { en: 'Deaconesses', es: 'Diaconisas' },
  cortejo: { en: 'Wedding Party', es: 'Cortejo' },
  padrinos: { en: 'Godparents', es: 'Padrinos' },
  damas_y_caballeros: { en: 'Ladies & Gentlemen', es: 'Damas y Caballeros' },
  musica_especial: { en: 'Special Music', es: 'Música Especial' },
  musica_preludio: { en: 'Prelude Music', es: 'Música de Preludio' },
  musica_procesional: { en: 'Processional Music', es: 'Música Procesional' },
  participantes_especiales: { en: 'Special Participants', es: 'Participantes Especiales' },
  anuncios_clave: { en: 'Key Announcements', es: 'Anuncios Clave' },
  llamado_tipo: { en: 'Call Type', es: 'Tipo de Llamado' },
  tipo_votos: { en: 'Vows Type', es: 'Tipo de Votos' },
  tipo_anillos: { en: 'Rings Type', es: 'Tipo de Anillos' },
  acto_simbolico: { en: 'Symbolic Act', es: 'Acto Simbólico' },
  certificado: { en: 'Certificate', es: 'Certificado' },
  lector_obituario: { en: 'Obituary Reader', es: 'Lector del Obituario' },
  participaciones: { en: 'Participations', es: 'Participaciones' },
  mensaje_tema: { en: 'Message Theme', es: 'Tema del Mensaje' },
  cementerio: { en: 'Cemetery', es: 'Cementerio' },
  logistica_floral: { en: 'Floral Logistics', es: 'Logística Floral' },
  pianista_o_pista: { en: 'Pianist/Track', es: 'Pianista/Pista' },
  modalidad: { en: 'Modality', es: 'Modalidad' },
  lectura_biblica_principal: { en: 'Main Bible Reading', es: 'Lectura Bíblica Principal' },
  himnos: { en: 'Hymns', es: 'Himnos' },
  nota_logistica_salones: { en: 'Room Logistics Note', es: 'Nota Logística de Salones' },
  tema_mensaje: { en: 'Message Theme', es: 'Tema del Mensaje' },
  anillos_opcional: { en: 'Rings (Optional)', es: 'Anillos (Opcional)' },
};

export default function CeremoniesClient({ templates, programs, userRole }: Props) {
  const { language } = useLanguage();
  const { canCreate, isViewOnly } = useSubscription();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<CeremonyTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const canEditRole = userRole === 'ADMIN' || userRole === 'EDITOR' || userRole === 'SUPER_ADMIN';
  const canEdit = canEditRole && canCreate; // Must have role AND active subscription

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, CeremonyTemplate[]>);

  const handleSelectTemplate = (template: CeremonyTemplate) => {
    setSelectedTemplate(template);
    // Initialize form data with empty values
    const initialData: Record<string, string> = {};
    template.variables.forEach(v => {
      initialData[v] = '';
    });
    setFormData(initialData);
    setShowCreateDialog(true);
  };

  const handleCreateProgram = async () => {
    if (!selectedTemplate) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/ceremony-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.templateId,
          date: formData.fecha || new Date().toISOString().split('T')[0],
          variables: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create program');
      }

      const program = await response.json();
      toast.success(language === 'es' ? 'Programa creado' : 'Program created');
      setShowCreateDialog(false);
      router.push(`/ceremony/${program.id}`);
    } catch (error) {
      toast.error(language === 'es' ? 'Error al crear programa' : 'Error creating program');
    } finally {
      setCreating(false);
    }
  };

  const getVariableLabel = (variable: string) => {
    const labels = VARIABLE_LABELS[variable];
    if (labels) {
      return language === 'es' ? labels.es : labels.en;
    }
    // Fallback: convert snake_case to Title Case
    return variable.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getTotalDuration = (sections: CeremonyTemplate['sections']) => {
    return sections.reduce((sum, s) => sum + (s.durationMin || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {language === 'es' ? 'Ceremonias Especiales' : 'Special Ceremonies'}
            </h1>
            <p className="text-slate-600 mt-1">
              {language === 'es' 
                ? 'Bodas, funerales, quinceañeras, santa cena y más' 
                : 'Weddings, funerals, quinceañeras, communion and more'}
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              {language === 'es' ? 'Volver' : 'Back'}
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-2" />
              {language === 'es' ? 'Plantillas' : 'Templates'}
            </TabsTrigger>
            <TabsTrigger value="programs">
              <Calendar className="w-4 h-4 mr-2" />
              {language === 'es' ? 'Mis Programas' : 'My Programs'}
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-8">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
              const IconComponent = CATEGORY_ICONS[category] || FileText;
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-slate-700">{category}</h2>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTemplates.map(template => {
                      const scopeBadge = SCOPE_BADGES[template.scope] || SCOPE_BADGES['GLOBAL'];
                      const displayName = language === 'es' && template.nameEs ? template.nameEs : template.name;
                      const displayDesc = language === 'es' && template.descriptionEs ? template.descriptionEs : template.description;
                      
                      return (
                      <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200"
                        onClick={() => canEdit && handleSelectTemplate(template)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg text-slate-800">{displayName}</CardTitle>
                            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${scopeBadge.color}`}>
                              {language === 'es' ? scopeBadge.labelEs : scopeBadge.label}
                            </span>
                          </div>
                          <CardDescription className="text-sm">
                            {displayDesc}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              ~{getTotalDuration(template.sections)} min
                            </span>
                            <span>{template.sections.length} {language === 'es' ? 'secciones' : 'sections'}</span>
                          </div>
                          {canEdit && (
                            <Button 
                              className="w-full mt-4" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTemplate(template);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              {language === 'es' ? 'Crear Programa' : 'Create Program'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs">
            {programs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">
                    {language === 'es' 
                      ? 'No hay programas de ceremonia creados aún' 
                      : 'No ceremony programs created yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {programs.map(program => (
                  <Card key={program.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-800">{program.template.name}</h3>
                          <p className="text-sm text-slate-500">
                            {new Date(program.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {language === 'es' ? 'Creado por' : 'Created by'}: {program.createdBy.name || program.createdBy.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            program.status === 'ready' ? 'bg-green-100 text-green-700' :
                            program.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {program.status === 'ready' ? (language === 'es' ? 'Listo' : 'Ready') :
                             program.status === 'completed' ? (language === 'es' ? 'Completado' : 'Completed') :
                             (language === 'es' ? 'Borrador' : 'Draft')}
                          </span>
                          <Link href={`/ceremony/${program.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              {language === 'es' ? 'Ver' : 'View'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Program Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === 'es' ? 'Crear Programa: ' : 'Create Program: '}
                {selectedTemplate?.name}
              </DialogTitle>
              <DialogDescription>
                {language === 'es' 
                  ? 'Completa los datos para este programa' 
                  : 'Fill in the details for this program'}
              </DialogDescription>
            </DialogHeader>

            {selectedTemplate && (
              <div className="space-y-4 py-4">
                {selectedTemplate.variables.map(variable => (
                  <div key={variable} className="space-y-2">
                    <Label htmlFor={variable}>{getVariableLabel(variable)}</Label>
                    <Input
                      id={variable}
                      type={variable.includes('fecha') ? 'date' : variable.includes('hora') ? 'time' : 'text'}
                      value={formData[variable] || ''}
                      onChange={(e) => setFormData({ ...formData, [variable]: e.target.value })}
                      placeholder={getVariableLabel(variable)}
                    />
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button onClick={handleCreateProgram} disabled={creating}>
                {creating 
                  ? (language === 'es' ? 'Creando...' : 'Creating...') 
                  : (language === 'es' ? 'Crear Programa' : 'Create Program')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
