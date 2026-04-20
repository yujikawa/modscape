## 1. _context.yamlスキーマ再設計

- [x] 1.1 `visualizer/src/types/schema.ts`の`ContextTableEntry`型を削除し、`ContextDecision`に`rationale`フィールドを追加、`affects`フィールドを削除。`ContextQuestion`型を新規追加。`ContextYaml`の`tables`フィールドを削除し`questions`フィールドを追加
- [x] 1.2 `visualizer/src/lib/parser.ts`のcontext YAML parseロジックを新スキーマに合わせて更新（tables正規化の削除）
- [x] 1.3 `src/templates/claude/spec/archive.md`のStep 5（_context.yaml更新ロジック）を新スキーマに合わせて修正（tables.*書き込みをdecisions/questionsのみに変更）

## 2. spec newでの_context.yaml自動生成

- [x] 2.1 `src/index.js`の`spec new`コマンド処理に`.modscape/specs/_context.yaml`が存在しない場合に空テンプレートを生成するロジックを追加
- [x] 2.2 `src/templates/claude/spec/requirements.md`のStep 7（scaffold手順）に`_context.yaml`テンプレート生成の説明を追記

## 3. graph viewのcontext表示削除

- [x] 3.1 `visualizer/src/components/RightPanel/DecisionsTab.tsx`を削除
- [x] 3.2 `visualizer/src/components/RightPanel/RightPanel.tsx`からDecisionsTabのimportとタブ表示ロジックを削除
- [x] 3.3 `visualizer/src/components/DetailPanel.tsx`からrelatedDecisionsロジック、Decisionsタブ定義、❓バッジ表示を削除
- [x] 3.4 `visualizer/src/store/useStore.ts`から`contextData`の読み込みロジック・state・actionsを削除
- [x] 3.5 `npm run build-ui`でビルドが通ることを確認

## 4. `modscape context export`CLIコマンド実装

- [x] 4.1 `src/context.js`を新規作成。`_context.yaml`・全`spec.md`・全`questions.md`を集約するロジックを実装（JSON/MDフォーマット対応）
- [x] 4.2 `src/index.js`に`modscape context export`コマンドを登録
- [x] 4.3 specsディレクトリが存在しない場合・ファイルが一部欠損している場合のエラーハンドリングを実装

## 5. context.html knowledge page実装

- [x] 5.1 `visualizer/vite.config.ts`にマルチエントリーポイントとして`context.html`を追加
- [x] 5.2 `visualizer/context.html`（エントリーHTML）を新規作成
- [x] 5.3 `visualizer/src/context-main.tsx`（エントリーTSX）を新規作成
- [x] 5.4 `visualizer/src/components/KnowledgePage/`ディレクトリを作成し、knowledge pageのルートコンポーネントを実装（decisions・questions・テーブル別spec表示）
- [x] 5.5 `src/dev.js`でdevサーバーが`/context.html`を配信できることを確認・修正
- [x] 5.6 `src/build.js`でbuildコマンドがcontext.htmlを`visualizer-dist/`に含めることを確認・修正
- [x] 5.7 `npm run build-ui`でcontext.htmlが生成されることを確認

## 6. ドキュメント・後処理

- [x] 6.1 `README.md` / `README.ja.md`に`modscape context export`コマンドの説明を追加
- [x] 6.2 `CHANGELOG.md`にこのchangeの内容を追記
- [x] 6.3 `npm run test:update`でE2Eスナップショットを更新・コミット
