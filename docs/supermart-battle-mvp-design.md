# SuperMart Battle — Static GitHub Pages Design Document

## 1. Final Static Game Design

**SuperMart Battle** is a fully static browser game that runs from `docs/index.html` on GitHub Pages. It keeps the original 2D pixel-style supermarket management concept, but removes all backend requirements.

### Static architecture rule

GitHub Pages can only serve static files, so this version has:

- No Node.js server.
- No Socket.io synchronization.
- No database.
- No server memory room state.
- No external game runtime dependency.
- All game state stored in the current browser tab.

### Gameplay concept

The player controls one supermarket zone on a shared local map and competes against local computer-controlled stores. Customers walk through the map and choose stores based on demand, supply, price, stock, and price elasticity.

### MVP scope

- Static room-code screen.
- One local player.
- Seven local computer competitors.
- One shared top-down 2D pixel-style map.
- Eight fixed supermarket zones.
- Three products: Milk, Bread, and Juice.
- Product price controls.
- Buy stock controls.
- Restock shelf controls.
- Shelf upgrades.
- Customer NPC movement and purchases.
- Real-time money, revenue, cost, profit, sales, market share, and leaderboard.
- Round timer and restart flow.

## 2. Game Page Layout

The static production entry point is:

```text
docs/index.html
```

The page layout has four areas:

1. **Start screen**
   - Player supermarket name.
   - Create local room.
   - Join local room code.
   - Static-mode explanation.

2. **Top status bar**
   - Room code.
   - Player name.
   - Game status.
   - Number of stores.
   - Timer.
   - Start/restart button.

3. **Management panel**
   - Money.
   - Revenue.
   - Cost.
   - Profit.
   - Product cards for Milk, Bread, and Juice.
   - Price inputs.
   - Buy, restock, and upgrade buttons.

4. **Map and leaderboard**
   - Canvas-rendered top-down pixel map.
   - Eight store zones.
   - Moving customer NPCs.
   - Leaderboard ranked by profit.
   - Economics explanation box.

## 3. Player Flow

1. Player opens the GitHub Pages URL.
2. Player enters a supermarket name.
3. Player clicks **Create Local Room** or enters a 4-character local room code.
4. The game creates a local market with 8 stores.
5. Player clicks **Start Round**.
6. Player buys inventory, restocks shelves, and changes prices.
7. Customer NPCs move through the map and buy from competing stores.
8. Dashboard and leaderboard update live.
9. When the timer ends, the final leaderboard shows who earned the highest profit.
10. Player can click **Restart Round** to play again.

## 4. Static Room System Design

The room code is a local classroom/game label only. It does not connect different browsers or devices.

```text
Local room code = visual label + local game seed concept
```

Because there is no backend, separate students opening the same code on different computers will not share state. This is an intentional tradeoff required for GitHub Pages compatibility.

## 5. Customer AI Design

Each customer:

1. Spawns at the map entrance.
2. Chooses a desired product using demand weights.
3. Calculates willingness to pay.
4. Scores all stores that have shelf stock.
5. Walks to the best store.
6. Buys one unit if the price is acceptable and stock remains.
7. Leaves the map.

Store score:

```text
score = demandValue - pricePenalty + discountBonus + stockBonus + randomVariation
```

This keeps customer behavior simple enough for a student project while still showing economic tradeoffs.

## 6. Product and Pricing System

| Product | Supplier Cost | Default Price | Demand | Elasticity |
| --- | ---: | ---: | --- | --- |
| Milk | 2 | 4 | High | Medium |
| Bread | 1 | 3 | Very High | Low |
| Juice | 3 | 5 | Medium | High |

Price limits:

| Product | Min Price | Max Price |
| --- | ---: | ---: |
| Milk | 2 | 8 |
| Bread | 1 | 6 |
| Juice | 3 | 10 |

## 7. Shelf Upgrade System

| Level | Capacity | Upgrade Cost |
| --- | ---: | ---: |
| 1 | 10 | 0 |
| 2 | 20 | 25 |
| 3 | 35 | 60 |

Upgrades increase shelf capacity but do not add free stock. Upgrade cost counts toward business cost, so players must decide whether higher capacity is worth the short-term profit hit.

## 8. Economics in the Game

- **Demand:** product demand weights make some products more popular.
- **Supply:** shelf stock controls whether a store can make a sale.
- **Revenue:** increases when customers buy products.
- **Cost:** increases when the player buys stock or upgrades shelves.
- **Profit:** `revenue - cost`, used as the main leaderboard score.
- **Competition:** local computer stores compete against the player's store.
- **Market Share:** each store's unit sales divided by total unit sales.
- **Price Elasticity:** products respond differently to price increases.

## 9. Static Project File Structure

```text
.
├── docs/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── game.js
│   ├── image2-asset-prompts.md
│   └── supermart-battle-mvp-design.md
├── tests/
│   └── static-build.test.js
├── package.json
├── README.md
└── .gitignore
```

## 10. Static Deployment Steps

1. Commit the repository.
2. Push to GitHub.
3. Open repository **Settings**.
4. Open **Pages**.
5. Choose source branch.
6. Choose `/docs` as the publishing folder.
7. Save.
8. Open the generated GitHub Pages URL.

## 11. MVP Development Order for Static Version

1. Build `docs/index.html` start/game layout.
2. Build `docs/css/styles.css` pixel-style responsive UI.
3. Build `docs/js/game.js` with all state and gameplay in the browser.
4. Add local room creation/join labels.
5. Add map rendering.
6. Add product economy.
7. Add customer AI.
8. Add computer competitors.
9. Add leaderboard and round ending.
10. Add static smoke tests.
11. Deploy from `/docs` to GitHub Pages.
