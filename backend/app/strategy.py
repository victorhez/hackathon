from __future__ import annotations

import math

from .models import AgentConfig, QuoteDecision, SignalVector


def round_to_tick(value: float, tick_size: float) -> float:
    return round(round(value / tick_size) * tick_size, 8)


def round_to_lot(value: float, lot_size: float) -> float:
    return max(lot_size, round(round(value / lot_size) * lot_size, 8))


class StrategyEngine:
    def quote(
        self,
        signals: SignalVector,
        inventory: float,
        config: AgentConfig,
        spread_multiplier: float = 1.0,
        allow_bids: bool = True,
        allow_asks: bool = True,
    ) -> QuoteDecision:
        sigma = max(signals.realized_volatility, 1e-6)
        horizon = max(config.cycle_interval_ms / 1000, 0.5)
        gamma = max(config.gamma, 1e-6)
        reservation_price = signals.mid_price - (inventory * gamma * sigma * sigma * horizon)
        optimal_spread = (gamma * sigma * sigma * horizon) + ((2 / gamma) * math.log(1 + (gamma / max(config.k, 1e-6))))
        optimal_spread = max(optimal_spread * spread_multiplier, config.tick_size * 2)

        half = optimal_spread / 2
        bid = round_to_tick(reservation_price - half, config.tick_size)
        ask = round_to_tick(reservation_price + half, config.tick_size)

        skew = abs(inventory) / max(config.max_inventory, 1.0)
        size_multiplier = max(0.25, 1 - min(skew, 0.9))
        bid_size = round_to_lot(config.base_order_size * size_multiplier, config.lot_size) if allow_bids else 0.0
        ask_size = round_to_lot(config.base_order_size * size_multiplier, config.lot_size) if allow_asks else 0.0

        notes: list[str] = []
        if not allow_bids:
            notes.append("bids_disabled_by_risk")
        if not allow_asks:
            notes.append("asks_disabled_by_risk")
        if spread_multiplier > 1:
            notes.append("spread_widened")

        return QuoteDecision(
            bid_price=bid,
            ask_price=ask,
            bid_size=bid_size,
            ask_size=ask_size,
            reservation_price=round(reservation_price, 6),
            optimal_spread=round(optimal_spread, 6),
            spread_multiplier=spread_multiplier,
            notes=notes,
        )
