import { useState, useEffect } from 'react';

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

export default function GameConfig({ gameState, onChange, disabled }) {
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
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Small Blind</label>
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
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Big Blind</label>
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
    </div>
  );
}
