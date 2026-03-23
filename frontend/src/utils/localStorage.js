const KEYS = {
  HOST_PEER_ID: 'clt-host-peer-id',
  GAME_STATE: 'clt-game-state',
  GAME_HISTORY: 'clt-game-history',
  GUEST_SESSION: 'clt-guest-session',
  ACTIVE_ROLE: 'clt-active-role',
};

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to persist ${key}:`, e);
  }
}

// ==================== Host Storage ====================

export function getHostPeerId() {
  return localStorage.getItem(KEYS.HOST_PEER_ID);
}

export function setHostPeerId(id) {
  localStorage.setItem(KEYS.HOST_PEER_ID, id);
}

export function getGameState() {
  return safeGet(KEYS.GAME_STATE);
}

export function saveGameState(state) {
  safeSet(KEYS.GAME_STATE, state);
}

export function clearGameState() {
  localStorage.removeItem(KEYS.GAME_STATE);
}

export function clearHostPeerId() {
  localStorage.removeItem(KEYS.HOST_PEER_ID);
}

export function getGameHistory() {
  return safeGet(KEYS.GAME_HISTORY) || [];
}

export function appendGameHistory(game) {
  const history = getGameHistory();
  history.unshift(game);
  safeSet(KEYS.GAME_HISTORY, history);
}

export function deleteGameFromHistory(gameId) {
  const history = getGameHistory().filter((g) => g.gameId !== gameId);
  safeSet(KEYS.GAME_HISTORY, history);
}

// ==================== Guest Storage ====================

export function getGuestSession() {
  return safeGet(KEYS.GUEST_SESSION);
}

export function saveGuestSession(session) {
  safeSet(KEYS.GUEST_SESSION, session);
}

export function clearGuestSession() {
  localStorage.removeItem(KEYS.GUEST_SESSION);
}

// ==================== Active Role (sessionStorage, per-tab) ====================

export function getActiveRole() {
  return sessionStorage.getItem(KEYS.ACTIVE_ROLE);
}

export function setActiveRole(role) {
  sessionStorage.setItem(KEYS.ACTIVE_ROLE, role);
}

export function clearActiveRole() {
  sessionStorage.removeItem(KEYS.ACTIVE_ROLE);
}
