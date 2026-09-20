# 商品一覧サイト（人気順 / おすすめ 並べ替え）

`index.html` を開くだけで動く静的サイトです。ビルド不要（HTML/CSS/JSのみ）。

## 表示内容

各商品カードに以下を1セットで表示します。

- パッケージ画像（`packageImageUrl`）
- 商品タイトル（`title`）
- DMM/FANZAアフィリエイトリンクへの「詳細を見る」ボタン（`affiliateUrl`）

ページ上部には広告枠（`#ad-slot-top`）があり、Google AdSense等のクリック報酬型広告タグをそのまま貼り付けられます。

## 並べ替え機能

- **人気順**: `views`（閲覧数）の降順
- **おすすめ**: クリック率（`clicks / views`）と売上（`sales`、当該データ内の最大値で正規化）を1:1で合成したスコアの降順
  - スコア = クリック率 × 0.5 + (売上 ÷ 最大売上) × 0.5
  - 重み付け（0.5:0.5）は `app.js` の `recommendScore()` で調整できます

## データの入れ方（`products.json`）

```json
[
  {
    "id": "一意なID",
    "title": "商品タイトル",
    "packageImageUrl": "パッケージ画像のURL",
    "affiliateUrl": "DMM/FANZAアフィリエイトのリンクURL",
    "views": 閲覧数,
    "clicks": クリック数,
    "sales": 売上件数
  }
]
```

- `packageImageUrl` と `affiliateUrl` は、DMMアフィリエイトの公式API（DMM Webサービス）や管理画面から取得した値をそのまま入れてください。無断スクレイピングは利用規約違反になるため、このサイト側では取得処理を行っていません。
- `views` / `clicks` / `sales` は、DMMアフィリエイトの管理画面（レポート）からエクスポートした集計値を反映する運用を想定しています。現時点では自動集計は組み込んでいないため、定期的にこのファイルを更新してください。

## 広告タグの差し込み

`index.html` の `<div class="ad-slot" id="ad-slot-top"></div>` の中に、AdSense等の管理画面で発行された `<script>` タグをそのまま貼り付けてください。

## ローカルで確認する

```bash
cd site
python3 -m http.server 8080
# ブラウザで http://localhost:8080/index.html を開く
```

## 公開する

GitHub Pagesなど、静的ファイルをそのまま配信できるホスティングにこの`site`ディレクトリの内容をアップロードしてください。
