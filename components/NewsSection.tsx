import React, { useEffect, useState } from 'react';
import { fetchMarketAnalysis } from '../services/geminiService';
import { MarketNews } from '../types';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const NewsSection: React.FC = () => {
  const [news, setNews] = useState<MarketNews[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNews = async () => {
    setLoading(true);
    const data = await fetchMarketAnalysis();
    setNews(data);
    setLoading(false);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="text-green-500" />;
      case 'bearish': return <TrendingDown className="text-red-500" />;
      default: return <Minus className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-surface rounded-lg p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-mono font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          MARKET INTELLIGENCE
        </h3>
        <button 
          onClick={loadNews}
          disabled={loading}
          className="text-primary hover:text-white transition-colors p-2"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.id} className="border-b border-gray-700 pb-4 last:border-0 hover:bg-white/5 p-3 rounded transition-colors">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-gray-200 text-sm mb-1">{item.title}</h4>
              <span title={item.sentiment} className="ml-2 bg-black/30 p-1 rounded">
                {getSentimentIcon(item.sentiment)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.summary}</p>
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
              <span>SRC: {item.source}</span>
              <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
        {news.length === 0 && !loading && (
          <p className="text-center text-gray-500">Aucune donnée disponible.</p>
        )}
      </div>
    </div>
  );
};