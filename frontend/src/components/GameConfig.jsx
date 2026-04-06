import { useState, useEffect, useCallback } from 'react';
import { GAME_LIMITS } from '../utils/gameConstraints';

function newDenominationId() {
  return `cd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function BlurInput({ type, value, onCommit, disabled, placeholder, min, className }) {
  const [local, setLocal] = useState(value ?? '');

  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  return (
    <input
      type={type}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (type === 'number') {
          if (local === '') {
            onCommit(null);
          } else {
            const n = parseInt(local, 10);
            onCommit(Number.isNaN(n) ? null : n);
          }
        } else {
          onCommit(local);
        }
      }}
      disabled={disabled}
      placeholder={placeholder}
      min={min}
      className={className}
    />
  );
}

export default function GameConfig({ gameState, onChange, disabled, denominationsDisabled }) {
  const denoms = gameState.chipDenominations ?? [];
  const maxTypes = GAME_LIMITS.MAX_CHIP_DENOMINATION_TYPES;

  const commitDenoms = useCallback(
    (next) => {
      onChange('chipDenominations', next);
    },
    [onChange]
  );

  const denomOf = (row) => row.value ?? row.chips ?? 1;

  const addDenomRow = () => {
    if (denoms.length >= maxTypes) return;
    commitDenoms([
      ...denoms,
      { id: newDenominationId(), value: 1 },
    ]);
  };

  const removeDenomRow = (id) => {
    commitDenoms(denoms.filter((d) => d.id !== id));
  };

  const updateDenomValue = (id, v) => {
    const value = v == null ? 1 : Math.max(1, v);
    commitDenoms(denoms.map((d) => (d.id === id ? { ...d, value } : d)));
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-500';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow dark:shadow-gray-900/50 p-4 mb-4 border border-transparent dark:border-gray-800">
      <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Game Settings</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Game Name</label>
          <BlurInput
            type="text"
            value={gameState.gameName}
            onCommit={(v) => onChange('gameName', v)}
            disabled={disabled}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Small Blind (Chips)</label>
          <BlurInput
            type="number"
            value={gameState.smallBlind}
            onCommit={(v) => onChange('smallBlind', v)}
            disabled={disabled}
            className={inputClass}
            min="1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Big Blind (Chips)</label>
          <BlurInput
            type="number"
            value={gameState.bigBlind}
            onCommit={(v) => onChange('bigBlind', v)}
            disabled={disabled}
            className={inputClass}
            min="1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Buy-in Chips</label>
          <BlurInput
            type="number"
            value={gameState.buyInChips}
            onCommit={(v) => onChange('buyInChips', v)}
            disabled={disabled}
            placeholder="e.g. 10000"
            className={inputClass}
            min="1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Chips per $1</label>
          <BlurInput
            type="number"
            value={gameState.chipValue}
            onCommit={(v) => onChange('chipValue', v)}
            disabled={disabled}
            placeholder="e.g. 100"
            className={inputClass}
            min="1"
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Chip denominations (optional) — list each chip value in game chips; guests enter how many physical chips
          they have of each value when settling. You can edit this list during play or settlement.
        </p>
        {denoms.length > 0 && (
          <div className="space-y-2 mb-2">
            <div className="grid grid-cols-[1fr_2rem] gap-2 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 px-1">
              <span>Denomination (chips)</span>
              <span />
            </div>
            {denoms.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_2rem] gap-2 items-center">
                <BlurInput
                  type="number"
                  value={denomOf(row)}
                  onCommit={(v) => updateDenomValue(row.id, v)}
                  disabled={denominationsDisabled}
                  className={inputClass}
                  min="1"
                />
                <button
                  type="button"
                  disabled={denominationsDisabled}
                  onClick={() => removeDenomRow(row.id)}
                  className="text-red-500 hover:text-red-600 text-sm font-medium disabled:opacity-40"
                  aria-label="Remove denomination"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={denominationsDisabled || denoms.length >= maxTypes}
          onClick={addDenomRow}
          className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline disabled:opacity-40 disabled:no-underline"
        >
          + Add denomination
        </button>
      </div>
    </div>
  );
}
