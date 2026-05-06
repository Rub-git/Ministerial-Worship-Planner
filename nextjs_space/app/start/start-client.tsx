'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Church, ChevronRight, BookOpen, Users, Cross, Flame, Building2, Heart, Globe } from 'lucide-react';

interface DenominationOption {
  id: string;
  name: string;
  nameEs: string;
  icon: React.ElementType;
  description: string;
  descriptionEs: string;
  color: string;
  allowCustomInput?: boolean;
}

const DENOMINATIONS: DenominationOption[] = [
  {
    id: 'Seventh-day Adventist',
    name: 'Seventh-day Adventist',
    nameEs: 'Adventista del Séptimo Día',
    icon: BookOpen,
    description: 'Sabbath-keeping, Second Coming emphasis, health ministry',
    descriptionEs: 'Observancia del sábado, énfasis en la segunda venida, ministerio de salud',
    color: 'bg-blue-600',
  },
  {
    id: 'Baptist',
    name: 'Baptist',
    nameEs: 'Bautista',
    icon: Users,
    description: "Believer's baptism, congregational governance, biblical authority",
    descriptionEs: 'Bautismo de creyentes, gobierno congregacional, autoridad bíblica',
    color: 'bg-indigo-600',
  },
  {
    id: 'Methodist',
    name: 'Methodist',
    nameEs: 'Metodista',
    icon: Heart,
    description: 'Wesleyan tradition, social holiness, practical faith',
    descriptionEs: 'Tradición wesleyana, santidad social, fe práctica',
    color: 'bg-green-600',
  },
  {
    id: 'Pentecostal',
    name: 'Pentecostal',
    nameEs: 'Pentecostal',
    icon: Flame,
    description: 'Spirit-filled worship, gifts of the Spirit, revival focus',
    descriptionEs: 'Adoración llena del Espíritu, dones del Espíritu, enfoque en avivamiento',
    color: 'bg-orange-600',
  },
  {
    id: 'Presbyterian',
    name: 'Presbyterian',
    nameEs: 'Presbiteriano',
    icon: Building2,
    description: 'Reformed tradition, elder governance, covenant theology',
    descriptionEs: 'Tradición reformada, gobierno de ancianos, teología del pacto',
    color: 'bg-purple-600',
  },
  {
    id: 'Non-denominational',
    name: 'Non-denominational',
    nameEs: 'No Denominacional',
    icon: Church,
    description: 'Independent, Bible-centered, community-focused',
    descriptionEs: 'Independiente, centrado en la Biblia, enfocado en la comunidad',
    color: 'bg-teal-600',
  },
  {
    id: 'OTHER',
    name: 'Other Christian Tradition',
    nameEs: 'Otra Tradición Cristiana',
    icon: Globe,
    description: 'General Christian templates and universal hymn library',
    descriptionEs: 'Plantillas cristianas generales y biblioteca de himnos universal',
    color: 'bg-gray-600',
    allowCustomInput: true,
  },
];

export function StartClient() {
  const router = useRouter();
  const [selectedDenomination, setSelectedDenomination] = useState<string | null>(null);
  const [customDenomination, setCustomDenomination] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  const selectedOption = DENOMINATIONS.find(d => d.id === selectedDenomination);

  const handleContinue = () => {
    if (selectedDenomination) {
      const params = new URLSearchParams({ denomination: selectedDenomination });
      if (selectedDenomination === 'OTHER' && customDenomination.trim()) {
        params.set('customDenomination', customDenomination.trim());
      }
      router.push(`/register?${params.toString()}`);
    }
  };

  const t = (en: string, es: string) => language === 'en' ? en : es;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1E3A8A] to-[#152d6b]">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
          className="text-white/70 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          <Globe className="w-4 h-4" />
          {language === 'en' ? 'Español' : 'English'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Logo & Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <Image
              src="/assets/mwp-logo-white.svg"
              alt="Ministerial Worship Planner"
              width={100}
              height={80}
              className="mx-auto"
              priority
            />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-white font-bold mb-4">
            {t('Select Your Church Tradition', 'Seleccione su Tradición Eclesiástica')}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            {t(
              'We\'ll customize your worship templates and doctrinal settings based on your denomination. This helps ensure hymn selections and program structures align with your tradition.',
              'Personalizaremos sus plantillas de adoración y configuraciones doctrinales según su denominación. Esto ayuda a garantizar que las selecciones de himnos y las estructuras del programa se alineen con su tradición.'
            )}
          </p>
        </div>

        {/* Denomination Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {DENOMINATIONS.map((denom) => {
            const Icon = denom.icon;
            const isSelected = selectedDenomination === denom.id;
            
            return (
              <button
                key={denom.id}
                onClick={() => {
                  setSelectedDenomination(denom.id);
                  // Clear custom input when switching to a different option
                  if (!denom.allowCustomInput) {
                    setCustomDenomination('');
                  }
                }}
                className={`relative p-6 rounded-xl text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-white ring-4 ring-[#C9A227] scale-[1.02]'
                    : 'bg-white/10 hover:bg-white/20 border border-white/20'
                }`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-[#C9A227] rounded-full flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                
                {/* Icon */}
                <div className={`w-12 h-12 ${isSelected ? denom.color : 'bg-white/20'} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-white/80'}`} />
                </div>
                
                {/* Title */}
                <h3 className={`font-semibold text-lg mb-2 ${
                  isSelected ? 'text-[#1E3A8A]' : 'text-white'
                }`}>
                  {language === 'en' ? denom.name : denom.nameEs}
                </h3>
                
                {/* Description */}
                <p className={`text-sm ${
                  isSelected ? 'text-gray-600' : 'text-white/60'
                }`}>
                  {language === 'en' ? denom.description : denom.descriptionEs}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom Denomination Input (inline expansion) */}
        {selectedOption?.allowCustomInput && (
          <div className="max-w-md mx-auto mb-10 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-white/10 border border-white/20 rounded-xl p-4">
              <label className="block text-white/80 text-sm mb-2">
                {t(
                  'Please specify your church tradition (optional)',
                  'Por favor especifique su tradición eclesiástica (opcional)'
                )}
              </label>
              <input
                type="text"
                value={customDenomination}
                onChange={(e) => setCustomDenomination(e.target.value)}
                placeholder={t(
                  'e.g., Anglican, Nazarene, Evangelical Free...',
                  'ej., Anglicano, Nazareno, Evangélico Libre...'
                )}
                className="w-full px-4 py-3 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 border-0 focus:ring-2 focus:ring-[#C9A227] outline-none"
                maxLength={100}
              />
              <p className="text-white/50 text-xs mt-2">
                {t(
                  'This helps us personalize your experience',
                  'Esto nos ayuda a personalizar su experiencia'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedDenomination}
            className={`px-10 py-4 rounded-lg text-lg font-semibold transition-all ${
              selectedDenomination
                ? 'bg-[#C9A227] hover:bg-[#B8911F] text-[#1E3A8A] cursor-pointer'
                : 'bg-white/20 text-white/40 cursor-not-allowed'
            }`}
          >
            {t('Continue to Registration', 'Continuar al Registro')}
            <ChevronRight className="inline-block ml-2 w-5 h-5" />
          </button>
          
          <p className="mt-6 text-white/50 text-sm">
            {t('Already have an account?', '¿Ya tiene una cuenta?')}{' '}
            <Link href="/login" className="text-[#C9A227] hover:underline">
              {t('Log in', 'Iniciar sesión')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
