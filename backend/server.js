// server.js - Express server
import express from 'express';
import cors from 'cors';
import { dataStore } from './dataStore.js';
import { migrateData } from './migrate.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ==================== Player Endpoints ====================

app.get('/api/players', async (req, res) => {
  try {
    const players = await dataStore.getPlayers();
    res.json({ success: true, data: players });
  } catch (error) {
    console.error('Failed to get player list:', error);
    res.status(500).json({ success: false, error: 'Failed to get player list' });
  }
});

app.get('/api/players/:playerId', async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const player = await dataStore.getPlayerById(playerId);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    res.json({ success: true, data: player });
  } catch (error) {
    console.error('Failed to get player info:', error);
    res.status(500).json({ success: false, error: 'Failed to get player info' });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const playerData = req.body;
    const savedPlayer = await dataStore.addPlayer(playerData);
    res.json({ success: true, data: savedPlayer });
  } catch (error) {
    console.error('Failed to add player:', error);
    res.status(500).json({ success: false, error: 'Failed to add player' });
  }
});

app.put('/api/players/:playerId', async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const updateData = req.body;
    const updatedPlayer = await dataStore.updatePlayer(playerId, updateData);
    res.json({ success: true, data: updatedPlayer });
  } catch (error) {
    console.error('Failed to update player:', error);
    res.status(500).json({ success: false, error: 'Failed to update player' });
  }
});

app.delete('/api/players/:playerId', async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const newPlayers = await dataStore.deletePlayer(playerId);
    res.json({ success: true, data: newPlayers });
  } catch (error) {
    console.error('Failed to delete player:', error);
    res.status(500).json({ success: false, error: 'Failed to delete player' });
  }
});

// ==================== Game Endpoints ====================

app.get('/api/games', async (req, res) => {
  try {
    const games = await dataStore.getGames();
    res.json({ success: true, data: games });
  } catch (error) {
    console.error('Failed to get game list:', error);
    res.status(500).json({ success: false, error: 'Failed to get game list' });
  }
});

app.get('/api/games/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const game = await dataStore.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    res.json({ success: true, data: game });
  } catch (error) {
    console.error('Failed to get game info:', error);
    res.status(500).json({ success: false, error: 'Failed to get game info' });
  }
});

app.post('/api/games', async (req, res) => {
  try {
    const gameData = req.body;
    const savedGame = await dataStore.addGame(gameData);
    res.json({ success: true, data: savedGame });
  } catch (error) {
    console.error('Failed to add game:', error);
    res.status(500).json({ success: false, error: 'Failed to add game' });
  }
});

app.put('/api/games/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const updateData = req.body;
    const updatedGame = await dataStore.updateGame(gameId, updateData);
    res.json({ success: true, data: updatedGame });
  } catch (error) {
    console.error('Failed to update game:', error);
    res.status(500).json({ success: false, error: 'Failed to update game' });
  }
});

app.delete('/api/games/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const newGames = await dataStore.deleteGame(gameId);
    res.json({ success: true, data: newGames });
  } catch (error) {
    console.error('Failed to delete game:', error);
    res.status(500).json({ success: false, error: 'Failed to delete game' });
  }
});

// ==================== Game-Player Association Endpoints ====================

app.get('/api/games/:gameId/players', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const gamePlayers = await dataStore.getGamePlayersByGameId(gameId);
    res.json({ success: true, data: gamePlayers });
  } catch (error) {
    console.error('Failed to get game-player records:', error);
    res.status(500).json({ success: false, error: 'Failed to get game-player records' });
  }
});

app.get('/api/players/:playerId/games', async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const gamePlayers = await dataStore.getGamePlayersByPlayerId(playerId);
    res.json({ success: true, data: gamePlayers });
  } catch (error) {
    console.error('Failed to get player game records:', error);
    res.status(500).json({ success: false, error: 'Failed to get player game records' });
  }
});

app.post('/api/game-players', async (req, res) => {
  try {
    const gamePlayerData = req.body;
    const savedGamePlayer = await dataStore.addGamePlayer(gamePlayerData);
    res.json({ success: true, data: savedGamePlayer });
  } catch (error) {
    console.error('Failed to add game-player record:', error);
    res.status(500).json({ success: false, error: 'Failed to add game-player record' });
  }
});

app.put('/api/game-players/:gamePlayerId', async (req, res) => {
  try {
    const gamePlayerId = req.params.gamePlayerId;
    const updateData = req.body;
    const updatedGamePlayer = await dataStore.updateGamePlayer(gamePlayerId, updateData);
    res.json({ success: true, data: updatedGamePlayer });
  } catch (error) {
    console.error('Failed to update game-player record:', error);
    res.status(500).json({ success: false, error: 'Failed to update game-player record' });
  }
});

