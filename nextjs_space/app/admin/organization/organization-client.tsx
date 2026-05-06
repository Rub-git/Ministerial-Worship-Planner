'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Globe, 
  Clock, 
  Users, 
  FileText, 
  MessageSquare,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Upload,
  Palette,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Organization {
  id: string;
  nameEn: string;
  nameEs: string | null;
  mottoEn: string | null;
  mottoEs: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  logoPath: string | null;
  logoSvg: string | null;
  primaryColor: string | null;
  seniorPastor: string | null;
  associatePastor: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  defaultCoverVerseEn: string | null;
  defaultCoverVerseEs: string | null;
  defaultAnnouncementVerseEn: string | null;
  defaultAnnouncementVerseEs: string | null;
  welcomeMessageEn: string | null;
  welcomeMessageEs: string | null;
  sabbathSchoolTime: string | null;
  divineServiceTime: string | null;
  youthTime: string | null;
  wednesdayTime: string | null;
  fridayTime: string | null;
  foodDistributionTime: string | null;
}

const DEFAULT_COLORS = [
  { name: 'Deep Blue', value: '#1E3A8A' },      // Recommended: Azul profundo
  { name: 'Soft Gold', value: '#C9A227' },      // Recommended: Dorado suave
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Red', value: '#dc2626' },
];

interface Props {
  initialData: Organization;
}

