from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .agent import AgentService

# Load environment variables from .env file
load_dotenv()


service = AgentService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await service.stop()


app = FastAPI(
    title="DeepBook AI Market-Making Agent API",
    version="0.1.0",
    lifespan=lifespan,
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[item.strip() for item in origins.split(",") if item.strip()],
    allow_origin_regex=".*",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/mode")
async def get_mode() -> dict[str, str]:
    return {"mode": service.current_mode}


@app.put("/api/mode")
async def set_mode(payload: dict[str, str]) -> dict[str, Any]:
    new_mode = payload.get("mode")
    if new_mode not in ["simulation", "live"]:
        return {"status": "error", "message": "Mode must be 'simulation' or 'live'"}
    service.set_mode(new_mode)
    return {"status": "ok", "mode": service.current_mode}


@app.get("/api/dashboard")
async def dashboard() -> dict[str, Any]:
    return service.dashboard()


@app.get("/api/config")
async def get_config() -> dict[str, Any]:
    return service.config.to_dict()


@app.put("/api/config")
async def update_config(payload: dict[str, Any]) -> dict[str, Any]:
    return service.update_config(payload)


@app.post("/api/start")
async def start() -> dict[str, Any]:
    return await service.start()


@app.post("/api/stop")
async def stop() -> dict[str, Any]:
    return await service.stop()


@app.post("/api/kill")
async def kill() -> dict[str, Any]:
    return await service.kill()
