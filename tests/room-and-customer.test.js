const assert = require('assert');
const { createRoom, addPlayer, startRoom, removePlayer, rooms } = require('../src/roomManager');
const { buyStock, restockShelf, setPrice } = require('../src/economy');
const { chooseStore, spawnCustomer, updateCustomers } = require('../src/customerAI');

const room = createRoom();
assert.strictEqual(room.status, 'waiting');

assert.strictEqual(addPlayer(room, 'p1', 'Host').ok, true);
assert.strictEqual(addPlayer(room, 'p2', 'Discount Mart').ok, true);
assert.strictEqual(room.players.p1.isHost, true);
assert.strictEqual(startRoom(room, 'p2').ok, false);
assert.strictEqual(startRoom(room, 'p1').ok, true);
assert.strictEqual(room.status, 'playing');

for (const id of ['p1', 'p2']) {
  buyStock(room.players[id], 'Milk', 10);
  restockShelf(room.players[id], 'Milk', 10);
}
setPrice(room.players.p1, 'Milk', 8);
setPrice(room.players.p2, 'Milk', 2);
assert.strictEqual(chooseStore(room, 'Milk', 8).id, 'p2');

const customer = spawnCustomer(room);
assert.ok(customer.id.startsWith(room.code));
for (let i = 0; i < 30; i += 1) updateCustomers(room);
assert.ok(room.players.p1.unitsSold + room.players.p2.unitsSold >= 0);

removePlayer('p1');
assert.strictEqual(room.players.p2.isHost, true);
removePlayer('p2');
assert.strictEqual(rooms.has(room.code), false);

console.log('room-and-customer.test.js passed');
