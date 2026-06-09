const { CUSTOMER_SPAWN_MS, GAME_TICK_MS } = require('./constants');
const { rooms, publicRoomState } = require('./roomManager');
const { calculateLeaderboard } = require('./economy');
const { spawnCustomer, updateCustomers } = require('./customerAI');

function startGameLoop(io) {
  let lastCustomerSpawn = Date.now();

  setInterval(() => {
    const now = Date.now();

    for (const room of rooms.values()) {
      if (room.status !== 'playing') continue;

      room.gameTimeRemaining = Math.max(0, room.gameTimeRemaining - GAME_TICK_MS / 1000);

      if (room.gameTimeRemaining <= 0) {
        room.status = 'ended';
      }

      if (now - lastCustomerSpawn >= CUSTOMER_SPAWN_MS && Object.keys(room.players).length > 0) {
        spawnCustomer(room);
      }

      updateCustomers(room);
      room.leaderboard = calculateLeaderboard(room.players);
      io.to(room.code).emit('gameState', publicRoomState(room));

      if (room.status === 'ended') {
        io.to(room.code).emit('gameEnded', room.leaderboard);
      }
    }

    if (now - lastCustomerSpawn >= CUSTOMER_SPAWN_MS) {
      lastCustomerSpawn = now;
    }
  }, GAME_TICK_MS);
}

module.exports = { startGameLoop };
