from __future__ import annotations

import math
import statistics

from .models import PoolSnapshot, SignalVector, utc_now


def _safe_stdev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    return statistics.pstdev(values)


class SignalEngine:
    def compute(self, snapshot: PoolSnapshot, recent_spreads: list[float], recent_mids: list[float]) -> SignalVector:
        bid_volume = sum(level.size for level in snapshot.bids[:5])
        ask_volume = sum(level.size for level in snapshot.asks[:5])
        total = bid_volume + ask_volume or 1.0
        obi = (bid_volume - ask_volume) / total

        prices = [trade.price for trade in snapshot.trades[-20:]]
        if len(prices) >= 2:
            log_returns = []
            for prev, curr in zip(prices, prices[1:]):
                if prev > 0 and curr > 0:
                    log_returns.append(math.log(curr / prev))
            realized_volatility = _safe_stdev(log_returns)
        else:
            realized_volatility = 0.0

        mids = recent_mids[-8:] + [snapshot.mid_price]
        momentum = 0.0
        if len(mids) >= 3:
            alpha = 0.35
            ema = mids[0]
            previous = mids[0]
            for value in mids[1:]:
                delta = value - previous
                ema = alpha * delta + (1 - alpha) * ema
                previous = value
            momentum = ema / snapshot.mid_price if snapshot.mid_price else 0.0

        spreads = recent_spreads[-20:] + [snapshot.spread]
        mean_spread = statistics.fmean(spreads) if spreads else snapshot.spread
        spread_std = _safe_stdev(spreads) or 1e-9
        spread_zscore = (snapshot.spread - mean_spread) / spread_std

        return SignalVector(
            obi=round(obi, 6),
            realized_volatility=round(realized_volatility, 6),
            momentum=round(momentum, 6),
            spread_zscore=round(spread_zscore, 6),
            mid_price=round(snapshot.mid_price, 6),
            spread=round(snapshot.spread, 6),
            timestamp=utc_now(),
        )
