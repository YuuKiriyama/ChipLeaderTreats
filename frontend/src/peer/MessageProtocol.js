// Message types sent from Guest to Host
export const GuestMessage = {
  JOIN: 'JOIN',
  REJOIN: 'REJOIN',
  INCREASE_BUYIN: 'INCREASE_BUYIN',
  CHANGE_NAME: 'CHANGE_NAME',
  SET_FINAL_CHIPS: 'SET_FINAL_CHIPS',
};

// Message types sent from Host to Guest(s)
export const HostMessage = {
  STATE_UPDATE: 'STATE_UPDATE',
  JOIN_ACCEPTED: 'JOIN_ACCEPTED',
  JOIN_REJECTED: 'JOIN_REJECTED',
  REJOIN_ACCEPTED: 'REJOIN_ACCEPTED',
  REJOIN_FAILED: 'REJOIN_FAILED',
  ERROR: 'ERROR',
};

export function createMessage(type, payload = {}) {
  return JSON.stringify({ type, payload, ts: Date.now() });
}

export function parseMessage(raw) {
  try {
    const msg = JSON.parse(raw);
    if (!msg.type) return null;
    return msg;
  } catch {
    return null;
  }
}
