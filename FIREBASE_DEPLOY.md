# Firebase Hosting デプロイ手順

## 1. Firebaseプロジェクトの作成

### 方法A: Firebase Consoleで作成（推奨）

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `construction-gantt-chart`）
4. Google Analyticsの設定（任意）
5. プロジェクトを作成

### 方法B: CLIで作成

```bash
firebase projects:create your-project-id --display-name "工事工程表バーチャート"
```

## 2. プロジェクトIDの設定

`.firebaserc` ファイルを開き、`your-firebase-project-id` を実際のプロジェクトIDに置き換えます：

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## 3. Firebase Hostingの初期化

```bash
firebase init hosting
```

以下の選択肢を選びます：
- Use an existing project: 作成したプロジェクトを選択
- What do you want to use as your public directory?: `dist`
- Configure as a single-page app: `Yes`
- Set up automatic builds and deploys with GitHub?: `No`（後で設定可能）

## 4. ビルドとデプロイ

```bash
# ビルド
npm run build

# デプロイ
firebase deploy --only hosting
```

## 5. デプロイ後の確認

デプロイが完了すると、以下のようなURLが表示されます：
```
✔ Deploy complete!

Hosting URL: https://your-project-id.web.app
```

## トラブルシューティング

### Firebase CLIでログインできない場合

```bash
firebase login
```

ブラウザが開くので、Googleアカウントでログインしてください。

### プロジェクトが見つからない場合

```bash
firebase use --add
```

リストからプロジェクトを選択してください。
