const {
  MAX_PLAYERS,
  ROOM_CODE_LENGTH,
  PLAYER_COLORS,
  STORE_ZONES,
  ROUND_SECONDS
} = require('./constants');
const { createPlayer, calculateLeaderboard } = require('./economy');

const rooms = new Map();

function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = Array.from({ length: ROOM_CODE_LENGTH }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function createRoom() {
  const code = generateRoomCode();
  const room = {
    code,
    createdAt: Date.now(),
    status: 'playing',
    players: {},
    customers: [],
    leaderboard: [],
    gameTimeRemaining: ROUND_SECONDS,
    lastCustomerId: 0,
    lastTickAt: Date.now()
  };
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(String(code || '').trim().toUpperCase());
}

function findPlayerRoom(socketId) {
  for (const room of rooms.values()) {
    if (room.players[socketId]) return room;
  }
  return null;
}

function getOpenStoreIndex(room) {
  const used = new Set(Object.values(room.players).map((player) => player.storeIndex));
  for (let index = 0; index < MAX_PLAYERS; index += 1) {
    if (!used.has(index)) return index;
  }
  return -1;
}

function addPlayer(room, socketId, name) {
  const playerCount = Object.keys(room.players).length;
  if (playerCount >= MAX_PLAYERS) {
    return { ok: false, message: 'Room is full.' };
  }

  const storeIndex = getOpenStoreIndex(room);
  const player = createPlayer(socketId, name, PLAYER_COLORS[storeIndex], storeIndex);
  room.players[socketId] = player;
  room.leaderboard = calculateLeaderboard(room.players);
  return { ok: true, player };
}

function removePlayer(socketId) {
  const room = findPlayerRoom(socketId);
  if (!room) return null;
  delete room.players[socketId];
  room.leaderboard = calculateLeaderboard(room.players);

  if (Object.keys(room.players).length === 0) {
    rooms.delete(room.code);
  }
  return room;
}

function publicRoomState(room) {
  return {
    code: room.code,
    status: room.status,
    players: room.players,
    customers: room.customers,
    leaderboard: room.leaderboard,
    gameTimeRemaining: room.gameTimeRemaining,
    storeZones: STORE_ZONES
  };
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  findPlayerRoom,
  addPlayer,
  removePlayer,
  publicRoomState
};
