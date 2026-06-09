(function () {
  'use strict';

  const MAX_PLAYERS = 8;
  const STARTING_MONEY = 100;
  const ROUND_SECONDS = 300;
  const CUSTOMER_SPAWN_MS = 1500;
  const CUSTOMER_LIMIT = 38;
  const PRODUCT_NAMES = ['Milk', 'Bread', 'Juice'];
  const PRODUCTS = {
    Milk: { emoji: '🥛', cost: 2, defaultPrice: 4, minPrice: 2, maxPrice: 8, demandWeight: 35, elasticity: 0.65, color: '#f4fbff', lesson: 'Medium elasticity: customers compare price, but many still need it.' },
    Bread: { emoji: '🍞', cost: 1, defaultPrice: 3, minPrice: 1, maxPrice: 6, demandWeight: 45, elasticity: 0.35, color: '#d89b48', lesson: 'Low elasticity: demand stays strong even when price rises a little.' },
    Juice: { emoji: '🧃', cost: 3, defaultPrice: 5, minPrice: 3, maxPrice: 10, demandWeight: 20, elasticity: 0.9, color: '#ff9f2e', lesson: 'High elasticity: customers avoid expensive juice quickly.' }
  };
  const SHELF_LEVELS = [
    { level: 1, capacity: 10, upgradeCost: 0 },
    { level: 2, capacity: 20, upgradeCost: 25 },
    { level: 3, capacity: 35, upgradeCost: 60 }
  ];
  const PLAYER_COLORS = ['#4f8cff', '#ff5f6d', '#3fd47f', '#ffcd4d', '#b967ff', '#ff8c42', '#35d0ba', '#f05bd8'];
  const STORE_ZONES = [
    { x: 70, y: 70, w: 150, h: 110 },
    { x: 270, y: 70, w: 150, h: 110 },
    { x: 470, y: 70, w: 150, h: 110 },
    { x: 670, y: 70, w: 150, h: 110 },
    { x: 70, y: 320, w: 150, h: 110 },
    { x: 270, y: 320, w: 150, h: 110 },
    { x: 470, y: 320, w: 150, h: 110 },
    { x: 670, y: 320, w: 150, h: 110 }
  ];
  const MAP = { width: 900, height: 520, entrance: { x: 450, y: 500 }, exit: { x: 450, y: 12 } };

  const dom = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    playerName: document.getElementById('player-name'),
    roomCode: document.getElementById('room-code'),
    createRoom: document.getElementById('create-room'),
    joinRoom: document.getElementById('join-room'),
    startGame: document.getElementById('start-game'),
    startError: document.getElementById('start-error'),
    roomLabel: document.getElementById('room-label'),
    playerLabel: document.getElementById('player-label'),
    statusLabel: document.getElementById('status-label'),
    playersLabel: document.getElementById('players-label'),
    timerLabel: document.getElementById('timer-label'),
    money: document.getElementById('money-stat'),
    revenue: document.getElementById('revenue-stat'),
    cost: document.getElementById('cost-stat'),
    profit: document.getElementById('profit-stat'),
    productControls: document.getElementById('product-controls'),
    leaderboard: document.getElementById('leaderboard-list'),
    gameMessage: document.getElementById('game-message'),
    canvas: document.getElementById('game-canvas')
  };
  const ctx = dom.canvas.getContext('2d');

  let game = null;
  let lastFrameAt = 0;
  let lastCustomerSpawnAt = 0;

  function money(value) {
    return `$${Math.round(Number(value || 0))}`;
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
  }

  function randomRoomCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  }

  function cleanName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 18) || `Mart ${Math.floor(Math.random() * 90) + 10}`;
  }

  function productMap(factory) {
    return Object.fromEntries(PRODUCT_NAMES.map((product) => [product, factory(product)]));
  }

  function createPlayer(id, name, storeIndex, isHuman) {
    return {
      id,
      name,
      storeIndex,
      color: PLAYER_COLORS[storeIndex],
      isHuman,
      money: STARTING_MONEY,
      revenue: 0,
      cost: 0,
      profit: 0,
      unitsSold: 0,
      inventory: productMap(() => 0),
      prices: productMap((product) => PRODUCTS[product].defaultPrice),
      shelves: productMap(() => ({ stock: 0, capacity: SHELF_LEVELS[0].capacity, level: 1 }))
    };
  }

  function resetPlayer(player) {
    player.money = STARTING_MONEY;
    player.revenue = 0;
    player.cost = 0;
    player.profit = 0;
    player.unitsSold = 0;
    player.inventory = productMap(() => 0);
    player.prices = productMap((product) => PRODUCTS[product].defaultPrice);
    player.shelves = productMap(() => ({ stock: 0, capacity: SHELF_LEVELS[0].capacity, level: 1 }));
  }

  function createGame(code, humanName) {
    const players = [createPlayer('human', cleanName(humanName), 0, true)];
    const aiNames = ['Fresh Fox', 'Budget Bee', 'Green Grocer', 'Pixel Foods', 'Snack Shack', 'Value Valley', 'Juice Junction'];
    for (let i = 1; i < MAX_PLAYERS; i += 1) players.push(createPlayer(`ai-${i}`, aiNames[i - 1], i, false));
    return { code, status: 'waiting', timeRemaining: ROUND_SECONDS, players, customers: [], leaderboard: [], lastCustomerId: 0 };
  }

  function showGame() {
    dom.startScreen.classList.add('hidden');
    dom.gameScreen.classList.remove('hidden');
    render();
  }

  function showMessage(message, warning) {
    dom.startError.textContent = message || '';
    dom.gameMessage.textContent = message || '';
    dom.gameMessage.classList.toggle('warning', Boolean(warning));
  }

  function createOrJoin(code) {
    const roomCode = code || randomRoomCode();
    game = createGame(roomCode.toUpperCase(), dom.playerName.value);
    dom.roomCode.value = game.code;
    showMessage('Static mode: this local room runs entirely inside this browser tab.', false);
    showGame();
  }

  function recalculateProfit(player) {
    player.profit = Math.round((player.revenue - player.cost) * 100) / 100;
  }

  function setPrice(player, product, price) {
    const rules = PRODUCTS[product];
    const parsed = Number(price);
    if (!rules || !Number.isFinite(parsed)) return;
    player.prices[product] = Math.min(rules.maxPrice, Math.max(rules.minPrice, Math.round(parsed * 100) / 100));
  }

  function buyStock(player, product, quantity) {
    if (game.status !== 'playing') return showMessage('Start the round before buying stock.', true);
    const amount = Math.max(1, Math.min(50, Number.parseInt(quantity, 10) || 5));
    const cost = PRODUCTS[product].cost * amount;
    if (player.money < cost) return showMessage(`Not enough money to buy ${amount} ${product}.`, true);
    player.money -= cost;
    player.cost += cost;
    player.inventory[product] += amount;
    recalculateProfit(player);
    render();
  }

  function restockShelf(player, product, quantity) {
    if (game.status !== 'playing') return showMessage('Start the round before restocking shelves.', true);
    const shelf = player.shelves[product];
    const amount = Math.max(1, Math.min(50, Number.parseInt(quantity, 10) || 5));
    const moved = Math.min(amount, player.inventory[product], shelf.capacity - shelf.stock);
    if (moved <= 0) return showMessage('No inventory or shelf space available.', true);
    player.inventory[product] -= moved;
    shelf.stock += moved;
    render();
  }

  function upgradeShelf(player, product) {
    if (game.status !== 'playing') return showMessage('Start the round before upgrading shelves.', true);
    const shelf = player.shelves[product];
    const nextLevel = SHELF_LEVELS.find((level) => level.level === shelf.level + 1);
    if (!nextLevel) return showMessage(`${product} shelf is already max level.`, true);
    if (player.money < nextLevel.upgradeCost) return showMessage('Not enough money for upgrade.', true);
    player.money -= nextLevel.upgradeCost;
    player.cost += nextLevel.upgradeCost;
    shelf.level = nextLevel.level;
    shelf.capacity = nextLevel.capacity;
    recalculateProfit(player);
    render();
  }

  function startRound() {
    if (!game) return;
    game.players.forEach(resetPlayer);
    seedAiStores();
    game.customers = [];
    game.timeRemaining = ROUND_SECONDS;
    game.status = 'playing';
    lastFrameAt = performance.now();
    lastCustomerSpawnAt = 0;
    showMessage('Round started. Keep shelves stocked and prices competitive!', false);
    render();
  }

  function seedAiStores() {
    game.players.filter((player) => !player.isHuman).forEach((player, index) => {
      PRODUCT_NAMES.forEach((product) => {
        const base = PRODUCTS[product];
        const quantity = 6 + Math.floor(Math.random() * 8);
        const totalCost = base.cost * quantity;
        player.money -= totalCost;
        player.cost += totalCost;
        player.inventory[product] += quantity;
        player.shelves[product].stock = Math.min(quantity, player.shelves[product].capacity);
        player.inventory[product] -= player.shelves[product].stock;
        player.prices[product] = Math.max(base.minPrice, Math.min(base.maxPrice, base.defaultPrice + ((index % 3) - 1)));
      });
      recalculateProfit(player);
    });
  }

  function weightedProductChoice() {
    const total = PRODUCT_NAMES.reduce((sum, product) => sum + PRODUCTS[product].demandWeight, 0);
    let roll = Math.random() * total;
    for (const product of PRODUCT_NAMES) {
      roll -= PRODUCTS[product].demandWeight;
      if (roll <= 0) return product;
    }
    return PRODUCT_NAMES[0];
  }

  function willingnessToPay(product) {
    const info = PRODUCTS[product];
    return info.defaultPrice + Math.random() * (info.maxPrice - info.defaultPrice);
  }

  function scoreStore(player, product, willingness) {
    const info = PRODUCTS[product];
    const shelf = player.shelves[product];
    if (shelf.stock <= 0 || player.prices[product] > willingness) return Number.NEGATIVE_INFINITY;
    const priceAbove = Math.max(0, player.prices[product] - info.defaultPrice);
    const priceBelow = Math.max(0, info.defaultPrice - player.prices[product]);
    return (info.demandWeight / 10)
      - (priceAbove * info.elasticity * 10)
      + (priceBelow * info.elasticity * 3)
      + (Math.min(shelf.stock, 10) * 0.5)
      + (Math.random() * 2);
  }

  function chooseStore(product, willingness) {
    let best = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    game.players.forEach((player) => {
      const score = scoreStore(player, product, willingness);
      if (score > bestScore) {
        best = player;
        bestScore = score;
      }
    });
    return best;
  }

  function spawnCustomer() {
    if (game.customers.length >= CUSTOMER_LIMIT) return;
    const product = weightedProductChoice();
    const willingness = willingnessToPay(product);
    const targetPlayer = chooseStore(product, willingness);
    const targetZone = targetPlayer ? STORE_ZONES[targetPlayer.storeIndex] : null;
    game.lastCustomerId += 1;
    game.customers.push({
      id: `customer-${game.lastCustomerId}`,
      product,
      targetPlayerId: targetPlayer ? targetPlayer.id : null,
      state: targetPlayer ? 'walking' : 'leaving',
      x: MAP.entrance.x,
      y: MAP.entrance.y,
      targetX: targetZone ? targetZone.x + targetZone.w / 2 : MAP.exit.x,
      targetY: targetZone ? targetZone.y + targetZone.h / 2 : MAP.exit.y,
      willingness,
      age: 0
    });
  }

  function moveToward(entity, x, y, speed) {
    const dx = x - entity.x;
    const dy = y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= speed || distance === 0) {
      entity.x = x;
      entity.y = y;
      return true;
    }
    entity.x += (dx / distance) * speed;
    entity.y += (dy / distance) * speed;
    return false;
  }

  function recordSale(player, product) {
    const shelf = player.shelves[product];
    if (shelf.stock <= 0) return false;
    shelf.stock -= 1;
    player.money += player.prices[product];
    player.revenue += player.prices[product];
    player.unitsSold += 1;
    recalculateProfit(player);
    return true;
  }

  function updateCustomers() {
    game.customers = game.customers.filter((customer) => {
      customer.age += 1;
      if (customer.state === 'walking') {
        if (!moveToward(customer, customer.targetX, customer.targetY, 2.2)) return true;
        const player = game.players.find((candidate) => candidate.id === customer.targetPlayerId);
        const canBuy = player && player.shelves[customer.product].stock > 0 && player.prices[customer.product] <= customer.willingness;
        customer.state = canBuy && recordSale(player, customer.product) ? 'bought' : 'leaving';
        customer.targetX = MAP.exit.x;
        customer.targetY = MAP.exit.y;
        return true;
      }
      if (customer.state === 'bought' || customer.state === 'leaving') return !moveToward(customer, MAP.exit.x, MAP.exit.y, 2.8);
      return customer.age < 900;
    });
  }

  function updateAiStores() {
    if (Math.random() > 0.02) return;
    game.players.filter((player) => !player.isHuman).forEach((player) => {
      const product = PRODUCT_NAMES[Math.floor(Math.random() * PRODUCT_NAMES.length)];
      const shelf = player.shelves[product];
      if (shelf.stock < 3 && player.money >= PRODUCTS[product].cost * 5) {
        const cost = PRODUCTS[product].cost * 5;
        player.money -= cost;
        player.cost += cost;
        shelf.stock = Math.min(shelf.capacity, shelf.stock + 5);
        recalculateProfit(player);
      }
      if (Math.random() < 0.08) setPrice(player, product, player.prices[product] + (Math.random() < 0.5 ? -1 : 1));
    });
  }

  function calculateLeaderboard() {
    const totalSales = game.players.reduce((sum, player) => sum + player.unitsSold, 0);
    game.leaderboard = game.players
      .map((player) => ({
        id: player.id,
        name: player.name,
        color: player.color,
        profit: player.profit,
        revenue: player.revenue,
        cost: player.cost,
        unitsSold: player.unitsSold,
        marketShare: totalSales === 0 ? 0 : Math.round((player.unitsSold / totalSales) * 100)
      }))
      .sort((a, b) => b.profit - a.profit || b.revenue - a.revenue || a.name.localeCompare(b.name));
  }

  function tick(now) {
    if (game && game.status === 'playing') {
      const delta = Math.min(0.1, (now - lastFrameAt) / 1000 || 0);
      lastFrameAt = now;
      game.timeRemaining = Math.max(0, game.timeRemaining - delta);
      if (now - lastCustomerSpawnAt >= CUSTOMER_SPAWN_MS) {
        spawnCustomer();
        lastCustomerSpawnAt = now;
      }
      updateAiStores();
      updateCustomers();
      if (game.timeRemaining <= 0) {
        game.status = 'ended';
        showMessage('Round ended. The leaderboard shows final profit rankings.', false);
      }
      render();
    } else {
      drawMap();
    }
    requestAnimationFrame(tick);
  }

  function renderProductControls(human) {
    const disabled = game.status !== 'playing' ? 'disabled' : '';
    dom.productControls.innerHTML = '';
    PRODUCT_NAMES.forEach((product) => {
      const info = PRODUCTS[product];
      const shelf = human.shelves[product];
      const card = document.createElement('article');
      card.className = 'product-card';
      card.innerHTML = `
        <h4><span>${info.emoji} ${product}</span><span>Cost ${money(info.cost)}</span></h4>
        <div class="product-row"><span>Price</span><input data-price="${product}" type="number" min="${info.minPrice}" max="${info.maxPrice}" step="1" value="${human.prices[product]}" ${disabled}></div>
        <div class="product-row"><span>Inventory</span><strong>${human.inventory[product]}</strong></div>
        <div class="product-row"><span>Shelf</span><strong>${shelf.stock}/${shelf.capacity} · Lv ${shelf.level}</strong></div>
        <p class="lesson">${info.lesson}</p>
        <div class="product-actions">
          <button data-buy="${product}" ${disabled}>Buy 5</button>
          <button data-restock="${product}" ${disabled}>Restock 5</button>
          <button data-upgrade="${product}" ${disabled}>Upgrade Shelf</button>
        </div>
      `;
      dom.productControls.appendChild(card);
    });
    dom.productControls.querySelectorAll('[data-price]').forEach((input) => input.addEventListener('change', () => setPrice(human, input.dataset.price, input.value)));
    dom.productControls.querySelectorAll('[data-buy]').forEach((button) => button.addEventListener('click', () => buyStock(human, button.dataset.buy, 5)));
    dom.productControls.querySelectorAll('[data-restock]').forEach((button) => button.addEventListener('click', () => restockShelf(human, button.dataset.restock, 5)));
    dom.productControls.querySelectorAll('[data-upgrade]').forEach((button) => button.addEventListener('click', () => upgradeShelf(human, button.dataset.upgrade)));
  }

  function renderLeaderboard() {
    dom.leaderboard.innerHTML = '';
    game.leaderboard.forEach((entry) => {
      const item = document.createElement('li');
      item.style.borderLeftColor = entry.color;
      item.innerHTML = `<strong>${entry.name}</strong> — ${money(entry.profit)} profit<small>Revenue ${money(entry.revenue)} · Cost ${money(entry.cost)} · Sales ${entry.unitsSold} · Market Share ${entry.marketShare}%</small>`;
      dom.leaderboard.appendChild(item);
    });
  }

  function render() {
    if (!game) return;
    calculateLeaderboard();
    const human = game.players[0];
    dom.roomLabel.textContent = `Room ${game.code}`;
    dom.playerLabel.textContent = human.name;
    dom.playerLabel.style.color = human.color;
    dom.statusLabel.textContent = game.status;
    dom.playersLabel.textContent = `${game.players.length}/${MAX_PLAYERS}`;
    dom.timerLabel.textContent = game.status === 'ended' ? 'Ended' : formatTime(game.timeRemaining);
    dom.startGame.textContent = game.status === 'ended' ? 'Restart Round' : 'Start Round';
    dom.startGame.disabled = game.status === 'playing';
    dom.money.textContent = money(human.money);
    dom.revenue.textContent = money(human.revenue);
    dom.cost.textContent = money(human.cost);
    dom.profit.textContent = money(human.profit);
    renderProductControls(human);
    renderLeaderboard();
    drawMap();
  }

  function drawFloor() {
    const tile = 32;
    ctx.fillStyle = '#77aa6a';
    ctx.fillRect(0, 0, MAP.width, MAP.height);
    for (let y = 0; y < MAP.height; y += tile) {
      for (let x = 0; x < MAP.width; x += tile) {
        ctx.fillStyle = ((x + y) / tile) % 2 === 0 ? '#7fb873' : '#72a965';
        ctx.fillRect(x, y, tile, tile);
      }
    }
    ctx.fillStyle = '#c9b48a';
    ctx.fillRect(20, 225, 860, 58);
    ctx.fillRect(426, 20, 58, 480);
  }

  function drawStore(zone, player) {
    ctx.fillStyle = '#efe0b6';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = player.color;
    ctx.lineWidth = player.isHuman ? 7 : 4;
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.fillStyle = player.color;
    ctx.fillRect(zone.x, zone.y, zone.w, 18);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(player.name.slice(0, 14), zone.x + 8, zone.y + 14);
    PRODUCT_NAMES.forEach((product, index) => {
      const shelfX = zone.x + 15 + index * 43;
      const shelfY = zone.y + 43;
      const shelf = player.shelves[product];
      const stockRatio = shelf.capacity === 0 ? 0 : shelf.stock / shelf.capacity;
      ctx.fillStyle = '#7b4c2b';
      ctx.fillRect(shelfX, shelfY, 32, 46);
      ctx.fillStyle = PRODUCTS[product].color;
      ctx.fillRect(shelfX + 5, shelfY + 8 + (1 - stockRatio) * 25, 22, Math.max(4, stockRatio * 25));
      ctx.fillStyle = '#111';
      ctx.font = '10px monospace';
      ctx.fillText(product[0], shelfX + 12, shelfY + 39);
    });
  }

  function drawCustomers() {
    if (!game) return;
    game.customers.forEach((customer) => {
      ctx.fillStyle = '#252525';
      ctx.fillRect(customer.x - 6, customer.y - 10, 12, 18);
      ctx.fillStyle = PRODUCTS[customer.product].color;
      ctx.fillRect(customer.x - 5, customer.y - 17, 10, 8);
      ctx.fillStyle = '#f4c28b';
      ctx.fillRect(customer.x - 4, customer.y - 25, 8, 8);
    });
  }

  function drawLegend() {
    ctx.fillStyle = 'rgba(20, 30, 22, 0.85)';
    ctx.fillRect(12, 12, 230, 42);
    ctx.fillStyle = '#f7edcf';
    ctx.font = '13px monospace';
    ctx.fillText('Static local market simulation', 22, 38);
  }

  function drawMap() {
    drawFloor();
    if (game) STORE_ZONES.forEach((zone, index) => drawStore(zone, game.players[index]));
    drawCustomers();
    drawLegend();
  }

  dom.createRoom.addEventListener('click', () => createOrJoin(''));
  dom.joinRoom.addEventListener('click', () => {
    const code = dom.roomCode.value.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(code)) return showMessage('Enter a 4-character local room code.', true);
    createOrJoin(code);
  });
  dom.startGame.addEventListener('click', startRound);

  drawMap();
  requestAnimationFrame(tick);
}());
