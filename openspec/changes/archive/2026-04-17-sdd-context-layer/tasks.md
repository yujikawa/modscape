## 1. archive スキルの specs 書き込みロジック更新

- [x] 1.1 `src/templates/claude/spec/archive.md` の Step 2（Sync permanent table specs）を `specs/<table-id>/spec.md` ディレクトリ形式に更新する
- [x] 1.2 `src/templates/claude/spec/archive.md` の Step 3（Sync questions.md）を per-table `specs/<table-id>/questions.md` 分割マージに更新する（Pipeline-level は昇格しない）
- [x] 1.3 `src/templates/claude/spec/archive.md` に `_context.yaml` 更新ステップを追加する（last_change・open_questions・has_spec・decisions）
- [x] 1.4 `src/templates/claude/spec/archive.md` に旧フラットファイル（`specs/<id>.md`）の自動マイグレーション処理を追加する
- [x] 1.5 `src/templates/gemini/modscape-spec-archive/SKILL.md` に同じ変更を反映する
- [x] 1.6 `src/templates/codex/modscape-spec-archive/SKILL.md` に同じ変更を反映する

## 2. ビジュアライザー — `_context.yaml` 読み込みと表示

- [x] 2.1 `visualizer/src/lib/parser.ts` に `_context.yaml` の読み込み処理を追加する（`model.yaml` と同ディレクトリから optional で読む）
- [x] 2.2 `visualizer/src/types/schema.ts` に `ContextYaml` 型を追加する（`tables`・`decisions` フィールド）
- [x] 2.3 `visualizer/src/store/useStore.ts` に `contextData` ステートを追加する
- [x] 2.4 `visualizer/src/components/CytoscapeCanvas.tsx` または `TableCard` でテーブルカードに ❓ / 📝 バッジを表示する（`open_questions > 0` / `has_spec: true`）
- [x] 2.5 `visualizer/src/components/DetailPanel.tsx` に `last_change`・`open_questions` 件数の表示を追加する
- [x] 2.6 `visualizer/src/components/RightPanel/` に "Decisions" タブを追加し `decisions` リストを表示する
- [x] 2.7 `npm run build-ui` でビルドが通ることを確認する
- [x] 2.8 `npm run test:update` でビジュアルスナップショットを更新する

## 3. ドキュメント・リリース

- [x] 3.1 `CHANGELOG.md` に変更エントリを追加する
