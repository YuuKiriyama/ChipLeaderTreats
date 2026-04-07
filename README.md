# ChipLeaderTreats

A peer-to-peer multiplayer poker score tracker. No server, no accounts — open the link, create a game, and share the QR code.

## How It Works

```
Host opens website ──> Creates game ──> QR code generated
                                              │
                                    Guests scan QR code
                                              │
                               WebRTC P2P connection established
                                              │
                              Real-time game state sync via DataChannel
```

- **Host** creates a game on their device and holds the authoritative game state
- **Guests** scan the QR code (or open the link) to register and view the game; the link is mainly for **joining / viewing** — staying connected is optional
- Communication is direct between devices via WebRTC (PeerJS)
- Game data is stored in the **host’s** browser (`localStorage`), not on your own backend
- The deployed site (e.g. Vercel) serves static files plus a small **serverless** endpoint (`/api/turn-credentials`) that fetches short-lived TURN credentials from Metered — the API key stays on the server, not in the browser bundle

## Features

- **QR code join** — Host shows a QR code; guests open the same URL with the host’s Peer ID in the hash
- **Real-time sync** — Game state is broadcast to connected guests over WebRTC data channels
- **Permissions** — Host sets blinds, buy-in chip value, chip denominations, and **all buy-in counts** (per player). Guests cannot change buy-ins remotely. Guests can submit **final / settlement** chip totals when the host enters the settlement phase
- **Negative buy-ins** — Buy-in count can be negative to represent unloading chips / adjustments (卸码)
- **Reconnection & name reclaim** — Guests keep a session in `localStorage` when possible; if the browser loses the session, they can **enter the same in-game name** and confirm they are reclaiming that seat (not a new player with a duplicate name)
- **No guest “online” indicator** — Registration is by name; a new connection replaces the previous one for the same seat
- **Early exit while playing** — During an active game, the host can enter **remaining chips** for any player who left early; those values carry into settlement when the host ends the game
- **Settlement & history** — Host ends the game and shares the link so guests can enter remaining chips; P/L is shown in dollars and BB; completed games are saved to the host’s local history
- **Offline-first** — After load, no app server is required; PeerJS signaling is only used to establish the WebRTC connection

## Tech Stack

- **React 18** + **Vite** + **Tailwind CSS**
- **PeerJS** (WebRTC data channels)
- **qrcode.react** (QR codes)
- **localStorage** (host game state, guest session, history)
- **Vercel** (static hosting + serverless TURN credential proxy)

## Project Structure

```
frontend/
├── src/
│   ├── peer/
│   │   ├── PeerManager.js       # Host/Guest connections, JOIN / REJOIN / CONFIRM_CLAIM
│   │   ├── MessageProtocol.js   # Message types and JSON payloads
│   │   ├── PermissionGuard.js   # Guest action validation on the host
│   │   └── peerConfig.js        # ICE/TURN (Metered via /api when deployed)
│   ├── views/
│   │   ├── HostView.jsx         # QR, config, player table, settle / save
│   │   ├── GuestView.jsx        # Join, reclaim by name, view state, settlement input
│   │   └── HistoryView.jsx      # Saved games
│   ├── components/
│   │   ├── GameConfig.jsx
│   │   ├── PlayerTable.jsx      # Buy-ins (host), early exit, final chips, P/L
│   │   ├── SettlingChipsInput.jsx
│   │   ├── ThemeToggle.jsx
│   │   └── Icons.jsx
│   ├── utils/
│   │   ├── localStorage.js
│   │   ├── helpers.js           # P/L, balance, formatting
│   │   └── gameConstraints.js   # Limits for config fields
│   ├── App.jsx                  # Hash router + home
│   └── ...
├── index.html
├── vite.config.js               # dev server :3000, host 0.0.0.0
└── package.json
api/turn-credentials.js          # Vercel: Metered TURN credentials
vercel.json
```

## Quick Start

### Local development

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** (Vite is set to port `3000` and binds to `0.0.0.0`).

### Testing with multiple devices

1. Use the **network URL** Vite prints (e.g. `http://192.168.x.x:3000`), not only `localhost`, so phones can reach the host
2. The QR code should use that reachable URL
3. Same machine: use two browsers (e.g. Chrome + Safari) so `localStorage` is separate

### Deploy to Vercel

In the Vercel project **Settings → Environment Variables**:

| Name | Value |
|------|--------|
| `METERED_API_KEY` | Metered **API Key** (Dashboard → API Keys) |
| `METERED_APP_DOMAIN` | App host, e.g. `yourapp.metered.live` (no `https://`) |

```bash
npm i -g vercel
vercel
```

Or connect the GitHub repo for automatic deploys. `vercel.json` is included.

### Local dev with TURN API

Plain `npm run dev` in `frontend/` does **not** serve `/api/turn-credentials`; the app falls back to STUN-only (usually enough on the same LAN). For cross-network tests locally, from the **repo root**:

```bash
npx vercel dev
```

Use the URL Vercel prints so both the API and the frontend are proxied.

## Game flow

1. **Host** enters a name and creates a game (gets a Peer ID and QR / link)
2. **Host** sets blinds, buy-in chip size, chip value, optional chip denominations
3. **Guests** open the link, enter their **name** and initial buy-in count (can be negative), and join the lobby
4. **Host** starts the game
5. **During play** — Host adjusts every player’s buy-ins; host may enter **early exit** remaining chips for players who left; guests see live state when connected
6. **Host** ends the game → settlement phase; guests (re)open the link with their name to enter **final** remaining chips if needed
7. **Host** finalizes → P/L is computed and the game is appended to **history**

## Data & privacy

- Game state and history live in the **host’s** browser `localStorage`
- Game payload does not go through your Vercel app database; it flows over WebRTC between host and guests
- PeerJS public signaling is only for connection setup; TURN relay may go through Metered when NAT traversal requires it
- Clearing the host’s site data removes local games and history

## License

MIT
