'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Paper, ResearchSource } from '@/lib/research/types';

export function useBoardSearch(initialPapers: Paper[], initialTotal: number, initialDegraded?: ResearchSource[]) {
  const searchParams = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const topicParam = searchParams.get('topic') || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedTopic, setSelectedTopic] = useState(topicParam);
  const [papers, setPapers] = useState<Paper[]>(initialPapers);
  const [total, setTotal] = useState(initialTotal);
  const [degraded, setDegraded] = useState<ResearchSource[] | undefined>(initialDegraded);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPapers.length < initialTotal);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedTopic(searchParams.get('topic') || '');
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedTopic && !searchQuery) params.set('topic', selectedTopic);
        params.set('page', '1');
        params.set('pageSize', '12');

        const res = await fetch(`/api/research?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setPapers(data.papers || []);
          setTotal(data.total || 0);
          setDegraded(data.degraded);
          setPage(1);
          setHasMore((data.papers || []).length < (data.total || 0));
        }
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery, selectedTopic]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedTopic && !searchQuery) params.set('topic', selectedTopic);
      params.set('page', nextPage.toString());
      params.set('pageSize', '12');

      const res = await fetch(`/api/research?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newPapers = [...papers, ...(data.papers || [])];
        setPapers(newPapers);
        setPage(nextPage);
        setHasMore(newPapers.length < (data.total || 0));
      }
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q) setSelectedTopic('');
  };

  const handleTopicSelect = (topic: string) => {
    const newTopic = selectedTopic === topic ? '' : topic;
    setSelectedTopic(newTopic);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedTopic('');
  };

  return {
    searchQuery,
    selectedTopic,
    papers,
    total,
    degraded,
    loading,
    hasMore,
    handleSearchChange,
    handleTopicSelect,
    clearSearch,
    loadMore,
  };
}
