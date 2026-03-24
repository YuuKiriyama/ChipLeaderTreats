import { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { calculateProfitLoss } from '../utils/helpers';

export default function PlayerTable({
  players,
  buyInChips,
  chipValue,
  bigBlind,
  gameStatus,
  isHost,
  myPlayerId,
  onUpdateBuyIns,
  onUpdateFinalChips,
  onRemovePlayer,
}) {
  const isSettled = gameStatus === 'settling' || gameStatus === 'ended';

  return (
    <div>
      <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
        <span className="w-5 h-5"><Icons.User /></span>
        Players ({players.length})
      </h3>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-2 py-2 text-left text-gray-600 dark:text-gray-300">Name</th>
              <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">Buy-ins</th>
              {isSettled && <th className="px-2 py-2 text-center text-gray-600 dark:text-gray-300">Final Chips</th>}
              {isSettled && buyInChips && chipValue && (
                <th className="px-2 py-2 text-right text-gray-600 dark:text-gray-300">P/L $</th>
              )}
              {isHost && gameStatus !== 'ended' && <th className="px-2 py-2 w-8"></th>}
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const isMe = player.playerId === myPlayerId;
              const pnl = isSettled && player.finalChips != null && buyInChips && chipValue
                ? calculateProfitLoss(player, buyInChips, chipValue, bigBlind)
                : null;

              return (
                <tr
                  key={player.playerId}
                  className={`border-t border-gray-100 dark:border-gray-700 ${isMe ? 'bg-green-50 dark:bg-green-950/40' : ''} ${!player.isConnected && !player.isHost ? 'opacity-50' : ''}`}
                >
                  {/* Name */}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        player.isHost ? 'bg-yellow-400' : player.isConnected ? 'bg-green-400' : 'bg-gray-300'
                      }`} />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{player.name}</span>
                      {player.isHost && <span className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/40 px-1 rounded">Host</span>}
                      {isMe && !player.isHost && <span className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/40 px-1 rounded">You</span>}
                    </div>
                  </td>

                  {/* Buy-ins */}
                  <td className="px-2 py-2 text-center">
                    {isHost && gameStatus !== 'ended' ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onUpdateBuyIns(player.playerId, -1)}
                          className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                        >−</button>
                        <span className="w-6 text-center font-medium">{player.buyIns}</span>
                        <button
                          onClick={() => onUpdateBuyIns(player.playerId, 1)}
                          className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                        >+</button>
                      </div>
                    ) : (
                      <span className="font-medium">{player.buyIns}</span>
                    )}
                  </td>

                  {/* Final Chips */}
                  {isSettled && (
                    <td className="px-2 py-2 text-center">
                      {isHost ? (
                        <FinalChipsInput
                          value={player.finalChips}
                          onCommit={(val) => onUpdateFinalChips(player.playerId, val)}
                        />
                      ) : (
                        <span className="font-medium">{player.finalChips ?? '—'}</span>
                      )}
                    </td>
                  )}

                  {/* P/L */}
                  {isSettled && buyInChips && chipValue && (
                    <td className={`px-2 py-2 text-right font-semibold ${
                      pnl ? (pnl.profitMoney >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {pnl ? `${pnl.profitMoney > 0 ? '+' : ''}$${pnl.profitMoney}` : '—'}
                    </td>
                  )}

                  {/* Remove */}
                  {isHost && gameStatus !== 'ended' && (
                    <td className="px-2 py-2">
                      {!player.isHost && (
                        <button
                          onClick={() => onRemovePlayer(player.playerId)}
                          className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400"
                        >
                          <span className="w-4 h-4 inline-block"><Icons.Trash2 /></span>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Balance check */}
      {isSettled && buyInChips && chipValue && (
        <BalanceCheck players={players} buyInChips={buyInChips} />
      )}
    </div>
  );
}

function FinalChipsInput({ value, onCommit }) {
  const [local, setLocal] = useState(value ?? '');

  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  return (
    <input
      type="number"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const val = local === '' ? null : parseInt(local) || 0;
        onCommit(val);
      }}
      className="w-20 px-1 py-0.5 text-center border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      placeholder="—"
      min="0"
    />
  );
}

function BalanceCheck({ players, buyInChips }) {
  const totalBuyIn = players.reduce((sum, p) => sum + ((p.buyIns || 0) * buyInChips), 0);
  const totalFinal = players.reduce((sum, p) => sum + (p.finalChips ?? 0), 0);
  const allFilled = players.every((p) => p.finalChips != null);
  const diff = totalFinal - totalBuyIn;

  if (!allFilled) return null;

  return (
    <div className={`mt-3 p-2 rounded-lg text-sm text-center font-medium ${
      diff === 0
        ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400'
        : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
    }`}>
      {diff === 0
        ? 'Books Balanced'
        : `Books Don't Balance! ${diff > 0 ? '+' : ''}${diff} chips`
      }
    </div>
  );
}
