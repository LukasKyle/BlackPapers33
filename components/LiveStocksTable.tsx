import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownAZ, ArrowUpAZ, Search, Activity } from 'lucide-react';
import { StockQuote } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

type SortKey = 'symbol' | 'price' | 'changePercent' | 'volume' | 'marketCap';
type SortDirection = 'asc' | 'desc';

const FALLBACK_QUOTES: StockQuote[] = [
  { symbol: 'AAPL', name: 'Apple', price: 214.38, change: 2.14, changePercent: 1.01, volume: '58.4M', marketCap: '3.2T', sparkline: [206, 208, 207, 210, 211, 213, 214] },
  { symbol: 'MSFT', name: 'Microsoft', price: 468.22, change: 4.35, changePercent: 0.94, volume: '21.7M', marketCap: '3.5T', sparkline: [454, 456, 458, 460, 463, 466, 468] },
  { symbol: 'NVDA', name: 'NVIDIA', price: 142.91, change: -1.74, changePercent: -1.20, volume: '132.8M', marketCap: '3.4T', sparkline: [148, 147, 146, 145, 144, 143, 142] },
  { symbol: 'AMZN', name: 'Amazon', price: 201.44, change: 1.89, changePercent: 0.95, volume: '39.5M', marketCap: '2.1T', sparkline: [195, 196, 197, 198, 199, 200, 201] },
];

const formatCurrency = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const parseCompactNumber = (value: string) => {
  const normalized = value.trim().toUpperCase();
  const suffix = normalized.slice(-1);
  const numeric = Number(normalized.replace(/[^0-9.]/g, ''));
  if (suffix === 'T') return numeric * 1_000_000_000_000;
  if (suffix === 'B') return numeric * 1_000_000_000;
  if (suffix === 'M') return numeric * 1_000_000;
  return numeric;
};

export const LiveStocksTable: React.FC = () => {
  const [quotes, setQuotes] = useState<StockQuote[]>(FALLBACK_QUOTES);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [mode, setMode] = useState<'live' | 'fallback' | 'partial'>('fallback');
  const [source, setSource] = useState<string>('static_fallback');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/stocks`);
        const data = await res.json();
        if (!mounted || !res.ok || !Array.isArray(data?.quotes)) return;
        setQuotes(data.quotes);
        setUpdatedAt(data?.updatedAt || new Date().toISOString());
        setMode(data?.mode === 'live' ? 'live' : data?.mode === 'partial' ? 'partial' : 'fallback');
        setSource(typeof data?.source === 'string' ? data.source : 'unknown');
      } catch {
        if (!mounted) return;
        setQuotes(FALLBACK_QUOTES);
        setMode('fallback');
        setSource('static_fallback');
      }
    };

    load();
    const interval = window.setInterval(load, 30000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const filteredQuotes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (!normalized) return true;
      return quote.symbol.toLowerCase().includes(normalized) || quote.name.toLowerCase().includes(normalized);
    });
  }, [query, quotes]);

  const sortedQuotes = useMemo(() => {
    const copy = [...filteredQuotes];
    copy.sort((a, b) => {
      const order = sortDirection === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'symbol':
          return a.symbol.localeCompare(b.symbol) * order;
        case 'price':
          return (a.price - b.price) * order;
        case 'changePercent':
          return (a.changePercent - b.changePercent) * order;
        case 'volume':
          return (parseCompactNumber(a.volume) - parseCompactNumber(b.volume)) * order;
        case 'marketCap':
        default:
          return (parseCompactNumber(a.marketCap) - parseCompactNumber(b.marketCap)) * order;
      }
    });
    return copy;
  }, [filteredQuotes, sortDirection, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => prev === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'symbol' ? 'asc' : 'desc');
  };

  const SortLabel = ({ column, children }: { column: SortKey; children: React.ReactNode }) => (
    <button onClick={() => toggleSort(column)} className="inline-flex items-center gap-1 hover:text-white">
      {children}
      {sortKey === column ? (sortDirection === 'asc' ? <ArrowUpAZ size={12} /> : <ArrowDownAZ size={12} />) : null}
    </button>
  );

  return (
    <section className="bg-surface border border-gray-800 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-gray-800 bg-[#0d0d0d] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="text-primary" size={16} />
            <h2 className="text-xl font-bold text-white">Cours des actions</h2>
          </div>
          <p className="text-sm text-gray-400">
            Tableau style finance avec recherche, tri et variation.
          </p>
        </div>
        <label className="flex items-center gap-2 bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une action..."
            className="bg-transparent outline-none text-white placeholder:text-gray-600 w-full md:w-64"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-[#111] text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3"><SortLabel column="symbol">Symbole</SortLabel></th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3"><SortLabel column="price">Prix</SortLabel></th>
              <th className="px-4 py-3"><SortLabel column="changePercent">Variation</SortLabel></th>
              <th className="px-4 py-3"><SortLabel column="volume">Volume</SortLabel></th>
              <th className="px-4 py-3"><SortLabel column="marketCap">Market Cap</SortLabel></th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedQuotes.map((quote) => {
              const positive = quote.change >= 0;
              return (
                <tr key={quote.symbol} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-4 font-bold text-white">{quote.symbol}</td>
                  <td className="px-4 py-4 text-gray-300">{quote.name}</td>
                  <td className="px-4 py-4 font-mono text-white">{formatCurrency(quote.price)}</td>
                  <td className="px-4 py-4">
                    <div className={`font-bold ${positive ? 'text-green-400' : 'text-red-400'}`}>
                      {positive ? '+' : ''}{quote.change.toFixed(2)} ({positive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-300">{quote.volume}</td>
                  <td className="px-4 py-4 text-gray-300">{quote.marketCap}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border ${
                      mode === 'live'
                        ? 'border-primary/20 bg-primary/10 text-primary'
                        : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                    }`}>
                      {mode === 'live' ? 'Live' : 'Fallback'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-800 bg-[#0d0d0d] text-xs text-gray-500">
        Mise a jour auto toutes les 30 secondes{updatedAt ? ` • Derniere maj ${new Date(updatedAt).toLocaleTimeString('fr-FR')}` : ''} • Source: {source}.
      </div>
    </section>
  );
};
