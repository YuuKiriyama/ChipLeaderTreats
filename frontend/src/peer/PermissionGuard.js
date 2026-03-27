import { GuestMessage } from './MessageProtocol';
import { GAME_LIMITS } from '../utils/gameConstraints';

export function validateGuestAction(message, playerId, gameState) {
  const { type, payload } = message;

  switch (type) {
    case GuestMessage.JOIN: {
      if (!payload.name?.trim()) {
        return { ok: false, reason: 'Name is required' };
      }
      const joinAllowed =
        gameState.gameStatus === 'lobby' || gameState.gameStatus === 'playing';
      if (!joinAllowed) {
        return { ok: false, reason: 'Game already in progress' };
      }
      const nameExists = gameState.players.some(
        (p) => p.name.toLowerCase() === payload.name.trim().toLowerCase()
      );
      if (nameExists) {
        return { ok: false, reason: 'A player with this name already exists' };
      }
      return { ok: true };
    }

    case GuestMessage.REJOIN: {
      if (!payload.playerId) {
        return { ok: false, reason: 'Player ID is required' };
      }
      const player = gameState.players.find((p) => p.playerId === payload.playerId);
      if (!player) {
        return { ok: false, reason: 'Player not found. Please join as a new player.' };
      }
      return { ok: true };
    }

    case GuestMessage.INCREASE_BUYIN: {
      const amount = parseInt(payload.amount, 10);
      if (!amount || amount < 1) {
        return { ok: false, reason: 'Buy-in amount must be at least 1' };
      }
      if (amount > GAME_LIMITS.MAX_BUYIN_INCREASE_PER_REQUEST) {
        return {
          ok: false,
          reason: `You can add at most ${GAME_LIMITS.MAX_BUYIN_INCREASE_PER_REQUEST} buy-ins per action`,
        };
      }
      if (gameState.gameStatus !== 'playing' && gameState.gameStatus !== 'lobby') {
        return { ok: false, reason: 'Cannot add buy-in at this time' };
      }
      return { ok: true };
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
