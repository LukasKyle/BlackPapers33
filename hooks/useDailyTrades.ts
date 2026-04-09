import { useEffect, useState } from 'react';
import { Trade } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_REGEX = /^\d{4}-\d{2}$/;

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
  groupedTrades?: {
    bourse?: Trade[];
    crypto?: Trade[];
  };
  marketAnalysis?: string;
  marketAnalyses?: {
    bourse?: string;
    crypto?: string;
  };
  updatedAt?: string;
  snapshot?: {
    id?: string;
    dateKey?: string;
    monthKey?: string;
    publishedAt?: string;
    isHistorical?: boolean;
  } | null;
  archive?: {
    totalSnapshots?: number;
    availableSnapshots?: Array<{
      id?: string;
      dateKey?: string;
      monthKey?: string;
      publishedAt?: string | null;
      tradeCount?: number;
    }>;
  };
  requestedDate?: string | null;
  requestedMonth?: string | null;
  error?: string;
  permissions?: {
    vipAccess: boolean;
    canAccessCryptoSignals: boolean;
    canAccessBourseSignals: boolean;
    canAccessTraining: boolean;
  };
}

interface UseDailyTradesOptions {
  enabled: boolean;
  selectedDate?: string | null;
  selectedMonth?: string | null;
}

const normalizeDateFilter = (value?: string | null): string => {
  const candidate = String(value || '').trim().slice(0, 10);
  return DATE_KEY_REGEX.test(candidate) ? candidate : '';
};

const normalizeMonthFilter = (value?: string | null): string => {
  const candidate = String(value || '').trim().slice(0, 7);
  return MONTH_KEY_REGEX.test(candidate) ? candidate : '';
};

interface MarketAnalysesByMarket {
  bourse: string;
  crypto: string;
}

interface GroupedTradesByMarket {
  bourse: Trade[];
  crypto: Trade[];
}

const FALLBACK_MARKET_ANALYSIS_BOURSE = `## Analyse Bourse

- Concentrez-vous sur les zones techniques claires et les invalidations nettes.
- Evitez les entrees impulsees sans retest.
`;

const FALLBACK_MARKET_ANALYSIS_CRYPTO = `## Analyse Crypto

- BTC donne le rythme, les alts demandent une taille plus prudente.
- Gardez un plan strict: entree, invalidation, objectif.
`;

const isCryptoTrade = (trade: Trade): boolean => {
  if (String(trade.market || '').toUpperCase() === 'CRYPTO') return true;
  const symbol = String(trade.actif || '').toUpperCase();
  return /(BTC|ETH|SOL|BNB|XRP|ADA|DOT|DOGE|AVAX|MATIC|USDT|USDC|LTC|TRX|LINK|UNI|ATOM|XLM|NEAR|APT)/.test(symbol);
};

const groupTradesByMarket = (trades: Trade[]): GroupedTradesByMarket => ({
  bourse: trades.filter((trade) => !isCryptoTrade(trade)),
  crypto: trades.filter((trade) => isCryptoTrade(trade))
});

