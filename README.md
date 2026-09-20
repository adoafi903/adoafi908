# 投稿予約 通知システム

X（Twitter）への自動投稿は行いません。「予約した時刻になったらSlackに通知する」だけの仕組みです。
通知を受け取ったら、あなた自身の手でXに投稿してください。

## 使い方

### 1. Slack Webhook を用意する

Slackで Incoming Webhook を作成し、URLを取得します。

### 2. GitHub Secrets に登録する

リポジトリの `Settings > Secrets and variables > Actions` で、以下のSecretを追加します。

- `SLACK_WEBHOOK_URL`: 取得したSlack Webhook URL

### 3. 投稿予定を `schedule.json` に追加する

```json
[
  {
    "id": "2026-09-21-1",
    "time": "2026-09-21 12:20",
    "text": "投稿する本文をここに書く\nhttps://example.com/affiliate-link",
    "notified": false
  }
]
```

- `time`: 通知してほしい時刻（JST、`YYYY-MM-DD HH:MM` 形式）
- `text`: Slack通知に載せる投稿内容（本文＋アフィリエイトURLなど）
- `notified`: 通知済みかどうか。新規追加時は `false` にしておく（通知後は自動で `true` に書き換えられます）

編集後、このファイルをコミット・プッシュしてください。

### 4. 動作の仕組み

- `.github/workflows/notify.yml` が5分おきに実行され、`notify.py` を呼び出します。
- `notify.py` は `schedule.json` を見て、予定時刻を過ぎていてまだ通知していない項目があればSlackに通知します。
- 通知した項目は `notified: true` に書き換えられ、ワークフローが自動でコミットします（重複通知の防止）。

### ローカルで試す場合

```bash
pip install -r requirements.txt
cp .env.example .env  # SLACK_WEBHOOK_URL を書き込む
python notify.py
```
