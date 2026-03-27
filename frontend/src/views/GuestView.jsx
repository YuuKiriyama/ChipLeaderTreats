import { useState, useEffect, useRef } from 'react';
import { GuestPeerManager } from '../peer/PeerManager';
import { GuestMessage } from '../peer/MessageProtocol';
import { Icons } from '../components/Icons';
import PlayerTable from '../components/PlayerTable';
import {
  getGuestSession, saveGuestSession, clearGuestSession,
  setActiveRole, clearActiveRole,
} from '../utils/localStorage';
import { hapticLight, hapticSuccess } from '../utils/haptics';

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
        setErrorMsg('');
        setGameState(state);
        setStatus('in-game');
        const currentSession = getGuestSession();
        if (currentSession) {
          saveGuestSession({ ...currentSession, lastGameState: state });
        }
      },
      onJoinAccepted: (id) => {
        hapticSuccess();
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
          hapticSuccess();
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
    hapticLight();
    managerRef.current?.send(GuestMessage.JOIN, {
      name: playerName.trim(),
      buyIns: initialBuyIns,
    });
    setErrorMsg('');
  };

  const handleIncreaseBuyIn = () => {
    hapticLight();
    managerRef.current?.send(GuestMessage.INCREASE_BUYIN, { amount: 1 });
  };

  const handleSetFinalChips = (chips) => {
    managerRef.current?.send(GuestMessage.SET_FINAL_CHIPS, { chips });
  };

  const handleRetry = () => {
    hapticLight();
    setStatus('connecting');
    setErrorMsg('');
    managerRef.current?.destroy();

    const session = getGuestSession();
    const manager = new GuestPeerManager({
      hostPeerId,
      onPhaseChange: (phase) => setConnPhase(phase),
      onStateUpdate: (state) => {
        setErrorMsg('');
        setGameState(state);
        setStatus('in-game');
        const currentSession = getGuestSession();
        if (currentSession) {
          saveGuestSession({ ...currentSession, lastGameState: state });
        }
      },
      onJoinAccepted: (id) => {
        hapticSuccess();
        setPlayerId(id);
        setStatus('in-game');
        setActiveRole('guest');
        saveGuestSession({ hostPeerId, playerId: id, playerName: playerNameRef.current.trim(), gameId: null, lastGameState: null });
      },
      onJoinRejected: (reason) => { setErrorMsg(reason); setStatus('join-form'); },
      onRejoinResult: (success, reason) => {
        if (success) { hapticSuccess(); setStatus('in-game'); setActiveRole('guest'); }
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

  const handleLeave = (skipConfirm = false) => {
    if (!skipConfirm) {
      const ok = confirm(
        'Leave this game? You will need the host\'s invite link to rejoin with the same player.'
      );
      if (!ok) return;
    }
    hapticLight();
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 dark:border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Connecting to host...</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{phaseText}</p>
          {gameState && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Showing cached game data</p>
          )}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 text-center max-w-sm border border-transparent dark:border-gray-800">
          <div className="w-12 h-12 mx-auto mb-3 text-red-500"><Icons.AlertCircle /></div>
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Connection Failed</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{errorMsg}</p>
          <div className="space-y-2">
            <button onClick={handleRetry} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
              Retry
            </button>
            <button onClick={handleLeave} className="w-full py-3 text-gray-500 dark:text-gray-400 text-sm">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 text-center max-w-sm border border-transparent dark:border-gray-800">
          <div className="w-12 h-12 mx-auto mb-3 text-yellow-500"><Icons.AlertCircle /></div>
          <p className="text-yellow-600 dark:text-yellow-400 font-semibold mb-2">Disconnected</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Lost connection to host.</p>
          <div className="space-y-2">
            <button onClick={handleRetry} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
              Reconnect
            </button>
            <button onClick={handleLeave} className="w-full py-3 text-gray-500 dark:text-gray-400 text-sm">
              Leave Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'join-form') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 w-full max-w-sm border border-transparent dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">Join Game</h2>

          {errorMsg && (
            <p className="text-red-500 dark:text-red-400 text-sm mb-3 text-center">{errorMsg}</p>
          )}

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
            autoFocus
          />

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Buy-ins</label>
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => { hapticLight(); setInitialBuyIns(Math.max(1, initialBuyIns - 1)); }}
              className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
            >−</button>
            <input
              type="number"
              value={initialBuyIns}
              onChange={(e) => setInitialBuyIns(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 h-10 text-center border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => { hapticLight(); setInitialBuyIns(initialBuyIns + 1); }}
              className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
            >+</button>
          </div>

          <button
            onClick={handleJoin}
            className="w-full py-3 bg-green-600 text-white rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Join
          </button>
          <button onClick={handleLeave} className="w-full mt-2 py-3 text-gray-500 dark:text-gray-400 text-sm">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ---- In-game view ----
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-left">
              <p className="text-sm text-red-800 dark:text-red-300">{errorMsg}</p>
              <button
                type="button"
                className="mt-2 text-xs text-red-600 dark:text-red-400 underline"
                onClick={() => setErrorMsg('')}
              >
                Dismiss
              </button>
            </div>
          )}
          <p className="text-gray-500 dark:text-gray-400">Waiting for game data...</p>
        </div>
      </div>
    );
  }

  const myPlayer = gameState.players.find((p) => p.playerId === playerId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto p-4">
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex justify-between items-start gap-3">
            <p className="text-sm text-red-800 dark:text-red-300 flex-1">{errorMsg}</p>
            <button
              type="button"
              className="shrink-0 text-xs text-red-600 dark:text-red-400 font-medium hover:text-red-800 dark:hover:text-red-300"
              onClick={() => setErrorMsg('')}
            >
              Dismiss
            </button>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="w-5 h-5 text-green-600 dark:text-green-400"><Icons.DollarSign /></span>
            {gameState.gameName}
          </h1>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            gameState.gameStatus === 'lobby' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' :
            gameState.gameStatus === 'playing' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
            gameState.gameStatus === 'settling' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' :
            'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
          }`}>
            {gameState.gameStatus === 'lobby' ? 'Lobby' :
             gameState.gameStatus === 'playing' ? 'In Progress' :
             gameState.gameStatus === 'settling' ? 'Settling' : 'Ended'}
          </span>
        </div>

        {/* Game info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow dark:shadow-gray-900/50 p-4 mb-4 border border-transparent dark:border-gray-800">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Blinds</p>
              <p className="font-bold text-gray-900 dark:text-gray-100">{gameState.smallBlind}/{gameState.bigBlind}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Buy-in</p>
              <p className="font-bold text-gray-900 dark:text-gray-100">{gameState.buyInChips || '—'} chips</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Chip Rate</p>
              <p className="font-bold text-gray-900 dark:text-gray-100">{gameState.chipValue || '—'}/$ </p>
            </div>
          </div>
        </div>

        {/* My status card */}
        {myPlayer && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">You: <span className="font-bold">{myPlayer.name}</span></p>
                <p className="text-sm text-green-600 dark:text-green-400">Buy-ins: {myPlayer.buyIns}</p>
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
                denominations={gameState.chipDenominations ?? []}
              />
            )}
          </div>
        )}

        {/* Player Table (read-only for guest) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow dark:shadow-gray-900/50 p-4 mb-4 border border-transparent dark:border-gray-800">
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
            className="w-full py-3 text-red-500 dark:text-red-400 text-sm hover:text-red-700 dark:hover:text-red-300"
          >
            Leave Game
          </button>
        )}

        {gameState.gameStatus === 'ended' && (
          <button
            onClick={() => handleLeave(true)}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

function GuestFinalChipsInput({ value, onCommit, denominations }) {
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
    return sum + (Number.isNaN(n) || n < 0 ? 0 : n) * d.chips;
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

  return (
    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
      <label className="block text-sm font-medium text-green-800 dark:text-green-300 mb-1">
        Your final chips
      </label>

      {showBreakdown && (
        <div className="flex rounded-lg overflow-hidden border border-green-300 dark:border-green-700 mb-2">
          <button
            type="button"
            onClick={() => {
              setMode('total');
              setSubmitted(false);
            }}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              mode === 'total'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-green-800 dark:text-green-300'
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
              mode === 'breakdown'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-green-800 dark:text-green-300'
            }`}
          >
            By type
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
            className="flex-1 px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            min="0"
          />
          <button
            type="button"
            onClick={handleSubmitTotal}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
              submitted
                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {submitted ? 'Sent' : 'Submit'}
          </button>
        </div>
      )}

      {showBreakdown && mode === 'breakdown' && (
        <div className="space-y-2">
          {denoms.map((d) => (
            <div key={d.id} className="flex items-center gap-2">
              <label className="flex-1 text-xs text-green-700 dark:text-green-400 truncate">
                {d.label ? `${d.label} (${d.chips} ea.)` : `${d.chips} chips each`}
              </label>
              <input
                type="number"
                min="0"
                value={counts[d.id] ?? ''}
                onChange={(e) => {
                  setCounts((prev) => ({ ...prev, [d.id]: e.target.value }));
                  setSubmitted(false);
                }}
                placeholder="0"
                className="w-20 px-2 py-1.5 border border-green-300 dark:border-green-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-right"
              />
            </div>
          ))}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-sm text-green-800 dark:text-green-300">
              Total: <strong>{breakdownTotal}</strong> chips
            </span>
            <button
              type="button"
              onClick={handleSubmitBreakdown}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                submitted
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {submitted ? 'Sent' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
