from __future__ import annotations

from .models import AgentConfig, RiskDecision, SignalVector


class RiskEngine:
    def evaluate(
        self,
        *,
        inventory: float,
        net_pnl: float,
        starting_capital: float,
        signals: SignalVector,
        config: AgentConfig,
        manual_kill: bool,
        force_drawdown_stop: bool,
    ) -> RiskDecision:
        decision = RiskDecision()

        if manual_kill:
            decision.pause = True
            decision.hard_stop = True
            decision.reason = "manual_kill_switch"
            decision.events.append("manual_kill_switch")
            return decision

        if force_drawdown_stop:
            decision.pause = True
            decision.hard_stop = True
            decision.reason = "drawdown_breaker"
            decision.events.append("drawdown_breaker")
            return decision

        max_session_loss = starting_capital * config.max_session_drawdown_pct
        if net_pnl <= -max_session_loss:
            decision.pause = True
            decision.hard_stop = True
            decision.reason = "drawdown_breaker"
            decision.events.append("drawdown_breaker")
            return decision

        if signals.realized_volatility >= config.extreme_vol_threshold:
            decision.pause = True
            decision.reason = "extreme_volatility"
            decision.events.append("extreme_volatility")
            return decision

        if signals.realized_volatility >= config.high_vol_threshold:
            decision.spread_multiplier = 2.0
            decision.reason = "high_volatility"
            decision.events.append("high_volatility")

        if inventory >= config.max_inventory:
            decision.allow_bids = False
            decision.reason = "inventory_too_long"
            decision.events.append("inventory_too_long")

        if inventory <= -config.max_inventory:
            decision.allow_asks = False
            decision.reason = "inventory_too_short"
            decision.events.append("inventory_too_short")

        return decision
