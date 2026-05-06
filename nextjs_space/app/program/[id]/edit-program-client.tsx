'use client';

import { useLanguage } from '@/lib/language-context';
import { ProgramEditor } from '@/components/program-editor';
import { ProgramType, ProgramBlock } from '@/lib/types';

interface EditProgramClientProps {
  programId: string;
  initialData: {
    date: string;
    type: ProgramType;
    items: any[];
  };
}

export function EditProgramClient({ programId, initialData }: EditProgramClientProps) {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t?.editProgram ?? 'Edit Program'}
      </h1>
      <ProgramEditor programId={programId} initialData={initialData} />
    </div>
  );
}
