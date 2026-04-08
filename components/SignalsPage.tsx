import React from 'react';
import { CalendarDays, CreditCard, Bitcoin, Lock, RefreshCcw } from 'lucide-react';
import { useDailyTrades } from '../hooks/useDailyTrades';
import { DailyTradesTable } from './DailyTradesTable';
import { TradeCard } from './TradeCard';

interface SignalsAccess {
  vipAccess: boolean;
  canAccessCryptoSignals: boolean;
  canAccessBourseSignals: boolean;
}

const MarkdownBlock: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-2" />;
        if (trimmed.startsWith('## ')) {
          return <h3 key={index} className="text-xl font-bold text-white mt-4">{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith('- ')) {
          return <div key={index} className="flex items-start gap-2 text-gray-300"><span className="text-primary mt-1">•</span><span>{trimmed.slice(2)}</span></div>;
        }
        return <p key={index} className="text-gray-300 leading-relaxed">{trimmed}</p>;
      })}
    </div>
  );
};

export const SignalsPage: React.FC<{ access: SignalsAccess; onSubscribe: () => void }> = ({ access, onSubscribe }) => {
  const { trades, marketAnalysis, updatedAt, loading } = useDailyTrades({ enabled: access.vipAccess });
  const displayDate = new Date(updatedAt || Date.now()).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  if (!access.vipAccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-surface border border-gray-800 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
            <Lock className="text-gray-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Signaux Quotidiens VIP</h1>
          <p className="text-gray-400 mb-6">
            Cette page rassemble les signaux du jour, les niveaux d execution et l analyse de marche reservee aux abonnes.
          </p>
          <button onClick={onSubscribe} className="bg-primary text-black font-bold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">
            Debloquer l acces VIP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-[#08140f] via-black to-[#0a0a0a] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              <CalendarDays size={12} />
              Page VIP
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">Signaux Quotidiens {displayDate}</h1>
            <p className="text-gray-300 max-w-3xl">
              Table d execution, cartes signal, lecture de marche et rappel abonnement Lemon Squeezy / crypto dans une seule vue.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${access.canAccessBourseSignals ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-900 text-gray-500 border-gray-700'}`}>
                Bourse {access.canAccessBourseSignals ? 'active' : 'verrouillee'}
              </span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${access.canAccessCryptoSignals ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-900 text-gray-500 border-gray-700'}`}>
                Crypto {access.canAccessCryptoSignals ? 'active' : 'verrouillee'}
              </span>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 min-w-full lg:min-w-[420px]">
            <div className="rounded-2xl border border-gray-800 bg-black/40 p-4">
              <div className="text-xs text-gray-500 mb-1">Signaux publies</div>
              <div className="text-2xl font-bold text-white">{trades.length}</div>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-black/40 p-4">
              <div className="text-xs text-gray-500 mb-1">Maj feed</div>
              <div className="text-sm font-mono text-white">{updatedAt ? new Date(updatedAt).toLocaleTimeString('fr-FR') : '--:--'}</div>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-black/40 p-4">
              <div className="text-xs text-gray-500 mb-1">Etat</div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Sync...' : 'Live'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-8">
        <DailyTradesTable trades={trades} />
      </section>

      <section className="grid xl:grid-cols-[1.2fr,0.8fr] gap-8 mb-8">
        <div className="space-y-6">
          <div className="bg-surface border border-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Analyse Marche</h2>
            <MarkdownBlock content={marketAnalysis} />
          </div>

          <div className="bg-surface border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-3">Execution Notes</h2>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-gray-800 bg-black/40 p-4 text-gray-300">Entrer uniquement sur retest propre ou reprise de momentum.</div>
              <div className="rounded-xl border border-gray-800 bg-black/40 p-4 text-gray-300">Risque reduit si news macro proche ou spread trop large.</div>
              <div className="rounded-xl border border-gray-800 bg-black/40 p-4 text-gray-300">Ne pas copier un signal sans comprendre l invalidation.</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {trades.map((trade, index) => (
            <TradeCard key={`${trade.actif}-${trade.heure}-${index}`} trade={trade} />
          ))}
        </div>
      </section>

      <footer className="rounded-3xl border border-gray-800 bg-black/50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Abonnez-vous Lemon / crypto</h3>
            <p className="text-sm text-gray-400">Pour garder l acces au flux VIP, renouvelez votre abonnement via Lemon Squeezy ou paiement crypto valide.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={onSubscribe} className="inline-flex items-center gap-2 rounded-xl bg-white text-black font-bold px-5 py-3 hover:bg-gray-200 transition-colors">
              <CreditCard size={16} />
              Lemon Squeezy
            </button>
            <button onClick={onSubscribe} className="inline-flex items-center gap-2 rounded-xl bg-[#F7931A] text-white font-bold px-5 py-3 hover:bg-[#e08415] transition-colors">
              <Bitcoin size={16} />
              Crypto
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
