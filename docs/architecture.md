# Architecture

## Overview

The project is split into four layers:

1. `Market data layer`
   - Provides top-of-book, depth, and recent trades.
   - Current implementation uses a deterministic market simulator.
   - Future integration target: Sui fullnode websocket + DeepBook V3 indexer.

2. `Decision layer`
   - `SignalEngine` computes OBI, volatility, momentum, and spread z-score.
   - `StrategyEngine` computes reservation price and optimal spread using Avellaneda-Stoikov.
   - `RiskEngine` can disable one side, widen spreads, or halt quoting entirely.

3. `Execution + logging layer`
   - `AgentService` runs the main cycle.
   - `PaperExecutor` simulates fills and updates inventory, average entry, and P&L.
   - `WalrusLogger` writes append-only execution and risk logs as JSONL.

4. `Presentation layer`
   - FastAPI exposes dashboard APIs.
   - React polls the API and renders live controls and metrics.

## Main Cycle

Every cycle, for each active pool:

1. read snapshot
2. compute signals
3. evaluate risk
4. compute quotes
5. execute/cancel in paper mode
6. update positions and P&L
7. append execution log

## Risk Handling

- Inventory breaker disables bids when too long and disables asks when too short.
- Drawdown breaker hard-stops the agent and requires manual reset.
- Volatility breaker widens spreads under high volatility and pauses under extreme volatility.
- Manual kill switch immediately stops the loop and cancels all orders.

## Contract Layer

The Move package provides the beginning of:

- `order_manager.move`
- `inventory_vault.move`

They are scaffolds for the hackathon contract surface, not final mainnet-ready DeepBook integrations.
