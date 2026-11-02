import React, { Suspense } from 'react';
import { getFeed } from '@/lib/research/feed';
import { BoardHeader } from '@/components/board/BoardHeader';
import { BoardClientView } from '@/components/board/BoardClientView';
import { Paper, ResearchSource } from '@/lib/research/types';

export const revalidate = 300;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; topic?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q;
  const topic = resolvedSearchParams.topic;

  let initialPapers: Paper[] = [];
  let initialTotal = 0;
  let initialDegraded: ResearchSource[] | undefined = undefined;

  try {
    const feed = await getFeed({ q, topic, pageSize: 12 });
    initialPapers = feed.papers;
    initialTotal = feed.total;
    initialDegraded = feed.degraded;
  } catch (err) {
    console.error('Failed to fetch initial board feed:', err);
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 text-[#F8FAFB]">
      <BoardHeader />
      <Suspense fallback={<div className="py-12 text-center text-gray-500">Loading Jarida...</div>}>
        <BoardClientView
          initialPapers={initialPapers}
          initialTotal={initialTotal}
          initialDegraded={initialDegraded}
        />
      </Suspense>
    </div>
  );
}
