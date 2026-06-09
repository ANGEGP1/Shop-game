const { PRODUCTS, MAP_SIZE, STORE_ZONES } = require('./constants');
const { recordSale } = require('./economy');

function weightedProductChoice() {
  const entries = Object.entries(PRODUCTS);
  const totalWeight = entries.reduce((total, [, product]) => total + product.demandWeight, 0);
  let roll = Math.random() * totalWeight;

  for (const [name, product] of entries) {
    roll -= product.demandWeight;
    if (roll <= 0) return name;
  }
  return entries[0][0];
}

function customerWillingnessToPay(productName) {
  const product = PRODUCTS[productName];
  const flexibility = product.maxPrice - product.defaultPrice;
  return product.defaultPrice + Math.random() * flexibility;
}

function scoreStore(player, productName, willingnessToPay) {
  const product = PRODUCTS[productName];
  const shelf = player.shelves[productName];
  if (!shelf || shelf.stock <= 0) return Number.NEGATIVE_INFINITY;

  const price = player.prices[productName];
  if (price > willingnessToPay) return Number.NEGATIVE_INFINITY;

  const priceAboveDefault = Math.max(0, price - product.defaultPrice);
  const pricePenalty = priceAboveDefault * product.elasticity * 10;
  const stockBonus = Math.min(shelf.stock, 10) * 0.5;
  const demandValue = product.demandWeight / 10;
  const randomVariation = Math.random() * 2;

  return demandValue - pricePenalty + stockBonus + randomVariation;
}

function chooseStore(room, productName, willingnessToPay) {
  let best = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const player of Object.values(room.players)) {
    const score = scoreStore(player, productName, willingnessToPay);
    if (score > bestScore) {
      bestScore = score;
      best = player;
    }
  }

  return bestScore === Number.NEGATIVE_INFINITY ? null : best;
}

function spawnCustomer(room) {
  const desiredProduct = weightedProductChoice();
  const willingnessToPay = customerWillingnessToPay(desiredProduct);
  const targetPlayer = chooseStore(room, desiredProduct, willingnessToPay);
  const targetZone = targetPlayer ? STORE_ZONES[targetPlayer.storeIndex] : null;

  room.lastCustomerId += 1;
  const customer = {
    id: `${room.code}-${room.lastCustomerId}`,
    product: desiredProduct,
    targetPlayerId: targetPlayer ? targetPlayer.id : null,
    state: targetPlayer ? 'walking' : 'leaving',
    x: MAP_SIZE.entrance.x,
    y: MAP_SIZE.entrance.y,
    targetX: targetZone ? targetZone.x + targetZone.w / 2 : MAP_SIZE.exit.x,
    targetY: targetZone ? targetZone.y + targetZone.h / 2 : MAP_SIZE.exit.y,
    willingnessToPay: Math.round(willingnessToPay * 100) / 100,
    age: 0
  };

  room.customers.push(customer);
}

function moveToward(customer, x, y, speed) {
  const dx = x - customer.x;
  const dy = y - customer.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance <= speed) {
    customer.x = x;
    customer.y = y;
    return true;
  }
  customer.x += (dx / distance) * speed;
  customer.y += (dy / distance) * speed;
  return false;
}

function updateCustomer(room, customer) {
  customer.age += 1;

  if (customer.state === 'walking') {
    const arrived = moveToward(customer, customer.targetX, customer.targetY, 34);
    if (!arrived) return true;

    const player = room.players[customer.targetPlayerId];
    const canBuy = player
      && player.shelves[customer.product].stock > 0
      && player.prices[customer.product] <= customer.willingnessToPay;

    if (canBuy) {
      recordSale(player, customer.product);
      customer.state = 'bought';
    } else {
      customer.state = 'leaving';
    }
    customer.targetX = MAP_SIZE.exit.x;
    customer.targetY = MAP_SIZE.exit.y;
    return true;
  }

  if (customer.state === 'bought' || customer.state === 'leaving') {
    return !moveToward(customer, MAP_SIZE.exit.x, MAP_SIZE.exit.y, 42);
  }

  return customer.age < 30;
}

function updateCustomers(room) {
  room.customers = room.customers.filter((customer) => updateCustomer(room, customer));
}

module.exports = {
  spawnCustomer,
  updateCustomers
};
