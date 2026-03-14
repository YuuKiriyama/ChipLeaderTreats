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
      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="w-5 h-5"><Icons.User /></span>
        Players ({players.length})
      </h3>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-2 text-left">Name</th>
              <th className="px-2 py-2 text-center">Buy-ins</th>
              {isSettled && <th className="px-2 py-2 text-center">Final Chips</th>}
              {isSettled && buyInChips && chipValue && (
                <th className="px-2 py-2 text-right">P/L $</th>
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
                  className={`border-t ${isMe ? 'bg-green-50' : ''} ${!player.isConnected && !player.isHost ? 'opacity-50' : ''}`}
                >
                  {/* Name */}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        player.isHost ? 'bg-yellow-400' : player.isConnected ? 'bg-green-400' : 'bg-gray-300'
                      }`} />
                      <span className="font-medium">{player.name}</span>
                      {player.isHost && <span className="text-xs text-yellow-600 bg-yellow-50 px-1 rounded">Host</span>}
                      {isMe && !player.isHost && <span className="text-xs text-green-600 bg-green-50 px-1 rounded">You</span>}
                    </div>
                  </td>

                  {/* Buy-ins */}
                  <td className="px-2 py-2 text-center">
                    {isHost && gameStatus !== 'ended' ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onUpdateBuyIns(player.playerId, -1)}
                          className="w-6 h-6 bg-gray-200 rounded text-xs hover:bg-gray-300"
                        >−</button>
                        <span className="w-6 text-center font-medium">{player.buyIns}</span>
                        <button
                          onClick={() => onUpdateBuyIns(player.playerId, 1)}
                          className="w-6 h-6 bg-gray-200 rounded text-xs hover:bg-gray-300"
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
                      pnl ? (pnl.profitMoney >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'
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
                          className="text-red-400 hover:text-red-600"
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
      className="w-20 px-1 py-0.5 text-center border border-gray-300 rounded text-sm"
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
        ? 'bg-green-50 text-green-700'
        : 'bg-red-50 text-red-700'
    }`}>
      {diff === 0
        ? 'Books Balanced'
        : `Books Don't Balance! ${diff > 0 ? '+' : ''}${diff} chips`
      }
    </div>
  );
}
