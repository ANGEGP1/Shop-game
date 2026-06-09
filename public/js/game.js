(function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  let roomState = null;
  let localPlayerId = null;

  function setState(nextState, playerId) {
    roomState = nextState;
    localPlayerId = playerId || localPlayerId;
    draw();
  }

  function drawTileFloor() {
    const tile = 32;
    ctx.fillStyle = '#77aa6a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += tile) {
      for (let x = 0; x < canvas.width; x += tile) {
        ctx.fillStyle = ((x + y) / tile) % 2 === 0 ? '#7fb873' : '#72a965';
        ctx.fillRect(x, y, tile, tile);
      }
    }

    ctx.fillStyle = '#c9b48a';
    ctx.fillRect(20, 225, 860, 58);
    ctx.fillRect(426, 20, 58, 480);
  }

  function drawStore(zone, player) {
    const ownerColor = player ? player.color : '#607466';
    ctx.fillStyle = '#efe0b6';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = ownerColor;
    ctx.lineWidth = player && player.id === localPlayerId ? 7 : 4;
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);

    ctx.fillStyle = ownerColor;
    ctx.fillRect(zone.x, zone.y, zone.w, 18);

    ctx.fillStyle = '#111';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(player ? player.name.slice(0, 14) : 'Open Store', zone.x + 8, zone.y + 14);

    const products = ['Milk', 'Bread', 'Juice'];
    products.forEach((product, index) => {
      const shelfX = zone.x + 15 + index * 43;
      const shelfY = zone.y + 43;
      const shelf = player && player.shelves[product];
      const stockRatio = shelf ? shelf.stock / shelf.capacity : 0;

      ctx.fillStyle = '#7b4c2b';
      ctx.fillRect(shelfX, shelfY, 32, 46);
      ctx.fillStyle = window.SuperMartConfig.productColors[product] || '#fff';
      ctx.fillRect(shelfX + 5, shelfY + 8 + (1 - stockRatio) * 25, 22, Math.max(4, stockRatio * 25));

      ctx.fillStyle = '#111';
      ctx.font = '10px monospace';
      ctx.fillText(product[0], shelfX + 12, shelfY + 39);
    });
  }

  function drawCustomers() {
    if (!roomState) return;
    roomState.customers.forEach((customer) => {
      const color = window.SuperMartConfig.productColors[customer.product] || '#fff';
      ctx.fillStyle = '#252525';
      ctx.fillRect(customer.x - 6, customer.y - 10, 12, 18);
      ctx.fillStyle = color;
      ctx.fillRect(customer.x - 5, customer.y - 17, 10, 8);
      ctx.fillStyle = '#f4c28b';
      ctx.fillRect(customer.x - 4, customer.y - 25, 8, 8);
    });
  }

  function drawLegend() {
    ctx.fillStyle = 'rgba(20, 30, 22, 0.85)';
    ctx.fillRect(12, 12, 190, 42);
    ctx.fillStyle = '#f7edcf';
    ctx.font = '13px monospace';
    ctx.fillText('NPC demand: Milk Bread Juice', 22, 38);
  }

  function draw() {
    drawTileFloor();

    const playersByStore = new Map();
    if (roomState) {
      Object.values(roomState.players).forEach((player) => playersByStore.set(player.storeIndex, player));
    }

    const zones = roomState && roomState.storeZones ? roomState.storeZones : [];
    zones.forEach((zone, index) => drawStore(zone, playersByStore.get(index)));
    drawCustomers();
    drawLegend();
  }

  draw();

  window.SuperMartGame = { setState, draw };
}());
