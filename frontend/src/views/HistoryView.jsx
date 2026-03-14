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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-green-600 hover:text-green-700">
            <span className="w-6 h-6 inline-block"><Icons.ArrowLeft /></span>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Game History</h1>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
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
                <div key={game.gameId} className="bg-white rounded-2xl shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{game.gameName}</h3>
                      <div className="flex gap-3 text-sm text-gray-500 mt-1">
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
                      <div className="text-gray-500">Blinds</div>
                      <div className="font-semibold">{game.smallBlind}/{game.bigBlind}</div>
                    </div>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-1.5 text-left">Player</th>
                        <th className="px-2 py-1.5 text-right">P/L $</th>
                        <th className="px-2 py-1.5 text-right">P/L BB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {game.players.map((player) => {
                        const { profitMoney, profitBB } = calculateProfitLoss(
                          player, game.buyInChips, game.chipValue, game.bigBlind
                        );
                        return (
                          <tr key={player.playerId} className="border-t">
                            <td className="px-2 py-1.5">{player.name}</td>
                            <td className={`px-2 py-1.5 text-right font-semibold ${profitMoney >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profitMoney > 0 ? '+' : ''}${profitMoney}
                            </td>
                            <td className={`px-2 py-1.5 text-right font-semibold ${profitBB >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profitBB > 0 ? '+' : ''}{profitBB}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="mt-3 pt-2 border-t">
                    <button
                      onClick={() => handleDelete(game.gameId)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
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
