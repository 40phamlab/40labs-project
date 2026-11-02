import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPaperById } from '@/lib/research/feed';
import { ReaderShell } from '@/components/reader/ReaderShell';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const paper = await getPaperById(id);

  if (!paper) {
    return {
      title: 'Paper Not Found - Jarida',
      description: 'Scholarly research article not found.',
    };
  }

  const title = `${paper.title} - Jarida`;
  const description = paper.abstract
    ? paper.abstract.substring(0, 160) + '...'
    : `Scholarly article by ${paper.authors.map((a) => a.name).join(', ')}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: paper.publishedAt,
      authors: paper.authors.map((a) => a.name),
    },
  };
}

export default async function PaperReaderPage({ params }: PageProps) {
  const { id } = await params;
  const paper = await getPaperById(id);

  if (!paper) {
    notFound();
  }

  return <ReaderShell paper={paper} />;
}
