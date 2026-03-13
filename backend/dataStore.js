// dataStore.js - JSON file-based data storage module
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const GAME_PLAYERS_FILE = path.join(DATA_DIR, 'gamePlayers.json');
const FAVORITES_FILE = path.join(DATA_DIR, 'poker-favorites.json');

// Legacy file path for migration
const HISTORY_FILE = path.join(DATA_DIR, 'poker-history.json');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readJSONFile(filePath, defaultValue = null) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    throw error;
  }
}

async function writeJSONFile(filePath, data) {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(prefix = '') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const dataStore = {
  // ==================== Player Operations ====================
  
  async getPlayers() {
    return await readJSONFile(PLAYERS_FILE, []);
  },

  async getPlayerById(playerId) {
    const players = await this.getPlayers();
    return players.find(player => player.id === playerId);
  },

  async addPlayer(playerData) {
    const players = await this.getPlayers();
    const newPlayer = {
      id: generateId('player'),
      name: playerData.name,
      nickname: playerData.nickname || '',
      avatar: playerData.avatar || '',
      phone: playerData.phone || '',
      email: playerData.email || '',
      notes: playerData.notes || '',
      isFavorite: playerData.isFavorite || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalGames: 0,
      totalBuyIns: 0,
      totalProfit: 0
    };
    
    const newPlayers = [newPlayer, ...players];
    await writeJSONFile(PLAYERS_FILE, newPlayers);
    return newPlayer;
  },

  async updatePlayer(playerId, updateData) {
    const players = await this.getPlayers();
    const playerIndex = players.findIndex(player => player.id === playerId);
    
    if (playerIndex === -1) {
      throw new Error('Player not found');
    }
    
    players[playerIndex] = {
      ...players[playerIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    await writeJSONFile(PLAYERS_FILE, players);
    return players[playerIndex];
  },

  async deletePlayer(playerId) {
    const players = await this.getPlayers();
    const newPlayers = players.filter(player => player.id !== playerId);
    await writeJSONFile(PLAYERS_FILE, newPlayers);
    
    // Also delete related game-player records
    const gamePlayers = await this.getGamePlayers();
    const newGamePlayers = gamePlayers.filter(gp => gp.playerId !== playerId);
    await writeJSONFile(GAME_PLAYERS_FILE, newGamePlayers);
    
    return newPlayers;
  },

  // ==================== Game Operations ====================
  
  async getGames() {
    return await readJSONFile(GAMES_FILE, []);
  },

  async getGameById(gameId) {
    const games = await this.getGames();
    return games.find(game => game.id === gameId);
  },

  async addGame(gameData) {
    const games = await this.getGames();
    const newGame = {
      id: generateId('game'),
      gameName: gameData.gameName,
      date: gameData.date || new Date().toISOString(),
      smallBlind: gameData.smallBlind,
      bigBlind: gameData.bigBlind,
      chipValue: gameData.chipValue,
      buyInChips: gameData.buyInChips,
      sessionMinutes: gameData.sessionMinutes || 0,
      startTime: gameData.startTime || new Date().toISOString(),
      endTime: gameData.endTime || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const newGames = [newGame, ...games];
    await writeJSONFile(GAMES_FILE, newGames);
    return newGame;
  },

  async updateGame(gameId, updateData) {
    const games = await this.getGames();
    const gameIndex = games.findIndex(game => game.id === gameId);
    
    if (gameIndex === -1) {
      throw new Error('Game not found');
    }
    
    games[gameIndex] = {
      ...games[gameIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    await writeJSONFile(GAMES_FILE, games);
    return games[gameIndex];
  },

  async deleteGame(gameId) {
    const games = await this.getGames();
    const newGames = games.filter(game => game.id !== gameId);
    await writeJSONFile(GAMES_FILE, newGames);
    
    // Also delete related game-player records
    const gamePlayers = await this.getGamePlayers();
    const newGamePlayers = gamePlayers.filter(gp => gp.gameId !== gameId);
    await writeJSONFile(GAME_PLAYERS_FILE, newGamePlayers);
    
    return newGames;
  },

  // ==================== Game-Player Association Operations ====================
  
  async getGamePlayers() {
    return await readJSONFile(GAME_PLAYERS_FILE, []);
  },

  async getGamePlayersByGameId(gameId) {
    const gamePlayers = await this.getGamePlayers();
    return gamePlayers.filter(gp => gp.gameId === gameId);
  },

  async getGamePlayersByPlayerId(playerId) {
    const gamePlayers = await this.getGamePlayers();
    return gamePlayers.filter(gp => gp.playerId === playerId);
  },

  async addGamePlayer(gamePlayerData) {
    const gamePlayers = await this.getGamePlayers();
    const newGamePlayer = {
      id: generateId('gp'),
      gameId: gamePlayerData.gameId,
      playerId: gamePlayerData.playerId,
      buyIns: gamePlayerData.buyIns,
      endChips: gamePlayerData.endChips,
      profit: gamePlayerData.profit || (gamePlayerData.endChips - gamePlayerData.buyIns * gamePlayerData.buyInChips),
      position: gamePlayerData.position || 0,
      notes: gamePlayerData.notes || ''
    };
    
    const newGamePlayers = [newGamePlayer, ...gamePlayers];
    await writeJSONFile(GAME_PLAYERS_FILE, newGamePlayers);
    
    await this.updatePlayerStats(gamePlayerData.playerId);
    
    return newGamePlayer;
  },

  async updateGamePlayer(gamePlayerId, updateData) {
    const gamePlayers = await this.getGamePlayers();
    const gamePlayerIndex = gamePlayers.findIndex(gp => gp.id === gamePlayerId);
    
    if (gamePlayerIndex === -1) {
      throw new Error('Game-player record not found');
    }
    
    const oldPlayerId = gamePlayers[gamePlayerIndex].playerId;
    gamePlayers[gamePlayerIndex] = {
      ...gamePlayers[gamePlayerIndex],
      ...updateData
    };
    
    await writeJSONFile(GAME_PLAYERS_FILE, gamePlayers);
    
    await this.updatePlayerStats(oldPlayerId);
    if (updateData.playerId && updateData.playerId !== oldPlayerId) {
      await this.updatePlayerStats(updateData.playerId);
    }
    
    return gamePlayers[gamePlayerIndex];
  },

  async deleteGamePlayer(gamePlayerId) {
    const gamePlayers = await this.getGamePlayers();
    const gamePlayerIndex = gamePlayers.findIndex(gp => gp.id === gamePlayerId);
    
    if (gamePlayerIndex === -1) {
      throw new Error('Game-player record not found');
    }
    
    const playerId = gamePlayers[gamePlayerIndex].playerId;
    const newGamePlayers = gamePlayers.filter(gp => gp.id !== gamePlayerId);
    await writeJSONFile(GAME_PLAYERS_FILE, newGamePlayers);
    
    await this.updatePlayerStats(playerId);
    
    return newGamePlayers;
  },

  async updatePlayerStats(playerId) {
    const gamePlayers = await this.getGamePlayersByPlayerId(playerId);
    const games = await this.getGames();
    
    let totalGames = 0;
    let totalBuyIns = 0;
    let totalProfit = 0;
    
    const gameIds = [...new Set(gamePlayers.map(gp => gp.gameId))];
    totalGames = gameIds.length;
    
    gamePlayers.forEach(gp => {
      const game = games.find(g => g.id === gp.gameId);
      if (game) {
        totalBuyIns += gp.buyIns * game.buyInChips;
        totalProfit += gp.profit;
      }
    });
    
    await this.updatePlayer(playerId, {
      totalGames,
      totalBuyIns,
      totalProfit
    });
  },

  // ==================== Favorites Operations ====================
  
  async getFavorites() {
    return await readJSONFile(FAVORITES_FILE, []);
  },

  async saveFavorites(favorites) {
    await writeJSONFile(FAVORITES_FILE, favorites);
    return favorites;
  },

  // ==================== Legacy Compatibility ====================
  
  async getHistory() {
    const games = await this.getGames();
    const gamePlayers = await this.getGamePlayers();
    const players = await this.getPlayers();
    
    return games.map(game => {
      const gamePlayerRecords = gamePlayers.filter(gp => gp.gameId === game.id);
      const gamePlayersWithDetails = gamePlayerRecords.map(gp => {
        const player = players.find(p => p.id === gp.playerId);
        return {
          id: gp.id,
          name: player ? player.name : 'Unknown Player',
          buyIns: gp.buyIns,
          endChips: gp.endChips,
          profit: gp.profit,
          position: gp.position,
          notes: gp.notes
        };
      });
      
      return {
        id: game.id,
        gameName: game.gameName,
        date: game.date,
        smallBlind: game.smallBlind,
        bigBlind: game.bigBlind,
        chipValue: game.chipValue,
        buyInChips: game.buyInChips,
        sessionMinutes: game.sessionMinutes,
        startTime: game.startTime,
        endTime: game.endTime,
        players: gamePlayersWithDetails
      };
    });
  },

  async addGameCompat(gameData) {
    if (gameData.players && Array.isArray(gameData.players)) {
      const games = await this.getGames();
      const newGame = {
        id: generateId('game'),
        gameName: gameData.gameName,
        date: gameData.date || new Date().toISOString(),
        smallBlind: gameData.smallBlind,
        bigBlind: gameData.bigBlind,
        chipValue: gameData.chipValue,
        buyInChips: gameData.buyInChips,
        sessionMinutes: gameData.sessionMinutes || 0,
        startTime: gameData.startTime || new Date().toISOString(),
        endTime: gameData.endTime || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const newGames = [newGame, ...games];
      await writeJSONFile(GAMES_FILE, newGames);
      
      for (const playerData of gameData.players) {
        let player = await this.getPlayerById(playerData.id);
        if (!player) {
          player = await this.addPlayer({
            name: playerData.name,
            isFavorite: false
          });
        }
        
        await this.addGamePlayer({
          gameId: newGame.id,
          playerId: player.id,
          buyIns: playerData.buyIns,
          endChips: playerData.endChips,
          position: playerData.position || 0,
          notes: playerData.notes || ''
        });
      }
      
      return newGame;
    } else {
      return await this.addGame(gameData);
    }
  },

  async saveHistory(history) {
    await writeJSONFile(PLAYERS_FILE, []);
    await writeJSONFile(GAMES_FILE, []);
    await writeJSONFile(GAME_PLAYERS_FILE, []);
    
    for (const gameData of history) {
      await this.addGameCompat(gameData);
    }
    
    return history;
  }
};
