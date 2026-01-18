# gWiki3 技術仕様書

## プロジェクト概要

gWiki3は、Google Apps Script (GAS) をバックエンドとし、Google Spreadsheetをデータベースとして使用する、モダンな分散型（連合型）Wikiアプリケーションです。
Push/Gossip型プロトコルを採用し、ユーザー間でのコンテンツ共有を可能にします。

## アーキテクチャ

### 全体構成

```
┌─────────────────┐
│   Frontend      │
│  (Alpine.js)    │
│   Port: 3000    │
└────────┬────────┘
         │ HTTP (JSON)
         ↓
┌─────────────────┐
│  GAS Backend    │
│   (Web App)     │
└────────┬────────┘
         │ Apps Script API
         ↓
┌──────────────────┐
│ Google Spreadsheet│
│ Index & Stores   │
└──────────────────┘
```

## 技術スタック

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Google Apps Script | V8 Runtime | サーバーレスバックエンド |
| TypeScript | 5.3+ | 型安全な開発 |
| Google Spreadsheet | - | データストレージ |
| clasp | - | GAS管理ツール |

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Alpine.js | 3.14.0 | UIフレームワーク |
| TypeScript | 5.3+ | 型安全な開発 |
| Vite | 5.0+ | ビルドツール・開発サーバー |
| Tailwind CSS | 3.4+ | スタイリング |
| Marked | 11.1+ | Markdownレンダリング |

### 開発・ビルドツール

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Bun | 1.3+ | パッケージマネージャー・ランタイム |
| Task | 3.x | タスクランナー (Taskfile.yml) |

## データモデル

### WikiPage

```typescript
interface WikiPage {
  id: string;          // UUID
  path: string;        // ページパス (例: "home", "admin/config")
  policyId: string;    // アクセスポリシー (例: "public", "admin")
  title: string;       // ページタイトル
  content: string;     // Markdownコンテンツ (Data Storeに分離)
  tags?: string[];     // タグ
  createdAt: string;   // ISO 8601形式の作成日時
  updatedAt: string;   // ISO 8601形式の更新日時
  origin?: string;     // オリジンノードのURL (連合用)
  author?: string;     // 著者名
}
```

### Peer

```typescript
interface Peer {
  id: string;
  url: string;
  name: string;
  isActive: boolean;
  lastSyncedAt?: string;
}
```

## ストレージ構成 (Google Spreadsheet)

### Pages (Index) シート
全ページのメタデータを管理するインデックス。コンテンツ本体は含まない。
- ID, Path, PolicyID, Title, Created At, Updated At, Tags

### Store_* (Content) シート
ポリシーごとに分割されたコンテンツ格納シート。
- ID, Content

### Peers シート
信頼するピアノードのリスト。
- URL, Name, Is Active, Last Synced At

### Cache シート
ピアから受信した外部コンテンツのキャッシュ。
- ID, Title, Content, Created At, Updated At, Origin, Author

## API仕様

### エンドポイント (GET)

#### `?path=pages`
全ページ（ローカル + キャッシュ）の取得。

#### `?path=page&id={id}`
特定ページの取得。

#### `?path=peers`
登録済みピアの一覧取得。

#### `?path=external_index`
外部Wikiインデックスの取得。

### エンドポイント (POST)

#### `?path=create`
新規ページの作成。
- Body: `{ title, content, tags, path }`

#### `?path=update`
ページの更新。
- Body: `{ id, title, content, tags }`

#### `?path=delete`
ページの削除。
- Body: `{ id }`

#### `?path=gossip` (連合用)
他ノードからの更新受信。
- Body: `{ page: WikiPage }`

#### `?path=add_peer`
ピアの追加。
- Body: `{ url, name }`

## フロントエンド構成 (Hash Routing)

- `#/`: ホーム (ページ一覧)
- `#/page/:id`: ページ表示
- `#/edit/:id`: ページ編集
- `#/new`: 新規ページ作成
- `#/admin/peers`: ピア管理
- `#/admin/stats`: 統計情報
- `#/admin/external-index`: 外部Wiki管理

## ビルド・管理コマンド

```bash
task dev            # フロントエンド開発サーバー起動
task build          # フロントエンドビルド
task test:backend   # バックエンドUT (Mock使用)
task backend:push   # GASコードプッシュ
```