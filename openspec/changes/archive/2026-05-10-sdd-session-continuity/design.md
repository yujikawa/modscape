## Context

SDDワークフローは複数セッションにまたがることが多いが、チャット履歴以外にセッション状態を永続化する仕組みがない。また `/modscape:spec:status` は現在フェーズと次コマンドを表示するが、「次のアクション」の提示が粗く、未回答の質問・Findingsの有無などの状態が反映されていない。

## Goals / Non-Goals

**Goals:**
- `session.md` による会話状態の明示的保存と翌日再開の支援
- `status` の次アクション提示をより状態に即したものに改善
- 既存スキルへの save ヒント組み込みによる自然なサジェスト

**Non-Goals:**
- チャット履歴の自動保存・自動要約
- セッション状態の自動検出（明示的 save のみ）
- `session.md` のバージョン管理・履歴管理

## Decisions

### 決定1: 保存先は `session.md`（変更ディレクトリ直下）

**採用**: `.modscape/changes/<name>/session.md` に保存する。

**理由**: 変更ディレクトリ内の他アーティファクト（spec.md, design.md 等）と同じ場所に置くことで、status スキルが自然に読み込める。gitで管理されるため、チーム共有も可能。

---

### 決定2: `session.md` のフォーマット

```markdown
## セッション保存 — <name> (<日付>)

### 決定済み事項
- <箇条書き>

### 未解決事項
- <箇条書き>

### 次のアクション
<1行>

### メモ
<自由記述>
```

AIが会話の文脈を読んで各セクションを埋める。`save` は上書き保存（履歴は残さない）。

---

### 決定3: `status` の次アクション判定ロジック（優先順）

以下の優先順で「次にやること」を1つ提示する：

| 優先度 | 条件 | 提示するアクション |
|---|---|---|
| 1 | `design.md` に Findings（Requires Model Change）あり | `/modscape:spec:amend` |
| 2 | `questions.md` に未回答の質問あり | `/modscape:spec:answer` |
| 3 | `spec.md` なし | `/modscape:spec:requirements` |
| 4 | `design.md` なし | `/modscape:spec:design` |
| 5 | `tasks.md` なし | `/modscape:spec:tasks` |
| 6 | 未完了タスクあり | `/modscape:spec:implement` |
| 7 | 全タスク完了 | `/modscape:spec:check` → `/modscape:spec:archive` |

---

### 決定4: save ヒントの組み込み方針

**採用**: 各スキルの出力末尾に固定フレーズとして追加する。

```
---
🔖 作業を中断する場合は `/modscape:spec:save <name>` を実行してください。
```

追加対象スキル: `requirements`, `design`, `implement`, `amend`（会話が続くスキルのみ）。`archive`, `check`, `tasks` は一発完結型なので対象外。

---

### 決定5: 3プラットフォームへの同期

Claude Code が source of truth。Gemini / Codex は Claude 版をベースに以下の差分を適用：
- Gemini: YAMLフロントマター追加、コマンド参照を `@modscape-spec-save` 形式に
- Codex: YAMLフロントマター + `## COMMAND: /modscape:spec:save` セクション追加

## Risks / Trade-offs

- **`session.md` の陳腐化** → 上書き保存なので古い情報が残るリスクあり。`status` 表示時に日付を明示して「古い可能性」を示す。
- **save を忘れる** → スキルへのヒント組み込みで緩和。強制はしない。
