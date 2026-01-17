# gWiki 📚

Google Apps Script と Google Spreadsheet を活用したフェデレーション型 Wiki アプリケーション。

## 特徴

- ✨ **モダンなUI**: Tailwind CSSによる美しいレスポンシブデザイン
- 📝 **Markdown対応**: ライブプレビュー付きのMarkdownエディタ
- 🔗 **Wikiリンク**: `[ページタイトル]` 構文でページ同士をリンク - 存在するページは紫、存在しないページは赤で表示
- 🏷️ **タグ**: ページを分類・発見しやすくするタグ機能
- 🔙 **バックリンク**: 現在のページにリンクしている他のページを表示
- 📜 **バージョン履歴**: 変更履歴の追跡と過去バージョンの復元
- 🌓 **ダーク/ライトテーマ**: ダークモードとライトモードの切り替え
- 📊 **管理ツール**: リンク切れ、孤立ページ、統計情報の管理
- 🌐 **フェデレーション**: Push/Gossipプロトコルで信頼できるピアノードとページを交換
- ☁️ **クラウド対応**: Google Apps ScriptバックエンドとSpreadsheetデータベース
- ⚡ **高速ビルド**: Bunによる超高速パッケージ管理とビルド
- 🔒 **セキュア**: Googleの認証・セキュリティを活用

## 技術スタック

### バックエンド
- **Google Apps Script** (TypeScript)
- **Google Spreadsheet** (データベース)
- **clasp** (デプロイツール)

### フロントエンド
- **Alpine.js** 3.x (軽量级リアクティブフレームワーク)
- **Vite** (ビルドツール)
- **TypeScript**
- **Tailwind CSS** (スタイリング)
- **marked** (Markdownレンダリング)

### ビルドツール
- **Bun** (パッケージマネージャー・ビルドツール)

## プロジェクト構造

```
gWiki/
├── backend/          # Google Apps Script バックエンド
│   ├── src/
│   │   ├── Code.ts   # メインエントリーポイント
│   │   ├── api.ts    # APIエンドポイント
│   │   └── db.ts     # データベース操作
│   ├── appsscript.json
│   └── package.json
├── frontend/         # Alpine.js フロントエンド
│   ├── src/
│   │   ├── main.ts   # Alpine.js コンポーネントとロジック
│   │   ├── api.ts    # API クライアント
│   │   └── types.ts  # TypeScript 型定義
│   ├── index.html    # Alpine.js テンプレート
│   └── package.json
├── docs/             # ドキュメント
└── package.json      # ルートパッケージ
```

## セットアップ

### 前提条件

