# SuperMart Battle — Static GitHub Pages Edition

SuperMart Battle is now a fully static browser game that runs directly from GitHub Pages. There is no Node.js server, no Socket.io backend, and no database.

## Important Static Mode Note

Because GitHub Pages only serves static files, this version cannot synchronize real players across different devices. The GitHub Pages build keeps the core supermarket gameplay as a local browser simulation:

- You create or join a local room code in one browser tab.
- The shared map contains 8 supermarket zones.
- You control one supermarket.
- The other supermarket zones are local computer competitors.
- Customer NPCs still choose stores based on demand, supply, price, stock, and price elasticity.

## GitHub Pages Entry Point

The production static build is inside `/docs`:

```text
docs/index.html
```

Configure GitHub Pages to serve from the repository's `/docs` folder on the current branch.

## Run Locally Without a Backend

Open this file directly in a browser:

```text
docs/index.html
```

You can also use any static file server, but it is not required for gameplay.

## MVP Features

- Fully static HTML/CSS/JavaScript.
- No Node.js runtime required for the game.
- No backend and no database.
- 2D top-down pixel-style canvas map.
- 8 supermarket zones on one shared local map.
- 3 products: Milk, Bread, and Juice.
- Buy stock, restock shelves, set prices, and upgrade shelf capacity.
- Customer NPCs automatically choose stores using price, stock, demand, willingness to pay, and price elasticity.
- Live dashboard for money, revenue, cost, profit, sales, market share, and leaderboard.

## How to Play

1. Open `docs/index.html` or the deployed GitHub Pages URL.
2. Enter your supermarket name.
3. Click **Create Local Room** or enter a 4-character code and click **Join Local Room**.
4. Click **Start Round**.
5. Buy inventory, restock shelves, and adjust prices.
6. Customers walk around the map and buy from stores with good price/stock combinations.
7. When the timer ends, the leaderboard ranks stores by profit.

## Economics Concepts

- **Demand:** product preference weights make Bread more common than Juice.
- **Supply:** shelf stock and inventory determine whether a store can satisfy customers.
- **Revenue:** increases when customers buy products.
- **Cost:** increases when players buy stock or upgrade shelves.
- **Profit:** `revenue - cost`, used as the main winning score.
- **Competition:** your supermarket competes with local computer stores for the same customers.
- **Market Share:** each store's sales divided by total local market sales.
- **Price Elasticity:** Juice customers react more strongly to high prices than Bread customers.

## Static Project Structure

```text
.
├── docs/
│   ├── index.html                  # GitHub Pages entry point
│   ├── css/styles.css              # Pixel-style production CSS
│   ├── js/game.js                  # Full static game logic and rendering
│   ├── image2-asset-prompts.md     # Pixel asset generation prompts
│   └── supermart-battle-mvp-design.md
├── tests/static-build.test.js      # Static build smoke checks
├── package.json                    # Optional local checks only; no runtime deps
└── README.md
```

## Optional Checks

The game itself does not need Node.js. If Node.js is available, you can run a static build smoke check:

```bash
npm test
```
