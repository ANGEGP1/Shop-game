(function () {
  const socket = io();
  let localPlayerId = null;

  const nameInput = document.getElementById('player-name');
  const codeInput = document.getElementById('room-code');
  const createButton = document.getElementById('create-room');
  const joinButton = document.getElementById('join-room');

  function playerName() {
    return nameInput.value.trim() || `Mart ${Math.floor(Math.random() * 90) + 10}`;
  }

  createButton.addEventListener('click', () => {
    window.SuperMartUI.showError('');
    socket.emit('createRoom', { name: playerName() });
  });

  joinButton.addEventListener('click', () => {
    window.SuperMartUI.showError('');
    socket.emit('joinRoom', { code: codeInput.value.trim().toUpperCase(), name: playerName() });
  });

  window.SuperMartUI.bindActions({
    startGame() {
      socket.emit('startGame');
    },
    setPrice(product, price) {
      socket.emit('setPrice', { product, price });
    },
    buyStock(product, quantity) {
      socket.emit('buyStock', { product, quantity });
    },
    restockShelf(product, quantity) {
      socket.emit('restockShelf', { product, quantity });
    },
    upgradeShelf(product) {
      socket.emit('upgradeShelf', { product });
    }
  });

  socket.on('config', (config) => {
    window.SuperMartConfig.products = config.products;
    window.SuperMartConfig.shelfLevels = config.shelfLevels;
    window.SuperMartConfig.mapSize = config.mapSize;
  });

  socket.on('roomJoined', ({ room, playerId }) => {
    localPlayerId = playerId;
    codeInput.value = room.code;
    window.SuperMartUI.showGame();
    window.SuperMartUI.renderRoom(room, localPlayerId);
    window.SuperMartGame.setState(room, localPlayerId);
  });

  socket.on('gameState', (room) => {
    if (!localPlayerId) return;
    window.SuperMartUI.renderRoom(room, localPlayerId);
    window.SuperMartGame.setState(room, localPlayerId);
  });

  socket.on('gameEnded', () => {
    window.SuperMartUI.showError('Game ended. Check the final leaderboard!');
  });

  socket.on('roomError', ({ message }) => {
    window.SuperMartUI.showError(message);
  });
}());
