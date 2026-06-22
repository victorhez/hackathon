
import json
import os
from datetime import datetime

VISITS_FILE = "data/visits.json"


def _ensure_visits_file():
    os.makedirs(os.path.dirname(VISITS_FILE), exist_ok=True)
    if not os.path.exists(VISITS_FILE):
        with open(VISITS_FILE, "w") as f:
            json.dump(
                {
                    "total_visits": 0,
                    "daily_visits": {},
                    "total_users": 0,
                    "users": []
                },
                f
            )


def _load_visits():
    _ensure_visits_file()
    with open(VISITS_FILE, "r") as f:
        return json.load(f)


def _save_visits(data):
    with open(VISITS_FILE, "w") as f:
        json.dump(data, f)


def increment_visit(user_id: str | None = None):
    data = _load_visits()
    today = datetime.now().strftime("%Y-%m-%d")

    # Increment total visits
    data["total_visits"] += 1

    # Increment daily visits
    if today not in data["daily_visits"]:
        data["daily_visits"][today] = 0
    data["daily_visits"][today] += 1

    # Track unique users
    if user_id and user_id not in data["users"]:
        data["users"].append(user_id)
        data["total_users"] = len(data["users"])

    _save_visits(data)
    return get_visit_stats()


def get_visit_stats():
    data = _load_visits()
    today = datetime.now().strftime("%Y-%m-%d")
    return {
        "total_visits": data["total_visits"],
        "daily_visits": data["daily_visits"].get(today, 0),
        "total_users": data["total_users"]
    }
