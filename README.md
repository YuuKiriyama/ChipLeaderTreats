# ChipLeaderTreats

A peer-to-peer multiplayer poker score tracker. No server, no accounts — just open the link, create a game, and share the QR code.

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

- **Host** creates a game on their device, which acts as the authoritative server
- **Guests** scan the QR code (or open the link) to join
- All communication happens directly between devices via WebRTC (PeerJS)
- Game data is stored in the host's browser (localStorage), not on any server
- The deployed site (Vercel) serves static files plus a small **serverless** endpoint (`/api/turn-credentials`) that fetches short-lived TURN credentials from Metered — your Metered API key stays on the server, not in the browser bundle

## Features

- **QR Code Join** — Host displays a QR code, guests scan to join instantly
- **Real-time Sync** — Game state broadcasts to all connected players via WebRTC
- **Permission Model** — Host controls game settings and player management; guests can only increase their own buy-in and submit final chips during settlement
- **Persistent Sessions** — Both host and guest sessions survive browser refresh (localStorage + stable Peer ID)
- **Reconnection** — Guests can rejoin after disconnection using their player token
- **Offline-first** — No server dependency after the page loads; PeerJS cloud signaling only used for initial connection
- **Settlement & History** — End game, enter final chips, auto-calculate P/L in dollars and BB; games saved to host's local history

## Tech Stack

- **React 18** + **Vite** + **Tailwind CSS**
- **PeerJS** (WebRTC abstraction for P2P data channels)
- **qrcode.react** (QR code generation)
- **localStorage** (game state and history persistence)
- **Vercel** (static hosting + Serverless Function for TURN credentials)

## Project Structure

```
frontend/
├── src/
│   ├── peer/                    # P2P networking layer
│   │   ├── PeerManager.js       # Host/Guest connection lifecycle
│   │   ├── MessageProtocol.js   # Message types and serialization
│   │   └── PermissionGuard.js   # Guest action validation
│   ├── views/                   # Page-level components
│   │   ├── HostView.jsx         # Host: QR code, config, player management
│   │   ├── GuestView.jsx        # Guest: join, view state, submit chips
│   │   └── HistoryView.jsx      # Game history browser
│   ├── components/              # Shared components
│   │   ├── GameConfig.jsx       # Game settings form
│   │   ├── PlayerTable.jsx      # Player list with P/L display
│   │   └── Icons.jsx            # SVG icon components
│   ├── utils/
│   │   ├── localStorage.js      # Persistence (game state, sessions, history)
│   │   └── helpers.js           # Calculations and formatting
│   ├── App.jsx                  # Hash router + home screen
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── index.html
├── vite.config.js
└── package.json
api/turn-credentials.js          # Vercel: Metered TURN credentials proxy
vercel.json                      # Vercel deployment config
```

## Quick Start

### Local Development

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Testing with Multiple Devices

1. Open the host page using the **Network URL** shown by Vite (e.g., `http://192.168.x.x:3000`), not `localhost`
2. The QR code will contain the network-accessible URL
3. Guests on the same WiFi scan the QR code to join

To test on the same machine, use two different browsers (e.g., Chrome as host, Safari as guest) so localStorage is isolated.

### Deploy to Vercel

In the Vercel project **Settings → Environment Variables**, add:

| Name | Value |
|------|--------|
| `METERED_API_KEY` | Your Metered **API Key** (Dashboard → API Keys) |
| `METERED_APP_DOMAIN` | Your Metered app host, e.g. `chipleadertreats.metered.live` (no `https://`) |

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel
```

Or connect the GitHub repo to Vercel for automatic deployments. The `vercel.json` is already configured.

### Local dev with TURN API

Plain `npm run dev` in `frontend/` does **not** serve `/api/turn-credentials`. The app falls back to STUN-only (fine for same-LAN testing). For cross-network testing locally, run from the **repo root**:

```bash
npx vercel dev
```

Then open the URL Vercel prints (it proxies both the API and the frontend).

## Game Flow

1. **Host** enters their name and creates a game
2. **Host** configures blinds, buy-in chips, and chip rate
3. **Guests** scan QR code, enter name and initial buy-ins, join the lobby
4. **Host** starts the game
5. During the game, guests can add buy-ins; host can adjust any player's buy-ins
6. **Host** ends the game, entering the settlement phase
7. All players enter their final chip counts
8. **Host** finalizes and saves — P/L is calculated and the game is archived to history

## Data & Privacy

- All game data lives in the **host's browser localStorage**
- No data is sent to or stored on any server
- PeerJS's public signaling server (`0.peerjs.com`) is only used to establish the initial WebRTC connection — no game data passes through it
- TURN relay traffic goes through Metered; temporary credentials are issued by your Vercel function, not embedded in client code
- Clearing the host's browser data will erase game history

## License

MIT
