from __future__ import annotations

import math
import os
import random
import aiohttp
from dataclasses import dataclass
from typing import Any

from .models import FillEvent, OrderLevel, PoolSnapshot, PoolState, QuoteDecision, Trade, utc_now


@dataclass
class PoolSeed:
    mid: float
    spread: float
    drift: float


class MarketDataSimulator:
    def __init__(self, pools: list[str]) -> None:
        defaults: dict[str, PoolSeed] = {
            "SUI/USDC": PoolSeed(mid=1.02, spread=0.02, drift=0.0005),
            "DEEP/USDC": PoolSeed(mid=0.12, spread=0.004, drift=0.0008),
        }
        self.state: dict[str, dict[str, float]] = {}
        for pool in pools:
            seed = defaults.get(pool, PoolSeed(mid=10.0, spread=0.03, drift=0.0003))
            self.state[pool] = {"mid": seed.mid, "spread": seed.spread, "drift": seed.drift}

    def snapshot(self, pool: str) -> PoolSnapshot:
        entry = self.state[pool]
        shock = random.gauss(entry["drift"], entry["spread"] * 0.08)
        entry["mid"] = max(0.001, entry["mid"] * (1 + shock))
        entry["spread"] = max(0.0005, entry["spread"] * (1 + random.uniform(-0.1, 0.1)))

        mid = entry["mid"]
        spread = entry["spread"]
        best_bid = mid - (spread / 2)
        best_ask = mid + (spread / 2)
        bids = []
        asks = []
        for level in range(10):
            depth_scale = level + 1
            price_step = spread * 0.4 * depth_scale
            bids.append(OrderLevel(price=round(best_bid - price_step, 6), size=round(100 + random.random() * 250, 4)))
            asks.append(OrderLevel(price=round(best_ask + price_step, 6), size=round(100 + random.random() * 250, 4)))

        trades: list[Trade] = []
        for i in range(50):
            wave = math.sin((i + 1) / 6) * spread * 0.4
            noise = random.uniform(-spread * 0.6, spread * 0.6)
            price = max(0.0001, mid + wave + noise)
            trades.append(
                Trade(
                    price=round(price, 6),
                    size=round(10 + random.random() * 90, 4),
                    side="buy" if price >= mid else "sell",
                    timestamp=utc_now(),
                )
            )

        return PoolSnapshot(
            pool=pool,
            bids=bids,
            asks=asks,
            trades=trades,
            mid_price=round(mid, 6),
            spread=round(spread, 6),
            timestamp=utc_now(),
        )


class LiveMarketDataProvider:
    def __init__(self, pools: list[str]) -> None:
        self.pools = pools
        self.fullnode_url = os.getenv("SUI_FULLNODE_URL", "")
        self.deepbook_package_id = os.getenv("DEEPBOOK_V3_PACKAGE_ID", "")
        self.sui_usdc_pool_id = os.getenv("SUI_USDC_POOL_ID", "")
        self.session: aiohttp.ClientSession | None = None

    async def _ensure_session(self):
        if not self.session:
            self.session = aiohttp.ClientSession()

    async def snapshot(self, pool: str) -> PoolSnapshot:
        await self._ensure_session()
        
        # For now, let's simulate live data until we have exact DeepBook V3 API
        # In production, replace this with actual DeepBook V3 API calls
        seed = PoolSeed(mid=1.02, spread=0.01, drift=0.0001)
        shock = random.gauss(seed.drift, seed.spread * 0.05)
        mid = max(0.001, seed.mid * (1 + shock))
        spread = max(0.0005, seed.spread * (1 + random.uniform(-0.05, 0.05)))
        
        best_bid = mid - (spread / 2)
        best_ask = mid + (spread / 2)
        bids = []
        asks = []
        for level in range(10):
            depth_scale = level + 1
            price_step = spread * 0.4 * depth_scale
            bids.append(OrderLevel(price=round(best_bid - price_step, 6), size=round(100 + random.random() * 250, 4)))
            asks.append(OrderLevel(price=round(best_ask + price_step, 6), size=round(100 + random.random() * 250, 4)))

        trades: list[Trade] = []
        for i in range(50):
            wave = math.sin((i + 1) / 6) * spread * 0.4
            noise = random.uniform(-spread * 0.6, spread * 0.6)
            price = max(0.0001, mid + wave + noise)
            trades.append(
                Trade(
                    price=round(price, 6),
                    size=round(10 + random.random() * 90, 4),
                    side="buy" if price >= mid else "sell",
                    timestamp=utc_now(),
                )
            )

        return PoolSnapshot(
            pool=pool,
            bids=bids,
            asks=asks,
            trades=trades,
            mid_price=round(mid, 6),
            spread=round(spread, 6),
            timestamp=utc_now(),
        )


class PaperExecutor:
    def refresh_quotes(self, state: PoolState, snapshot: PoolSnapshot, decision: QuoteDecision) -> dict[str, Any]:
        fills: list[FillEvent] = []

        if decision.bid_size > 0:
            distance = max(snapshot.mid_price - decision.bid_price, 1e-6)
            closeness = max(0.0, 1 - (distance / max(snapshot.spread * 4, 1e-6)))
            if random.random() < (0.15 + (closeness * 0.55)):
                fill_size = round(decision.bid_size * random.uniform(0.35, 1.0), 4)
                pnl_delta = state.apply_fill("buy", decision.bid_price, fill_size)
                fills.append(
                    FillEvent(
                        pool=state.pool,
                        side="buy",
                        price=decision.bid_price,
                        size=fill_size,
                        realized_pnl_delta=round(pnl_delta, 4),
                        timestamp=utc_now(),
                    )
                )

        if decision.ask_size > 0:
            distance = max(decision.ask_price - snapshot.mid_price, 1e-6)
            closeness = max(0.0, 1 - (distance / max(snapshot.spread * 4, 1e-6)))
            if random.random() < (0.15 + (closeness * 0.55)):
                fill_size = round(decision.ask_size * random.uniform(0.35, 1.0), 4)
                pnl_delta = state.apply_fill("sell", decision.ask_price, fill_size)
                fills.append(
                    FillEvent(
                        pool=state.pool,
                        side="sell",
                        price=decision.ask_price,
                        size=fill_size,
                        realized_pnl_delta=round(pnl_delta, 4),
                        timestamp=utc_now(),
                    )
                )

        for item in fills:
            state.fills.appendleft(item)
        state.mark_to_market(snapshot.mid_price)

        return {
            "fills": [item.__dict__ for item in fills],
            "filled_count": len(fills),
            "net_pnl": round(state.net_pnl, 4),
        }


class LiveExecutor:
    def __init__(self) -> None:
        self.fullnode_url = os.getenv("SUI_FULLNODE_URL", "")
        self.deepbook_package_id = os.getenv("DEEPBOOK_V3_PACKAGE_ID", "")

    async def refresh_quotes(self, state: PoolState, snapshot: PoolSnapshot, decision: QuoteDecision) -> dict[str, Any]:
        # In production, implement actual DeepBook V3 trade execution here!
        # For now, use paper trading as a placeholder
        fills: list[FillEvent] = []
        return {
            "fills": [],
            "filled_count": 0,
            "net_pnl": round(state.net_pnl, 4),
        }
