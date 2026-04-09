import React, { useMemo, useState } from 'react';
import { ArrowDownAZ, ArrowUpAZ, Search } from 'lucide-react';
import { Trade } from '../types';

type SortKey = 'actif' | 'entree' | 'sl' | 'tp' | 'heure';
type SortDirection = 'asc' | 'desc';

const formatPrice = (value: number) => {
  if (value >= 1000) return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  if (value >= 10) return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
};

export const DailyTradesTable: React.FC<{ trades: Trade[]; title?: string; subtitle?: string }> = ({ trades, title, subtitle }) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('heure');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);

  const pageSize = 10;

  const filteredTrades = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return trades.filter((trade) => {
      if (!normalizedQuery) return true;
      return [
        trade.actif,
        trade.direction,
        trade.taille,
        trade.raison,
        trade.heure,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [query, trades]);

  const sortedTrades = useMemo(() => {
    const copy = [...filteredTrades];
    copy.sort((a, b) => {
      const order = sortDirection === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'actif':
          return a.actif.localeCompare(b.actif) * order;
        case 'entree':
          return (a.entree - b.entree) * order;
        case 'sl':
          return (a.sl - b.sl) * order;
        case 'tp':
          return (a.tp - b.tp) * order;
        case 'heure':
        default:
          return (new Date(a.heure).getTime() - new Date(b.heure).getTime()) * order;
      }
    });
    return copy;
  }, [filteredTrades, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTrades = sortedTrades.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: SortKey) => {
    setPage(1);
    if (sortKey === key) {
      setSortDirection((prev) => prev === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'heure' ? 'desc' : 'asc');
  };

  const SortButton = ({ label, column }: { label: string; column: SortKey }) => (
    <button onClick={() => handleSort(column)} className="inline-flex items-center gap-1 hover:text-white">
      {label}
      {sortKey === column ? (
        sortDirection === 'asc' ? <ArrowUpAZ size={12} /> : <ArrowDownAZ size={12} />
      ) : null}
    </button>
  );

  return (
    <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 bg-[#0c0c0c] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{title || 'Flux de signaux'}</h3>
          <p className="text-xs text-gray-500">{subtitle || 'Tri, recherche et pagination intégrés.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen((previous) => !previous)}
            className="inline-flex items-center gap-2 bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white"
          >
            <Search size={14} />
            Recherche (optionnelle)
          </button>
          {searchOpen && (
            <label className="flex items-center gap-2 bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400">
              <Search size={14} />
              <input
                value={query}
                onChange={(e) => {
                  setPage(1);
                  setQuery(e.target.value);
                }}
                placeholder="Rechercher un actif, une raison..."
                className="bg-transparent outline-none text-white placeholder:text-gray-600 w-full md:w-72"
              />
            </label>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-[#111] text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3"><SortButton label="Actif" column="actif" /></th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3"><SortButton label="Entree" column="entree" /></th>
              <th className="px-4 py-3"><SortButton label="Stop Loss" column="sl" /></th>
              <th className="px-4 py-3"><SortButton label="Take Profit" column="tp" /></th>
              <th className="px-4 py-3">Taille position</th>
              <th className="px-4 py-3">Raison</th>
              <th className="px-4 py-3"><SortButton label="Heure" column="heure" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {paginatedTrades.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  Aucun signal ne correspond a votre recherche.
                </td>
              </tr>
            ) : paginatedTrades.map((trade, index) => (
              <tr key={`${trade.actif}-${trade.heure}-${index}`} className="hover:bg-white/[0.02]">
                <td className="px-4 py-4 font-bold text-white">{trade.actif}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${trade.direction === 'Long' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {trade.direction}
                  </span>
                </td>
                <td className="px-4 py-4 font-mono text-gray-200">{formatPrice(trade.entree)}</td>
                <td className="px-4 py-4 font-mono text-red-300">{formatPrice(trade.sl)}</td>
                <td className="px-4 py-4 font-mono text-green-300">{formatPrice(trade.tp)}</td>
                <td className="px-4 py-4 text-gray-300">{trade.taille}</td>
                <td className="px-4 py-4">
                  <span
                    title={trade.raison}
                    className="inline-block max-w-[260px] truncate text-gray-300 cursor-help border-b border-dotted border-gray-600"
                  >
                    {trade.raison}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-400 font-mono text-sm">{trade.heure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-800 bg-[#0c0c0c] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-gray-500">
          {sortedTrades.length} signal{sortedTrades.length > 1 ? 's' : ''} au total
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm rounded border border-gray-700 text-gray-300 disabled:opacity-40"
          >
            Precedent
          </button>
          <span className="text-sm text-gray-400">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm rounded border border-gray-700 text-gray-300 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};
