const { PRODUCTS, SHELF_LEVELS, STARTING_MONEY } = require('./constants');

function createProductMap(factory) {
  return Object.fromEntries(Object.keys(PRODUCTS).map((product) => [product, factory(product)]));
}

function createPlayer(socketId, name, color, storeIndex) {
  return {
    id: socketId,
    name: name || `Player ${storeIndex + 1}`,
    color,
    storeIndex,
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
  const amount = Math.max(1, Math.min(50, Number.parseInt(quantity, 10) || 0));
  if (!productInfo) return { ok: false, message: 'Unknown product.' };

  const totalCost = productInfo.cost * amount;
  if (player.money < totalCost) {
    return { ok: false, message: `Not enough money to buy ${amount} ${product}.` };
  }

  player.money -= totalCost;
  player.cost += totalCost;
  player.inventory[product] += amount;
  recalculateProfit(player);
  return { ok: true };
}

function restockShelf(player, product, quantity) {
  const shelf = player.shelves[product];
  const requested = Math.max(1, Math.min(50, Number.parseInt(quantity, 10) || 0));
  if (!shelf) return { ok: false, message: 'Unknown shelf.' };

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
  return { ok: true };
}

function recordSale(player, product) {
  const price = player.prices[product];
  player.shelves[product].stock -= 1;
  player.money += price;
  player.revenue += price;
  player.unitsSold += 1;
  recalculateProfit(player);
}

function calculateLeaderboard(players) {
  const playerList = Object.values(players);
  const totalUnitsSold = playerList.reduce((total, player) => total + player.unitsSold, 0);

  return playerList
    .map((player) => ({
      id: player.id,
      name: player.name,
      color: player.color,
      money: player.money,
      revenue: player.revenue,
      cost: player.cost,
      profit: player.profit,
      unitsSold: player.unitsSold,
      marketShare: totalUnitsSold === 0 ? 0 : Math.round((player.unitsSold / totalUnitsSold) * 100)
    }))
    .sort((a, b) => b.profit - a.profit || b.revenue - a.revenue);
}

module.exports = {
  createPlayer,
  setPrice,
  buyStock,
  restockShelf,
  upgradeShelf,
  recordSale,
  calculateLeaderboard,
  recalculateProfit
};
