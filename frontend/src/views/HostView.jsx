import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { HostPeerManager } from '../peer/PeerManager';
import { Icons } from '../components/Icons';
import PlayerTable from '../components/PlayerTable';
import GameConfig from '../components/GameConfig';
import {
  getHostPeerId, setHostPeerId, clearHostPeerId,
  getGameState, saveGameState, clearGameState,
  appendGameHistory, setActiveRole, clearActiveRole,
} from '../utils/localStorage';
import { generateGameName, calculateBalance } from '../utils/helpers';
import { applyGameConfigChange, validateGameConfigForStart } from '../utils/gameConstraints';
import { hapticLight, hapticSuccess } from '../utils/haptics';

function generatePeerId() {
  return 'clt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function createInitialState(peerId, hostName) {
  return {
    gameId: 'game_' + Date.now().toString(36),
    gameName: generateGameName(),
    hostPeerId: peerId,
    smallBlind: 1,
    bigBlind: 2,
    buyInChips: null,
    chipValue: null,
    gameStatus: 'lobby',
    startTime: null,
    endTime: null,
    players: [
      {
        playerId: 'host',
        name: hostName || 'Host',
        buyIns: 1,
        finalChips: null,
        isHost: true,
        isConnected: true,
      },
    ],
  };
}

export default function HostView({ isResume, onExit }) {
  const [gameState, setGameState] = useState(null);
  const [peerReady, setPeerReady] = useState(false);
  const [error, setError] = useState(null);
  const [hostName, setHostName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(!isResume);
  const [copyHint, setCopyHint] = useState('');
  const managerRef = useRef(null);

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const initPeer = useCallback(async (state) => {
    const peerId = state.hostPeerId;

    const manager = new HostPeerManager({
      peerId,
      onStateChange: () => {},
      getState: () => stateRef.current,
      setState: (newState) => {
        setGameState(newState);
        saveGameState(newState);
      },
    });

    managerRef.current = manager;

    try {
      await manager.start();
      setPeerReady(true);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Resume existing game
  useEffect(() => {
    if (isResume) {
      setActiveRole('host');
      const saved = getGameState();
      if (saved) {
        const restored = {
          ...saved,
          players: saved.players.map((p) =>
            p.isHost ? p : { ...p, isConnected: false }
          ),
        };
        setGameState(restored);
        saveGameState(restored);
        initPeer(restored);
      }
    }
  }, [isResume, initPeer]);

  // Persist on every state change
  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  // Cleanup
  useEffect(() => {
    return () => {
      managerRef.current?.destroy();
    };
  }, []);

  const handleStartWithName = () => {
    hapticLight();
    setActiveRole('host');
    const name = hostName.trim() || 'Host';
    const peerId = generatePeerId();
    setHostPeerId(peerId);
    const state = createInitialState(peerId, name);
    setGameState(state);
    saveGameState(state);
    setShowNamePrompt(false);
    initPeer(state);
  };

  const updateConfig = (key, value) => {
    if (gameState.gameStatus !== 'lobby') return;
    const newState = applyGameConfigChange(gameState, key, value);
    setGameState(newState);
    managerRef.current?.broadcastState(newState);
  };

  const startGame = () => {
    const cfg = validateGameConfigForStart(gameState);
    if (!cfg.ok) {
      alert(cfg.message);
      return;
    }
    if (gameState.players.length < 2) {
      alert('Need at least 2 players');
      return;
    }
    hapticLight();
    const newState = {
      ...gameState,
      gameStatus: 'playing',
      startTime: new Date().toISOString(),
    };
    setGameState(newState);
    managerRef.current?.broadcastState(newState);
  };

  const settleGame = () => {
    hapticLight();
    const newState = {
      ...gameState,
      gameStatus: 'settling',
      endTime: new Date().toISOString(),
    };
    setGameState(newState);
    managerRef.current?.broadcastState(newState);
  };

  const finalizeGame = () => {
    const balance = calculateBalance(gameState.players, gameState.buyInChips);
    if (!balance.isBalanced) {
      const diff = balance.difference;
      if (!confirm(`Books don't balance! ${diff > 0 ? 'Over' : 'Under'} by ${Math.abs(diff)} chips. Save anyway?`)) {
        return;
      }
    }
    hapticLight();
    const finalState = { ...gameState, gameStatus: 'ended' };
    setGameState(finalState);
    appendGameHistory(finalState);
    clearGameState();
    clearActiveRole();
    managerRef.current?.broadcastState(finalState);
    alert('Game saved to history!');
  };

  const updatePlayerBuyIns = (playerId, delta) => {
    hapticLight();
    setGameState((prev) => {
      const newState = {
        ...prev,
        players: prev.players.map((p) =>
          p.playerId === playerId
            ? { ...p, buyIns: Math.max(1, p.buyIns + delta) }
            : p
        ),
      };
      managerRef.current?.broadcastState(newState);
      return newState;
    });
  };

  const updatePlayerFinalChips = (playerId, chips) => {
    const newState = {
      ...gameState,
      players: gameState.players.map((p) =>
        p.playerId === playerId ? { ...p, finalChips: chips } : p
      ),
    };
    setGameState(newState);
    managerRef.current?.broadcastState(newState);
  };

  const removePlayer = (playerId) => {
    if (playerId === 'host') return;
    if (!confirm('Remove this player?')) return;
    const newState = {
      ...gameState,
      players: gameState.players.filter((p) => p.playerId !== playerId),
    };
    setGameState(newState);
    managerRef.current?.broadcastState(newState);
  };

  const discardGame = () => {
    if (!confirm('Discard current game? All data will be lost.')) return;
    hapticLight();
    managerRef.current?.destroy();
    clearGameState();
    clearHostPeerId();
    clearActiveRole();
    onExit();
  };

  // Name prompt for new game
  if (showNamePrompt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 w-full max-w-sm border border-transparent dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">Your Name</h2>
          <input
            type="text"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={handleStartWithName}
            className="w-full mt-4 py-3 bg-green-600 text-white rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Create Game
          </button>
          <button
            onClick={onExit}
            className="w-full mt-2 py-3 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const handleRetryPeer = (newId = false) => {
    setError(null);
    setPeerReady(false);
    managerRef.current?.destroy();
    let state = stateRef.current;
    if (state) {
      if (newId) {
        const peerId = generatePeerId();
        setHostPeerId(peerId);
        state = { ...state, hostPeerId: peerId };
        setGameState(state);
        saveGameState(state);
      }
      initPeer(state);
    }
  };

  if (error) {
    const isIdConflict = error.includes('Peer ID already in use');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 text-center max-w-sm border border-transparent dark:border-gray-800">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-4">{error}</p>
          <div className="space-y-2">
            {isIdConflict ? (
              <button onClick={() => { hapticLight(); handleRetryPeer(true); }} className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Generate New ID &amp; Retry
              </button>
            ) : (
              <button onClick={() => { hapticLight(); handleRetryPeer(false); }} className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Retry
              </button>
            )}
            <button onClick={onExit} className="w-full px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const joinUrl = `${window.location.origin}${window.location.pathname}#/join/${gameState.hostPeerId}`;
  const guestCount = gameState.players.filter((p) => !p.isHost && p.isConnected).length;

  const copyJoinLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      hapticSuccess();
      setCopyHint('Copied!');
      setTimeout(() => setCopyHint(''), 2000);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = joinUrl;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        hapticSuccess();
        setCopyHint('Copied!');
        setTimeout(() => setCopyHint(''), 2000);
      } catch {
        setCopyHint('Copy failed');
        setTimeout(() => setCopyHint(''), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="w-6 h-6 text-green-600 dark:text-green-400"><Icons.DollarSign /></span>
            ChipLeaderTreats
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${peerReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-gray-600 dark:text-gray-300">
              {peerReady ? `${guestCount} guest${guestCount !== 1 ? 's' : ''} connected` : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* QR Code & Join Link */}
        {gameState.gameStatus !== 'ended' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow dark:shadow-gray-900/50 p-4 mb-4 text-center border border-transparent dark:border-gray-800">
            {gameState.gameStatus === 'lobby' ? (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Scan to join this game</p>
                <div className="inline-block p-3 bg-white rounded-xl border-2 border-gray-100 dark:border-gray-600">
                  <QRCodeSVG value={joinUrl} size={200} level="M" />
                </div>
              </>
            ) : (
              <details className="w-full">
                <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 list-none text-center">
                  Show QR Code
                </summary>
                <div className="flex justify-center w-full mt-2">
                  <div className="p-3 bg-white rounded-xl border-2 border-gray-100 dark:border-gray-600">
                    <QRCodeSVG value={joinUrl} size={150} level="M" />
                  </div>
                </div>
              </details>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 break-all select-all text-center max-w-full mx-auto">{joinUrl}</p>
            <button
              type="button"
              onClick={copyJoinLinkToClipboard}
              className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
            >
              <span className="w-4 h-4"><Icons.Copy /></span>
              {copyHint || 'Copy link'}
            </button>
          </div>
        )}

        {/* Game Config */}
        <GameConfig
          gameState={gameState}
          onChange={updateConfig}
          disabled={gameState.gameStatus !== 'lobby'}
        />

        {/* Player Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow dark:shadow-gray-900/50 p-4 mb-4 border border-transparent dark:border-gray-800">
          <PlayerTable
            players={gameState.players}
            buyInChips={gameState.buyInChips}
            chipValue={gameState.chipValue}
            bigBlind={gameState.bigBlind}
            gameStatus={gameState.gameStatus}
            isHost={true}
            onUpdateBuyIns={updatePlayerBuyIns}
            onUpdateFinalChips={updatePlayerFinalChips}
            onRemovePlayer={removePlayer}
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {gameState.gameStatus === 'lobby' && (
            <button
              onClick={startGame}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-5 h-5"><Icons.Play /></span>
              Start Game
            </button>
          )}

          {gameState.gameStatus === 'playing' && (
            <button
              onClick={settleGame}
              className="w-full py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-5 h-5"><Icons.Square /></span>
              End Game &amp; Settle
            </button>
          )}

          {gameState.gameStatus === 'settling' && (
            <button
              onClick={finalizeGame}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-5 h-5"><Icons.Save /></span>
              Finalize &amp; Save
            </button>
          )}

          {gameState.gameStatus === 'ended' && (
            <button
              onClick={() => { hapticLight(); onExit(); }}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Back to Home
            </button>
          )}

          {gameState.gameStatus !== 'ended' && (
            <button
              onClick={discardGame}
              className="w-full py-3 bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border border-red-200 dark:border-red-900 flex items-center justify-center gap-2"
            >
              <span className="w-5 h-5"><Icons.Trash2 /></span>
              Discard Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
