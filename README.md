# ChipLeaderTreats v0.1.1

A modern Texas Hold'em poker game data statistics web application with a separated frontend-backend architecture, supporting multi-device access.

## ✨ Features

### Core Features
- 🎮 **Game Record Management** - Start, end, save, discard games
- 📊 **Player Profit/Loss Statistics** - Chips, cash, BB statistics
- 📈 **History Query** - Complete game history and filtering
- 👤 **Player Detail Analysis** - Individual statistics and trends
- ⭐ **Favorite Players** - Quick access to frequently used players
- ⚖️ **Balance Verification** - Automatic data consistency validation

### v0.1.1 New Features
- 💾 **Auto-save Game State** - Progress preserved on page refresh
- 🗑️ **Discard Game** - Do not save current game data
- 🎯 **Precise Time Calculation** - Per-minute hourly profit calculation
- 📱 **Mobile Optimization** - Portrait layout optimization, improved button layout
- ➕➖ **Flexible Hand Count Input** - Supports 0 and negative numbers (chip-off scenarios)
- 🎨 **UI Detail Refinements** - Icon-text spacing, input field width adjustments
- 🔄 **Small Blind/Big Blind Validation** - Validation on blur to avoid input interference

### General Features
- 📱 **Responsive Design** - Supports mobile, tablet, and PC
- 🔄 **Real-time Data Sync** - Multi-device data sharing
- 🖥️ **Cross-platform Scripts** - macOS and Windows support

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** - Modern UI framework
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **localStorage** - Game state persistence

### Backend Stack
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **JSON Files** - Lightweight data storage
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
CrisCL/
├── frontend/                    # Frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── CurrentGame.jsx  # Current game page
│   │   │   ├── History.jsx      # History page
│   │   │   ├── PlayerDetail.jsx # Player detail page
│   │   │   └── Icons.jsx        # SVG icon components
│   │   ├── utils/               # Utility functions
│   │   │   ├── storage.js       # API storage wrapper
│   │   │   └── helpers.js       # Helper functions
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # App entry point
│   │   └── index.css            # Global styles
│   ├── start-dev.command          # macOS startup script
│   └── start-dev.bat              # Windows startup script
│
├── backend/                     # Backend service
│   ├── data/                    # Data storage
│   │   ├── games.json           # Game history
│   │   ├── gamePlayers.json     # Game-player associations
│   │   ├── players.json         # Player data
│   │   └── poker-favorites.json # Favorite players
│   ├── server.js                # Express server
│   ├── dataStore.js             # Data store module
│   ├── start-server.command       # macOS startup script
│   └── start-server.bat           # Windows startup script
│
├── start-all.command              # macOS one-click startup
├── start-all.bat                  # Windows one-click startup
├── stop-all.command               # macOS stop services
├── stop-all.bat                   # Windows stop services
├── check-status.command           # macOS status check
├── check-status.bat               # Windows status check
└── README.md                    # Project documentation
```

## 🚀 Quick Start

### Requirements
- Node.js 18+
- npm or yarn

### Option 1: One-Click Startup (Recommended)

#### macOS Users
Double-click `start-all.command` in Finder

#### Windows Users
Double-click `start-all.bat` in File Explorer

The system will automatically:
1. Check and install dependencies
2. Start backend server (port 3001)
3. Start frontend server (port 3000)
4. Display access URLs (including mobile access URL)

### Option 2: Manual Startup

**Start Backend:**
```bash
cd backend
npm install  # First run only
npm start
```

**Start Frontend:**
```bash
cd frontend
npm install  # First run only
npm run dev
```

### Access the App

- **Local**: http://localhost:3000
- **Mobile**: http://[your-computer-IP]:3000 (same WiFi required)

## 🎮 User Guide

### Current Game Page

#### 1. Configure Game
- Game name auto-generated (format: MM/DD/YY Day)
- Set small blind/big blind (blur validation supported)
- Set buy-in chips per hand
- Set chip exchange rate (chips = $1)

#### 2. Add Players
- Enter player name
- Set hand count (supports 0 and negative numbers for chip-off)
- Use +/- buttons for quick hand count adjustment

#### 3. Game Flow
- **Start Game**: Record start time, start timer
- **In Progress**: Update player final chip count, view profit/loss in real-time
- **End Game**: Record end time
- **Save Game**: Save to history after balance verification
- **Discard Game**: Do not save current game, reset directly

#### 4. Auto-save
- Game state auto-saved to localStorage during play
- Recoverable after page refresh or browser close
- Temporary state cleared after save or discard

### History Page

1. **View All Games** - Display complete game history
2. **Filter by Player** - View records for specific players
3. **Favorite Players** - Click star to favorite frequently used players
4. **View Details** - Click player name for statistics
5. **Statistics** - Total profit/loss, average per game, hourly profit (minute precision)
6. **Delete Records** - Remove unwanted game records

### Player Detail Page

- View all player history
- Total profit/loss, average performance
- Hourly profit rate (precise calculation)
- Game count and duration statistics

## 💾 Data Management

### Data Storage
- **Location**: `backend/data/` directory
- **Format**: JSON files
- **Persistence**:
  - History stored on backend
  - Current game state stored in localStorage

### Data Backup
```bash
# Backup data
cp -r backend/data backend/data_backup_$(date +%Y%m%d)

