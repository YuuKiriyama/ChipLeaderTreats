import { useState, useEffect, useRef } from 'react';
import { GuestPeerManager } from '../peer/PeerManager';
import { GuestMessage } from '../peer/MessageProtocol';
import { Icons } from '../components/Icons';
import PlayerTable from '../components/PlayerTable';
import SettlingChipsInput from '../components/SettlingChipsInput';
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
  const [pendingClaim, setPendingClaim] = useState(null);
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
    } else if (session && session.hostPeerId === hostPeerId && session.playerName && !session.playerId) {
      setPlayerName(session.playerName);
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
        setPendingClaim(null);
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
      onClaimPrompt: ({ playerId: claimId, name: seatName }) => {
        setPendingClaim({ playerId: claimId, name: seatName });
      },
      onRejoinResult: (success, reason) => {
        if (success) {
          hapticSuccess();
          setPendingClaim(null);
          setStatus('in-game');
          setActiveRole('guest');
        } else {
          const prev = getGuestSession();
          const savedName = prev?.playerName;
          clearGuestSession();
          clearActiveRole();
          setPlayerId(null);
          if (hostPeerId && savedName) {
            saveGuestSession({
              hostPeerId,
              playerName: savedName,
              playerId: null,
              gameId: null,
              lastGameState: null,
            });
            setPlayerName(savedName);
          }
          setErrorMsg(reason || 'Rejoin failed. Try again or enter your in-game name to reclaim your seat.');
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
        setPendingClaim(null);
        setPlayerId(id);
        setStatus('in-game');
        setActiveRole('guest');
        saveGuestSession({ hostPeerId, playerId: id, playerName: playerNameRef.current.trim(), gameId: null, lastGameState: null });
      },
      onJoinRejected: (reason) => { setErrorMsg(reason); setStatus('join-form'); },
      onClaimPrompt: ({ playerId: claimId, name: seatName }) => {
        setPendingClaim({ playerId: claimId, name: seatName });
      },
      onRejoinResult: (success, reason) => {
        if (success) {
          hapticSuccess();
          setPendingClaim(null);
          setStatus('in-game');
          setActiveRole('guest');
        } else {
          const prev = getGuestSession();
          const savedName = prev?.playerName;
          clearGuestSession();
          clearActiveRole();
          setPlayerId(null);
          if (hostPeerId && savedName) {
            saveGuestSession({
              hostPeerId,
              playerName: savedName,
              playerId: null,
              gameId: null,
              lastGameState: null,
            });
            setPlayerName(savedName);
          }
          setErrorMsg(reason || 'Rejoin failed');
          setStatus('join-form');
        }
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

  const handleConfirmClaimSeat = () => {
    if (!pendingClaim) return;
    hapticLight();
    const pid = pendingClaim.playerId;
    setPendingClaim(null);
    setPlayerId(pid);
    setActiveRole('guest');
    saveGuestSession({
      hostPeerId,
      playerId: pid,
      playerName: playerNameRef.current.trim(),
      gameId: null,
      lastGameState: null,
    });
    managerRef.current?.send(GuestMessage.CONFIRM_CLAIM, { playerId: pid });
    setStatus('in-game');
  };

  const handleCancelClaimSeat = () => {
    hapticLight();
    setPendingClaim(null);
    setErrorMsg('To join as a new player, choose a different name than an existing seat.');
  };

  const handleLeave = (skipConfirm = false) => {
    if (!skipConfirm) {
      const ok = confirm(
        'Leave? Your seat stays in the game. Reopen the host link to reconnect; you can reclaim your seat by name if your browser forgot the session.'
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 w-full max-w-sm border border-transparent dark:border-gray-800 relative">
          {pendingClaim && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/40 rounded-2xl">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-5 w-full border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Returning player?</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Is this you — the player already in this game named{' '}
                  <span className="font-bold text-gray-900 dark:text-gray-100">{pendingClaim.name}</span>?
                  Only confirm if you are reclaiming that seat. If you are a new player with the same name, cancel and pick another name.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmClaimSeat}
                    className="w-full py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
                  >
                    Yes, that&apos;s me
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelClaimSeat}
                    className="w-full py-2.5 text-gray-600 dark:text-gray-400 text-sm"
                  >
                    No — I&apos;ll use a different name
                  </button>
                </div>
              </div>
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">Join Game</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
            Enter the same name you used when you joined to see this game again. Scanning only registers you; you can close the page anytime.
          </p>

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
              onClick={() => { hapticLight(); setInitialBuyIns(initialBuyIns - 1); }}
              className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
            >−</button>
            <input
              type="number"
              value={initialBuyIns}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setInitialBuyIns(Number.isNaN(n) ? 0 : n);
              }}
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
                <p className="text-xs text-green-700/80 dark:text-green-400/80 mt-1">
                  Buy-ins are adjusted by the host only.
                </p>
                {gameState.gameStatus === 'playing' && myPlayer.earlyExitChips != null && (
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-2">
                    Host recorded your early exit with <span className="font-semibold">{myPlayer.earlyExitChips}</span> chips remaining.
                  </p>
                )}
              </div>
            </div>

            {gameState.gameStatus === 'settling' && (
              <>
                <p className="text-xs text-green-800 dark:text-green-300 mt-2 mb-1">
                  The host ended the game — enter your remaining chips below. If you closed the page, scan the QR or open the link again to reach this screen.
                </p>
                <SettlingChipsInput
                  theme="guest"
                  layout="inCard"
                  value={myPlayer.finalChips}
                  onCommit={handleSetFinalChips}
                  denominations={gameState.chipDenominations ?? []}
                />
              </>
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
