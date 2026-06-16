from app.models import AgentConfig, SignalVector
from app.risk import RiskEngine


def test_inventory_breaker_disables_bid_when_too_long():
    engine = RiskEngine()
    config = AgentConfig(max_inventory=100)
    signals = SignalVector(
        obi=0.0,
        realized_volatility=0.001,
        momentum=0.0,
        spread_zscore=0.0,
        mid_price=1.0,
        spread=0.01,
        timestamp="2026-01-01T00:00:00Z",
    )
    result = engine.evaluate(
        inventory=150,
        net_pnl=0,
        starting_capital=100000,
        signals=signals,
        config=config,
        manual_kill=False,
        force_drawdown_stop=False,
    )
    assert result.allow_bids is False
    assert result.allow_asks is True


def test_extreme_volatility_pauses_agent():
    engine = RiskEngine()
    config = AgentConfig(high_vol_threshold=0.01, extreme_vol_threshold=0.02)
    signals = SignalVector(
        obi=0.0,
        realized_volatility=0.03,
        momentum=0.0,
        spread_zscore=0.0,
        mid_price=1.0,
        spread=0.01,
        timestamp="2026-01-01T00:00:00Z",
    )
    result = engine.evaluate(
        inventory=0,
        net_pnl=0,
        starting_capital=100000,
        signals=signals,
        config=config,
        manual_kill=False,
        force_drawdown_stop=False,
    )
    assert result.pause is True
