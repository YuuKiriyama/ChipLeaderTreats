import Peer from 'peerjs';
import { createMessage, parseMessage, HostMessage, GuestMessage } from './MessageProtocol';
import { validateGuestAction } from './PermissionGuard';
import { getPeerOptions } from './peerConfig';

function generateId(prefix = 'clt') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ==================== Host PeerManager ====================

export class HostPeerManager {
  constructor({ peerId, onStateChange, getState, setState }) {
    this.peerId = peerId;
    this.peer = null;
    this.connections = new Map(); // playerId -> DataConnection
    this.onStateChange = onStateChange;
    this.getState = getState;
    this.setState = setState;
    this._destroyed = false;
  }

  async start() {
    const peerOptions = await getPeerOptions();
    return new Promise((resolve, reject) => {
      this.peer = new Peer(this.peerId, peerOptions);

      this.peer.on('open', (id) => {
        console.log('Host peer opened:', id);
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this._handleConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('Host peer error:', err);
        if (err.type === 'unavailable-id') {
          reject(new Error('Peer ID already in use. Please try again.'));
        } else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error' || err.type === 'socket-closed') {
          reject(new Error('Network error. Please check your connection and try again.'));
        } else {
          reject(new Error(err.message || `Peer error: ${err.type || 'unknown'}`));
        }
      });

      this.peer.on('disconnected', () => {
        if (!this._destroyed) {
          console.log('Host disconnected from signaling, reconnecting...');
          this.peer.reconnect();
        }
      });
    });
  }

  _bindGuestConnection(playerId, conn) {
    const prev = this.connections.get(playerId);
    if (prev && prev !== conn) {
      try {
        prev.close();
      } catch (_) {
        /* ignore */
      }
    }
    this.connections.set(playerId, conn);
  }

  _handleConnection(conn) {
    let assignedPlayerId = null;

    conn.on('open', () => {
      console.log('Guest connected:', conn.peer);
    });

    conn.on('data', (raw) => {
      const msg = parseMessage(raw);
      if (!msg) return;

      const state = this.getState();

      if (msg.type === GuestMessage.JOIN) {
        const validation = validateGuestAction(msg, null, state);
        if (!validation.ok) {
          conn.send(createMessage(HostMessage.JOIN_REJECTED, { reason: validation.reason }));
          return;
        }

        const trimmedName = msg.payload.name.trim();
        const existingSeat = state.players.find(
          (p) => !p.isHost && p.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (existingSeat) {
          conn.send(createMessage(HostMessage.CLAIM_PROMPT, {
            playerId: existingSeat.playerId,
            name: existingSeat.name,
          }));
          return;
        }

        assignedPlayerId = generateId('player');
        const newPlayer = {
          playerId: assignedPlayerId,
          name: trimmedName,
          buyIns: parseInt(msg.payload.buyIns) || 1,
          finalChips: null,
          isHost: false,
        };

        const newState = {
          ...state,
          players: [...state.players, newPlayer],
        };

        this._bindGuestConnection(assignedPlayerId, conn);
        this.setState(newState);
        conn.send(createMessage(HostMessage.JOIN_ACCEPTED, { playerId: assignedPlayerId }));
        this._broadcast(newState);
        return;
      }

      if (msg.type === GuestMessage.REJOIN || msg.type === GuestMessage.CONFIRM_CLAIM) {
        const validation = validateGuestAction(msg, null, state);
        if (!validation.ok) {
          conn.send(createMessage(HostMessage.REJOIN_FAILED, { reason: validation.reason }));
          return;
        }

        assignedPlayerId = msg.payload.playerId;
        this._bindGuestConnection(assignedPlayerId, conn);
        conn.send(createMessage(HostMessage.REJOIN_ACCEPTED, {}));
        this._broadcast(state);
        return;
      }

      // All other messages require an assigned playerId
      if (!assignedPlayerId) {
        conn.send(createMessage(HostMessage.ERROR, { message: 'Not joined yet' }));
        return;
      }

      const validation = validateGuestAction(msg, assignedPlayerId, state);
      if (!validation.ok) {
        conn.send(createMessage(HostMessage.ERROR, { message: validation.reason }));
        return;
      }

      let newState = state;

      switch (msg.type) {
        case GuestMessage.CHANGE_NAME: {
          newState = {
            ...state,
            players: state.players.map((p) =>
              p.playerId === assignedPlayerId
                ? { ...p, name: msg.payload.name.trim() }
                : p
            ),
          };
          break;
        }

        case GuestMessage.SET_FINAL_CHIPS: {
          const chips = parseInt(msg.payload.chips);
          newState = {
            ...state,
            players: state.players.map((p) =>
              p.playerId === assignedPlayerId
                ? { ...p, finalChips: chips }
                : p
            ),
          };
          break;
        }
      }

      this.setState(newState);
      this._broadcast(newState);
    });

    conn.on('close', () => {
      if (assignedPlayerId && !this._destroyed) {
        const current = this.connections.get(assignedPlayerId);
        if (current === conn) {
          console.log('Guest disconnected:', assignedPlayerId);
          this.connections.delete(assignedPlayerId);
        }
      }
    });
  }

  _broadcast(state) {
    const msg = createMessage(HostMessage.STATE_UPDATE, { gameState: state });
    for (const [, conn] of this.connections) {
      if (conn.open) {
        conn.send(msg);
      }
    }
    this.onStateChange(state);
  }

  broadcastState(state) {
    this._broadcast(state || this.getState());
  }

  destroy() {
    this._destroyed = true;
    if (this.peer) {
      this.peer.destroy();
    }
  }
}

