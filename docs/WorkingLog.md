# 作業ログ

## 2026-01-18

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
(以前の内容)
...
