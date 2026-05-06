'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ChevronLeft, ChevronRight, Calendar, Info, Save } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface EmphasisOption {
  key: string;
  labelEn: string;
  labelEs: string;
  preferredCategories: string[];
  description?: string;
}

interface MonthlyEmphasis {
  id: string;
  month: number;
  year: number;
  emphasisKey: string;
  title: string | null;
  titleEs: string | null;
  labelEn: string;
  labelEs: string;
  preferredCategories: string[];
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const translations = {
  en: {
    title: 'Monthly Emphasis Calendar',
    subtitle: 'Set the spiritual emphasis for each month of the year',
    back: 'Back to Dashboard',
    year: 'Year',
    evangelismNote: 'Note: Evangelism is a permanent priority applied to ALL programs (+8 boost to Mission, Salvation, Call, Second Coming hymns). It is not a monthly emphasis.',
    emphasisLabel: 'Monthly Emphasis',
    selectEmphasis: 'Select emphasis...',
    noEmphasis: '— No emphasis set —',
    remove: 'Remove',
    save: 'Save',
    preferredCategories: 'Preferred Categories',
    saved: 'Monthly emphasis saved',
    removed: 'Monthly emphasis removed',
    error: 'An error occurred',
  },
  es: {
    title: 'Calendario de Énfasis Mensual',
    subtitle: 'Establece el énfasis espiritual para cada mes del año',
    back: 'Volver al Panel',
    year: 'Año',
    evangelismNote: 'Nota: El Evangelismo es una prioridad permanente aplicada a TODOS los programas (+8 impulso a himnos de Misión, Salvación, Llamado, Segunda Venida). No es un énfasis mensual.',
    emphasisLabel: 'Énfasis Mensual',
    selectEmphasis: 'Seleccionar énfasis...',
    noEmphasis: '— Sin énfasis —',
    remove: 'Eliminar',
    save: 'Guardar',
    preferredCategories: 'Categorías Preferidas',
    saved: 'Énfasis mensual guardado',
    removed: 'Énfasis mensual eliminado',
    error: 'Ocurrió un error',
  },
};

export default function MonthlyEmphasisClient() {
  const { language } = useLanguage();
  const t = translations[language];
  const monthNames = language === 'es' ? MONTH_NAMES_ES : MONTH_NAMES_EN;

  const [year, setYear] = useState(new Date().getFullYear());
  const [emphases, setEmphases] = useState<MonthlyEmphasis[]>([]);
  const [options, setOptions] = useState<EmphasisOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchEmphases();
  }, [year]);

  const fetchEmphases = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/monthly-emphasis?year=${year}`);
      const data = await res.json();
      if (res.ok) {
        setEmphases(data.emphases || []);
        setOptions(data.availableOptions || []);
      }
    } catch (error) {
      console.error('Error fetching emphases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (month: number) => {
    const emphasisKey = pendingChanges[month];
    if (!emphasisKey) return;

    try {
      setSaving(month);
      const res = await fetch('/api/monthly-emphasis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, emphasisKey }),
      });

      if (res.ok) {
        toast.success(t.saved);
        setPendingChanges((prev) => {
          const copy = { ...prev };
          delete copy[month];
          return copy;
        });
        fetchEmphases();
      } else {
        toast.error(t.error);
      }
    } catch (error) {
      toast.error(t.error);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (month: number) => {
    try {
      setSaving(month);
      const res = await fetch(`/api/monthly-emphasis?month=${month}&year=${year}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(t.removed);
        fetchEmphases();
      } else {
        toast.error(t.error);
      }
    } catch (error) {
      toast.error(t.error);
    } finally {
      setSaving(null);
    }
  };

  const handleSelectChange = (month: number, value: string) => {
    if (value === '__none__') {
      // User selected "no emphasis" - trigger delete
      handleDelete(month);
    } else {
      setPendingChanges((prev) => ({ ...prev, [month]: value }));
    }
  };

  const getEmphasisForMonth = (month: number) => {
    return emphases.find((e) => e.month === month);
  };

  const getOptionLabel = (opt: EmphasisOption) => {
    return language === 'es' ? opt.labelEs : opt.labelEn;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t.back}
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          {t.title}
        </h1>
        <p className="text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      {/* Evangelism Note */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 p-4 rounded-r">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">{t.evangelismNote}</p>
        </div>
      </div>

      {/* Year Selector */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xl font-semibold min-w-[80px] text-center">{year}</span>
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Month Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
            const emphasis = getEmphasisForMonth(month);
            const pending = pendingChanges[month];
            const currentValue = pending || emphasis?.emphasisKey || '';
            const hasPending = !!pending && pending !== emphasis?.emphasisKey;

            return (
              <Card key={month} className={hasPending ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{monthNames[month - 1]}</CardTitle>
                  {emphasis && !hasPending && (
                    <CardDescription className="text-xs">
                      {t.preferredCategories}: {emphasis.preferredCategories.join(', ')}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Select
                      value={currentValue || '__none__'}
                      onValueChange={(value) => handleSelectChange(month, value)}
                      disabled={saving === month}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t.selectEmphasis}>
                          {currentValue
                            ? options.find((o) => o.key === currentValue)
                              ? getOptionLabel(options.find((o) => o.key === currentValue)!)
                              : currentValue
                            : t.noEmphasis}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{t.noEmphasis}</SelectItem>
                        {options.map((opt) => (
                          <SelectItem key={opt.key} value={opt.key}>
                            {getOptionLabel(opt)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {hasPending && (
                      <Button
                        size="icon"
                        variant="default"
                        onClick={() => handleSave(month)}
                        disabled={saving === month}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    )}

                    {emphasis && !hasPending && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(month)}
                        disabled={saving === month}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
