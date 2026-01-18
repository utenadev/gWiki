# GAS Backend Setup Guide

このガイドでは、Google Apps Script (GAS) バックエンドのセットアップ方法を説明します。

## 前提条件

- Googleアカウント
- claspがインストール済み (`npm install -g @google/clasp`)
- claspでログイン済み (`clasp login`)

## セットアップ手順

### 1. GASプロジェクトの作成

```bash
cd backend
clasp create --type webapp --title "gWiki3 Backend"
```

このコマンドにより、`.clasp.json` ファイルが作成されます。

### 2. コードのプッシュ

```bash
clasp push
```

TypeScriptファイルがGASプロジェクトにアップロードされます。

### 3. 初期化関数の実行

1. GASエディタを開く:
```bash
clasp open
```

2. エディタで `initialize()` 関数を選択して実行
3. 初回実行時は権限の承認が必要です
4. 実行ログにSpreadsheetのURLが表示されます

### 4. Web Appとしてデプロイ

1. GASエディタで「デプロイ」→「新しいデプロイ」を選択
2. 種類として「ウェブアプリ」を選択
3. 設定:
   - **説明**: gWiki3 API v1
   - **次のユーザーとして実行**: 自分
   - **アクセスできるユーザー**: 全員
4. 「デプロイ」をクリック
5. **Web AppのURL**をコピー

### 5. フロントエンドの設定

1. `frontend/src/api.ts` を開く
2. `USE_MOCK` を `false` に変更
3. `WikiApi` のコンストラクタ呼び出しで、デプロイしたWeb AppのURLを設定:

```typescript
export const api = new WikiApi('YOUR_WEB_APP_URL_HERE');
```

### 6. 動作確認

1. フロントエンドを再起動:
```bash
bun run dev
```

2. ブラウザで http://localhost:3000 を開く
3. ページの作成・編集・削除が実際のSpreadsheetに反映されることを確認

## トラブルシューティング

### エラー: "Script has attempted to perform an action that is not allowed"

- GASエディタで権限の承認を再度実行してください

### エラー: "Access denied"

- Web Appのデプロイ設定で「アクセスできるユーザー」が「全員」になっているか確認
- または、認証付きアクセスに変更してください

### Spreadsheetが見つからない

- `initialize()` 関数を実行して、Spreadsheet IDをスクリプトプロパティに保存
- または、既存のSpreadsheet IDを手動で設定:
  1. GASエディタで「プロジェクトの設定」→「スクリプトプロパティ」
  2. `SPREADSHEET_ID` プロパティを追加
  3. 値にSpreadsheet IDを設定

## Spreadsheetの構造

`Pages` シートには以下のカラムがあります:

| カラム | 説明 |
|--------|------|
| ID | ページの一意識別子 (UUID) |
| Title | ページタイトル |
| Content | Markdownコンテンツ |
| Created At | 作成日時 (ISO 8601) |
| Updated At | 更新日時 (ISO 8601) |

## 開発時のヒント

### ログの確認

```bash
clasp logs
```

### コードの更新

```bash
clasp push
```

変更後は、Web Appを再デプロイする必要はありません。
ただし、大きな変更の場合は新しいバージョンとしてデプロイすることをお勧めします。

### テスト関数

`test()` 関数を使用して、データベース操作をテストできます:

```javascript
function test() {
  const page = createPage('Test', '# Test Content');
  Logger.log(page);
}
```
