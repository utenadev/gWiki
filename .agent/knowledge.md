# gWiki3 プロジェクト Knowledge

このファイルには、gWiki3プロジェクトの開発における重要な指示や決定事項を記録します。

## プロジェクト概要

gWiki3は、Google Apps Script (GAS) をバックエンドとし、Google Spreadsheetをデータベースとして使用する、モダンなWikiアプリケーションです。

### 技術スタック

**バックエンド:**
- Google Apps Script (TypeScript)
- Google Spreadsheet (データベース)
- clasp (デプロイツール)

**フロントエンド:**
- React 18
- Vite (ビルドツール)
- TypeScript
- Tailwind CSS
- React Router
- React Markdown

**ビルドツール:**
- Bun (パッケージマネージャー & ビルドツール)

## 開発指針

### 1. 言語使用ルール

- **ユーザーとのやりとり**: 日本語
- **ソースコメント**: 英語
- **コミットメッセージ**: 英語
- **ドキュメント**: 日本語（技術仕様書など）
- **UI/コンテンツ**: 日本語

### 2. プロジェクト構成

```
gWiki3/
├── backend/          # GAS バックエンド (TypeScript)
│   ├── src/
│   │   ├── Code.ts   # メインエントリーポイント
│   │   ├── api.ts    # REST API実装
│   │   └── db.ts     # Spreadsheet操作
│   ├── appsscript.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # React フロントエンド
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── PageCard.tsx
│   │   │   └── WikiContent.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── PageView.tsx
│   │   │   └── PageEditor.tsx
│   │   ├── api.ts
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
├── docs/
│   ├── GAS_SETUP.md
│   ├── TECHNICAL_SPEC.md
│   └── WIKI_LINKS.md
└── README.md
```

### 3. ビルド・デプロイ

**開発サーバー起動:**
```bash
bun run dev
```

**フロントエンドビルド:**
```bash
bun run build
```

**バックエンドデプロイ:**
```bash
cd backend
clasp push
clasp deploy
```

### 4. 実装済み機能

#### 4.1 基本機能
- ✅ ページ一覧表示（カード形式）
- ✅ ページ詳細表示（Markdownレンダリング）
- ✅ ページ作成
- ✅ ページ編集（プレビュー機能付き）
- ✅ ページ削除

#### 4.2 Wikiリンク機能

**記法:**
- `[ページタイトル]` で他のページにリンク

**動作:**
- 存在するページ: 紫色のクリック可能なリンク
- 存在しないページ: 赤色の点線下線（クリック不可）

**実装詳細:**
- `WikiContent.tsx`: Wikiリンク処理コンポーネント
- `api.ts`: `getPageByTitle()` メソッドでページタイトル検索
- `index.css`: Wikiリンクのスタイル定義

**例:**
```markdown
[gWiki3へようこそ]  # 存在するページへのリンク
[未作成ページ]      # 存在しないページへのリンク
```

#### 4.3 デザインシステム

**カラーパレット:**
- Primary: Purple gradient (#667eea → #764ba2)
- Secondary: Pink gradient (#f093fb → #f5576c)
- Accent: Blue gradient (#4facfe → #00f2fe)

**デザイン原則:**
1. Glassmorphism（半透明背景 + ブラー効果）
2. Gradient（鮮やかなグラデーション）
3. Animation（スムーズなトランジション）
4. Typography（Inter フォント使用）

### 5. モックデータ

開発中は `frontend/src/api.ts` の `USE_MOCK = true` でモックデータを使用。

**現在のモックページ:**
1. **gWiki3へようこそ** (ID: 1)
   - アプリケーションの紹介
   - 機能一覧
   - Wikiリンクの例

2. **Markdown ガイド** (ID: 2)
   - Markdown記法の説明
   - コード例
   - Wikiリンクセクション

3. **テストページ** (ID: 3)
   - Wikiリンク機能のデモ
   - 関連ページへのリンク

### 6. 開発環境

- **OS**: Windows 11
- **シェル**: PowerShell
- **Node.js**: Bun使用
- **エディタ**: VSCode推奨

### 7. 重要な注意事項

#### 7.1 Tailwind CSS
- `@tailwind` と `@apply` ディレクティブのlint警告は無視（PostCSSが処理）

#### 7.2 GASデプロイ
- TypeScriptファイルは `clasp push` で自動変換
- Web Appとしてデプロイ後、URLを `frontend/src/api.ts` に設定
- `USE_MOCK = false` に変更して本番API使用

#### 7.3 Wikiリンク
- ページタイトルは大文字小文字を区別
- 正確なタイトルを使用すること
- 日本語タイトルも完全一致が必要

### 8. 今後の拡張予定

1. **検索機能**: ページタイトル・コンテンツの全文検索
2. **カテゴリ・タグ**: ページの分類機能
3. **バージョン履歴**: ページ編集履歴の保存
4. **ユーザー管理**: 複数ユーザーでの編集権限管理
5. **リアルタイム同期**: WebSocketsによるリアルタイム更新
6. **添付ファイル**: Google Driveとの連携
7. **エクスポート**: PDF/HTML形式でのエクスポート
8. **テーマ**: ダーク/ライトモード切り替え
9. **バックリンク**: 現在のページにリンクしている他のページを表示
10. **ページ自動作成**: 赤色リンクをクリックで新規ページ作成画面へ遷移

## トラブルシューティング

### ビルドエラー
- `bun install` で依存関係を再インストール
- `node_modules` を削除して再インストール

### Wikiリンクが機能しない
- ページタイトルの正確性を確認
- ブラウザのコンソールでエラーを確認
- `WikiContent.tsx` の非同期処理を確認

### GASデプロイエラー
- `clasp login` で再認証
- `.clasp.json` の存在を確認
- スクリプトプロパティの設定を確認

## 参考ドキュメント

- [README.md](../README.md): プロジェクト概要とセットアップ
- [docs/GAS_SETUP.md](../docs/GAS_SETUP.md): GASバックエンドのセットアップガイド
- [docs/TECHNICAL_SPEC.md](../docs/TECHNICAL_SPEC.md): 技術仕様書
- [docs/WIKI_LINKS.md](../docs/WIKI_LINKS.md): Wikiリンク機能ガイド

## 変更履歴

### 2025-11-29
- プロジェクト初期セットアップ
- 基本機能実装（CRUD操作）
- Wikiリンク機能実装
- ページ内容の日本語化
- Knowledgeファイル作成
