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


def build_slack_payload(item: dict) -> dict:
    hashtags = item.get("hashtags", [])
    hashtag_line = " ".join(f"#{tag}" for tag in hashtags) if hashtags else "(なし)"
    caption = item.get("caption", "(本文未設定)")

    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f":bell: *投稿予定の時間になりました*\n予定時刻: {item['time']} (JST)",
            },
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*キャプション*\n{caption}\n\n*ハッシュタグ*\n{hashtag_line}",
            },
        },
    ]

    image_url = item.get("imageUrl")
    if image_url:
        blocks.append(
            {
                "type": "image",
                "image_url": image_url,
                "alt_text": item.get("title", "投稿用イラスト"),
            }
        )
    else:
        blocks.append(
            {
                "type": "context",
                "elements": [{"type": "mrkdwn", "text": "⚠️ imageUrlが未設定のため画像は表示されません"}],
            }
        )

    # textはSlackの通知プレビュー・blocksが表示できないクライアント向けのフォールバック
    fallback_text = f"投稿予定の時間になりました\n{caption}\n{hashtag_line}"
    return {"text": fallback_text, "blocks": blocks}


def send_slack(item: dict) -> None:
    if not SLACK_WEBHOOK_URL:
        raise RuntimeError("SLACK_WEBHOOK_URL が設定されていません")
    payload = build_slack_payload(item)
    resp = requests.post(SLACK_WEBHOOK_URL, json=payload, timeout=10)
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

        send_slack(item)
        item["notified"] = True
        changed = True

    if changed:
        save_schedule(items)


if __name__ == "__main__":
    main()
