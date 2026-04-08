import React, { useEffect, useMemo, useState } from 'react';
import { Copy, LineChart, TrendingDown, TrendingUp } from 'lucide-react';
import { Trade } from '../types';

const formatPrice = (value: number) => {
  if (value >= 1000) return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  if (value >= 10) return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
};

export const TradeCard: React.FC<{ trade: Trade }> = ({ trade }) => {
  const baseMove = useMemo(() => {
    const range = Math.abs(trade.tp - trade.sl) || trade.entree * 0.01;
    return trade.direction === 'Long' ? range * 0.12 : range * -0.12;
  }, [trade.direction, trade.entree, trade.sl, trade.tp]);
  const [livePnl, setLivePnl] = useState(baseMove);

  useEffect(() => {
    setLivePnl(baseMove);
    const interval = window.setInterval(() => {
      setLivePnl((prev) => {
        const drift = (Math.random() - 0.5) * Math.abs(baseMove || 1) * 0.35;
        return prev + drift;
      });
    }, 2500);
    return () => window.clearInterval(interval);
  }, [baseMove]);

  const livePrice = trade.entree + livePnl;
  const livePercent = ((livePrice - trade.entree) / trade.entree) * 100 * (trade.direction === 'Long' ? 1 : -1);
  const positive = livePercent >= 0;

  const handleCopy = async () => {
    const payload = [
      `Actif: ${trade.actif}`,
      `Direction: ${trade.direction}`,
      `Entree: ${formatPrice(trade.entree)}`,
      `Stop Loss: ${formatPrice(trade.sl)}`,
      `Take Profit: ${formatPrice(trade.tp)}`,
      `Taille: ${trade.taille}`,
      `Raison: ${trade.raison}`,
      `Heure: ${trade.heure}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // Ignore clipboard errors in unsupported environments.
    }
  };

  return (
    <article className="bg-surface border border-gray-800 rounded-2xl overflow-hidden">
      <div className="relative">
        <img
          src={`https://placehold.co/1200x700/0c0c0c/00ff9d?text=${encodeURIComponent(`TradingView ${trade.actif}`)}`}
          alt={`Screenshot graphique ${trade.actif}`}
          className="w-full h-52 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-xs font-bold text-white">
          <LineChart size={12} />
          Setup salle de marche
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{trade.actif}</h3>
            <p className="text-sm text-gray-400">{trade.heure}</p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border ${trade.direction === 'Long' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {trade.direction === 'Long' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trade.direction}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="rounded-xl border border-gray-800 bg-black/40 p-3">
            <div className="text-gray-500 mb-1">Entree</div>
            <div className="font-mono text-white">{formatPrice(trade.entree)}</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-black/40 p-3">
            <div className="text-gray-500 mb-1">Taille position</div>
            <div className="font-mono text-white">{trade.taille}</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-black/40 p-3">
            <div className="text-gray-500 mb-1">Stop Loss</div>
            <div className="font-mono text-red-300">{formatPrice(trade.sl)}</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-black/40 p-3">
            <div className="text-gray-500 mb-1">Take Profit</div>
            <div className="font-mono text-green-300">{formatPrice(trade.tp)}</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-black/40 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">P&L live simulé</span>
            <span className={`text-sm font-bold ${positive ? 'text-green-400' : 'text-red-400'}`}>
              {positive ? '+' : ''}{livePercent.toFixed(2)}%
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-white mb-2">{formatPrice(livePrice)}</div>
          <div className="h-2 rounded-full bg-[#111] overflow-hidden border border-gray-800">
            <div
              className={`h-full ${positive ? 'bg-green-500' : 'bg-red-500'} transition-all duration-700`}
              style={{ width: `${Math.min(100, Math.max(8, Math.abs(livePercent) * 10))}%` }}
            />
          </div>
        </div>

        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Raison</div>
          <p className="text-sm text-gray-300">{trade.raison}</p>
        </div>

        <button
          onClick={handleCopy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black font-bold py-3 hover:bg-gray-200 transition-colors"
        >
          <Copy size={16} />
          Copier signal
        </button>
      </div>
    </article>
  );
};
