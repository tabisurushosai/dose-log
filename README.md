# のんだ記録 (dose-log)

Records a single tap that a dose was taken; it does not handle medicine names, dosage or effects (non-medical).

「のんだ記録」は、1回のタップ時刻だけを Chrome storage に保存する Chrome 拡張です。名前・量・効果・指示は扱いません。診断、治療、医療助言、健康改善の主張は行いません。

## 使い方

1. Chrome で拡張機能のポップアップを開きます。
2. 大きな「のんだ」ボタンを押します。
3. 押した時刻がこの端末の Chrome storage に保存されます。
4. 必要に応じて「記録をすべて消す」でローカル保存分を削除できます。

## プライバシーと権限

- 完全オフラインで動作します。
- API 通信、外部送信、リモートコード、eval はありません。
- `manifest_version` は 3 です。
- permissions は `storage` のみです。
- host permissions はありません。

## Premium / Trial

- Premium は $3 買い切り、7日トライアルの枠組みを入れています。
- トライアルは storage に保存した初回起動日時から計算します。
- 課金リンクは `STRIPE_PAYMENT_LINK` の placeholder のままです。
- Premium が無効でも、基本のタップ記録機能は動作します。

## 開発

```bash
npm install
npm run build
```

`npm run build` はアイコンを生成し、型チェック後に `dist/` を作成します。`dist/` には `manifest.json`、`_locales/ja`、`_locales/en`、`icons/icon16.png`、`icons/icon48.png`、`icons/icon128.png` が含まれます。

## 構成

- `src/core/`: Chrome API に依存しない純ロジック
- `src/storage/`: storage アダプタと Chrome storage 実装
- `src/popup/`: Chrome 拡張 popup UI
- `public/`: manifest、locales、icons
- `legal/`: privacy/disclaimer 文書
