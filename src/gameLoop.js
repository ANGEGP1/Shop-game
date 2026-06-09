const { CUSTOMER_SPAWN_MS, GAME_TICK_MS } = require('./constants');
const { rooms, publicRoomState } = require('./roomManager');
const { calculateLeaderboard } = require('./economy');
const { spawnCustomer, updateCustomers } = require('./customerAI');

function tickRoom(io, room, now) {
  const elapsedSeconds = Math.max(0, (now - room.lastTickAt) / 1000);
  room.lastTickAt = now;
  room.gameTimeRemaining = Math.max(0, room.gameTimeRemaining - elapsedSeconds);

  if (room.gameTimeRemaining <= 0) {
    room.status = 'ended';
  }

  if (room.status === 'playing'
    && now - room.lastCustomerSpawnAt >= CUSTOMER_SPAWN_MS
    && Object.keys(room.players).length > 0) {
    spawnCustomer(room);
    room.lastCustomerSpawnAt = now;
  }

  updateCustomers(room);
  room.leaderboard = calculateLeaderboard(room.players);
  io.to(room.code).emit('gameState', publicRoomState(room));

  if (room.status === 'ended' && !room.endedBroadcasted) {
    room.endedBroadcasted = true;
    io.to(room.code).emit('gameEnded', room.leaderboard);
  }
}

function startGameLoop(io) {
  setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      if (room.status === 'playing') tickRoom(io, room, now);
    }
  }, GAME_TICK_MS);
}

module.exports = { startGameLoop, tickRoom };
