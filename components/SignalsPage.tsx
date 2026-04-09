import React from 'react';
import { CalendarDays, Lock, RefreshCcw } from 'lucide-react';
import { useDailyTrades } from '../hooks/useDailyTrades';
import { DailyTradesTable } from './DailyTradesTable';
import { TradeCard } from './TradeCard';
import { Trade } from '../types';

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
  const [selectedDate, setSelectedDate] = React.useState('');
  const { groupedTrades, marketAnalyses, updatedAt, loading, snapshot, availableSnapshots } = useDailyTrades({
    enabled: access.vipAccess,
    selectedDate
  });

  const resolvedDateKey = typeof snapshot?.dateKey === 'string' ? snapshot.dateKey : '';
  const todayDisplayDate = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  const displayedArchiveDate = resolvedDateKey
    ? new Date(`${resolvedDateKey}T00:00:00.000Z`).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : todayDisplayDate;
  const latestPublishedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const snapshotList = Array.isArray(availableSnapshots) ? availableSnapshots : [];
  const recentDateKeys = snapshotList
    .map((entry) => String(entry?.dateKey || '').slice(0, 10))
    .filter((value, index, arr) => Boolean(value) && arr.indexOf(value) === index)
    .slice(0, 10);
  const sectionCards = [
    access.canAccessBourseSignals
      ? {
        key: 'bourse',
        title: 'Bourse',
        trades: Array.isArray(groupedTrades?.bourse) ? groupedTrades.bourse : [],
        analysis: typeof marketAnalyses?.bourse === 'string' ? marketAnalyses.bourse : ''
      }
      : null,
    access.canAccessCryptoSignals
      ? {
        key: 'crypto',
        title: 'Crypto',
        trades: Array.isArray(groupedTrades?.crypto) ? groupedTrades.crypto : [],
        analysis: typeof marketAnalyses?.crypto === 'string' ? marketAnalyses.crypto : ''
      }
      : null
  ].filter(Boolean) as Array<{ key: 'bourse' | 'crypto'; title: string; trades: Trade[]; analysis: string }>;
  const totalTrades = sectionCards.reduce((sum, section) => sum + section.trades.length, 0);
  const noArchiveForSelection = Boolean(selectedDate && !loading && totalTrades === 0);

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
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">Signaux VIP - {todayDisplayDate}</h1>
            <p className="text-gray-300 max-w-3xl">
              Les signaux du jour s affichent automatiquement. Choisissez une date en bas de page pour ouvrir les archives.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Affichage actuel : <span className="text-white font-semibold">{selectedDate ? `archive du ${displayedArchiveDate}` : `jour (${todayDisplayDate})`}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${access.canAccessBourseSignals ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-900 text-gray-500 border-gray-700'}`}>
                Bourse {access.canAccessBourseSignals ? 'active' : 'verrouillee'}
              </span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${access.canAccessCryptoSignals ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-900 text-gray-500 border-gray-700'}`}>
                Crypto {access.canAccessCryptoSignals ? 'active' : 'verrouillee'}
              </span>
              <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold border border-primary/30 bg-primary/10 text-primary">
                {snapshot?.isHistorical ? 'Archive chargée' : 'Dernière publication'}
              </span>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 min-w-full lg:min-w-[420px]">
            <div className="rounded-2xl border border-gray-800 bg-black/40 p-4">
              <div className="text-xs text-gray-500 mb-1">Signaux publies</div>
              <div className="text-2xl font-bold text-white">{totalTrades}</div>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-black/40 p-4">
              <div className="text-xs text-gray-500 mb-1">Publication</div>
              <div className="text-sm font-mono text-white">{latestPublishedTime}</div>
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
        {noArchiveForSelection && (
          <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Aucun signal sauvegarde pour cette date. Choisissez une autre date ou revenez au jour actuel.
          </div>
        )}
      </section>

      <section className="space-y-10 mb-8">
        {sectionCards.map((section) => (
          <article key={section.key} className="rounded-3xl border border-gray-800 bg-[#0a0a0a]/80 p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-white">
                {section.title} {selectedDate ? `- archive du ${displayedArchiveDate}` : '- signaux du jour'}
              </h2>
              <span className="inline-flex rounded-full border border-gray-700 px-3 py-1 text-xs font-bold text-gray-300">
                {section.trades.length} signal{section.trades.length > 1 ? 's' : ''}
              </span>
            </div>
            <DailyTradesTable
              trades={section.trades}
              title={`Tableau ${section.title}`}
              subtitle="La recherche reste optionnelle, la date du jour s affiche automatiquement."
            />
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
              <div className="bg-surface border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Analyse {section.title}</h3>
                <MarkdownBlock content={section.analysis} />
              </div>
              <div className="space-y-4">
                {section.trades.length > 0 ? section.trades.map((trade, index) => (
                  <TradeCard key={`${section.key}-${trade.actif}-${trade.heure}-${index}`} trade={trade} />
                )) : (
                  <div className="rounded-2xl border border-gray-800 bg-surface p-5 text-sm text-gray-400">
                    Aucun signal {section.title.toLowerCase()} pour cette date.
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mb-8 rounded-3xl border border-gray-800 bg-black/50 p-6 md:p-8">
        <h3 className="text-xl font-bold text-white mb-2">Archives par date</h3>
        <p className="text-sm text-gray-400 mb-4">
          Choisissez une date pour remplacer l affichage du jour par les signaux et analyses archives.
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-end">
          <label className="rounded-xl border border-gray-800 bg-black/40 p-3 text-xs text-gray-400">
            Date d archive
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-700 bg-[#101010] px-3 py-2 text-sm text-white outline-none"
            />
          </label>
          <button
            onClick={() => setSelectedDate('')}
            disabled={!selectedDate}
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-gray-200 disabled:opacity-50"
          >
            Revenir au jour actuel
          </button>
        </div>
        {recentDateKeys.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Dates disponibles</p>
            <div className="flex flex-wrap gap-2">
              {recentDateKeys.map((dateKey) => (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    selectedDate === dateKey
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  {dateKey}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

    </div>
  );
};
