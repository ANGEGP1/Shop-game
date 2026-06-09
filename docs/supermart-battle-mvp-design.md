# SuperMart Battle — MVP Game Design Document

## 1. Final Game Design Document

### Game concept
**SuperMart Battle** is a browser-based, 2D pixel-art supermarket management game for up to 8 players in one shared room. Each player controls a fixed supermarket stall on the same top-down map and competes by buying stock, placing items on shelves, setting prices, upgrading shelf capacity, and unlocking new products. Customer NPCs walk around the map and choose where to buy based on demand, price, stock, and competition.

### MVP scope
The first MVP focuses on a clear playable loop rather than a large feature list:

- Create a room code.
- Join a room code.
- Support up to 8 players in the same room.
- Show one shared 2D top-down pixel map.
- Give each player one fixed store area.
- Include 3 products: Milk, Bread, and Juice.
- Let players set product prices.
- Let players buy inventory from suppliers.
- Let players restock shelves from inventory.
- Spawn customer NPCs that automatically buy products.
- Track money, revenue, cost, and profit in real time.
- Show a leaderboard based on profit.

### Non-goals for MVP
The MVP should not include the following yet:

- 3D graphics.
- Weather systems.
- A text-only menu game.
- Database persistence.
- Complex employee systems.
- Complex delivery logistics.
- Large maps or random maps.
- Advanced customer personalities beyond simple demand and price behavior.

### Target technology
- Frontend: HTML, CSS, JavaScript.
- Optional game engine: Phaser.js for the 2D map, sprites, camera, and NPC movement.
- Multiplayer backend: Node.js with Socket.io.
- Data storage: server memory only for MVP.
- Deployment: Render or Replit, because GitHub Pages cannot host a multiplayer Node.js backend.

## 2. Game Page Layout

### Screen layout
The MVP page should have one main game screen with four functional areas:

1. **Top status bar**
   - Game title: SuperMart Battle.
   - Room code.
   - Player name/color.
   - Timer or round status.

2. **Left or right management panel**
   - Money.
   - Revenue.
   - Cost.
   - Profit.
   - Market share.
   - Product controls for Milk, Bread, and Juice.
   - Price input for each product.
   - Buy stock button.
   - Restock shelf button.
   - Shelf upgrade button.

3. **Center map area**
   - 2D top-down pixel map.
   - Up to 8 fixed player store zones.
   - Customer NPC sprites walking between aisles and stores.
   - Shelf sprites inside each player store area.
   - Simple visual indicators for low stock or successful purchases.

4. **Leaderboard panel**
   - Rank.
   - Player name.
   - Profit.
   - Revenue.
   - Market share.

### Suggested MVP wireframe
```text
+------------------------------------------------------------+
| SuperMart Battle | Room: A7K2 | Player: Blue | Time: 05:00 |
+-------------------+--------------------------------+-------+
| Stats / Controls  |                                | Rank  |
| Money             |                                | 1. P1 |
| Revenue           |        Pixel Map Area          | 2. P2 |
| Cost              |                                | 3. P3 |
| Profit            |  Stores + Shelves + Customers  | ...   |
| Product Pricing   |                                |       |
| Stock / Restock   |                                |       |
| Upgrades          |                                |       |
+-------------------+--------------------------------+-------+
```

## 3. Player Flow

### Room creation flow
1. Player opens the website.
2. Player enters a display name.
3. Player clicks **Create Room**.
4. Server generates a short room code, such as `A7K2`.
5. Player enters the shared map as Player 1.
6. Player shares the room code with classmates.

### Room join flow
1. Player opens the website.
2. Player enters a display name.
3. Player enters an existing room code.
4. Player clicks **Join Room**.
5. Server checks whether the room exists and has fewer than 8 players.
6. Player is assigned the next available store area and color.
7. Player joins the shared map.

### Core gameplay loop
1. Buy inventory from supplier.
2. Restock products onto shelves.
3. Set prices for each product.
4. Customers enter the map and choose stores.
5. Customers buy products if the selected store has stock and acceptable prices.
6. Player earns revenue.
7. Player compares revenue, cost, and profit.
8. Player upgrades shelves to hold more stock.
9. Player adjusts prices to compete for more customers.
10. Leaderboard updates until the round ends.

### End-of-game flow
1. Round timer reaches zero or host ends the game.
2. Server calculates final profit and market share.
3. Final leaderboard appears.
4. Players can restart the same room or create a new room.

## 4. Room System Design

### Room rules
- Each room has one room code.
- Each room supports a maximum of 8 players.
- Each player gets one fixed store area.
- All players in a room share the same customer NPC simulation.
- Room state is stored in server memory for MVP.
- If the server restarts, rooms disappear.

### Server-side room state
```js
rooms = {
  A7K2: {
    code: 'A7K2',
    createdAt: Date.now(),
    status: 'waiting' | 'playing' | 'ended',
    players: {},
    customers: [],
    leaderboard: [],
    gameTimeRemaining: 300
  }
}
```

