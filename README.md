# SuperMart Battle

SuperMart Battle is a browser-based 2D pixel-style multiplayer supermarket management MVP. Up to 8 players can join one room with a room code, run fixed supermarket areas, buy inventory, restock shelves, set prices, and compete for the highest profit.

## MVP Features

- Create or join a room code.
- Up to 8 players in one shared map.
- Three products: Milk, Bread, and Juice.
- Buy stock, restock shelves, set prices, and upgrade shelf capacity.
- Customer NPCs automatically choose stores using price, stock, demand, and price elasticity.
- Live dashboard for money, revenue, cost, profit, market share, and leaderboard.
- Server memory storage only; no database required for the MVP.

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:3000` in multiple browser tabs to test multiplayer room behavior.

## Deployment Notes

Use a Node.js host such as Render or Replit. Do not use GitHub Pages for the multiplayer version because GitHub Pages only hosts static files and cannot run the Socket.io backend.

## Design Document

See `docs/supermart-battle-mvp-design.md` for the full MVP game design and development plan.

## Pixel Asset Prompts

Use `docs/image2-asset-prompts.md` for image2 prompts to create MVP tiles, customers, shelves, and product icons.
