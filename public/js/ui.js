(function () {
  const elements = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    startError: document.getElementById('start-error'),
    gameMessage: document.getElementById('game-message'),
    roomLabel: document.getElementById('room-label'),
    playerLabel: document.getElementById('player-label'),
    statusLabel: document.getElementById('status-label'),
    playersLabel: document.getElementById('players-label'),
    timerLabel: document.getElementById('timer-label'),
    startGameButton: document.getElementById('start-game'),
    money: document.getElementById('money-stat'),
    revenue: document.getElementById('revenue-stat'),
    cost: document.getElementById('cost-stat'),
    profit: document.getElementById('profit-stat'),
    productControls: document.getElementById('product-controls'),
    leaderboard: document.getElementById('leaderboard-list')
  };

  let localPlayerId = null;
  let actionHandlers = {};

  function formatMoney(value) {
    return `$${Number(value || 0).toFixed(0)}`;
  }

  function formatTime(seconds) {
    const safeSeconds = Math.max(0, Math.ceil(seconds || 0));
    const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
    const rest = String(safeSeconds % 60).padStart(2, '0');
    return `${minutes}:${rest}`;
  }

  function showError(message) {
    elements.startError.textContent = message || '';
    elements.gameMessage.textContent = message || '';
    elements.gameMessage.classList.toggle('warning', Boolean(message));
  }

  function showGame() {
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
  }

  function bindActions(handlers) {
    actionHandlers = handlers;
    elements.startGameButton.addEventListener('click', () => actionHandlers.startGame());
  }

  function renderProductControls(player, roomStatus) {
    const products = window.SuperMartConfig.products;
    const disabled = roomStatus !== 'playing' ? 'disabled' : '';
    elements.productControls.innerHTML = '';

    Object.keys(products).forEach((product) => {
      const productInfo = products[product];
      const shelf = player.shelves[product];
      const card = document.createElement('article');
      card.className = 'product-card';
      card.innerHTML = `
        <h4><span>${productInfo.emoji || ''} ${product}</span><span>Cost ${formatMoney(productInfo.cost)}</span></h4>
        <div class="product-row"><span>Price</span><input data-price="${product}" type="number" min="${productInfo.minPrice}" max="${productInfo.maxPrice}" step="1" value="${player.prices[product]}" ${disabled}></div>
        <div class="product-row"><span>Inventory</span><strong>${player.inventory[product]}</strong></div>
        <div class="product-row"><span>Shelf</span><strong>${shelf.stock}/${shelf.capacity} · Lv ${shelf.level}</strong></div>
        <p class="lesson">${productInfo.lesson}</p>
        <div class="product-actions">
          <button data-buy="${product}" ${disabled}>Buy 5</button>
          <button data-restock="${product}" ${disabled}>Restock 5</button>
          <button data-upgrade="${product}" ${disabled}>Upgrade Shelf</button>
        </div>
      `;
      elements.productControls.appendChild(card);
    });

    elements.productControls.querySelectorAll('[data-price]').forEach((input) => {
      input.addEventListener('change', () => actionHandlers.setPrice(input.dataset.price, input.value));
    });
    elements.productControls.querySelectorAll('[data-buy]').forEach((button) => {
      button.addEventListener('click', () => actionHandlers.buyStock(button.dataset.buy, 5));
    });
    elements.productControls.querySelectorAll('[data-restock]').forEach((button) => {
      button.addEventListener('click', () => actionHandlers.restockShelf(button.dataset.restock, 5));
    });
    elements.productControls.querySelectorAll('[data-upgrade]').forEach((button) => {
      button.addEventListener('click', () => actionHandlers.upgradeShelf(button.dataset.upgrade));
    });
  }

  function renderLeaderboard(room) {
    elements.leaderboard.innerHTML = '';

    room.leaderboard.forEach((entry) => {
      const item = document.createElement('li');
      item.style.borderLeftColor = entry.color;
      item.innerHTML = `
        <strong>${entry.name}${entry.isHost ? ' 👑' : ''}</strong> — ${formatMoney(entry.profit)} profit
        <small>Revenue ${formatMoney(entry.revenue)} · Cost ${formatMoney(entry.cost)} · Sales ${entry.unitsSold} · Market Share ${entry.marketShare}%</small>
      `;
      elements.leaderboard.appendChild(item);
    });
  }

  function renderRoom(room, playerId) {
    localPlayerId = playerId || localPlayerId;
    const player = room.players[localPlayerId];
    if (!player) return;

    const playerCount = Object.keys(room.players).length;
    elements.roomLabel.textContent = `Room ${room.code}`;
    elements.playerLabel.textContent = `${player.name}${player.isHost ? ' 👑' : ''}`;
    elements.playerLabel.style.color = player.color;
    elements.statusLabel.textContent = room.status;
    elements.playersLabel.textContent = `${playerCount}/${room.maxPlayers || 8}`;
    elements.timerLabel.textContent = room.status === 'ended' ? 'Ended' : formatTime(room.gameTimeRemaining);
    elements.money.textContent = formatMoney(player.money);
    elements.revenue.textContent = formatMoney(player.revenue);
    elements.cost.textContent = formatMoney(player.cost);
    elements.profit.textContent = formatMoney(player.profit);

    const canStart = player.isHost && room.status !== 'playing';
    elements.startGameButton.classList.toggle('hidden', !canStart);
    elements.startGameButton.textContent = room.status === 'ended' ? 'Restart Round' : 'Start Round';
    elements.gameMessage.textContent = room.status === 'waiting'
      ? 'Waiting room: share the code, then the host starts the round.'
      : room.status === 'ended'
        ? 'Round ended. The leaderboard shows final profit rankings.'
        : '';
    elements.gameMessage.classList.remove('warning');

    renderProductControls(player, room.status);
    renderLeaderboard(room);
  }

  window.SuperMartUI = {
    elements,
    bindActions,
    showError,
    showGame,
    renderRoom
  };
}());
