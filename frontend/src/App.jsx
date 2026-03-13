import { useState, useEffect } from 'react';
import { storage } from './utils/storage';
import { generateGameName as genGameName, formatElapsedTime } from './utils/helpers';
import { Icons } from './components/Icons';
import CurrentGame from './components/CurrentGame';
import History from './components/History';
import PlayerDetail from './components/PlayerDetail';

function App() {
  const [view, setView] = useState('current');
  const [chipValue, setChipValue] = useState('');
  const [buyInChips, setBuyInChips] = useState('');
  const [smallBlind, setSmallBlind] = useState(1);
  const [bigBlind, setBigBlind] = useState(2);
  const [gameName, setGameName] = useState('');
  const [gameStatus, setGameStatus] = useState('notStarted');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [buyIns, setBuyIns] = useState(1);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [viewPlayerDetail, setViewPlayerDetail] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    loadHistory();
    loadFavorites();
    checkConnection();
    
    const savedGameState = localStorage.getItem('currentGameState');
    if (savedGameState) {
      try {
        const state = JSON.parse(savedGameState);
        setGameName(state.gameName || '');
        setSmallBlind(state.smallBlind || 1);
        setBigBlind(state.bigBlind || 2);
        setBuyInChips(state.buyInChips || '');
        setChipValue(state.chipValue || '');
        setGameStatus(state.gameStatus || 'notStarted');
        setStartTime(state.startTime ? new Date(state.startTime) : null);
        setEndTime(state.endTime ? new Date(state.endTime) : null);
        setPlayers(state.players || []);
      } catch (error) {
        console.error('Failed to restore game state:', error);
        generateGameName();
      }
    } else {
      generateGameName();
    }
    
    const syncInterval = setInterval(() => {
      if (isOnline) {
        loadHistory();
        loadFavorites();
      }
    }, 30000);
    
    return () => {
      clearInterval(syncInterval);
    };
  }, [isOnline]);

  useEffect(() => {
    let interval;
    if (gameStatus === 'playing' && startTime) {
      interval = setInterval(() => {
        setElapsedTime(formatElapsedTime(startTime));
      }, 1000);
    } else {
      setElapsedTime('00:00:00');
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameStatus, startTime]);

  useEffect(() => {
    if (gameStatus !== 'notStarted') {
      const currentGameState = {
        gameName,
        smallBlind,
        bigBlind,
        buyInChips,
        chipValue,
        gameStatus,
        startTime: startTime ? startTime.toISOString() : null,
        endTime: endTime ? endTime.toISOString() : null,
        players,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('currentGameState', JSON.stringify(currentGameState));
    }
  }, [gameName, smallBlind, bigBlind, buyInChips, chipValue, gameStatus, startTime, endTime, players]);

  const generateGameName = () => {
    const name = genGameName();
    setGameName(name);
  };

  const checkConnection = async () => {
    const online = await storage.checkConnection();
    setIsOnline(online);
    if (online) {
      setLastSyncTime(new Date());
    }
  };

  const loadHistory = async () => {
    try {
      const result = await storage.get('poker-history');
      if (result) {
        const data = JSON.parse(result.value);
        setHistory(data);
        setLastSyncTime(new Date());
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory([]);
      setIsOnline(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const result = await storage.get('poker-favorites');
      if (result) {
        const data = JSON.parse(result.value);
        setFavorites(data);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setFavorites([]);
      setIsOnline(false);
    }
  };

  const saveHistory = async (newHistory) => {
    try {
      const success = await storage.set('poker-history', JSON.stringify(newHistory));
      if (success) {
        setHistory(newHistory);
        setLastSyncTime(new Date());
        return true;
      } else {
        console.error('Failed to save history');
        return false;
      }
    } catch (error) {
      console.error('Failed to save history:', error);
      setIsOnline(false);
      return false;
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await storage.set('poker-favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  };

  const toggleFavorite = (playerName) => {
    const newFavorites = favorites.includes(playerName)
      ? favorites.filter(name => name !== playerName)
      : [...favorites, playerName];
    saveFavorites(newFavorites);
  };

  const handleSmallBlindChange = (value) => {
    const numValue = value === '' ? '' : parseInt(value);
    setSmallBlind(numValue);
  };

  const handleSmallBlindBlur = () => {
    if (smallBlind && bigBlind && smallBlind > bigBlind) {
      alert('Small blind cannot exceed big blind');
      setSmallBlind(bigBlind);
    }
  };

  const handleBigBlindChange = (value) => {
    const numValue = value === '' ? '' : parseInt(value);
    setBigBlind(numValue);
  };

  const handleBigBlindBlur = () => {
    if (smallBlind && bigBlind && bigBlind < smallBlind) {
      alert('Big blind cannot be less than small blind');
      setBigBlind(smallBlind);
    }
  };

  const startGame = () => {
    if (!gameName.trim()) {
      alert('Please enter a game name first');
      return;
    }
    if (!buyInChips || !chipValue || !smallBlind || !bigBlind) {
      alert('Please fill in all game settings');
      return;
    }
    if (gameStatus === 'notStarted') {
      setGameStatus('playing');
      setStartTime(new Date());
      setEndTime(null);
    }
  };

  const endGame = () => {
    if (players.length === 0) {
      alert('Please add at least one player');
      return;
    }
    if (gameStatus === 'playing') {
      setGameStatus('ended');
      setEndTime(new Date());
    }
  };

  const resetGame = () => {
    setGameStatus('notStarted');
    setStartTime(null);
    setEndTime(null);
    setPlayers([]);
    generateGameName();
    
    localStorage.removeItem('currentGameState');
  };

  const addPlayer = () => {
    if (!playerName.trim()) {
      alert('Please enter a player name');
      return;
    }
    
    if (players.some(p => p.name === playerName.trim())) {
      alert('This player already exists. Duplicate names are not allowed.');
      return;
    }
    
    const newPlayer = {
      name: playerName.trim(),
      buyIns: buyIns || 1,
      endChips: '',
      id: Date.now()
    };
    
    setPlayers([...players, newPlayer]);
    setPlayerName('');
    setBuyIns(1);
  };

  const removePlayer = (playerId) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const updatePlayerBuyIns = (playerId, value) => {
    setPlayers(players.map(p => 
      p.id === playerId 
        ? { ...p, buyIns: value === '' ? 0 : parseInt(value) || 0 }
        : p
    ));
  };

  const updatePlayerEndChips = (playerId, value) => {
    setPlayers(players.map(p => 
      p.id === playerId 
        ? { ...p, endChips: value === '' ? '' : parseInt(value) || 0 }
        : p
    ));
  };

  const saveGame = async () => {
    if (!gameName.trim()) {
      alert('Please enter a game name');
      return;
    }

    if (!startTime || !endTime) {
      alert('Please start and end the game first');
      return;
    }

    if (players.length === 0) {
      alert('Please add at least one player');
      return;
    }

    const totalBuyIn = players.reduce((sum, p) => sum + ((p.buyIns || 0) * (buyInChips || 0)), 0);
    const totalEndChips = players.reduce((sum, p) => sum + (p.endChips || 0), 0);
    const difference = totalEndChips - totalBuyIn;
    
    if (difference !== 0) {
      const message = `Books don't balance! ${difference > 0 ? 'Over' : 'Under'} by ${Math.abs(difference).toLocaleString()} chips.\n\nForce save anyway?`;
      if (!confirm(message)) {
        return;
      }
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const sessionMinutes = Math.round((end - start) / (1000 * 60));

    const game = {
      id: Date.now(),
      gameName,
      date: new Date().toISOString(),
      smallBlind: parseInt(smallBlind) || 0,
      bigBlind: parseInt(bigBlind) || 0,
      chipValue: parseInt(chipValue) || 1,
      buyInChips: parseInt(buyInChips) || 0,
      sessionMinutes,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      players: players.map(p => ({
        ...p,
        buyIns: p.buyIns || 1,
        endChips: p.endChips || 0
      }))
    };

    const newHistory = [game, ...history];
    const success = await saveHistory(newHistory);
    if (success) {
      localStorage.removeItem('currentGameState');
      resetGame();
      alert('Game saved!');
    } else {
      alert('Failed to save game. Please check your network connection and try again.');
    }
  };

  const deleteGame = (gameId) => {
    if (confirm('Are you sure you want to delete this record?')) {
      const newHistory = history.filter(g => g.id !== gameId);
      saveHistory(newHistory);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <header className="mb-6">
          {/* Desktop layout */}
          <div className="hidden md:flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8"><Icons.DollarSign /></span>
              ChipLeaderTreats
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {lastSyncTime && (
                <span className="text-gray-500 text-xs">
                  {new Date(lastSyncTime).toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => {
                  storage.resetApiUrl();
                  checkConnection();
                  loadHistory();
                  loadFavorites();
                }}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                title="Refresh data and re-detect server"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {/* Mobile layout */}
          <div className="md:hidden">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-shrink-0">
                <span className="w-6 h-6 mt-1"><Icons.DollarSign /></span>
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold text-gray-800 leading-tight">ChipLeaderTreats</h1>
                </div>
              </div>
              
              <div className="flex flex-col items-center flex-shrink-0 text-xs">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                {lastSyncTime && (
                  <span className="text-gray-500 text-[10px] whitespace-nowrap">
                    {new Date(lastSyncTime).toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              <button
                onClick={() => {
                  storage.resetApiUrl();
                  checkConnection();
                  loadHistory();
                  loadFavorites();
                }}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors flex-shrink-0"
                title="Refresh data and re-detect server"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="grid grid-cols-2 gap-0">
            <button
              onClick={() => setView('current')}
              className={`py-4 text-lg font-semibold rounded-tl-lg transition-colors ${
                view === 'current'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Current Game
            </button>
            <button
              onClick={() => {
                setView('history');
                setViewPlayerDetail(null);
              }}
              className={`py-4 text-lg font-semibold rounded-tr-lg transition-colors ${
                view === 'history'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {view === 'current' && (
          <CurrentGame
            gameName={gameName}
            setGameName={setGameName}
            smallBlind={smallBlind}
            handleSmallBlindChange={handleSmallBlindChange}
            handleSmallBlindBlur={handleSmallBlindBlur}
            bigBlind={bigBlind}
            handleBigBlindChange={handleBigBlindChange}
            handleBigBlindBlur={handleBigBlindBlur}
            buyInChips={buyInChips}
            setBuyInChips={setBuyInChips}
            chipValue={chipValue}
            setChipValue={setChipValue}
            gameStatus={gameStatus}
            elapsedTime={elapsedTime}
            playerName={playerName}
            setPlayerName={setPlayerName}
            buyIns={buyIns}
            setBuyIns={setBuyIns}
            addPlayer={addPlayer}
            players={players}
            updatePlayerBuyIns={updatePlayerBuyIns}
            updatePlayerEndChips={updatePlayerEndChips}
            removePlayer={removePlayer}
            startGame={startGame}
            endGame={endGame}
            saveGame={saveGame}
            resetGame={resetGame}
          />
        )}

        {view === 'history' && !viewPlayerDetail && (
          <History
            history={history}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            deleteGame={deleteGame}
            setViewPlayerDetail={setViewPlayerDetail}
          />
        )}

        {view === 'history' && viewPlayerDetail && (
          <PlayerDetail
            playerName={viewPlayerDetail}
            history={history}
            setViewPlayerDetail={setViewPlayerDetail}
          />
        )}
      </div>
    </div>
  );
}

export default App;
