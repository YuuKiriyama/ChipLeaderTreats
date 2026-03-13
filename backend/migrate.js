// migrate.js - Data migration script
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dataStore } from './dataStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'poker-history.json');

async function needsMigration() {
  try {
    const playersFile = path.join(DATA_DIR, 'players.json');
    const gamesFile = path.join(DATA_DIR, 'games.json');
    const gamePlayersFile = path.join(DATA_DIR, 'gamePlayers.json');
    
    await fs.access(playersFile);
    await fs.access(gamesFile);
    await fs.access(gamePlayersFile);
    
    const players = await dataStore.getPlayers();
    const games = await dataStore.getGames();
    
    return players.length === 0 && games.length === 0;
  } catch {
    return true;
  }
}

async function migrateData() {
  try {
    console.log('Checking data migration...');
    
    if (!(await needsMigration())) {
      console.log('Data is up to date, no migration needed');
      return;
    }
    
    let oldHistory = [];
    try {
      const historyData = await fs.readFile(HISTORY_FILE, 'utf-8');
      oldHistory = JSON.parse(historyData);
      console.log(`Found ${oldHistory.length} history records to migrate`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No legacy data found, creating new data structure');
        return;
      }
      throw error;
    }
    
    if (oldHistory.length === 0) {
      console.log('Legacy data is empty, creating new data structure');
      return;
    }
    
    let migratedGames = 0;
    let migratedPlayers = 0;
    
    for (const gameData of oldHistory) {
      try {
        const game = await dataStore.addGame({
          gameName: gameData.gameName,
          date: gameData.date,
          smallBlind: gameData.smallBlind,
          bigBlind: gameData.bigBlind,
          chipValue: gameData.chipValue,
          buyInChips: gameData.buyInChips,
          sessionMinutes: gameData.sessionMinutes,
          startTime: gameData.startTime,
          endTime: gameData.endTime
        });
        
        migratedGames++;
        
        if (gameData.players && Array.isArray(gameData.players)) {
          for (const playerData of gameData.players) {
            try {
              let player = await dataStore.getPlayerById(playerData.id);
              if (!player) {
                player = await dataStore.addPlayer({
                  name: playerData.name,
                  isFavorite: false
                });
                migratedPlayers++;
              }
              
              await dataStore.addGamePlayer({
                gameId: game.id,
                playerId: player.id,
                buyIns: playerData.buyIns,
                endChips: playerData.endChips,
                position: playerData.position || 0,
                notes: playerData.notes || ''
              });
            } catch (error) {
              console.error(`Failed to migrate player record: ${playerData.name}`, error.message);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to migrate game record: ${gameData.gameName}`, error.message);
      }
    }
    
    console.log(`Data migration complete!`);
    console.log(`   - Games migrated: ${migratedGames}`);
    console.log(`   - Players migrated: ${migratedPlayers}`);
    
    const backupFile = path.join(DATA_DIR, `poker-history-backup-${Date.now()}.json`);
    await fs.copyFile(HISTORY_FILE, backupFile);
    console.log(`Legacy data backed up to: ${path.basename(backupFile)}`);
    
  } catch (error) {
    console.error('Data migration failed:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateData };
