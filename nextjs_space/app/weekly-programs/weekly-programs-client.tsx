'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { useSubscription } from '@/lib/subscription-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Users, Sparkles, Plus, FileText, Eye, Clock, ChevronRight, Sun, Moon, Lock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface CeremonyTemplate {
  id: string;
  templateId: string;
  category: string;
  name: string;
  description: string | null;
  variables: string[];
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

const TEMPLATE_ICONS: Record<string, any> = {
  'CULTO_SABADO_01': Sun,
  'JA_SABADO_TARDE_01': Users,
  'ORACION_MIERCOLES_01': Moon,
  'RECIBIMIENTO_SABADO_01': Sparkles,
};

const VARIABLE_LABELS: Record<string, { en: string; es: string }> = {
  fecha: { en: 'Date', es: 'Fecha' },
  hora_inicio: { en: 'Start Time', es: 'Hora de Inicio' },
  lugar: { en: 'Location', es: 'Lugar' },
  director_programa: { en: 'Program Director', es: 'Director del Programa' },
  tema: { en: 'Theme', es: 'Tema' },
  tema_reflexion: { en: 'Reflection Theme', es: 'Tema de Reflexión' },
  predicador_orador: { en: 'Preacher/Speaker', es: 'Predicador/Orador' },
  orador: { en: 'Speaker', es: 'Orador' },
  lider_alabanza: { en: 'Worship Leader', es: 'Líder de Alabanza' },
  pianista_o_pista: { en: 'Pianist/Track', es: 'Pianista/Pista' },
  participantes_especiales: { en: 'Special Participants', es: 'Participantes Especiales' },
  participaciones_especiales: { en: 'Special Participations', es: 'Participaciones Especiales' },
  anuncios_clave: { en: 'Key Announcements', es: 'Anuncios Clave' },
  llamado_tipo: { en: 'Call Type', es: 'Tipo de Llamado' },
  lista_motivos_oracion: { en: 'Prayer Requests List', es: 'Lista de Motivos de Oración' },
  lectura_biblica: { en: 'Bible Reading', es: 'Lectura Bíblica' },
  // Culto Sabático variables
  tema_leccion: { en: 'Lesson Theme', es: 'Tema de la Lección' },
  director_escuela_sabatica: { en: 'Sabbath School Director', es: 'Director de Escuela Sabática' },
  maestro_leccion: { en: 'Lesson Teacher', es: 'Maestro de la Lección' },
  historia_misionera: { en: 'Mission Story', es: 'Historia Misionera' },
  orador_sermon: { en: 'Sermon Speaker', es: 'Orador del Sermón' },
  tema_sermon: { en: 'Sermon Theme', es: 'Tema del Sermón' },
  texto_biblico: { en: 'Bible Text', es: 'Texto Bíblico' },
  musica_especial: { en: 'Special Music', es: 'Música Especial' },
  anciano_plataforma: { en: 'Platform Elder', es: 'Anciano de Plataforma' },
  diaconos_ofrenda: { en: 'Offering Deacons', es: 'Diáconos de Ofrenda' },
};

export default function WeeklyProgramsClient({ templates, programs, userRole }: Props) {
  const { language } = useLanguage();
  const { canCreate, isViewOnly } = useSubscription();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<CeremonyTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const canEditRole = userRole === 'ADMIN' || userRole === 'EDITOR' || userRole === 'SUPER_ADMIN';
  const canEdit = canEditRole && canCreate; // Must have role AND active subscription

  const handleSelectTemplate = (template: CeremonyTemplate) => {
    setSelectedTemplate(template);
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
    return variable.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getTotalDuration = (sections: CeremonyTemplate['sections']) => {
    return sections.reduce((sum, s) => sum + (s.durationMin || 0), 0);
  };

  const getTemplateIcon = (templateId: string) => {
    return TEMPLATE_ICONS[templateId] || Calendar;
  };

  const isTextareaField = (variable: string) => {
    return ['lista_motivos_oracion', 'participantes_especiales', 'participaciones_especiales', 'anuncios_clave'].includes(variable);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {language === 'es' ? 'Programas Semanales' : 'Weekly Programs'}
            </h1>
            <p className="text-slate-600 mt-1">
              {language === 'es' 
                ? 'Culto de Jóvenes, Oración de Miércoles, Recibimiento del Sábado' 
                : 'Youth Service, Wednesday Prayer, Sabbath Welcome'}
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
          <TabsContent value="templates" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => {
                const IconComponent = getTemplateIcon(template.templateId);
                return (
                  <Card 
                    key={template.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 bg-white"
                    onClick={() => canEdit && handleSelectTemplate(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <IconComponent className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-slate-800">{template.name}</CardTitle>
                        </div>
                      </div>
                      <CardDescription className="text-sm mt-2">
                        {template.description}
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
                          className="w-full mt-4 bg-blue-600 hover:bg-blue-700" 
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

            {templates.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">
                    {language === 'es' 
                      ? 'No hay plantillas de programas semanales disponibles' 
                      : 'No weekly program templates available'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs">
            {programs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">
                    {language === 'es' 
                      ? 'No hay programas semanales creados aún' 
                      : 'No weekly programs created yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {programs.map(program => {
                  const IconComponent = getTemplateIcon(program.template.templateId);
                  return (
                    <Card key={program.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <IconComponent className="w-5 h-5 text-blue-600" />
                            </div>
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
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/ceremony/${program.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                {language === 'es' ? 'Ver' : 'View'}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Program Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                {language === 'es' ? 'Crear Nuevo Programa' : 'Create New Program'}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedTemplate?.variables.map((variable) => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={variable}>{getVariableLabel(variable)}</Label>
                  {isTextareaField(variable) ? (
                    <Textarea
                      id={variable}
                      value={formData[variable] || ''}
                      onChange={(e) => setFormData({ ...formData, [variable]: e.target.value })}
                      placeholder={getVariableLabel(variable)}
                      rows={3}
                    />
                  ) : variable === 'fecha' ? (
                    <Input
                      id={variable}
                      type="date"
                      value={formData[variable] || ''}
                      onChange={(e) => setFormData({ ...formData, [variable]: e.target.value })}
                    />
                  ) : variable === 'hora_inicio' ? (
                    <Input
                      id={variable}
                      type="time"
                      value={formData[variable] || ''}
                      onChange={(e) => setFormData({ ...formData, [variable]: e.target.value })}
                    />
                  ) : (
                    <Input
                      id={variable}
                      type="text"
                      value={formData[variable] || ''}
                      onChange={(e) => setFormData({ ...formData, [variable]: e.target.value })}
                      placeholder={getVariableLabel(variable)}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Section Preview */}
            {selectedTemplate && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-700 mb-3">
                  {language === 'es' ? 'Orden del Programa' : 'Program Order'}
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTemplate.sections.map((section) => (
                    <div key={section.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {section.order}
                        </span>
                        <span className={section.optional ? 'text-slate-500' : 'text-slate-700'}>
                          {section.title}
                          {section.optional && <span className="text-xs ml-1">(opcional)</span>}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xs">
                        {section.durationMin ? `${section.durationMin} min` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleCreateProgram} 
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700"
              >
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