export const useDailyTrades = ({ enabled, selectedDate, selectedMonth }: UseDailyTradesOptions) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<string>(FALLBACK_MARKET_ANALYSIS);
  const [marketAnalyses, setMarketAnalyses] = useState<MarketAnalysesByMarket>({
    bourse: FALLBACK_MARKET_ANALYSIS_BOURSE,
    crypto: FALLBACK_MARKET_ANALYSIS_CRYPTO
  });
  const [groupedTrades, setGroupedTrades] = useState<GroupedTradesByMarket>({ bourse: [], crypto: [] });
  const [updatedAt, setUpdatedAt] = useState<string>(new Date().toISOString());
  const [permissions, setPermissions] = useState<TradesApiResponse['permissions'] | null>(null);
  const [snapshot, setSnapshot] = useState<TradesApiResponse['snapshot']>(null);
  const [availableSnapshots, setAvailableSnapshots] = useState<NonNullable<TradesApiResponse['archive']>['availableSnapshots']>([]);
  const [requestedDateState, setRequestedDateState] = useState<string | null>(null);
  const [requestedMonthState, setRequestedMonthState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dateFilter = normalizeDateFilter(selectedDate);
    const monthFilter = dateFilter ? '' : normalizeMonthFilter(selectedMonth);

    if (!enabled) {
      setTrades([]);
      setMarketAnalysis(FALLBACK_MARKET_ANALYSIS);
      setMarketAnalyses({
        bourse: FALLBACK_MARKET_ANALYSIS_BOURSE,
        crypto: FALLBACK_MARKET_ANALYSIS_CRYPTO
      });
      setGroupedTrades({ bourse: [], crypto: [] });
      setUpdatedAt(new Date().toISOString());
      setPermissions(null);
      setSnapshot(null);
      setAvailableSnapshots([]);
      setRequestedDateState(null);
      setRequestedMonthState(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const query = dateFilter
          ? `?date=${encodeURIComponent(dateFilter)}`
          : monthFilter
            ? `?month=${encodeURIComponent(monthFilter)}`
            : '';
        const res = await fetch(`${API_BASE_URL}/api/trades${query}`, {
          credentials: 'include'
        });
        const data: TradesApiResponse = await res.json().catch(() => ({ trades: [] }));
        if (!mounted) return;
        if (!res.ok) {
          throw new Error(data?.error || 'trades_fetch_failed');
        }
        const normalizedTrades = Array.isArray(data?.trades) ? data.trades : [];
        setTrades(normalizedTrades);

        const fallbackGrouped = groupTradesByMarket(normalizedTrades);
        const nextGroupedTrades = {
          bourse: Array.isArray(data?.groupedTrades?.bourse) ? data.groupedTrades.bourse : fallbackGrouped.bourse,
          crypto: Array.isArray(data?.groupedTrades?.crypto) ? data.groupedTrades.crypto : fallbackGrouped.crypto
        };
        setGroupedTrades(nextGroupedTrades);

        const fallbackMarketAnalyses: MarketAnalysesByMarket = {
          bourse: FALLBACK_MARKET_ANALYSIS_BOURSE,
          crypto: FALLBACK_MARKET_ANALYSIS_CRYPTO
        };
        const nextMarketAnalyses: MarketAnalysesByMarket = {
          bourse: typeof data?.marketAnalyses?.bourse === 'string' && data.marketAnalyses.bourse.trim()
            ? data.marketAnalyses.bourse
            : (typeof data?.marketAnalysis === 'string' && data.marketAnalysis.trim()
              ? data.marketAnalysis
              : fallbackMarketAnalyses.bourse),
          crypto: typeof data?.marketAnalyses?.crypto === 'string' && data.marketAnalyses.crypto.trim()
            ? data.marketAnalyses.crypto
            : (typeof data?.marketAnalysis === 'string' && data.marketAnalysis.trim()
              ? data.marketAnalysis
              : fallbackMarketAnalyses.crypto)
        };
        setMarketAnalyses(nextMarketAnalyses);

        if (typeof data?.marketAnalysis === 'string') {
          setMarketAnalysis(data.marketAnalysis);
        } else {
          setMarketAnalysis(FALLBACK_MARKET_ANALYSIS);
        }
        setUpdatedAt(data?.updatedAt || new Date().toISOString());
        setPermissions(data?.permissions || null);
        setSnapshot(data?.snapshot || null);
        setAvailableSnapshots(Array.isArray(data?.archive?.availableSnapshots) ? data.archive.availableSnapshots : []);
        setRequestedDateState(typeof data?.requestedDate === 'string' ? data.requestedDate : null);
        setRequestedMonthState(typeof data?.requestedMonth === 'string' ? data.requestedMonth : null);
      } catch {
        if (!mounted) return;
        setTrades([]);
        setGroupedTrades({ bourse: [], crypto: [] });
        setMarketAnalysis('## Archive indisponible\n\n- Impossible de charger les signaux pour la période demandée.');
        setMarketAnalyses({
          bourse: '## Archive indisponible\n\n- Impossible de charger les signaux Bourse.',
          crypto: '## Archive indisponible\n\n- Impossible de charger les signaux Crypto.'
        });
        setUpdatedAt(new Date().toISOString());
        setPermissions(null);
        setSnapshot(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [enabled, selectedDate, selectedMonth]);

  return {
    trades,
    groupedTrades,
    marketAnalysis,
    marketAnalyses,
    updatedAt,
    permissions,
    snapshot,
    availableSnapshots,
    requestedDate: requestedDateState,
    requestedMonth: requestedMonthState,
    loading,
    setTrades,
  };
};
