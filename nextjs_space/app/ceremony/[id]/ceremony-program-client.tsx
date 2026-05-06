'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Save, FileText, Printer, Clock, User, CheckCircle, Edit2, Trash2, Music, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { HymnPickerModal } from '@/components/hymn-picker-modal';

interface HymnPair {
  id: number;
  numberEs: number;
  titleEs: string;
  numberEn: number | null;
  titleEn: string | null;
}

interface SectionOverride {
  sectionId: string;
  personName?: string | null;
  hymnPairId?: number | null;
  hymnPair?: HymnPair | null;
  textCustom?: string | null;
  notes?: string | null;
}

interface CeremonySection {
  id: string;
  order: number;
  title: string;
  role: string | null;
  durationMin: number | null;
  optional: boolean;
  notes: string | null;
}

// Helper to detect if a section should have hymn selection
const sectionHasHymn = (title: string): boolean => {
  const hymnKeywords = ['himno', 'hymn', 'doxología', 'doxology', 'canto', 'song', 'alabanza', 'música', 'music', 'preludio', 'prelude'];
  const lowerTitle = title.toLowerCase();
  return hymnKeywords.some(k => lowerTitle.includes(k));
};

// Helper to detect if a section should have text input
const sectionHasText = (title: string): boolean => {
  const textKeywords = ['tema', 'theme', 'sermón', 'sermon', 'mensaje', 'message', 'reflexión', 'reflection', 
    'lectura', 'reading', 'texto', 'text', 'lección', 'lesson', 'historia', 'story', 'anuncios', 'announcements'];
  const lowerTitle = title.toLowerCase();
  return textKeywords.some(k => lowerTitle.includes(k));
};

// Helper to detect if a section should have person assignment
const sectionHasPerson = (title: string, role: string | null): boolean => {
  // If the section has a role defined, it needs a person
  if (role && role.trim() !== '') return true;
  // Also check title for person-related keywords
  const personKeywords = ['oración', 'prayer', 'bienvenida', 'welcome', 'bendición', 'benediction', 
    'invocación', 'invocation', 'ofrenda', 'offering', 'participante', 'participant'];
  const lowerTitle = title.toLowerCase();
  return personKeywords.some(k => lowerTitle.includes(k));
};

interface CeremonyProgram {
  id: string;
  date: string;
  status: string;
  variables: Record<string, string>;
  sectionOverrides: any[];
  template: {
    id: string;
    templateId: string;
    name: string;
    category: string;
    description: string | null;
    variables: string[];
    sections: CeremonySection[];
  };
  organization: {
    nameEn: string;
    nameEs: string | null;
  } | null;
  createdBy: {
    name: string | null;
    email: string;
  };
}

interface Props {
  program: CeremonyProgram;
  userRole: string;
}

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

