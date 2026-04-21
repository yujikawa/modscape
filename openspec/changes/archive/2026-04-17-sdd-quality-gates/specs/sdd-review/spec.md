## ADDED Requirements

### Requirement: /modscape:spec:review で実装前の状態を一覧確認できる
AIスキル `/modscape:spec:review <name>` は `changes/<name>/` の状態を読み込み、未解決質問・仮定・AC カバレッジ・下流分類確信度を集約してサマリー表示しなければならない（SHALL）。

スキルは以下を表示しなければならない（SHALL）:
- `questions.md` の未解決質問（`- [ ]`）の件数と Q-NNN 一覧
- `design.md` 内の仮定（`**仮定:**` または `**Assumption:**` 行）の件数と内容
- `tasks.md` の AC カバレッジ：AC-NNN のうち `[→ AC-NNN]` で紐付いているもの vs 紐付いていないもの vs `[手動検証]` フラグが付いているもの
- 下流分類の確信度が低いテーブル（`design.md` で「分類確度が低い」と注記されているもの）

未解決の問題がある場合は `⚠️` で警告を表示しなければならない（SHALL）。ただし、未解決があっても実装への進行をブロックしてはならない（SHALL NOT）。

スキルは最後に以下の次ステップ案内を必ず表示しなければならない（SHALL）:
```
   → 実装: /modscape:spec:implement <name>
   → 再確認: /modscape:spec:review <name>
```

#### Scenario: 未解決質問がある状態で review を実行する
- **WHEN** `changes/<name>/questions.md` に `- [ ]` 行が存在する状態で `/modscape:spec:review <name>` を実行する
- **THEN** 未解決質問の件数と Q-NNN 一覧が `⚠️` とともに表示され、実装への進行は妨げられない

#### Scenario: AC カバレッジを表示する
- **WHEN** `changes/<name>/spec.md` に `AC-NNN:` 形式の Acceptance Criteria が存在する状態で `/modscape:spec:review <name>` を実行する
- **THEN** 各 AC について「テスト紐付き」「手動検証」「未カバー」のいずれかが表示される

#### Scenario: 問題が何もない場合は OK を表示する
- **WHEN** 未解決質問・仮定・未カバー AC がすべてゼロの状態で `/modscape:spec:review <name>` を実行する
- **THEN** `✅ No open issues. Ready to implement.` と表示される

#### Scenario: changes フォルダが存在しない場合はエラーを表示する
- **WHEN** 存在しない `<name>` で `/modscape:spec:review <name>` を実行する
- **THEN** AIは「`changes/<name>/` not found. Run `/modscape:spec:requirements` to start a new spec.」と案内する
