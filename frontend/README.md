# ChipLeaderTreats - Frontend v0.1.1

Modern frontend application built with React + Vite, providing the user interface for poker game data statistics.

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Access: `http://localhost:3000`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🏗️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling framework
- **React Hooks** - State management

## 📁 Directory Structure

```
src/
├── components/          # React components
│   ├── CurrentGame.jsx  # Current game page
│   ├── History.jsx     # History page
│   ├── PlayerDetail.jsx # Player detail page
│   └── Icons.jsx       # SVG icon components
├── utils/              # Utility functions
│   ├── storage.js      # API storage wrapper
│   └── helpers.js      # Helper functions
├── App.jsx             # Main app component
├── main.jsx            # App entry point
└── index.css           # Global styles
```

## 🔧 Development Guide

### Component Overview

**App.jsx** - Main application component
- State management (game data, history, player list)
- View switching logic

**CurrentGame.jsx** - Current game page
- Game configuration interface
- Player management
- Profit/loss calculation display
- Game controls (Start/End/Save)

**History.jsx** - History page
- History list
- Player filtering
- Statistics display
- Favorite players management

**PlayerDetail.jsx** - Player detail page
- Individual player details
- Historical game records
- Statistics

**Icons.jsx** - Icon components
- All SVG icon components
- Unified management and reuse

### Utility Functions

**storage.js** - API storage wrapper
- Backend API communication
- Data persistence

**helpers.js** - Helper functions
- Date formatting
- Profit/loss calculation
- Duration calculation
- Other common utilities

## 📱 Mobile Support

- Responsive design, adapts to various screen sizes
- Touch operation support
- Add to home screen for app-like experience

## 🔗 API Integration

Frontend communicates with backend via HTTP API:
- **Backend URL**: `http://localhost:3001/api`
- **Data Format**: JSON
- **CORS**: Configured

## 🎨 Styling Guide

Tailwind CSS for styling:
- Utility-first CSS framework
- Responsive design
- Component-based styles

## 🐛 Common Issues

### 1. Dev server fails to start
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
```

### 2. Port in use
Modify the port value in `vite.config.js`

### 3. Mobile cannot access
- Check firewall settings
- Confirm same WiFi network
- Try using local IP address

### 4. Code changes not taking effect
- Check if file is saved
- Restart dev server
- Clear browser cache

## 📈 Build and Deploy

### Build for Production
```bash
npm run build
```
Output to `dist/` directory

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: Cloudflare, AWS CloudFront
- **Server**: Nginx, Apache

## 🔄 Version History

### v0.1.1
- ✅ Auto-save game state (localStorage)
- ✅ Mobile layout optimization
- ✅ UI detail improvements
- ✅ Input validation optimization

### v0.0.1
- ✅ Initial release
- ✅ React 18 + Vite architecture
- ✅ Tailwind CSS styling
- ✅ Responsive design
- ✅ Component-based development

---

**Frontend v0.1.1**  
*Modern poker statistics interface*
