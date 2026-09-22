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
    "id": "2026-09-22-1",
    "time": "2026-09-22 12:20",
    "title": "彼女の地雷、踏みました",
    "caption": "彼女の「大丈夫」を信じたら、地獄を見た話。",
    "hashtags": ["あるある", "カップルあるある", "創作漫画", "ちび絵", "ネタ漫画", "4コマ"],
    "imageUrl": "https://example.com/posts/001.png",
    "notified": false
  }
]
```

- `time`: 通知してほしい時刻（JST、`YYYY-MM-DD HH:MM` 形式）
- `title`: 管理用の識別名（Slack画像のalt textにも使われます。省略可）
- `caption`: 投稿本文（Xにそのままコピペする文章）
- `hashtags`: ハッシュタグの配列（`#`は付けずに文字列だけ入れてください。自動で付与されます）
- `imageUrl`: 投稿するイラストの画像URL。**Slackが取得できる公開URLである必要があります**（ローカルのファイルパスは不可）。GitHub Pagesで公開しているこのリポジトリの`site/`配下に画像を置いて、そのURLを指定する運用がおすすめです
- `notified`: 通知済みかどうか。新規追加時は `false` にしておく（通知後は自動で `true` に書き換えられます）

`imageUrl`を省略した場合、Slack通知には「画像は表示されません」という注記が表示されます（画像なしでも通知自体は送られます）。

**画像の置き場所について**: このリポジトリはGitHub Pagesで公開されているので、画像ファイルを`site/posts/`のようなフォルダに置いてコミット・プッシュすれば、`https://adoafi903.github.io/posts/ファイル名.png`という公開URLが使えます。これを`imageUrl`に指定してください。

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
