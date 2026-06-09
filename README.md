# SuperMart Battle

SuperMart Battle is a browser-based 2D pixel-style multiplayer supermarket management MVP. Up to 8 players join one room with a room code, run fixed supermarket areas, buy inventory, restock shelves, set prices, upgrade shelf capacity, and compete for the highest profit.

## MVP Features

- Create or join a room code.
- Up to 8 players in one shared top-down map.
- Host-controlled start/restart flow.
- Three products: Milk, Bread, and Juice.
- Buy stock, restock shelves, set prices, and upgrade shelf capacity.
- Customer NPCs automatically choose stores using price, stock, demand, willingness to pay, and price elasticity.
- Live dashboard for money, revenue, cost, profit, sales, market share, and leaderboard.
- Server memory storage only; no database required for the MVP.

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:3000` in multiple browser tabs to test multiplayer room behavior.

## Test Locally

```bash
npm test
```

The current tests use Node's built-in `assert` module and do not require a browser. They cover core economy calculations, room host behavior, customer store choice, and room cleanup.

## How to Play

1. Player 1 enters a name and clicks **Create Room**.
2. Player 1 shares the room code with classmates.
3. Other players enter a name, paste the room code, and click **Join Room**.
4. The host clicks **Start Round**.
5. Each player buys inventory, restocks shelves, and adjusts prices.
6. Customers walk around the shared map and buy from stores with good price/stock combinations.
7. When the timer ends, the leaderboard ranks players by profit.

## Economics Concepts

- **Demand:** customer product preference weights make Bread more common than Juice.
- **Supply:** shelf stock and inventory determine whether a store can satisfy customers.
- **Revenue:** increases when customers buy products.
- **Cost:** increases when players buy stock or upgrade shelves.
- **Profit:** `revenue - cost`, used as the main winning score.
- **Competition:** all players compete for the same customer NPCs.
- **Market Share:** each player's sales divided by total room sales.
- **Price Elasticity:** Juice customers react more strongly to high prices than Bread customers.

## Project Structure

```text
.
├── server.js                  # Express + Socket.io server
├── src/
│   ├── constants.js           # Tunable game constants
│   ├── customerAI.js          # Customer demand and store-choice logic
│   ├── economy.js             # Prices, stock, shelves, profit, leaderboard
│   ├── gameLoop.js            # Server tick, timer, customers, broadcasts
│   └── roomManager.js         # In-memory room/player management
├── public/
│   ├── index.html             # Browser UI shell
│   ├── css/styles.css         # Pixel-style layout
│   └── js/                    # Client socket, UI, and canvas renderer
├── tests/                     # Node assert smoke/unit tests
├── docs/                      # Design document and image2 prompts
└── render.yaml                # Render deployment example
```

## Deployment Notes

Use a Node.js host such as Render or Replit. Do not use GitHub Pages for the multiplayer version because GitHub Pages only hosts static files and cannot run the Socket.io backend.

### Render

This repo includes `render.yaml` with:

- build command: `npm install`
- start command: `npm start`
- health check: `/health`

## Pixel Asset Prompts

Use `docs/image2-asset-prompts.md` for image2 prompts to create MVP tiles, customers, shelves, and product icons.

## Design Document

See `docs/supermart-battle-mvp-design.md` for the full MVP game design and development plan.
