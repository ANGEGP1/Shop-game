const assert = require('assert');
const { createPlayer, setPrice, buyStock, restockShelf, upgradeShelf, recordSale, calculateLeaderboard } = require('../src/economy');

const player = createPlayer('p1', '  Test   Mart  ', '#fff', 0, true);
assert.strictEqual(player.name, 'Test Mart');
assert.strictEqual(player.isHost, true);
assert.strictEqual(player.money, 100);

assert.deepStrictEqual(setPrice(player, 'Juice', 99), { ok: true, price: 10 });
assert.strictEqual(player.prices.Juice, 10);
assert.strictEqual(buyStock(player, 'Bread', 10).ok, true);
assert.strictEqual(player.money, 90);
assert.strictEqual(player.cost, 10);
assert.strictEqual(player.inventory.Bread, 10);
assert.strictEqual(restockShelf(player, 'Bread', 50).moved, 10);
assert.strictEqual(player.shelves.Bread.stock, 10);
assert.strictEqual(recordSale(player, 'Bread'), true);
assert.strictEqual(player.revenue, 3);
assert.strictEqual(player.profit, -7);
assert.strictEqual(upgradeShelf(player, 'Bread').ok, true);
assert.strictEqual(player.shelves.Bread.level, 2);

const other = createPlayer('p2', 'Other', '#000', 1, false);
other.revenue = 20;
other.profit = 20;
other.unitsSold = 4;
player.unitsSold = 1;
const leaderboard = calculateLeaderboard({ p1: player, p2: other });
assert.strictEqual(leaderboard[0].id, 'p2');
assert.strictEqual(leaderboard.find((entry) => entry.id === 'p2').marketShare, 80);

console.log('economy.test.js passed');
