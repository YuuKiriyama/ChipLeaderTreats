# ChipLeaderTreats - Backend v0.1.1

Node.js + Express backend API service providing poker game data management and storage.

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Start Server
```bash
npm start
```
Server runs at `http://localhost:3001`

### Test API
```bash
./test-api.sh
```

## 🏗️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **JSON Files** - Lightweight data storage
- **CORS** - Cross-origin resource sharing

## 📁 Directory Structure

```
backend/
├── data/                   # Data storage
│   ├── games.json          # Game history
│   ├── players.json        # Player data
│   └── poker-favorites.json # Favorite players
├── server.js               # Express server main file
├── dataStore.js            # Data store module
├── package.json            # Dependencies config
├── test-api.sh             # API test script
└── start-server.command     # Startup script
```

## 📡 API Endpoints

### Basic Info
- **Service URL**: `http://localhost:3001`
- **API Prefix**: `/api`
- **Data Format**: JSON
- **CORS**: Configured

### Endpoint List

| Method | Path | Description | Request Body |
|--------|------|-------------|--------------|
| GET | /api/health | Health check | - |
| GET | /api/games | Get game history | - |
| POST | /api/games | Add game record | Game object |
| DELETE | /api/games/:id | Delete game record | - |
| GET | /api/players | Get player data | - |
| PUT | /api/players | Update player data | Players array |
| GET | /api/favorites | Get favorites list | - |
| PUT | /api/favorites | Update favorites list | Favorites array |

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { /* data content */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## 💾 Data Storage

### Storage Location
JSON files in `data/` directory

### Data Files

**games.json** - Game history
```json
[
  {
    "id": 1698765432000,
    "gameName": "10/27 Fri",
    "date": "2023-10-27T12:00:00.000Z",
    "smallBlind": 1,
    "bigBlind": 2,
    "buyInChips": 200,
    "chipValue": 10,
    "sessionMinutes": 120,
    "players": [
      {
        "name": "Player A",
        "buyInCount": 1,
        "finalChips": 250
      }
    ]
  }
]
```

**players.json** - Player data
```json
[
  {
    "name": "Player A",
    "totalGames": 5,
    "totalProfit": 150.50,
    "avgProfit": 30.10
  }
]
```

**poker-favorites.json** - Favorite players
```json
["Player A", "Player B", "Player C"]
```

## 🔧 Configuration

### Port Configuration
```javascript
// server.js
const PORT = 3001;  // Change to desired port
```

### CORS Configuration
```javascript
// server.js
app.use(cors({
  origin: 'http://localhost:3000'  // Modify for production
}));
```

### Production Configuration

1. **Modify CORS origin**:
```javascript
app.use(cors({
  origin: 'https://your-domain.com'
}));
```

2. **Add environment variables**:
```bash
NODE_ENV=production
PORT=3001
```

3. **Add HTTPS support**:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(PORT);
```

## 🧪 Testing

### API Testing
```bash
# Using test script
./test-api.sh

# Manual testing
curl http://localhost:3001/api/health
curl http://localhost:3001/api/games
curl http://localhost:3001/api/players
curl http://localhost:3001/api/favorites
```

### Test Cases
- Health check endpoint
- Data CRUD operations
- Error handling
- CORS cross-origin requests

## 🔍 Troubleshooting

### Common Issues

**1. Port in use**
```bash
# Check port usage
lsof -i :3001

# Kill process
kill -9 <PID>
```

**2. Data file permissions**
```bash
# Check file permissions
ls -la data/

# Modify permissions
chmod 644 data/*.json
```

**3. CORS errors**
- Check CORS configuration
- Confirm frontend URL is correct
- Check browser console for errors

**4. Data not saving**
- Check if `data/` directory exists
- Confirm file write permissions
- Check server logs

## 📊 Performance Optimization

### Current Optimizations
- Lightweight JSON file storage
- Express middleware optimization
- Error handling mechanism

### Future Optimizations
- Add data caching
- Implement data pagination
- Add request rate limiting
- Upgrade to database

## 🔐 Security Considerations

### Current State (Development)
- ✅ Basic CORS configuration
- ❌ No authentication
- ❌ No data encryption
- ❌ No input validation

### Production Recommendations
1. **Add authentication**: JWT or Session
2. **Input validation**: Validate all API inputs
3. **HTTPS**: Use SSL certificate
4. **Logging**: Log all operations
5. **Backup strategy**: Regular data backups

## 📈 Scalability

### Short-term
- [ ] Add data validation middleware
- [ ] Implement API versioning
- [ ] Add request logging
- [ ] Improve error handling

### Mid-term
- [ ] Upgrade to database (MongoDB/PostgreSQL)
- [ ] Add user authentication system
- [ ] Implement data pagination
- [ ] Add caching mechanism

### Long-term
- [ ] Microservices architecture
- [ ] Distributed deployment
- [ ] Real-time sync (WebSocket)
- [ ] Data analytics service

## 🔄 Version History

### v0.1.1
- ✅ Game state auto-save support
- ✅ Data persistence optimization

### v0.0.1
- ✅ Initial release
- ✅ Express server
- ✅ JSON file storage
- ✅ RESTful API design
- ✅ CORS support
- ✅ Basic error handling

## 📚 Related Documentation

- **Main project**: `../README.md`
- **Frontend**: `../frontend/README.md`
- **API testing**: `test-api.sh`

---

**Backend Service v0.1.1**  
*Reliable poker data management API*
