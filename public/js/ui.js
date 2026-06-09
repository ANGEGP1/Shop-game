(function () {
  const elements = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    startError: document.getElementById('start-error'),
    roomLabel: document.getElementById('room-label'),
    playerLabel: document.getElementById('player-label'),
    timerLabel: document.getElementById('timer-label'),
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
  }

  function showGame() {
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
  }

  function bindActions(handlers) {
    actionHandlers = handlers;
  }

  function renderProductControls(player) {
    const products = window.SuperMartConfig.products;
    elements.productControls.innerHTML = '';

    Object.keys(products).forEach((product) => {
      const productInfo = products[product];
      const shelf = player.shelves[product];
      const card = document.createElement('article');
      card.className = 'product-card';
      card.innerHTML = `
        <h4><span>${product}</span><span>Cost ${formatMoney(productInfo.cost)}</span></h4>
        <div class="product-row"><span>Price</span><input data-price="${product}" type="number" min="${productInfo.minPrice}" max="${productInfo.maxPrice}" step="1" value="${player.prices[product]}"></div>
        <div class="product-row"><span>Inventory</span><strong>${player.inventory[product]}</strong></div>
        <div class="product-row"><span>Shelf</span><strong>${shelf.stock}/${shelf.capacity} · Lv ${shelf.level}</strong></div>
        <div class="product-actions">
          <button data-buy="${product}">Buy 5</button>
          <button data-restock="${product}">Restock 5</button>
          <button data-upgrade="${product}">Upgrade Shelf</button>
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
        <strong>${entry.name}</strong> — ${formatMoney(entry.profit)} profit
        <small>Revenue ${formatMoney(entry.revenue)} · Cost ${formatMoney(entry.cost)} · Market Share ${entry.marketShare}%</small>
      `;
      elements.leaderboard.appendChild(item);
    });
  }

  function renderRoom(room, playerId) {
    localPlayerId = playerId || localPlayerId;
    const player = room.players[localPlayerId];
    if (!player) return;

    elements.roomLabel.textContent = `Room ${room.code}`;
    elements.playerLabel.textContent = player.name;
    elements.playerLabel.style.color = player.color;
    elements.timerLabel.textContent = room.status === 'ended' ? 'Ended' : formatTime(room.gameTimeRemaining);
    elements.money.textContent = formatMoney(player.money);
    elements.revenue.textContent = formatMoney(player.revenue);
    elements.cost.textContent = formatMoney(player.cost);
    elements.profit.textContent = formatMoney(player.profit);

    renderProductControls(player);
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
