'use client';

import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { ProgramEditor } from '@/components/program-editor';
import { ProgramType } from '@/lib/types';

export function NewProgramClient() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const date = searchParams?.get?.('date') ?? '';
  const type = (searchParams?.get?.('type') ?? 'SABBATH') as ProgramType;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t?.createProgram ?? 'Create Program'}
      </h1>
      <ProgramEditor
        initialData={{
          date,
          type,
          items: [],
        }}
      />
    </div>
  );
}