# Restore data
cp -r backend/data_backup_YYYYMMDD/* backend/data/
```

## 🔧 Service Management

### Check Service Status
- **macOS**: Double-click `check-status.command`
- **Windows**: Double-click `check-status.bat`

### Stop All Services
- **macOS**: Double-click `stop-all.command`
- **Windows**: Double-click `stop-all.bat`

### View Logs
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log
```

## 📡 API

### Basic Info
- **Backend URL**: `http://localhost:3001/api`
- **Frontend URL**: `http://localhost:3000`
- **Data Format**: JSON

### Main Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/storage/:key | Get stored data |
| POST | /api/storage | Save data |
| DELETE | /api/storage/:key | Delete stored data |

## 📱 Mobile Usage

### Connection
1. Ensure phone and computer are on the same WiFi network
2. Check the IP address shown in terminal after starting services
3. Open in mobile browser: `http://[IP-address]:3000`

### Mobile Optimizations
- Portrait layout optimization
- Two-line title display
- Aligned configuration items
- Reasonable button layout (Start/End on one row, Save/Discard on another)
- Hand count controls with +/- buttons
- Optimized final chip count input width

## 🛠️ Development Guide

### Development Commands
```bash
# Frontend development
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend development
cd backend
npm start            # Start server
```

### Code Structure
- **Component-based**: Each feature as independent React component
- **Modular**: Utility functions and API calls separated
- **Responsive**: Implemented with Tailwind CSS
- **Type-safe**: Modern JavaScript features

## 🔍 Troubleshooting

### Common Issues

**1. Service fails to start**
- Check if ports 3000 and 3001 are in use
- Verify Node.js version >= 18
- Reinstall dependencies: `rm -rf node_modules && npm install`

**2. Frontend cannot connect to backend**
- Confirm backend is running (check service status)
- Check firewall settings
- Check browser console for errors

**3. Game state lost after refresh**
- Check if browser supports localStorage
- Check browser console for errors
- Confirm game has started (unstarted games are not saved)

**4. Mobile cannot access**
- Confirm devices on same WiFi network
- Check computer firewall settings
- Use correct IP address (not localhost)
- Try restarting router

**5. macOS cannot run .command files**
```bash
# Add execute permission
chmod +x *.command
chmod +x backend/*.command
chmod +x frontend/*.command
```

## 📈 Version History

### v0.1.1 (2025-10-29)
- ✅ **Auto-save game state** - No data loss on page refresh
- ✅ **Discard game** - Support reset without saving
- ✅ **Precise hourly profit calculation** - Minute-based calculation
- ✅ **Mobile layout optimization** - Friendlier portrait display
- ✅ **Small/big blind validation** - Validation on blur
- ✅ **Negative hand count support** - For chip-off scenarios
- ✅ **UI detail refinements** - Icon spacing, input width
- ✅ **Cross-platform scripts** - Windows .bat file support
- ✅ **Button layout optimization** - Two-row display on mobile

### v0.0.1 (2025-10-28)
- ✅ Initial release
- ✅ Separated frontend-backend architecture
- ✅ Complete game record functionality
- ✅ Player statistics and analysis
- ✅ Responsive design
- ✅ Multi-device data sync

## 🎯 Roadmap

- [ ] Data visualization charts
- [ ] Excel report export
- [ ] Multi-room support
- [ ] User account system
- [ ] Real-time game sync
- [ ] PWA offline support

## 📦 Lite Version (No Backend, PWA)

Added `apps/lite`:

- **Features**: Local run, add to home screen, offline capable; single-session temporary records only (no history storage)
- **Functionality**: One person creates game, records all players' buy-in count and final chips, auto-calculates profit/loss (chips and USD)
- **Start**:
  ```bash
  cd apps/lite
  npm install
  npm run dev        # Development
  npm run build      # Build
  npm run preview    # Preview (default port 5174)
  ```
  Preview URL: `http://localhost:5174`

Mobile: Use browser menu "Add to Home Screen" to install as app icon; supports offline use after first open.

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License

## 📚 Related Documentation

- **Backend**: [backend/README.md](backend/README.md)
- **Frontend**: [frontend/README.md](frontend/README.md)

---

**ChipLeaderTreats v0.1.1**  
*Data for every game* 🃏
