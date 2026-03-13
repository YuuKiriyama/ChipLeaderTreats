import { Icons } from './Icons';
import { calculateProfitLoss, formatDuration } from '../utils/helpers';

function PlayerDetail({ playerName, history, setViewPlayerDetail }) {
  const getPlayerHistory = (name) => {
    return history
      .filter(game => game.players.some(p => p.name === name))
      .reverse();
  };

  const getPlayerStats = (name) => {
    const playerGames = history.filter(game => 
      game.players.some(p => p.name === name)
    );

    let totalProfit = 0;
    let totalProfitBB = 0;
    let totalMinutes = 0;

    playerGames.forEach(game => {
      const player = game.players.find(p => p.name === name);
      if (player) {
        const { profitMoney, profitBB } = calculateProfitLoss(
          player,
          game.buyInChips,
          game.chipValue,
          game.bigBlind
        );
        totalProfit += profitMoney;
        totalProfitBB += profitBB;
        totalMinutes += game.sessionMinutes || 0;
      }
    });

    const gamesPlayed = playerGames.length;
    const avgProfit = gamesPlayed > 0 ? (totalProfit / gamesPlayed).toFixed(2) : '0.00';
    const avgProfitBB = gamesPlayed > 0 ? (totalProfitBB / gamesPlayed).toFixed(1) : '0.0';
    const totalHours = totalMinutes / 60;
    const hourlyProfit = totalHours > 0 ? (totalProfit / totalHours).toFixed(2) : '0.00';
    const hourlyBB = totalHours > 0 ? (totalProfitBB / totalHours).toFixed(1) : '0.0';

    return {
      gamesPlayed,
      totalProfit: totalProfit.toFixed(2),
      totalProfitBB: totalProfitBB.toFixed(1),
      avgProfit,
      avgProfitBB,
      hourlyProfit,
      hourlyBB
    };
  };

  const playerGames = getPlayerHistory(playerName);
  const stats = getPlayerStats(playerName);

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <button
        onClick={() => setViewPlayerDetail(null)}
        className="mb-4 flex items-center gap-2 text-green-600 hover:text-green-700"
      >
        <span className="w-5 h-5"><Icons.ArrowLeft /></span>
        Back to History
      </button>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg mb-6 border border-green-200">
        <h2 className="text-2xl font-bold mb-6 text-green-800 flex items-center gap-2">
          <span className="w-8 h-8"><Icons.User /></span>
          {playerName}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Games Played</p>
            <p className="text-2xl font-bold text-gray-800">{stats.gamesPlayed}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Total P/L</p>
            <p className={`text-2xl font-bold ${parseFloat(stats.totalProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.totalProfit}
            </p>
            <p className="text-sm text-gray-600 mt-1">{stats.totalProfitBB} BB</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Avg per Game</p>
            <p className={`text-2xl font-bold ${parseFloat(stats.avgProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.avgProfit}
            </p>
            <p className="text-sm text-gray-600 mt-1">{stats.avgProfitBB} BB</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Hourly P/L</p>
            <p className={`text-2xl font-bold ${parseFloat(stats.hourlyProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.hourlyProfit}
            </p>
            <p className="text-sm text-gray-600 mt-1">{stats.hourlyBB} BB</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-4">Game History</h3>
      <div className="space-y-4">
        {playerGames.map((game) => {
          const player = game.players.find(p => p.name === playerName);
          if (!player) return null;

          const { profitMoney, profitBB } = calculateProfitLoss(
            player,
            game.buyInChips,
            game.chipValue,
            game.bigBlind
          );

          return (
            <div key={game.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-bold text-gray-800">{game.gameName}</h4>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4"><Icons.Calendar /></span>
                      {new Date(game.date).toLocaleDateString('en-US')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4"><Icons.Clock /></span>
                      {formatDuration(game.sessionMinutes)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Blinds</div>
                  <div className="font-semibold">{game.smallBlind}/{game.bigBlind}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    (${((game.smallBlind || 0) / (game.chipValue || 1)).toFixed(2)}/${((game.bigBlind || 0) / (game.chipValue || 1)).toFixed(2)})
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">P/L Amount</p>
                    <p className={`text-xl font-bold ${profitMoney >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitMoney > 0 ? '+' : ''}${profitMoney}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">P/L BB</p>
                    <p className={`text-xl font-bold ${profitBB >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitBB > 0 ? '+' : ''}{profitBB}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PlayerDetail;