- [Bun](https://bun.sh/) がインストールされていること
- [clasp](https://github.com/google/clasp) がインストール・設定されていること
- Googleアカウント

### インストール

1. 依存関係をインストール:
```bash
bun install
```

2. バックエンドをセットアップ:
```bash
cd backend
clasp login
clasp create --type webapp --title "gWiki Backend"
```

3. バックエンドをデプロイ:
```bash
bun run backend:push
```

4. Apps Scriptで初期化関数を実行してスプレッドシートを作成:
   - Apps Scriptプロジェクトを開く: `bun run backend:open`
   - `initialize()` 関数を実行
   - スプレッドシートのURLをメモ

5. Web Appとしてデプロイしてフロントエンドを設定:
   - アクセス権「全員」でWeb Appをデプロイ
   - Web AppのURLをコピー
   - `frontend/src/api.ts` をURLで更新（`USE_MOCK = false` を設定）

詳細なセットアップ手順は [docs/GAS_SETUP.md](docs/GAS_SETUP.md) を参照してください。

### 開発

開発サーバーを起動:
```bash
bun run dev
```

`http://localhost:3000` でアプリが開きます。

### ビルド

本番用にフロントエンドをビルド:
```bash
bun run build
```

本番ビルドをプレビュー:
```bash
bun run preview
```

## 使い方

### ページの作成

1. ホームページの「新規ページを作成」をクリック
2. タイトル、コンテンツ（Markdown対応）、タグ（オプション）を入力
3. 「保存」をクリック

### ページの編集

1. ページを開く
2. 「編集」をクリック
3. コンテンツを変更
4. 「保存」をクリック

### Wikiリンクの使用

`[ページタイトル]` 構文で他のページにリンク:

```markdown
フォーマットのコツは [Markdown Guide] をご覧ください。
例は [TestPage] で確認できます。
```

- **存在するページ**: 紫色のクリック可能なリンクで表示
- **存在しないページ**: 赤い点線下線で表示

詳細は [docs/WIKI_LINKS.md](docs/WIKI_LINKS.md) を参照してください。

### バージョン履歴

各ページはバージョン履歴を保持しています。任意のページで「バージョン履歴」をクリックして、過去のバージョンの表示ができます。

### 管理ページ

ナビゲーションから管理機能にアクセスできます:
- **ピア**: フェデレーション用の信頼できるピアノードを管理
- **統計**: Wikiの統計情報を表示（総ページ数、リンク数、タグ数、リンク切れ、孤立ページ）

## フェデレーション

gWikiはNostrやActivityPubに着想を得た **Push/Gossipプロトコル** を採用しています。データをオンデマンドで取得するのではなく、ノードが積極的に情報を交換します。

### 仕組み

1. **Outbox**: ページを作成・更新すると、すべての信頼できるピアに自動的にブロードキャスト
2. **Inbox**: 各ノードはgossipエンドポイント経由でピアからの更新を受け取れる
3. **Cache**: 外部ページは別のキャッシュシートにローカル保存

### メリット

- **パフォーマンス**: データがローカルにキャッシュされるため、表示時にリモート呼び出しが不要
- **レジリエンス**: オリジナルノードがダウンしていてもコンテンツにアクセス可能
- **GAS最適化**: Google Apps Scriptの実行時間制限内で動作

詳細なフェデレーションアーキテクチャは [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照してください。

## APIエンドポイント

GASバックエンドは以下のエンドポイントを提供します:

### ページ
- `GET ?path=pages` - すべてのページを取得（ローカル + キャッシュ）
- `GET ?path=page&id={id}` - 特定のページを取得
- `POST ?path=create` - 新規ページ作成
- `POST ?path=update` - ページ更新
- `POST ?path=delete` - ページ削除

### フェデレーション
- `GET ?path=peers` - 信頼できるピアのリストを取得
- `POST ?path=add_peer` - 新しいピアノードを追加
- `POST ?path=gossip` - ピアからの更新を受け取り（Inbox）

## ロードマップ

完全な開発計画は [docs/PLAN.md](docs/PLAN.md) を参照してください。

### Phase 1: フェデレーションの基礎 ✅
- [x] ピア管理（バックエンド）
- [x] Inbox & Outbox（Gossipプロトコル）
- [ ] 基本的な認証/セキュリティ

### Phase 2: フロントエンド統合
- [x] ピア管理UI
- [ ] フェデレーションコンテンツの表示と帰属表示
- [ ] 外部コンテンツのWikiLink解決

### Phase 3: 信頼性とスケーラビリティ
- [ ] 非同期伝播キュー
- [ ] 競合解決
- [ ] デジタル署名

### Phase 4: リレーノード
- [ ] 専用リレーサーバーモード
- [ ] コミュニティハブ機能

## ドキュメント

- [GASセットアップガイド](docs/GAS_SETUP.md) - バックエンドデプロイ手順
- [Wikiリンクガイド](docs/WIKI_LINKS.md) - Wikiリンクの使い方
- [アーキテクチャ](docs/ARCHITECTURE.md) - フェデレーションアーキテクチャ詳細
- [計画](docs/PLAN.md) - 開発ロードマップ

## ライセンス

MIT
