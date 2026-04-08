import { MarketNews, Post, InsiderSnippet, Tweet, ExternalRSSNews, NewsFeedItem } from "../types";

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';
const MAX_CONTEXT_LENGTH = 500;
const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

const sanitizeAIContext = (raw: string): string => {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CONTEXT_LENGTH);
};

const FALLBACK_NEWS: MarketNews[] = [
  {
    id: 'fallback-1',
    title: 'Flux marche indisponible',
    summary: 'Le backend ne peut pas recuperer les actualites externes pour le moment.',
    source: 'Black Papers',
    timestamp: new Date().toISOString(),
    sentiment: 'neutral'
  }
];

const MOCK_RSS: ExternalRSSNews[] = [
  { id: 'r1', source: 'Black Papers', title: 'Flux RSS indisponible temporairement', url: '#', timeAgo: "A l'instant" },
];

const toTimeAgo = (publishedAt: string): string => {
  const ts = new Date(publishedAt).getTime();
  if (!Number.isFinite(ts)) return 'A l instant';
  const deltaMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (deltaMin < 1) return 'A l instant';
  if (deltaMin < 60) return `${deltaMin} min`;
  const deltaHours = Math.round(deltaMin / 60);
  return `${deltaHours}h`;
};

const mapNewsFeedItem = (item: NewsFeedItem, index: number): ExternalRSSNews => ({
  id: item?.id || `rss-${index}`,
  source: item?.source || 'Flux externe',
  title: item?.title || 'Article',
  url: item?.url || '#',
  timeAgo: toTimeAgo(item?.publishedAt || new Date().toISOString())
});

const inferSentiment = (headline: string): MarketNews['sentiment'] => {
  const text = headline.toLowerCase();
  if (/(surge|rally|gain|hausse|record|bull|rebond)/.test(text)) return 'bullish';
  if (/(drop|selloff|baisse|bear|chute|plunge|risk-off)/.test(text)) return 'bearish';
  return 'neutral';
};

export const fetchMarketAnalysis = async (): Promise<MarketNews[]> => {
  try {
    const res = await fetch(buildApiUrl('/api/news-feed'));
    const data = await res.json();
    if (!res.ok || !Array.isArray(data?.items)) return FALLBACK_NEWS;
    const mapped = data.items.slice(0, 6).map((item: NewsFeedItem, index: number) => ({
      id: item.id || `news-${index}`,
      title: item.title || 'Actualite',
      summary: item.summary || item.title || 'Resume indisponible.',
      source: item.source || 'Flux',
      timestamp: item.publishedAt || new Date().toISOString(),
      sentiment: inferSentiment(item.title || '')
    }));
    return mapped.length ? mapped : FALLBACK_NEWS;
  } catch {
    return FALLBACK_NEWS;
  }
};

export const fetchInsiderIntel = async (): Promise<InsiderSnippet[]> => {
  try {
    const res = await fetch(buildApiUrl('/api/news-feed'));
    const data = await res.json();
    if (!res.ok || !Array.isArray(data?.items)) return [];
    return data.items.slice(0, 8).map((item: NewsFeedItem, index: number) => ({
      id: item.id || `intel-${index}`,
      source: (item.source || 'REUTERS').toUpperCase().includes('BLOOMBERG') ? 'BLOOMBERG' : 'REUTERS',
      text: item.title || 'Headline indisponible',
      timestamp: toTimeAgo(item.publishedAt || new Date().toISOString()),
      impact: inferSentiment(item.title || '') === 'neutral' ? 'LOW' : 'MEDIUM'
    }));
  } catch {
    return [];
  }
};

export const generateAIContent = async (type: 'BLOG' | 'TRADE', context: string): Promise<Partial<Post> | null> => {
  const safeContext = sanitizeAIContext(context);
  if (!safeContext) return null;

  const isTrade = type === 'TRADE';
  return {
    title: isTrade ? `Signal en revue: ${safeContext.slice(0, 64)}` : `Analyse: ${safeContext.slice(0, 64)}`,
    excerpt: isTrade
      ? 'Mode securise actif: generation locale sans appel IA externe cote client.'
      : 'Mode securise actif: brouillon local genere sans exposer de secret fournisseur.',
    content: [
      'Generation IA cote navigateur desactivee pour raisons de securite.',
      `Sujet fourni: ${safeContext}`,
      'Pour re-activer une IA reelle: implementer un endpoint serveur signe, audite et limite.'
    ].join('\n\n'),
    tags: isTrade ? ['SECURE_MODE', 'TRADE_DRAFT'] : ['SECURE_MODE', 'BLOG_DRAFT']
  };
};

export const fetchCryptoTweets = async (): Promise<Tweet[]> => {
  return [];
};

export const fetchExternalRSS = async (): Promise<ExternalRSSNews[]> => {
  try {
    const res = await fetch(buildApiUrl('/api/news-feed'));
    const data = await res.json();
    if (!res.ok || !Array.isArray(data?.items)) return MOCK_RSS;
    return data.items.map(mapNewsFeedItem).slice(0, 8);
  } catch {
    return MOCK_RSS;
  }
};
