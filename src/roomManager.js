const {
  MAX_PLAYERS,
  ROOM_CODE_LENGTH,
  PLAYER_COLORS,
  STORE_ZONES,
  ROUND_SECONDS
} = require('./constants');
const { createPlayer, resetPlayerForNewRound, calculateLeaderboard } = require('./economy');

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
    status: 'waiting',
    players: {},
    customers: [],
    leaderboard: [],
    gameTimeRemaining: ROUND_SECONDS,
    lastCustomerId: 0,
    lastCustomerSpawnAt: 0,
    lastTickAt: Date.now(),
    endedBroadcasted: false
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

function getHost(room) {
  return Object.values(room.players).find((player) => player.isHost) || null;
}

function ensureHost(room) {
  if (getHost(room)) return;
  const firstPlayer = Object.values(room.players).sort((a, b) => a.storeIndex - b.storeIndex)[0];
  if (firstPlayer) firstPlayer.isHost = true;
}

function addPlayer(room, socketId, name) {
  const playerCount = Object.keys(room.players).length;
  if (playerCount >= MAX_PLAYERS) {
    return { ok: false, message: 'Room is full.' };
  }
  if (room.players[socketId]) {
    return { ok: false, message: 'You are already in this room.' };
  }

  const storeIndex = getOpenStoreIndex(room);
  if (storeIndex < 0) return { ok: false, message: 'No store zones are available.' };

  const player = createPlayer(socketId, name, PLAYER_COLORS[storeIndex], storeIndex, playerCount === 0);
  room.players[socketId] = player;
  room.leaderboard = calculateLeaderboard(room.players);
  return { ok: true, player };
}

function removePlayer(socketId) {
  const room = findPlayerRoom(socketId);
  if (!room) return null;
  delete room.players[socketId];

  if (Object.keys(room.players).length === 0) {
    rooms.delete(room.code);
    return null;
  }

  ensureHost(room);
  room.leaderboard = calculateLeaderboard(room.players);
  return room;
}

function startRoom(room, socketId) {
  const player = room.players[socketId];
  if (!player || !player.isHost) return { ok: false, message: 'Only the host can start the round.' };
  if (room.status === 'playing') return { ok: false, message: 'Round is already running.' };

  room.status = 'playing';
  room.gameTimeRemaining = ROUND_SECONDS;
  room.customers = [];
  room.lastCustomerSpawnAt = 0;
  room.lastTickAt = Date.now();
  room.endedBroadcasted = false;
  Object.values(room.players).forEach(resetPlayerForNewRound);
  room.leaderboard = calculateLeaderboard(room.players);
  return { ok: true };
}

function restartRoom(room, socketId) {
  return startRoom(room, socketId);
}

function publicRoomState(room) {
  return {
    code: room.code,
    status: room.status,
    players: room.players,
    customers: room.customers,
    leaderboard: room.leaderboard,
    gameTimeRemaining: room.gameTimeRemaining,
    storeZones: STORE_ZONES,
    maxPlayers: MAX_PLAYERS
  };
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  findPlayerRoom,
  addPlayer,
  removePlayer,
  startRoom,
  restartRoom,
  publicRoomState
};
