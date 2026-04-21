## 1. スキーマ・型定義

- [x] 1.1 `visualizer/src/types/schema.ts` に `GlossaryTerm`・`GlossaryYaml` 型を追加する
- [x] 1.2 `visualizer/src/lib/parser.ts` に `parseGlossaryYaml` 関数を追加する

## 2. CLI: init と context export

- [x] 2.1 `src/init.js` の `--sdd` ブロックに `_glossary.yaml` テンプレート生成を追加する
- [x] 2.2 `src/context.js` の `loadContextYaml` で `_glossary.yaml` を読み込み、JSON/MD 出力に `glossary` フィールドを追加する

## 3. Dev サーバー・Build インジェクション

- [x] 3.1 `src/dev.js` に `/api/glossary` エンドポイントを追加する
- [x] 3.2 `src/build.js` で `glossaryData` を `window.__MODSCAPE_DATA__` に注入する

## 4. Zustand ストア

- [x] 4.1 `visualizer/src/store/useStore.ts` に `glossaryData: GlossaryYaml | null` ステートと `setGlossaryData` アクションを追加する
- [x] 4.2 `setCurrentModel` で `/api/glossary` フェッチおよびインジェクトデータからの読み込みを追加する
- [x] 4.3 `App.tsx` の `context-update` WebSocket ハンドラに glossary の再フェッチを追加する

## 5. ContextPanel UI

- [x] 5.1 `ContextPanel.tsx` に `GlossaryCard` コンポーネントを追加する（id・label・definition・tables を表示）
- [x] 5.2 Glossary セクションを ContextPanel に追加する（terms が空の場合は非表示）
- [x] 5.3 検索フォームのフィルタリング対象に glossary（id・label・definition）を追加する

## 6. SDD スキル更新

- [x] 6.1 `src/templates/claude/spec/requirements.md` に「用語登場時に `_glossary.yaml` を確認・更新する」指示を追記する
- [x] 6.2 `src/templates/claude/spec/answer.md` に「回答に用語定義が含まれる場合 `_glossary.yaml` を更新する」指示を追記する
