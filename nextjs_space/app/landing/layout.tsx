import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ministerial Worship Planner – Structured Christian Worship Planning',
  description: 'A denomination-aware worship planning system designed to bring structure, balance, and pastoral clarity to Christian churches. Start your 30-day free trial.',
  openGraph: {
    title: 'Ministerial Worship Planner – Structured Christian Worship Planning',
    description: 'A denomination-aware worship planning system designed to bring structure, balance, and pastoral clarity to Christian churches.',
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
