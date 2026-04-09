import React, { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Rss } from 'lucide-react';
import { NewsFeedItem } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';
const FALLBACK_LOCAL_ITEMS: NewsFeedItem[] = [
  {
    id: 'rss-local-fallback',
    source: 'Black Papers',
    title: 'Flux actualites temporairement indisponible',
    summary: 'Le service d actualites ne repond pas sur cet environnement. Verifiez la configuration API/CORS sur Render.',
    url: '#',
    publishedAt: new Date().toISOString()
  }
];

const formatRelativeTime = (iso: string) => {
  const time = new Date(iso).getTime();
  const diffMs = Date.now() - time;
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  return `${days} j`;
};

export const AutoNewsFeed: React.FC = () => {
  const [items, setItems] = useState<NewsFeedItem[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'live' | 'fallback'>('live');
  const [showAll, setShowAll] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const parseJsonSafe = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  const loadFeed = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/news-feed`);
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        setMode('fallback');
        setItems(FALLBACK_LOCAL_ITEMS);
        setSources([]);
        setLoadError(`API news indisponible (${res.status}).`);
        return;
      }
      if (!Array.isArray(data?.items)) {
        setMode('fallback');
        setItems(FALLBACK_LOCAL_ITEMS);
        setSources([]);
        setLoadError('Reponse API invalide sur /api/news-feed.');
        return;
      }
      setItems(data.items);
      if (Array.isArray(data?.sources)) {
        setSources(data.sources);
      } else {
        setSources([]);
      }
      setMode(data?.mode === 'fallback' ? 'fallback' : 'live');
      setShowAll(false);
    } catch {
      setMode('fallback');
      setItems(FALLBACK_LOCAL_ITEMS);
      setSources([]);
      setLoadError('Impossible de joindre l API news. Verifiez VITE_API_BASE_URL et CORS_ORIGIN sur Render.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const visibleItems = showAll ? items : items.slice(0, 5);

  return (
    <section className="bg-surface border border-gray-800 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-gray-800 bg-[#0d0d0d] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Rss className="text-primary" size={16} />
            <h2 className="text-xl font-bold text-white">Flux actualites auto</h2>
          </div>
          <p className="text-sm text-gray-400">
            Bloomberg, BFM Business, Les Echos, Forbes, Yahoo Finance, Reuters, CNBC, Investing.com, CoinDesk.
          </p>
        </div>
        <button onClick={loadFeed} disabled={loading} className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-5">
          {mode === 'fallback' && (
            <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-full border border-yellow-500/20 text-yellow-300 bg-yellow-500/10">
              Mode secours
            </span>
          )}
          {sources.map((source) => (
            <span key={source} className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-full border border-gray-700 text-gray-400 bg-black/40">
              {source}
            </span>
          ))}
        </div>

        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">
              Aucun article charge pour l instant. Verifie que le backend peut sortir sur internet pour recuperer les flux RSS.
            </div>
          ) : visibleItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-gray-800 rounded-xl p-4 hover:border-primary/40 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="text-xs uppercase tracking-wider text-primary mb-2">{item.source}</div>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                </div>
                <ExternalLink size={16} className="text-gray-600 shrink-0 mt-1" />
              </div>
              {item.summary && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-3">{item.summary}</p>
              )}
              <div className="text-xs font-mono text-gray-500">{formatRelativeTime(item.publishedAt)}</div>
            </a>
          ))}
        </div>
        {items.length > 5 && (
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="mt-4 text-sm px-4 py-2 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
          >
            {showAll ? 'Afficher moins' : `Voir plus (${items.length - 5})`}
          </button>
        )}
        {mode === 'fallback' && (
          <p className="text-xs text-yellow-300/90 mt-4">
            Le backend n a pas pu joindre les flux externes. Le blog affiche actuellement un jeu d articles de secours.
          </p>
        )}
        {loadError && (
          <p className="text-xs text-red-300/90 mt-2">
            {loadError}
          </p>
        )}
      </div>
    </section>
  );
};
