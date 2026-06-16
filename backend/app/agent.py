from __future__ import annotations

import asyncio
import os
import time
from dataclasses import asdict
from typing import Any

from .logger import WalrusLogger
from .models import AgentConfig, PoolState, utc_now
from .risk import RiskEngine
from .signals import SignalEngine
from .simulator import MarketDataSimulator, PaperExecutor, LiveMarketDataProvider, LiveExecutor
from .strategy import StrategyEngine


def load_config_from_env() -> AgentConfig:
    pools = os.getenv("AGENT_POOLS", "SUI/USDC,DEEP/USDC").split(",")
    return AgentConfig(
        cycle_interval_ms=int(os.getenv("AGENT_CYCLE_INTERVAL_MS", "2000")),
        gamma=float(os.getenv("AGENT_GAMMA", "0.15")),
        k=float(os.getenv("AGENT_K", "1.5")),
        max_inventory=float(os.getenv("AGENT_MAX_INVENTORY", "1000")),
        base_order_size=float(os.getenv("AGENT_BASE_ORDER_SIZE", "100")),
        max_session_drawdown_pct=float(os.getenv("AGENT_MAX_SESSION_DRAWDOWN_PCT", "0.05")),
        max_daily_drawdown_pct=float(os.getenv("AGENT_MAX_DAILY_DRAWDOWN_PCT", "0.03")),
        high_vol_threshold=float(os.getenv("AGENT_HIGH_VOL_THRESHOLD", "0.012")),
        extreme_vol_threshold=float(os.getenv("AGENT_EXTREME_VOL_THRESHOLD", "0.03")),
        tick_size=float(os.getenv("AGENT_TICK_SIZE", "0.01")),
        lot_size=float(os.getenv("AGENT_LOT_SIZE", "1")),
        starting_capital_per_pool=float(os.getenv("AGENT_STARTING_CAPITAL_PER_POOL", "100000")),
        pools=[pool.strip() for pool in pools if pool.strip()],
    )


