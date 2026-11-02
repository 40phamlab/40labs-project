import { Paper } from '../types';

export async function fetchPubMed(query: string, maxResults = 15): Promise<Paper[]> {
  try {
    const email = process.env.PUBMED_EMAIL || 'support@40labs.com';
    const apiKey = process.env.PUBMED_API_KEY;
    const apiKeyParam = apiKey ? `&api_key=${apiKey}` : '';

    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      query
    )}&retmode=json&retmax=${maxResults}&tool=jarida-board&email=${encodeURIComponent(email)}${apiKeyParam}`;

    const searchRes = await fetch(searchUrl, {
      next: { revalidate: 3600 },
    });

    if (!searchRes.ok) {
      throw new Error(`PubMed esearch failed with status ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    const idList: string[] = searchData?.esearchresult?.idlist || [];

    if (idList.length === 0) {
      return [];
    }

    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${idList.join(
      ','
    )}&retmode=xml&tool=jarida-board&email=${encodeURIComponent(email)}${apiKeyParam}`;

    const fetchRes = await fetch(fetchUrl, {
      next: { revalidate: 3600 },
    });

    if (!fetchRes.ok) {
      throw new Error(`PubMed efetch failed with status ${fetchRes.status}`);
    }

    const xmlText = await fetchRes.text();
    return parsePubMedXml(xmlText, query);
  } catch (error) {
    console.error('PubMed fetch error:', error);
    throw error;
  }
}

function parsePubMedXml(xml: string, query: string): Paper[] {
  const papers: Paper[] = [];
  const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
  let match;

  while ((match = articleRegex.exec(xml)) !== null) {
    const articleXml = match[1];

    const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    const pmid = pmidMatch ? pmidMatch[1] : '';
    if (!pmid) continue;

    const titleMatch = articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
    const title = titleMatch ? cleanXml(titleMatch[1]) : 'Untitled Paper';

    const doiMatch = articleXml.match(/<ELocationID[^>]*EIdType="doi"[^>]*>([\s\S]*?)<\/ELocationID>/) ||
      articleXml.match(/<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/);
    const doi = doiMatch ? cleanXml(doiMatch[1]) : undefined;

    const journalMatch = articleXml.match(/<Journal\b[^>]*>[\s\S]*?<Title>([\s\S]*?)<\/Title>/);
    const journal = journalMatch ? cleanXml(journalMatch[1]) : undefined;

    // Authors
    const authors: { name: string; affiliation?: string }[] = [];
    const authorRegex = /<Author\b[^>]*>([\s\S]*?)<\/Author>/g;
    let authMatch;
    while ((authMatch = authorRegex.exec(articleXml)) !== null) {
      const authXml = authMatch[1];
      const lastName = authXml.match(/<LastName>([\s\S]*?)<\/LastName>/)?.[1];
      const foreName = authXml.match(/<ForeName>([\s\S]*?)<\/ForeName>/)?.[1];
      const collectiveName = authXml.match(/<CollectiveName>([\s\S]*?)<\/CollectiveName>/)?.[1];

      let name = '';
      if (lastName && foreName) {
        name = `${foreName} ${lastName}`;
      } else if (lastName) {
        name = lastName;
      } else if (collectiveName) {
        name = cleanXml(collectiveName);
      }

      if (name) {
        const affMatch = authXml.match(/<Affiliation>([\s\S]*?)<\/Affiliation>/);
        const affiliation = affMatch ? cleanXml(affMatch[1]) : undefined;
        authors.push({ name: cleanXml(name), affiliation });
      }
    }

    // Abstract
    const abstractMatch = articleXml.match(/<Abstract>([\s\S]*?)<\/Abstract>/);
    let abstract: string | undefined = undefined;
    if (abstractMatch) {
      const absTexts: string[] = [];
      const absTextRegex = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g;
      let absMatch;
      while ((absMatch = absTextRegex.exec(abstractMatch[1])) !== null) {
        absTexts.push(cleanXml(absMatch[1]));
      }
      if (absTexts.length > 0) {
        abstract = absTexts.join(' ');
      } else {
        abstract = cleanXml(abstractMatch[1]);
      }
    }

    // Publication Date
    const year = articleXml.match(/<PubDate>\s*<Year>(\d{4})<\/Year>/)?.[1] || new Date().getFullYear().toString();
    const month = articleXml.match(/<PubDate>\s*<Month>([A-Za-z0-9]+)<\/Month>/)?.[1] || '01';
    const day = articleXml.match(/<PubDate>\s*<Day>(\d+)<\/Day>/)?.[1] || '01';
    let publishedAt = `${year}-01-01T00:00:00Z`;
    try {
      const parsedDate = new Date(`${month} ${day}, ${year}`);
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.toISOString();
      }
    } catch {
      publishedAt = `${year}-01-01T00:00:00Z`;
    }

    papers.push({
      id: `pm-${pmid}`,
      doi,
      title,
      authors: authors.length > 0 ? authors : [{ name: 'Unknown Author' }],
      journal,
      publishedAt,
      abstract,
      topics: [query],
      sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}`,
      openAccessUrl: doi ? `https://doi.org/${doi}` : undefined,
      source: 'pubmed',
    });
  }

  return papers;
}

function cleanXml(str: string): string {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}
