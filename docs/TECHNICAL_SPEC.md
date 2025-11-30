# gWiki3 技術仕様書

## プロジェクト概要

gWiki3は、Google Apps Script (GAS) をバックエンドとし、Google Spreadsheetをデータベースとして使用する、モダンなWikiアプリケーションです。

## アーキテクチャ

### 全体構成

```
┌─────────────────┐
│   Frontend      │
│  (React + Vite) │
│   Port: 3000    │
└────────┬────────┘
         │ HTTP
         ↓
┌─────────────────┐
│  GAS Backend    │
│   (Web App)     │
└────────┬────────┘
         │ Apps Script API
         ↓
┌─────────────────┐
│ Google          │
│ Spreadsheet     │
│  (Database)     │
└─────────────────┘
```

## 技術スタック

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Google Apps Script | V8 Runtime | サーバーレスバックエンド |
| TypeScript | 5.3+ | 型安全な開発 |
| Google Spreadsheet | - | データストレージ |

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 18.2+ | UIフレームワーク |
| TypeScript | 5.3+ | 型安全な開発 |
| Vite | 5.0+ | ビルドツール・開発サーバー |
| React Router | 6.21+ | ルーティング |
| Tailwind CSS | 3.4+ | スタイリング |
| React Markdown | 9.0+ | Markdownレンダリング |

### ビルドツール

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Bun | 1.3+ | パッケージマネージャー・ランタイム |
| clasp | - | GASデプロイツール |

## データモデル

### WikiPage

```typescript
interface WikiPage {
  id: string;          // UUID
  title: string;       // ページタイトル
  content: string;     // Markdownコンテンツ
  createdAt: string;   // ISO 8601形式の作成日時
  updatedAt: string;   // ISO 8601形式の更新日時
}
```

## API仕様

### エンドポイント

#### GET /exec?path=pages
全ページの取得

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Page Title",
      "content": "# Content",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /exec?path=page&id={id}
特定ページの取得

**パラメータ:**
- `id`: ページID (UUID)

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Page Title",
    "content": "# Content",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /exec?path=create
新規ページの作成

**リクエストボディ:**
```json
{
  "title": "Page Title",
  "content": "# Content"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Page Title",
    "content": "# Content",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /exec?path=update
ページの更新

**リクエストボディ:**
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "content": "# Updated Content"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    "content": "# Updated Content",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

#### POST /exec?path=delete
ページの削除

**リクエストボディ:**
```json
{
  "id": "uuid"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

## フロントエンド構成

### ページ構成

| パス | コンポーネント | 説明 |
|------|---------------|------|
| `/` | HomePage | 全ページ一覧 |
| `/page/:id` | PageView | ページ詳細表示 |
| `/new` | PageEditor | 新規ページ作成 |
| `/edit/:id` | PageEditor | ページ編集 |

### コンポーネント階層

```
App
├── Header (全ページ共通)
└── Routes
    ├── HomePage
    │   └── PageCard (複数)
    ├── PageView
    └── PageEditor
```

## デザインシステム

### カラーパレット

- **Primary**: Purple gradient (#667eea → #764ba2)
- **Secondary**: Pink gradient (#f093fb → #f5576c)
- **Accent**: Blue gradient (#4facfe → #00f2fe)

### デザイン原則

1. **Glassmorphism**: 半透明背景 + ブラー効果
2. **Gradient**: 鮮やかなグラデーション
3. **Animation**: スムーズなトランジション
4. **Typography**: Inter フォント使用

## ビルド・デプロイ

### 開発環境

```bash
# 依存関係のインストール
bun install

# 開発サーバー起動
bun run dev
```

### 本番ビルド

```bash
# フロントエンドのビルド
bun run build

# ビルド結果のプレビュー
bun run preview
```

### GASデプロイ

```bash
# バックエンドコードのプッシュ
cd backend
clasp push

# Web Appとしてデプロイ (GASエディタで実行)
clasp open
```

## セキュリティ考慮事項

### 認証
- GAS Web Appの実行権限設定により制御
- 「全員」アクセスの場合は認証なし
- 「自分のみ」の場合はGoogleアカウント認証が必要

### データ保護
- Spreadsheetへのアクセスはスクリプト経由のみ
- 直接的なSpreadsheet操作は不可

### CORS
- GAS Web Appは自動的にCORSヘッダーを設定
- クロスオリジンリクエストが可能

## パフォーマンス最適化

### フロントエンド
- Viteによる高速ビルド
- コード分割とTree Shaking
- 画像・アセットの最適化

### バックエンド
- Spreadsheet操作の最小化
- バッチ読み込み (`getDataRange()`)
- キャッシュ戦略 (将来的な改善)

## 今後の拡張案

1. **検索機能**: ページタイトル・コンテンツの全文検索
2. **カテゴリ・タグ**: ページの分類機能
3. **バージョン履歴**: ページ編集履歴の保存
4. **ユーザー管理**: 複数ユーザーでの編集権限管理
5. **リアルタイム同期**: WebSocketsによるリアルタイム更新
6. **添付ファイル**: Google Driveとの連携
7. **エクスポート**: PDF/HTML形式でのエクスポート
8. **テーマ**: ダーク/ライトモード切り替え
