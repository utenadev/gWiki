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

### Alpine.jsルーティングのバグ修正

**問題**: Alpine.js移行後、以下の問題が発覚：
- URL `/#/page/1`, `/#/page/2`, `/#/page/3` に遷移しても、常に同じページの内容が表示される
- ナビゲーションリンクをクリックしてもページ遷移しない

**原因調査**:
1. `parseRoute` が先頭の `/` を削除していなかった（`route` が `/page/1` になっていた）
2. `route.match(/^page\//)` がAlpine.jsで期待通りに動作していなかった
3. `<template x-if>` 内の `x-data` コンポーネントは、条件が `true` のままだと再初期化されない
4. `$root.navigate` が関数として認識されていなかった

**修正内容**:
- **`frontend/src/main.ts`**:
  - `parseRoute` で先頭の `/` を削除するように修正
  - route変更時にカスタムイベント `route-change` を発火
  - pageViewで `route-change` イベントを監視し、pageId変更時に `loadPage()` を呼ぶ
  - グローバルな `window.navigate` 関数を追加
- **`frontend/index.html`**:
  - `route.match(/^page\//)` → `route.startsWith('page/')` に変更
  - `route.match(/^(page|edit|admin)\//)` → `startsWith` の連結に変更
  - `$root.navigate()` → `navigate()` に置換（全箇所）

**テスト結果**: ✅
- Page 1, 2, 3 が正しく表示されることを確認
- ナビゲーションリンク（Home, Back, Peers, Stats）が正常に動作

**使用ツール**: agent-browser（ブラウザ自動化ツール）

---

## 2026-01-16
- **分散化に向けたプロジェクト初期化**:
    - `gWiki` をスタンドアロンの個人Wikiから **分散型GAS Wiki** へピボットすることを決定。
    - オンデマンドのスクレイピングではなく、「Push/Gossip」アーキテクチャ（Nostr/ActivityPubに触発）を採用。
    - `PLAN.md` にロードマップを策定。
    - `ARCHITECTURE.md` にアーキテクチャ設計を文書化。
    - 進捗を追跡するために本ログを作成。
