/**
 * PeerJS options with ICE servers from /api/turn-credentials (Vercel + Metered).
 * Credentials are short-lived and fetched server-side; nothing secret ships in the bundle.
 */

const BASE_PEER_OPTIONS = {
  host: '0.peerjs.com',
  port: 443,
  secure: true,
  path: '/',
  debug: 2,
};

/** STUN-only fallback when /api is unavailable (e.g. plain `npm run dev` without `vercel dev`). */
const FALLBACK_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

let cachedPeerOptions = null;
let fetchPromise = null;

function buildOptions(iceServers) {
  return {
    ...BASE_PEER_OPTIONS,
    config: { iceServers },
  };
}

/**
 * Returns PeerJS constructor options (with ICE/TURN). Results are cached for the session.
 */
export async function getPeerOptions() {
  if (cachedPeerOptions) {
    return cachedPeerOptions;
  }
  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const res = await fetch('/api/turn-credentials', { method: 'GET' });
      if (!res.ok) {
        throw new Error(`turn-credentials HTTP ${res.status}`);
      }
      const data = await res.json();
      const iceServers = Array.isArray(data) ? data : data.iceServers;
      if (!Array.isArray(iceServers) || iceServers.length === 0) {
        throw new Error('Invalid iceServers in response');
      }
      cachedPeerOptions = buildOptions(iceServers);
      return cachedPeerOptions;
    } catch (e) {
      console.warn(
        '[peerConfig] Could not load TURN credentials from /api/turn-credentials — using STUN-only fallback. Cross-network P2P may fail. For full stack locally run: vercel dev',
        e
      );
      const fallback = buildOptions(FALLBACK_ICE_SERVERS);
      cachedPeerOptions = fallback;
      return fallback;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/** Test / reset cache (optional, for advanced use). */
export function clearPeerOptionsCache() {
  cachedPeerOptions = null;
}
