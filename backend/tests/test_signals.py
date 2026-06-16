from app.models import OrderLevel, PoolSnapshot, Trade
from app.signals import SignalEngine


def test_signal_engine_outputs_expected_fields():
    engine = SignalEngine()
    snapshot = PoolSnapshot(
        pool="SUI/USDC",
        bids=[OrderLevel(price=1.00 - (i * 0.01), size=100 + i) for i in range(10)],
        asks=[OrderLevel(price=1.02 + (i * 0.01), size=90 + i) for i in range(10)],
        trades=[Trade(price=1 + (i * 0.001), size=10, side="buy", timestamp="2026-01-01T00:00:00Z") for i in range(25)],
        mid_price=1.01,
        spread=0.02,
        timestamp="2026-01-01T00:00:00Z",
    )
    signals = engine.compute(snapshot, [0.018, 0.019, 0.02], [1.0, 1.01, 1.015])
    assert -1 <= signals.obi <= 1
    assert signals.realized_volatility >= 0
    assert isinstance(signals.spread_zscore, float)
