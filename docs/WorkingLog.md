# 作業ログ

## 2026-01-17

### フロントエンド：React → Alpine.js 移行

**背景**: Reactの知識が不要であり、gWikiのようなコンテンツ重視のアプリにはAlpine.js + Tailwind CSSの組み合わせが最適であるとの判断。

**実装内容**:
- **フレームワーク変更**: React → Alpine.js 3.14.0
  - Reactの仮想DOMとJSXをAlpine.jsの宣言的ディレクティブ（x-data, x-if, x-show等）に置き換え
  - TypeScript + Vite環境は維持
- **ルーティング**: Hashベースのシンプルなルーティングを実装
  - `#/` → ホーム（ページ一覧）
  - `#/page/:id` → ページ表示
  - `#/edit/:id` → ページ編集
  - `#/new` → 新規ページ作成
  - `#/admin/*` → 管理ページ
- **コンポーネント移行**:
  - `homePage()`: ページ一覧表示
  - `pageView(id)`: ページ表示、バージョン履歴
  - `pageEditor(id?)`: 新規作成/編集、プレビュー機能
  - `brokenLinksAdmin()`: リンク切れ管理
  - `orphanedPagesAdmin()`: 孤立ページ管理
  - `statsAdmin()`: 統計ダッシュボード
- **グローバルステート**: `Alpine.store('theme')` でダーク/ライトテーマ切り替えを実装
- **APIクライアット**: `getPages()`, `getPage()`, `createPage()`, `updatePage()`, `deletePage()` などのメソッドを追加

**成果**:
- コード量: 26ファイル変更、+1296行/-2366行（約45%削減）
- バンドルサイズ: Alpine.jsは約15KB（Reactは約130KB）
- 型安全性: TypeScript維持、`@types/alpinejs`導入
- 開発体験: モックモード（USE_MOCK=true）でオフライン開発可能

**テスト結果**: ✅
- Vite devサーバー正常起動（http://localhost:3000）
- HTML生成、Alpine.jsディレクティブ適用確認
- TypeScriptコンパイル成功

**Commit**: `a487d23 feat: migrate frontend from React to Alpine.js`

---

## 2026-01-16
- **分散化に向けたプロジェクト初期化**:
    - `gWiki` をスタンドアロンの個人Wikiから **分散型GAS Wiki** へピボットすることを決定。
    - オンデマンドのスクレイピングではなく、「Push/Gossip」アーキテクチャ（Nostr/ActivityPubに触発）を採用。
    - `PLAN.md` にロードマップを策定。
    - `ARCHITECTURE.md` にアーキテクチャ設計を文書化。
    - 進捗を追跡するために本ログを作成。
