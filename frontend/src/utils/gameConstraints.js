/** Central limits for game config and guest actions (host + PermissionGuard). */

export const GAME_LIMITS = {
  MIN_BLIND: 1,
  MAX_BLIND: 1_000_000,
  MIN_BUYIN_CHIPS: 1,
  MAX_BUYIN_CHIPS: 2_000_000_000,
  MIN_CHIP_VALUE: 1,
  MAX_CHIP_VALUE: 1_000_000_000,
  /** Max buy-ins a guest can add in a single INCREASE_BUYIN message (anti-abuse). */
  MAX_BUYIN_INCREASE_PER_REQUEST: 50,
  MAX_GAME_NAME_LENGTH: 200,
  /** Optional chip denominations for guest settling: host sets value each; guest enters count per value. */
  MAX_CHIP_DENOMINATION_TYPES: 16,
  MIN_CHIP_DENOM_VALUE: 1,
  MAX_CHIP_DENOM_VALUE: 2_000_000_000,
};

function clampInt(n, min, max, fallback) {
  if (typeof n !== 'number' || Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function parseNullableInt(v) {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseInt(v, 10);
  if (Number.isNaN(n)) return null;
  return n;
}

/**
 * Apply a single lobby config field change with clamping and blind ordering (BB >= SB).
 */
export function applyGameConfigChange(prevState, key, value) {
  const L = GAME_LIMITS;

  if (key === 'gameName') {
    const name = String(value ?? '').trim().slice(0, L.MAX_GAME_NAME_LENGTH);
    return { ...prevState, gameName: name || prevState.gameName };
  }

  if (key === 'smallBlind') {
    const sbRaw = parseNullableInt(value);
    const sb = sbRaw == null ? L.MIN_BLIND : clampInt(sbRaw, L.MIN_BLIND, L.MAX_BLIND, L.MIN_BLIND);
    let bb = parseNullableInt(prevState.bigBlind) ?? L.MIN_BLIND;
    bb = clampInt(bb, L.MIN_BLIND, L.MAX_BLIND, L.MIN_BLIND);
    if (bb < sb) bb = sb;
    return { ...prevState, smallBlind: sb, bigBlind: bb };
  }

  if (key === 'bigBlind') {
    const sb = parseNullableInt(prevState.smallBlind) ?? L.MIN_BLIND;
    const sbClamped = clampInt(sb, L.MIN_BLIND, L.MAX_BLIND, L.MIN_BLIND);
    const bbRaw = parseNullableInt(value);
    let bb = bbRaw == null ? sbClamped : clampInt(bbRaw, L.MIN_BLIND, L.MAX_BLIND, L.MIN_BLIND);
    if (bb < sbClamped) bb = sbClamped;
    return { ...prevState, smallBlind: sbClamped, bigBlind: bb };
  }

  if (key === 'buyInChips') {
    const n = parseNullableInt(value);
    if (n == null || n < L.MIN_BUYIN_CHIPS) {
      return { ...prevState, buyInChips: null };
    }
    return { ...prevState, buyInChips: Math.min(L.MAX_BUYIN_CHIPS, n) };
  }

  if (key === 'chipValue') {
    const n = parseNullableInt(value);
    if (n == null || n < L.MIN_CHIP_VALUE) {
      return { ...prevState, chipValue: null };
    }
    return { ...prevState, chipValue: Math.min(L.MAX_CHIP_VALUE, n) };
  }

  if (key === 'chipDenominations') {
    const raw = Array.isArray(value) ? value : [];
    const sanitized = raw.slice(0, L.MAX_CHIP_DENOMINATION_TYPES).map((row, i) => {
      const denomRaw = parseNullableInt(row.value ?? row.chips);
      let denomValue =
        denomRaw == null || denomRaw < L.MIN_CHIP_DENOM_VALUE
          ? L.MIN_CHIP_DENOM_VALUE
          : Math.min(L.MAX_CHIP_DENOM_VALUE, denomRaw);
      const id =
        typeof row.id === 'string' && row.id.trim()
          ? row.id.trim().slice(0, 64)
          : `cd_${Date.now().toString(36)}_${i}_${Math.random().toString(36).slice(2, 8)}`;
      return { id, value: denomValue };
    });
    return { ...prevState, chipDenominations: sanitized };
  }

  return { ...prevState, [key]: value };
}

/**
 * Validate config before starting the game (host).
 */
export function validateGameConfigForStart(gameState) {
  const L = GAME_LIMITS;
  const sb = gameState.smallBlind;
  const bb = gameState.bigBlind;
  const bio = gameState.buyInChips;
  const cv = gameState.chipValue;

  if (bio == null || cv == null) {
    return { ok: false, message: 'Please fill in buy-in chips and chip rate.' };
  }
  if (typeof sb !== 'number' || typeof bb !== 'number' || sb < L.MIN_BLIND || bb < L.MIN_BLIND) {
    return { ok: false, message: 'Small and big blind must be at least 1.' };
  }
  if (bb < sb) {
    return { ok: false, message: 'Big blind must be greater than or equal to small blind.' };
  }
  if (bio < L.MIN_BUYIN_CHIPS || bio > L.MAX_BUYIN_CHIPS) {
    return { ok: false, message: `Buy-in chips must be between ${L.MIN_BUYIN_CHIPS} and ${L.MAX_BUYIN_CHIPS.toLocaleString()}.` };
  }
  if (cv < L.MIN_CHIP_VALUE || cv > L.MAX_CHIP_VALUE) {
    return { ok: false, message: `Chips per $1 must be between ${L.MIN_CHIP_VALUE} and ${L.MAX_CHIP_VALUE.toLocaleString()}.` };
  }
  return { ok: true };
}
