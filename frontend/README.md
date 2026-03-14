# ChipLeaderTreats — Frontend

React single-page application for the P2P multiplayer poker score tracker.

## Quick Start

```bash
npm install
npm run dev       # Development server at http://localhost:3000
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

## Tech Stack

- **React 18** — UI framework with hooks for state management
- **Vite** — Build tool and dev server
- **Tailwind CSS** — Utility-first styling
- **PeerJS** — WebRTC abstraction for peer-to-peer data channels
- **qrcode.react** — QR code SVG generation

## Architecture

### P2P Layer (`src/peer/`)

- `PeerManager.js` — `HostPeerManager` and `GuestPeerManager` classes managing PeerJS connections, message routing, and reconnection
- `MessageProtocol.js` — Defines message types (JOIN, REJOIN, STATE_UPDATE, etc.) and serialization
- `PermissionGuard.js` — Validates guest actions server-side (on host) before applying state changes

### Views (`src/views/`)

- `HostView.jsx` — Full game management: name entry, QR code display, game config, player table, start/settle/save controls
- `GuestView.jsx` — Join flow, read-only game view, own buy-in increase, final chips submission, reconnection
- `HistoryView.jsx` — Browse and delete saved games with P/L breakdown

### Shared Components (`src/components/`)

- `GameConfig.jsx` — Blinds, buy-in chips, chip rate inputs (blur-to-sync)
- `PlayerTable.jsx` — Player list with buy-in controls, final chips input, P/L calculation, balance check
- `Icons.jsx` — SVG icon components

### Utils (`src/utils/`)

- `localStorage.js` — All persistence: host game state, guest session, game history, stable peer ID, active role (sessionStorage)
- `helpers.js` — Game name generation, duration formatting, P/L calculation, balance verification

### Routing

Hash-based routing in `App.jsx`:
- `#/` — Home screen (create game, resume, history)
- `#/join/:hostPeerId` — Guest join flow
- `#/history` — Game history

## Key Design Decisions

- **Blur-to-sync inputs** — Config and chip inputs use local state during editing, only broadcast on blur to avoid sending partial data
- **Delta-based buy-in updates** — Buy-in +/- buttons send deltas, computed inside `setGameState(prev => ...)` to prevent race conditions
- **sessionStorage for role** — Tracks host/guest role per-tab to prevent UI confusion when testing with multiple tabs in the same browser
- **Stable host Peer ID** — Stored in localStorage so guests can reconnect to the same host after browser restart