// ==================== Guest PeerManager ====================

export class GuestPeerManager {
  constructor({
    hostPeerId,
    onStateUpdate,
    onJoinAccepted,
    onJoinRejected,
    onClaimPrompt,
    onRejoinResult,
    onError,
    onDisconnect,
    onPhaseChange,
  }) {
    this.hostPeerId = hostPeerId;
    this.peer = null;
    this.conn = null;
    this._phase = 'init';
    this.onStateUpdate = onStateUpdate;
    this.onJoinAccepted = onJoinAccepted;
    this.onJoinRejected = onJoinRejected;
    this.onClaimPrompt = onClaimPrompt;
    this.onRejoinResult = onRejoinResult;
    this.onError = onError;
    this.onDisconnect = onDisconnect;
    this.onPhaseChange = onPhaseChange;
    this._destroyed = false;
  }

  async connect(timeoutMs = 15000) {
    const peerOptions = await getPeerOptions();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Connection timed out. The host may be offline.'));
      }, timeoutMs);

      this._phase = 'signaling';
      this.onPhaseChange?.('signaling');

      this.peer = new Peer(peerOptions);

      this.peer.on('open', (myId) => {
        console.log('Guest registered on signaling server:', myId);
        this._phase = 'connecting';
        this.onPhaseChange?.('connecting');

        this.conn = this.peer.connect(this.hostPeerId, { reliable: true });

        this.conn.on('open', () => {
          clearTimeout(timer);
          this._phase = 'connected';
          this.onPhaseChange?.('connected');
          console.log('Data channel open with host:', this.hostPeerId);
          this._setupDataHandler();
          resolve();
        });

        this.conn.on('close', () => {
          if (!this._destroyed) {
            console.log('Disconnected from host');
            this.onDisconnect?.();
          }
        });

        this.conn.on('error', (err) => {
          clearTimeout(timer);
          console.error('Data connection error:', err);
          reject(new Error('Failed to establish data channel with host.'));
        });
      });

      this.peer.on('error', (err) => {
        clearTimeout(timer);
        console.error('Guest peer error:', err.type, err);
        if (err.type === 'peer-unavailable') {
          reject(new Error('Host not found. The host may have closed the game.'));
        } else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
          reject(new Error('Cannot reach signaling server. Check your network.'));
        } else {
          reject(new Error(`Connection error: ${err.type || err.message}`));
        }
      });

      this.peer.on('disconnected', () => {
        if (!this._destroyed) {
          this.peer.reconnect();
        }
      });
    });
  }

  _setupDataHandler() {
    this.conn.on('data', (raw) => {
      const msg = parseMessage(raw);
      if (!msg) return;

      switch (msg.type) {
        case HostMessage.STATE_UPDATE:
          this.onStateUpdate?.(msg.payload.gameState);
          break;
        case HostMessage.JOIN_ACCEPTED:
          this.onJoinAccepted?.(msg.payload.playerId);
          break;
        case HostMessage.JOIN_REJECTED:
          this.onJoinRejected?.(msg.payload.reason);
          break;
        case HostMessage.CLAIM_PROMPT:
          this.onClaimPrompt?.(msg.payload);
          break;
        case HostMessage.REJOIN_ACCEPTED:
          this.onRejoinResult?.(true);
          break;
        case HostMessage.REJOIN_FAILED:
          this.onRejoinResult?.(false, msg.payload.reason);
          break;
        case HostMessage.ERROR:
          this.onError?.(msg.payload.message);
          break;
      }
    });
  }

  send(type, payload = {}) {
    if (this.conn?.open) {
      this.conn.send(createMessage(type, payload));
    }
  }

  destroy() {
    this._destroyed = true;
    if (this.peer) {
      this.peer.destroy();
    }
  }
}