### Player state
```js
player = {
  id: socket.id,
  name: 'Player 1',
  color: 'blue',
  storeIndex: 0,
  money: 100,
  revenue: 0,
  cost: 0,
  profit: 0,
  inventory: {
    Milk: 0,
    Bread: 0,
    Juice: 0
  },
  shelves: {
    Milk: { stock: 0, capacity: 10, level: 1 },
    Bread: { stock: 0, capacity: 10, level: 1 },
    Juice: { stock: 0, capacity: 10, level: 1 }
  },
  prices: {
    Milk: 4,
    Bread: 3,
    Juice: 5
  },
  unitsSold: 0
}
```

### Main Socket.io events
- `createRoom`: client asks server to create a room.
- `joinRoom`: client asks to join a room by code.
- `roomJoined`: server confirms room and sends initial state.
- `roomError`: server sends error for invalid code, full room, or duplicate issue.
- `setPrice`: player updates a product price.
- `buyStock`: player buys inventory from supplier.
- `restockShelf`: player moves inventory to shelf stock.
- `upgradeShelf`: player upgrades shelf capacity.
- `gameState`: server broadcasts the current room state.
- `leaderboardUpdate`: server broadcasts ranking changes.
- `gameEnded`: server broadcasts final scores.

## 5. Customer AI Design

### Customer behavior goal
Customer NPCs should make the market feel alive without becoming too complicated. They should walk on the map and make purchasing decisions using simple economic rules.

### Customer lifecycle
1. Spawn at map entrance.
2. Choose a desired product: Milk, Bread, or Juice.
3. Compare all player stores.
4. Pick a target store based on price, stock availability, and demand.
5. Walk to that store area.
6. Attempt to buy one unit.
7. Leave the map after buying or failing to find a good option.

### Store selection factors
Customers evaluate stores with a simple score:

```text
storeScore = demandValue - pricePenalty + stockBonus + randomVariation
```

Where:
- `demandValue` is higher when the customer wants that product strongly.
- `pricePenalty` is higher when a product price is above the base price.
- `stockBonus` is positive if the product is available on the shelf.
- `randomVariation` prevents every customer from always choosing the same store.

### Customer purchase rules
A customer can buy if:
- The store has at least 1 shelf unit of the desired product.
- The price is not too high for that customer's willingness to pay.
- The game is still active.

### MVP movement
For MVP, customers can move between simple waypoints rather than using complex pathfinding:

- Entrance waypoint.
- Store zone waypoint.
- Shelf waypoint.
- Exit waypoint.

## 6. Product and Pricing System Design

### MVP products
| Product | Supplier Cost | Default Price | Base Demand | Elasticity |
| --- | ---: | ---: | ---: | ---: |
| Milk | 2 | 4 | High | Medium |
| Bread | 1 | 3 | Very High | Low |
| Juice | 3 | 5 | Medium | High |

### Product concepts
- **Supplier cost**: amount the player pays to buy one unit from supplier.
- **Price**: amount customers pay to buy one unit from a player.
- **Revenue**: money earned from customer purchases.
- **Cost**: money spent buying inventory and upgrades.
- **Profit**: revenue minus cost.
- **Demand**: how many customers want a product.
- **Supply**: how much stock is available on player shelves.

### Pricing rule
Players can set product prices, but the MVP should use safe limits to avoid broken gameplay:

| Product | Minimum Price | Maximum Price |
| --- | ---: | ---: |
| Milk | 2 | 8 |
| Bread | 1 | 6 |
| Juice | 3 | 10 |

### Purchase result
When a customer buys one product:

```text
player.revenue += productPrice
player.money += productPrice
player.shelves[product].stock -= 1
player.unitsSold += 1
player.profit = player.revenue - player.cost
```

### Buying stock result
When a player buys inventory:

```text
totalCost = supplierCost * quantity
player.money -= totalCost
player.cost += totalCost
player.inventory[product] += quantity
player.profit = player.revenue - player.cost
```

## 7. Shelf Upgrade System Design

### Upgrade goal
Shelf upgrades should create a simple strategic choice: spend money now to increase capacity and reduce stockouts later.

### MVP shelf levels
| Level | Capacity | Upgrade Cost |
| --- | ---: | ---: |
| 1 | 10 | 0 |
| 2 | 20 | 25 |
| 3 | 35 | 60 |

### Upgrade rules
- Each product has its own shelf capacity and level.
- Players can upgrade Milk, Bread, and Juice shelves separately.
- Upgrading increases shelf capacity but does not automatically add stock.
- Upgrade cost counts as business cost.
- Higher capacity helps players serve more customers before restocking.

### Upgrade result
```text
player.money -= upgradeCost
player.cost += upgradeCost
player.shelves[product].level += 1
player.shelves[product].capacity = newCapacity
player.profit = player.revenue - player.cost
```

