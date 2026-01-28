# 工事工程表バーチャートアプリ

工事工程表をExcel形式のバーチャートで作成・管理し、PDF/PNG/Excel形式でエクスポートできるWebアプリケーション

## 機能

- 時間・日・週・月スケールでの工程表作成
- 5分刻みの時間単位管理
- タスクのドラッグ&ドロップによる順序変更
- タスクごとの色設定
- PDF/PNG/Excel形式でのエクスポート
- モバイル対応（iPhone/Android）

詳細は[仕様書.md](./仕様書.md)を参照してください。

## セットアップ

```bash
npm install
```

## 開発

```bash
npm run dev
```

開発サーバーは `http://localhost:5173/` で起動します。
ネットワークアクセスを有効にするには、`vite.config.ts` で `server.host: true` が設定されています。

## ビルド

```bash
npm run build
```

## Firebase Hosting デプロイ

### 1. Firebase CLIでログイン

```bash
firebase login
```

### 2. Firebaseプロジェクトを作成

Firebase Console (https://console.firebase.google.com/) で新しいプロジェクトを作成するか、CLIで作成：

```bash
firebase projects:create your-project-id
```

### 3. プロジェクトIDを設定

`.firebaserc` ファイルの `your-firebase-project-id` を実際のプロジェクトIDに置き換えます。

### 4. ビルドとデプロイ

```bash
npm run build
firebase deploy --only hosting
```

## ライセンス

MIT
