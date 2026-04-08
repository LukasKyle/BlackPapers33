import { useEffect, useState } from 'react';
import { Trade } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

const FALLBACK_MARKET_ANALYSIS = `## Biais du jour

- Dollar en leger recul, ce qui soutient les actifs a risque.
- Le flux reste selectif: on privilegie les trades propres, pas les poursuites.
- Les annonces macro US de fin de session peuvent augmenter la volatilite.

## Lecture execution

- Chercher les retests plutot que les cassures impulsives.
- Reduire le risque si les spreads s'elargissent.
- Eviter les entrées sans invalidation claire.
`;

interface TradesApiResponse {
  trades: Trade[];
  marketAnalysis?: string;
  updatedAt?: string;
  permissions?: {
    vipAccess: boolean;
    canAccessCryptoSignals: boolean;
    canAccessBourseSignals: boolean;
    canAccessTraining: boolean;
  };
}

interface UseDailyTradesOptions {
  enabled: boolean;
}

export const useDailyTrades = ({ enabled }: UseDailyTradesOptions) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<string>(FALLBACK_MARKET_ANALYSIS);
  const [updatedAt, setUpdatedAt] = useState<string>(new Date().toISOString());
  const [permissions, setPermissions] = useState<TradesApiResponse['permissions'] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setTrades([]);
      setMarketAnalysis(FALLBACK_MARKET_ANALYSIS);
      setUpdatedAt(new Date().toISOString());
      setPermissions(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/trades`, {
          credentials: 'include'
        });
        const data: TradesApiResponse = await res.json();
        if (!mounted || !res.ok) throw new Error('trades_fetch_failed');
        if (Array.isArray(data?.trades)) setTrades(data.trades);
        if (typeof data?.marketAnalysis === 'string') setMarketAnalysis(data.marketAnalysis);
        setUpdatedAt(data?.updatedAt || new Date().toISOString());
        setPermissions(data?.permissions || null);
      } catch {
        if (!mounted) return;
        setTrades([]);
        setMarketAnalysis('## Acces VIP requis\n\n- Les signaux sont disponibles uniquement avec un abonnement actif valide cote serveur.');
        setUpdatedAt(new Date().toISOString());
        setPermissions(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [enabled]);

  return {
    trades,
    marketAnalysis,
    updatedAt,
    permissions,
    loading,
    setTrades,
  };
};
