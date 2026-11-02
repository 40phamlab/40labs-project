import { Paper } from '../types';

export async function fetchEuropePMC(query: string, maxResults = 15): Promise<Paper[]> {
  try {
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
      query
    )}&format=json&pageSize=${maxResults}`;

    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Europe PMC fetch failed with status ${res.status}`);
    }

    const data = await res.json();
    const results = data?.resultList?.result || [];

    return results.map((item: any): Paper => {
      const id = `epmc-${item.id || item.pmid || Math.random().toString(36).substring(7)}`;
      const title = item.title || 'Untitled Paper';
      const doi = item.doi;
      const journal = item.journalTitle || item.bookOrReportDetails?.publisher;
      const publishedAt = item.firstPublicationDate
        ? `${item.firstPublicationDate}T00:00:00Z`
        : item.pubYear
        ? `${item.pubYear}-01-01T00:00:00Z`
        : new Date().toISOString();

      const authors: { name: string; affiliation?: string }[] = [];
      if (item.authorString) {
        item.authorString.split(',').forEach((nameStr: string) => {
          const trimmed = nameStr.trim();
          if (trimmed) authors.push({ name: trimmed });
        });
      }

      const abstract = item.abstractText;
      const citedByCount = item.citedByCount;
      const openAccessUrl = item.isOpenAccess === 'Y' && item.fullTextUrlList?.fullTextUrl?.[0]?.url
        ? item.fullTextUrlList.fullTextUrl[0].url
        : doi
        ? `https://doi.org/${doi}`
        : undefined;

      const sourceUrl = item.pmid
        ? `https://europepmc.org/article/MED/${item.pmid}`
        : doi
        ? `https://doi.org/${doi}`
        : `https://europepmc.org/article/PMC/${item.id}`;

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
        source: 'europepmc',
      };
    });
  } catch (error) {
    console.error('Europe PMC fetch error:', error);
    throw error;
  }
}
