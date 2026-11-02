import { Paper } from '../types';

export async function fetchOpenAlex(query: string, maxResults = 15): Promise<Paper[]> {
  try {
    const mailto = process.env.OPENALEX_MAILTO || 'support@40labs.com';
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(
      query
    )}&mailto=${encodeURIComponent(mailto)}&per-page=${maxResults}`;

    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`OpenAlex fetch failed with status ${res.status}`);
    }

    const data = await res.json();
    const results = data?.results || [];

    return results.map((work: any): Paper => {
      const rawId = work.id || ''; // e.g. https://openalex.org/W2741809807
      const idPart = rawId.replace('https://openalex.org/', '');
      const id = `oa-${idPart}`;

      const title = work.title || 'Untitled Work';
      const doi = work.doi ? work.doi.replace('https://doi.org/', '') : work.ids?.doi?.replace('https://doi.org/', '');
      const journal = work.primary_location?.source?.display_name || work.host_venue?.display_name;
      const publishedAt = work.publication_date ? `${work.publication_date}T00:00:00Z` : new Date().toISOString();

      const authors = (work.authorships || []).map((auth: any) => ({
        name: auth.author?.display_name || 'Unknown Author',
        affiliation: auth.institutions?.[0]?.display_name,
      }));

      const abstract = reconstructAbstract(work.abstract_inverted_index);
      const citedByCount = work.cited_by_count;
      const openAccessUrl = work.open_access?.oa_url || work.primary_location?.landing_page_url;
      const sourceUrl = work.doi || work.id || openAccessUrl || `https://openalex.org/${idPart}`;

      return {
        id,
        doi,
        title,
        authors: authors.length > 0 ? authors : [{ name: 'Unknown Author' }],
        journal,
        publishedAt,
        abstract,
        topics: [query],
        citedByCount,
        openAccessUrl,
        sourceUrl,
        source: 'openalex',
      };
    });
  } catch (error) {
    console.error('OpenAlex fetch error:', error);
    throw error;
  }
}

function reconstructAbstract(invertedIndex: Record<string, number[]> | null | undefined): string | undefined {
  if (!invertedIndex || typeof invertedIndex !== 'object') return undefined;
  const wordPositions: [number, string][] = [];

  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (Array.isArray(positions)) {
      for (const pos of positions) {
        wordPositions.push([pos, word]);
      }
    }
  }

  if (wordPositions.length === 0) return undefined;

  wordPositions.sort((a, b) => a[0] - b[0]);
  return wordPositions.map(([_, word]) => word).join(' ');
}
