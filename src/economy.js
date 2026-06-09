const { PRODUCTS, SHELF_LEVELS, STARTING_MONEY, DEFAULT_PURCHASE_QUANTITY } = require('./constants');

function createProductMap(factory) {
  return Object.fromEntries(Object.keys(PRODUCTS).map((product) => [product, factory(product)]));
}

function sanitizeName(name, fallback) {
  const cleaned = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 18);
  return cleaned || fallback;
}

function createPlayer(socketId, name, color, storeIndex, isHost = false) {
  return {
    id: socketId,
    name: sanitizeName(name, `Player ${storeIndex + 1}`),
    color,
    storeIndex,
    isHost,
    connected: true,
    money: STARTING_MONEY,
    revenue: 0,
    cost: 0,
    profit: 0,
    unitsSold: 0,
    inventory: createProductMap(() => 0),
    prices: createProductMap((product) => PRODUCTS[product].defaultPrice),
    shelves: createProductMap(() => ({
      stock: 0,
      capacity: SHELF_LEVELS[0].capacity,
      level: SHELF_LEVELS[0].level
    }))
  };
}

function resetPlayerForNewRound(player) {
  player.money = STARTING_MONEY;
  player.revenue = 0;
  player.cost = 0;
  player.profit = 0;
  player.unitsSold = 0;
  player.inventory = createProductMap(() => 0);
  player.prices = createProductMap((product) => PRODUCTS[product].defaultPrice);
  player.shelves = createProductMap(() => ({
    stock: 0,
    capacity: SHELF_LEVELS[0].capacity,
    level: SHELF_LEVELS[0].level
  }));
}

function parseQuantity(quantity, defaultQuantity = DEFAULT_PURCHASE_QUANTITY) {
  const parsed = Number.parseInt(quantity, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultQuantity;
  return Math.max(1, Math.min(50, parsed));
}

function clampPrice(product, price) {
  const rules = PRODUCTS[product];
  if (!rules) return null;
  const parsed = Number(price);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(rules.maxPrice, Math.max(rules.minPrice, Math.round(parsed * 100) / 100));
}

function recalculateProfit(player) {
  player.profit = Math.round((player.revenue - player.cost) * 100) / 100;
  return player.profit;
}

function setPrice(player, product, price) {
  const safePrice = clampPrice(product, price);
  if (safePrice === null) return { ok: false, message: 'Invalid product or price.' };
  player.prices[product] = safePrice;
  return { ok: true, price: safePrice };
}

function buyStock(player, product, quantity) {
  const productInfo = PRODUCTS[product];
  if (!productInfo) return { ok: false, message: 'Unknown product.' };

  const amount = parseQuantity(quantity);
  const totalCost = productInfo.cost * amount;
  if (player.money < totalCost) {
    return { ok: false, message: `Not enough money to buy ${amount} ${product}.` };
  }

  player.money -= totalCost;
  player.cost += totalCost;
  player.inventory[product] += amount;
  recalculateProfit(player);
  return { ok: true, amount, totalCost };
}

function restockShelf(player, product, quantity) {
  const shelf = player.shelves[product];
  if (!shelf) return { ok: false, message: 'Unknown shelf.' };

  const requested = parseQuantity(quantity);
  const shelfSpace = shelf.capacity - shelf.stock;
  const moved = Math.min(requested, shelfSpace, player.inventory[product]);
  if (moved <= 0) {
    return { ok: false, message: 'No inventory or shelf space available.' };
  }

  player.inventory[product] -= moved;
  shelf.stock += moved;
  return { ok: true, moved };
}

function upgradeShelf(player, product) {
  const shelf = player.shelves[product];
  if (!shelf) return { ok: false, message: 'Unknown shelf.' };

  const nextLevel = SHELF_LEVELS.find((level) => level.level === shelf.level + 1);
  if (!nextLevel) return { ok: false, message: 'Shelf is already max level.' };
  if (player.money < nextLevel.upgradeCost) return { ok: false, message: 'Not enough money for upgrade.' };

  player.money -= nextLevel.upgradeCost;
  player.cost += nextLevel.upgradeCost;
  shelf.level = nextLevel.level;
  shelf.capacity = nextLevel.capacity;
  recalculateProfit(player);
  return { ok: true, upgradeCost: nextLevel.upgradeCost, level: shelf.level };
}

function recordSale(player, product) {
  const shelf = player.shelves[product];
  if (!shelf || shelf.stock <= 0) return false;

  const price = player.prices[product];
  shelf.stock -= 1;
  player.money += price;
  player.revenue += price;
  player.unitsSold += 1;
  recalculateProfit(player);
  return true;
}

function calculateLeaderboard(players) {
  const playerList = Object.values(players);
  const totalUnitsSold = playerList.reduce((total, player) => total + player.unitsSold, 0);

  return playerList
    .map((player) => ({
      id: player.id,
      name: player.name,
      color: player.color,
      isHost: player.isHost,
      money: player.money,
      revenue: player.revenue,
      cost: player.cost,
      profit: player.profit,
      unitsSold: player.unitsSold,
      marketShare: totalUnitsSold === 0 ? 0 : Math.round((player.unitsSold / totalUnitsSold) * 100)
    }))
    .sort((a, b) => b.profit - a.profit || b.revenue - a.revenue || a.name.localeCompare(b.name));
}

module.exports = {
  createPlayer,
  resetPlayerForNewRound,
  sanitizeName,
  parseQuantity,
  setPrice,
  buyStock,
  restockShelf,
  upgradeShelf,
  recordSale,
  calculateLeaderboard,
  recalculateProfit
};
