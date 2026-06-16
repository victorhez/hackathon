# DeepBook AI Market-Making Agent - Complete User Guide

## 🚀 Getting Started: Start the Servers

### Option 1: Docker (Recommended)
```bash
# Copy the example environment file
cp .env.example .env

# Build and start everything with Docker Compose
docker compose up --build
```
Then open:
- Dashboard UI: http://localhost:5173
- API Docs (Swagger): http://localhost:8000/docs

### Option 2: Local Development

#### Backend Setup:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup:
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

---

## 📋 Project Requirements Breakdown

This is a full-stack AI market-making agent for Sui's DeepBook DEX! Here's what's already implemented and what you need to go live:

### ✅ Already Implemented (Simulation Mode)
1. **AI Strategy Engine**: Uses the Avellaneda-Stoikov market-making algorithm
2. **Signal Generation**:
   - Order Book Imbalance (OBI)
   - Realized Volatility
   - Mid-price Momentum
   - Spread Z-score
3. **Risk Controls**:
   - Inventory breaker (stops quoting when inventory gets too big)
   - Drawdown breaker (halts if losses exceed thresholds)
   - Volatility breaker (widens spreads or pauses in high vol)
   - Manual kill switch (emergency stop)
4. **Dashboard UI**:
   - Real-time P&L chart
   - Order book depth viewer
   - Inventory position monitor
   - Execution logs and risk alerts
5. **Local Logging**: Walrus-style JSON logs stored locally

### 🔧 To Go Live (Replace Simulation Components)
You need to replace these 3 key components to use real Sui/DeepBook data and execute real trades:
1. Market Data Source (currently simulated in `MarketDataSimulator`)
2. Trade Executor (currently `PaperExecutor`)
3. On-Chain Contracts (skeletons provided in `move/` folder)

---

## 🔄 Switching from Simulation to Live Mode

Here is exactly what you need to do, step-by-step:

### Step 1: Replace Market Data (backend/app/simulator.py)
Currently, `MarketDataSimulator` creates fake order books and trades. To use real data from DeepBook:
- Connect to Sui Full Node websocket or use a DeepBook indexer
- Fetch real order book snapshots
- Get recent trade data from the blockchain
- Replace the `snapshot(pool)` method

### Step 2: Replace Trade Execution (backend/app/simulator.py)
The `PaperExecutor` currently simulates trade fills. For real trading:
- Connect to your Sui wallet (use Sui SDK)
- Send Programmatic Transaction Blocks (PTBs) to DeepBook
- Handle order placement/cancellation
- Track real fills from on-chain events
- Update `refresh_quotes()` method

### Step 3: Deploy & Integrate Move Contracts
The `move/` folder has contract skeletons for:
- `inventory_vault.move`: Holds your trading capital securely
- `order_manager.move`: Manages order lifecycle

You need to:
- Deploy these to Sui Testnet/Mainnet
- Integrate with the agent backend to use these contracts for custody and order management

### Step 4: Configure Environment Variables
Update `.env` with your Sui config, DeepBook pool IDs, wallet info, etc.

---

## 🎨 UI Improvements Made!
The dashboard has been completely revamped! Now it's:
- ✨ **More beautiful**: Gradient backgrounds, glassmorphism effects, better spacing
- 📊 **More complete**: Added configuration for K and Base Order Size, improved chart with gradient fill
- 🎯 **Better UX**: Hover effects on buttons and depth rows, clear status indicators, better color coding for buys/sells and P&L
- 📱 **Responsive**: Works great on mobile screens too!

---

## 💡 Configuration Options Explained

Use the dashboard to adjust these live:

| Config Option | What it Does | Typical Value |
|---------------|--------------|---------------|
| **Gamma** | Risk aversion parameter. Higher = more conservative (wider spreads) | 0.1 - 0.5 |
| **K** | Spread multiplier. Higher = wider quoted spreads | 1.0 - 3.0 |
| **Cycle Interval (ms)** | How often the agent runs its strategy loop | 1000 - 5000 |
| **Base Order Size** | Default quantity for quotes | Depends on pool |
| **Max Inventory** | Maximum inventory position before halting quoting | Depends on your risk tolerance |

---

## 🔒 Safety & Risk Management

Always start small in simulation mode first! Once you go live:
- Use small order sizes initially
- Monitor closely with the dashboard
- Know where the kill switch is!
- Set conservative drawdown limits
- Never risk more than you can afford to lose

Good luck with your market-making agent! 🎉
