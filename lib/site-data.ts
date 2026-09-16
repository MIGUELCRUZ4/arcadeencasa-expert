export type SiteSource = {
  title: string;
  url: string;
  type: 'ArcadeEnCasa' | 'Tienda';
  content: string;
};

export type ProductCard = {
  name: string;
  url: string;
  price?: string;
  image?: string;
  category?: string;
};

type WpIndexItem = {
  id: number;
  link: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
};

type WooProduct = {
  id: number;
  name: string;
  permalink: string;
  short_description?: string;
  description?: string;
  categories?: Array<{ name: string }>;
  images?: Array<{ src: string }>;
  prices?: {
    price?: string;
    currency_code?: string;
    currency_minor_unit?: number;
  };
};

const SITE = 'https://arcadeencasa.es';
const STOPWORDS = new Set([
  'que', 'qué', 'como', 'cómo', 'cual', 'cuál', 'para', 'por', 'con', 'sin',
  'una', 'uno', 'unos', 'unas', 'del', 'las', 'los', 'este', 'esta', 'esto',
  'ese', 'esa', 'quiero', 'necesito', 'dime', 'sobre', 'entre', 'mejor', 'mejores',
  'puedo', 'tengo', 'hay', 'the', 'and', 'for', 'with', 'from', 'what', 'which'
]);

let cache: {
  expires: number;
  posts: WpIndexItem[];
  pages: WpIndexItem[];
  products: WooProduct[];
} | null = null;

function stripHtml(value = ''): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9+.-]+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word))
    .slice(0, 14);
}

function relevance(query: string, title: string, body: string): number {
  const words = tokenize(query);
  const titleLower = title.toLowerCase();
  const bodyLower = body.toLowerCase();
  let score = 0;

  for (const word of words) {
    if (titleLower.includes(word)) score += 8;
    if (bodyLower.includes(word)) score += 2;
  }

  const exact = query.toLowerCase().trim();
  if (exact.length > 4 && titleLower.includes(exact)) score += 20;
  return score;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 }
  });
  if (!response.ok) throw new Error(`ArcadeEnCasa API ${response.status}`);
  return response.json() as Promise<T>;
}

async function getIndex() {
  if (cache && cache.expires > Date.now()) return cache;

  const [posts, pages, products] = await Promise.all([
    getJson<WpIndexItem[]>(`${SITE}/wp-json/wp/v2/posts?per_page=100&status=publish&_fields=id,link,title,excerpt`),
    getJson<WpIndexItem[]>(`${SITE}/wp-json/wp/v2/pages?per_page=100&status=publish&_fields=id,link,title,excerpt`),
    getJson<WooProduct[]>(`${SITE}/wp-json/wc/store/v1/products?per_page=100&page=1`)
  ]);

  cache = { expires: Date.now() + 5 * 60_000, posts, pages, products };
  return cache;
}

async function getFullContent(kind: 'posts' | 'pages', id: number): Promise<string> {
  try {
    const item = await getJson<{ content?: { rendered?: string } }>(
      `${SITE}/wp-json/wp/v2/${kind}/${id}?_fields=content`
    );
    return stripHtml(item.content?.rendered || '').slice(0, 2600);
  } catch {
    return '';
  }
}

function formatPrice(product: WooProduct): string | undefined {
  const raw = product.prices?.price;
  if (!raw) return undefined;
  const minor = product.prices?.currency_minor_unit ?? 2;
  const amount = Number(raw) / Math.pow(10, minor);
  if (!Number.isFinite(amount)) return undefined;

  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: product.prices?.currency_code || 'EUR'
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} EUR`;
  }
}

export async function retrieveArcadeEnCasa(query: string): Promise<{
  sources: SiteSource[];
  products: ProductCard[];
  context: string;
}> {
  const { posts, pages, products } = await getIndex();

  const rankedPosts = posts
    .map(item => ({
      item,
      score: relevance(query, stripHtml(item.title?.rendered || ''), stripHtml(item.excerpt?.rendered || ''))
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const rankedPages = pages
    .map(item => ({
      item,
      score: relevance(query, stripHtml(item.title?.rendered || ''), stripHtml(item.excerpt?.rendered || ''))
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 1);

  const rankedProducts = products
    .map(item => ({
      item,
      score: relevance(
        query,
        stripHtml(item.name || ''),
        `${stripHtml(item.short_description || item.description || '')} ${(item.categories || []).map(c => c.name).join(' ')}`
      )
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const articleSources = await Promise.all(
    rankedPosts.slice(0, 2).map(async ({ item }) => ({
      title: stripHtml(item.title?.rendered || ''),
      url: item.link,
      type: 'ArcadeEnCasa' as const,
      content: await getFullContent('posts', item.id)
    }))
  );

  const pageSources = await Promise.all(
    rankedPages.slice(0, 1).map(async ({ item }) => ({
      title: stripHtml(item.title?.rendered || ''),
      url: item.link,
      type: 'ArcadeEnCasa' as const,
      content: await getFullContent('pages', item.id)
    }))
  );

  const productCards: ProductCard[] = rankedProducts.slice(0, 3).map(({ item }) => ({
    name: stripHtml(item.name),
    url: item.permalink,
    price: formatPrice(item),
    image: item.images?.[0]?.src,
    category: item.categories?.[0]?.name
  }));

  const productSources: SiteSource[] = rankedProducts.slice(0, 3).map(({ item }) => ({
    title: stripHtml(item.name),
    url: item.permalink,
    type: 'Tienda' as const,
    content: [
      `Precio mostrado en ArcadeEnCasa: ${formatPrice(item) || 'no verificado'}.`,
      `Categorías: ${(item.categories || []).map(c => c.name).join(', ') || 'sin categoría'}.`,
      stripHtml(item.short_description || item.description || '').slice(0, 700)
    ].join(' ')
  }));

  const sources = [...articleSources, ...pageSources, ...productSources];
  const context = sources
    .map(source => `[${source.type}] ${source.title}\nURL: ${source.url}\n${source.content}`)
    .join('\n\n---\n\n')
    .slice(0, 9000);

  return { sources, products: productCards, context };
}
