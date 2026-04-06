import { useState, useEffect } from 'react';
import { hapticSuccess } from '../utils/haptics';

export function chipDenomValue(d) {
  return d.value ?? d.chips ?? 0;
}

const THEMES = {
  guest: {
    sectionInCard: 'mt-3 pt-3 border-t border-green-200 dark:border-green-800',
    sectionStandalone: '',
    title: 'text-green-800 dark:text-green-300',
    tabBorder: 'border-green-300 dark:border-green-700',
    tabActive: 'bg-green-600 text-white',
    tabInactive: 'bg-white dark:bg-gray-800 text-green-800 dark:text-green-300',
    input: 'border-green-300 dark:border-green-700 focus:ring-2 focus:ring-green-500',
    headerMuted: 'text-green-600/80 dark:text-green-400/80',
    rowText: 'text-green-800 dark:text-green-300',
    totalText: 'text-green-800 dark:text-green-300',
    btnDone: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700',
    btnPrimary: 'bg-green-600 text-white hover:bg-green-700',
  },
  host: {
    sectionInCard: 'mt-3 pt-3 border-t border-amber-200 dark:border-amber-800',
    sectionStandalone: '',
    title: 'text-amber-900 dark:text-amber-200',
    tabBorder: 'border-amber-300 dark:border-amber-700',
    tabActive: 'bg-amber-600 text-white',
    tabInactive: 'bg-white dark:bg-gray-800 text-amber-900 dark:text-amber-200',
    input: 'border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500',
    headerMuted: 'text-amber-700/90 dark:text-amber-300/90',
    rowText: 'text-amber-900 dark:text-amber-200',
    totalText: 'text-amber-900 dark:text-amber-200',
    btnDone: 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700',
    btnPrimary: 'bg-amber-600 text-white hover:bg-amber-700',
  },
};

/**
 * Final chips entry during settling: total and/or count-by-denomination.
 * @param {'guest'|'host'} theme
 * @param {'inCard'|'standalone'} layout — guest sits inside green card; host uses standalone inside its own wrapper
 */
export default function SettlingChipsInput({
  value,
  onCommit,
  denominations,
  theme = 'guest',
  layout = 'inCard',
  title = 'Your final chips',
}) {
  const t = THEMES[theme] ?? THEMES.guest;
  const denoms = denominations?.length ? denominations : [];
  const showBreakdown = denoms.length > 0;

  const [mode, setMode] = useState('total');
  const [local, setLocal] = useState(value ?? '');
  const [counts, setCounts] = useState(() => Object.fromEntries(denoms.map((d) => [d.id, ''])));
  const [submitted, setSubmitted] = useState(value != null && value !== '');

  const denomKey = denoms.map((d) => d.id).join('|');

  useEffect(() => {
    setLocal(value ?? '');
    setSubmitted(value != null && value !== '');
  }, [value]);

  useEffect(() => {
    setCounts(Object.fromEntries(denoms.map((d) => [d.id, ''])));
  }, [denomKey]);

  useEffect(() => {
    if (!showBreakdown) setMode('total');
  }, [showBreakdown]);

  const breakdownTotal = denoms.reduce((sum, d) => {
    const n = parseInt(counts[d.id], 10);
    const v = chipDenomValue(d);
    return sum + (Number.isNaN(n) || n < 0 ? 0 : n) * v;
  }, 0);

  const handleSubmitTotal = () => {
    hapticSuccess();
    const val = local === '' ? '' : parseInt(local, 10) || 0;
    onCommit(val);
    setSubmitted(true);
  };

  const handleSubmitBreakdown = () => {
    hapticSuccess();
    onCommit(breakdownTotal);
    setSubmitted(true);
  };

  const sectionClass =
    layout === 'inCard' ? t.sectionInCard : t.sectionStandalone;
  const idleLabel = theme === 'guest' ? 'Submit' : 'Apply';
  const doneLabel = theme === 'guest' ? 'Sent' : 'Applied';

  return (
    <div className={sectionClass}>
      <label className={`block text-sm font-medium mb-1 ${t.title}`}>{title}</label>

      {showBreakdown && (
        <div className={`flex rounded-lg overflow-hidden border mb-2 ${t.tabBorder}`}>
          <button
            type="button"
            onClick={() => {
              setMode('total');
              setSubmitted(false);
            }}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              mode === 'total' ? t.tabActive : t.tabInactive
            }`}
          >
            Total
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('breakdown');
              setSubmitted(false);
            }}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              mode === 'breakdown' ? t.tabActive : t.tabInactive
            }`}
          >
            By denomination
          </button>
        </div>
      )}

      {mode === 'total' && (
        <div className="flex gap-2">
          <input
            type="number"
            value={local}
            onChange={(e) => {
              setLocal(e.target.value);
              setSubmitted(false);
            }}
            placeholder="Enter your remaining chips"
            className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${t.input}`}
            min="0"
          />
          <button
            type="button"
            onClick={handleSubmitTotal}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
              submitted ? t.btnDone : t.btnPrimary
            }`}
          >
            {submitted ? doneLabel : idleLabel}
          </button>
        </div>
      )}

      {showBreakdown && mode === 'breakdown' && (
        <div className="space-y-2">
          <div className={`grid grid-cols-[1fr_5rem] gap-2 text-[10px] uppercase tracking-wide px-0.5 ${t.headerMuted}`}>
            <span>Value (chips)</span>
            <span className="text-center">Count</span>
          </div>
          {denoms.map((d) => {
            const v = chipDenomValue(d);
            return (
              <div key={d.id} className="flex items-center gap-2">
                <span className={`flex-1 text-sm font-medium tabular-nums ${t.rowText}`}>{v}</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  aria-label={`Number of ${v}-chip pieces`}
                  value={counts[d.id] ?? ''}
                  onChange={(e) => {
                    setCounts((prev) => ({ ...prev, [d.id]: e.target.value }));
                    setSubmitted(false);
                  }}
                  placeholder="0"
                  className={`w-20 px-2 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-right ${t.input}`}
                />
              </div>
            );
          })}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className={`text-sm ${t.totalText}`}>
              Total: <strong>{breakdownTotal}</strong> chips
            </span>
            <button
              type="button"
              onClick={handleSubmitBreakdown}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                submitted ? t.btnDone : t.btnPrimary
              }`}
            >
              {submitted ? doneLabel : idleLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