## 8. Economics in the Game

### Demand
Demand appears through customer product preferences. For example, Bread can have more frequent customers than Juice, making Bread a high-demand product.

### Supply
Supply appears through player inventory and shelf stock. A player may set a great price but lose sales if shelves are empty.

### Revenue
Revenue increases every time a customer buys a product from a player.

### Cost
Cost increases when a player buys stock or upgrades shelves.

### Profit
Profit is the main victory metric:

```text
profit = revenue - cost
```

### Competition
Players compete in the same room for the same customer NPCs. If one player sets lower prices or keeps better stock, they can attract more customers.

### Market share
Market share shows how much of the total sales a player controls:

```text
marketShare = playerUnitsSold / totalUnitsSoldInRoom
```

### Price elasticity
Price elasticity appears when customers react differently to price changes:

- Bread has low elasticity, so customers still buy it even if the price rises slightly.
- Juice has high elasticity, so customers are more likely to avoid expensive Juice.
- Milk sits in the middle.

### Classroom learning connection
The game naturally teaches that the highest price is not always the best strategy. Players must balance price, demand, stock, cost, and competition to maximize profit.

## 9. Project File Structure

Recommended MVP structure:

```text
supermart-battle/
├── package.json
├── server.js
├── README.md
├── docs/
│   └── supermart-battle-mvp-design.md
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── client.js
│   │   ├── game.js
│   │   ├── ui.js
│   │   ├── economy.js
│   │   └── constants.js
│   └── assets/
│       ├── sprites/
│       │   ├── players/
│       │   ├── customers/
│       │   ├── shelves/
│       │   └── products/
│       └── tilesets/
└── src/
    ├── roomManager.js
    ├── gameLoop.js
    ├── customerAI.js
    ├── economy.js
    └── constants.js
```

### File responsibilities
- `server.js`: starts the Express and Socket.io server.
- `src/roomManager.js`: creates rooms, joins players, removes players, and stores room data.
- `src/gameLoop.js`: runs customer spawning, purchasing, timers, and leaderboard updates.
- `src/customerAI.js`: contains customer decision logic.
- `src/economy.js`: contains product prices, costs, profit calculations, and market share calculations.
- `src/constants.js`: stores shared game constants.
- `public/index.html`: main browser page.
- `public/css/styles.css`: pixel-style layout and UI.
- `public/js/client.js`: connects to Socket.io and handles server messages.
- `public/js/game.js`: renders the map, player zones, shelves, and customers.
- `public/js/ui.js`: updates buttons, panels, stats, and leaderboard.
- `public/js/economy.js`: client-side display helpers for economy values.
- `public/assets/`: sprite sheets, tilesets, product icons, and other art assets.

## 10. MVP Development Order

### Phase 1: Project setup
1. Create Node.js project.
2. Add Express and Socket.io.
3. Serve static files from `public/`.
4. Create basic `index.html`, `styles.css`, and `client.js`.

### Phase 2: Room system
1. Implement room code generation.
2. Implement create room.
3. Implement join room.
4. Enforce 8-player limit.
5. Assign player colors and store zones.
6. Broadcast room state.

### Phase 3: Map MVP
1. Create one shared top-down map.
2. Draw 8 fixed store areas.
3. Add simple player labels and colors.
4. Add shelf placeholders for Milk, Bread, and Juice.

### Phase 4: Product economy
1. Add product constants for Milk, Bread, and Juice.
2. Add player inventory.
3. Add buying stock.
4. Add restocking shelves.
5. Add price setting.
6. Track money, revenue, cost, and profit.

### Phase 5: Customer AI
1. Spawn customers at a fixed entrance.
2. Give each customer a desired product.
3. Score stores by price and stock.
4. Move customers to chosen store waypoints.
5. Complete purchases and update economy stats.

### Phase 6: Leaderboard and round ending
1. Calculate profit ranking.
2. Show live leaderboard.
3. Add round timer.
4. Show final leaderboard when the round ends.

### Phase 7: Shelf upgrades
1. Add shelf level data.
2. Add capacity limits.
3. Add upgrade button.
4. Apply upgrade costs to profit calculations.

### Phase 8: Polish and deployment
1. Add pixel fonts, colors, and UI styling.
2. Add placeholder pixel sprites.
3. Add instructions on the start screen.
4. Add Render and Replit deployment notes.
5. Test with multiple browser tabs.

## Open Questions to Confirm

Before coding the MVP, these choices should be confirmed:

1. Should the game round last 3 minutes, 5 minutes, or another duration?
2. Should players move an avatar around the map, or should MVP controls be panel-based while the map shows stores and customers?
3. Should room creators be the only players allowed to start or restart a round?
4. Should image generation create original pixel sprites for customers, shelves, products, and tilesets, or should MVP start with colored placeholder blocks first?
5. Should the UI language be English only, Chinese only, or bilingual?
