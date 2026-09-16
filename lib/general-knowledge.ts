export type KnowledgeSource = {
  title: string;
  url: string;
  type: 'Wikipedia' | 'MAME oficial';
  content: string;
};

type WikiPage = {
  pageid?: number;
  title?: string;
  extract?: string;
  fullurl?: string;
};

type WikiResponse = {
  query?: { pages?: Record<string, WikiPage> };
};

function clean(value = ''): string {
  return value.replace(/\s+/g, ' ').trim();
}

async function wikipediaSearch(query: string, lang: 'es' | 'en'): Promise<KnowledgeSource[]> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query.slice(0, 180),
      gsrlimit: '3',
      prop: 'extracts|info',
      exintro: '1',
      explaintext: '1',
      inprop: 'url',
      format: 'json',
      origin: '*'
    });
    const response = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params.toString()}`, {
      headers: { 'User-Agent': 'ArcadeEnCasaExpert/1.0 (https://arcadeencasa.es)' },
      next: { revalidate: 86400 }
    });
    if (!response.ok) return [];
    const data = (await response.json()) as WikiResponse;
    const pages = Object.values(data.query?.pages || {});
    return pages
      .filter(page => page.title && page.extract && page.fullurl)
      .map(page => ({
        title: page.title || 'Wikipedia',
        url: page.fullurl || `https://${lang}.wikipedia.org`,
        type: 'Wikipedia' as const,
        content: clean(page.extract || '').slice(0, 1500)
      }));
  } catch {
    return [];
  }
}

async function fetchMameOfficial(): Promise<KnowledgeSource[]> {
  const urls = [
    ['Qué es MAME', 'https://docs.mamedev.org/whatis.html'],
    ['ROMs y sets en MAME', 'https://docs.mamedev.org/usingmame/aboutromsets.html']
  ] as const;

  const sources: KnowledgeSource[] = [];
  for (const [title, url] of urls) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'ArcadeEnCasaExpert/1.0 (https://arcadeencasa.es)' },
        next: { revalidate: 86400 }
      });
      if (!response.ok) continue;
      const html = await response.text();
      const text = clean(
        html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
      ).slice(0, 2200);
      if (text) sources.push({ title, url, type: 'MAME oficial', content: text });
    } catch {
      // Keep the knowledge layer resilient if an external source is temporarily unavailable.
    }
  }
  return sources;
}

export async function retrieveGeneralArcadeKnowledge(query: string): Promise<{
  sources: KnowledgeSource[];
  context: string;
}> {
  const normalized = query.toLowerCase();
  const isMame = /(mame|rom|roms|emulador|emulaci[oó]n|jamma|bios|chd|frontend|retroarch)/i.test(normalized);

  let wiki = await wikipediaSearch(query, 'es');
  if (!wiki.length) wiki = await wikipediaSearch(query, 'en');

  const mame = isMame ? await fetchMameOfficial() : [];
  const sources = [...mame.slice(0, 2), ...wiki.slice(0, 3)];
  const context = sources
    .map(source => `[${source.type}] ${source.title}\nURL: ${source.url}\n${source.content}`)
    .join('\n\n---\n\n')
    .slice(0, 6500);

  return { sources, context };
}