class AgentService:
    def __init__(self, config: AgentConfig | None = None) -> None:
        self.config = config or load_config_from_env()
        self.signal_engine = SignalEngine()
        self.strategy_engine = StrategyEngine()
        self.risk_engine = RiskEngine()
        self.logger = WalrusLogger(base_path=os.getenv("AGENT_DATA_PATH", "data"))
        self.current_mode = os.getenv("APP_MODE", "simulation")
        
        # Initialize components for both modes
        self.sim_market = MarketDataSimulator(self.config.pools)
        self.sim_executor = PaperExecutor()
        self.live_market = LiveMarketDataProvider(self.config.pools)
        self.live_executor = LiveExecutor()
        
        self.pool_states: dict[str, PoolState] = {
            pool: PoolState(pool=pool, cash=self.config.starting_capital_per_pool)
            for pool in self.config.pools
        }
        self.status = "STOPPED"
        self.cycle_count = 0
        self.success_count = 0
        self.avg_execution_ms = 0.0
        self.last_successful_cycle_at: str | None = None
        self.last_error: str | None = None
        self._manual_kill = False
        self._force_drawdown_stop = False
        self._task: asyncio.Task | None = None

    def set_mode(self, mode: str) -> None:
        self.current_mode = mode
        
    async def start(self) -> dict[str, Any]:
        if self._task and not self._task.done():
            return {"status": self.status, "message": "agent already running"}
        self._manual_kill = False
        if self._force_drawdown_stop:
            return {"status": self.status, "message": "drawdown breaker active; reset service to continue"}
        self.status = "RUNNING"
        self._task = asyncio.create_task(self._run_loop())
        return {"status": self.status, "message": "agent started"}

    async def stop(self) -> dict[str, Any]:
        self.status = "STOPPED"
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None
        self._write_summary()
        return {"status": self.status, "message": "agent stopped"}

    async def kill(self) -> dict[str, Any]:
        self._manual_kill = True
        self.status = "CIRCUIT_BREAKER_TRIGGERED"
        self.logger.log_risk({"event": "manual_kill_switch", "timestamp": utc_now()})
        return await self.stop()

    def update_config(self, updates: dict[str, Any]) -> dict[str, Any]:
        for field, value in updates.items():
            if hasattr(self.config, field):
                setattr(self.config, field, value)
        return self.config.to_dict()

    async def _run_loop(self) -> None:
        while True:
            started = time.perf_counter()
            try:
                await self._run_cycle()
                self.success_count += 1
                self.last_successful_cycle_at = utc_now()
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                self.last_error = str(exc)
                self.status = "PAUSED"
                self.logger.log_risk({"event": "runtime_error", "message": str(exc), "timestamp": utc_now()})
            finally:
                elapsed_ms = (time.perf_counter() - started) * 1000
                self.cycle_count += 1
                self.avg_execution_ms = ((self.avg_execution_ms * max(self.cycle_count - 1, 0)) + elapsed_ms) / self.cycle_count
            await asyncio.sleep(self.config.cycle_interval_ms / 1000)

    async def _run_cycle(self) -> None:
        if self.status not in {"RUNNING", "PAUSED"}:
            return

        for pool, state in self.pool_states.items():
            # Get snapshot based on mode
            if self.current_mode == "live":
                snapshot = await self.live_market.snapshot(pool)
            else:
                snapshot = self.sim_market.snapshot(pool)
                
            recent_spreads = list(state.spread_history)
            recent_mids = list(state.mid_history)
            signals = self.signal_engine.compute(snapshot, recent_spreads, recent_mids)
            state.latest_snapshot = snapshot
            state.latest_signals = signals
            state.spread_history.append(snapshot.spread)
            state.mid_history.append(snapshot.mid_price)
            state.mark_to_market(snapshot.mid_price)

            risk = self.risk_engine.evaluate(
                inventory=state.inventory,
                net_pnl=state.net_pnl,
                starting_capital=self.config.starting_capital_per_pool,
                signals=signals,
                config=self.config,
                manual_kill=self._manual_kill,
                force_drawdown_stop=self._force_drawdown_stop,
            )

            if risk.events:
                for event in risk.events:
                    self.logger.log_risk(
                        {
                            "pool": pool,
                            "event": event,
                            "inventory": round(state.inventory, 4),
                            "net_pnl": round(state.net_pnl, 4),
                            "signals": asdict(signals),
                            "timestamp": utc_now(),
                        }
                    )

            if risk.hard_stop:
                self.status = "CIRCUIT_BREAKER_TRIGGERED"
                self._force_drawdown_stop = risk.reason == "drawdown_breaker"
                self._write_summary()
                return

            if risk.pause:
                self.status = "PAUSED"
                self.logger.log_execution(
                    {
                        "pool": pool,
                        "cycle": self.cycle_count + 1,
                        "status": self.status,
                        "reason": risk.reason,
                        "signals": asdict(signals),
                        "snapshot": asdict(snapshot),
                        "vault_state": {
                            "inventory": state.inventory,
                            "cash": state.cash,
                            "realized_pnl": state.realized_pnl,
                            "unrealized_pnl": state.unrealized_pnl,
                            "net_pnl": state.net_pnl,
                        },
                        "timestamp": utc_now(),
                    }
                )
                continue

            quote = self.strategy_engine.quote(
                signals=signals,
                inventory=state.inventory,
                config=self.config,
                spread_multiplier=risk.spread_multiplier,
                allow_bids=risk.allow_bids,
                allow_asks=risk.allow_asks,
            )
            state.latest_quote = quote
            
            # Execute based on mode
            if self.current_mode == "live":
                result = await self.live_executor.refresh_quotes(state, snapshot, quote)
            else:
                result = self.sim_executor.refresh_quotes(state, snapshot, quote)
                
            self.status = "RUNNING"

            self.logger.log_execution(
                {
                    "pool": pool,
                    "cycle": self.cycle_count + 1,
                    "status": self.status,
                    "mode": self.current_mode,
                    "signals": asdict(signals),
                    "quotes": asdict(quote),
                    "snapshot": asdict(snapshot),
                    "fills": result["fills"],
                    "vault_state": {
                        "inventory": round(state.inventory, 4),
                        "cash": round(state.cash, 4),
                        "realized_pnl": round(state.realized_pnl, 4),
                        "unrealized_pnl": round(state.unrealized_pnl, 4),
                        "net_pnl": round(state.net_pnl, 4),
                    },
                    "timestamp": utc_now(),
                }
            )

        self._write_summary()

    def _write_summary(self) -> None:
        totals = {
            "cycle_count": self.cycle_count,
            "status": self.status,
            "success_rate": self.success_rate,
            "avg_execution_ms": round(self.avg_execution_ms, 2),
            "total_realized_pnl": round(sum(pool.realized_pnl for pool in self.pool_states.values()), 4),
            "total_unrealized_pnl": round(sum(pool.unrealized_pnl for pool in self.pool_states.values()), 4),
            "total_net_pnl": round(sum(pool.net_pnl for pool in self.pool_states.values()), 4),
            "updated_at": utc_now(),
        }
        self.logger.write_summary(totals)

    @property
    def success_rate(self) -> float:
        return round((self.success_count / self.cycle_count), 4) if self.cycle_count else 0.0

    def dashboard(self) -> dict[str, Any]:
        recent_exec = self.logger.recent_execution(50)
        recent_risk = self.logger.recent_risk(25)
        return {
            "status": self.status,
            "cycle_count": self.cycle_count,
            "success_rate": self.success_rate,
            "avg_execution_ms": round(self.avg_execution_ms, 2),
            "last_successful_cycle_at": self.last_successful_cycle_at,
            "last_error": self.last_error,
            "config": self.config.to_dict(),
            "totals": {
                "realized_pnl": round(sum(pool.realized_pnl for pool in self.pool_states.values()), 4),
                "unrealized_pnl": round(sum(pool.unrealized_pnl for pool in self.pool_states.values()), 4),
                "net_pnl": round(sum(pool.net_pnl for pool in self.pool_states.values()), 4),
            },
            "pools": [state.to_dashboard() for state in self.pool_states.values()],
            "execution_logs": recent_exec,
            "risk_logs": recent_risk,
            "mode": self.current_mode,
        }
