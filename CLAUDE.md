# CLAUDE.md

このファイルは、このリポジトリで作業する際の Claude Code (claude.ai/code) へのガイダンスを提供します。

## プロジェクト概要

gWikiは**Push/Gossipプロトコル**（Nostr/ActivityPubに着想を得た）を採用する分散型Wikiアプリケーションです。バックエンドにGoogle Apps Script、データベースにGoogle Spreadsheetを使用します。データをオンデマンドで取得するのではなく、更新を信頼できるピアにプッシュする独自のアーキテクチャにより、キャッシュされたレジリエントなコンテンツ配信を実現しています。

## 開発コマンド

```bash
# フロントエンド開発（ポート3000で起動）
bun run dev

# フロントエンド本番ビルド
bun run build
bun run preview

# バックエンドデプロイ（clasp経由でGASへ）
bun run backend:push    # バックエンドコードをGASへプッシュ
bun run backend:deploy  # Web Appとしてデプロイ
bun run backend:open    # ブラウザでGASエディタを開く
```

**注意**: このプロジェクトではBunをパッケージマネージャーとして使用しています。依存関係のインストールは `bun install` を使用してください。

## アーキテクチャ

### データフロー: Push/Gossipモデル

従来のWikiとは異なり、gWikiは**アウトボックスパターン**を使用します：
- ユーザーがページを作成/更新すると、すべての信頼できるピアに自動的にブロードキャストされます
- 各ノードは `gossip` エンドポイント経由で更新を受け取ります（インボックスパターン）
- 外部ページは `Cache` シートにローカルキャッシュされます（ローカルの `Pages` シートとは別）

これにより以下を実現します：
- **パフォーマンス**: データがローカルにキャッシュされ、リモート呼び出しが不要
- **レジリエンス**: オリジナルノードがダウンしてもコンテンツにアクセス可能
- **GAS最適化**: GASの実行時間制限内で動作

### バックエンド構造 (Google Apps Script)

`backend/src/` 配下：

- **`Code.ts`**: メインエントリーポイント - `doGet` と `doPost` のルーティングを処理
- **`api.ts`**: ページ、ピア、gossipプロトコルのAPIエンドポイントハンドラー
- **`db.ts`**: スプレッドシートデータベース操作（Pages、Peers、Cacheシート）

バックエンドは**クエリパラメータルーティングパターン**を使用します：`?path=create`、`?path=update`、`?path=gossip` など。

### フロントエンド構造 (React + Vite)

`frontend/src/` 配下：

- **`pages/`**: ルートコンポーネント（HomePage、PageView、PageEditor、管理ページ）
- **`components/`**: 再利用可能なUIコンポーネント（Header、Sidebar、WikiContentなど）
- **`api.ts`**: APIクライアント - **バックエンドなしで開発する場合は `USE_MOCK` をトグル**
- **`types.ts`**: 共有TypeScriptインターフェース

主な機能：
- **Wikiリンク**: `[PageTitle]` 構文で簡単なページリンク（`WikiContent.tsx` でパース）
- **バージョン履歴**: 限られたバージョンストレージでページ変更を追跡
- **管理ページ**: リンク切れ、孤立したページ、統計
- **ダーク/ライトテーマ**: `ThemeProvider` によるテーマ切り替え

### データベーススキーマ (Google Spreadsheet)

`db.ts` で管理される3つのシート：

1. **Pages**: ローカルWikiページ（ID、Title、Content、Created At、Updated At、Tags）
2. **Peers**: 信頼できるピアノード（URL、Name、Is Active、Last Synced At）
3. **Cache**: ピアからの外部ページ（ID、Title、Content、Created At、Updated At、Origin、Author）

### Gossipプロトコルエンドポイント

**アウトボックス（更新送信）**:
- `POST ?path=create` / `?path=update` - すべてのピアに自動ブロードキャスト

**インボックス（更新受信）**:
- `POST ?path=gossip` - ピアからのページ更新を受け取り、Cacheに保存

**ピア管理**:
- `GET ?path=peers` - すべての信頼できるピアを一覧表示
- `POST ?path=add_peer` - 新しいピアノードを追加

## 重要な注意点

### Google Apps Scriptの制約

- GASには実行時間制限があります（約6分）
- スプレッドシート操作は効率化のためバッチ読み込み（`getDataRange()`）を使用
- データベースへの直接アクセスはありません - すべてGASスクリプト経由

### モック開発

フロントエンドはオフライン開発のためにモックモードをサポートします：
- `frontend/src/api.ts` で `USE_MOCK = true` を設定
- GASバックエンドの代わりにローカルモックデータを使用

### デプロイワークフロー

1. `bun run backend:push` - TypeScriptコードをGASにプッシュ
2. `bun run backend:open` - GASエディタを開く
3. `initialize()` 関数を実行してスプレッドシートを作成
4. Web Appとしてデプロイ（パブリックWikiの場合は「全員」アクセスに設定）
5. Web App URLをフロントエンドの `.env` または `api.ts` にコピー

### Wikiリンクのパース

Wikiリンクは `[PageTitle]` 構文を使用します：
- 紫色のリンク = ページが存在（クリック可能）
- 赤い点線下線 = ページが存在しない（作成可能）

パースロジックは `WikiContent.tsx` コンポーネントにあります。