export default function CeremonyProgramClient({ program, userRole }: Props) {
  const { language } = useLanguage();
  const router = useRouter();
  const [variables, setVariables] = useState<Record<string, string>>(program.variables as Record<string, string>);
  
  // Convert sectionOverrides array to a map for easier access
  const initialOverridesMap: Record<string, SectionOverride> = {};
  ((program.sectionOverrides as SectionOverride[]) || []).forEach(override => {
    initialOverridesMap[override.sectionId] = override;
  });
  const [overridesMap, setOverridesMap] = useState<Record<string, SectionOverride>>(initialOverridesMap);
  
  const [saving, setSaving] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Hymn picker state
  const [hymnPickerOpen, setHymnPickerOpen] = useState(false);
  const [activeHymnSectionId, setActiveHymnSectionId] = useState<string | null>(null);
  
  // Collapsible sections
  const [sectionsExpanded, setSectionsExpanded] = useState(true);

  const canEdit = userRole === 'ADMIN' || userRole === 'EDITOR';
  
  // Get override for a section
  const getOverride = (sectionId: string): SectionOverride => {
    return overridesMap[sectionId] || { sectionId };
  };
  
  // Update override for a section
  const updateOverride = (sectionId: string, field: keyof SectionOverride, value: any) => {
    setOverridesMap(prev => ({
      ...prev,
      [sectionId]: {
        ...getOverride(sectionId),
        [field]: value,
      },
    }));
  };
  
  // Handle hymn selection
  const handleHymnSelect = (hymn: HymnPair) => {
    if (activeHymnSectionId) {
      setOverridesMap(prev => ({
        ...prev,
        [activeHymnSectionId]: {
          ...getOverride(activeHymnSectionId),
          hymnPairId: hymn.id,
          hymnPair: hymn,
        },
      }));
    }
    setActiveHymnSectionId(null);
  };
  
  // Open hymn picker for a section
  const openHymnPicker = (sectionId: string) => {
    setActiveHymnSectionId(sectionId);
    setHymnPickerOpen(true);
  };

  const getVariableLabel = (variable: string) => {
    const labels = VARIABLE_LABELS[variable];
    if (labels) {
      return language === 'es' ? labels.es : labels.en;
    }
    return variable.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert overrides map back to array, filtering out empty overrides
      const sectionOverridesArray = Object.values(overridesMap).filter(override => 
        override.personName || override.hymnPairId || override.textCustom || override.notes
      );
      
      const response = await fetch(`/api/ceremony-programs/${program.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variables,
          sectionOverrides: sectionOverridesArray,
          status: 'ready',
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success(language === 'es' ? '¡Programa guardado!' : 'Program saved!');
      setShowEditDialog(false);
      setEditMode(false);
      router.refresh();
    } catch (error) {
      toast.error(language === 'es' ? 'Error al guardar' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/ceremony-programs/${program.id}/pdf`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${program.template.templateId}-${program.date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(language === 'es' ? 'Error al generar PDF' : 'Error generating PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(language === 'es' ? '¿Eliminar este programa?' : 'Delete this program?')) return;

    try {
      const response = await fetch(`/api/ceremony-programs/${program.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success(language === 'es' ? 'Eliminado' : 'Deleted');
      router.push('/ceremonies');
    } catch (error) {
      toast.error(language === 'es' ? 'Error al eliminar' : 'Error deleting');
    }
  };

  const getTotalDuration = () => {
    return program.template.sections.reduce((sum, s) => sum + (s.durationMin || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/weekly-programs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'es' ? 'Volver' : 'Back'}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Eliminar' : 'Delete'}
              </Button>
            )}
            <Button onClick={handleExportPDF} disabled={exporting} className="bg-[#1E3A8A] hover:bg-[#152d6b]">
              <Printer className="w-4 h-4 mr-2" />
              {exporting ? '...' : 'PDF'}
            </Button>
          </div>
        </div>

        {/* Program Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">{program.template.category}</p>
                <CardTitle className="text-2xl">{program.template.name}</CardTitle>
                <p className="text-slate-500 mt-1">
                  {new Date(program.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>~{getTotalDuration()} min</span>
                </div>
                <span className={`inline-block mt-2 px-3 py-1 text-sm rounded-full ${
                  program.status === 'ready' ? 'bg-green-100 text-green-700' :
                  program.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {program.status === 'ready' ? (language === 'es' ? 'Listo' : 'Ready') :
                   program.status === 'completed' ? (language === 'es' ? 'Completado' : 'Completed') :
                   (language === 'es' ? 'Borrador' : 'Draft')}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Variables Summary */}
        {Object.keys(variables).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'es' ? 'Información del Evento' : 'Event Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(variables).filter(([_, v]) => v).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">{getVariableLabel(key)}</span>
                    <span className="font-medium text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Program Sections - Editable */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {language === 'es' ? 'Orden del Programa' : 'Program Order'}
              </CardTitle>
              {canEdit && (
                <Button
                  variant={editMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                  className={editMode ? "bg-[#C9A227] hover:bg-[#B8911F] text-white" : ""}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {editMode 
                    ? (language === 'es' ? 'Editando...' : 'Editing...') 
                    : (language === 'es' ? 'Editar Programa' : 'Edit Program')}
                </Button>
              )}
            </div>
            {editMode && (
              <p className="text-sm text-amber-600 mt-2">
                {language === 'es' 
                  ? '✏️ Escribe en cada sección y presiona Guardar cuando termines'
                  : '✏️ Fill in each section and press Save when done'}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {program.template.sections.map((section) => {
                const override = getOverride(section.id);
                const hasHymn = sectionHasHymn(section.title);
                const hasText = sectionHasText(section.title);
                const hasPerson = sectionHasPerson(section.title, section.role);
                const isHeaderSection = section.title.startsWith('—') || section.title.startsWith('-');
                
                // Header sections (like "— ESCUELA SABÁTICA —")
                if (isHeaderSection) {
                  return (
                    <div key={section.id} className="bg-[#1E3A8A] text-white py-3 px-4 rounded-lg text-center font-bold">
                      {section.title}
                    </div>
                  );
                }
                
                return (
                  <div key={section.id} className={`p-4 rounded-lg border ${
                    editMode ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {/* Section Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-sm font-bold">
                          {section.order}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{section.title}</h3>
                          {section.role && !editMode && (
                            <p className="text-sm text-blue-600">{section.role}</p>
                          )}
                        </div>
                      </div>
                      {section.durationMin && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {section.durationMin} min
                        </span>
                      )}
                    </div>
                    
                    {/* Editable Fields */}
                    {editMode ? (
                      <div className="space-y-3 mt-3 pl-11">
                        {/* Person Assignment */}
                        {hasPerson && (
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">
                              <User className="w-3 h-3 inline mr-1" />
                              {language === 'es' ? 'Persona Asignada' : 'Person Assigned'}
                              {section.role && <span className="text-slate-400"> ({section.role})</span>}
                            </label>
                            <Input
                              value={override.personName || ''}
                              onChange={(e) => updateOverride(section.id, 'personName', e.target.value)}
                              placeholder={language === 'es' ? 'Nombre de la persona' : 'Person name'}
                              className="bg-white"
                            />
                          </div>
                        )}
                        
                        {/* Hymn Selection */}
                        {hasHymn && (
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">
                              <Music className="w-3 h-3 inline mr-1" />
                              {language === 'es' ? 'Himno' : 'Hymn'}
                            </label>
                            <button
                              type="button"
                              onClick={() => openHymnPicker(section.id)}
                              className="w-full flex items-center gap-2 p-3 border border-dashed border-slate-300 rounded-lg hover:border-[#C9A227] hover:bg-amber-50 transition-colors text-left"
                            >
                              <Music className="w-5 h-5 text-[#C9A227]" />
                              {override.hymnPair ? (
                                <span className="text-slate-800">
                                  {override.hymnPair.numberEn && override.hymnPair.titleEn 
                                    ? `#${override.hymnPair.numberEn} ${override.hymnPair.titleEn} / #${override.hymnPair.numberEs} ${override.hymnPair.titleEs}`
                                    : `#${override.hymnPair.numberEs} ${override.hymnPair.titleEs}`
                                  }
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  {language === 'es' ? 'Click para seleccionar himno' : 'Click to select hymn'}
                                </span>
                              )}
                            </button>
                          </div>
                        )}
                        
                        {/* Text Input */}
                        {hasText && (
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">
                              <FileText className="w-3 h-3 inline mr-1" />
                              {language === 'es' ? 'Tema / Texto' : 'Theme / Text'}
                            </label>
                            <Input
                              value={override.textCustom || ''}
                              onChange={(e) => updateOverride(section.id, 'textCustom', e.target.value)}
                              placeholder={language === 'es' ? 'Escriba el tema o texto' : 'Enter theme or text'}
                              className="bg-white"
                            />
                          </div>
                        )}
                        
                        {/* Notes */}
                        {!hasPerson && !hasHymn && !hasText && (
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">
                              {language === 'es' ? 'Notas / Detalles' : 'Notes / Details'}
                            </label>
                            <Input
                              value={override.notes || ''}
                              onChange={(e) => updateOverride(section.id, 'notes', e.target.value)}
                              placeholder={language === 'es' ? 'Notas adicionales' : 'Additional notes'}
                              className="bg-white"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      /* View Mode - Show saved values */
                      <div className="mt-2 pl-11 space-y-1">
                        {override.personName && (
                          <p className="text-sm flex items-center gap-1">
                            <User className="w-3 h-3 text-blue-600" />
                            <span className="font-medium">{override.personName}</span>
                          </p>
                        )}
                        {override.hymnPair && (
                          <p className="text-sm flex items-center gap-1">
                            <Music className="w-3 h-3 text-[#C9A227]" />
                            <span>
                              {override.hymnPair.numberEn && override.hymnPair.titleEn 
                                ? `#${override.hymnPair.numberEn} ${override.hymnPair.titleEn} / #${override.hymnPair.numberEs} ${override.hymnPair.titleEs}`
                                : `#${override.hymnPair.numberEs} ${override.hymnPair.titleEs}`
                              }
                            </span>
                          </p>
                        )}
                        {override.textCustom && (
                          <p className="text-sm flex items-center gap-1">
                            <FileText className="w-3 h-3 text-green-600" />
                            <span>{override.textCustom}</span>
                          </p>
                        )}
                        {override.notes && (
                          <p className="text-sm text-slate-500 italic">{override.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Save Button when in Edit Mode */}
            {editMode && canEdit && (
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-[#C9A227] hover:bg-[#B8911F] text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving 
                    ? (language === 'es' ? 'Guardando...' : 'Saving...') 
                    : (language === 'es' ? 'Guardar Programa' : 'Save Program')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Hymn Picker Modal */}
        <HymnPickerModal
          isOpen={hymnPickerOpen}
          onClose={() => {
            setHymnPickerOpen(false);
            setActiveHymnSectionId(null);
          }}
          onSelect={handleHymnSelect}
          languageMode="BILINGUAL"
        />

      </div>
    </div>
  );
}