app.delete('/api/game-players/:gamePlayerId', async (req, res) => {
  try {
    const gamePlayerId = req.params.gamePlayerId;
    const newGamePlayers = await dataStore.deleteGamePlayer(gamePlayerId);
    res.json({ success: true, data: newGamePlayers });
  } catch (error) {
    console.error('Failed to delete game-player record:', error);
    res.status(500).json({ success: false, error: 'Failed to delete game-player record' });
  }
});

// ==================== Legacy Compatibility Endpoints ====================

app.get('/api/history', async (req, res) => {
  try {
    const history = await dataStore.getHistory();
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Failed to get history:', error);
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

app.post('/api/history', async (req, res) => {
  try {
    const game = req.body;
    const savedGame = await dataStore.addGameCompat(game);
    res.json({ success: true, data: savedGame });
  } catch (error) {
    console.error('Failed to add game record:', error);
    res.status(500).json({ success: false, error: 'Failed to add game record' });
  }
});

app.delete('/api/history/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const newHistory = await dataStore.deleteGame(gameId);
    res.json({ success: true, data: newHistory });
  } catch (error) {
    console.error('Failed to delete game record:', error);
    res.status(500).json({ success: false, error: 'Failed to delete game record' });
  }
});

app.put('/api/history', async (req, res) => {
  try {
    const history = req.body;
    const savedHistory = await dataStore.saveHistory(history);
    res.json({ success: true, data: savedHistory });
  } catch (error) {
    console.error('Failed to update history:', error);
    res.status(500).json({ success: false, error: 'Failed to update history' });
  }
});

// ==================== Favorites Endpoints ====================

app.get('/api/favorites', async (req, res) => {
  try {
    const favorites = await dataStore.getFavorites();
    res.json({ success: true, data: favorites });
  } catch (error) {
    console.error('Failed to get favorites:', error);
    res.status(500).json({ success: false, error: 'Failed to get favorites' });
  }
});

app.put('/api/favorites', async (req, res) => {
  try {
    const favorites = req.body;
    const savedFavorites = await dataStore.saveFavorites(favorites);
    res.json({ success: true, data: savedFavorites });
  } catch (error) {
    console.error('Failed to update favorites:', error);
    res.status(500).json({ success: false, error: 'Failed to update favorites' });
  }
});

async function startServer() {
  try {
    await migrateData();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('====================================');
      console.log('  ChipLeaderTreats - Backend Server');
      console.log('====================================');
      console.log('');
      console.log(`Server started successfully!`);
      console.log('');
      console.log(`API: http://localhost:${PORT}`);
      console.log(`Network: http://0.0.0.0:${PORT}`);
      console.log('');
      console.log('API Endpoints:');
      console.log(`  GET    /api/health            - Health check`);
      console.log('');
      console.log('Player endpoints:');
      console.log(`  GET    /api/players           - Get all players`);
      console.log(`  GET    /api/players/:id       - Get player details`);
      console.log(`  POST   /api/players           - Add player`);
      console.log(`  PUT    /api/players/:id       - Update player`);
      console.log(`  DELETE /api/players/:id       - Delete player`);
      console.log('');
      console.log('Game endpoints:');
      console.log(`  GET    /api/games             - Get all games`);
      console.log(`  GET    /api/games/:id         - Get game details`);
      console.log(`  POST   /api/games             - Add game`);
      console.log(`  PUT    /api/games/:id         - Update game`);
      console.log(`  DELETE /api/games/:id         - Delete game`);
      console.log('');
      console.log('Game-player association endpoints:');
      console.log(`  GET    /api/games/:id/players - Get game player records`);
      console.log(`  GET    /api/players/:id/games - Get player game records`);
      console.log(`  POST   /api/game-players      - Add game-player record`);
      console.log(`  PUT    /api/game-players/:id  - Update game-player record`);
      console.log(`  DELETE /api/game-players/:id  - Delete game-player record`);
      console.log('');
      console.log('Legacy compatibility endpoints:');
      console.log(`  GET    /api/history           - Get history (compat)`);
      console.log(`  POST   /api/history           - Add game record (compat)`);
      console.log(`  PUT    /api/history           - Update all history (compat)`);
      console.log(`  DELETE /api/history/:gameId   - Delete game record (compat)`);
      console.log(`  GET    /api/favorites         - Get favorites`);
      console.log(`  PUT    /api/favorites         - Update favorites`);
      console.log('');
      console.log('====================================');
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
}

startServer();
