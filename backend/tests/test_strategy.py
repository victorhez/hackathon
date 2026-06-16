from app.models import AgentConfig, SignalVector
from app.strategy import StrategyEngine


def test_strategy_produces_two_sided_quote():
    engine = StrategyEngine()
    config = AgentConfig()
    signals = SignalVector(
        obi=0.1,
        realized_volatility=0.01,
        momentum=0.002,
        spread_zscore=0.3,
        mid_price=1.5,
        spread=0.02,
        timestamp="2026-01-01T00:00:00Z",
    )
    quote = engine.quote(signals, inventory=0, config=config)
    assert quote.bid_price < quote.ask_price
    assert quote.bid_size > 0
    assert quote.ask_size > 0
