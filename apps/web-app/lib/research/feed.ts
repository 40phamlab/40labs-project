import { DEFAULT_TOPICS } from '../../config/board';
import { fetchPubMed } from './sources/pubmed';
import { fetchOpenAlex } from './sources/openalex';
import { fetchEuropePMC } from './sources/europepmc';
import { normalizeAndDedupePapers } from './normalize';
import { FeedQueryParams, FeedResult, Paper, ResearchSource } from './types';

export async function getFeed(params: FeedQueryParams = {}): Promise<FeedResult> {
  const { q, topic, page = 1, pageSize = 12 } = params;
  const degraded: ResearchSource[] = [];

  let queries: string[] = [];
  if (q) {
    queries = [q];
  } else if (topic) {
    queries = [topic];
  } else {
    // Pick 3-4 default topics for standard feed to ensure robust coverage without overloading
    queries = [DEFAULT_TOPICS[0], DEFAULT_TOPICS[1], DEFAULT_TOPICS[2], DEFAULT_TOPICS[4]];
  }

  const allRawPapers: Paper[] = [];

  // Run searches across queries and sources in parallel
  const fetchPromises = queries.map(async (query) => {
    const pubmedPromise = fetchPubMed(query, 10).catch((err) => {
      console.warn(`PubMed query failed for "${query}":`, err);
      if (!degraded.includes('pubmed')) degraded.push('pubmed');
      return [] as Paper[];
    });

    const openAlexPromise = fetchOpenAlex(query, 10).catch((err) => {
      console.warn(`OpenAlex query failed for "${query}":`, err);
      if (!degraded.includes('openalex')) degraded.push('openalex');
      return [] as Paper[];
    });

    const europePMCPromise = fetchEuropePMC(query, 10).catch((err) => {
      console.warn(`Europe PMC query failed for "${query}":`, err);
      if (!degraded.includes('europepmc')) degraded.push('europepmc');
      return [] as Paper[];
    });

    const [pmRes, oaRes, epmcRes] = await Promise.all([pubmedPromise, openAlexPromise, europePMCPromise]);
    return [...pmRes, ...oaRes, ...epmcRes];
  });

  const results = await Promise.all(fetchPromises);
  results.forEach((papers) => allRawPapers.push(...papers));

  const normalized = normalizeAndDedupePapers(allRawPapers);

  // Apply topic filter if specified
  let filtered = normalized;
  if (topic && !q) {
    const lowerTopic = topic.toLowerCase();
    filtered = normalized.filter(
      (p) =>
        p.topics.some((t) => t.toLowerCase().includes(lowerTopic)) ||
        p.title.toLowerCase().includes(lowerTopic) ||
        (p.abstract && p.abstract.toLowerCase().includes(lowerTopic))
    );
  }

  const total = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedPapers = filtered.slice(startIndex, startIndex + pageSize);

  return {
    papers: paginatedPapers,
    total,
    page,
    pageSize,
    degraded: degraded.length > 0 ? degraded : undefined,
  };
}

export async function getPaperById(id: string): Promise<Paper | null> {
  // If we can parse source and source-specific id
  if (id.startsWith('pm-')) {
    const pmid = id.replace('pm-', '');
    const papers = await fetchPubMed(pmid, 1);
    return papers.find((p) => p.id === id) || papers[0] || null;
  } else if (id.startsWith('oa-')) {
    const workId = id.replace('oa-', '');
    const papers = await fetchOpenAlex(workId, 1);
    return papers.find((p) => p.id === id) || papers[0] || null;
  } else if (id.startsWith('epmc-')) {
    const epmcId = id.replace('epmc-', '');
    const papers = await fetchEuropePMC(epmcId, 1);
    return papers.find((p) => p.id === id) || papers[0] || null;
  }

  // Fallback: search across sources
  const feed = await getFeed({ q: id, pageSize: 1 });
  return feed.papers[0] || null;
}
