from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class OrderLevel:
    price: float
    size: float


@dataclass
class Trade:
    price: float
    size: float
    side: str
    timestamp: str


@dataclass
class PoolSnapshot:
    pool: str
    bids: list[OrderLevel]
    asks: list[OrderLevel]
    trades: list[Trade]
    mid_price: float
    spread: float
    timestamp: str


@dataclass
class SignalVector:
    obi: float
    realized_volatility: float
    momentum: float
    spread_zscore: float
    mid_price: float
    spread: float
    timestamp: str


@dataclass
class QuoteDecision:
    bid_price: float
    ask_price: float
    bid_size: float
    ask_size: float
    reservation_price: float
    optimal_spread: float
    spread_multiplier: float
    notes: list[str] = field(default_factory=list)


@dataclass
class FillEvent:
    pool: str
    side: str
    price: float
    size: float
    realized_pnl_delta: float
    timestamp: str


@dataclass
class AgentConfig:
    cycle_interval_ms: int = 2000
    gamma: float = 0.15
    k: float = 1.5
    max_inventory: float = 1000.0
    base_order_size: float = 100.0
    max_session_drawdown_pct: float = 0.05
    max_daily_drawdown_pct: float = 0.03
    high_vol_threshold: float = 0.012
    extreme_vol_threshold: float = 0.03
    tick_size: float = 0.01
    lot_size: float = 1.0
    starting_capital_per_pool: float = 100000.0
    pools: list[str] = field(default_factory=lambda: ["SUI/USDC", "DEEP/USDC"])

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class RiskDecision:
    allow_bids: bool = True
    allow_asks: bool = True
    pause: bool = False
    hard_stop: bool = False
    spread_multiplier: float = 1.0
    reason: str = "ok"
    events: list[str] = field(default_factory=list)


@dataclass
class PoolState:
    pool: str
    cash: float
    inventory: float = 0.0
    avg_entry_price: float = 0.0
    realized_pnl: float = 0.0
    unrealized_pnl: float = 0.0
    net_pnl: float = 0.0
    latest_snapshot: PoolSnapshot | None = None
    latest_signals: SignalVector | None = None
    latest_quote: QuoteDecision | None = None
    fills: deque[FillEvent] = field(default_factory=lambda: deque(maxlen=20))
    pnl_history: deque[dict[str, Any]] = field(default_factory=lambda: deque(maxlen=120))
    inventory_history: deque[dict[str, Any]] = field(default_factory=lambda: deque(maxlen=120))
    spread_history: deque[float] = field(default_factory=lambda: deque(maxlen=50))
    mid_history: deque[float] = field(default_factory=lambda: deque(maxlen=50))

    def mark_to_market(self, mid_price: float) -> None:
        if self.inventory == 0:
            self.unrealized_pnl = 0.0
        else:
            self.unrealized_pnl = self.inventory * (mid_price - self.avg_entry_price)
        self.net_pnl = self.realized_pnl + self.unrealized_pnl
        stamp = utc_now()
        self.pnl_history.append({"timestamp": stamp, "value": round(self.net_pnl, 4)})
        self.inventory_history.append({"timestamp": stamp, "value": round(self.inventory, 4)})

    def apply_fill(self, side: str, price: float, size: float) -> float:
        realized_delta = 0.0
        if side == "buy":
            self.cash -= price * size
            if self.inventory >= 0:
                new_inventory = self.inventory + size
                if new_inventory > 0:
                    weighted_cost = (self.avg_entry_price * self.inventory) + (price * size)
                    self.avg_entry_price = weighted_cost / new_inventory
                self.inventory = new_inventory
            else:
                closing = min(size, abs(self.inventory))
                realized_delta += (self.avg_entry_price - price) * closing
                self.inventory += size
                if self.inventory > 0:
                    self.avg_entry_price = price
                elif self.inventory == 0:
                    self.avg_entry_price = 0.0
        else:
            self.cash += price * size
            if self.inventory <= 0:
                new_inventory = self.inventory - size
                short_size = abs(self.inventory)
                new_short = abs(new_inventory)
                if new_short > 0:
                    weighted_cost = (self.avg_entry_price * short_size) + (price * size)
                    self.avg_entry_price = weighted_cost / new_short
                self.inventory = new_inventory
            else:
                closing = min(size, self.inventory)
                realized_delta += (price - self.avg_entry_price) * closing
                self.inventory -= size
                if self.inventory < 0:
                    self.avg_entry_price = price
                elif self.inventory == 0:
                    self.avg_entry_price = 0.0
        self.realized_pnl += realized_delta
        return realized_delta

    def to_dashboard(self) -> dict[str, Any]:
        return {
            "pool": self.pool,
            "inventory": round(self.inventory, 4),
            "avg_entry_price": round(self.avg_entry_price, 6),
            "realized_pnl": round(self.realized_pnl, 4),
            "unrealized_pnl": round(self.unrealized_pnl, 4),
            "net_pnl": round(self.net_pnl, 4),
            "latest_snapshot": asdict(self.latest_snapshot) if self.latest_snapshot else None,
            "latest_signals": asdict(self.latest_signals) if self.latest_signals else None,
            "latest_quote": asdict(self.latest_quote) if self.latest_quote else None,
            "fills": [asdict(item) for item in list(self.fills)],
            "pnl_history": list(self.pnl_history),
            "inventory_history": list(self.inventory_history),
        }
