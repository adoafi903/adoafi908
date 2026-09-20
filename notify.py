import json
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from dotenv import load_dotenv

load_dotenv()

SCHEDULE_FILE = Path(__file__).parent / "schedule.json"
JST = ZoneInfo("Asia/Tokyo")
SLACK_WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL")


def load_schedule() -> list[dict]:
    if not SCHEDULE_FILE.exists():
        return []
    with open(SCHEDULE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_schedule(items: list[dict]) -> None:
    with open(SCHEDULE_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
        f.write("\n")


def send_slack(text: str) -> None:
    if not SLACK_WEBHOOK_URL:
        raise RuntimeError("SLACK_WEBHOOK_URL が設定されていません")
    resp = requests.post(SLACK_WEBHOOK_URL, json={"text": text}, timeout=10)
    resp.raise_for_status()


def main() -> None:
    items = load_schedule()
    now = datetime.now(JST)
    changed = False

    for item in items:
        if item.get("notified"):
            continue

        scheduled_at = datetime.strptime(item["time"], "%Y-%m-%d %H:%M").replace(tzinfo=JST)
        if scheduled_at > now:
            continue

        message = (
            ":bell: 投稿予定の時間になりました\n"
            f"予定時刻: {item['time']} (JST)\n"
            "------\n"
            f"{item['text']}"
        )
        send_slack(message)
        item["notified"] = True
        changed = True

    if changed:
        save_schedule(items)


if __name__ == "__main__":
    main()
