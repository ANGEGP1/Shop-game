const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const {
  createRoom,
  getRoom,
  findPlayerRoom,
  addPlayer,
  removePlayer,
  startRoom,
  restartRoom,
  publicRoomState
} = require('./src/roomManager');
const {
  setPrice,
  buyStock,
  restockShelf,
  upgradeShelf,
  calculateLeaderboard
} = require('./src/economy');
const { startGameLoop } = require('./src/gameLoop');
const { PRODUCTS, SHELF_LEVELS, MAP_SIZE } = require('./src/constants');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ ok: true, game: 'SuperMart Battle' });
});

app.get('/config', (req, res) => {
  res.json({ products: PRODUCTS, shelfLevels: SHELF_LEVELS, mapSize: MAP_SIZE });
});

function sendRoomError(socket, message) {
  socket.emit('roomError', { message });
}

function broadcastRoom(room) {
  room.leaderboard = calculateLeaderboard(room.players);
  io.to(room.code).emit('gameState', publicRoomState(room));
}

io.on('connection', (socket) => {
  socket.emit('config', { products: PRODUCTS, shelfLevels: SHELF_LEVELS, mapSize: MAP_SIZE });

  socket.on('createRoom', ({ name } = {}) => {
    const existingRoom = findPlayerRoom(socket.id);
    if (existingRoom) {
      socket.leave(existingRoom.code);
      const previousRoom = removePlayer(socket.id);
      if (previousRoom) broadcastRoom(previousRoom);
    }

    const room = createRoom();
    const result = addPlayer(room, socket.id, name);
    if (!result.ok) return sendRoomError(socket, result.message);

    socket.join(room.code);
    socket.emit('roomJoined', { room: publicRoomState(room), playerId: socket.id });
    broadcastRoom(room);
  });

  socket.on('joinRoom', ({ code, name } = {}) => {
    const room = getRoom(code);
    if (!room) return sendRoomError(socket, 'Room code not found.');
    if (room.status === 'ended') return sendRoomError(socket, 'This room has already ended. Create a new room to play again.');

    const existingRoom = findPlayerRoom(socket.id);
    if (existingRoom && existingRoom.code === room.code) {
      socket.emit('roomJoined', { room: publicRoomState(room), playerId: socket.id });
      return;
    }
    if (existingRoom) {
      socket.leave(existingRoom.code);
      const previousRoom = removePlayer(socket.id);
      if (previousRoom) broadcastRoom(previousRoom);
    }

    const result = addPlayer(room, socket.id, name);
    if (!result.ok) return sendRoomError(socket, result.message);

    socket.join(room.code);
    socket.emit('roomJoined', { room: publicRoomState(room), playerId: socket.id });
    broadcastRoom(room);
  });


  socket.on('startGame', () => {
    const room = findPlayerRoom(socket.id);
    if (!room) return sendRoomError(socket, 'Join a room first.');
    const result = startRoom(room, socket.id);
    if (!result.ok) return sendRoomError(socket, result.message);
    broadcastRoom(room);
  });

  socket.on('restartGame', () => {
    const room = findPlayerRoom(socket.id);
    if (!room) return sendRoomError(socket, 'Join a room first.');
    const result = restartRoom(room, socket.id);
    if (!result.ok) return sendRoomError(socket, result.message);
    broadcastRoom(room);
  });

  socket.on('setPrice', ({ product, price } = {}) => {
    const room = findPlayerRoom(socket.id);
    if (!room) return sendRoomError(socket, 'Join a room first.');
    if (room.status !== 'playing') return sendRoomError(socket, 'The round is not running. Ask the host to start.');
    const player = room.players[socket.id];
    const result = setPrice(player, product, price);
    if (!result.ok) return sendRoomError(socket, result.message);
    broadcastRoom(room);
  });

  socket.on('buyStock', ({ product, quantity } = {}) => {
    const room = findPlayerRoom(socket.id);
    if (!room) return sendRoomError(socket, 'Join a room first.');
    if (room.status !== 'playing') return sendRoomError(socket, 'The round is not running. Ask the host to start.');
    const result = buyStock(room.players[socket.id], product, quantity);
    if (!result.ok) return sendRoomError(socket, result.message);
    broadcastRoom(room);
  });

  socket.on('restockShelf', ({ product, quantity } = {}) => {
    const room = findPlayerRoom(socket.id);
    if (!room) return sendRoomError(socket, 'Join a room first.');
    if (room.status !== 'playing') return sendRoomError(socket, 'The round is not running. Ask the host to start.');
    const result = restockShelf(room.players[socket.id], product, quantity);
    if (!result.ok) return sendRoomError(socket, result.message);
    broadcastRoom(room);
  });

  socket.on('upgradeShelf', ({ product } = {}) => {
    const room = findPlayerRoom(socket.id);
    if (!room) return sendRoomError(socket, 'Join a room first.');
    if (room.status !== 'playing') return sendRoomError(socket, 'The round is not running. Ask the host to start.');
    const result = upgradeShelf(room.players[socket.id], product);
    if (!result.ok) return sendRoomError(socket, result.message);
    broadcastRoom(room);
  });

  socket.on('disconnect', () => {
    const room = removePlayer(socket.id);
    if (room) broadcastRoom(room);
  });
});

startGameLoop(io);

server.listen(PORT, () => {
  console.log(`SuperMart Battle server running on http://localhost:${PORT}`);
});
