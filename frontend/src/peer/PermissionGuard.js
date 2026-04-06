import { GuestMessage } from './MessageProtocol';

export function validateGuestAction(message, playerId, gameState) {
  const { type, payload } = message;

  switch (type) {
    case GuestMessage.JOIN: {
      if (!payload.name?.trim()) {
        return { ok: false, reason: 'Name is required' };
      }
      const joinAllowed =
        gameState.gameStatus === 'lobby' ||
        gameState.gameStatus === 'playing' ||
        gameState.gameStatus === 'settling';
      if (!joinAllowed) {
        const reason =
          gameState.gameStatus === 'ended'
            ? 'This game has ended'
            : 'Game already in progress';
        return { ok: false, reason };
      }
      const trimmed = payload.name.trim();
      const existing = gameState.players.find(
        (p) => !p.isHost && p.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) {
        if (existing.isConnected) {
          return {
            ok: false,
            reason: 'That name is taken by a player who is online. Choose a different name.',
          };
        }
        return { ok: true };
      }
      return { ok: true };
    }

    case GuestMessage.REJOIN:
    case GuestMessage.CONFIRM_CLAIM: {
      if (!payload.playerId) {
        return { ok: false, reason: 'Player ID is required' };
      }
      const player = gameState.players.find((p) => p.playerId === payload.playerId);
      if (!player) {
        return { ok: false, reason: 'Player not found. Please join as a new player.' };
      }
      if (player.isHost) {
        return { ok: false, reason: 'Invalid player' };
      }
      if (player.isConnected) {
        return { ok: false, reason: 'That seat is already connected. Use another device or ask the host.' };
      }
      return { ok: true };
    }

    case GuestMessage.INCREASE_BUYIN: {
      return { ok: false, reason: 'Buy-ins can only be changed by the host' };
    }

    case GuestMessage.CHANGE_NAME: {
      if (!payload.name?.trim()) {
        return { ok: false, reason: 'Name is required' };
      }
      const nameTaken = gameState.players.some(
        (p) => p.playerId !== playerId && p.name.toLowerCase() === payload.name.trim().toLowerCase()
      );
      if (nameTaken) {
        return { ok: false, reason: 'This name is already taken' };
      }
      return { ok: true };
    }

    case GuestMessage.SET_FINAL_CHIPS: {
      if (gameState.gameStatus !== 'settling') {
        return { ok: false, reason: 'Game is not in settlement phase' };
      }
      const chips = parseInt(payload.chips);
      if (isNaN(chips) || chips < 0) {
        return { ok: false, reason: 'Invalid chip count' };
      }
      return { ok: true };
    }

    default:
      return { ok: false, reason: 'Unknown action' };
  }
}
