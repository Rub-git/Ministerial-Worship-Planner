'use client';

/**
 * =============================================================================
 * PHASE 7 + 7C: ANALYTICS DASHBOARD CLIENT
 * Features:
 * - Pie chart: Category distribution
 * - Bar chart: Monthly emphasis usage
 * - Pie chart: OT vs NT distribution (7C)
 * - Bar chart: Biblical categories (7C)
 * - Top books used (7C)
 * - Advisory insights with alerts
 * =============================================================================
 */

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  ChevronLeft, AlertTriangle, CheckCircle, Info, TrendingUp,
  Calendar, BookOpen, Music, Target, Loader2, Book
} from 'lucide-react';
import type { DoctrinalBalanceResult, AdvisoryInsight, YearlyBiblicalTrend, CategoryInactivity } from '@/lib/doctrinal-analytics';

// Chart colors
const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#eab308', '#64748b', '#dc2626'
];

const MONTH_NAMES_SHORT = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
};

export default function AnalyticsDashboardClient() {
  const { language } = useLanguage();
  const currentYear = new Date().getFullYear();
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [data, setData] = useState<DoctrinalBalanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Translations
  const t = useMemo(() => ({
    en: {
      title: 'Doctrinal Balance Dashboard',
      subtitle: 'Annual analysis of worship program doctrinal distribution',
      backToDashboard: 'Back to Dashboard',
      selectYear: 'Select Year',
      overview: 'Overview',
      distribution: 'Distribution',
      trends: 'Trends',
      insights: 'Insights',
      totalPrograms: 'Total Programs',
      totalHymns: 'Hymns Used',
      specialEvents: 'Special Events',
      seriesPrograms: 'Series Programs',
      categoryDistribution: 'Hymn Category Distribution',
      closingHymns: 'Closing Hymn Categories',
      monthlyEmphasis: 'Monthly Emphasis Usage',
      emphasisUsage: 'Emphasis Usage Rate',
      specialEventsBreakdown: 'Special Events Breakdown',
      seriesCoverage: 'Series Coverage',
      completionRate: 'Completion Rate',
      advisoryInsights: 'Advisory Insights',
      noData: 'No data available for this year',
      loading: 'Loading analytics...',
      programsPerMonth: 'Programs per Month',
      month: 'Month',
      programs: 'Programs',
      category: 'Category',
      percentage: 'Percentage',
      count: 'Count',
      warning: 'Warning',
      info: 'Information',
      success: 'Success',
      suggestion: 'Suggestion',
      noInsights: 'No advisory insights for this period.',
      weeks: 'weeks',
      of: 'of',
      // Phase 7C (Pastoral Level): Biblical
      biblical: 'Biblical',
      biblicalDistribution: 'Biblical Distribution',
      otNtDistribution: 'Old vs New Testament',
      scriptureCategoryDistribution: 'Scripture Category Distribution',
      oldTestament: 'Old Testament',
      newTestament: 'New Testament',
      scriptureReferences: 'Scripture References',
      noScriptureData: 'No scripture references recorded for this year.',
      threeYearTrend: '3-Year Rolling Trend',
      threeYearTrendDesc: 'Biblical distribution trends over the past 3 years',
      prophets: 'Prophets',
      apocalyptic: 'Apocalyptic',
      epistles: 'Epistles',
      gospels: 'Gospels',
      monthsInactive: 'months inactive',
      criticalCategoryStatus: 'Critical Category Status',
      lastUsed: 'Last used',
      never: 'Never',
    },
    es: {
      title: 'Panel de Equilibrio Doctrinal',
      subtitle: 'Análisis anual de distribución doctrinal en programas de adoración',
      backToDashboard: 'Volver al Panel',
      selectYear: 'Seleccionar Año',
      overview: 'Resumen',
      distribution: 'Distribución',
      trends: 'Tendencias',
      insights: 'Consejos',
      totalPrograms: 'Total de Programas',
      totalHymns: 'Himnos Usados',
      specialEvents: 'Eventos Especiales',
      seriesPrograms: 'Programas de Serie',
      categoryDistribution: 'Distribución de Categorías de Himnos',
      closingHymns: 'Categorías de Himnos de Cierre',
      monthlyEmphasis: 'Uso de Énfasis Mensual',
      emphasisUsage: 'Tasa de Uso de Énfasis',
      specialEventsBreakdown: 'Desglose de Eventos Especiales',
      seriesCoverage: 'Cobertura de Series',
      completionRate: 'Tasa de Completado',
      advisoryInsights: 'Consejos Orientativos',
      noData: 'No hay datos disponibles para este año',
      loading: 'Cargando análisis...',
      programsPerMonth: 'Programas por Mes',
      month: 'Mes',
      programs: 'Programas',
      category: 'Categoría',
      percentage: 'Porcentaje',
      count: 'Cantidad',
      warning: 'Advertencia',
      info: 'Información',
      success: 'Éxito',
      suggestion: 'Sugerencia',
      noInsights: 'Sin consejos orientativos para este período.',
      weeks: 'semanas',
      of: 'de',
      // Phase 7C: Biblical
      biblical: 'Bíblico',
      biblicalDistribution: 'Distribución Bíblica',
      otNtDistribution: 'Antiguo vs Nuevo Testamento',
      scriptureCategoryDistribution: 'Distribución por Categoría Bíblica',
      oldTestament: 'Antiguo Testamento',
      newTestament: 'Nuevo Testamento',
      scriptureReferences: 'Referencias Bíblicas',
      noScriptureData: 'Sin referencias bíblicas registradas para este año.',
      threeYearTrend: 'Tendencia de 3 Años',
      threeYearTrendDesc: 'Tendencias de distribución bíblica en los últimos 3 años',
      prophets: 'Profetas',
      apocalyptic: 'Apocalíptico',
      epistles: 'Epístolas',
      gospels: 'Evangelios',
      monthsInactive: 'meses inactivo',
      criticalCategoryStatus: 'Estado de Categorías Críticas',
      lastUsed: 'Último uso',
      never: 'Nunca',
    },
  }), []);

  const labels = t[language];
  const monthNames = MONTH_NAMES_SHORT[language];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/doctrinal-balance?year=${selectedYear}`);
        if (!res.ok) throw new Error('Failed to fetch data');
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  // Prepare chart data
  const pieChartData = useMemo(() => {
    if (!data?.categoryDetails) return [];
    return data.categoryDetails.slice(0, 10).map((item, i) => ({
      name: item.category,
      value: item.count,
      percentage: item.percentage,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [data]);

  const monthlyBarData = useMemo(() => {
    if (!data?.monthlyEmphasisBreakdown) return [];
    return data.monthlyEmphasisBreakdown.map((item, i) => ({
      month: monthNames[i],
      programs: item.programCount,
      emphasis: item.emphasisKey || 'None',
      hasEmphasis: item.emphasisKey ? 1 : 0,
    }));
  }, [data, monthNames]);

  const closingPieData = useMemo(() => {
    if (!data?.closingCategoryDetails) return [];
    return data.closingCategoryDetails.slice(0, 8).map((item, i) => ({
      name: item.category,
      value: item.count,
      percentage: item.percentage,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [data]);

  // Phase 7C: Biblical chart data
  const testamentPieData = useMemo(() => {
    if (!data?.biblicalDistribution) return [];
    const { OT, NT, otCount, ntCount } = data.biblicalDistribution;
    if (otCount === 0 && ntCount === 0) return [];
    return [
      { name: 'OT', value: otCount, percentage: OT, fill: '#8b5cf6' },
      { name: 'NT', value: ntCount, percentage: NT, fill: '#22c55e' },
    ];
  }, [data]);

  const scriptureCategoryBarData = useMemo(() => {
    if (!data?.bookCategoryDetails) return [];
    return data.bookCategoryDetails
      .filter(c => c.count > 0)
      .map((item, i) => ({
        category: item.category,
        count: item.count,
        percentage: item.percentage,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [data]);

  // 3-Year Trend Line Chart Data
  const threeYearTrendData = useMemo(() => {
    if (!data?.threeYearTrend) return [];
    return data.threeYearTrend.map(item => ({
      year: String(item.year),
      OT: item.otPercentage,
      NT: item.ntPercentage,
      Epistles: item.epistlesPercentage,
      Gospels: item.gospelsPercentage,
      total: item.totalReferences,
    }));
  }, [data]);

  // Year options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{labels.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {labels.backToDashboard}
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">{labels.title}</h1>
                <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
              </div>
            </div>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !data || data.totalPrograms === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{labels.noData}</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{data.totalPrograms}</p>
                      <p className="text-sm text-muted-foreground">{labels.totalPrograms}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Music className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{data.totalHymnsUsed}</p>
                      <p className="text-sm text-muted-foreground">{labels.totalHymns}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{data.totalSpecialEvents}</p>
                      <p className="text-sm text-muted-foreground">{labels.specialEvents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{data.totalSeriesPrograms}</p>
                      <p className="text-sm text-muted-foreground">{labels.seriesPrograms}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="distribution" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="distribution">{labels.distribution}</TabsTrigger>
                <TabsTrigger value="biblical">{labels.biblical}</TabsTrigger>
                <TabsTrigger value="trends">{labels.trends}</TabsTrigger>
                <TabsTrigger value="series">{labels.seriesCoverage}</TabsTrigger>
                <TabsTrigger value="insights">{labels.insights}</TabsTrigger>
              </TabsList>

              {/* Distribution Tab */}
              <TabsContent value="distribution" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Category Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{labels.categoryDistribution}</CardTitle>
                      <CardDescription>Top 10 hymn categories by usage</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percentage }) => `${name} (${percentage}%)`}
                              labelLine={false}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, name: string, props: any) => [
                                `${value} (${props.payload.percentage}%)`,
                                labels.count
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Closing Hymns Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{labels.closingHymns}</CardTitle>
                      <CardDescription>Categories used for closing hymns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={closingPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percentage }) => `${name} (${percentage}%)`}
                              labelLine={false}
                            >
                              {closingPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, name: string, props: any) => [
                                `${value} (${props.payload.percentage}%)`,
                                labels.count
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Category Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">All Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {data.categoryDetails.map((cat, i) => (
                        <div
                          key={cat.category}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{cat.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold">{cat.percentage}%</span>
                            <span className="text-xs text-muted-foreground ml-1">({cat.count})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Phase 7C: Biblical Tab */}
              <TabsContent value="biblical" className="space-y-6">
                {testamentPieData.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-muted-foreground">
                        <Book className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{labels.noScriptureData}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-purple-600">{data?.biblicalDistribution?.otCount || 0}</p>
                            <p className="text-sm text-muted-foreground">{labels.oldTestament}</p>
                            <p className="text-lg font-medium">{data?.biblicalDistribution?.OT || 0}%</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{data?.biblicalDistribution?.ntCount || 0}</p>
                            <p className="text-sm text-muted-foreground">{labels.newTestament}</p>
                            <p className="text-lg font-medium">{data?.biblicalDistribution?.NT || 0}%</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{data?.totalScriptureReferences || 0}</p>
                            <p className="text-sm text-muted-foreground">{labels.scriptureReferences}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* OT vs NT Pie Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">{labels.otNtDistribution}</CardTitle>
                          <CardDescription>Old Testament vs New Testament usage</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={testamentPieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={70}
                                  outerRadius={110}
                                  paddingAngle={5}
                                  dataKey="value"
                                  label={({ name, percentage }) => `${name === 'OT' ? labels.oldTestament : labels.newTestament} (${percentage}%)`}
                                  labelLine={false}
                                >
                                  {testamentPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value: number, name: string, props: any) => [
                                    `${value} (${props.payload.percentage}%)`,
                                    name === 'OT' ? labels.oldTestament : labels.newTestament
                                  ]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Scripture Categories Bar Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">{labels.scriptureCategoryDistribution}</CardTitle>
                          <CardDescription>Law, Prophets, Gospels, Epistles, etc.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={scriptureCategoryBarData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" />
                                <YAxis dataKey="category" type="category" width={80} />
                                <Tooltip
                                  formatter={(value: number, name: string, props: any) => [
                                    `${value} (${props.payload.percentage}%)`,
                                    labels.count
                                  ]}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                  {scriptureCategoryBarData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 3-Year Rolling Trend */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{labels.threeYearTrend}</CardTitle>
                        <CardDescription>{labels.threeYearTrendDesc}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {threeYearTrendData.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No trend data available</p>
                        ) : (
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={threeYearTrendData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="year" />
                                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                <Tooltip
                                  formatter={(value: number, name: string) => [`${value}%`, name]}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="OT" stroke="#8b5cf6" strokeWidth={2} name={labels.oldTestament} />
                                <Line type="monotone" dataKey="NT" stroke="#22c55e" strokeWidth={2} name={labels.newTestament} />
                                <Line type="monotone" dataKey="Epistles" stroke="#f59e0b" strokeWidth={2} name={labels.epistles} />
                                <Line type="monotone" dataKey="Gospels" stroke="#3b82f6" strokeWidth={2} name={labels.gospels} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Critical Category Status (PROPHETS and APOCALYPTIC only) */}
                    {data?.criticalCategoryInactivity && data.criticalCategoryInactivity.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">{labels.criticalCategoryStatus}</CardTitle>
                          <CardDescription>18-month inactivity tracking for PROPHETS and APOCALYPTIC</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            {data.criticalCategoryInactivity.map((cat) => {
                              const isInactive = cat.monthsInactive >= 18;
                              return (
                                <div
                                  key={cat.category}
                                  className={`p-4 rounded-lg border ${
                                    isInactive
                                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                                      : 'border-green-300 bg-green-50 dark:bg-green-900/20'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">
                                      {cat.category === 'PROPHETS' ? labels.prophets : labels.apocalyptic}
                                    </span>
                                    {isInactive ? (
                                      <AlertTriangle className="w-5 h-5 text-red-500" />
                                    ) : (
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {labels.lastUsed}: {cat.lastUsedDate 
                                      ? new Date(cat.lastUsedDate).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')
                                      : labels.never}
                                  </div>
                                  <div className={`text-sm font-medium ${isInactive ? 'text-red-600' : 'text-green-600'}`}>
                                    {cat.monthsInactive} {labels.monthsInactive}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Trends Tab */}
              <TabsContent value="trends" className="space-y-6">
                {/* Monthly Programs Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{labels.programsPerMonth}</CardTitle>
                    <CardDescription>{labels.monthlyEmphasis}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyBarData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                                    <p className="font-medium">{d.month}</p>
                                    <p className="text-sm">{labels.programs}: {d.programs}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Emphasis: {d.emphasis}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="programs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Emphasis Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{labels.monthlyEmphasis}</CardTitle>
                        <CardDescription>{labels.emphasisUsage}: {data.emphasisUsageRate}%</CardDescription>
                      </div>
                      <Progress value={data.emphasisUsageRate} className="w-32" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {data.monthlyEmphasisBreakdown.map((item, i) => (
                        <div
                          key={item.month}
                          className={`p-3 rounded-lg border ${
                            item.emphasisKey
                              ? 'bg-primary/5 border-primary/20'
                              : 'bg-muted/30 border-muted'
                          }`}
                        >
                          <div className="font-medium">{monthNames[i]}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.programCount} {labels.programs.toLowerCase()}
                          </div>
                          {item.emphasisKey && (
                            <Badge variant="secondary" className="mt-2">
                              {item.emphasisTitle || item.emphasisKey}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Special Events */}
                {data.specialEventsDetails.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{labels.specialEventsBreakdown}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {data.specialEventsDetails.map((event) => (
                          <div
                            key={event.theme}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full"
                          >
                            <span className="font-medium">
                              {language === 'es' ? event.labelEs : event.labelEn}
                            </span>
                            <Badge>{event.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Series Coverage Tab */}
              <TabsContent value="series" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{labels.seriesCoverage}</CardTitle>
                    <CardDescription>
                      {labels.completionRate}: {data.seriesCompletionRate}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.seriesCoverage.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No sermon series found for this year.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {data.seriesCoverage.map((series) => (
                          <div
                            key={series.seriesId}
                            className="p-4 rounded-lg border bg-muted/20"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-medium">{series.seriesTitle}</h4>
                                {series.theme && (
                                  <Badge variant="outline" className="mt-1">{series.theme}</Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {series.completedWeeks} {labels.of} {series.totalWeeks} {labels.weeks}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Progress value={series.completionRate} className="flex-1" />
                              <span className="text-sm font-medium w-12 text-right">
                                {series.completionRate}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{labels.advisoryInsights}</CardTitle>
                    <CardDescription>
                      Advisory-only recommendations (no auto-adjustments)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.advisoryInsights.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {labels.noInsights}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {data.advisoryInsights.map((insight, i) => (
                          <InsightCard key={i} insight={insight} language={language} labels={labels} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// INSIGHT CARD COMPONENT
// =============================================================================

function InsightCard({
  insight,
  language,
  labels,
}: {
  insight: AdvisoryInsight;
  language: 'en' | 'es';
  labels: Record<string, string>;
}) {
  const getIcon = () => {
    switch (insight.type) {
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (insight.type) {
      case 'WARNING':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'SUCCESS':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const message = language === 'es' ? insight.messageEs : insight.messageEn;
  const suggestion = insight.suggestion
    ? language === 'es'
      ? insight.suggestion.es
      : insight.suggestion.en
    : null;

  return (
    <div className={`p-4 rounded-lg border ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={insight.type === 'WARNING' ? 'destructive' : insight.type === 'SUCCESS' ? 'default' : 'secondary'}>
              {labels[insight.type.toLowerCase()] || insight.type}
            </Badge>
            {insight.percentage !== undefined && (
              <span className="text-sm font-medium">{insight.percentage.toFixed(1)}%</span>
            )}
          </div>
          <p className="text-sm">{message}</p>
          {suggestion && (
            <div className="mt-2 p-2 bg-background/50 rounded border text-sm">
              <span className="font-medium">{labels.suggestion}:</span> {suggestion}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