export function OrganizationSettingsClient({ initialData }: Props) {
  const { language } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState<Organization>(initialData);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    en: {
      title: 'Church Settings',
      subtitle: 'Configure your church\'s identity, schedule, and defaults',
      back: 'Back to Dashboard',
      save: 'Save Changes',
      saving: 'Saving...',
      saved: 'Changes saved successfully!',
      error: 'Failed to save changes',
      // Tabs
      identity: 'Identity',
      address: 'Address',
      leadership: 'Leadership',
      schedule: 'Schedule',
      defaults: 'Defaults',
      social: 'Social',
      // Identity
      churchNameEn: 'Display Name (English)',
      churchNameEs: 'Display Name (Spanish)',
      mottoEn: 'Motto (English)',
      mottoEs: 'Motto (Spanish)',
      // Branding
      branding: 'Branding',
      brandingDesc: 'Logo and colors for your church identity',
      logoUpload: 'Church Logo',
      uploadLogo: 'Upload Logo',
      removeLogo: 'Remove',
      logoPath: 'Logo URL',
      logoSvg: 'Logo SVG Code',
      primaryColor: 'Primary Color',
      customColor: 'Custom',
      previewLabel: 'Preview',
      // Address
      addressLine1: 'Address Line 1',
      city: 'City',
      state: 'State',
      zip: 'ZIP Code',
      // Leadership
      seniorPastor: 'Senior Pastor',
      associatePastor: 'Associate Pastor / Elder',
      // Schedule
      sabbathSchool: 'Sabbath School',
      divineService: 'Divine Service',
      youthService: 'Youth Service',
      wednesday: 'Wednesday Prayer',
      friday: 'Friday Vespers',
      foodDistribution: 'Food Distribution',
      // Defaults
      coverVerseEn: 'Default Cover Verse (English)',
      coverVerseEs: 'Default Cover Verse (Spanish)',
      announcementVerseEn: 'Default Announcement Verse (English)',
      announcementVerseEs: 'Default Announcement Verse (Spanish)',
      welcomeEn: 'Welcome Message (English)',
      welcomeEs: 'Welcome Message (Spanish)',
      // Social
      website: 'Website URL',
      facebook: 'Facebook URL',
    },
    es: {
      title: 'Configuración de la Iglesia',
      subtitle: 'Configure la identidad, horario y valores predeterminados de su iglesia',
      back: 'Volver al Panel',
      save: 'Guardar Cambios',
      saving: 'Guardando...',
      saved: '¡Cambios guardados exitosamente!',
      error: 'Error al guardar los cambios',
      // Tabs
      identity: 'Identidad',
      address: 'Dirección',
      leadership: 'Liderazgo',
      schedule: 'Horario',
      defaults: 'Predeterminados',
      social: 'Redes',
      // Identity
      churchNameEn: 'Nombre para Mostrar (Inglés)',
      churchNameEs: 'Nombre para Mostrar (Español)',
      mottoEn: 'Lema (Inglés)',
      mottoEs: 'Lema (Español)',
      // Branding
      branding: 'Identidad Visual',
      brandingDesc: 'Logo y colores para la identidad de su iglesia',
      logoUpload: 'Logo de la Iglesia',
      uploadLogo: 'Subir Logo',
      removeLogo: 'Eliminar',
      logoPath: 'URL del Logo',
      logoSvg: 'Código SVG del Logo',
      primaryColor: 'Color Primario',
      customColor: 'Personalizado',
      previewLabel: 'Vista Previa',
      // Address
      addressLine1: 'Línea de Dirección 1',
      city: 'Ciudad',
      state: 'Estado',
      zip: 'Código Postal',
      // Leadership
      seniorPastor: 'Pastor Principal',
      associatePastor: 'Pastor Asociado / Anciano',
      // Schedule
      sabbathSchool: 'Escuela Sabática',
      divineService: 'Culto Divino',
      youthService: 'Sociedad de Jóvenes',
      wednesday: 'Oración del Miércoles',
      friday: 'Vespertina del Viernes',
      foodDistribution: 'Distribución de Alimentos',
      // Defaults
      coverVerseEn: 'Versículo de Portada (Inglés)',
      coverVerseEs: 'Versículo de Portada (Español)',
      announcementVerseEn: 'Versículo de Anuncios (Inglés)',
      announcementVerseEs: 'Versículo de Anuncios (Español)',
      welcomeEn: 'Mensaje de Bienvenida (Inglés)',
      welcomeEs: 'Mensaje de Bienvenida (Español)',
      // Social
      website: 'URL del Sitio Web',
      facebook: 'URL de Facebook',
    },
  };

  const labels = t[language];

  const handleChange = (field: keyof Organization, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert(language === 'en' 
        ? 'Please upload a PNG, JPEG, SVG, or WebP image' 
        : 'Por favor suba una imagen PNG, JPEG, SVG o WebP');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert(language === 'en' 
        ? 'Logo must be smaller than 2MB' 
        : 'El logo debe ser menor a 2MB');
      return;
    }

    setUploading(true);
    try {
      // Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: `logo-${Date.now()}-${file.name}`,
          contentType: file.type,
          isPublic: true,
        }),
      });

      if (!presignedRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 
          'Content-Type': file.type,
          'Content-Disposition': 'attachment'
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file');

      // Get the public URL
      const urlRes = await fetch(`/api/upload/presigned?cloud_storage_path=${encodeURIComponent(cloud_storage_path)}&isPublic=true`);
      if (urlRes.ok) {
        const { fileUrl } = await urlRes.json();
        handleChange('logoPath', fileUrl);
      } else {
        throw new Error('Failed to get file URL');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(language === 'en' ? 'Failed to upload logo' : 'Error al subir el logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    handleChange('logoPath', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, field, type = 'text', placeholder }: { 
    label: string; 
    field: keyof Organization; 
    type?: string;
    placeholder?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <Input
        id={field}
        type={type}
        value={formData[field] || ''}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  const TextareaField = ({ label, field, rows = 3, placeholder }: { 
    label: string; 
    field: keyof Organization; 
    rows?: number;
    placeholder?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <Textarea
        id={field}
        rows={rows}
        value={formData[field] || ''}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{labels.title}</h1>
                <p className="text-sm text-gray-500">{labels.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus === 'success' && (
                <span className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {labels.saved}
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {labels.error}
                </span>
              )}
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? labels.saving : labels.save}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="identity" className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.identity}</span>
            </TabsTrigger>
            <TabsTrigger value="address" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.address}</span>
            </TabsTrigger>
            <TabsTrigger value="leadership" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.leadership}</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.schedule}</span>
            </TabsTrigger>
            <TabsTrigger value="defaults" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.defaults}</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.social}</span>
            </TabsTrigger>
          </TabsList>

          {/* Identity Tab */}
          <TabsContent value="identity">
            <div className="space-y-6">
              {/* Display Names */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {labels.identity}
                  </CardTitle>
                  <CardDescription>
                    {language === 'en' 
                      ? 'Church name and motto displayed across the platform'
                      : 'Nombre de la iglesia y lema mostrados en la plataforma'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label={labels.churchNameEn} field="nameEn" />
                    <InputField label={labels.churchNameEs} field="nameEs" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label={labels.mottoEn} field="mottoEn" placeholder="Growing Together in Faith" />
                    <InputField label={labels.mottoEs} field="mottoEs" placeholder="Creciendo Juntos en la Fe" />
                  </div>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    {labels.branding}
                  </CardTitle>
                  <CardDescription>{labels.brandingDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-3">
                    <Label>{labels.logoUpload}</Label>
                    <div className="flex items-start gap-4">
                      {/* Logo Preview */}
                      <div 
                        className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: formData.primaryColor || '#f3f4f6' }}
                      >
                        {formData.logoPath ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={formData.logoPath}
                              alt="Church logo"
                              fill
                              className="object-contain p-2"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading 
                              ? (language === 'en' ? 'Uploading...' : 'Subiendo...') 
                              : labels.uploadLogo}
                          </Button>
                          {formData.logoPath && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              onClick={handleRemoveLogo}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {language === 'en' 
                            ? 'PNG, JPEG, SVG, or WebP. Max 2MB.'
                            : 'PNG, JPEG, SVG o WebP. Máx 2MB.'}
                        </p>
                        {/* Manual URL input */}
                        <Input
                          value={formData.logoPath || ''}
                          onChange={(e) => handleChange('logoPath', e.target.value)}
                          placeholder={language === 'en' ? 'Or enter logo URL' : 'O ingrese URL del logo'}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary Color */}
                  <div className="space-y-3">
                    <Label>{labels.primaryColor}</Label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => handleChange('primaryColor', color.value)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            formData.primaryColor === color.value 
                              ? 'border-gray-900 scale-110 shadow-md' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                      {/* Custom color picker */}
                      <div className="relative">
                        <input
                          type="color"
                          value={formData.primaryColor || '#7c3aed'}
                          onChange={(e) => handleChange('primaryColor', e.target.value)}
                          className="absolute inset-0 w-10 h-10 opacity-0 cursor-pointer"
                        />
                        <div 
                          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${
                            !DEFAULT_COLORS.find(c => c.value === formData.primaryColor)
                              ? 'border-gray-900 scale-110 shadow-md'
                              : 'border-gray-300 hover:scale-105'
                          }`}
                          style={{ 
                            backgroundColor: !DEFAULT_COLORS.find(c => c.value === formData.primaryColor) 
                              ? formData.primaryColor || '#fff' 
                              : '#fff' 
                          }}
                        >
                          <Palette className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {language === 'en' 
                        ? 'This color will be used in PDF exports and other branded materials.'
                        : 'Este color se usará en exportaciones PDF y otros materiales con marca.'}
                    </p>
                  </div>

                  {/* Preview */}
                  <div className="space-y-3">
                    <Label>{labels.previewLabel}</Label>
                    <div 
                      className="p-4 rounded-lg border"
                      style={{ borderColor: formData.primaryColor || '#7c3aed' }}
                    >
                      <div className="flex items-center gap-3">
                        {formData.logoPath ? (
                          <div className="relative w-12 h-12">
                            <Image
                              src={formData.logoPath}
                              alt="Logo preview"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: formData.primaryColor || '#7c3aed' }}
                          >
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                        )}
                        <div>
                          <h3 
                            className="font-bold"
                            style={{ color: formData.primaryColor || '#7c3aed' }}
                          >
                            {formData.nameEn || 'Your Church Name'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formData.mottoEn || 'Growing Together in Faith'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t text-center text-xs text-gray-400">
                        Powered by Ministerial Worship Planner
                      </div>
                    </div>
                  </div>

                  {/* SVG Code (advanced) */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      {language === 'en' ? '▶ Advanced: SVG Logo Code' : '▶ Avanzado: Código SVG del Logo'}
                    </summary>
                    <div className="mt-2">
                      <TextareaField 
                        label={labels.logoSvg} 
                        field="logoSvg" 
                        rows={4}
                        placeholder="<svg>...</svg>"
                      />
                    </div>
                  </details>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Address Tab */}
          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {labels.address}
                </CardTitle>
                <CardDescription>
                  {language === 'en' 
                    ? 'Physical location of the church'
                    : 'Ubicación física de la iglesia'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField label={labels.addressLine1} field="addressLine1" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField label={labels.city} field="city" />
                  <InputField label={labels.state} field="state" />
                  <InputField label={labels.zip} field="zip" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leadership Tab */}
          <TabsContent value="leadership">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {labels.leadership}
                </CardTitle>
                <CardDescription>
                  {language === 'en' 
                    ? 'Pastors and church leaders'
                    : 'Pastores y líderes de la iglesia'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField label={labels.seniorPastor} field="seniorPastor" placeholder="Pastor Juan García" />
                <InputField label={labels.associatePastor} field="associatePastor" placeholder="Elder Maria Santos" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {labels.schedule}
                </CardTitle>
                <CardDescription>
                  {language === 'en' 
                    ? 'Default service times shown in program exports'
                    : 'Horarios predeterminados mostrados en exportaciones de programas'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label={labels.sabbathSchool} field="sabbathSchoolTime" placeholder="9:30 AM" />
                  <InputField label={labels.divineService} field="divineServiceTime" placeholder="11:00 AM" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label={labels.youthService} field="youthTime" placeholder="5:00 PM" />
                  <InputField label={labels.wednesday} field="wednesdayTime" placeholder="7:00 PM" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label={labels.friday} field="fridayTime" placeholder="7:00 PM" />
                  <InputField label={labels.foodDistribution} field="foodDistributionTime" placeholder="1st Sunday 10:00 AM" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Defaults Tab */}
          <TabsContent value="defaults">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {labels.defaults}
                </CardTitle>
                <CardDescription>
                  {language === 'en' 
                    ? 'Default verses and messages used when programs don\'t specify them'
                    : 'Versículos y mensajes predeterminados usados cuando los programas no los especifican'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    {language === 'en' ? 'Cover Verse' : 'Versículo de Portada'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextareaField label={labels.coverVerseEn} field="defaultCoverVerseEn" rows={2} />
                    <TextareaField label={labels.coverVerseEs} field="defaultCoverVerseEs" rows={2} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    {language === 'en' ? 'Announcement Verse' : 'Versículo de Anuncios'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextareaField label={labels.announcementVerseEn} field="defaultAnnouncementVerseEn" rows={2} />
                    <TextareaField label={labels.announcementVerseEs} field="defaultAnnouncementVerseEs" rows={2} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    {language === 'en' ? 'Welcome Message' : 'Mensaje de Bienvenida'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextareaField label={labels.welcomeEn} field="welcomeMessageEn" rows={3} />
                    <TextareaField label={labels.welcomeEs} field="welcomeMessageEs" rows={3} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {labels.social}
                </CardTitle>
                <CardDescription>
                  {language === 'en' 
                    ? 'Website and social media links'
                    : 'Sitio web y enlaces de redes sociales'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField 
                  label={labels.website} 
                  field="websiteUrl" 
                  type="url"
                  placeholder="https://yourchurch.com" 
                />
                <InputField 
                  label={labels.facebook} 
                  field="facebookUrl" 
                  type="url"
                  placeholder="https://facebook.com/yourchurch" 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
