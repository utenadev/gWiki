# gWiki 作業ログ

## 2026-01-18

### ドキュメントと実装の同期

**目的**: 実装（ポリシーベース分割・Alpine.js移行・API拡張）とドキュメント（SPEC/ARCHITECTURE）の乖離を解消し、正確な状態を反映させる。

#### 更新内容

1. **`docs/PLAN.md`**
   - Phase 2 (フロントエンド統合) を完了済みに更新。
   - Phase 2.5 (データ構造最適化) を完了済みに更新。

2. **`docs/TECHNICAL_SPEC.md`**
   - **フロントエンド技術スタック**: React/Vite → Alpine.js 3.14.0 に刷新。
   - **データモデル**: `WikiPage` に `path`, `policyId`, `origin`, `author`, `tags` を追加。
   - **ストレージ構成**: Indexシート (`Pages`) と Data Storeシート (`Store_*`) の分離構成を記述。
   - **API仕様**: 新規エンドポイント (`peers`, `gossip`, `external_index`) およびパラメータ (`path`) の仕様を追記。
   - **ビルド・管理**: `Taskfile.yml` ベースのコマンドを追記。

3. **`docs/ARCHITECTURE.md`**
   - **ポリシーベース・パーティショニング**: ページパスに基づく格納先シートの自動振り分け（`admin/` → `Store_Admin`）について追記。
   - **IndexとData Storeの分離**: メタデータと実データの物理的分離によるメリット（管理性、セキュリティ）を詳述。

#### 確認

- 現在の実装コードとドキュメントの記述が一致していることを確認。

---

### ページ階層化とポリシーベース・パーティショニングの実装

**目的**: ページ名による階層化（ディレクトリ構造）のサポートと、アクセスポリシーに基づくデータ格納の分離を実現する。

#### 実装内容

1. **GASローカルテスト環境 (Mock) の構築**
   - `backend/tests/mocks/gas.ts` を作成し、GAS固有のオブジェクト（SpreadsheetApp, PropertiesService, LockService等）をモック化。
   - `bun test` を利用したローカルでのユニットテスト環境を整備。
   - `Taskfile.yml` に `test:backend` タスクを追加。

2. **データ構造の刷新 (Policy Based Partitioning)**
   - `Pages` シートを「インデックス」として定義し、メタデータ（ID, Path, PolicyID, Title等）のみを保持。
   - ページ本文をポリシーごとに分割されたシート（`Store_Public`, `Store_Admin`）に格納する仕組みを導入。
   - ページパスに基づくポリシー自動判定（`admin/` プレフィックスで `admin` ポリシーを適用）を実装。

3. **DBロジックのリファクタリング**
   - `backend/src/db.ts` を `DB` クラスとして再構築。
   - インデックスからの検索と、ストアからのコンテンツ取得を組み合わせたデータ取得フローを実装。

4. **型定義の更新**
   - `backend` および `frontend` の `WikiPage` インターフェースに `path` と `policyId` フィールドを追加。

#### 動作確認

- `task test:backend` にて、新規ページ作成および取得のロジックが正常に動作することを確認済み。

---

### External Index システム実装

**目的**: 分散型Wikiネットワークにおいて、外部のWikiを登録・管理するExternal Indexシステムを実装する

#### バックエンド実装

1. **`backend/src/db.ts`**
   - 重複していた `addExternalWiki` 関数を修正・整理
   - `removeExternalWiki` 関数を追加
   - `ExternalWiki` インターフェースを定義
   - External_Index シートの管理機能を強化

2. **`backend/src/api.ts`**
   - `GET ?path=external_index` - 外部Wiki一覧取得
   - `POST ?path=add_external_wiki` - 外部Wiki追加
   - `POST ?path=remove_external_wiki` - 外部Wiki削除

#### フロントエンド実装

1. **`frontend/src/types.ts`**
   - `ExternalWiki` インターフェースを追加

2. **`frontend/src/api.ts`**
   - `getExternalIndex()` - 外部Wiki一覧取得
   - `addExternalWiki()` - 外部Wiki追加
   - `removeExternalWiki()` - 外部Wiki削除

3. **`frontend/src/main.ts`**
   - `externalIndexManagement` Alpine コンポーネントを実装
   - 外部Wikiの追加・削除・一覧表示機能

