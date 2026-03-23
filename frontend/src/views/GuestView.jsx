import { useState, useEffect, useRef } from 'react';
import { GuestPeerManager } from '../peer/PeerManager';
import { GuestMessage } from '../peer/MessageProtocol';
import { Icons } from '../components/Icons';
import PlayerTable from '../components/PlayerTable';
import {
  getGuestSession, saveGuestSession, clearGuestSession,
  setActiveRole, clearActiveRole,
} from '../utils/localStorage';

export default function GuestView({ hostPeerId, onExit }) {
  const [status, setStatus] = useState('connecting'); // connecting | join-form | in-game | disconnected | error
  const [connPhase, setConnPhase] = useState('signaling');
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [initialBuyIns, setInitialBuyIns] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const managerRef = useRef(null);
  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;

  useEffect(() => {
    const session = getGuestSession();
    const isRejoin = session && session.hostPeerId === hostPeerId && session.playerId;

    if (isRejoin && session.lastGameState) {
      setGameState(session.lastGameState);
      setPlayerId(session.playerId);
      setPlayerName(session.playerName || '');
    }

    const manager = new GuestPeerManager({
      hostPeerId,
      onPhaseChange: (phase) => setConnPhase(phase),
      onStateUpdate: (state) => {
        setGameState(state);
        setStatus('in-game');
        const currentSession = getGuestSession();
        if (currentSession) {
          saveGuestSession({ ...currentSession, lastGameState: state });
        }
      },
      onJoinAccepted: (id) => {
        setPlayerId(id);
        setStatus('in-game');
        setActiveRole('guest');
        saveGuestSession({
          hostPeerId,
          playerId: id,
          playerName: playerNameRef.current.trim(),
          gameId: null,
          lastGameState: null,
        });
      },
      onJoinRejected: (reason) => {
        setErrorMsg(reason);
        setStatus('join-form');
      },
      onRejoinResult: (success, reason) => {
        if (success) {
          setStatus('in-game');
          setActiveRole('guest');
        } else {
          clearGuestSession();
          clearActiveRole();
          setPlayerId(null);
          setErrorMsg(reason || 'Rejoin failed. Please join as a new player.');
          setStatus('join-form');
        }
      },
      onError: (msg) => {
        setErrorMsg(msg);
      },
      onDisconnect: () => {
        setStatus('disconnected');
      },
    });

    managerRef.current = manager;

    manager.connect(10000)
      .then(() => {
        if (isRejoin) {
          manager.send(GuestMessage.REJOIN, { playerId: session.playerId });
          setStatus('in-game');
        } else {
          setStatus('join-form');
        }
      })
      .catch(() => {
        if (isRejoin) {
          setStatus('disconnected');
        } else {
          setStatus('error');
          setErrorMsg('Could not connect to host. Make sure the host is online.');
        }
      });

    return () => {
      manager.destroy();
    };
  }, [hostPeerId]);

  const handleJoin = () => {
    if (!playerName.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    managerRef.current?.send(GuestMessage.JOIN, {
      name: playerName.trim(),
      buyIns: initialBuyIns,
    });
    setErrorMsg('');
  };

  const handleIncreaseBuyIn = () => {
    managerRef.current?.send(GuestMessage.INCREASE_BUYIN, { amount: 1 });
  };

  const handleSetFinalChips = (chips) => {
    managerRef.current?.send(GuestMessage.SET_FINAL_CHIPS, { chips });
  };

  const handleRetry = () => {
    setStatus('connecting');
    setErrorMsg('');
    managerRef.current?.destroy();

    const session = getGuestSession();
    const manager = new GuestPeerManager({
      hostPeerId,
      onPhaseChange: (phase) => setConnPhase(phase),
      onStateUpdate: (state) => {
        setGameState(state);
        setStatus('in-game');
        const currentSession = getGuestSession();
        if (currentSession) {
          saveGuestSession({ ...currentSession, lastGameState: state });
        }
      },
      onJoinAccepted: (id) => {
        setPlayerId(id);
        setStatus('in-game');
        setActiveRole('guest');
        saveGuestSession({ hostPeerId, playerId: id, playerName: playerNameRef.current.trim(), gameId: null, lastGameState: null });
      },
      onJoinRejected: (reason) => { setErrorMsg(reason); setStatus('join-form'); },
      onRejoinResult: (success, reason) => {
        if (success) { setStatus('in-game'); setActiveRole('guest'); }
        else { clearGuestSession(); clearActiveRole(); setPlayerId(null); setErrorMsg(reason || 'Rejoin failed'); setStatus('join-form'); }
      },
      onError: (msg) => setErrorMsg(msg),
      onDisconnect: () => setStatus('disconnected'),
    });
    managerRef.current = manager;

    manager.connect(10000).then(() => {
      if (session?.playerId) {
        manager.send(GuestMessage.REJOIN, { playerId: session.playerId });
      } else {
        setStatus('join-form');
      }
    }).catch(() => {
      setStatus('error');
      setErrorMsg('Could not connect to host.');
    });
  };

  const handleLeave = () => {
    clearGuestSession();
    clearActiveRole();
    managerRef.current?.destroy();
    if (onExit) onExit();
    else window.location.hash = '';
  };

  // ---- Render states ----

  if (status === 'connecting') {
    const phaseText = connPhase === 'signaling'
      ? 'Reaching signaling server...'
      : connPhase === 'connecting'
        ? 'Signaling OK. Connecting to host peer...'
        : 'Establishing data channel...';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Connecting to host...</p>
          <p className="text-xs text-gray-400 mt-2">{phaseText}</p>
          {gameState && (
            <p className="text-sm text-gray-400 mt-1">Showing cached game data</p>
          )}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center max-w-sm">
          <div className="w-12 h-12 mx-auto mb-3 text-red-500"><Icons.AlertCircle /></div>
          <p className="text-red-600 font-semibold mb-2">Connection Failed</p>
          <p className="text-gray-500 text-sm mb-4">{errorMsg}</p>
          <div className="space-y-2">
            <button onClick={handleRetry} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
              Retry
            </button>
            <button onClick={handleLeave} className="w-full py-3 text-gray-500 text-sm">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center max-w-sm">
          <div className="w-12 h-12 mx-auto mb-3 text-yellow-500"><Icons.AlertCircle /></div>
          <p className="text-yellow-600 font-semibold mb-2">Disconnected</p>
          <p className="text-gray-500 text-sm mb-4">Lost connection to host.</p>
          <div className="space-y-2">
            <button onClick={handleRetry} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
              Reconnect
            </button>
            <button onClick={handleLeave} className="w-full py-3 text-gray-500 text-sm">
              Leave Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'join-form') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Join Game</h2>

          {errorMsg && (
            <p className="text-red-500 text-sm mb-3 text-center">{errorMsg}</p>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            
            placeholder="Enter your name"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
            autoFocus
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">Initial Buy-ins</label>
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setInitialBuyIns(Math.max(1, initialBuyIns - 1))}
              className="w-10 h-10 bg-gray-200 rounded-lg text-lg font-bold hover:bg-gray-300"
            >−</button>
            <input
              type="number"
              value={initialBuyIns}
              onChange={(e) => setInitialBuyIns(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 h-10 text-center border border-gray-300 rounded-lg text-lg"
            />
            <button
              onClick={() => setInitialBuyIns(initialBuyIns + 1)}
              className="w-10 h-10 bg-gray-200 rounded-lg text-lg font-bold hover:bg-gray-300"
            >+</button>
          </div>

          <button
            onClick={handleJoin}
            className="w-full py-3 bg-green-600 text-white rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Join
          </button>
          <button onClick={handleLeave} className="w-full mt-2 py-3 text-gray-500 text-sm">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ---- In-game view ----
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Waiting for game data...</p>
      </div>
    );
  }

  const myPlayer = gameState.players.find((p) => p.playerId === playerId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-5 h-5 text-green-600"><Icons.DollarSign /></span>
            {gameState.gameName}
          </h1>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            gameState.gameStatus === 'lobby' ? 'bg-gray-100 text-gray-600' :
            gameState.gameStatus === 'playing' ? 'bg-blue-100 text-blue-700' :
            gameState.gameStatus === 'settling' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {gameState.gameStatus === 'lobby' ? 'Lobby' :
             gameState.gameStatus === 'playing' ? 'In Progress' :
             gameState.gameStatus === 'settling' ? 'Settling' : 'Ended'}
          </span>
        </div>

        {/* Game info */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-gray-500">Blinds</p>
              <p className="font-bold">{gameState.smallBlind}/{gameState.bigBlind}</p>
            </div>
            <div>
              <p className="text-gray-500">Buy-in</p>
              <p className="font-bold">{gameState.buyInChips || '—'} chips</p>
            </div>
            <div>
              <p className="text-gray-500">Chip Rate</p>
              <p className="font-bold">{gameState.chipValue || '—'}/$ </p>
            </div>
          </div>
        </div>

        {/* My status card */}
        {myPlayer && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">You: <span className="font-bold">{myPlayer.name}</span></p>
                <p className="text-sm text-green-600">Buy-ins: {myPlayer.buyIns}</p>
              </div>
              {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'lobby') && (
                <button
                  onClick={handleIncreaseBuyIn}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  + Buy-in
                </button>
              )}
            </div>

            {gameState.gameStatus === 'settling' && (
              <GuestFinalChipsInput
                value={myPlayer.finalChips}
                onCommit={handleSetFinalChips}
              />
            )}
          </div>
        )}

        {/* Player Table (read-only for guest) */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <PlayerTable
            players={gameState.players}
            buyInChips={gameState.buyInChips}
            chipValue={gameState.chipValue}
            bigBlind={gameState.bigBlind}
            gameStatus={gameState.gameStatus}
            isHost={false}
            myPlayerId={playerId}
          />
        </div>

        {/* Leave button */}
        {gameState.gameStatus !== 'ended' && (
          <button
            onClick={handleLeave}
            className="w-full py-3 text-red-500 text-sm hover:text-red-700"
          >
            Leave Game
          </button>
        )}

        {gameState.gameStatus === 'ended' && (
          <button
            onClick={handleLeave}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

function GuestFinalChipsInput({ value, onCommit }) {
  const [local, setLocal] = useState(value ?? '');
  const [submitted, setSubmitted] = useState(value != null && value !== '');

  useEffect(() => {
    setLocal(value ?? '');
    setSubmitted(value != null && value !== '');
  }, [value]);

  const handleSubmit = () => {
    const val = local === '' ? '' : parseInt(local) || 0;
    onCommit(val);
    setSubmitted(true);
  };

  return (
    <div className="mt-3 pt-3 border-t border-green-200">
      <label className="block text-sm font-medium text-green-800 mb-1">Your Final Chips</label>
      <div className="flex gap-2">
        <input
          type="number"
          value={local}
          onChange={(e) => { setLocal(e.target.value); setSubmitted(false); }}
          placeholder="Enter your remaining chips"
          className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
          min="0"
        />
        <button
          onClick={handleSubmit}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            submitted
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {submitted ? 'Sent' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
