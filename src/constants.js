// Shared constants for the SuperMart Battle MVP.
// Keep numbers here so students can tune the game balance in one place.

const MAX_PLAYERS = 8;
const STARTING_MONEY = 100;
const ROUND_SECONDS = 300;
const CUSTOMER_SPAWN_MS = 1700;
const GAME_TICK_MS = 1000;
const ROOM_CODE_LENGTH = 4;

const PRODUCTS = {
  Milk: {
    name: 'Milk',
    cost: 2,
    defaultPrice: 4,
    minPrice: 2,
    maxPrice: 8,
    demandWeight: 35,
    elasticity: 0.65
  },
  Bread: {
    name: 'Bread',
    cost: 1,
    defaultPrice: 3,
    minPrice: 1,
    maxPrice: 6,
    demandWeight: 45,
    elasticity: 0.35
  },
  Juice: {
    name: 'Juice',
    cost: 3,
    defaultPrice: 5,
    minPrice: 3,
    maxPrice: 10,
    demandWeight: 20,
    elasticity: 0.9
  }
};

const SHELF_LEVELS = [
  { level: 1, capacity: 10, upgradeCost: 0 },
  { level: 2, capacity: 20, upgradeCost: 25 },
  { level: 3, capacity: 35, upgradeCost: 60 }
];

const PLAYER_COLORS = [
  '#4f8cff',
  '#ff5f6d',
  '#3fd47f',
  '#ffcd4d',
  '#b967ff',
  '#ff8c42',
  '#35d0ba',
  '#f05bd8'
];

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

const MAP_SIZE = {
  width: 900,
  height: 520,
  entrance: { x: 450, y: 500 },
  exit: { x: 450, y: 12 }
};

module.exports = {
  MAX_PLAYERS,
  STARTING_MONEY,
  ROUND_SECONDS,
  CUSTOMER_SPAWN_MS,
  GAME_TICK_MS,
  ROOM_CODE_LENGTH,
  PRODUCTS,
  SHELF_LEVELS,
  PLAYER_COLORS,
  STORE_ZONES,
  MAP_SIZE
};
