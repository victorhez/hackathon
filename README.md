# DeepPulse AI Market-Making Agent: Complete Guide

## 📌 What Is This Project? (In Plain English)
This is a **smart robot that trades cryptocurrency for you** on Sui's DeepBook exchange!

Imagine you're at a farmers' market buying and selling apples:
- You say, "I'll buy apples for $1 each, and sell them for $1.05 each"
- You make a tiny profit from the difference ($0.05)
- But you have to sit there all day watching prices

This robot does that for you 24/7! It:
1. Watches market prices nonstop
2. Calculates smart buy/sell prices
3. Manages risk so it doesn't lose too much money
4. Shows you everything on a simple dashboard

---

## 🚀 How to Start It (3 Simple Steps)
### Step 1: Start the Backend (Robot Brain)
1. Open a new terminal
2. Type:
   ```bash
   cd /Users/others/Documents/hackathon/backend
   . .venv/bin/activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
3. You'll see: `INFO: Uvicorn running on http://0.0.0.0:8000`

### Step 2: Start the Frontend (Dashboard)
1. Open another new terminal
2. Type:
   ```bash
   cd /Users/others/Documents/hackathon/frontend
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
3. You'll see: `VITE v5.4.21  ready in ... ms`

### Step 3: Open in Your Browser
- Dashboard: http://localhost:5173
- API Docs: http://localhost:8000/docs

---

## 📊 Dashboard Explained (Every Single Part!)
Let's go through the dashboard from top to bottom:

### 1. Hero Section (Top)
- **Banner**: Beautiful DeepPulse banner
- **Logo & Title**: DeepPulse AI Agent (our robot's name!)
- **Mode Switch**: Toggle between Simulation and Live modes
- **Status Chip**: Shows what the robot is doing:
  - `STOPPED`: Robot is off
  - `RUNNING`: Robot is working
  - `PAUSED`: Robot is taking a break
  - `CIRCUIT_BREAKER_TRIGGERED`: Emergency stop activated

---

### 2. Top Grid (3 Panels)
#### Panel 1: Agent Controls
- **Buttons**:
  - `▶ Start`: Turn the robot on
  - `⏸ Stop`: Turn the robot off
  - `⚠ Kill`: Emergency stop (use if something goes wrong!)
- **Stats**:
  - `Status`: Same as the top status chip
  - `Total Cycles`: How many times the robot has checked the market and made decisions (like how many times it's looked at the farmers' market prices)
  - `Success Rate`: What percentage of those cycles worked without errors
  - `Avg Execution Time`: How long each cycle takes (in milliseconds - 1000ms = 1 second)

#### Panel 2: Portfolio P&L
- **Stats**:
  - `Realized P&L`: Money you've actually made/losses you've actually taken (from completed trades)
  - `Unrealized P&L`: Money you would make/lose if you sold everything right now (from current positions)
  - `Net P&L`: Total money made/lost (realized + unrealized)
- **Chart**: Shows how your net P&L has changed over time (up = good, down = bad)

#### Panel 3: Strategy Configuration
These settings change how the robot behaves!
- `Gamma (Risk Aversion)`: How careful the robot is.
  - Higher = more careful (wider spreads, less risky)
  - Lower = more aggressive (tighter spreads, more risky)
  - Good range: 0.05 - 0.5
- `K (Spread Multiplier)`: How much the robot widens its buy/sell prices.
  - Higher = bigger difference between buy/sell prices
  - Lower = smaller difference
  - Good range: 1.0 - 3.0
- `Cycle Interval (ms)`: How often the robot checks the market (in milliseconds).
  - 2000ms = every 2 seconds
  - 5000ms = every 5 seconds
- `Base Order Size`: How many coins the robot tries to buy/sell each time.
- `Max Inventory`: The maximum number of coins the robot will hold at once (to avoid having too many of one coin).

---

### 3. Pool Sections (SUI/USDC and DEEP/USDC)
These are the cryptocurrency pairs the robot is trading!
- `SUI/USDC`: Trading SUI coins for USDC (a stablecoin)
- `DEEP/USDC`: Trading DEEP coins for USDC

#### Pool Stats
- `Mid Price`: The middle price between the best buy price and best sell price (like the "fair" price)
- `Bid/Ask Spread`: The difference between the best buy price and best sell price (the robot makes money from this!)
- `OBI (Order Book Imbalance)`: How many more buy orders there are than sell orders (or vice versa).
  - Positive = more buys
  - Negative = more sells
- `Realized Volatility`: How wild the price swings are (higher = riskier)
- `Bid Quote`: The price the robot is offering to buy coins at
- `Ask Quote`: The price the robot is offering to sell coins at
- `Long/Short/Flat`: Whether the robot holds coins (Long), owes coins (Short), or has no coins (Flat)

#### Inventory Position
- This shows how many coins the robot currently holds
- The marker moves from left (short/owes coins) to right (long/holds coins)
- The center (0) means it has no coins

#### Live Order Book
- **📥 Bids**: Prices people are offering to buy coins at (green)
- **📤 Asks**: Prices people are offering to sell coins at (red)
- The bar width shows how big the order is (wider = more coins)

#### Recent Trades
- Shows the robot's completed trades
- `BUY`: Robot bought coins
- `SELL`: Robot sold coins
- The last number shows the profit/loss from that trade

---

### 4. Bottom Grid (2 Panels)
#### Panel 1: Execution Logs
- A log of everything the robot has done (like a diary)

#### Panel 2: Risk & Alerts
- Shows when the robot had to pause or stop due to risk (like if it hit max inventory)

---

## 🟢 Going Live: Using Real Data & Real Money
Right now, the robot is in **simulation mode** (using fake data). To use real data on Sui's mainnet/testnet:

### Step 1: What You Need to Get
Here's everything you need to collect first:
1. **Sui Wallet Private Key**: You need a Sui wallet (like Sui Wallet, Suiet, or Martian) and its private key to sign transactions.
2. **Sui Fullnode URL**: To connect to the Sui blockchain (get one from [Sui Node Providers](https://docs.sui.io/devnet/build/get-fullnode-urls) or use the public one)
3. **DeepBook Package ID**: The official package ID for DeepBook V3 on mainnet/testnet
4. **DeepBook Pool IDs**: The specific pool IDs for the trading pairs you want to use (like SUI/USDC pool ID)

### Step 2: Where to Get These
- **Sui Wallet**: Download [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidngkllopbcdmlkjfjeplok) from Chrome Web Store, create a wallet, and get your private key (usually in settings → security)
- **Sui Fullnode**: Use public mainnet/testnet URLs from [Sui Docs](https://docs.sui.io/devnet/build/get-fullnode-urls)
- **DeepBook Info**: Find DeepBook package and pool IDs on [Sui Explorer](https://suiscan.xyz/mainnet/home) or the [DeepBook Documentation](https://docs.deepbook.ai/)

### Step 3: Development Work Required
This is a **simulation-first** project, so you'll need to code some changes to go live:
1. **Update `backend/app/simulator.py`**:
   - Replace the fake market simulator with code that pulls real order book data from your Sui fullnode
   - Replace the paper execution with real Programmatic Transaction Blocks (PTBs) on Sui to execute trades
2. **Update `backend/app/agent.py`**:
   - Add code to use your Sui wallet private key
   - Use real DeepBook pool IDs
3. **Update `.env` file**:
   - Add your credentials (make sure to never commit this file to GitHub!)

---

## 📁 Repo Layout
- `backend/`: Robot's brain (Python + FastAPI)
- `frontend/`: Dashboard (React + Vite)
- `move/`: Smart contract scaffolds (for on-chain stuff)
- `docs/`: More technical architecture notes

---

## 🧪 Tests
To run the backend tests:
```bash
cd /Users/others/Documents/hackathon/backend
. .venv/bin/activate
pytest
```

---

## 🎯 Tips for Screen Recording
1. Start with both servers running
2. Explain what the project is (use the top of this README!)
3. Click "Start" and show the robot working
4. Explain each dashboard section using the notes above
5. Click "Stop" when you're done

Good luck with your recording! 🎉
