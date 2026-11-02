export type ResearchSource = 'pubmed' | 'openalex' | 'europepmc';

export interface Author {
  name: string;
  affiliation?: string;
}

export interface Paper {
  id: string; // pm-<pmid> | oa-<W...> | epmc-<id>
  doi?: string;
  title: string;
  authors: Author[];
  journal?: string;
  publishedAt: string; // ISO
  abstract?: string;
  topics: string[];
  citedByCount?: number;
  openAccessUrl?: string;
  sourceUrl: string;
  source: ResearchSource;
}

export interface FeedQueryParams {
  q?: string;
  topic?: string;
  page?: number;
  pageSize?: number;
}

export interface FeedResult {
  papers: Paper[];
  total: number;
  page: number;
  pageSize: number;
  degraded?: ResearchSource[];
}
