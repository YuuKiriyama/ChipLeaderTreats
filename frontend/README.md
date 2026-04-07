# ChipLeaderTreats — Frontend

React SPA for the P2P poker score tracker (host + guests over WebRTC).

## Quick Start

```bash
npm install
npm run dev       # http://localhost:3000 (see vite.config.js: host 0.0.0.0)
npm run build     # Output: dist/
npm run preview   # Preview production build
```

## Tech Stack

- **React 18** — UI
- **Vite** — Dev server & build
- **Tailwind CSS** — Styling
- **PeerJS** — WebRTC data channels
- **qrcode.react** — QR for join URLs

## Architecture

### P2P (`src/peer/`)

- `peerConfig.js` — Loads ICE/TURN from `/api/turn-credentials` when available; STUN-only fallback for plain Vite dev
- `PeerManager.js` — `HostPeerManager` / `GuestPeerManager`: JOIN, REJOIN, CONFIRM_CLAIM (name reclaim), state broadcast
- `MessageProtocol.js` — Message types and JSON serialization
- `PermissionGuard.js` — Validates guest messages on the host (buy-in changes from guests are rejected)

### Views (`src/views/`)

- `HostView.jsx` — Create game, QR, config, player table (buy-ins, early exit chips, settlement), start / end / save
- `GuestView.jsx` — Join by name, optional reclaim confirmation, read-only state, settlement chip entry
- `HistoryView.jsx` — Local saved games

### Shared components (`src/components/`)

- `GameConfig.jsx` — Blinds, buy-in chips, chip rate, denominations
- `PlayerTable.jsx` — Buy-in controls (host only), early-exit column while playing, final chips, P/L, balance line
- `SettlingChipsInput.jsx` — Total or per-denomination settlement entry
- `ThemeToggle.jsx` / `ThemeContext.jsx` — Theme switching

### Utils (`src/utils/`)

- `localStorage.js` — Host state, guest session, history, active role (`sessionStorage`)
- `helpers.js` — P/L, balance, formatting
- `gameConstraints.js` — Numeric limits for lobby config

### Routing (`App.jsx`)

- `#/` — Home
- `#/join/:hostPeerId` — Guest flow
- `#/history` — History

## Design notes

- **Blur-to-sync** — Many numeric fields commit on blur to avoid partial broadcasts
- **Host-only buy-ins** — Deltas applied in `HostView`; guests cannot send `INCREASE_BUYIN`
- **Guest session** — Stored under `clt-guest-session`; reconnect or same-name reclaim when the cache is missing
- **Stable host Peer ID** — Stored so guests can resume the same join URL after refresh (when the host still runs the same game)

For deployment and TURN setup, see the **repository root `README.md`**.
