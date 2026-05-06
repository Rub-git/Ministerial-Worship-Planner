import { redirect } from 'next/navigation';

// This page redirects to the PDF API endpoint
export default function PreviewPage({ params }: { params: { id: string } }) {
  redirect(`/api/export/pdf/preview/${params.id}`);
}
