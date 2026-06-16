from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .models import utc_now


class WalrusLogger:
    def __init__(self, base_path: str = "data") -> None:
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.execution_path = self.base_path / "execution_logs.jsonl"
        self.risk_path = self.base_path / "risk_logs.jsonl"
        self.summary_path = self.base_path / "session_summary.json"

    def _append(self, path: Path, payload: dict[str, Any]) -> None:
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(payload) + "\n")

    def log_execution(self, payload: dict[str, Any]) -> None:
        payload["logged_at"] = utc_now()
        self._append(self.execution_path, payload)

    def log_risk(self, payload: dict[str, Any]) -> None:
        payload["logged_at"] = utc_now()
        self._append(self.risk_path, payload)

    def write_summary(self, payload: dict[str, Any]) -> None:
        payload["updated_at"] = utc_now()
        self.summary_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def tail(self, path: Path, limit: int = 100) -> list[dict[str, Any]]:
        if not path.exists():
            return []
        lines = path.read_text(encoding="utf-8").strip().splitlines()
        records = [json.loads(line) for line in lines if line.strip()]
        return records[-limit:]

    def recent_execution(self, limit: int = 100) -> list[dict[str, Any]]:
        return self.tail(self.execution_path, limit)

    def recent_risk(self, limit: int = 100) -> list[dict[str, Any]]:
        return self.tail(self.risk_path, limit)
