import { Paper } from './types';

export function normalizeAndDedupePapers(papers: Paper[]): Paper[] {
  const map = new Map<string, Paper>();

  for (const paper of papers) {
    const doiKey = paper.doi ? normalizeDoi(paper.doi) : undefined;
    const titleKey = normalizeTitle(paper.title);
    const key = doiKey || titleKey;

    if (!key) {
      map.set(paper.id, paper);
      continue;
    }

    if (!map.has(key)) {
      map.set(key, paper);
    } else {
      const existing = map.get(key)!;
      const scoreExisting = getPaperScore(existing);
      const scoreIncoming = getPaperScore(paper);

      if (scoreIncoming > scoreExisting) {
        // Merge topics or preserve existing unique properties
        const mergedTopics = Array.from(new Set([...existing.topics, ...paper.topics]));
        map.set(key, { ...paper, topics: mergedTopics });
      } else {
        const mergedTopics = Array.from(new Set([...existing.topics, ...paper.topics]));
        map.set(key, { ...existing, topics: mergedTopics });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.publishedAt).getTime();
    const timeB = new Date(b.publishedAt).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });
}

function normalizeDoi(doi: string): string {
  return doi.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').trim();
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPaperScore(paper: Paper): number {
  let score = 0;
  if (paper.abstract && paper.abstract.length > 50) score += 3;
  if (paper.openAccessUrl) score += 2;
  if (paper.doi) score += 2;
  if (paper.citedByCount && paper.citedByCount > 0) score += 1;
  if (paper.journal) score += 1;
  return score;
}
