// helpers.js - Utility functions

export const generateGameName = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekday = weekdays[now.getDay()];
  return `${month}/${day}/${year} ${weekday}`;
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

export const formatElapsedTime = (startTime) => {
  if (!startTime) return '00:00:00';
  const now = new Date();
  const start = new Date(startTime);
  const elapsedMs = now - start;
  
  const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
  const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const calculateDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end - start) / (1000 * 60));
};

export const calculateProfitLoss = (player, buyInChips, chipValue, bigBlind) => {
  const totalBuyInChips = (player.buyIns || 0) * (buyInChips || 0);
  const chips = player.finalChips ?? player.earlyExitChips ?? player.endChips ?? 0;
  const profitChips = chips - totalBuyInChips;
  const profitMoney = (profitChips / (chipValue || 1)).toFixed(2);
  const profitBB = (profitChips / (bigBlind || 1)).toFixed(1);

  return {
    profitChips,
    profitMoney: parseFloat(profitMoney),
    profitBB: parseFloat(profitBB)
  };
};

export const calculateBalance = (players, buyInChips) => {
  const totalBuyIn = players.reduce((sum, p) => sum + ((p.buyIns || 0) * (buyInChips || 0)), 0);
  const totalFinalChips = players.reduce(
    (sum, p) => sum + (p.finalChips ?? p.earlyExitChips ?? p.endChips ?? 0),
    0
  );
  const difference = totalFinalChips - totalBuyIn;
  const isBalanced = difference === 0;

  return {
    totalBuyIn,
    totalFinalChips,
    difference,
    isBalanced
  };
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
