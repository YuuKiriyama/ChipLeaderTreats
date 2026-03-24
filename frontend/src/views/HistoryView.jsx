import { useState } from 'react';
import { Icons } from '../components/Icons';
import { getGameHistory, deleteGameFromHistory } from '../utils/localStorage';
import { calculateProfitLoss, formatDuration } from '../utils/helpers';

export default function HistoryView({ onBack }) {
  const [history, setHistory] = useState(getGameHistory);

  const handleDelete = (gameId) => {
    if (!confirm('Delete this game record?')) return;
    deleteGameFromHistory(gameId);
    setHistory(getGameHistory());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={onBack} className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
            <span className="w-6 h-6 inline-block"><Icons.ArrowLeft /></span>
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Game History</h1>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <span className="w-16 h-16 mx-auto mb-4 opacity-50 inline-block"><Icons.TrendingUp /></span>
            <p>No games yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((game) => {
              const duration = game.startTime && game.endTime
                ? Math.round((new Date(game.endTime) - new Date(game.startTime)) / 60000)
                : 0;

              return (
                <div key={game.gameId} className="bg-white dark:bg-gray-900 rounded-2xl shadow dark:shadow-gray-900/50 p-4 border border-transparent dark:border-gray-800">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">{game.gameName}</h3>
                      <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4"><Icons.Calendar /></span>
                          {game.startTime ? new Date(game.startTime).toLocaleDateString('en-US') : '—'}
                        </span>
                        {duration > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-4 h-4"><Icons.Clock /></span>
                            {formatDuration(duration)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-gray-500 dark:text-gray-400">Blinds</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{game.smallBlind}/{game.bigBlind}</div>
                    </div>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="px-2 py-1.5 text-left text-gray-600 dark:text-gray-300">Player</th>
                        <th className="px-2 py-1.5 text-right text-gray-600 dark:text-gray-300">P/L $</th>
                        <th className="px-2 py-1.5 text-right text-gray-600 dark:text-gray-300">P/L BB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {game.players.map((player) => {
                        const { profitMoney, profitBB } = calculateProfitLoss(
                          player, game.buyInChips, game.chipValue, game.bigBlind
                        );
                        return (
                          <tr key={player.playerId} className="border-t border-gray-100 dark:border-gray-700">
                            <td className="px-2 py-1.5 text-gray-900 dark:text-gray-100">{player.name}</td>
                            <td className={`px-2 py-1.5 text-right font-semibold ${profitMoney >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {profitMoney > 0 ? '+' : ''}${profitMoney}
                            </td>
                            <td className={`px-2 py-1.5 text-right font-semibold ${profitBB >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {profitBB > 0 ? '+' : ''}{profitBB}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => handleDelete(game.gameId)}
                      className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                    >
                      <span className="w-3 h-3"><Icons.Trash2 /></span>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