4. **`frontend/index.html`**
   - External Index 管理ページのルーティング追加 (`#/admin/external-index`)
   - ヘッダーナビゲーションに「External Index」リンクを追加

5. **`frontend/src/pages/ExternalIndexManagement.html`** (新規)
   - 外部Wikiインデックス管理のUIテンプレート

#### 機能

- 外部Wikiの登録（Wiki ID、タイトル、説明、アクセスURL、タグ）
- 外部Wikiの削除
- 外部Wiki一覧の表示
- 登録日時・更新日時の追跡
- タグによる分類

#### 動作確認

- devサーバー (`bun run dev`) で動作確認済み
- ルーティング: `#/admin/external-index`
- ヘッダーの「External Index」リンクからアクセス可能

---

## 2026-01-17

### Alpine.js への移行

**目的**: React から Alpine.js への移行による、バンドルサイズの削減とコードの簡素化

#### 実装内容

1. **フレームワークの置き換え**
   - React → Alpine.js 3.14.0
   - JSX/TSX → HTMLテンプレート + TypeScript
   - React Router → Hashベースルーティング

2. **コンポーネントの移行**
   - `homePage`: ページ一覧（検索、タグフィルター）
   - `pageView`: ページ表示（Markdownレンダリング、バージョン履歴）
   - `pageEditor`: ページ作成・編集（プレビュー機能）
   - `brokenLinksAdmin`: リンク切れ管理
   - `orphanedPagesAdmin`: 孤立ページ管理
   - `statsAdmin`: 統計ダッシュボード
   - `peerManagement`: ピア管理

3. **状態管理**
   - Alpine ストアによるテーマ管理（ダーク/ライトモード）

4. **結果**
   - コード量: 45% 削減
   - バンドルサイズ: 15KB → 130KB (React時) から 15KB (Alpine.js) へ大幅削減

#### 動作確認

- すべてのページで正常に動作することを確認
- ルーティング、テーマ切り替え、ページ作成・編集・削除が正常に動作

---

### 連合機能インフラの実装

**目的**: 分散型Wikiのためのピア管理機能を実装

#### 実装内容

1. **バックエンド**
   - `Peer` 型の定義
   - `getPeers()`, `addPeer()`, `removePeer()` API
   - `Peers` シートでのピア情報管理

2. **フロントエンド**
   - `peerManagement` Alpine コンポーネント
   - ピア一覧表示、追加、削除機能
   - 同期ステータスの表示

---

### HTMLテンプレートの実装

**目的**: Alpine.js 用の完全なHTMLテンプレートを実装

#### 実装内容

- すべてのページのHTMLテンプレートを `index.html` に追加
- ローディング状態、エラーハンドリング、ダークモード対応
- 日本語UI

---

### ルーティング修正

**目的**: Hashベースルーティングの問題を修正

#### 修正内容

- `parseRoute` の先頭スラッシュ処理を修正
- `startsWith` を使用したルーティング条件の改善
- カスタム `route-change` イベントの実装

---

### コードの簡素化

**目的**: 共通ユーティリティの抽出によるコード削減

#### 実装内容

- `formatDate`, `renderMarkdown`, `getErrorMessage` を共通化
- 型アノテーションの追加
- アクセシビリティの改善（aria-label）

---

### ドキュメント更新

**目的**: Alpine.js 移行に伴うドキュメントの更新

#### 実装内容

- MIT LICENSE の追加
- README.md の更新（Alpine.js ベースに）
- README.ja.md の更新（日本語版）
- プロジェクト構造の更新
- テックスタックの更新

---

## 2025-12-01

### バージョン履歴機能

- ページのバージョン履歴管理機能を追加
- （UI実装はWIP）

---

## 2025-11-30

### プロジェクト初期セットアップ

- リポジトリの初期化
- 基本プロジェクト構造の作成

### 検索機能と自動ページ作成

- ページ検索機能の実装
- 存在しないページへのリンクから自動作成機能

### ダーク/ライトテーマ切り替え

- テーマ切り替え機能の実装
- Tailwind CSS ダークモード対応

### タグ機能

- ページタグの追加
- タグによるフィルタリング

### バックリンク機能

- ページへのリンク元を表示するバックリンク機能
- Wikiリンク `[PageTitle]` のパース

### サイドバーの追加

- 最近の更新
- タグ一覧
- フィード
- 管理ページへのリンク